const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

let isInitialized = false;

async function getDb() {
  if (!isInitialized) {
    try {
      // Create tables if they don't exist
      await pool.query(`
        CREATE TABLE IF NOT EXISTS users (
          id TEXT PRIMARY KEY,
          "firstName" TEXT,
          "lastName" TEXT,
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
          id SERIAL PRIMARY KEY,
          user_id TEXT,
          session_id TEXT,
          role TEXT,
          content TEXT,
          timestamp TEXT,
          FOREIGN KEY(user_id) REFERENCES users(id),
          FOREIGN KEY(session_id) REFERENCES chat_sessions(id)
        );
        CREATE TABLE IF NOT EXISTS refresh_tokens (
          token TEXT PRIMARY KEY,
          user_id TEXT,
          expires_at TIMESTAMP,
          FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
        );
      `);

      isInitialized = true;
    } catch (err) {
      console.error("Database initialization failed:", err);
      throw err;
    }
  }
  return pool;
}

// Call getDb once to initialize tables on startup
getDb().catch(console.error);

async function getUserByEmail(email) {
  const db = await getDb();
  const res = await db.query('SELECT * FROM users WHERE email = $1', [email]);
  return res.rows[0];
}

async function createUser(user) {
  const db = await getDb();
  const id = Date.now().toString();
  const created_at = new Date().toISOString();
  await db.query(
    'INSERT INTO users (id, "firstName", "lastName", email, password, created_at) VALUES ($1, $2, $3, $4, $5, $6)',
    [id, user.firstName, user.lastName, user.email, user.password, created_at]
  );
  return { id, ...user, created_at };
}

async function updateUser(userId, data) {
  const db = await getDb();
  const updates = [];
  const values = [userId];
  let paramIdx = 2;
  
  if (data.firstName !== undefined) {
    updates.push(`"firstName" = $${paramIdx++}`);
    values.push(data.firstName);
  }
  if (data.lastName !== undefined) {
    updates.push(`"lastName" = $${paramIdx++}`);
    values.push(data.lastName);
  }
  if (data.email !== undefined) {
    updates.push(`email = $${paramIdx++}`);
    values.push(data.email);
  }
  if (data.password !== undefined) {
    updates.push(`password = $${paramIdx++}`);
    values.push(data.password);
  }

  if (updates.length > 0) {
    await db.query(`UPDATE users SET ${updates.join(', ')} WHERE id = $1`, values);
  }
}

async function deleteUser(userId) {
  const db = await getDb();
  await db.query('DELETE FROM chat_history WHERE user_id = $1', [userId]);
  await db.query('DELETE FROM chat_sessions WHERE user_id = $1', [userId]);
  await db.query('DELETE FROM portfolios WHERE user_id = $1', [userId]);
  await db.query('DELETE FROM refresh_tokens WHERE user_id = $1', [userId]);
  await db.query('DELETE FROM users WHERE id = $1', [userId]);
}

async function updatePortfolioSummary(userId, summaryJson) {
  const db = await getDb();
  await db.query(`
    INSERT INTO portfolios (user_id, summary_json) VALUES ($1, $2)
    ON CONFLICT(user_id) DO UPDATE SET summary_json = excluded.summary_json
  `, [userId, JSON.stringify(summaryJson)]);
}

async function updatePortfolioAnalytics(userId, analyticsJson) {
  const db = await getDb();
  await db.query(`
    INSERT INTO portfolios (user_id, analytics_json) VALUES ($1, $2)
    ON CONFLICT(user_id) DO UPDATE SET analytics_json = excluded.analytics_json
  `, [userId, JSON.stringify(analyticsJson)]);
}

async function getPortfolio(userId) {
  const db = await getDb();
  const res = await db.query('SELECT * FROM portfolios WHERE user_id = $1', [userId]);
  return res.rows[0];
}

async function createChatSession(userId, title) {
  const db = await getDb();
  const sessionId = Date.now().toString();
  const updatedAt = new Date().toISOString();
  await db.query(
    'INSERT INTO chat_sessions (id, user_id, title, updated_at) VALUES ($1, $2, $3, $4)',
    [sessionId, userId, title, updatedAt]
  );
  return { id: sessionId, title, updated_at: updatedAt };
}

async function getChatSessions(userId) {
  const db = await getDb();
  const res = await db.query('SELECT * FROM chat_sessions WHERE user_id = $1 ORDER BY updated_at DESC', [userId]);
  return res.rows;
}

async function getChatSession(sessionId) {
  const db = await getDb();
  const res = await db.query('SELECT * FROM chat_sessions WHERE id = $1', [sessionId]);
  return res.rows[0];
}

async function updateChatSessionAnalytics(sessionId, analyticsJson) {
  const db = await getDb();
  await db.query('UPDATE chat_sessions SET analytics_json = $1 WHERE id = $2', [analyticsJson, sessionId]);
}

async function addChatMessage(userId, sessionId, role, content) {
  const db = await getDb();
  const timestamp = new Date().toISOString();
  
  await db.query(
    'INSERT INTO chat_history (user_id, session_id, role, content, timestamp) VALUES ($1, $2, $3, $4, $5)',
    [userId, sessionId, role, content, timestamp]
  );

  // Update session updated_at
  if (sessionId) {
    await db.query('UPDATE chat_sessions SET updated_at = $1 WHERE id = $2', [timestamp, sessionId]);
  }
}

async function getChatHistory(userId, sessionId, limit = 50) {
  const db = await getDb();
  if (sessionId) {
    const res = await db.query('SELECT * FROM chat_history WHERE user_id = $1 AND session_id = $2 ORDER BY timestamp ASC LIMIT $3', [userId, sessionId, limit]);
    return res.rows;
  } else {
    // Legacy support for messages without session_id
    const res = await db.query('SELECT * FROM chat_history WHERE user_id = $1 AND session_id IS NULL ORDER BY timestamp ASC LIMIT $2', [userId, limit]);
    return res.rows;
  }
}

async function deleteChatSession(userId, sessionId) {
  const db = await getDb();
  // First delete associated messages
  await db.query('DELETE FROM chat_history WHERE user_id = $1 AND session_id = $2', [userId, sessionId]);
  // Then delete the session
  await db.query('DELETE FROM chat_sessions WHERE id = $1 AND user_id = $2', [sessionId, userId]);
}

async function saveRefreshToken(token, userId, expiresAt) {
  const db = await getDb();
  await db.query(
    'INSERT INTO refresh_tokens (token, user_id, expires_at) VALUES ($1, $2, $3)',
    [token, userId, expiresAt]
  );
}

async function getRefreshToken(token) {
  const db = await getDb();
  const res = await db.query('SELECT * FROM refresh_tokens WHERE token = $1', [token]);
  return res.rows[0];
}

async function deleteRefreshToken(token) {
  const db = await getDb();
  await db.query('DELETE FROM refresh_tokens WHERE token = $1', [token]);
}

async function deleteRefreshTokensForUser(userId) {
  const db = await getDb();
  await db.query('DELETE FROM refresh_tokens WHERE user_id = $1', [userId]);
}

async function clearUserSummary(userId) {
  const db = await getDb();
  await db.query('UPDATE user_profiles SET financial_summary = NULL WHERE user_id = $1', [userId]);
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
  deleteChatSession,
  saveRefreshToken,
  getRefreshToken,
  deleteRefreshToken,
  deleteRefreshTokensForUser,
  updateUser,
  deleteUser,
  clearUserSummary
};
