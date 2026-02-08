// Netlify Function per salvare i dati
// Usa GitHub API con un Personal Access Token (PAT) salvato come variabile d'ambiente
// INCLUDE: Rigenerazione automatica JSON dopo ogni salvataggio

const crypto = require('crypto');

// ==========================================
// CONFIGURAZIONE AUTENTICAZIONE
// ==========================================
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || '';
const ADMIN_EMAILS = ADMIN_EMAIL.split(',').map(e => e.toLowerCase().trim()).filter(e => e);
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || '';
const TOKEN_SECRET = ADMIN_PASSWORD; // Use password as HMAC secret
const TOKEN_EXPIRY_HOURS = 24 * 7; // 7 days

// CORS Headers
const headers = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Content-Type': 'application/json'
};

// ==========================================
// TOKEN GENERATION & VERIFICATION (HMAC-SHA256)
// ==========================================
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

  // Solo POST
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, headers, body: 'Method Not Allowed' };
  }

  // Parse body con gestione errori
  let body;
  try {
    body = JSON.parse(event.body);
  } catch (e) {
    return { statusCode: 400, headers, body: JSON.stringify({ error: 'JSON non valido' }) };
  }
  
  const { email, password, action, collection, filename, data, sha, token, skipRegeneration } = body;

  // Validazione path traversal (sicurezza)
  if (collection && (collection.includes('..') || collection.includes('/') || collection.includes('\\'))) {
    return { statusCode: 400, headers, body: JSON.stringify({ error: 'Collection non valida' }) };
  }
  if (filename && (filename.includes('..') || filename.includes('/') || filename.includes('\\'))) {
    return { statusCode: 400, headers, body: JSON.stringify({ error: 'Filename non valido' }) };
  }

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

  // ==========================================
  // LOGIN
  // ==========================================
  if (action === 'login') {
    if (!email || !password) {
      return { statusCode: 400, headers, body: JSON.stringify({ error: 'Email e password richiesti' }) };
    }

    const emailLower = email.toLowerCase().trim();

    if (ADMIN_EMAILS.includes(emailLower) && password === ADMIN_PASSWORD) {
      const newToken = generateToken(emailLower);
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          token: newToken,
          user: { email: emailLower, role: 'admin' }
        })
      };
    } else {
      return { statusCode: 401, headers, body: JSON.stringify({ error: 'Credenziali non valide' }) };
    }
  }

  // ==========================================
  // VERIFICA TOKEN (Middleware)
  // ==========================================
  const authHeader = event.headers.authorization || event.headers.Authorization;
  const incomingToken = authHeader ? authHeader.replace('Bearer ', '') : token; // Use 'token' from body if no Bearer header
  const userEmail = verifyToken(incomingToken);

  if (!userEmail) {
    return { statusCode: 401, headers, body: JSON.stringify({ error: 'Sessione scaduta o non valida' }) };
  }

  // If action is 'verify-token', and we reached here, it means the token is valid (checked by middleware)
  if (action === 'verify-token') {
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ valid: true, email: userEmail })
    };
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

      // ✨ NUOVO: Rigenera i JSON dopo il salvataggio (se non saltato)
      if (!skipRegeneration) {
        console.log(`📦 Rigenerazione JSON per collection: ${collection}`);
        await regenerateJSON(collection, GITHUB_TOKEN, REPO_OWNER, REPO_NAME);
      }

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

      // ✨ NUOVO: Rigenera i JSON dopo l'eliminazione (se non saltato)
      if (!skipRegeneration) {
        console.log(`📦 Rigenerazione JSON per collection: ${collection}`);
        await regenerateJSON(collection, GITHUB_TOKEN, REPO_OWNER, REPO_NAME);
      }

      return {
        statusCode: 200,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ success: true })
      };
    } else if (action === 'regenerate-json') {
      console.log(`📦 Rigenerazione JSON manuale per collection: ${collection}`);
      await regenerateJSON(collection, GITHUB_TOKEN, REPO_OWNER, REPO_NAME);

      return {
        statusCode: 200,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ success: true })
      };
    } else if (action === 'batch-save-order') {
      // ========================================
      // BATCH REORDER: single atomic commit via Git Trees API
      // ========================================
      const orderItems = body.items;
      if (!collection || !orderItems || !orderItems.length) {
        return { statusCode: 400, headers, body: JSON.stringify({ error: 'Missing collection or items' }) };
      }

      const BRANCH = 'main';

      // 1. Get current branch info (commit SHA + tree SHA in one call)
      const branchInfo = await githubRequest('GET',
        `/repos/${REPO_OWNER}/${REPO_NAME}/branches/${BRANCH}`, null, GITHUB_TOKEN);
      const latestCommitSha = branchInfo.commit.sha;
      const baseTreeSha = branchInfo.commit.commit.tree.sha;

      // 2. Read all .md files in collection (PARALLEL for speed)
      const listing = await githubRequest('GET',
        `/repos/${REPO_OWNER}/${REPO_NAME}/contents/${collection}`, null, GITHUB_TOKEN);

      if (!Array.isArray(listing)) {
        return { statusCode: 404, headers, body: JSON.stringify({ error: 'Collection not found' }) };
      }

      const mdFiles = listing.filter(f => f.name.endsWith('.md') && f.name !== '.gitkeep');

      const fileResults = await Promise.all(mdFiles.map(async (file) => {
        try {
          const fileData = await githubRequest('GET',
            `/repos/${REPO_OWNER}/${REPO_NAME}/contents/${collection}/${file.name}`, null, GITHUB_TOKEN);
          const content = Buffer.from(fileData.content, 'base64').toString('utf-8');
          const parsed = parseMarkdownFrontmatter(content);
          if (parsed) {
            parsed._filename = file.name;
            return parsed;
          }
        } catch (e) {
          console.error(`Error reading ${file.name}:`, e.message);
        }
        return null;
      }));

      const allItems = fileResults.filter(Boolean);

      // 3. Build order lookup: by filename (primary) + by nome (fallback)
      const orderMap = new Map(orderItems.map(i => [i.filename, i.order]));
      const nameOrderMap = new Map();
      orderItems.forEach(i => {
        if (i.nome) nameOrderMap.set(i.nome.trim().toLowerCase(), i.order);
      });

      // 4. Apply order updates and build tree entries
      const treeEntries = [];
      let updatedCount = 0;

      for (const item of allItems) {
        let newOrder = orderMap.get(item._filename);

        // Fallback: match by nome (handles filename mismatch)
        if (newOrder === undefined && item.nome) {
          const byName = nameOrderMap.get(item.nome.trim().toLowerCase());
          if (byName !== undefined) newOrder = byName;
        }

        if (newOrder !== undefined && newOrder !== item.order) {
          item.order = newOrder;
          const { _filename, ...cleanData } = item;
          treeEntries.push({
            path: `${collection}/${_filename}`,
            mode: '100644',
            type: 'blob',
            content: generateMarkdown(cleanData)
          });
          updatedCount++;
        }
      }

      if (treeEntries.length === 0) {
        return { statusCode: 200, headers, body: JSON.stringify({ success: true, updated: 0 }) };
      }

      // 5. Generate updated JSON and include in same commit (no extra API calls)
      const sorted = [...allItems].sort((a, b) => (a.order || 0) - (b.order || 0));
      const batchConfig = COLLECTION_CONFIG[collection];

      if (batchConfig) {
        let jsonContent = null;

        if (batchConfig.type === 'categories') {
          jsonContent = {
            categories: sorted,
            foodCategories: sorted.filter(c => c.tipo_menu === 'food'),
            beverageCategories: sorted.filter(c => c.tipo_menu === 'beverage')
          };
        } else if (batchConfig.type === 'food') {
          const categories = await readCollectionFiles('categorie', GITHUB_TOKEN, REPO_OWNER, REPO_NAME);
          const foodCats = categories.filter(c => c.tipo_menu === 'food' && c.visibile !== false);
          const foodByCategory = {};
          foodCats.forEach(cat => { foodByCategory[cat.nome] = []; });
          sorted.forEach(item => {
            const cat = item.category || 'Altro';
            if (!foodByCategory[cat]) foodByCategory[cat] = [];
            foodByCategory[cat].push(item);
          });
          const categoryOrder = {};
          foodCats.forEach((cat, idx) => { categoryOrder[cat.nome] = cat.order || idx; });
          jsonContent = { food: sorted, foodByCategory, categoryOrder };
        } else if (batchConfig.type === 'beers') {
          const beersBySection = {};
          sorted.forEach(beer => {
            const sec = beer.sezione || 'Birre alla spina';
            if (!beersBySection[sec]) beersBySection[sec] = [];
            beersBySection[sec].push(beer);
          });
          jsonContent = { beers: sorted, beersBySection };
        }

        if (jsonContent) {
          treeEntries.push({
            path: batchConfig.jsonPath,
            mode: '100644',
            type: 'blob',
            content: JSON.stringify(jsonContent, null, 2)
          });
        }
      }

      // 6. Create tree → commit → update ref (3 API calls)
      const newTree = await githubRequest('POST',
        `/repos/${REPO_OWNER}/${REPO_NAME}/git/trees`,
        { base_tree: baseTreeSha, tree: treeEntries }, GITHUB_TOKEN);

      const newCommit = await githubRequest('POST',
        `/repos/${REPO_OWNER}/${REPO_NAME}/git/commits`,
        { message: `CMS: Reorder ${collection} (${updatedCount} items)`,
          tree: newTree.sha, parents: [latestCommitSha] }, GITHUB_TOKEN);

      await githubRequest('PATCH',
        `/repos/${REPO_OWNER}/${REPO_NAME}/git/refs/heads/${BRANCH}`,
        { sha: newCommit.sha }, GITHUB_TOKEN);

      console.log(`✅ Batch reorder: ${updatedCount} items in ${collection}`);

      return {
        statusCode: 200, headers,
        body: JSON.stringify({ success: true, updated: updatedCount })
      };
    }

    return { statusCode: 400, body: JSON.stringify({ error: 'Azione non valida' }) };

  } catch (error) {
    console.error('Error:', error);
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: error.message || 'Unknown error' })
    };
  }
};

// ========================================
// GENERAZIONE MARKDOWN
// ========================================

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
    } else if (key === 'prezzo') {
      // IMPORTANTE: Sempre salvare il prezzo come stringa tra virgolette
      // per preservare i decimali (es: "14.50" invece di 14.5)
      yaml += `${key}: "${value}"\n`;
    } else if (typeof value === 'number') {
      yaml += `${key}: ${value}\n`;
    } else if (value) {
      yaml += `${key}: "${value}"\n`;
    }
  }

  yaml += '---\n';
  return yaml;
}

// ========================================
// GITHUB API HELPERS
// ========================================

async function githubRequest(method, path, body, token) {
  const url = `https://api.github.com${path}`;

  const options = {
    method: method,
    headers: {
      'Authorization': `token ${token}`,
      'User-Agent': 'Arconti31-CMS',
      'Content-Type': 'application/json',
      'Accept': 'application/vnd.github.v3+json'
    }
  };

  // For DELETE and other methods that need a body
  if (body) {
    options.body = JSON.stringify(body);
  }

  console.log(`GitHub ${method} ${path}`);

  const response = await fetch(url, options);
  const data = await response.text();

  if (response.ok) {
    return data ? JSON.parse(data) : {};
  } else {
    throw new Error(`GitHub API error: ${response.status} - ${data}`);
  }
}

// ========================================
// RIGENERAZIONE JSON AUTOMATICA
// ========================================

// Mapping delle collection ai file JSON di destinazione
const COLLECTION_CONFIG = {
  'food': {
    jsonPath: 'food/food.json',
    type: 'food'
  },
  'beers': {
    jsonPath: 'beers/beers.json',
    type: 'beers'
  },
  'categorie': {
    jsonPath: 'categorie/categorie.json',
    type: 'categories'
  },
  // Le bevande condividono tutte lo stesso JSON
  'cocktails': { jsonPath: 'beverages/beverages.json', type: 'beverages', folder: 'cocktails' },
  'analcolici': { jsonPath: 'beverages/beverages.json', type: 'beverages', folder: 'analcolici' },
  'bibite': { jsonPath: 'beverages/beverages.json', type: 'beverages', folder: 'bibite' },
  'caffetteria': { jsonPath: 'beverages/beverages.json', type: 'beverages', folder: 'caffetteria' },
  'bollicine': { jsonPath: 'beverages/beverages.json', type: 'beverages', folder: 'bollicine' },
  'bianchi-fermi': { jsonPath: 'beverages/beverages.json', type: 'beverages', folder: 'bianchi-fermi' },
  'vini-rossi': { jsonPath: 'beverages/beverages.json', type: 'beverages', folder: 'vini-rossi' }
};

async function regenerateJSON(collection, token, owner, repo) {
  const config = COLLECTION_CONFIG[collection];
  if (!config) {
    console.log(`⚠️ Collection ${collection} non configurata per rigenerazione JSON`);
    return;
  }

  try {
    let jsonContent;

    if (config.type === 'food') {
      jsonContent = await generateFoodJSON(token, owner, repo);
    } else if (config.type === 'beers') {
      jsonContent = await generateBeersJSON(token, owner, repo);
    } else if (config.type === 'categories') {
      jsonContent = await generateCategoriesJSON(token, owner, repo);
    } else if (config.type === 'beverages') {
      jsonContent = await generateBeveragesJSON(token, owner, repo);
    }

    if (jsonContent) {
      await commitJSON(config.jsonPath, jsonContent, token, owner, repo);
      console.log(`✅ JSON rigenerato: ${config.jsonPath}`);
    }
  } catch (error) {
    console.error(`❌ Errore rigenerazione JSON per ${collection}:`, error.message);
    // Non blocchiamo il salvataggio se la rigenerazione fallisce
  }
}

// Legge tutti i file .md di una collection
async function readCollectionFiles(folder, token, owner, repo) {
  try {
    const url = `/repos/${owner}/${repo}/contents/${folder}`;
    const files = await githubRequest('GET', url, null, token);

    if (!Array.isArray(files)) return [];

    const mdFiles = files.filter(f => f.name.endsWith('.md') && f.name !== '.gitkeep');
    const items = [];

    for (const file of mdFiles) {
      try {
        // Scarica il contenuto del file
        const fileData = await githubRequest('GET', `/repos/${owner}/${repo}/contents/${folder}/${file.name}`, null, token);
        const content = Buffer.from(fileData.content, 'base64').toString('utf-8');
        const parsed = parseMarkdownFrontmatter(content);
        if (parsed) {
          parsed._filename = file.name;
          items.push(parsed);
        }
      } catch (e) {
        console.error(`Errore lettura ${file.name}:`, e.message);
      }
    }

    return items;
  } catch (e) {
    console.error(`Errore lettura collection ${folder}:`, e.message);
    return [];
  }
}

// Parsifica il frontmatter YAML dal markdown
function parseMarkdownFrontmatter(content) {
  const match = content.match(/---\r?\n([\s\S]*?)\r?\n---/);
  if (!match) return null;

  const data = {};
  let currentKey = null;
  let inArray = false;
  let arrayValues = [];

  match[1].split('\n').forEach(line => {
    line = line.replace(/\r$/, '');
    if (line.startsWith('  - ')) {
      arrayValues.push(line.replace('  - ', '').replace(/"/g, '').trim());
    } else if (line.includes(':')) {
      if (currentKey && inArray) {
        data[currentKey] = arrayValues;
        arrayValues = [];
        inArray = false;
      }
      const [key, ...rest] = line.split(':');
      const value = rest.join(':').trim();
      currentKey = key.trim();
      if (value === '') {
        inArray = true;
      } else {
        let parsed = value.replace(/^["']|["']$/g, '');
        if (parsed === 'true') parsed = true;
        else if (parsed === 'false') parsed = false;
        // IMPORTANTE: Non convertire 'prezzo' in Number per preservare i decimali
        // (es: "14.50" rimarrebbe "14.50" come stringa invece di 14.5)
        else if (currentKey !== 'prezzo' && !isNaN(parsed) && parsed !== '') parsed = Number(parsed);
        data[currentKey] = parsed;
      }
    }
  });

  if (currentKey && inArray) data[currentKey] = arrayValues;
  return data;
}

// ========================================
// GENERATORI JSON SPECIFICI
// ========================================

async function generateFoodJSON(token, owner, repo) {
  // Carica anche le categorie per l'ordine
  const categories = await readCollectionFiles('categorie', token, owner, repo);
  const foodCategories = categories.filter(c => c.tipo_menu === 'food' && c.visibile !== false);

  const foodItems = await readCollectionFiles('food', token, owner, repo);

  // Ordina per order
  foodItems.sort((a, b) => (a.order || 0) - (b.order || 0));

  // Raggruppa per categoria
  const foodByCategory = {};

  // Inizializza categorie vuote
  foodCategories.forEach(cat => {
    foodByCategory[cat.nome] = [];
  });

  // Aggiungi i piatti
  foodItems.forEach(item => {
    const category = item.category || 'Altro';
    if (!foodByCategory[category]) {
      foodByCategory[category] = [];
    }
    foodByCategory[category].push(item);
  });

  // Ordina categorie
  const categoryOrder = {};
  foodCategories.forEach((cat, idx) => {
    categoryOrder[cat.nome] = cat.order || idx;
  });

  return {
    food: foodItems,
    foodByCategory,
    categoryOrder
  };
}

async function generateBeersJSON(token, owner, repo) {
  const beers = await readCollectionFiles('beers', token, owner, repo);

  // Ordina per order
  beers.sort((a, b) => (a.order || 0) - (b.order || 0));

  // Raggruppa per sezione
  const beersBySection = {};
  beers.forEach(beer => {
    const section = beer.sezione || 'Birre alla spina';
    if (!beersBySection[section]) {
      beersBySection[section] = [];
    }
    beersBySection[section].push(beer);
  });

  return {
    beers,
    beersBySection
  };
}

async function generateCategoriesJSON(token, owner, repo) {
  const categories = await readCollectionFiles('categorie', token, owner, repo);

  // Ordina (NON FILTRARE VISIBILI: il CMS deve vederle tutte!)
  const allCategories = categories
    .sort((a, b) => (a.order || 0) - (b.order || 0));

  return {
    categories: allCategories,
    foodCategories: allCategories.filter(c => c.tipo_menu === 'food'),
    beverageCategories: allCategories.filter(c => c.tipo_menu === 'beverage')
  };
}

async function generateBeveragesJSON(token, owner, repo) {
  // Definizione categorie bevande
  const beverageCategories = [
    { name: 'Cocktails', folder: 'cocktails' },
    { name: 'Analcolici', folder: 'analcolici' },
    { name: 'Bibite', folder: 'bibite' },
    { name: 'Caffetteria', folder: 'caffetteria' },
    { name: 'Bollicine', folder: 'bollicine' },
    { name: 'Bianchi fermi', folder: 'bianchi-fermi' },
    { name: 'Vini rossi', folder: 'vini-rossi' }
  ];

  const beveragesByType = {};
  const allBeverages = [];

  for (const category of beverageCategories) {
    const items = await readCollectionFiles(category.folder, token, owner, repo);

    // Aggiungi il tipo a ogni item
    items.forEach(item => {
      item.tipo = category.name;
    });

    // Ordina
    items.sort((a, b) => (a.order || 0) - (b.order || 0));

    if (items.length > 0) {
      beveragesByType[category.name] = items;
      allBeverages.push(...items);
    }
  }

  return {
    beverages: allBeverages,
    beveragesByType
  };
}

// ========================================
// COMMIT JSON SU GITHUB
// ========================================

async function commitJSON(jsonPath, content, token, owner, repo) {
  const jsonString = JSON.stringify(content, null, 2);
  const base64Content = Buffer.from(jsonString).toString('base64');

  // Prima prova a ottenere lo SHA del file esistente
  let existingSha = null;
  try {
    const existingFile = await githubRequest('GET', `/repos/${owner}/${repo}/contents/${jsonPath}`, null, token);
    existingSha = existingFile.sha;
  } catch (e) {
    // File non esiste, verrà creato
    console.log(`📝 Creazione nuovo file: ${jsonPath}`);
  }

  const body = {
    message: `CMS Auto: Rigenera ${jsonPath}`,
    content: base64Content,
    branch: 'main'
  };

  if (existingSha) {
    body.sha = existingSha;
  }

  await githubRequest('PUT', `/repos/${owner}/${repo}/contents/${jsonPath}`, body, token);
}
