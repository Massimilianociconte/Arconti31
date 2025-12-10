// Netlify Function per upload immagini su Cloudinary (signed)
// L'API Secret resta sicuro sul server

const https = require('https');
const crypto = require('crypto');

exports.handler = async (event, context) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  // Verifica autenticazione
  const { token, file } = JSON.parse(event.body);
  
  if (!token) {
    return { statusCode: 401, body: JSON.stringify({ error: 'Non autenticato' }) };
  }

  // Validate token
  try {
    const decoded = Buffer.from(token, 'base64').toString('utf-8');
    const [tokenEmail] = decoded.split(':');
    const validEmail = process.env.ADMIN_EMAIL || 'admin@arconti31.com';
    if (tokenEmail !== validEmail) {
      return { statusCode: 401, body: JSON.stringify({ error: 'Token non valido' }) };
    }
  } catch (e) {
    return { statusCode: 401, body: JSON.stringify({ error: 'Token non valido' }) };
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
    
    // Create signature string
    const signatureString = `folder=${folder}&timestamp=${timestamp}${apiSecret}`;
    const signature = crypto.createHash('sha1').update(signatureString).digest('hex');

    // Upload to Cloudinary
    const formData = new URLSearchParams();
    formData.append('file', file);
    formData.append('api_key', apiKey);
    formData.append('timestamp', timestamp);
    formData.append('signature', signature);
    formData.append('folder', folder);

    const response = await new Promise((resolve, reject) => {
      const req = https.request({
        hostname: 'api.cloudinary.com',
        path: `/v1_1/${cloudName}/image/upload`,
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Content-Length': Buffer.byteLength(formData.toString())
        }
      }, (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
          try {
            resolve({ statusCode: res.statusCode, body: JSON.parse(data) });
          } catch (e) {
            resolve({ statusCode: res.statusCode, body: data });
          }
        });
      });

      req.on('error', reject);
      req.write(formData.toString());
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
