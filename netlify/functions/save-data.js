// Netlify Function per salvare i dati
// Usa GitHub API con un Personal Access Token (PAT) salvato come variabile d'ambiente

const https = require('https');

exports.handler = async (event, context) => {
  // Solo POST
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  const body = JSON.parse(event.body);
  const { email, password, action, collection, filename, data, sha, token } = body;
  
  // Return Cloudinary config (no auth needed)
  if (action === 'get-cloudinary-config') {
    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        cloudName: process.env.CLOUDINARY_CLOUD_NAME || '',
        uploadPreset: process.env.CLOUDINARY_UPLOAD_PRESET || ''
      })
    };
  }
  
  // Login action - validate email/password and return token
  if (action === 'login') {
    const validEmail = process.env.ADMIN_EMAIL || 'admin@arconti31.com';
    const validPassword = process.env.ADMIN_PASSWORD || 'arconti31admin';
    
    if (email !== validEmail || password !== validPassword) {
      return { 
        statusCode: 401, 
        body: JSON.stringify({ error: 'Email o password non valida' }) 
      };
    }
    
    // Generate a simple token (in production use JWT)
    const newToken = Buffer.from(`${email}:${Date.now()}`).toString('base64');
    
    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        success: true, 
        token: newToken,
        email: email
      })
    };
  }
  
  // Verify token action - for session restore
  if (action === 'verify-token') {
    if (!token) {
      return { statusCode: 401, body: JSON.stringify({ error: 'Token mancante' }) };
    }
    
    try {
      const decoded = Buffer.from(token, 'base64').toString('utf-8');
      const [tokenEmail, timestamp] = decoded.split(':');
      const validEmail = process.env.ADMIN_EMAIL || 'admin@arconti31.com';
      
      if (tokenEmail !== validEmail) {
        return { statusCode: 401, body: JSON.stringify({ error: 'Token non valido' }) };
      }
      
      // Token expires after 7 days
      const tokenAge = Date.now() - parseInt(timestamp);
      const maxAge = 7 * 24 * 60 * 60 * 1000; // 7 days
      
      if (tokenAge > maxAge) {
        return { statusCode: 401, body: JSON.stringify({ error: 'Token scaduto' }) };
      }
      
      return {
        statusCode: 200,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ valid: true, email: tokenEmail })
      };
    } catch (e) {
      return { statusCode: 401, body: JSON.stringify({ error: 'Token non valido' }) };
    }
  }
  
  // Validate token for other actions
  if (!token) {
    return { statusCode: 401, body: JSON.stringify({ error: 'Non autenticato' }) };
  }
  
  // Simple token validation (in production use JWT verification)
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

  const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
  const REPO_OWNER = process.env.REPO_OWNER || 'Massimilianociconte';
  const REPO_NAME = process.env.REPO_NAME || 'Arconti31';

  if (!GITHUB_TOKEN) {
    return { 
      statusCode: 500, 
      body: JSON.stringify({ error: 'GITHUB_TOKEN non configurato nelle variabili ambiente Netlify' }) 
    };
  }

  try {
    const path = `${collection}/${filename}`;
    
    if (action === 'save') {
      // Genera contenuto markdown
      const content = generateMarkdown(data);
      const base64Content = Buffer.from(content).toString('base64');
      
      const body = {
        message: `CMS: Update ${path}`,
        content: base64Content,
        branch: 'main'
      };
      
      if (sha) {
        body.sha = sha;
      }
      
      const result = await githubRequest(
        'PUT',
        `/repos/${REPO_OWNER}/${REPO_NAME}/contents/${path}`,
        body,
        GITHUB_TOKEN
      );
      
      return {
        statusCode: 200,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ success: true, sha: result.content?.sha })
      };
      
    } else if (action === 'delete') {
      console.log('Delete action - received sha:', sha, 'filename:', filename);
      
      if (!sha) {
        return {
          statusCode: 400,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ error: 'SHA mancante per eliminazione' })
        };
      }
      
      const deleteBody = {
        message: `CMS: Delete ${path}`,
        sha: sha,
        branch: 'main'
      };
      
      console.log('Sending to GitHub:', JSON.stringify(deleteBody));
      
      await githubRequest(
        'DELETE',
        `/repos/${REPO_OWNER}/${REPO_NAME}/contents/${path}`,
        deleteBody,
        GITHUB_TOKEN
      );
      
      return {
        statusCode: 200,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ success: true })
      };
    }
    
    return { statusCode: 400, body: JSON.stringify({ error: 'Azione non valida' }) };
    
  } catch (error) {
    console.error('Error:', error);
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: error.message })
    };
  }
};

function generateMarkdown(data) {
  let yaml = '---\n';
  
  for (const [key, value] of Object.entries(data)) {
    if (Array.isArray(value)) {
      if (value.length > 0) {
        yaml += `${key}:\n`;
        value.forEach(v => {
          yaml += `  - "${v}"\n`;
        });
      }
    } else if (typeof value === 'boolean') {
      yaml += `${key}: ${value}\n`;
    } else if (typeof value === 'number') {
      yaml += `${key}: ${value}\n`;
    } else if (value) {
      yaml += `${key}: "${value}"\n`;
    }
  }
  
  yaml += '---\n';
  return yaml;
}

// Password comparison is now done directly (no hashing needed)

function githubRequest(method, path, body, token) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'api.github.com',
      path: path,
      method: method,
      headers: {
        'Authorization': `token ${token}`,
        'User-Agent': 'Arconti31-CMS',
        'Content-Type': 'application/json',
        'Accept': 'application/vnd.github.v3+json'
      }
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          resolve(data ? JSON.parse(data) : {});
        } else {
          reject(new Error(`GitHub API error: ${res.statusCode} - ${data}`));
        }
      });
    });

    req.on('error', reject);
    if (body) req.write(JSON.stringify(body));
    req.end();
  });
}
