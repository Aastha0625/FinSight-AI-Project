require('dotenv').config();

const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const rateLimit = require('express-rate-limit');
const { z } = require('zod');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const winston = require('winston');
const morgan = require('morgan');
const db = require('./db');
const { verifyToken, JWT_SECRET } = require('./middleware/auth');
const { runAgent } = require('./agent/orchestrator');
const { extractSummary } = require('./agent/extractor');

const app = express();
const PORT = process.env.PORT || 5000;

// ── Logger ──────────────────────────────────────────────────────────────────
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      )
    })
  ]
});

// ── Middleware ──────────────────────────────────────────────────────────────
const allowedOrigins = ['http://localhost:5173', 'http://localhost:5174', 'http://127.0.0.1:5173', 'http://127.0.0.1:5174'];
if (process.env.FRONTEND_URL) {
  // Strip trailing slash if the user accidentally added one in the Render dashboard
  allowedOrigins.push(process.env.FRONTEND_URL.replace(/\/$/, ''));
}

const corsOptions = {
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.includes(origin) || process.env.NODE_ENV !== 'production') {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],
  credentials: true,
};

app.use(cors(corsOptions));

app.use(cookieParser());
app.use(express.json({ limit: '2mb' }));
app.use(morgan('combined', { stream: { write: message => logger.info(message.trim()) } }));

// ── Rate Limiting ───────────────────────────────────────────────────────────
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 150, // limit each IP to 150 requests per windowMs
  message: { error: 'Too many requests from this IP, please try again after 15 minutes' }
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: { error: 'Too many authentication attempts, please try again later' }
});

app.use('/api/', apiLimiter);

// ── GET /api/health ─────────────────────────────────────────────────────────
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'FinSight AI running' });
});

// ── Zod Schemas ─────────────────────────────────────────────────────────────
const registerSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters")
});

const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required")
});

// ── POST /api/auth/register ────────────────────────────────────────────────
app.post('/api/auth/register', authLimiter, async (req, res) => {
  try {
    const parsed = registerSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: parsed.error.issues && parsed.error.issues.length > 0 ? parsed.error.issues[0].message : 'Invalid input' });
    }
    const { name, email, password } = parsed.data;

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
    const accessToken = jwt.sign({ id: newUser.id, email: newUser.email }, JWT_SECRET, { expiresIn: '15m' });
    const refreshToken = crypto.randomBytes(40).toString('hex');
    const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days
    
    await db.saveRefreshToken(refreshToken, newUser.id, expiresAt);
    
    res.cookie('accessToken', accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'strict',
      maxAge: 15 * 60 * 1000 // 15 mins
    });

    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'strict',
      maxAge: 30 * 24 * 60 * 60 * 1000 // 30 days
    });

    res.status(201).json({ user: { id: newUser.id, firstName: newUser.firstName, email: newUser.email } });
  } catch (err) {
    logger.error(`Registration error: ${err.message}`, { stack: err.stack });
    res.status(500).json({ error: 'Server error during registration.' });
  }
});

// ── POST /api/auth/login ───────────────────────────────────────────────────
app.post('/api/auth/login', authLimiter, async (req, res) => {
  try {
    const parsed = loginSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: parsed.error.issues && parsed.error.issues.length > 0 ? parsed.error.issues[0].message : 'Invalid credentials' });
    }
    const { email, password } = parsed.data;

    const user = await db.getUserByEmail(email);
    if (!user) {
      return res.status(400).json({ error: 'Invalid email or password.' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ error: 'Invalid email or password.' });
    }

    const accessToken = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET, { expiresIn: '15m' });
    const refreshToken = crypto.randomBytes(40).toString('hex');
    const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days
    
    await db.saveRefreshToken(refreshToken, user.id, expiresAt);
    
    res.cookie('accessToken', accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'strict',
      maxAge: 15 * 60 * 1000 // 15 mins
    });

    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'strict',
      maxAge: 30 * 24 * 60 * 60 * 1000 // 30 days
    });

    res.json({ user: { id: user.id, firstName: user.firstName, email: user.email } });
  } catch (err) {
    logger.error(`Login error: ${err.message}`, { stack: err.stack });
    res.status(500).json({ error: 'Server error during login.' });
  }
});

// ── POST /api/auth/logout ──────────────────────────────────────────────────
app.post('/api/auth/logout', async (req, res) => {
  if (req.cookies?.refreshToken) {
    await db.deleteRefreshToken(req.cookies.refreshToken).catch(() => {});
  }
  const cookieOptions = {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'strict'
  };
  res.clearCookie('accessToken', cookieOptions);
  res.clearCookie('refreshToken', cookieOptions);
  res.json({ success: true });
});

// ── GET /api/auth/me ───────────────────────────────────────────────────────
app.get('/api/auth/me', verifyToken, async (req, res) => {
  try {
    const user = await db.getUserByEmail(req.user.email);
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json({ user: { id: user.id, firstName: user.firstName, email: user.email } });
  } catch (err) {
    logger.error(`Me error: ${err.message}`, { stack: err.stack });
    res.status(500).json({ error: 'Server error fetching user.' });
  }
});

// ── PUT /api/user/profile ──────────────────────────────────────────────────
app.put('/api/user/profile', verifyToken, async (req, res) => {
  try {
    const { firstName, lastName, email, password } = req.body;
    const updates = {};
    
    if (firstName) updates.firstName = firstName;
    if (lastName !== undefined) updates.lastName = lastName;
    
    if (email) {
      const existing = await db.getUserByEmail(email);
      if (existing && existing.id !== req.user.id) {
        return res.status(400).json({ error: 'Email already in use.' });
      }
      updates.email = email;
    }
    
    if (password) {
      if (password.length < 8) return res.status(400).json({ error: 'Password must be at least 8 characters' });
      const salt = await bcrypt.genSalt(10);
      updates.password = await bcrypt.hash(password, salt);
    }
    
    await db.updateUser(req.user.id, updates);
    
    // Return updated user
    const dbUser = await db.getUserByEmail(email || req.user.email);
    res.json({ user: { id: dbUser.id, firstName: dbUser.firstName, email: dbUser.email } });
  } catch (err) {
    logger.error(`Profile update error: ${err.message}`);
    res.status(500).json({ error: 'Failed to update profile' });
  }
});

// ── DELETE /api/user ───────────────────────────────────────────────────────
app.delete('/api/user', verifyToken, async (req, res) => {
  try {
    await db.deleteUser(req.user.id);
    res.clearCookie('accessToken');
    res.clearCookie('refreshToken');
    res.json({ success: true });
  } catch (err) {
    logger.error(`User deletion error: ${err.message}`);
    res.status(500).json({ error: 'Failed to delete user' });
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
    logger.error(`Error: ${err.message}`, { stack: err.stack });(err);
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
    logger.error(`Error: ${err.message}`, { stack: err.stack });(err);
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
    logger.error(`Error: ${err.message}`, { stack: err.stack });(err);
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
    logger.error(`Error: ${err.message}`, { stack: err.stack });(err);
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
    logger.error(`Error: ${err.message}`, { stack: err.stack });(err);
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
    logger.error(`Error: ${err.message}`, { stack: err.stack });(err);
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

    // Setup SSE headers
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    // Send initial session ID chunk so frontend can update URL immediately if needed
    res.write(`data: ${JSON.stringify({ type: 'session', sessionId })}\n\n`);

    // Run agent with streaming callback
    const result = await runAgent({
      userQuestion: userQuestion.trim(),
      documentContext: documentContext.trim(),
      conversationHistory,
      onContent: (chunk) => {
        if (chunk) {
          res.write(`data: ${JSON.stringify({ type: 'content', content: chunk })}\n\n`);
        }
      }
    });

    // Save final AI message to DB
    await db.addChatMessage(userId, sessionId, 'assistant', result.answer);

    // Send final payload with tools used
    res.write(`data: ${JSON.stringify({ type: 'done', answer: result.answer, toolsUsed: result.toolsUsed, sessionId })}\n\n`);
    res.end();
  } catch (err) {
    logger.error(`Error: ${err.message}`, { stack: err.stack });('[/api/chat] Error:', err.message || err);
    if (!res.headersSent) {
      res.status(500).json({ error: 'Internal server error. The AI agent encountered a problem.' });
    } else {
      res.write(`data: ${JSON.stringify({ type: 'error', error: 'Internal server error' })}\n\n`);
      res.end();
    }
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
    logger.error(`Error: ${err.message}`, { stack: err.stack });('[/api/extract-summary] Error:', err.message || err);
    res.status(500).json({ error: 'Failed to extract summary' });
  }
});

// ── Global Error Handler ────────────────────────────────────────────────────
app.use((err, req, res, next) => {
  logger.error(`Unhandled exception: ${err.message}`, { stack: err.stack });
  if (!res.headersSent) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ── Start ───────────────────────────────────────────────────────────────────
app.listen(PORT, () => {
  logger.info(`✅ FinSight AI backend running on http://localhost:${PORT}`);
  logger.info(`   Health check → http://localhost:${PORT}/api/health`);
});
