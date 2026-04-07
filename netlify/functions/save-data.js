// Netlify Function per salvare i dati
// Usa GitHub API con un Personal Access Token (PAT) salvato come variabile d'ambiente
// INCLUDE: Rigenerazione automatica JSON dopo ogni salvataggio

// Shared auth module (single source of truth)
const crypto = require('crypto');
const { generateToken, verifyToken, verifyLogin } = require('./auth');
const {
  BASE_BEVERAGE_CATEGORIES,
  findBeverageCategoryByFolder,
  getCategoryFolder,
  getFilenameBase,
  normalizeSlug,
  parseFrontmatter,
  stringifyFrontmatter
} = require('../../lib/menu-utils');

// CORS Headers - restrict to known origins
const ALLOWED_ORIGINS = [
  'https://arconti31.com',
  'https://www.arconti31.com',
  'https://arconti31.netlify.app',
  'http://localhost:8000',
  'http://localhost:3000'
];

function getCorsOrigin(event) {
  const origin = event.headers.origin || event.headers.Origin || '';
  return ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0];
}

function getHeaders(event) {
  return {
    'Access-Control-Allow-Origin': getCorsOrigin(event),
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Content-Type': 'application/json'
  };
}

exports.handler = async (event, context) => {
  const headers = getHeaders(event);

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
      headers,
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

    const validEmail = verifyLogin(email, password);
    if (validEmail) {
      const newToken = generateToken(validEmail);
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          token: newToken,
          email: validEmail,
          user: { email: validEmail, role: 'admin' }
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
      headers,
      body: JSON.stringify({ error: 'GITHUB_TOKEN non configurato nelle variabili ambiente Netlify' })
    };
  }

  try {
    const path = `${collection}/${filename}`;

    if (action === 'save') {
      const preparedData = await prepareDataForSave(collection, data, GITHUB_TOKEN, REPO_OWNER, REPO_NAME);
      await assertSafeCategorySave(collection, filename, preparedData, sha, GITHUB_TOKEN, REPO_OWNER, REPO_NAME);

      let result;
      if (skipRegeneration) {
        const content = generateMarkdown(preparedData);
        const base64Content = Buffer.from(content).toString('base64');

        const body = {
          message: `CMS: Update ${path}`,
          content: base64Content,
          branch: 'main'
        };

        if (sha) {
          body.sha = sha;
        }

        result = await githubRequest(
          'PUT',
          `/repos/${REPO_OWNER}/${REPO_NAME}/contents/${path}`,
          body,
          GITHUB_TOKEN
        );
      } else {
        result = await saveItemAtomically({
          collection,
          filename,
          data: preparedData,
          sha,
          token: GITHUB_TOKEN,
          owner: REPO_OWNER,
          repo: REPO_NAME
        });
      }

      return {
        statusCode: 200,
        headers,
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

      await assertSafeCategoryDelete(collection, filename, GITHUB_TOKEN, REPO_OWNER, REPO_NAME);

      if (skipRegeneration) {
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
      } else {
        await deleteItemAtomically({
          collection,
          filename,
          token: GITHUB_TOKEN,
          owner: REPO_OWNER,
          repo: REPO_NAME
        });
      }

      return {
        statusCode: 200,
        headers,
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

      // 2. Read collection snapshot (prefer JSON, fallback to markdown files)
      const allItems = await readCollectionSnapshot(collection, GITHUB_TOKEN, REPO_OWNER, REPO_NAME)
        || await readCollectionFiles(collection, GITHUB_TOKEN, REPO_OWNER, REPO_NAME);

      if (!Array.isArray(allItems)) {
        return { statusCode: 404, headers, body: JSON.stringify({ error: 'Collection not found' }) };
      }

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
      let batchConfig = COLLECTION_CONFIG[collection];

      if (!batchConfig) {
        const categories = await readCollectionSnapshot('categorie', GITHUB_TOKEN, REPO_OWNER, REPO_NAME)
          || await readCollectionFiles('categorie', GITHUB_TOKEN, REPO_OWNER, REPO_NAME);
        const matchedCategory = findBeverageCategoryByFolder(categories, collection);
        if (matchedCategory) {
          batchConfig = {
            jsonPath: 'beverages/beverages.json',
            type: 'beverages',
            folder: getCategoryFolder(matchedCategory),
            name: matchedCategory.nome
          };
        }
      }

      if (batchConfig) {
        let jsonContent = null;

        if (batchConfig.type === 'categories') {
          jsonContent = {
            categories: sorted,
            foodCategories: sorted.filter(c => c.tipo_menu === 'food'),
            beverageCategories: sorted.filter(c => c.tipo_menu === 'beverage')
          };
        } else if (batchConfig.type === 'food') {
          const categories = await readCollectionSnapshot('categorie', GITHUB_TOKEN, REPO_OWNER, REPO_NAME)
            || await readCollectionFiles('categorie', GITHUB_TOKEN, REPO_OWNER, REPO_NAME);
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
        } else if (batchConfig.type === 'beverages') {
          jsonContent = await generateJSONForConfig(batchConfig, GITHUB_TOKEN, REPO_OWNER, REPO_NAME, {
            [collection]: sorted
          });
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

    return { statusCode: 400, headers, body: JSON.stringify({ error: 'Azione non valida' }) };

  } catch (error) {
    console.error('Error:', error);
    return {
      statusCode: getErrorStatusCode(error),
      headers,
      body: JSON.stringify({ error: error.message || 'Unknown error' })
    };
  }
};

// ========================================
// GENERAZIONE MARKDOWN
// ========================================

function generateMarkdown(data) {
  return stringifyFrontmatter(data);
}

function calculateGitBlobSha(content) {
  return crypto
    .createHash('sha1')
    .update(`blob ${Buffer.byteLength(content, 'utf8')}\0${content}`, 'utf8')
    .digest('hex');
}

function getErrorStatusCode(error) {
  const message = String(error?.message || '');

  if (
    message.includes('Campi obbligatori') ||
    message.includes('Payload non valido') ||
    message.includes('Prezzo non valido') ||
    message.includes('Slug categoria non valido') ||
    message.includes('Categoria food non valida') ||
    message.includes('Sezione birra non valida') ||
    message.includes('tipo_menu categoria non valido') ||
    message.includes('Categoria padre') ||
    message.includes('Una categoria non puo avere se stessa come padre') ||
    message.includes('Impossibile modificare la categoria') ||
    message.includes('Impossibile eliminare la categoria')
  ) {
    return 400;
  }

  if (
    message.includes('Esiste gia una categoria') ||
    message.includes('gia usata') ||
    message.includes('already exists')
  ) {
    return 409;
  }

  if (message.includes('File non trovato')) {
    return 404;
  }

  return 500;
}

function findCategoryByReference(categories = [], value, typeMenu = null) {
  const normalizedValue = normalizeSlug(value);
  if (!normalizedValue) return null;

  return categories.find(category =>
    (!typeMenu || category.tipo_menu === typeMenu) &&
    getCategoryReferenceAliases(category).includes(normalizedValue)
  ) || null;
}

async function loadCategoriesSnapshot(token, owner, repo) {
  return readCollectionSnapshot('categorie', token, owner, repo)
    || readCollectionFiles('categorie', token, owner, repo);
}

async function prepareDataForSave(collection, rawData = {}, token, owner, repo) {
  if (!rawData || typeof rawData !== 'object' || Array.isArray(rawData)) {
    throw new Error('Payload non valido');
  }

  const normalized = { ...rawData };

  if (collection === 'categorie') {
    normalized.slug = normalizeSlug(normalized.slug || normalized.nome || '');
    if (!normalized.slug) {
      throw new Error('Slug categoria non valido');
    }

    const parentCategory = normalizeSlug(normalized.parent_category || '');
    if (parentCategory) {
      normalized.parent_category = parentCategory;
    } else {
      delete normalized.parent_category;
    }
  }

  if (normalized.prezzo !== undefined) {
    const priceValue = String(normalized.prezzo).replace(',', '.').trim();
    const parsedPrice = Number(priceValue);
    if (!Number.isFinite(parsedPrice)) {
      throw new Error('Prezzo non valido');
    }
    normalized.prezzo = parsedPrice.toFixed(2);
  }

  if (normalized.order !== undefined) {
    normalized.order = Number.parseInt(normalized.order, 10) || 0;
  }

  if (collection === 'food' || collection === 'beers' || !['categorie', 'food', 'beers'].includes(collection)) {
    const categories = await loadCategoriesSnapshot(token, owner, repo);

    if (collection === 'food') {
      const match = findCategoryByReference(categories, normalized.category, 'food');
      if (!match) {
        throw new Error('Categoria food non valida');
      }
      normalized.category = match.nome;
      normalized.category_slug = normalizeSlug(match.slug || match.nome);
    } else if (collection === 'beers') {
      const match = findCategoryByReference(categories, normalized.sezione, 'beverage');
      if (!match) {
        throw new Error('Sezione birra non valida');
      }
      normalized.sezione = match.nome;
      normalized.sezione_slug = normalizeSlug(match.slug || match.nome);
    } else {
      const match = findBeverageCategoryByFolder(categories, collection);
      if (match) {
        normalized.tipo_slug = normalizeSlug(match.slug || match.nome);
      }
    }
  }

  const parsed = parseMarkdownFrontmatter(generateMarkdown(normalized));
  validateRequiredFields(collection, parsed || {});
  return parsed || {};
}

function validateRequiredFields(collection, data) {
  const requiredFields = ['nome'];

  if (collection === 'food') {
    requiredFields.push('category', 'prezzo');
  } else if (collection === 'beers') {
    requiredFields.push('sezione', 'prezzo');
  } else if (collection === 'categorie') {
    requiredFields.push('slug', 'tipo_menu');
  } else {
    requiredFields.push('prezzo');
  }

  const missing = requiredFields.filter(field => {
    const value = data[field];
    return value === undefined || value === null || String(value).trim() === '';
  });

  if (missing.length > 0) {
    throw new Error(`Campi obbligatori mancanti: ${missing.join(', ')}`);
  }

  if (collection === 'categorie') {
    if (!['food', 'beverage'].includes(data.tipo_menu)) {
      throw new Error('tipo_menu categoria non valido');
    }
    if (data.parent_category && normalizeSlug(data.parent_category) === normalizeSlug(data.slug)) {
      throw new Error('Una categoria non puo avere se stessa come padre');
    }
  }
}

function getCategoryReferenceAliases(category = {}) {
  const aliases = new Set();
  [category.nome, category.slug, category.folder, getFilenameBase(category._filename)].forEach(value => {
    const normalizedValue = normalizeSlug(value);
    if (normalizedValue) aliases.add(normalizedValue);
  });
  return [...aliases];
}

function matchesCategoryReference(value, aliases = []) {
  const normalizedValue = normalizeSlug(value);
  return normalizedValue ? aliases.includes(normalizedValue) : false;
}

function hasCategoryStructuralChange(previousCategory = {}, nextCategory = {}) {
  return (
    normalizeSlug(previousCategory.nome) !== normalizeSlug(nextCategory.nome) ||
    normalizeSlug(previousCategory.slug) !== normalizeSlug(nextCategory.slug) ||
    normalizeSlug(previousCategory.parent_category) !== normalizeSlug(nextCategory.parent_category) ||
    String(previousCategory.tipo_menu || '') !== String(nextCategory.tipo_menu || '')
  );
}

function buildCategoryDependencyError(actionLabel, category, dependents) {
  const parts = [];
  if (dependents.childCategories.length > 0) parts.push(`${dependents.childCategories.length} sottocategorie`);
  if (dependents.foodItems.length > 0) parts.push(`${dependents.foodItems.length} prodotti food`);
  if (dependents.beerItems.length > 0) parts.push(`${dependents.beerItems.length} birre collegate`);
  if (dependents.beverageItems.length > 0) parts.push(`${dependents.beverageItems.length} bevande collegate`);

  if (parts.length === 0) return null;

  return `Impossibile ${actionLabel} la categoria "${category.nome}": contiene o collega ancora ${parts.join(', ')}. Sposta prima i contenuti collegati.`;
}

async function readRepoFileContent(repoPath, token, owner, repo) {
  const fileData = await githubRequest('GET', `/repos/${owner}/${repo}/contents/${repoPath}`, null, token);
  return Buffer.from(fileData.content, 'base64').toString('utf-8');
}

async function readJsonFileFromRepo(repoPath, token, owner, repo) {
  return JSON.parse(await readRepoFileContent(repoPath, token, owner, repo));
}

function cloneCollectionItems(items = []) {
  return items.map(item => ({ ...item }));
}

async function readCategoryByFilename(filename, token, owner, repo) {
  const content = await readRepoFileContent(`categorie/${filename}`, token, owner, repo);
  const parsed = parseMarkdownFrontmatter(content);
  if (!parsed) return null;
  parsed._filename = filename;
  return parsed;
}

async function loadCategoryDependents(category, token, owner, repo, overrides = {}) {
  const aliases = getCategoryReferenceAliases(category);
  const categories = await readCollectionSnapshot('categorie', token, owner, repo, overrides)
    || await readCollectionFiles('categorie', token, owner, repo, overrides);
  const childCategories = categories.filter(item =>
    item._filename !== category._filename &&
    matchesCategoryReference(item.parent_category, aliases)
  );

  const foodItems = category.tipo_menu === 'food'
    ? ((await readCollectionSnapshot('food', token, owner, repo, overrides))
      || await readCollectionFiles('food', token, owner, repo, overrides))
      .filter(item => matchesCategoryReference(item.category, aliases))
    : [];

  const beerItems = category.tipo_menu === 'beverage'
    ? ((await readCollectionSnapshot('beers', token, owner, repo, overrides))
      || await readCollectionFiles('beers', token, owner, repo, overrides))
      .filter(item => matchesCategoryReference(item.sezione, aliases))
    : [];

  const beverageItems = category.tipo_menu === 'beverage'
    ? ((await readCollectionSnapshot(getCategoryFolder(category), token, owner, repo, overrides))
      || await readCollectionFiles(getCategoryFolder(category), token, owner, repo, overrides))
    : [];

  return { childCategories, foodItems, beerItems, beverageItems };
}

async function assertSafeCategorySave(collection, filename, nextData, sha, token, owner, repo) {
  if (collection !== 'categorie') return;

  const categories = await readCollectionSnapshot('categorie', token, owner, repo)
    || await readCollectionFiles('categorie', token, owner, repo);
  const normalizedNextSlug = normalizeSlug(nextData.slug);
  const nextCategoryCandidate = { ...nextData, _filename: filename };
  const nextFolder = nextData.tipo_menu === 'beverage' ? getCategoryFolder(nextCategoryCandidate) : null;

  const duplicateSlug = categories.find(category =>
    category._filename !== filename &&
    normalizeSlug(category.slug || category.nome) === normalizedNextSlug
  );
  if (duplicateSlug) {
    throw new Error(`Esiste gia una categoria con slug "${nextData.slug}"`);
  }

  if (nextFolder) {
    const duplicateFolder = categories.find(category =>
      category._filename !== filename &&
      category.tipo_menu === 'beverage' &&
      getCategoryFolder(category) === nextFolder
    );
    if (duplicateFolder) {
      throw new Error(`La cartella beverage "${nextFolder}" e gia usata da "${duplicateFolder.nome}"`);
    }
  }

  if (nextData.parent_category) {
    const parent = categories.find(category =>
      category._filename !== filename &&
      normalizeSlug(category.slug || category.nome) === normalizeSlug(nextData.parent_category)
    );
    if (!parent) {
      throw new Error('Categoria padre non trovata');
    }
    if (parent.tipo_menu !== nextData.tipo_menu) {
      throw new Error('La categoria padre deve avere lo stesso tipo_menu');
    }
    if (parent.parent_category) {
      throw new Error('La categoria padre deve essere di primo livello');
    }
  }

  if (!sha) return;

  const currentCategory = categories.find(category => category._filename === filename) || await readCategoryByFilename(filename, token, owner, repo);
  if (!currentCategory || !hasCategoryStructuralChange(currentCategory, nextData)) return;

  const dependents = await loadCategoryDependents(currentCategory, token, owner, repo);
  const dependencyError = buildCategoryDependencyError('modificare', currentCategory, dependents);
  if (dependencyError) {
    throw new Error(dependencyError);
  }
}

async function assertSafeCategoryDelete(collection, filename, token, owner, repo) {
  if (collection !== 'categorie') return;

  const currentCategory = await readCategoryByFilename(filename, token, owner, repo);
  if (!currentCategory) return;

  const dependents = await loadCategoryDependents(currentCategory, token, owner, repo);
  const dependencyError = buildCategoryDependencyError('eliminare', currentCategory, dependents);
  if (dependencyError) {
    throw new Error(dependencyError);
  }
}

function applySaveToCollectionItems(items, filename, data) {
  const nextItems = items.filter(item => item._filename !== filename);
  nextItems.push({ ...data, _filename: filename });
  nextItems.sort((a, b) => (a.order || 0) - (b.order || 0));
  return nextItems;
}

function applyDeleteToCollectionItems(items, filename) {
  return items
    .filter(item => item._filename !== filename)
    .sort((a, b) => (a.order || 0) - (b.order || 0));
}

async function getBranchContext(token, owner, repo, branch = 'main') {
  const branchInfo = await githubRequest('GET', `/repos/${owner}/${repo}/branches/${branch}`, null, token);
  return {
    branch,
    latestCommitSha: branchInfo.commit.sha,
    baseTreeSha: branchInfo.commit.commit.tree.sha
  };
}

async function createCommitFromEntries({ token, owner, repo, message, treeEntries, branch = 'main' }) {
  if (!treeEntries.length) {
    throw new Error('Nessuna modifica da salvare');
  }

  const branchContext = await getBranchContext(token, owner, repo, branch);
  const newTree = await githubRequest(
    'POST',
    `/repos/${owner}/${repo}/git/trees`,
    { base_tree: branchContext.baseTreeSha, tree: treeEntries },
    token
  );

  const newCommit = await githubRequest(
    'POST',
    `/repos/${owner}/${repo}/git/commits`,
    {
      message,
      tree: newTree.sha,
      parents: [branchContext.latestCommitSha]
    },
    token
  );

  await githubRequest(
    'PATCH',
    `/repos/${owner}/${repo}/git/refs/heads/${branch}`,
    { sha: newCommit.sha },
    token
  );

  return newCommit;
}

async function resolveCollectionConfig(collection, token, owner, repo, overrides = {}) {
  let config = COLLECTION_CONFIG[collection];

  if (!config) {
    const categories = await readCollectionSnapshot('categorie', token, owner, repo, overrides)
      || await readCollectionFiles('categorie', token, owner, repo, overrides);
    const matchedCategory = findBeverageCategoryByFolder(categories, collection);
    if (matchedCategory) {
      config = {
        jsonPath: 'beverages/beverages.json',
        type: 'beverages',
        folder: getCategoryFolder(matchedCategory),
        name: matchedCategory.nome
      };
      console.log(`📦 Dynamic beverage folder detected: ${config.folder} → "${matchedCategory.nome}"`);
    }
  }

  return config || null;
}

async function readCollectionSnapshot(collection, token, owner, repo, overrides = {}) {
  if (Object.prototype.hasOwnProperty.call(overrides, collection)) {
    return cloneCollectionItems(overrides[collection] || []);
  }

  const config = await resolveCollectionConfig(collection, token, owner, repo, overrides);
  if (!config) return null;

  try {
    const jsonData = await readJsonFileFromRepo(config.jsonPath, token, owner, repo);

    if (config.type === 'food') {
      return cloneCollectionItems(jsonData.food || []);
    }
    if (config.type === 'beers') {
      return cloneCollectionItems(jsonData.beers || []);
    }
    if (config.type === 'categories') {
      return cloneCollectionItems(jsonData.categories || []);
    }
    if (config.type === 'beverages') {
      return cloneCollectionItems((jsonData.beverages || []).filter(item => item.tipo === config.name));
    }
  } catch (error) {
    console.log(`⚠️ Snapshot fallback to markdown for ${collection}: ${error.message}`);
  }

  return null;
}

async function generateJSONForConfig(config, token, owner, repo, overrides = {}) {
  if (!config) return null;

  if (config.type === 'food') {
    return generateFoodJSON(token, owner, repo, overrides);
  }
  if (config.type === 'beers') {
    return generateBeersJSON(token, owner, repo, overrides);
  }
  if (config.type === 'categories') {
    return generateCategoriesJSON(token, owner, repo, overrides);
  }
  if (config.type === 'beverages') {
    const incremental = await generateIncrementalBeveragesJSON(config, token, owner, repo, overrides);
    if (incremental) return incremental;
    return generateBeveragesJSON(token, owner, repo, overrides);
  }

  return null;
}

async function buildJsonTreeEntry(collection, token, owner, repo, overrides = {}) {
  const config = await resolveCollectionConfig(collection, token, owner, repo, overrides);
  if (!config) return null;

  const jsonContent = await generateJSONForConfig(config, token, owner, repo, overrides);
  if (!jsonContent) return null;

  return {
    path: config.jsonPath,
    mode: '100644',
    type: 'blob',
    content: JSON.stringify(jsonContent, null, 2)
  };
}

async function generateIncrementalBeveragesJSON(config, token, owner, repo, overrides = {}) {
  if (!config?.folder || !Object.prototype.hasOwnProperty.call(overrides, config.folder)) {
    return null;
  }

  const displayName = config.name || BASE_BEVERAGE_CATEGORIES.find(category => category.folder === config.folder)?.name;
  if (!displayName) {
    return null;
  }

  try {
    const currentJson = JSON.parse(await readRepoFileContent(config.jsonPath, token, owner, repo));
    const currentByType = { ...(currentJson.beveragesByType || {}) };
    const updatedItems = (overrides[config.folder] || [])
      .map(item => ({ ...item, tipo: displayName }))
      .sort((a, b) => (a.order || 0) - (b.order || 0));

    if (updatedItems.length > 0) {
      currentByType[displayName] = updatedItems;
    } else {
      delete currentByType[displayName];
    }

    const orderedKeys = Object.keys(currentJson.beveragesByType || {});
    if (updatedItems.length > 0 && !orderedKeys.includes(displayName)) {
      orderedKeys.push(displayName);
    }

    const nextByType = {};
    orderedKeys.forEach(key => {
      if (currentByType[key]?.length) {
        nextByType[key] = currentByType[key];
      }
    });

    Object.keys(currentByType).forEach(key => {
      if (!nextByType[key] && currentByType[key]?.length) {
        nextByType[key] = currentByType[key];
      }
    });

    const beverages = [];
    Object.values(nextByType).forEach(items => beverages.push(...items));

    return {
      beverages,
      beveragesByType: nextByType
    };
  } catch (error) {
    console.log(`⚠️ Fallback full beverages regen: ${error.message}`);
    return null;
  }
}

async function saveItemAtomically({ collection, filename, data, sha, token, owner, repo }) {
  const existingItems = await readCollectionSnapshot(collection, token, owner, repo)
    || await readCollectionFiles(collection, token, owner, repo);
  const fileExists = existingItems.some(item => item._filename === filename);

  if (!sha && fileExists) {
    throw new Error('GitHub API error: 422 - File already exists');
  }
  if (sha && !fileExists) {
    throw new Error('File non trovato per aggiornamento');
  }

  const updatedItems = applySaveToCollectionItems(existingItems, filename, data);
  const fileContent = generateMarkdown(data);
  const fileSha = calculateGitBlobSha(fileContent);
  const treeEntries = [
    {
      path: `${collection}/${filename}`,
      mode: '100644',
      type: 'blob',
      content: fileContent
    }
  ];

  const jsonEntry = await buildJsonTreeEntry(collection, token, owner, repo, {
    [collection]: updatedItems
  });
  if (jsonEntry) {
    treeEntries.push(jsonEntry);
  }

  const commit = await createCommitFromEntries({
    token,
    owner,
    repo,
    message: `CMS: Update ${collection}/${filename}`,
    treeEntries
  });

  return {
    sha: fileSha,
    content: { sha: fileSha },
    commit
  };
}

async function deleteItemAtomically({ collection, filename, token, owner, repo }) {
  const existingItems = await readCollectionSnapshot(collection, token, owner, repo)
    || await readCollectionFiles(collection, token, owner, repo);
  const fileExists = existingItems.some(item => item._filename === filename);
  if (!fileExists) {
    throw new Error('File non trovato per eliminazione');
  }

  const updatedItems = applyDeleteToCollectionItems(existingItems, filename);
  const treeEntries = [
    {
      path: `${collection}/${filename}`,
      mode: '100644',
      type: 'blob',
      sha: null
    }
  ];

  const jsonEntry = await buildJsonTreeEntry(collection, token, owner, repo, {
    [collection]: updatedItems
  });
  if (jsonEntry) {
    treeEntries.push(jsonEntry);
  }

  return createCommitFromEntries({
    token,
    owner,
    repo,
    message: `CMS: Delete ${collection}/${filename}`,
    treeEntries
  });
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
  // Beverage collections derived from BEVERAGE_CATEGORIES constant
  ...Object.fromEntries(BASE_BEVERAGE_CATEGORIES.map(c => [
    c.folder, { jsonPath: 'beverages/beverages.json', type: 'beverages', folder: c.folder, name: c.name }
  ]))
};

async function regenerateJSON(collection, token, owner, repo) {
  const config = await resolveCollectionConfig(collection, token, owner, repo);
  if (!config) {
    console.log(`⚠️ Collection ${collection} non configurata per rigenerazione JSON`);
    return;
  }

  const jsonContent = await generateJSONForConfig(config, token, owner, repo);
  if (jsonContent) {
    await commitJSON(config.jsonPath, jsonContent, token, owner, repo);
    console.log(`✅ JSON rigenerato: ${config.jsonPath}`);
  }
}

// Legge tutti i file .md di una collection
async function readCollectionFiles(folder, token, owner, repo, overrides = {}) {
  if (Object.prototype.hasOwnProperty.call(overrides, folder)) {
    return (overrides[folder] || []).map(item => ({ ...item }));
  }

  try {
    const url = `/repos/${owner}/${repo}/contents/${folder}`;
    const files = await githubRequest('GET', url, null, token);

    if (!Array.isArray(files)) return [];

    const mdFiles = files.filter(f => f.name.endsWith('.md') && f.name !== '.gitkeep');

    // Read all files in parallel for speed (avoids Netlify function timeout)
    const results = await Promise.all(mdFiles.map(async (file) => {
      try {
        const fileData = await githubRequest('GET', `/repos/${owner}/${repo}/contents/${folder}/${file.name}`, null, token);
        const content = Buffer.from(fileData.content, 'base64').toString('utf-8');
        const parsed = parseFrontmatter(content);
        if (parsed) {
          parsed._filename = file.name;
          return parsed;
        }
      } catch (e) {
        console.error(`Errore lettura ${file.name}:`, e.message);
      }
      return null;
    }));

    return results.filter(Boolean);
  } catch (e) {
    console.error(`Errore lettura collection ${folder}:`, e.message);
    return [];
  }
}

// Parsifica il frontmatter YAML dal markdown
function parseMarkdownFrontmatter(content) {
  return parseFrontmatter(content);
}

// ========================================
// GENERATORI JSON SPECIFICI
// ========================================

async function generateFoodJSON(token, owner, repo, overrides = {}) {
  const useSnapshots = Object.keys(overrides).length > 0;
  // Carica anche le categorie per l'ordine
  const categories = useSnapshots
    ? (await readCollectionSnapshot('categorie', token, owner, repo, overrides))
      || await readCollectionFiles('categorie', token, owner, repo, overrides)
    : await readCollectionFiles('categorie', token, owner, repo, overrides);
  const foodCategories = categories.filter(c => c.tipo_menu === 'food' && c.visibile !== false);

  const foodItems = useSnapshots
    ? (await readCollectionSnapshot('food', token, owner, repo, overrides))
      || await readCollectionFiles('food', token, owner, repo, overrides)
    : await readCollectionFiles('food', token, owner, repo, overrides);

  foodItems.forEach(item => {
    const match = findCategoryByReference(foodCategories, item.category, 'food');
    if (match) {
      item.category = match.nome;
      item.category_slug = normalizeSlug(item.category_slug || match.slug || match.nome);
    } else if (item.category_slug) {
      item.category_slug = normalizeSlug(item.category_slug);
    }
  });

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

async function generateBeersJSON(token, owner, repo, overrides = {}) {
  const useSnapshots = Object.keys(overrides).length > 0;
  const beers = useSnapshots
    ? (await readCollectionSnapshot('beers', token, owner, repo, overrides))
      || await readCollectionFiles('beers', token, owner, repo, overrides)
    : await readCollectionFiles('beers', token, owner, repo, overrides);

  const beverageCategories = await (useSnapshots
    ? loadCategoriesSnapshot(token, owner, repo)
    : readCollectionFiles('categorie', token, owner, repo, overrides));

  beers.forEach(beer => {
    const match = findCategoryByReference(beverageCategories, beer.sezione, 'beverage');
    if (match) {
      beer.sezione = match.nome;
      beer.sezione_slug = normalizeSlug(beer.sezione_slug || match.slug || match.nome);
    } else if (beer.sezione_slug) {
      beer.sezione_slug = normalizeSlug(beer.sezione_slug);
    }
  });

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

async function generateCategoriesJSON(token, owner, repo, overrides = {}) {
  const categories = await readCollectionFiles('categorie', token, owner, repo, overrides);

  // Ordina (NON FILTRARE VISIBILI: il CMS deve vederle tutte!)
  const allCategories = categories
    .sort((a, b) => (a.order || 0) - (b.order || 0));

  return {
    categories: allCategories,
    foodCategories: allCategories.filter(c => c.tipo_menu === 'food'),
    beverageCategories: allCategories.filter(c => c.tipo_menu === 'beverage')
  };
}

async function generateBeveragesJSON(token, owner, repo, overrides = {}) {
  const useSnapshots = Object.keys(overrides).length > 0;
  // Build the full list of beverage folders: hardcoded + dynamic from categories
  const knownFolders = new Set(BASE_BEVERAGE_CATEGORIES.map(c => c.folder));
  const allBeverageFolders = [...BASE_BEVERAGE_CATEGORIES];

  // Discover dynamic beverage folders from categorie collection
  try {
    const categories = useSnapshots
      ? (await readCollectionSnapshot('categorie', token, owner, repo, overrides))
        || await readCollectionFiles('categorie', token, owner, repo, overrides)
      : await readCollectionFiles('categorie', token, owner, repo, overrides);
    const beverageCats = categories.filter(c => c.tipo_menu === 'beverage');
    for (const cat of beverageCats) {
      const folder = getCategoryFolder(cat);
      if (folder && !knownFolders.has(folder)) {
        allBeverageFolders.push({ name: cat.nome, folder, slug: normalizeSlug(cat.slug || cat.nome) });
        knownFolders.add(folder);
        console.log(`📦 Dynamic beverage folder discovered: ${folder} → "${cat.nome}"`);
      }
    }
  } catch (e) {
    console.error('Error discovering dynamic beverage folders:', e.message);
  }

  const beveragesByType = {};
  const allBeverages = [];

  for (const category of allBeverageFolders) {
    let items;
    try {
      items = useSnapshots
        ? (await readCollectionSnapshot(category.folder, token, owner, repo, overrides))
          || await readCollectionFiles(category.folder, token, owner, repo, overrides)
        : await readCollectionFiles(category.folder, token, owner, repo, overrides);
    } catch (e) {
      // Folder may not exist yet (no products added) — skip gracefully
      console.log(`⏭️ Beverage folder "${category.folder}" not found or empty, skipping`);
      continue;
    }

    // Aggiungi il tipo a ogni item
    items.forEach(item => {
      item.tipo = category.name;
      item.tipo_slug = normalizeSlug(item.tipo_slug || category.slug || category.folder || category.name);
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
