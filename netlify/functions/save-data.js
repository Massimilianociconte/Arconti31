// Netlify Function per salvare i dati
// Usa GitHub API con un Personal Access Token (PAT) salvato come variabile d'ambiente
// INCLUDE: Rigenerazione automatica JSON dopo ogni salvataggio

exports.handler = async (event, context) => {
  // Solo POST
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  const body = JSON.parse(event.body);
  const { email, password, action, collection, filename, data, sha, token, skipRegeneration } = body;
  
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
    // Supporto per email multiple separate da virgola
    const validEmailsRaw = process.env.ADMIN_EMAIL || 'admin@arconti31.com';
    const validEmails = validEmailsRaw.split(',').map(e => e.trim().toLowerCase());
    const validPassword = process.env.ADMIN_PASSWORD || 'arconti31admin';
    
    const emailLower = email.toLowerCase().trim();
    const isValidEmail = validEmails.includes(emailLower);
    
    if (!isValidEmail || password !== validPassword) {
      return { 
        statusCode: 401, 
        body: JSON.stringify({ error: 'Email o password non valida' }) 
      };
    }
    
    // Generate a simple token (in production use JWT)
    const newToken = Buffer.from(`${emailLower}:${Date.now()}`).toString('base64');
    
    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        success: true, 
        token: newToken,
        email: emailLower
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
      
      // Supporto per email multiple
      const validEmailsRaw = process.env.ADMIN_EMAIL || 'admin@arconti31.com';
      const validEmails = validEmailsRaw.split(',').map(e => e.trim().toLowerCase());
      
      if (!validEmails.includes(tokenEmail.toLowerCase())) {
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
    
    // Supporto per email multiple
    const validEmailsRaw = process.env.ADMIN_EMAIL || 'admin@arconti31.com';
    const validEmails = validEmailsRaw.split(',').map(e => e.trim().toLowerCase());
    
    if (!validEmails.includes(tokenEmail.toLowerCase())) {
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
        else if (!isNaN(parsed) && parsed !== '') parsed = Number(parsed);
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
  
  // Filtra visibili e ordina
  const visibleCategories = categories
    .filter(c => c.visibile !== false)
    .sort((a, b) => (a.order || 0) - (b.order || 0));
  
  return {
    categories: visibleCategories,
    foodCategories: visibleCategories.filter(c => c.tipo_menu === 'food'),
    beverageCategories: visibleCategories.filter(c => c.tipo_menu === 'beverage')
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
