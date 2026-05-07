const { authenticate, createToken } = require('../../lib/auth');
const { addEntry } = require('../../lib/activity-log');

// Simple in-memory rate limiter for login attempts
// NOTE: On Vercel (serverless), this resets per cold start.
// For production, consider Vercel KV or Upstash Redis for persistent rate limiting.
const loginAttempts = new Map(); // IP -> { count, firstAttempt }
const MAX_ATTEMPTS = 5;
const WINDOW_MS = 15 * 60 * 1000; // 15 minutes

function checkRateLimit(ip) {
  const now = Date.now();
  const entry = loginAttempts.get(ip);
  if (!entry) return true;
  if (now - entry.firstAttempt > WINDOW_MS) {
    loginAttempts.delete(ip);
    return true;
  }
  return entry.count < MAX_ATTEMPTS;
}

function recordAttempt(ip) {
  const now = Date.now();
  const entry = loginAttempts.get(ip);
  if (!entry || now - entry.firstAttempt > WINDOW_MS) {
    loginAttempts.set(ip, { count: 1, firstAttempt: now });
  } else {
    entry.count++;
  }
}

export default function handler(req, res) {
  try {
    // GET: check if password is configured
    if (req.method === 'GET') {
      const hasPassword = !!process.env.ADMIN_PASSWORD;
      return res.status(200).json({ configured: hasPassword, noPassword: !hasPassword });
    }

    if (req.method !== 'POST') {
      return res.status(405).json({ error: 'Method not allowed' });
    }

    const ip = req.headers['x-forwarded-for'] || req.socket?.remoteAddress || 'unknown';

    if (!checkRateLimit(ip)) {
      return res.status(429).json({ error: 'Too many login attempts. Try again in 15 minutes.' });
    }

    const { password } = req.body;

    if (!password) {
      return res.status(400).json({ error: 'Password required' });
    }

    if (!authenticate(password)) {
      recordAttempt(ip);
      addEntry({ action: 'login', target: 'Admin Panel', details: 'Failed login attempt' });
      return res.status(401).json({ error: 'Invalid password' });
    }

    // Clear attempts on successful login
    loginAttempts.delete(ip);

    const token = createToken();
    const isProduction = process.env.VERCEL || process.env.NODE_ENV === 'production';
    const cookieParts = [
      `auth_token=${token}`,
      'HttpOnly',
      'Path=/',
      `Max-Age=${24 * 60 * 60}`,
      'SameSite=Strict'
    ];
    if (isProduction) cookieParts.push('Secure');
    
    res.setHeader('Set-Cookie', cookieParts.join('; '));
    
    addEntry({ action: 'login', target: 'Admin Panel', details: 'Successful login' });

    return res.status(200).json({ success: true, message: 'Authenticated' });
  } catch (err) {
    return res.status(500).json({ error: 'Internal server error' });
  }
}
