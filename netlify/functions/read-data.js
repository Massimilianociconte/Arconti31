// Netlify Function per leggere i dati da GitHub
// Usa il token per evitare rate limit
// Ottimizzato: usa JSON statici quando possibile, API solo per SHA

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

  if (!GITHUB_TOKEN) {
    console.error('[read-data] GITHUB_TOKEN non configurato!');
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'GITHUB_TOKEN non configurato', items: [] })
    };
  }

  try {
    // Get folder contents
    const files = await githubRequest(
      'GET',
      `/repos/${REPO_OWNER}/${REPO_NAME}/contents/${folder}`,
      null,
      GITHUB_TOKEN
    );

    // Handle case where folder doesn't exist or is empty
    if (!Array.isArray(files)) {
      console.log(`[read-data] Folder ${folder} non è un array o non esiste`);
      return {
        statusCode: 200,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items: [] })
      };
    }

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

    // Se è rate limit, restituisci un messaggio specifico
    if (error.message.includes('403') || error.message.includes('rate limit')) {
      return {
        statusCode: 429,
        body: JSON.stringify({
          error: 'Rate limit GitHub raggiunto. Attendi qualche minuto e riprova.',
          items: []
        })
      };
    }

    return {
      statusCode: error.message.includes('404') ? 404 : 500,
      body: JSON.stringify({ error: error.message, items: [] })
    };
  }
};


async function githubRequest(method, path, body, token) {
  const url = `https://api.github.com${path}`;

  const options = {
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

  const response = await fetch(url, options);
  const data = await response.text();

  console.log(`[githubRequest] Response status: ${response.status}`);

  if (response.ok) {
    return data ? JSON.parse(data) : {};
  } else {
    console.error(`[githubRequest] Error response: ${data.substring(0, 500)}`);
    throw new Error(`GitHub API error: ${response.status} - ${data.substring(0, 200)}`);
  }
}
