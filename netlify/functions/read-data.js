// Netlify Function per leggere i dati
// OTTIMIZZATO: Usa JSON statici quando possibile, API GitHub solo per SHA

const { verifyToken } = require('./auth');

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

  const { folder, mode, token } = parsedBody;

  if (!folder) {
    return { statusCode: 400, body: JSON.stringify({ error: 'Folder required' }) };
  }

  // mode=api exposes SHA data → require authentication
  if (mode === 'api') {
    const userEmail = verifyToken(token);
    if (!userEmail) {
      return { statusCode: 401, body: JSON.stringify({ error: 'Authentication required for API mode', items: [] }) };
    }
  }

  const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
  const REPO_OWNER = process.env.REPO_OWNER || 'Massimilianociconte';
  const REPO_NAME = process.env.REPO_NAME || 'Arconti31';

  console.log(`[read-data] Folder: ${folder}, Mode: ${mode || 'auto'}`);

  // NUOVO: Se mode='json' o non specificato, prova prima a leggere dal JSON statico
  if (mode !== 'api') {
    const jsonResult = await tryReadFromJSON(folder, REPO_OWNER, REPO_NAME);
    if (jsonResult) {
      console.log(`[read-data] ✅ Dati caricati da JSON statico per ${folder} (${jsonResult.length} items)`);
      return {
        statusCode: 200,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items: jsonResult, source: 'json' })
      };
    }
  }

  // Fallback: usa API GitHub (necessario per ottenere SHA per modifiche)
  console.log(`[read-data] Usando API GitHub per ${folder}`);

  if (!GITHUB_TOKEN) {
    console.error('[read-data] GITHUB_TOKEN non configurato!');
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'GITHUB_TOKEN non configurato', items: [] })
    };
  }

  try {
    const files = await githubRequest(
      'GET',
      `/repos/${REPO_OWNER}/${REPO_NAME}/contents/${folder}`,
      null,
      GITHUB_TOKEN
    );

    if (!Array.isArray(files)) {
      return {
        statusCode: 200,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items: [], source: 'api' })
      };
    }

    const mdFiles = files.filter(f => f.name.endsWith('.md') && f.name !== '.gitkeep');

    const items = await Promise.all(mdFiles.map(async file => {
      try {
        const fileData = await githubRequest(
          'GET',
          `/repos/${REPO_OWNER}/${REPO_NAME}/contents/${folder}/${file.name}`,
          null,
          GITHUB_TOKEN
        );
        const content = Buffer.from(fileData.content, 'base64').toString('utf-8');
        return { content, filename: file.name, sha: fileData.sha };
      } catch (e) {
        console.error(`Error loading ${file.name}:`, e);
        return null;
      }
    }));

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ items: items.filter(i => i !== null), source: 'api' })
    };
  } catch (error) {
    console.error('[read-data] Error:', error.message);

    if (error.message.includes('403') || error.message.includes('rate limit')) {
      // Se rate limit, prova COMUNQUE a leggere dal JSON
      const jsonFallback = await tryReadFromJSON(folder, REPO_OWNER, REPO_NAME);
      if (jsonFallback) {
        console.log(`[read-data] ✅ Fallback a JSON per rate limit`);
        return {
          statusCode: 200,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ items: jsonFallback, source: 'json-fallback' })
        };
      }

      return {
        statusCode: 429,
        body: JSON.stringify({
          error: 'Rate limit GitHub raggiunto. Attendi qualche minuto.',
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

// ========================================
// LETTURA DA JSON STATICI
// ========================================

async function tryReadFromJSON(folder, owner, repo) {
  // Mapping folder -> JSON file e campo dati
  const JSON_MAP = {
    'food': { file: 'food/food.json', field: 'food' },
    'beers': { file: 'beers/beers.json', field: 'beers' },
    'categorie': { file: 'categorie/categorie.json', field: 'categories' },
    'cocktails': { file: 'beverages/beverages.json', field: 'beverages', filter: 'Cocktails' },
    'analcolici': { file: 'beverages/beverages.json', field: 'beverages', filter: 'Analcolici' },
    'bibite': { file: 'beverages/beverages.json', field: 'beverages', filter: 'Bibite' },
    'caffetteria': { file: 'beverages/beverages.json', field: 'beverages', filter: 'Caffetteria' },
    'bollicine': { file: 'beverages/beverages.json', field: 'beverages', filter: 'Bollicine' },
    'bianchi-fermi': { file: 'beverages/beverages.json', field: 'beverages', filter: 'Bianchi fermi' },
    'vini-rossi': { file: 'beverages/beverages.json', field: 'beverages', filter: 'Vini rossi' }
  };

  const config = JSON_MAP[folder];
  if (!config) {
    console.log(`[tryReadFromJSON] Nessun mapping per ${folder}`);
    return null;
  }

  try {
    // Legge il JSON dal repository raw di GitHub (non conta verso rate limit API!)
    const rawUrl = `https://raw.githubusercontent.com/${owner}/${repo}/main/${config.file}`;
    console.log(`[tryReadFromJSON] Fetching ${rawUrl}`);

    const response = await fetch(rawUrl);
    if (!response.ok) {
      console.log(`[tryReadFromJSON] File non trovato: ${response.status}`);
      return null;
    }

    const jsonData = await response.json();
    let items = jsonData[config.field] || [];

    // Filtra per tipo se necessario (per beverages)
    if (config.filter) {
      items = items.filter(item => item.tipo === config.filter);
    }

    // IMPORTANTE: Restituisce i dati in un formato che il CMS può usare direttamente
    // Genera sia il content markdown (per compatibilità) che passa l'item diretto
    return items.map(item => {
      // Genera un filename dallo slug o dal nome
      const filename = item._filename || ((item.slug || slugify(item.nome)) + '.md');

      // Genera contenuto markdown per compatibilità con parseMarkdown
      const content = generateMarkdownFromItem(item);

      return {
        content,
        filename,
        sha: null,
        fromJSON: true,
        // NUOVO: passa anche l'item diretto per evitare parsing
        parsedItem: item
      };
    });
  } catch (e) {
    console.error(`[tryReadFromJSON] Errore:`, e.message);
    return null;
  }
}

function generateMarkdownFromItem(item) {
  let yaml = '---\n';

  for (const [key, value] of Object.entries(item)) {
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
    } else if (value !== null && value !== undefined) {
      // Escape quotes in string values
      const escaped = String(value).replace(/"/g, '\\"');
      yaml += `${key}: "${escaped}"\n`;
    }
  }

  yaml += '---\n';
  return yaml;
}

function slugify(text) {
  if (!text) return 'item-' + Date.now();
  return text.toString().toLowerCase().trim()
    .replace(/\s+/g, '-')
    .replace(/[àáâãäå]/g, 'a').replace(/[èéêë]/g, 'e')
    .replace(/[ìíîï]/g, 'i').replace(/[òóôõö]/g, 'o').replace(/[ùúûü]/g, 'u')
    .replace(/[^a-z0-9-]/g, '').replace(/-+/g, '-').substring(0, 50);
}

// ========================================
// GITHUB API
// ========================================

async function githubRequest(method, path, body, token) {
  const url = `https://api.github.com${path}`;

  const options = {
    method: method,
    headers: {
      'User-Agent': 'Arconti31-CMS',
      'Accept': 'application/vnd.github.v3+json'
    }
  };

  if (token) {
    options.headers['Authorization'] = `token ${token}`;
  }

  const response = await fetch(url, options);
  const data = await response.text();

  if (response.ok) {
    return data ? JSON.parse(data) : {};
  } else {
    throw new Error(`GitHub API error: ${response.status} - ${data.substring(0, 200)}`);
  }
}
