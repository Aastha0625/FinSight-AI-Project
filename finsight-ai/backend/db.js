const sqlite3 = require('sqlite3');
const { open } = require('sqlite');
const path = require('path');

const dbPath = path.join(__dirname, 'database.sqlite');

let dbPromise = null;

async function getDb() {
  if (!dbPromise) {
    dbPromise = open({
      filename: dbPath,
      driver: sqlite3.Database
    }).then(async (db) => {
      // Create tables if they don't exist
      await db.exec(`
        CREATE TABLE IF NOT EXISTS users (
          id TEXT PRIMARY KEY,
          firstName TEXT,
          lastName TEXT,
          email TEXT UNIQUE,
          password TEXT,
          created_at TEXT
        );
        CREATE TABLE IF NOT EXISTS portfolios (
          user_id TEXT PRIMARY KEY,
          summary_json TEXT,
          analytics_json TEXT,
          FOREIGN KEY(user_id) REFERENCES users(id)
        );
        CREATE TABLE IF NOT EXISTS chat_sessions (
          id TEXT PRIMARY KEY,
          user_id TEXT,
          title TEXT,
          updated_at TEXT,
          analytics_json TEXT,
          FOREIGN KEY(user_id) REFERENCES users(id)
        );
        CREATE TABLE IF NOT EXISTS chat_history (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          user_id TEXT,
          session_id TEXT,
          role TEXT,
          content TEXT,
          timestamp TEXT,
          FOREIGN KEY(user_id) REFERENCES users(id),
          FOREIGN KEY(session_id) REFERENCES chat_sessions(id)
        );
      `);

      // Migration: Check if session_id exists in chat_history, if not add it
      const columns = await db.all("PRAGMA table_info(chat_history)");
      const hasSessionId = columns.some(col => col.name === 'session_id');
      if (!hasSessionId) {
        await db.exec('ALTER TABLE chat_history ADD COLUMN session_id TEXT');
      }

      // Migration: Check if analytics_json exists in chat_sessions
      const sessionCols = await db.all("PRAGMA table_info(chat_sessions)");
      const hasAnalytics = sessionCols.some(col => col.name === 'analytics_json');
      if (!hasAnalytics) {
        await db.exec('ALTER TABLE chat_sessions ADD COLUMN analytics_json TEXT');
      }

      return db;
    });
  }
  return dbPromise;
}

async function getUserByEmail(email) {
  const db = await getDb();
  return db.get('SELECT * FROM users WHERE email = ?', [email]);
}

async function createUser(user) {
  const db = await getDb();
  const id = Date.now().toString();
  const created_at = new Date().toISOString();
  await db.run(
    'INSERT INTO users (id, firstName, lastName, email, password, created_at) VALUES (?, ?, ?, ?, ?, ?)',
    [id, user.firstName, user.lastName, user.email, user.password, created_at]
  );
  return { id, ...user, created_at };
}

async function updatePortfolioSummary(userId, summaryJson) {
  const db = await getDb();
  await db.run(`
    INSERT INTO portfolios (user_id, summary_json) VALUES (?, ?)
    ON CONFLICT(user_id) DO UPDATE SET summary_json = excluded.summary_json
  `, [userId, JSON.stringify(summaryJson)]);
}

async function updatePortfolioAnalytics(userId, analyticsJson) {
  const db = await getDb();
  await db.run(`
    INSERT INTO portfolios (user_id, analytics_json) VALUES (?, ?)
    ON CONFLICT(user_id) DO UPDATE SET analytics_json = excluded.analytics_json
  `, [userId, JSON.stringify(analyticsJson)]);
}

async function getPortfolio(userId) {
  const db = await getDb();
  return db.get('SELECT * FROM portfolios WHERE user_id = ?', [userId]);
}

async function createChatSession(userId, title) {
  const db = await getDb();
  const sessionId = Date.now().toString();
  const updatedAt = new Date().toISOString();
  await db.run(
    'INSERT INTO chat_sessions (id, user_id, title, updated_at) VALUES (?, ?, ?, ?)',
    [sessionId, userId, title, updatedAt]
  );
  return { id: sessionId, title, updated_at: updatedAt };
}

async function getChatSessions(userId) {
  const db = await getDb();
  return db.all('SELECT * FROM chat_sessions WHERE user_id = ? ORDER BY updated_at DESC', [userId]);
}

async function getChatSession(sessionId) {
  const db = await getDb();
  return db.get('SELECT * FROM chat_sessions WHERE id = ?', [sessionId]);
}

async function updateChatSessionAnalytics(sessionId, analyticsJson) {
  const db = await getDb();
  await db.run('UPDATE chat_sessions SET analytics_json = ? WHERE id = ?', [analyticsJson, sessionId]);
}

async function addChatMessage(userId, sessionId, role, content) {
  const db = await getDb();
  const timestamp = new Date().toISOString();
  
  await db.run(
    'INSERT INTO chat_history (user_id, session_id, role, content, timestamp) VALUES (?, ?, ?, ?, ?)',
    [userId, sessionId, role, content, timestamp]
  );

  // Update session updated_at
  if (sessionId) {
    await db.run('UPDATE chat_sessions SET updated_at = ? WHERE id = ?', [timestamp, sessionId]);
  }
}

async function getChatHistory(userId, sessionId, limit = 50) {
  const db = await getDb();
  if (sessionId) {
    return db.all('SELECT * FROM chat_history WHERE user_id = ? AND session_id = ? ORDER BY timestamp ASC LIMIT ?', [userId, sessionId, limit]);
  } else {
    // Legacy support for messages without session_id
    return db.all('SELECT * FROM chat_history WHERE user_id = ? AND session_id IS NULL ORDER BY timestamp ASC LIMIT ?', [userId, limit]);
  }
}

async function deleteChatSession(userId, sessionId) {
  const db = await getDb();
  // First delete associated messages
  await db.run('DELETE FROM chat_history WHERE user_id = ? AND session_id = ?', [userId, sessionId]);
  // Then delete the session
  await db.run('DELETE FROM chat_sessions WHERE id = ? AND user_id = ?', [sessionId, userId]);
}

module.exports = {
  getUserByEmail,
  createUser,
  updatePortfolioSummary,
  updatePortfolioAnalytics,
  getPortfolio,
  createChatSession,
  getChatSessions,
  getChatSession,
  updateChatSessionAnalytics,
  addChatMessage,
  getChatHistory,
  deleteChatSession
};
