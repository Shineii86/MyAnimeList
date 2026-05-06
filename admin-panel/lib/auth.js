// Simple auth using HMAC (no external deps needed)
const crypto = require('crypto');

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'anime-admin-2026';
const JWT_SECRET = process.env.JWT_SECRET || crypto.randomBytes(32).toString('hex');
const TOKEN_EXPIRY = 24 * 60 * 60 * 1000; // 24 hours

function createToken() {
  const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');
  const payload = Buffer.from(JSON.stringify({
    authenticated: true,
    iat: Date.now(),
    exp: Date.now() + TOKEN_EXPIRY
  })).toString('base64url');
  
  const signature = crypto
    .createHmac('sha256', JWT_SECRET)
    .update(`${header}.${payload}`)
    .digest('base64url');
  
  return `${header}.${payload}.${signature}`;
}

function verifyToken(token) {
  if (!token) return false;
  
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return false;
    
    const [header, payload, signature] = parts;
    const expectedSig = crypto
      .createHmac('sha256', JWT_SECRET)
      .update(`${header}.${payload}`)
      .digest('base64url');
    
    if (signature !== expectedSig) return false;
    
    const data = JSON.parse(Buffer.from(payload, 'base64url').toString());
    if (data.exp < Date.now()) return false;
    
    return data.authenticated === true;
  } catch {
    return false;
  }
}

function authenticate(password) {
  return password === ADMIN_PASSWORD;
}

// Parse cookie header for token
function getTokenFromCookie(cookieHeader) {
  if (!cookieHeader) return null;
  const match = cookieHeader.match(/auth_token=([^;]+)/);
  return match ? match[1] : null;
}

// Middleware-style auth check
function requireAuth(req) {
  const token = getTokenFromCookie(req.headers.cookie);
  return verifyToken(token);
}

module.exports = { createToken, verifyToken, authenticate, getTokenFromCookie, requireAuth };
