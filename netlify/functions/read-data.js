// Netlify Function per leggere i dati da GitHub
// Usa il token per evitare rate limit

const https = require('https');

exports.handler = async (event, context) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  let parsedBody;
  try {
    parsedBody = JSON.parse(event.body);
  } catch (e) {
    console.error('Invalid JSON body:', event.body);
    return { statusCode: 400, body: JSON.stringify({ error: 'Invalid JSON body' }) };
  }

  const { folder } = parsedBody;
  
  if (!folder) {
    return { statusCode: 400, body: JSON.stringify({ error: 'Folder required' }) };
  }

  const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
  const REPO_OWNER = process.env.REPO_OWNER || 'Massimilianociconte';
  const REPO_NAME = process.env.REPO_NAME || 'Arconti31';

  console.log(`[read-data] Folder: ${folder}, Owner: ${REPO_OWNER}, Repo: ${REPO_NAME}, Token exists: ${!!GITHUB_TOKEN}`);

  try {
    // Get folder contents
    const files = await githubRequest(
      'GET',
      `/repos/${REPO_OWNER}/${REPO_NAME}/contents/${folder}`,
      null,
      GITHUB_TOKEN
    );

    console.log(`[read-data] Found ${files.length} files in ${folder}`);

    // Filter markdown files
    const mdFiles = files.filter(f => f.name.endsWith('.md') && f.name !== '.gitkeep');

    // Get content of each file
    const items = await Promise.all(mdFiles.map(async file => {
      try {
        const fileData = await githubRequest(
          'GET',
          `/repos/${REPO_OWNER}/${REPO_NAME}/contents/${folder}/${file.name}`,
          null,
          GITHUB_TOKEN
        );
        const content = Buffer.from(fileData.content, 'base64').toString('utf-8');
        // Use fileData.sha which is the actual SHA of the file content
        return { content, filename: file.name, sha: fileData.sha };
      } catch (e) {
        console.error(`Error loading ${file.name}:`, e);
        return null;
      }
    }));

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ items: items.filter(i => i !== null) })
    };
  } catch (error) {
    console.error('[read-data] Error:', error.message);
    return {
      statusCode: error.message.includes('404') ? 404 : 500,
      body: JSON.stringify({ error: error.message, items: [] })
    };
  }
};


function githubRequest(method, path, body, token) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'api.github.com',
      path: path,
      method: method,
      headers: {
        'User-Agent': 'Arconti31-CMS',
        'Accept': 'application/vnd.github.v3+json'
      }
    };

    // Add auth if token available
    if (token) {
      options.headers['Authorization'] = `token ${token}`;
    }

    console.log(`[githubRequest] ${method} ${path}`);

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        console.log(`[githubRequest] Response status: ${res.statusCode}`);
        if (res.statusCode >= 200 && res.statusCode < 300) {
          resolve(data ? JSON.parse(data) : {});
        } else {
          console.error(`[githubRequest] Error response: ${data.substring(0, 500)}`);
          reject(new Error(`GitHub API error: ${res.statusCode} - ${data.substring(0, 200)}`));
        }
      });
    });

    req.on('error', (e) => {
      console.error('[githubRequest] Request error:', e.message);
      reject(e);
    });
    if (body) req.write(JSON.stringify(body));
    req.end();
  });
}
