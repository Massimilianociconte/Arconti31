// Shared authentication module for Netlify Functions
// Single source of truth for token generation & verification

const crypto = require('crypto');

const ADMIN_EMAIL = process.env.ADMIN_EMAIL || '';
const ADMIN_EMAILS = ADMIN_EMAIL.split(',').map(e => e.toLowerCase().trim()).filter(e => e);
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || '';
const TOKEN_SECRET = ADMIN_PASSWORD;
const TOKEN_EXPIRY_HOURS = 24 * 7; // 7 days

function generateToken(email) {
  const payload = {
    email: email,
    exp: Date.now() + (TOKEN_EXPIRY_HOURS * 60 * 60 * 1000)
  };
  const payloadBase64 = Buffer.from(JSON.stringify(payload)).toString('base64');
  const signature = crypto.createHmac('sha256', TOKEN_SECRET).update(payloadBase64).digest('hex');
  return `${payloadBase64}.${signature}`;
}

function verifyToken(token) {
  if (!token || typeof token !== 'string') return null;

  const parts = token.split('.');
  if (parts.length !== 2) return null;

  const [payloadBase64, signature] = parts;

  const expectedSignature = crypto.createHmac('sha256', TOKEN_SECRET).update(payloadBase64).digest('hex');
  if (signature !== expectedSignature) {
    console.log('Token signature mismatch');
    return null;
  }

  try {
    const payload = JSON.parse(Buffer.from(payloadBase64, 'base64').toString('utf-8'));
    if (payload.exp && payload.exp < Date.now()) {
      console.log('Token expired');
      return null;
    }
    return payload.email;
  } catch (e) {
    console.log('Token parse error:', e.message);
    return null;
  }
}

function verifyLogin(email, password) {
  if (!email || !password) return null;
  const emailLower = email.toLowerCase().trim();
  if (ADMIN_EMAILS.includes(emailLower) && password === ADMIN_PASSWORD) {
    return emailLower;
  }
  return null;
}

module.exports = { generateToken, verifyToken, verifyLogin, ADMIN_EMAILS };
