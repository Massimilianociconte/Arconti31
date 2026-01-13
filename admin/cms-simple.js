/* ========================================
   ARCONTI31 CMS - CON UPLOAD IMMAGINI
   Sincronizzazione diretta con GitHub
   Upload immagini via Cloudinary
   ======================================== */

const CONFIG = {
  owner: 'Massimilianociconte',
  repo: 'Arconti31',
  branch: 'main',
  // Cloudinary config - GRATUITO fino a 25GB
  cloudinary: {
    cloudName: '', // Da configurare
    uploadPreset: '' // Da configurare
  }
};

const DEFAULT_FOOD_CATEGORIES = [
  'Hamburger di bufala', 'Hamburger Fassona e Street food', 'OKTOBERFEST',
  'Panini', 'Griglieria', 'Piatti Speciali', 'Piadine', 'Fritti', 'Dolci', 'Aperitivo'
];

const COLLECTIONS = {
  food: {
    label: 'Piatti',
    folder: 'food',
    groupByCategory: true,
    fields: [
      { name: 'nome', label: 'Nome Piatto', type: 'text', required: true },
      { name: 'category', label: 'Categoria', type: 'dynamic-select', categoryType: 'food' },
      { name: 'prezzo', label: 'Prezzo (€)', type: 'text', required: true },
      { name: 'descrizione', label: 'Descrizione', type: 'textarea' },
      { name: 'immagine_copertina', label: 'Immagine Copertina', type: 'image', hint: 'Immagine grande del piatto' },
      { name: 'immagine_avatar', label: 'Immagine Avatar', type: 'image', hint: 'Icona piccola (opzionale)' },
      { name: 'allergeni', label: 'Allergeni', type: 'tags', options: ['Glutine', 'Crostacei', 'Uova', 'Pesce', 'Arachidi', 'Soia', 'Latte', 'Frutta a guscio', 'Sedano', 'Senape', 'Sesamo', 'Anidride solforosa e solfiti', 'Lupini', 'Molluschi'] },
      { name: 'tags', label: 'Tag Speciali', type: 'tags', options: ['Novità', 'Vegetariano', 'Vegano', 'Piccante', 'Più venduto', 'Specialità'] },
      { name: 'disponibile', label: 'Disponibile', type: 'toggle', default: true },
      { name: 'order', label: 'Ordine', type: 'number', default: 0 }
    ]
  },
  beers: {
    label: 'Birre',
    folder: 'beers',
    fields: [
      { name: 'nome', label: 'Nome Birra', type: 'text', required: true },
      { name: 'sezione', label: 'Sezione', type: 'select', options: ['Birre artigianali alla spina a rotazione', 'Birre alla spina', 'Birre speciali in bottiglia', 'Frigo Birre'] },
      { name: 'prezzo', label: 'Prezzo (€)', type: 'text', required: true },
      { name: 'descrizione', label: 'Descrizione', type: 'textarea' },
      { name: 'immagine_copertina', label: 'Immagine Copertina', type: 'image' },
      { name: 'immagine_avatar', label: 'Logo/Avatar', type: 'image' },
      { name: 'formato', label: 'Formato', type: 'text', hint: 'Es: 50cl' },
      { name: 'gradazione', label: 'Gradazione (%)', type: 'text' },
      { name: 'disponibile', label: 'Disponibile', type: 'toggle', default: true },
      { name: 'order', label: 'Ordine', type: 'number', default: 0 }
    ]
  },
  cocktails: {
    label: 'Cocktails',
    folder: 'cocktails',
    fields: [
      { name: 'nome', label: 'Nome', type: 'text', required: true },
      { name: 'prezzo', label: 'Prezzo (€)', type: 'text', required: true },
      { name: 'descrizione', label: 'Descrizione', type: 'textarea' },
      { name: 'immagine_copertina', label: 'Immagine Copertina', type: 'image' },
      { name: 'immagine_avatar', label: 'Avatar', type: 'image' },
      { name: 'disponibile', label: 'Disponibile', type: 'toggle', default: true },
      { name: 'order', label: 'Ordine', type: 'number', default: 0 }
    ]
  },
  analcolici: {
    label: 'Analcolici',
    folder: 'analcolici',
    fields: [
      { name: 'nome', label: 'Nome', type: 'text', required: true },
      { name: 'prezzo', label: 'Prezzo (€)', type: 'text', required: true },
      { name: 'descrizione', label: 'Descrizione', type: 'textarea' },
      { name: 'immagine_copertina', label: 'Immagine Copertina', type: 'image' },
      { name: 'immagine_avatar', label: 'Avatar', type: 'image' },
      { name: 'disponibile', label: 'Disponibile', type: 'toggle', default: true },
      { name: 'order', label: 'Ordine', type: 'number', default: 0 }
    ]
  },
  bibite: {
    label: 'Bibite',
    folder: 'bibite',
    fields: [
      { name: 'nome', label: 'Nome', type: 'text', required: true },
      { name: 'prezzo', label: 'Prezzo (€)', type: 'text', required: true },
      { name: 'descrizione', label: 'Descrizione', type: 'textarea' },
      { name: 'immagine_copertina', label: 'Immagine Copertina', type: 'image' },
      { name: 'disponibile', label: 'Disponibile', type: 'toggle', default: true },
      { name: 'order', label: 'Ordine', type: 'number', default: 0 }
    ]
  },
  caffetteria: {
    label: 'Caffetteria',
    folder: 'caffetteria',
    fields: [
      { name: 'nome', label: 'Nome', type: 'text', required: true },
      { name: 'prezzo', label: 'Prezzo (€)', type: 'text', required: true },
      { name: 'descrizione', label: 'Descrizione', type: 'textarea' },
      { name: 'immagine_copertina', label: 'Immagine Copertina', type: 'image' },
      { name: 'disponibile', label: 'Disponibile', type: 'toggle', default: true },
      { name: 'order', label: 'Ordine', type: 'number', default: 0 }
    ]
  },
  bollicine: {
    label: 'Bollicine',
    folder: 'bollicine',
    fields: [
      { name: 'nome', label: 'Nome', type: 'text', required: true },
      { name: 'prezzo', label: 'Prezzo (€)', type: 'text', required: true },
      { name: 'descrizione', label: 'Descrizione', type: 'textarea' },
      { name: 'immagine_copertina', label: 'Immagine', type: 'image' },
      { name: 'formato', label: 'Formato', type: 'text' },
      { name: 'disponibile', label: 'Disponibile', type: 'toggle', default: true },
      { name: 'order', label: 'Ordine', type: 'number', default: 0 }
    ]
  },
  'bianchi-fermi': {
    label: 'Vini Bianchi',
    folder: 'bianchi-fermi',
    fields: [
      { name: 'nome', label: 'Nome', type: 'text', required: true },
      { name: 'prezzo', label: 'Prezzo (€)', type: 'text', required: true },
      { name: 'descrizione', label: 'Descrizione', type: 'textarea' },
      { name: 'immagine_copertina', label: 'Immagine', type: 'image' },
      { name: 'formato', label: 'Formato', type: 'text' },
      { name: 'disponibile', label: 'Disponibile', type: 'toggle', default: true },
      { name: 'order', label: 'Ordine', type: 'number', default: 0 }
    ]
  },
  'vini-rossi': {
    label: 'Vini Rossi',
    folder: 'vini-rossi',
    fields: [
      { name: 'nome', label: 'Nome', type: 'text', required: true },
      { name: 'prezzo', label: 'Prezzo (€)', type: 'text', required: true },
      { name: 'descrizione', label: 'Descrizione', type: 'textarea' },
      { name: 'immagine_copertina', label: 'Immagine', type: 'image' },
      { name: 'formato', label: 'Formato', type: 'text' },
      { name: 'disponibile', label: 'Disponibile', type: 'toggle', default: true },
      { name: 'order', label: 'Ordine', type: 'number', default: 0 }
    ]
  },
  categorie: {
    label: 'Categorie',
    folder: 'categorie',
    fields: [
      { name: 'nome', label: 'Nome Categoria', type: 'text', required: true },
      { name: 'slug', label: 'Slug', type: 'text', required: true, hint: 'ID univoco', autoSlug: true },
      { name: 'tipo_menu', label: 'Tipo Menù', type: 'select', options: ['food', 'beverage'], required: true },
      { name: 'icona', label: 'Icona', type: 'text', hint: 'Es: 🍔 🍺' },
      { name: 'immagine', label: 'Immagine Sfondo', type: 'image', hint: 'Sfondo della card categoria' },
      { name: 'descrizione', label: 'Descrizione', type: 'textarea' },
      { name: 'visibile', label: 'Visibile', type: 'toggle', default: true },
      { name: 'order', label: 'Ordine', type: 'number', default: 0 }
    ]
  }
};


// State
let state = {
  token: null,
  email: null,
  isLoggedIn: false,
  currentCollection: 'food',
  currentCategory: null,
  currentBeerSection: null,
  items: [],
  categories: [],
  allFood: [],
  allItems: {}, // Cache for global search
  currentItem: null,
  isNew: false,
  cloudinaryConfigured: false,
  searchTimeout: null,
  globalSearchTimeout: null,
  categoryFilters: { tipo: null, image: null },
  selectedItems: [] // For bulk selection
};

// DOM helpers
const $ = sel => document.querySelector(sel);
const $$ = sel => document.querySelectorAll(sel);

// ========================================
// GESTIONE PREZZI (Sanitizzazione & Formattazione)
// ========================================

/**
 * Sanitizza l'input del prezzo: accetta sia punto che virgola come separatore decimale
 * Normalizza al formato con punto per salvataggio (es: "14,50" o "14.50" -> "14.50")
 * @param {string} input - L'input dell'utente
 * @returns {string} - Prezzo normalizzato con punto (es: "14.50")
 */
function sanitizePrice(input) {
  if (!input) return '';

  // Converti in stringa e rimuovi spazi
  let value = String(input).trim();

  // Rimuovi eventuali simboli di valuta
  value = value.replace(/[€$]/g, '').trim();

  // Gestione formato italiano: 1.234,50 -> 1234.50
  // Se contiene sia punto che virgola, il punto è separatore migliaia
  if (value.includes('.') && value.includes(',')) {
    value = value.replace(/\./g, ''); // Rimuovi punti (migliaia)
    value = value.replace(',', '.'); // Virgola diventa punto decimale
  } else {
    // Altrimenti sostituisci semplicemente virgola con punto
    value = value.replace(',', '.');
  }

  // Rimuovi caratteri non validi
  value = value.replace(/[^\d.]/g, '');

  // Parsa e riformatta per garantire max 2 decimali
  const num = parseFloat(value);
  if (isNaN(num)) return '';

  // Ritorna con sempre 2 decimali
  return num.toFixed(2);
}

/**
 * Formatta un prezzo per la visualizzazione nel CMS (formato italiano)
 * @param {string|number} price - Il prezzo
 * @returns {string} - Prezzo formattato (es: "14,50")
 */
function formatPriceDisplay(price) {
  if (price === undefined || price === null || price === '') return '0,00';

  let normalized = String(price).replace(',', '.');
  const num = parseFloat(normalized);
  if (isNaN(num)) return '0,00';

  return new Intl.NumberFormat('it-IT', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(num);
}

// Init
document.addEventListener('DOMContentLoaded', init);

async function init() {
  // Init SmartCache
  if (window.SmartCache) {
    await window.SmartCache.init();
    // Subscribe to updates
    window.SmartCache.subscribe(async (changes) => {
      console.log('🔄 SmartCache update received:', changes);
      if (changes.collection === state.currentCollection) {
        // Refresh current view from CACHE ONLY (no network)
        const cachedItems = await window.SmartCache.getAll('items');
        const collectionItems = cachedItems.filter(i => i._collection === state.currentCollection);
        if (collectionItems.length > 0) {
          state.items = collectionItems.sort((a, b) => (a.order || 0) - (b.order || 0));
          renderItems();
        }
      }
      // Refresh sidebar counts if food changed
      if (changes.collection === 'food') {
        // Update sidebar counts from cache
        const cachedItems = await window.SmartCache.getAll('items');
        state.allFood = cachedItems.filter(i => i._collection === 'food' && !i._deleted);
        renderSidebar();
        setupSidebarEvents(); // Re-attach events after re-render
      }
    });
  }

  await checkCloudinaryConfig();
  setupEventListeners();

  // Check for saved session (Ricordami)
  const savedSession = localStorage.getItem('cms_session');
  if (savedSession) {
    try {
      const session = JSON.parse(savedSession);
      const res = await fetch('/.netlify/functions/save-data', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'verify-token', token: session.token })
      });
      if (res.ok) {
        state.token = session.token;
        state.email = session.email;
        state.isLoggedIn = true;
        state.currentCollection = session.lastCollection || 'food';
        showMainApp();
        loadAllData();
        toast('Bentornato!', 'success');
        return;
      } else {
        // Token expired or invalid - clear session silently
        console.log('🔄 Sessione scaduta, richiesto nuovo login');
        localStorage.removeItem('cms_session');
      }
    } catch (e) {
      // Network error or parse error - clear session
      console.log('🔄 Errore verifica sessione, richiesto nuovo login');
      localStorage.removeItem('cms_session');
    }
  }

  showLoginScreen();
}

async function checkCloudinaryConfig() {
  try {
    const res = await fetch('/.netlify/functions/save-data', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'get-cloudinary-config' })
    });
    if (res.ok) {
      const data = await res.json();
      if (data.cloudName && data.uploadPreset) {
        CONFIG.cloudinary.cloudName = data.cloudName;
        CONFIG.cloudinary.uploadPreset = data.uploadPreset;
        state.cloudinaryConfigured = true;
        console.log('✅ Cloudinary configurato:', data.cloudName);
      } else {
        console.log('⚠️ Cloudinary non configurato - usa URL immagini');
      }
    }
  } catch (e) {
    console.log('⚠️ Cloudinary non disponibile - usa URL immagini');
  }
}

function setupEventListeners() {
  $('#login-form').addEventListener('submit', handleLogin);
  $('#menu-toggle').addEventListener('click', toggleSidebar);
  // Sidebar events are set up dynamically in setupSidebarEvents()
  $('#add-new-btn').addEventListener('click', createNew);
  $('#back-btn').addEventListener('click', showListView);
  $('#save-btn').addEventListener('click', saveItem);
  $('#delete-btn').addEventListener('click', deleteItem);
  $('#sync-btn').addEventListener('click', () => {
    loadAllData();
  });
  $('#logout-btn').addEventListener('click', logout);

  // Search with live suggestions
  $('#search-input').addEventListener('input', handleSearchInput);
  $('#search-input').addEventListener('keydown', handleSearchKeydown);
  $('#search-input').addEventListener('focus', () => {
    if ($('#search-input').value.length >= 2) showSearchSuggestions();
  });
  $('#search-clear').addEventListener('click', clearSearch);

  // Close suggestions when clicking outside
  document.addEventListener('click', (e) => {
    if (!e.target.closest('.search-wrapper')) {
      hideSearchSuggestions();
    }
  });

  $('#filter-category').addEventListener('change', filterItems);
  $('#filter-status').addEventListener('change', filterItems);

  // Category filters (for Categorie section)
  document.querySelectorAll('.filter-chip').forEach(chip => {
    chip.addEventListener('click', () => toggleCategoryFilter(chip));
  });
  $('#filters-reset')?.addEventListener('click', resetCategoryFilters);

  // Global search in navbar
  setupGlobalSearch();
}


// ========================================
// AUTH
// ========================================

async function handleLogin(e) {
  e.preventDefault();
  const email = $('#email-input').value.trim();
  const password = $('#password-input').value;

  if (!email) { toast('Inserisci email', 'error'); return; }
  if (!password) { toast('Inserisci password', 'error'); return; }

  showLoading();

  try {
    const res = await fetch('/.netlify/functions/save-data', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'login',
        email: email,
        password: password
      })
    });

    const result = await res.json();

    if (!res.ok) {
      throw new Error(result.error || 'Errore login');
    }

    // Store token
    state.token = result.token;
    state.email = result.email;
    state.isLoggedIn = true;

    // Salva sempre la sessione (per evitare logout al refresh)
    // "Ricordami" controlla solo la durata del token lato server
    localStorage.setItem('cms_session', JSON.stringify({
      token: result.token,
      email: result.email,
      lastCollection: state.currentCollection
    }));

    toast('Accesso effettuato!', 'success');
    showMainApp();
    loadAllData();
  } catch (e) {
    console.error(e);
    toast(e.message || 'Errore login', 'error');
  } finally {
    hideLoading();
  }
}

function logout() {
  state.token = null;
  state.email = null;
  state.isLoggedIn = false;
  localStorage.removeItem('cms_session');
  showLoginScreen();
  toast('Logout effettuato', 'info');
}

// ========================================
// UI
// ========================================

function showLoginScreen() {
  $('#login-screen').classList.add('active');
  $('#main-app').classList.remove('active');
}

function showMainApp() {
  $('#login-screen').classList.remove('active');
  $('#main-app').classList.add('active');
}

function showListView() {
  $('#list-view').classList.add('active');
  $('#edit-view').classList.remove('active');
}

function showEditView() {
  $('#list-view').classList.remove('active');
  $('#edit-view').classList.add('active');
}

function toggleSidebar() {
  $('#sidebar').classList.toggle('open');
  let overlay = $('.sidebar-overlay');
  if (!overlay) {
    overlay = document.createElement('div');
    overlay.className = 'sidebar-overlay';
    overlay.addEventListener('click', closeSidebar);
    document.body.appendChild(overlay);
  }
  overlay.classList.toggle('active');
}

function closeSidebar() {
  $('#sidebar').classList.remove('open');
  const overlay = $('.sidebar-overlay');
  if (overlay) overlay.classList.remove('active');
}

function showLoading() { $('#loading-overlay').classList.add('active'); }
function hideLoading() { $('#loading-overlay').classList.remove('active'); }

function toast(message, type = 'info') {
  const container = $('#toast-container');
  const t = document.createElement('div');
  t.className = `toast ${type}`;
  t.textContent = message;
  container.appendChild(t);
  setTimeout(() => t.remove(), 3000);
}


// ========================================
// DATA LOADING (via Netlify Function to avoid rate limits)
// ========================================

async function loadCategories() {
  try {
    const res = await fetch('/.netlify/functions/read-data', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ folder: 'categorie' })
    });

    if (!res.ok) { state.categories = []; return; }

    const data = await res.json();
    // Usa parsedItem se disponibile (da JSON), altrimenti parse markdown
    const categories = data.items.map(item =>
      item.parsedItem
        ? { ...item.parsedItem, filename: item.filename, sha: item.sha }
        : parseMarkdown(item.content, item.filename, item.sha)
    );
    // Nel CMS mostra TUTTE le categorie (anche nascoste), ordinate
    state.categories = categories.sort((a, b) => (a.order || 0) - (b.order || 0));
  } catch (e) {
    console.error('Error loading categories:', e);
    state.categories = [];
  }
}

async function loadItems(collectionName, silent = false, forceApi = false) {
  if (!silent) showLoading();
  const collection = COLLECTIONS[collectionName];
  try {
    // 1. Try SmartCache first (instant load)
    if (window.SmartCache && !forceApi) {
      const cachedItems = await window.SmartCache.getAll('items');
      const collectionItems = cachedItems.filter(i => i._collection === collectionName);

      if (collectionItems.length > 0) {
        console.log(`⚡ Loaded ${collectionItems.length} items from SmartCache`);
        state.items = collectionItems.sort((a, b) => (a.order || 0) - (b.order || 0));
        renderItems();
        if (!silent) hideLoading();
        // Continue to fetch fresh data in background...
        silent = true;
      }
    }

    // Se forceApi=true, usa API GitHub per avere dati freschi (dopo salvataggio)
    const requestBody = { folder: collection.folder };
    if (forceApi) {
      requestBody.mode = 'api';
    }

    const res = await fetch('/.netlify/functions/read-data', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(requestBody)
    });

    if (!res.ok) throw new Error('Errore caricamento');

    const data = await res.json();
    // Usa parsedItem se disponibile (da JSON), altrimenti parse markdown
    const items = data.items.map(item =>
      item.parsedItem
        ? { ...item.parsedItem, filename: item.filename, sha: item.sha }
        : parseMarkdown(item.content, item.filename, item.sha)
    );
    state.items = items.sort((a, b) => (a.order || 0) - (b.order || 0));

    // Update SmartCache with fresh data
    if (window.SmartCache) {
      // Sync remote items (which might be stale) with cache
      // If cache has fresher local writes, they will be preserved
      await window.SmartCache.syncCollection(state.items, collectionName, forceApi ? 'live' : 'static');

      // Now get the authoritative list from cache
      const cachedItems = await window.SmartCache.getAll('items');
      state.items = cachedItems
        .filter(i => i._collection === collectionName && !i._deleted)
        .sort((a, b) => (a.order || 0) - (b.order || 0));

      console.log('🔄 SmartCache synced & loaded. Items:', state.items.length);
    }

    renderItems();
  } catch (e) {
    console.error(e);
    if (!silent) toast('Errore nel caricamento', 'error');
  } finally {
    if (!silent) hideLoading();
  }
}

function parseMarkdown(content, filename, sha) {
  const match = content.match(/---\r?\n([\s\S]*?)\r?\n---/);
  if (!match) return { filename, sha };
  const data = { filename, sha };
  let currentKey = null, inArray = false, arrayValues = [];
  match[1].split('\n').forEach(line => {
    line = line.replace(/\r$/, '');
    if (line.startsWith('  - ')) {
      arrayValues.push(line.replace('  - ', '').replace(/"/g, '').trim());
    } else if (line.includes(':')) {
      if (currentKey && inArray) { data[currentKey] = arrayValues; arrayValues = []; inArray = false; }
      const [key, ...rest] = line.split(':');
      const value = rest.join(':').trim();
      currentKey = key.trim();
      if (value === '') { inArray = true; }
      else {
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
// COLLECTION & RENDERING
// ========================================

function selectCollection(name, categoryFilter = null, beerSection = null) {
  state.currentCollection = name;
  state.currentCategory = categoryFilter;
  state.currentBeerSection = beerSection;
  // Set title based on context
  let title = COLLECTIONS[name].label;
  if (beerSection) {
    title = beerSection;
  } else if (categoryFilter) {
    title = categoryFilter;
  }
  $('#collection-title').textContent = title;
  updateCategoryFilter(name);
  if (categoryFilter) {
    $('#filter-category').value = categoryFilter;
  }

  // Show/hide category-specific filters
  const catFilters = $('#category-filters');
  if (catFilters) {
    catFilters.style.display = name === 'categorie' ? 'flex' : 'none';
  }

  // Reset category filters when switching
  if (name !== 'categorie') {
    state.categoryFilters = { tipo: null, image: null };
    $$('.filter-chip').forEach(c => c.classList.remove('active'));
  }

  // Save last collection for session restore
  const savedSession = localStorage.getItem('cms_session');
  if (savedSession) {
    try {
      const session = JSON.parse(savedSession);
      session.lastCollection = name;
      localStorage.setItem('cms_session', JSON.stringify(session));
    } catch (e) { }
  }

  loadItems(name);
  showListView();
}

// ========================================
// SIDEBAR TREE
// ========================================

async function loadAllData(silent = false) {
  if (!silent) showLoading();
  try {
    // Load categories first
    await loadCategories();

    // Load all food items for tree counts (usa JSON, no API)
    const res = await fetch('/.netlify/functions/read-data', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ folder: 'food' })
    });
    if (res.ok) {
      const data = await res.json();
      // Usa parsedItem se disponibile (da JSON), altrimenti parse markdown
      state.allFood = data.items.map(item =>
        item.parsedItem
          ? { ...item.parsedItem, filename: item.filename, sha: item.sha }
          : parseMarkdown(item.content, item.filename, item.sha)
      );
    }

    // Clear cached items for global search to force refresh
    state.allItems = {};

    renderSidebar();
    setupSidebarEvents();

    // Load current collection items (usa JSON per velocità)
    await loadItems(state.currentCollection, silent);

    // Pre-carica dati per ricerca globale in background (non blocca UI)
    preloadGlobalSearchData();
  } catch (e) {
    console.error('Error loading data:', e);
    if (!silent) toast('Errore caricamento dati', 'error');
  } finally {
    if (!silent) hideLoading();
  }
}

// Pre-carica tutti i dati per la ricerca globale in background
async function preloadGlobalSearchData() {
  const searchCollections = ['food', 'beers', 'cocktails', 'analcolici', 'bibite', 'caffetteria', 'bollicine', 'bianchi-fermi', 'vini-rossi'];

  // Carica tutte le collezioni in parallelo in background
  const fetchPromises = searchCollections
    .filter(collName => !state.allItems[collName])
    .map(async (collName) => {
      try {
        const res = await fetch('/.netlify/functions/read-data', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ folder: COLLECTIONS[collName].folder })
        });
        if (res.ok) {
          const data = await res.json();
          // Usa parsedItem se disponibile (da JSON), altrimenti parse markdown
          state.allItems[collName] = data.items.map(item =>
            item.parsedItem
              ? { ...item.parsedItem, filename: item.filename, sha: item.sha }
              : parseMarkdown(item.content, item.filename, item.sha)
          );
        }
      } catch (e) {
        console.error(`Preload error ${collName}:`, e);
      }
    });

  await Promise.all(fetchPromises);
  console.log('✅ Dati ricerca globale pre-caricati');
}

// Silent refresh - updates data without visual loading indicators
// Usa JSON statici (veloce, no rate limit)
async function silentRefresh() {
  try {
    await loadAllData(true);
    console.log('✅ Silent refresh completed');
  } catch (e) {
    console.error('Silent refresh error:', e);
  }
}

function renderSidebar() {
  const nav = $('#sidebar-nav');
  const foodCategories = state.categories.filter(c => c.tipo_menu === 'food');
  const beverageCategories = state.categories.filter(c => c.tipo_menu === 'beverage');

  // Separate beer categories from other beverages
  const beerCategories = beverageCategories.filter(c =>
    c.nome.toLowerCase().includes('birr') || c.nome.toLowerCase().includes('frigo')
  );
  const otherBeverages = beverageCategories.filter(c =>
    !c.nome.toLowerCase().includes('birr') && !c.nome.toLowerCase().includes('frigo')
  );

  // Count items per category
  const foodCounts = {};
  (state.allFood || []).forEach(item => {
    const cat = item.category || 'Altro';
    foodCounts[cat] = (foodCounts[cat] || 0) + 1;
  });

  // Helper to render category image
  const renderCatThumb = (cat) => {
    let img = cat.immagine || '';
    if (img && !img.startsWith('http') && !img.startsWith('../')) {
      img = '../' + img;
    }
    return img
      ? `<img src="${img}" class="tree-item-thumb" alt="" onerror="this.outerHTML='<div class=\\'tree-item-thumb-placeholder\\'>${cat.icona || '📦'}</div>'">`
      : `<div class="tree-item-thumb-placeholder">${cat.icona || '📦'}</div>`;
  };

  // Helper per indicare se una categoria è nascosta nel frontend
  const hiddenBadge = (cat) => cat.visibile === false ? '<span class="hidden-badge" title="Nascosto nel menu">👁️‍🗨️</span>' : '';

  // Build tree HTML
  let html = `
    <!-- SEZIONE FOOD -->
    <div class="tree-section-title">🍽️ FOOD</div>
    
    <div class="tree-section">
      <div class="tree-header expanded" data-collection="food" data-expandable="true">
        <span class="tree-toggle">▶</span>
        <span class="tree-icon">🍽️</span>
        <span class="tree-label">Piatti</span>
        <span class="tree-count">${state.allFood?.length || 0}</span>
      </div>
      <div class="tree-children">
        ${foodCategories.map(cat => `
          <div class="tree-item${cat.visibile === false ? ' is-hidden' : ''}" data-collection="food" data-category="${cat.nome}">
            ${renderCatThumb(cat)}
            <span class="tree-item-name">${cat.nome}</span>
            ${hiddenBadge(cat)}
            <span class="tree-item-count">${foodCounts[cat.nome] || 0}</span>
          </div>
        `).join('')}
      </div>
    </div>
    
    <div class="tree-divider"></div>
    <div class="tree-section-title">🍺 BEVERAGE</div>
    
    <!-- Birre con sottosezioni -->
    <div class="tree-section">
      <div class="tree-header" data-collection="beers" data-expandable="true">
        <span class="tree-toggle">▶</span>
        <span class="tree-icon">🍺</span>
        <span class="tree-label">Birre</span>
      </div>
      <div class="tree-children tree-subsection">
        ${beerCategories.map(cat => `
          <div class="tree-item${cat.visibile === false ? ' is-hidden' : ''}" data-collection="beers" data-beer-section="${cat.nome}">
            ${renderCatThumb(cat)}
            <span class="tree-item-name">${cat.nome}</span>
            ${hiddenBadge(cat)}
          </div>
        `).join('')}
      </div>
    </div>
    
    <!-- Altre bevande -->
    ${otherBeverages.map(cat => {
    const collectionMap = {
      'Cocktails': 'cocktails',
      'Analcolici': 'analcolici',
      'Bibite': 'bibite',
      'Caffetteria': 'caffetteria',
      'Bollicine': 'bollicine',
      'Bianchi fermi': 'bianchi-fermi',
      'Vini rossi': 'vini-rossi'
    };
    const collection = collectionMap[cat.nome] || cat.slug;
    return `
      <div class="tree-section">
        <div class="tree-item${cat.visibile === false ? ' is-hidden' : ''}" data-collection="${collection}">
          ${renderCatThumb(cat)}
          <span class="tree-item-name">${cat.nome}</span>
          ${hiddenBadge(cat)}
        </div>
      </div>`;
  }).join('')}
    
    <div class="tree-divider"></div>
    <div class="tree-section-title">⚙️ IMPOSTAZIONI</div>
    
    <div class="tree-section">
      <div class="tree-item" data-collection="categorie">
        <div class="tree-item-thumb-placeholder">📁</div>
        <span class="tree-item-name">Categorie</span>
      </div>
    </div>
  `;

  nav.innerHTML = html;
}

function setupSidebarEvents() {
  // Expandable headers
  document.querySelectorAll('.tree-header[data-expandable]').forEach(header => {
    header.addEventListener('click', (e) => {
      e.stopPropagation();
      header.classList.toggle('expanded');

      // If clicking on collection header, also select it
      const collection = header.dataset.collection;
      if (collection) {
        selectTreeItem(collection, null);
      }
    });
  });

  // Non-expandable headers (direct collection)
  document.querySelectorAll('.tree-header:not([data-expandable])').forEach(header => {
    header.addEventListener('click', () => {
      const collection = header.dataset.collection;
      if (collection) {
        selectTreeItem(collection, null);
        closeSidebar();
      }
    });
  });

  // Tree items (categories or collections)
  document.querySelectorAll('.tree-item').forEach(item => {
    item.addEventListener('click', (e) => {
      e.stopPropagation();
      const collection = item.dataset.collection;
      const category = item.dataset.category || null;
      const beerSection = item.dataset.beerSection || null;
      selectTreeItem(collection, category, beerSection);
      closeSidebar();
    });
  });
}

function selectTreeItem(collection, category, beerSection = null) {
  // Remove all active states
  document.querySelectorAll('.tree-header.active, .tree-item.active').forEach(el => el.classList.remove('active'));

  // Set active state
  if (beerSection) {
    // Per le sottocategorie birre (usa data-beer-section)
    const item = $(`.tree-item[data-collection="${collection}"][data-beer-section="${beerSection}"]`);
    if (item) item.classList.add('active');
  } else if (category) {
    // Per le categorie food (usa data-category)
    const item = $(`.tree-item[data-collection="${collection}"][data-category="${category}"]`);
    if (item) item.classList.add('active');
  } else {
    // Per le collezioni principali senza sottocategoria
    const header = $(`.tree-header[data-collection="${collection}"]`);
    const item = $(`.tree-item[data-collection="${collection}"]:not([data-category]):not([data-beer-section])`);
    if (header) header.classList.add('active');
    if (item) item.classList.add('active');
  }

  selectCollection(collection, category, beerSection);
}

function updateCategoryFilter(name) {
  const select = $('#filter-category');
  select.innerHTML = '<option value="">Tutte</option>';
  const collection = COLLECTIONS[name];
  const field = collection.fields.find(f => f.type === 'dynamic-select' || f.name === 'category' || f.name === 'sezione');
  if (field) {
    const options = field.type === 'dynamic-select' ? getCategoriesForType(field.categoryType) : field.options;
    if (options) options.forEach(opt => select.innerHTML += `<option value="${opt}">${opt}</option>`);
  }
}

function getCategoriesForType(type) {
  const dynamic = state.categories.filter(c => c.tipo_menu === type).map(c => c.nome);
  if (type === 'food') return [...new Set([...dynamic, ...DEFAULT_FOOD_CATEGORIES])];
  return dynamic;
}

function renderItems() {
  const list = $('#items-list');
  const items = getFilteredItems();

  // Clear selection state
  state.selectedItems = [];
  updateBulkActionsBar();

  if (!items.length) {
    list.innerHTML = '<div class="empty-state"><h3>Nessun elemento</h3><p>Clicca "Nuovo" per aggiungere</p></div>';
    return;
  }
  const collection = COLLECTIONS[state.currentCollection];
  const isCategorie = state.currentCollection === 'categorie';

  if (collection.groupByCategory && state.currentCollection === 'food') {
    renderGroupedItems(items);
  } else {
    // Add bulk selection header for categories
    let html = '';
    if (isCategorie) {
      html += `<div class="bulk-select-header">
        <label class="bulk-checkbox-label">
          <input type="checkbox" id="select-all-items" class="bulk-checkbox">
          <span>Seleziona tutto</span>
        </label>
      </div>`;
    }
    html += items.map(item => renderItemCard(item, isCategorie)).join('');
    list.innerHTML = html;

    // Setup select all checkbox
    if (isCategorie) {
      const selectAll = $('#select-all-items');
      if (selectAll) {
        selectAll.addEventListener('change', (e) => {
          const checkboxes = document.querySelectorAll('.item-checkbox');
          checkboxes.forEach(cb => {
            cb.checked = e.target.checked;
            toggleItemSelection(cb.dataset.filename, e.target.checked);
          });
        });
      }
    }
  }

  // Setup click handlers
  document.querySelectorAll('.item-card').forEach(card => {
    card.addEventListener('click', (e) => {
      // Don't trigger edit if clicking on checkbox or drag handle
      if (e.target.classList.contains('item-checkbox') || 
          e.target.classList.contains('drag-handle')) return;
      editItem(card.dataset.filename);
    });
  });

  // Setup checkbox handlers for categories
  if (isCategorie) {
    document.querySelectorAll('.item-checkbox').forEach(cb => {
      cb.addEventListener('change', (e) => {
        e.stopPropagation();
        toggleItemSelection(cb.dataset.filename, cb.checked);
      });
    });
  }
  
  // Setup drag and drop for reordering
  setupDragAndDrop();
}

function renderGroupedItems(items) {
  const list = $('#items-list');
  const grouped = {};
  items.forEach(item => {
    const cat = item.category || 'Altro';
    if (!grouped[cat]) grouped[cat] = [];
    grouped[cat].push(item);
  });
  let html = '';
  Object.keys(grouped).sort().forEach(cat => {
    const catData = state.categories.find(c => c.nome === cat);
    html += `<div class="category-group">
      <div class="category-header">
        <span class="category-icon">${catData?.icona || '📦'}</span>
        <span class="category-name">${cat}</span>
        <span class="category-count">${grouped[cat].length}</span>
      </div>
      <div class="category-items">${grouped[cat].map(renderItemCard).join('')}</div>
    </div>`;
  });
  list.innerHTML = html;
}

function renderItemCard(item, showCheckbox = false) {
  let thumb = item.immagine_avatar || item.immagine_copertina || item.immagine || '';

  // Fix relative paths for CMS (which is in /admin/)
  if (thumb && !thumb.startsWith('http') && !thumb.startsWith('../')) {
    thumb = '../' + thumb;
  }

  const thumbHtml = thumb ? `<img src="${thumb}" class="item-thumb" alt="" onerror="this.style.display='none'">` : '<div class="item-thumb-placeholder">📷</div>';

  // For categories, show icon instead of price
  const isCategory = state.currentCollection === 'categorie';
  const metaHtml = isCategory
    ? `<span class="item-icon">${item.icona || '📦'}</span>`
    : `<span class="item-price">€${formatPriceDisplay(item.prezzo)}</span>`;

  // Checkbox for bulk selection (categories only)
  const checkboxHtml = showCheckbox
    ? `<input type="checkbox" class="item-checkbox" data-filename="${item.filename}" onclick="event.stopPropagation()">`
    : '';

  // Drag handle for reordering
  const dragHandle = `<div class="drag-handle" title="Trascina per riordinare">⋮⋮</div>`;

  return `<div class="item-card ${item.disponibile === false || item.visibile === false ? 'unavailable' : ''}" data-filename="${item.filename}" data-order="${item.order || 0}" draggable="true">
    ${dragHandle}
    ${checkboxHtml}
    ${thumbHtml}
    <div class="item-info">
      <div class="item-name">${item.nome || 'Senza nome'}</div>
      <div class="item-meta">
        ${metaHtml}
        <span class="status-dot ${(item.disponibile !== false && item.visibile !== false) ? 'available' : 'unavailable'}"></span>
      </div>
    </div>
  </div>`;
}

function getFilteredItems() {
  let items = [...state.items];
  const search = $('#search-input').value.toLowerCase();
  const category = $('#filter-category').value;
  const status = $('#filter-status').value;

  // Text search
  if (search) {
    items = items.filter(i => {
      const nome = (i.nome || '').toLowerCase();
      const desc = (i.descrizione || '').toLowerCase();
      const tags = Array.isArray(i.tags) ? i.tags.join(' ').toLowerCase() : '';
      return nome.includes(search) || desc.includes(search) || tags.includes(search);
    });
  }

  // Category/section filter
  if (category) items = items.filter(i => i.category === category || i.sezione === category);

  // Beer section filter (for beer subsections in sidebar)
  if (state.currentBeerSection && state.currentCollection === 'beers') {
    items = items.filter(i => i.sezione === state.currentBeerSection);
  }

  // Status filter
  if (status !== '') items = items.filter(i => (i.disponibile !== false) === (status === 'true'));

  // Category-specific filters (for Categorie section)
  if (state.currentCollection === 'categorie') {
    if (state.categoryFilters.tipo) {
      items = items.filter(i => i.tipo_menu === state.categoryFilters.tipo);
    }
    if (state.categoryFilters.image === 'yes') {
      items = items.filter(i => i.immagine && i.immagine.length > 0);
    } else if (state.categoryFilters.image === 'no') {
      items = items.filter(i => !i.immagine || i.immagine.length === 0);
    }
  }

  return items;
}

function filterItems() { renderItems(); }

// ========================================
// DRAG & DROP REORDERING
// ========================================

let draggedItem = null;
let draggedOverItem = null;

function setupDragAndDrop() {
  const list = $('#items-list');
  if (!list) return;

  // Event delegation for drag events
  list.addEventListener('dragstart', handleDragStart);
  list.addEventListener('dragend', handleDragEnd);
  list.addEventListener('dragover', handleDragOver);
  list.addEventListener('dragenter', handleDragEnter);
  list.addEventListener('dragleave', handleDragLeave);
  list.addEventListener('drop', handleDrop);
}

function handleDragStart(e) {
  const card = e.target.closest('.item-card');
  if (!card) return;
  
  draggedItem = card;
  card.classList.add('dragging');
  e.dataTransfer.effectAllowed = 'move';
  e.dataTransfer.setData('text/plain', card.dataset.filename);
  
  // Delay to allow the drag image to be captured
  setTimeout(() => {
    card.style.opacity = '0.5';
  }, 0);
}

function handleDragEnd(e) {
  const card = e.target.closest('.item-card');
  if (card) {
    card.classList.remove('dragging');
    card.style.opacity = '1';
  }
  
  // Remove all drag-over states
  document.querySelectorAll('.item-card.drag-over').forEach(el => {
    el.classList.remove('drag-over');
  });
  
  draggedItem = null;
  draggedOverItem = null;
}

function handleDragOver(e) {
  e.preventDefault();
  e.dataTransfer.dropEffect = 'move';
}

function handleDragEnter(e) {
  const card = e.target.closest('.item-card');
  if (card && card !== draggedItem) {
    card.classList.add('drag-over');
    draggedOverItem = card;
  }
}

function handleDragLeave(e) {
  const card = e.target.closest('.item-card');
  if (card && !card.contains(e.relatedTarget)) {
    card.classList.remove('drag-over');
  }
}

async function handleDrop(e) {
  e.preventDefault();
  
  const targetCard = e.target.closest('.item-card');
  if (!targetCard || !draggedItem || targetCard === draggedItem) return;
  
  targetCard.classList.remove('drag-over');
  
  const draggedFilename = draggedItem.dataset.filename;
  const targetFilename = targetCard.dataset.filename;
  
  // Find items in state
  const draggedIdx = state.items.findIndex(i => i.filename === draggedFilename);
  const targetIdx = state.items.findIndex(i => i.filename === targetFilename);
  
  if (draggedIdx === -1 || targetIdx === -1) return;
  
  // Reorder items array
  const [movedItem] = state.items.splice(draggedIdx, 1);
  state.items.splice(targetIdx, 0, movedItem);
  
  // Track which items changed order
  const changedItems = [];
  state.items.forEach((item, idx) => {
    if (item.order !== idx) {
      item.order = idx;
      changedItems.push(item);
    }
  });
  
  // Re-render immediately for visual feedback
  renderItems();
  setupDragAndDropEvents();
  
  // Save only changed items
  if (changedItems.length > 0) {
    await saveNewOrder(changedItems);
  }
}

function setupDragAndDropEvents() {
  // Re-attach click handlers after re-render
  document.querySelectorAll('.item-card').forEach(card => {
    card.addEventListener('click', (e) => {
      // Don't trigger edit if clicking on checkbox or drag handle
      if (e.target.classList.contains('item-checkbox') || 
          e.target.classList.contains('drag-handle')) return;
      editItem(card.dataset.filename);
    });
  });
}

async function saveNewOrder(changedItems) {
  // Se non ci sono item cambiati, esci
  if (!changedItems || changedItems.length === 0) return;
  
  // Show subtle loading indicator
  const saveIndicator = document.createElement('div');
  saveIndicator.className = 'order-save-indicator';
  saveIndicator.innerHTML = `💾 Salvando ordine (${changedItems.length} elementi)...`;
  document.body.appendChild(saveIndicator);
  
  try {
    const collection = COLLECTIONS[state.currentCollection];
    
    // Get fresh SHAs first
    const fetchRes = await fetch('/.netlify/functions/read-data', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ folder: collection.folder, mode: 'api' })
    });
    
    let freshData = [];
    if (fetchRes.ok) {
      const data = await fetchRes.json();
      freshData = data.items;
    }
    
    // Save only changed items (sequentially to avoid conflicts)
    let successCount = 0;
    let errorCount = 0;
    
    for (const item of changedItems) {
      const freshItem = freshData.find(i => i.filename === item.filename);
      const sha = freshItem?.sha || item.sha;
      
      if (!sha) {
        console.warn(`Skipping ${item.filename}: no SHA`);
        continue;
      }
      
      // Clean item data - only valid fields
      const validFields = collection.fields.map(f => f.name);
      const cleanData = {};
      validFields.forEach(field => {
        if (item[field] !== undefined) {
          cleanData[field] = item[field];
        }
      });
      
      try {
        const res = await fetch('/.netlify/functions/save-data', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            token: state.token,
            action: 'save',
            collection: collection.folder,
            filename: item.filename,
            data: cleanData,
            sha: sha,
            skipRegeneration: true // Skip JSON regen for each item
          })
        });
        
        if (res.ok) {
          const result = await res.json();
          item.sha = result.sha; // Update SHA for next save
          successCount++;
          
          // Update SmartCache silently
          if (window.SmartCache) {
            await window.SmartCache.set('items', {
              ...item,
              id: item.filename,
              _collection: state.currentCollection,
              _hash: window.SmartCache.generateHash(item),
              _lastUpdated: Date.now(),
              _writeTime: Date.now()
            });
          }
        } else {
          errorCount++;
          const errData = await res.json().catch(() => ({}));
          console.error(`Error saving ${item.filename}:`, errData.error || res.status);
        }
        
        // Small delay between saves to avoid rate limits
        await new Promise(r => setTimeout(r, 300));
      } catch (e) {
        errorCount++;
        console.error(`Error saving order for ${item.filename}:`, e);
      }
    }
    
    // Regenerate JSON once at the end (only if we saved something)
    if (successCount > 0) {
      try {
        await fetch('/.netlify/functions/save-data', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            token: state.token,
            action: 'regenerate-json',
            collection: collection.folder
          })
        });
      } catch (e) {
        console.error('Error regenerating JSON:', e);
      }
    }
    
    if (errorCount === 0) {
      saveIndicator.innerHTML = '✅ Ordine salvato!';
      saveIndicator.classList.add('success');
    } else {
      saveIndicator.innerHTML = `⚠️ Salvati ${successCount}/${changedItems.length}`;
      saveIndicator.classList.add('error');
    }
    setTimeout(() => saveIndicator.remove(), 2000);
    
  } catch (e) {
    console.error('Error saving order:', e);
    saveIndicator.innerHTML = '❌ Errore salvataggio';
    saveIndicator.classList.add('error');
    setTimeout(() => saveIndicator.remove(), 3000);
  }
}

// ========================================
// SEARCH LIVE SUGGESTIONS
// ========================================

function handleSearchInput(e) {
  const query = e.target.value;

  // Show/hide clear button
  const clearBtn = $('#search-clear');
  clearBtn.classList.toggle('visible', query.length > 0);

  // Debounce search
  clearTimeout(state.searchTimeout);

  if (query.length < 2) {
    hideSearchSuggestions();
    filterItems();
    return;
  }

  state.searchTimeout = setTimeout(() => {
    showSearchSuggestions();
    filterItems();
  }, 250);
}

function handleSearchKeydown(e) {
  const suggestions = $('#search-suggestions');
  const items = suggestions.querySelectorAll('.suggestion-item');
  const highlighted = suggestions.querySelector('.suggestion-item.highlighted');

  if (e.key === 'Escape') {
    hideSearchSuggestions();
    return;
  }

  if (e.key === 'Enter') {
    if (highlighted) {
      e.preventDefault();
      highlighted.click();
    }
    return;
  }

  if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
    e.preventDefault();
    if (!items.length) return;

    let idx = [...items].indexOf(highlighted);
    if (highlighted) highlighted.classList.remove('highlighted');

    if (e.key === 'ArrowDown') {
      idx = idx < items.length - 1 ? idx + 1 : 0;
    } else {
      idx = idx > 0 ? idx - 1 : items.length - 1;
    }

    items[idx].classList.add('highlighted');
    items[idx].scrollIntoView({ block: 'nearest' });
  }
}

function showSearchSuggestions() {
  const query = $('#search-input').value.toLowerCase();
  const suggestions = $('#search-suggestions');

  if (query.length < 2) {
    hideSearchSuggestions();
    return;
  }

  // Search in current items
  const matches = state.items.filter(item => {
    const nome = (item.nome || '').toLowerCase();
    const desc = (item.descrizione || '').toLowerCase();
    const cat = (item.category || item.sezione || '').toLowerCase();
    const tags = Array.isArray(item.tags) ? item.tags.join(' ').toLowerCase() : '';
    return nome.includes(query) || desc.includes(query) || cat.includes(query) || tags.includes(query);
  }).slice(0, 8);

  if (!matches.length) {
    suggestions.innerHTML = '<div class="search-no-results">Nessun risultato per "' + query + '"</div>';
    suggestions.classList.add('active');
    return;
  }

  suggestions.innerHTML = matches.map(item => {
    let thumb = item.immagine_avatar || item.immagine_copertina || item.immagine || '';
    if (thumb && !thumb.startsWith('http') && !thumb.startsWith('../')) {
      thumb = '../' + thumb;
    }
    const thumbHtml = thumb
      ? `<img src="${thumb}" class="suggestion-thumb" alt="" onerror="this.style.display='none'">`
      : '<div class="suggestion-thumb-placeholder">📷</div>';

    const cat = item.category || item.sezione || item.tipo_menu || '';
    const price = item.prezzo ? `€${formatPriceDisplay(item.prezzo)}` : '';

    return `<div class="suggestion-item" data-filename="${item.filename}">
      ${thumbHtml}
      <div class="suggestion-info">
        <div class="suggestion-name">${item.nome || 'Senza nome'}</div>
        <div class="suggestion-meta">
          ${cat ? `<span class="suggestion-category">${cat}</span>` : ''}
          ${price ? `<span class="suggestion-price">${price}</span>` : ''}
        </div>
      </div>
    </div>`;
  }).join('');

  // Add click handlers
  suggestions.querySelectorAll('.suggestion-item').forEach(el => {
    el.addEventListener('click', () => {
      editItem(el.dataset.filename);
      hideSearchSuggestions();
      $('#search-input').value = '';
      $('#search-clear').classList.remove('visible');
    });
  });

  suggestions.classList.add('active');
}

function hideSearchSuggestions() {
  $('#search-suggestions').classList.remove('active');
}

function clearSearch() {
  $('#search-input').value = '';
  $('#search-clear').classList.remove('visible');
  hideSearchSuggestions();
  filterItems();
}

// ========================================
// CATEGORY FILTERS (for Categorie section)
// ========================================

function toggleCategoryFilter(chip) {
  const filterType = chip.dataset.filter;
  const filterValue = chip.dataset.value;

  // Toggle active state
  if (chip.classList.contains('active')) {
    chip.classList.remove('active');
    state.categoryFilters[filterType] = null;
  } else {
    // Deselect other chips of same type
    $$(`.filter-chip[data-filter="${filterType}"]`).forEach(c => c.classList.remove('active'));
    chip.classList.add('active');
    state.categoryFilters[filterType] = filterValue;
  }

  filterItems();
}

function resetCategoryFilters() {
  state.categoryFilters = { tipo: null, image: null };
  document.querySelectorAll('.filter-chip').forEach(c => c.classList.remove('active'));
  filterItems();
}


// ========================================
// BULK SELECTION & ACTIONS (for Categories)
// ========================================

function toggleItemSelection(filename, selected) {
  if (selected) {
    if (!state.selectedItems.includes(filename)) {
      state.selectedItems.push(filename);
    }
  } else {
    state.selectedItems = state.selectedItems.filter(f => f !== filename);
  }
  updateBulkActionsBar();
}

function updateBulkActionsBar() {
  let bar = $('#bulk-actions-bar');
  const count = state.selectedItems.length;

  // Only show for categories section
  if (state.currentCollection !== 'categorie') {
    if (bar) bar.remove();
    return;
  }

  if (count === 0) {
    if (bar) bar.classList.remove('active');
    return;
  }

  // Create bar if doesn't exist
  if (!bar) {
    bar = document.createElement('div');
    bar.id = 'bulk-actions-bar';
    bar.className = 'bulk-actions-bar';
    bar.innerHTML = `
      <div class="bulk-info">
        <span class="bulk-count">0</span> selezionati
      </div>
      <div class="bulk-buttons">
        <button type="button" class="btn btn-small" id="bulk-enable-btn">
          ✅ Rendi visibili
        </button>
        <button type="button" class="btn btn-small btn-ghost" id="bulk-disable-btn">
          🚫 Nascondi
        </button>
        <button type="button" class="btn btn-small btn-ghost" id="bulk-clear-btn">
          ✕ Deseleziona
        </button>
      </div>
    `;
    document.querySelector('.main-content').appendChild(bar);

    // Add event listeners
    $('#bulk-enable-btn').addEventListener('click', () => bulkSetVisibility(true));
    $('#bulk-disable-btn').addEventListener('click', () => bulkSetVisibility(false));
    $('#bulk-clear-btn').addEventListener('click', clearBulkSelection);
  }

  // Update count
  bar.querySelector('.bulk-count').textContent = count;
  bar.classList.add('active');
}

function clearBulkSelection() {
  state.selectedItems = [];
  document.querySelectorAll('.item-checkbox').forEach(cb => cb.checked = false);
  const selectAll = $('#select-all-items');
  if (selectAll) selectAll.checked = false;
  updateBulkActionsBar();
}

async function bulkSetVisibility(visible) {
  const count = state.selectedItems.length;
  if (count === 0) return;

  const action = visible ? 'rendere visibili' : 'nascondere';
  if (!confirm(`Vuoi ${action} ${count} categorie?`)) return;

  showLoading();

  try {
    // Prima ottieni tutti gli SHA freschi in un'unica chiamata (USARE API PER EVITARE DATI STALE)
    const fetchRes = await fetch('/.netlify/functions/read-data', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ folder: 'categorie', mode: 'api' })
    });

    let freshData = [];
    if (fetchRes.ok) {
      const data = await fetchRes.json();
      freshData = data.items;
    }

    // Prepara gli items da aggiornare
    const itemsToUpdate = [];
    for (const filename of state.selectedItems) {
      const item = state.items.find(i => i.filename === filename);
      if (!item) continue;

      const freshItem = freshData.find(i => i.filename === filename);
      const sha = freshItem?.sha || item.sha;

      if (sha) {
        itemsToUpdate.push({ filename, item, sha });
      }
    }

    // Esegui le richieste SEQUENZIALMENTE per evitare conflitti git
    let successCount = 0;
    let errorCount = 0;

    for (const { filename, item, sha } of itemsToUpdate) {
      try {
        // Add delay to avoid rate limits
        await new Promise(resolve => setTimeout(resolve, 500));

        // Clean up item to only include valid fields + visibile
        // This prevents internal SmartCache fields (_collection, _hash, etc.) from polluting the YAML
        const validFields = COLLECTIONS['categorie'].fields.map(f => f.name);
        const updatedData = {};

        validFields.forEach(field => {
          if (item[field] !== undefined) {
            updatedData[field] = item[field];
          }
        });

        // Explicitly set visibility
        updatedData.visibile = visible;

        const res = await fetch('/.netlify/functions/save-data', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            token: state.token,
            action: 'save',
            collection: 'categorie',
            filename: filename,
            data: updatedData,
            sha: sha,
            skipRegeneration: true // Importante: salta rigenerazione JSON per ogni item
          })
        });

        if (res.ok) {
          successCount++;
          // Aggiorna cache locale
          if (window.SmartCache) {
            const newItem = { ...updatedData, filename, sha: (await res.json()).sha, _collection: 'categorie' };
            await window.SmartCache.set('items', {
              ...newItem,
              id: filename,
              _hash: window.SmartCache.generateHash(newItem),
              _lastUpdated: Date.now(),
              _writeTime: Date.now() // Timestamp scrittura per protezione stale data
            });
          }
        } else {
          errorCount++;
        }
      } catch (e) {
        console.error(`Error updating ${filename}:`, e);
        errorCount++;
      }
    }

    // Rigenera JSON una sola volta alla fine
    if (successCount > 0) {
      try {
        await fetch('/.netlify/functions/save-data', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            token: state.token,
            action: 'regenerate-json',
            collection: 'categorie'
          })
        });
      } catch (e) {
        console.error('Error regenerating JSON:', e);
      }
    }

    if (successCount > 0) {
      toast(`${successCount} categorie ${visible ? 'rese visibili' : 'nascoste'}!`, 'success');
    }
    if (errorCount > 0) {
      toast(`${errorCount} errori durante l'aggiornamento`, 'error');
    }

  } catch (e) {
    console.error('Bulk operation error:', e);
    toast('Errore durante l\'operazione', 'error');
  }

  hideLoading();

  // Clear selection
  clearBulkSelection();

  // Notify subscribers to refresh UI from cache
  if (window.SmartCache) {
    window.SmartCache.notifySubscribers({
      collection: 'categorie',
      updated: [] // Just trigger refresh
    });
  }

  // DO NOT reload from server immediately
  // await loadItems(state.currentCollection, true, true);
}


// ========================================
// EDIT FORM
// ========================================

function createNew() {
  state.currentItem = null;
  state.isNew = true;
  renderEditForm({});
  showEditView();
  $('#delete-btn').style.display = 'none';
}

function editItem(filename) {
  const item = state.items.find(i => i.filename === filename);
  if (!item) return;
  state.currentItem = item;
  state.isNew = false;
  renderEditForm(item);
  showEditView();
  $('#delete-btn').style.display = 'block';
}

function renderEditForm(data) {
  const collection = COLLECTIONS[state.currentCollection];
  const form = $('#edit-form');
  
  // Titolo dell'item in modifica (visibile soprattutto su mobile)
  const itemTitle = data.nome || '';
  const isNew = state.isNew;
  
  // Header con titolo prominente
  const headerHtml = `
    <div class="edit-form-header">
      <div class="edit-form-badge">${isNew ? '➕ Nuovo' : '✏️ Modifica'}</div>
      ${itemTitle ? `<div class="edit-form-title">${itemTitle}</div>` : ''}
    </div>
  `;

  form.innerHTML = headerHtml + collection.fields.map(field => {
    const value = data[field.name] ?? field.default ?? '';

    switch (field.type) {
      case 'text':
        return `<div class="form-group">
          <label class="form-label">${field.label}${field.required ? ' *' : ''}</label>
          <input type="text" name="${field.name}" class="form-input" value="${escapeHtml(value)}" ${field.autoSlug ? 'data-auto-slug="true"' : ''}>
          ${field.hint ? `<div class="form-hint">${field.hint}</div>` : ''}
        </div>`;

      case 'number':
        return `<div class="form-group">
          <label class="form-label">${field.label}</label>
          <input type="number" name="${field.name}" class="form-input" value="${value}">
        </div>`;

      case 'textarea':
        return `<div class="form-group">
          <label class="form-label">${field.label}</label>
          <textarea name="${field.name}" class="form-textarea">${escapeHtml(value)}</textarea>
        </div>`;

      case 'select':
        return `<div class="form-group">
          <label class="form-label">${field.label}</label>
          <select name="${field.name}" class="form-select">
            <option value="">-- Seleziona --</option>
            ${field.options.map(opt => `<option value="${opt}" ${value === opt ? 'selected' : ''}>${opt}</option>`).join('')}
          </select>
        </div>`;

      case 'dynamic-select':
        const cats = getCategoriesForType(field.categoryType);
        return `<div class="form-group">
          <label class="form-label">${field.label}</label>
          <select name="${field.name}" class="form-select">
            <option value="">-- Seleziona --</option>
            ${cats.map(opt => `<option value="${opt}" ${value === opt ? 'selected' : ''}>${opt}</option>`).join('')}
          </select>
        </div>`;

      case 'toggle':
        const checked = value === true || value === 'true' || (value === '' && field.default);
        return `<div class="form-group">
          <div class="toggle-wrapper">
            <label class="toggle">
              <input type="checkbox" name="${field.name}" ${checked ? 'checked' : ''}>
              <span class="toggle-slider"></span>
            </label>
            <span class="toggle-label">${field.label}</span>
          </div>
        </div>`;

      case 'tags':
        const selected = Array.isArray(value) ? value : [];
        return `<div class="form-group">
          <label class="form-label">${field.label}</label>
          <div class="tags-input" data-field="${field.name}">
            ${field.options.map(opt => `<span class="tag-option ${selected.includes(opt) ? 'selected' : ''}" data-value="${opt}">${opt}</span>`).join('')}
          </div>
        </div>`;

      case 'image':
        return renderImageField(field, value);

      default: return '';
    }
  }).join('');

  // Event handlers
  document.querySelectorAll('.tag-option').forEach(tag => tag.addEventListener('click', () => tag.classList.toggle('selected')));

  // Auto-slug
  const nomeInput = form.querySelector('[name="nome"]');
  const slugInput = form.querySelector('[data-auto-slug="true"]');
  if (nomeInput && slugInput && state.isNew) {
    nomeInput.addEventListener('input', () => slugInput.value = slugify(nomeInput.value));
  }

  // Image upload handlers
  document.querySelectorAll('.image-upload-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const fieldName = btn.dataset.field;
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = 'image/*';
      input.onchange = (e) => handleImageUpload(e, fieldName);
      input.click();
    });
  });

  // Image remove handlers
  document.querySelectorAll('.image-remove-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const fieldName = btn.dataset.field;
      const container = form.querySelector(`[data-image-field="${fieldName}"]`);
      const input = form.querySelector(`[name="${fieldName}"]`);
      input.value = '';
      container.querySelector('.image-preview').innerHTML = '<div class="image-placeholder">📷 Nessuna immagine</div>';
      container.querySelector('.image-remove-btn').style.display = 'none';
    });
  });
}


function renderImageField(field, value) {
  const hasImage = value && value.length > 0;

  // Fix relative paths for CMS (which is in /admin/)
  let displayValue = value || '';
  if (displayValue && !displayValue.startsWith('http') && !displayValue.startsWith('../') && !displayValue.startsWith('/')) {
    displayValue = '../' + displayValue;
  }

  const previewHtml = hasImage
    ? `<img src="${displayValue}" alt="Preview" class="image-preview-img" onerror="this.src='data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%22100%22 height=%22100%22%3E%3Crect fill=%22%23333%22 width=%22100%22 height=%22100%22/%3E%3Ctext x=%2250%25%22 y=%2250%25%22 text-anchor=%22middle%22 dy=%22.3em%22 fill=%22%23999%22 font-size=%2214%22%3E❌ Errore%3C/text%3E%3C/svg%3E'">`
    : '<div class="image-placeholder">📷 Nessuna immagine</div>';

  return `<div class="form-group">
    <label class="form-label">${field.label}</label>
    <div class="image-field" data-image-field="${field.name}">
      <div class="image-preview">${previewHtml}</div>
      <div class="image-actions">
        <button type="button" class="btn btn-small image-upload-btn" data-field="${field.name}">
          📤 ${state.cloudinaryConfigured ? 'Carica' : 'Scegli'} Immagine
        </button>
        <button type="button" class="btn btn-small btn-ghost image-remove-btn" data-field="${field.name}" style="display: ${hasImage ? 'inline-flex' : 'none'}">
          🗑️ Rimuovi
        </button>
      </div>
      <input type="hidden" name="${field.name}" value="${escapeHtml(value || '')}">
      <input type="text" name="${field.name}_url" class="form-input image-url-input" placeholder="Incolla URL immagine (es: https://...)" value="${escapeHtml(value || '')}" style="margin-top: 8px;">
    </div>
    ${field.hint ? `<div class="form-hint">${field.hint}</div>` : ''}
  </div>`;
}

async function handleImageUpload(e, fieldName) {
  const file = e.target.files[0];
  if (!file) return;

  const form = $('#edit-form');
  const container = form.querySelector(`[data-image-field="${fieldName}"]`);
  if (!container) {
    console.error('Container non trovato per:', fieldName);
    return;
  }

  const preview = container.querySelector('.image-preview');
  const hiddenInput = container.querySelector(`input[type="hidden"][name="${fieldName}"]`);
  const urlInput = container.querySelector(`input[name="${fieldName}_url"]`);
  const removeBtn = container.querySelector('.image-remove-btn');

  console.log('Upload image per campo:', fieldName);
  console.log('Hidden input trovato:', !!hiddenInput);
  console.log('URL input trovato:', !!urlInput);

  // Show loading
  preview.innerHTML = '<div class="image-loading">⏳ Caricamento...</div>';

  // Convert file to base64
  const reader = new FileReader();
  reader.onload = async (evt) => {
    const base64Data = evt.target.result;

    // Show preview immediately
    preview.innerHTML = `<img src="${base64Data}" alt="Preview" class="image-preview-img">`;
    if (removeBtn) removeBtn.style.display = 'inline-flex';

    // Try upload via Netlify Function (signed upload)
    try {
      const res = await fetch('/.netlify/functions/upload-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token: state.token,
          file: base64Data
        })
      });

      const responseData = await res.json();

      if (res.ok && responseData.url) {
        const imageUrl = responseData.url;
        console.log('✅ URL Cloudinary ricevuto:', imageUrl);

        // Aggiorna ENTRAMBI gli input
        if (hiddenInput) {
          hiddenInput.value = imageUrl;
          console.log('Hidden input aggiornato:', hiddenInput.value);
        }
        if (urlInput) {
          urlInput.value = imageUrl;
          console.log('URL input aggiornato:', urlInput.value);
        }

        // Aggiorna preview con URL Cloudinary
        preview.innerHTML = `<img src="${imageUrl}" alt="Preview" class="image-preview-img">`;
        toast('✅ Immagine caricata!', 'success');
        return;
      } else {
        // Show error but keep preview
        console.error('Upload error:', responseData.error);
        toast(`⚠️ ${responseData.error || 'Errore upload'}. Usa URL manuale.`, 'error');
      }
    } catch (err) {
      console.error('Upload failed:', err);
      toast('⚠️ Upload fallito. Incolla URL manuale.', 'error');
    }
  };
  reader.readAsDataURL(file);
}

function escapeHtml(text) {
  if (typeof text !== 'string') return text;
  return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}


// ========================================
// SAVE & DELETE
// ========================================

async function saveItem() {
  const collection = COLLECTIONS[state.currentCollection];
  const form = $('#edit-form');
  const formData = new FormData(form);

  const data = {};
  collection.fields.forEach(field => {
    if (field.type === 'toggle') {
      data[field.name] = form.querySelector(`[name="${field.name}"]`).checked;
    } else if (field.type === 'tags') {
      const container = form.querySelector(`[data-field="${field.name}"]`);
      data[field.name] = [...container.querySelectorAll('.tag-option.selected')].map(el => el.dataset.value);
    } else if (field.type === 'number') {
      data[field.name] = parseInt(formData.get(field.name)) || 0;
    } else if (field.name === 'prezzo') {
      // Sanitizza il prezzo: accetta sia punto che virgola, normalizza con punto
      data[field.name] = sanitizePrice(formData.get(field.name));
    } else if (field.type === 'image') {
      // Priorità: URL input > hidden input (da upload Cloudinary)
      const urlInput = form.querySelector(`[name="${field.name}_url"]`);
      const hiddenInput = form.querySelector(`[name="${field.name}"]`);
      const urlValue = (urlInput && urlInput.value) || '';
      const hiddenValue = (hiddenInput && hiddenInput.value) || '';
      data[field.name] = urlValue || hiddenValue || '';
    } else {
      data[field.name] = formData.get(field.name) || '';
    }
  });

  // Validate
  const missing = collection.fields.filter(f => f.required && !data[f.name]).map(f => f.label);
  if (missing.length) {
    toast(`Compila: ${missing.join(', ')}`, 'error');
    return;
  }

  let filename = state.isNew ? `${slugify(data.nome || data.slug)}.md` : state.currentItem.filename;

  showLoading();

  try {
    // Per file esistenti, SEMPRE recupera SHA fresco via API GitHub (non JSON!)
    let sha = null;
    if (!state.isNew && state.currentItem) {
      console.log('Recupero SHA per:', filename, 'in folder:', collection.folder);

      // IMPORTANTE: usa mode=api per forzare GitHub API e ottenere SHA
      const freshRes = await fetch('/.netlify/functions/read-data', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ folder: collection.folder, mode: 'api' })
      });

      if (freshRes.ok) {
        const freshData = await freshRes.json();
        console.log('Source:', freshData.source, '- Items trovati:', freshData.items?.length);

        const freshItem = freshData.items?.find(i => i.filename === filename);
        if (freshItem && freshItem.sha) {
          sha = freshItem.sha;
          console.log('SHA trovato:', sha);
        } else {
          console.log('File non trovato o SHA mancante, provo con SHA in memoria');
          sha = state.currentItem.sha;
        }
      } else {
        // Fallback a SHA in memoria
        sha = state.currentItem.sha;
        console.log('Fetch fallito, uso SHA in memoria:', sha);
      }

      if (!sha) {
        throw new Error('Impossibile recuperare SHA del file. Ricarica la pagina e riprova.');
      }
    }

    // Helper per la richiesta di salvataggio
    const performSave = async (fname) => {
      return fetch('/.netlify/functions/save-data', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token: state.token,
          action: 'save',
          collection: collection.folder,
          filename: fname,
          data: data,
          sha: sha
        })
      });
    };

    let res = await performSave(filename);
    let result = await res.json();

    // Gestione collisioni per nuovi item (Errore 422 da GitHub: "sha wasn't supplied")
    // Se il file esiste già, GitHub richiede SHA. Se noi non l'abbiamo (perché è nuovo),
    // significa che c'è un conflitto di nomi.
    if (!res.ok && state.isNew && result.error && (result.error.includes('sha') || result.error.includes('422'))) {
      console.log('⚠️ Collisione rilevata per', filename, '- Tento con suffisso...');

      let counter = 1;
      const originalSlug = filename.replace('.md', '');

      // Riprova fino a 5 volte con suffissi incrementali
      while (counter <= 10) {
        const newFilename = `${originalSlug}-${counter}.md`;
        console.log('🔄 Riprovo salvataggio con:', newFilename);

        res = await performSave(newFilename);
        result = await res.json();

        if (res.ok) {
          console.log('✅ Salvataggio riuscito con:', newFilename);
          filename = newFilename; // Aggiorna il filename per la cache
          break;
        }

        // Se l'errore non è di collisione (es. 500 o altro), fermati
        if (!result.error || (!result.error.includes('sha') && !result.error.includes('422'))) {
          break;
        }
        counter++;
      }
    }

    if (!res.ok) throw new Error(result.error || 'Errore salvataggio');

    toast('Salvato!', 'success');

    // Update SmartCache immediately
    if (window.SmartCache) {
      const newItem = { ...data, filename, sha: result.sha, _collection: state.currentCollection };
      await window.SmartCache.set('items', {
        ...newItem,
        id: filename,
        _hash: window.SmartCache.generateHash(newItem),
        _lastUpdated: Date.now(),
        _writeTime: Date.now() // Timestamp scrittura per protezione stale data
      });
      // Notify other tabs
      window.SmartCache.notifySubscribers({
        collection: state.currentCollection,
        updated: [newItem]
      });
    }

    // Show list view first
    showListView();
    hideLoading();

    // DO NOT reload from server immediately to avoid stale data overwrite
    // The UI is already updated via SmartCache subscription (triggered above)
    // await loadItems(state.currentCollection, true, true);
  } catch (e) {
    console.error(e);
    toast(e.message || 'Errore nel salvataggio', 'error');
    hideLoading();
  }
}

async function deleteItem() {
  if (!state.currentItem) return;
  if (!confirm(`Eliminare "${state.currentItem.nome}"?`)) return;

  showLoading();

  try {
    const collection = COLLECTIONS[state.currentCollection];
    let sha = state.currentItem.sha;

    console.log('Delete item - Initial SHA:', sha, 'Filename:', state.currentItem.filename);

    // Always fetch fresh SHA from GitHub to ensure it's current
    console.log('Recupero SHA aggiornato dal server...');
    const fetchRes = await fetch('/.netlify/functions/read-data', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ folder: collection.folder })
    });

    if (fetchRes.ok) {
      const data = await fetchRes.json();
      console.log('Items received:', data.items?.length);
      const found = data.items.find(i => i.filename === state.currentItem.filename);
      console.log('Found item:', found);
      if (found && found.sha) {
        sha = found.sha;
        console.log('Using fresh SHA:', sha);
      }
    } else {
      console.error('Failed to fetch items:', fetchRes.status);
    }

    if (!sha) {
      throw new Error('Impossibile recuperare SHA del file. Ricarica la pagina e riprova.');
    }

    console.log('Sending delete request with SHA:', sha);

    const res = await fetch('/.netlify/functions/save-data', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        token: state.token,
        action: 'delete',
        collection: collection.folder,
        filename: state.currentItem.filename,
        sha: sha
      })
    });

    const result = await res.json();
    console.log('Delete response:', result);
    if (!res.ok) throw new Error(result.error || 'Errore eliminazione');

    toast('Eliminato!', 'success');

    // Update SmartCache immediately
    if (window.SmartCache) {
      // Use tombstone for soft delete to prevent stale data resurrection
      await window.SmartCache.set('items', {
        ...state.currentItem,
        _deleted: true,
        _writeTime: Date.now()
      });

      // Notify other tabs
      window.SmartCache.notifySubscribers({
        collection: state.currentCollection,
        removed: [state.currentItem]
      });
    }

    // Show list view first
    showListView();
    hideLoading();

    // DO NOT reload from server immediately
    // await loadItems(state.currentCollection, true, true);
  } catch (e) {
    console.error('Delete error:', e);
    toast(e.message || 'Errore eliminazione', 'error');
    hideLoading();
  }
}

function slugify(text) {
  if (!text) return '';
  return text.toString().toLowerCase().trim()
    .replace(/\s+/g, '-')
    .replace(/[àáâãäå]/g, 'a').replace(/[èéêë]/g, 'e')
    .replace(/[ìíîï]/g, 'i').replace(/[òóôõö]/g, 'o').replace(/[ùúûü]/g, 'u')
    .replace(/[^a-z0-9-]/g, '').replace(/-+/g, '-').substring(0, 50);
}


// ========================================
// GLOBAL SEARCH (Navbar)
// ========================================

function setupGlobalSearch() {
  const toggle = $('#global-search-toggle');
  const box = $('#global-search-box');
  const input = $('#global-search-input');
  const closeBtn = $('#global-search-close');

  if (!toggle || !box || !input) return;

  toggle.addEventListener('click', () => {
    box.classList.add('active');
    input.focus();
  });

  closeBtn.addEventListener('click', closeGlobalSearch);

  // Event listeners multipli per supporto iPad/tablet
  input.addEventListener('input', handleGlobalSearchInput);
  input.addEventListener('keyup', handleGlobalSearchChange); // Fallback per iPad
  input.addEventListener('keydown', handleGlobalSearchKeydown);
  input.addEventListener('change', handleGlobalSearchChange); // Per autocomplete

  // Touch-specific: su iPad a volte serve questo
  input.addEventListener('touchend', () => {
    // Piccolo delay per permettere l'aggiornamento del valore
    setTimeout(() => {
      if (input.value.trim().length >= 2) {
        performGlobalSearch(input.value.trim());
      }
    }, 50);
  });

  // Close when clicking outside
  document.addEventListener('click', (e) => {
    if (!e.target.closest('#global-search-wrapper') && !e.target.closest('#global-search-toggle')) {
      closeGlobalSearch();
    }
  });
}

function closeGlobalSearch() {
  const box = $('#global-search-box');
  const input = $('#global-search-input');
  const results = $('#global-search-results');

  box.classList.remove('active');
  results.classList.remove('active');
  input.value = '';
}

function handleGlobalSearchInput(e) {
  const query = e.target.value.trim();

  clearTimeout(state.globalSearchTimeout);

  if (query.length < 2) {
    $('#global-search-results').classList.remove('active');
    return;
  }

  // Timeout breve per risposta rapida
  state.globalSearchTimeout = setTimeout(() => {
    performGlobalSearch(query);
  }, 100);
}

// Handler separato per iPad/touch - input event a volte non triggerato
function handleGlobalSearchChange(e) {
  // Chiama direttamente handleGlobalSearchInput
  handleGlobalSearchInput(e);
}

function handleGlobalSearchKeydown(e) {
  const results = $('#global-search-results');
  const items = results.querySelectorAll('.global-result-item');
  const highlighted = results.querySelector('.global-result-item.highlighted');

  if (e.key === 'Escape') {
    closeGlobalSearch();
    return;
  }

  if (e.key === 'Enter' && highlighted) {
    e.preventDefault();
    highlighted.click();
    return;
  }

  if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
    e.preventDefault();
    if (!items.length) return;

    let idx = [...items].indexOf(highlighted);
    if (highlighted) highlighted.classList.remove('highlighted');

    if (e.key === 'ArrowDown') {
      idx = idx < items.length - 1 ? idx + 1 : 0;
    } else {
      idx = idx > 0 ? idx - 1 : items.length - 1;
    }

    items[idx].classList.add('highlighted');
    items[idx].scrollIntoView({ block: 'nearest' });
  }
}

async function performGlobalSearch(query) {
  const results = $('#global-search-results');
  const q = query.toLowerCase();

  // Mostra indicatore di caricamento
  results.innerHTML = '<div class="global-search-loading">🔍 Ricerca in corso...</div>';
  results.classList.add('active');

  // Search across all collections
  const allMatches = [];

  // Define collections to search
  const searchCollections = ['food', 'beers', 'cocktails', 'analcolici', 'bibite', 'caffetteria', 'bollicine', 'bianchi-fermi', 'vini-rossi'];

  // Trova collezioni che devono essere caricate
  const collectionsToFetch = searchCollections.filter(c => !state.allItems[c]);

  // Carica tutte le collezioni mancanti IN PARALLELO (molto più veloce!)
  if (collectionsToFetch.length > 0) {
    try {
      const fetchPromises = collectionsToFetch.map(async (collName) => {
        try {
          const res = await fetch('/.netlify/functions/read-data', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ folder: COLLECTIONS[collName].folder })
          });
          if (res.ok) {
            const data = await res.json();
            // Usa parsedItem se disponibile (da JSON), altrimenti parse markdown
            return {
              collName, items: data.items.map(item =>
                item.parsedItem
                  ? { ...item.parsedItem, filename: item.filename, sha: item.sha }
                  : parseMarkdown(item.content, item.filename, item.sha)
              )
            };
          }
        } catch (e) {
          console.error(`Error fetching ${collName}:`, e);
        }
        return { collName, items: [] };
      });

      const fetchResults = await Promise.all(fetchPromises);
      fetchResults.forEach(({ collName, items }) => {
        state.allItems[collName] = items;
      });
    } catch (e) {
      console.error('Error fetching collections:', e);
    }
  }

  // Ora cerca nei dati cachati (sincrono, velocissimo)
  for (const collName of searchCollections) {
    const items = state.allItems[collName] || [];
    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      const nome = String(item.nome || '').toLowerCase();
      // descrizione può essere stringa o array
      const descRaw = item.descrizione;
      const desc = (Array.isArray(descRaw) ? descRaw.join(' ') : String(descRaw || '')).toLowerCase();
      const cat = String(item.category || item.sezione || '').toLowerCase();
      const tags = Array.isArray(item.tags) ? item.tags.join(' ').toLowerCase() : '';

      // Ricerca ottimizzata con indexOf (più veloce di includes su mobile)
      if (nome.indexOf(q) !== -1 || desc.indexOf(q) !== -1 || cat.indexOf(q) !== -1 || tags.indexOf(q) !== -1) {
        allMatches.push({
          ...item,
          _collection: collName,
          _collectionLabel: COLLECTIONS[collName].label,
          _nameMatch: nome.indexOf(q) === 0 ? 2 : (nome.indexOf(q) !== -1 ? 1 : 0)
        });
      }
    }
  }

  // Sort by relevance (name starts with > name contains > other)
  allMatches.sort((a, b) => {
    if (a._nameMatch !== b._nameMatch) return b._nameMatch - a._nameMatch;
    return (a.nome || '').localeCompare(b.nome || '');
  });

  // Limit results
  const limitedMatches = allMatches.slice(0, 15);

  if (!limitedMatches.length) {
    results.innerHTML = '<div class="global-search-empty">Nessun risultato per "' + query + '"</div>';
    return;
  }

  // Usa DocumentFragment per rendering più veloce
  const fragment = document.createDocumentFragment();

  limitedMatches.forEach(item => {
    let thumb = item.immagine_avatar || item.immagine_copertina || item.immagine || '';
    if (thumb && !thumb.startsWith('http') && !thumb.startsWith('../')) {
      thumb = '../' + thumb;
    }

    const div = document.createElement('div');
    div.className = 'global-result-item';
    div.dataset.collection = item._collection;
    div.dataset.filename = item.filename;

    const thumbHtml = thumb
      ? `<img src="${thumb}" class="global-result-thumb" alt="" loading="lazy" onerror="this.style.display='none'">`
      : '<div class="global-result-placeholder">📷</div>';

    const price = item.prezzo ? `€${formatPriceDisplay(item.prezzo)}` : '';

    div.innerHTML = `
      ${thumbHtml}
      <div class="global-result-info">
        <div class="global-result-name">${item.nome || 'Senza nome'}</div>
        <div class="global-result-meta">
          <span class="global-result-section">${item._collectionLabel}</span>
          ${price ? ` · ${price}` : ''}
        </div>
      </div>
    `;

    // Event listener diretto (più efficiente della delegazione per pochi elementi)
    div.addEventListener('click', () => {
      openGlobalSearchResult(item._collection, item.filename);
    });

    fragment.appendChild(div);
  });

  results.innerHTML = '';
  results.appendChild(fragment);
}

// Funzione separata per apertura risultato (evita ricreazione closure)
async function openGlobalSearchResult(collection, filename) {
  closeGlobalSearch();

  // Switch to the collection and load items
  state.currentCollection = collection;
  await loadItems(collection);

  // Find and edit the item
  const item = state.items.find(i => i.filename === filename);
  if (item) {
    editItem(filename);
  }
}
