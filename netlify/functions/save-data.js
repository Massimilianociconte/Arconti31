// Netlify Function per salvare i dati
// Usa GitHub API con un Personal Access Token (PAT) salvato come variabile d'ambiente

const https = require('https');

exports.handler = async (event, context) => {
  // Solo POST
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  const body = JSON.parse(event.body);
  const { password, action, collection, filename, data, sha } = body;
  
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
  
  // Password in chiaro (semplice ma efficace per questo uso)
  // Puoi cambiarla nelle variabili d'ambiente Netlify
  const validPassword = process.env.ADMIN_PASSWORD || 'arconti31admin';
  
  if (password !== validPassword) {
    return { statusCode: 401, body: JSON.stringify({ error: 'Password non valida' }) };
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
      const body = {
        message: `CMS: Delete ${path}`,
        sha: sha,
        branch: 'main'
      };
      
      await githubRequest(
        'DELETE',
        `/repos/${REPO_OWNER}/${REPO_NAME}/contents/${path}`,
        body,
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
