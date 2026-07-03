require('dotenv').config();

const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('./db');
const { verifyToken, JWT_SECRET } = require('./middleware/auth');
const { runAgent } = require('./agent/orchestrator');
const { extractSummary } = require('./agent/extractor');

const app = express();
const PORT = process.env.PORT || 5000;

// ── Middleware ──────────────────────────────────────────────────────────────
app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:5174'],
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

app.use(express.json({ limit: '2mb' }));

// ── GET /api/health ─────────────────────────────────────────────────────────
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'FinSight AI running' });
});

// ── POST /api/auth/register ────────────────────────────────────────────────
app.post('/api/auth/register', async (req, res) => {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ error: 'Name, email, and password are required.' });
    }

    const existingUser = await db.getUserByEmail(email);
    if (existingUser) {
      return res.status(400).json({ error: 'User already exists with this email.' });
    }

    const salt = await bcrypt.genSalt(10);
    const password_hash = await bcrypt.hash(password, salt);
    
    // Split name into first and last
    const parts = name.split(' ');
    const firstName = parts[0];
    const lastName = parts.slice(1).join(' ');

    const newUser = await db.createUser({ firstName, lastName, email, password: password_hash });
    const token = jwt.sign({ id: newUser.id, email: newUser.email }, JWT_SECRET, { expiresIn: '7d' });
    
    res.status(201).json({ token, user: { id: newUser.id, firstName: newUser.firstName, email: newUser.email } });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error during registration.' });
  }
});

// ── POST /api/auth/login ───────────────────────────────────────────────────
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required.' });
    }

    const user = await db.getUserByEmail(email);
    if (!user) {
      return res.status(400).json({ error: 'Invalid email or password.' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ error: 'Invalid email or password.' });
    }

    const token = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET, { expiresIn: '7d' });
    res.json({ token, user: { id: user.id, firstName: user.firstName, email: user.email } });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error during login.' });
  }
});

// ── GET /api/user-data ─────────────────────────────────────────────────────
app.get('/api/user-data', verifyToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const portfolio = await db.getPortfolio(userId);
    const chatHistory = await db.getChatHistory(userId, null, 50); // null sessionId gets legacy history

    let summary = null;
    let analytics = null;
    if (portfolio) {
      if (portfolio.summary_json) summary = JSON.parse(portfolio.summary_json);
      if (portfolio.analytics_json) analytics = JSON.parse(portfolio.analytics_json);
    }

    res.json({ summary, analytics, chatHistory });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error fetching user data.' });
  }
});

// ── POST /api/sync-data ────────────────────────────────────────────────────
app.post('/api/sync-data', verifyToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const { summary, analytics } = req.body;
    
    if (summary) await db.updatePortfolioSummary(userId, summary);
    if (analytics) await db.updatePortfolioAnalytics(userId, analytics);
    
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error syncing data.' });
  }
});

// ── GET /api/chat-sessions ───────────────────────────────────────────────────
app.get('/api/chat-sessions', verifyToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const sessions = await db.getChatSessions(userId);
    res.json(sessions);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error fetching chat sessions.' });
  }
});

// ── GET /api/chat-sessions/:id ──────────────────────────────────────────────
app.get('/api/chat-sessions/:id', verifyToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const sessionId = req.params.id;
    const history = await db.getChatHistory(userId, sessionId, 100);
    const session = await db.getChatSession(sessionId);
    
    let analytics = null;
    if (session && session.analytics_json) {
      analytics = JSON.parse(session.analytics_json);
    }
    
    res.json({ history, analytics });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error fetching session history.' });
  }
});

// ── DELETE /api/chat-sessions/:id ───────────────────────────────────────────
app.delete('/api/chat-sessions/:id', verifyToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const sessionId = req.params.id;
    await db.deleteChatSession(userId, sessionId);
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error deleting chat session.' });
  }
});

// ── POST /api/chat-sessions/:id/analytics ───────────────────────────────────
app.post('/api/chat-sessions/:id/analytics', verifyToken, async (req, res) => {
  try {
    const sessionId = req.params.id;
    const { analytics } = req.body;
    await db.updateChatSessionAnalytics(sessionId, JSON.stringify(analytics));
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error saving session analytics.' });
  }
});

// ── POST /api/chat ──────────────────────────────────────────────────────────
app.post('/api/chat', verifyToken, async (req, res) => {
  try {
    const userId = req.user.id;
    let { userQuestion, documentContext, conversationHistory = [], sessionId } = req.body;

    if (!userQuestion || typeof userQuestion !== 'string' || !userQuestion.trim()) {
      return res.status(400).json({ error: 'userQuestion is required and must be a non-empty string.' });
    }
    if (!documentContext || typeof documentContext !== 'string' || !documentContext.trim()) {
      return res.status(400).json({ error: 'documentContext is required and must be a non-empty string.' });
    }

    // Create session if it doesn't exist
    if (!sessionId) {
      const title = userQuestion.length > 30 ? userQuestion.substring(0, 30) + '...' : userQuestion;
      const session = await db.createChatSession(userId, title);
      sessionId = session.id;
    }

    // Save user message to DB
    await db.addChatMessage(userId, sessionId, 'user', userQuestion);

    // Run agent - expecting { answer, toolsUsed }
    const result = await runAgent({
      userQuestion: userQuestion.trim(),
      documentContext: documentContext.trim(),
      conversationHistory,
    });

    // Save AI message to DB
    await db.addChatMessage(userId, sessionId, 'assistant', result.answer);

    res.json({ ...result, sessionId });
  } catch (err) {
    console.error('[/api/chat] Error:', err.message || err);
    res.status(500).json({
      error: 'Internal server error. The AI agent encountered a problem.',
      details: err.message || 'Unknown error',
    });
  }
});

// ── POST /api/extract-summary ──────────────────────────────────────────────
app.post('/api/extract-summary', verifyToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const { documentContext } = req.body;
    if (!documentContext || typeof documentContext !== 'string' || !documentContext.trim()) {
      return res.status(400).json({ error: 'documentContext is required and must be a non-empty string.' });
    }

    const summary = await extractSummary(documentContext);
    
    // Save to DB
    await db.updatePortfolioSummary(userId, summary);
    
    res.json(summary);
  } catch (err) {
    console.error('[/api/extract-summary] Error:', err.message || err);
    res.status(500).json({ error: 'Failed to extract summary' });
  }
});

// ── Start ───────────────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`✅ FinSight AI backend running on http://localhost:${PORT}`);
  console.log(`   Health check → http://localhost:${PORT}/api/health`);
});
