// Netlify Function per upload immagini su Cloudinary (signed)
// L'API Secret resta sicuro sul server

const https = require('https');
const crypto = require('crypto');
const { verifyToken } = require('./auth');

// CORS: allowlist (no * in produzione se origin non matcha)
const BASE_ALLOWED_ORIGINS = [
  'https://arconti31.com',
  'https://www.arconti31.com',
  'https://arconti31.netlify.app',
  'http://localhost:8000',
  'http://localhost:3000'
];

// ~4.5MB stima per length stringa (data URL / base64)
const MAX_FILE_LENGTH = Math.floor(4.5 * 1024 * 1024);

function getAllowedOrigins() {
  const origins = new Set(BASE_ALLOWED_ORIGINS);
  [process.env.URL, process.env.DEPLOY_PRIME_URL, process.env.DEPLOY_URL]
    .filter(Boolean)
    .forEach(u => {
      try {
        origins.add(new URL(u).origin);
      } catch (_) { /* ignore */ }
    });
  (process.env.ALLOWED_ORIGINS || '')
    .split(',')
    .map(s => s.trim())
    .filter(Boolean)
    .forEach(o => origins.add(o.replace(/\/$/, '')));
  return [...origins];
}

function getCorsOrigin(event) {
  const origin = (event.headers && (event.headers.origin || event.headers.Origin)) || '';
  const allowed = getAllowedOrigins();
  if (origin && allowed.includes(origin)) return origin;
  if (origin) console.warn(`[upload-image CORS] Origin non consentito: ${origin}`);
  return null;
}

function getHeaders(event) {
  const headers = {
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Content-Type': 'application/json'
  };
  const cors = getCorsOrigin(event);
  if (cors) headers['Access-Control-Allow-Origin'] = cors;
  return headers;
}

function isValidImagePayload(file) {
  if (typeof file !== 'string' || !file.length) return false;
  // data URL oppure base64 grezzo
  if (file.startsWith('data:')) {
    // data:[mime];base64,<payload>
    const comma = file.indexOf(',');
    if (comma < 0) return false;
    const meta = file.slice(0, comma);
    if (!meta.includes('base64')) return false;
    return true;
  }
  // base64 grezzo: caratteri ammessi
  return /^[A-Za-z0-9+/=\s]+$/.test(file.slice(0, 200));
}

exports.handler = async (event, context) => {
  const headers = getHeaders(event);

  // Handle CORS preflight
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, headers, body: 'Method Not Allowed' };
  }

  let parsed;
  try {
    parsed = JSON.parse(event.body || '{}');
  } catch (e) {
    return {
      statusCode: 400,
      headers,
      body: JSON.stringify({ error: 'JSON non valido' })
    };
  }

  const { token, file } = parsed;

  const userEmail = verifyToken(token);
  if (!userEmail) {
    return { statusCode: 401, headers, body: JSON.stringify({ error: 'Token non valido' }) };
  }

  if (!isValidImagePayload(file)) {
    return {
      statusCode: 400,
      headers,
      body: JSON.stringify({ error: 'File non valido: attendi data URL o base64' })
    };
  }

  if (file.length > MAX_FILE_LENGTH) {
    return {
      statusCode: 413,
      headers,
      body: JSON.stringify({ error: 'File troppo grande (max ~4.5MB)' })
    };
  }

  // Cloudinary credentials
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
  const apiKey = process.env.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;
  const folder = process.env.CLOUDINARY_FOLDER || 'arconti31';

  if (!cloudName || !apiKey || !apiSecret) {
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        error: 'Cloudinary non configurato. Aggiungi CLOUDINARY_API_KEY e CLOUDINARY_API_SECRET su Netlify.'
      })
    };
  }

  try {
    // Generate signature for signed upload
    const timestamp = Math.round(Date.now() / 1000);

    // Create signature string (parameters must be in alphabetical order)
    const signatureString = `folder=${folder}&timestamp=${timestamp}${apiSecret}`;
    const signature = crypto.createHash('sha1').update(signatureString).digest('hex');

    // Upload to Cloudinary using multipart form
    const boundary = '----CloudinaryBoundary' + Date.now();

    const parts = [];
    parts.push(`--${boundary}\r\nContent-Disposition: form-data; name="file"\r\n\r\n${file}\r\n`);
    parts.push(`--${boundary}\r\nContent-Disposition: form-data; name="api_key"\r\n\r\n${apiKey}\r\n`);
    parts.push(`--${boundary}\r\nContent-Disposition: form-data; name="timestamp"\r\n\r\n${timestamp}\r\n`);
    parts.push(`--${boundary}\r\nContent-Disposition: form-data; name="signature"\r\n\r\n${signature}\r\n`);
    parts.push(`--${boundary}\r\nContent-Disposition: form-data; name="folder"\r\n\r\n${folder}\r\n`);
    parts.push(`--${boundary}--\r\n`);

    const body = parts.join('');

    const response = await new Promise((resolve, reject) => {
      const req = https.request({
        hostname: 'api.cloudinary.com',
        path: `/v1_1/${cloudName}/image/upload`,
        method: 'POST',
        headers: {
          'Content-Type': `multipart/form-data; boundary=${boundary}`,
          'Content-Length': Buffer.byteLength(body)
        }
      }, (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
          try {
            resolve({ statusCode: res.statusCode, body: JSON.parse(data) });
          } catch (e) {
            resolve({ statusCode: res.statusCode, body: { error: { message: data } } });
          }
        });
      });

      req.on('error', reject);
      req.write(body);
      req.end();
    });

    if (response.statusCode >= 200 && response.statusCode < 300) {
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          success: true,
          url: response.body.secure_url,
          public_id: response.body.public_id
        })
      };
    } else {
      return {
        statusCode: response.statusCode,
        headers,
        body: JSON.stringify({ error: response.body.error?.message || 'Upload failed' })
      };
    }
  } catch (error) {
    console.error('Upload error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: error.message })
    };
  }
};
