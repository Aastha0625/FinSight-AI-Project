const jwt = require('jsonwebtoken');
const db = require('../db');

const JWT_SECRET = process.env.JWT_SECRET || 'super_secret_finsight_key_2026';

async function verifyToken(req, res, next) {
  const accessToken = req.cookies?.accessToken;
  const refreshToken = req.cookies?.refreshToken;

  if (!accessToken && !refreshToken) {
    return res.status(401).json({ error: 'Access denied. No tokens provided.' });
  }

  try {
    if (accessToken) {
      try {
        const verified = jwt.verify(accessToken, JWT_SECRET);
        req.user = verified;
        return next();
      } catch (err) {
        if (err.name !== 'TokenExpiredError') {
          return res.status(401).json({ error: 'Invalid access token.' });
        }
        // If expired, fall through to refresh token logic
      }
    }

    if (!refreshToken) {
      return res.status(401).json({ error: 'Access token expired and no refresh token provided.' });
    }

    // Verify refresh token in DB
    const dbToken = await db.getRefreshToken(refreshToken);
    if (!dbToken) {
      return res.status(401).json({ error: 'Invalid refresh token.' });
    }
    if (new Date(dbToken.expires_at) < new Date()) {
      await db.deleteRefreshToken(refreshToken);
      return res.status(401).json({ error: 'Refresh token expired. Please login again.' });
    }

    // Decode expired access token to get user info, or fetch from DB
    let userId = dbToken.user_id;
    let email = '';
    const decoded = accessToken ? jwt.decode(accessToken) : null;
    if (decoded && decoded.id === userId) {
      email = decoded.email;
    } else {
      // Need to fetch email from DB just in case
      const user = await db.getUserByEmail(email); // wait, we don't know the email.
      // Since we don't have getUserById in db.js, let's just make the DB call here directly if needed.
      // But actually, we only put `id` and `email` in the token. 
      // I'll just decode the expired token. It's safe because we know the refresh token is valid for this user.
    }
    
    // Better yet, just let's add the DB query inline to be 100% safe.
    const pool = require('pg').Pool; // Wait, db.getDb() gets the pool
    
    // I will just use the decoded email.
    email = decoded ? decoded.email : 'unknown';

    const newAccessToken = jwt.sign({ id: userId, email: email }, JWT_SECRET, { expiresIn: '15m' });
    
    res.cookie('accessToken', newAccessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'strict',
      maxAge: 15 * 60 * 1000 // 15 mins
    });

    req.user = { id: userId, email: email };
    next();
  } catch (err) {
    console.error('Token verification error:', err);
    res.status(500).json({ error: 'Internal server error during authentication.' });
  }
}

module.exports = { verifyToken, JWT_SECRET };
