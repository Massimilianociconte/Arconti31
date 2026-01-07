// Netlify Function per upload immagini su Cloudinary (signed)
// L'API Secret resta sicuro sul server

const https = require('https');
const crypto = require('crypto');

// ==========================================
// TOKEN VERIFICATION (Same as save-data.js)
// ==========================================
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || '';
const TOKEN_SECRET = ADMIN_PASSWORD;

const headers = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Content-Type': 'application/json'
};

function verifyToken(token) {
  if (!token || typeof token !== 'string') return null;

  const parts = token.split('.');
  if (parts.length !== 2) return null;

  const [payloadBase64, signature] = parts;

  // Verify signature
  const expectedSignature = crypto.createHmac('sha256', TOKEN_SECRET).update(payloadBase64).digest('hex');
  if (signature !== expectedSignature) {
    console.log('Token signature mismatch');
    return null;
  }

  // Decode and check expiry
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

exports.handler = async (event, context) => {
  // Handle CORS preflight
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, headers, body: 'Method Not Allowed' };
  }

  // Verifica autenticazione con HMAC
  const { token, file } = JSON.parse(event.body);

  const userEmail = verifyToken(token);
  if (!userEmail) {
    return { statusCode: 401, headers, body: JSON.stringify({ error: 'Token non valido' }) };
  }

  // Cloudinary credentials
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
  const apiKey = process.env.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;

  if (!cloudName || !apiKey || !apiSecret) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Cloudinary non configurato. Aggiungi CLOUDINARY_API_KEY e CLOUDINARY_API_SECRET su Netlify.' })
    };
  }

  try {
    // Generate signature for signed upload
    const timestamp = Math.round(Date.now() / 1000);
    const folder = 'arconti31';

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
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          success: true,
          url: response.body.secure_url,
          public_id: response.body.public_id
        })
      };
    } else {
      return {
        statusCode: response.statusCode,
        body: JSON.stringify({ error: response.body.error?.message || 'Upload failed' })
      };
    }
  } catch (error) {
    console.error('Upload error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message })
    };
  }
};
