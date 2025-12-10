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
      { name: 'allergeni', label: 'Allergeni', type: 'tags', options: ['Glutine', 'Lattosio', 'Uova', 'Frutta a Guscio', 'Pesce', 'Soia'] },
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
  items: [],
  categories: [],
  allFood: [],
  currentItem: null,
  isNew: false,
  cloudinaryConfigured: false
};

// DOM helpers
const $ = sel => document.querySelector(sel);
const $$ = sel => document.querySelectorAll(sel);

// Init
document.addEventListener('DOMContentLoaded', init);

async function init() {
  await checkCloudinaryConfig();
  setupEventListeners();
  
  // Non salvare il login - utente deve fare login ogni volta
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
  $('#search-input').addEventListener('input', filterItems);
  $('#filter-category').addEventListener('change', filterItems);
  $('#filter-status').addEventListener('change', filterItems);
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
    
    // Store token in memory only (not localStorage)
    state.token = result.token;
    state.email = result.email;
    state.isLoggedIn = true;
    
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
    const categories = data.items.map(item => parseMarkdown(item.content, item.filename, item.sha));
    state.categories = categories.filter(c => c.visibile !== false).sort((a, b) => (a.order || 0) - (b.order || 0));
  } catch (e) {
    console.error('Error loading categories:', e);
    state.categories = [];
  }
}

async function loadItems(collectionName) {
  showLoading();
  const collection = COLLECTIONS[collectionName];
  try {
    const res = await fetch('/.netlify/functions/read-data', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ folder: collection.folder })
    });
    
    if (!res.ok) throw new Error('Errore caricamento');
    
    const data = await res.json();
    const items = data.items.map(item => parseMarkdown(item.content, item.filename, item.sha));
    state.items = items.sort((a, b) => (a.order || 0) - (b.order || 0));
    renderItems();
  } catch (e) {
    console.error(e);
    toast('Errore nel caricamento', 'error');
  } finally {
    hideLoading();
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
        else if (!isNaN(parsed) && parsed !== '') parsed = Number(parsed);
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

function selectCollection(name, categoryFilter = null) {
  state.currentCollection = name;
  state.currentCategory = categoryFilter;
  $('#collection-title').textContent = categoryFilter || COLLECTIONS[name].label;
  updateCategoryFilter(name);
  if (categoryFilter) {
    $('#filter-category').value = categoryFilter;
  }
  loadItems(name);
  showListView();
}

// ========================================
// SIDEBAR TREE
// ========================================

async function loadAllData() {
  showLoading();
  try {
    // Load categories first
    await loadCategories();
    
    // Load all food items for tree counts
    const res = await fetch('/.netlify/functions/read-data', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ folder: 'food' })
    });
    if (res.ok) {
      const data = await res.json();
      state.allFood = data.items.map(item => parseMarkdown(item.content, item.filename, item.sha));
    }
    
    renderSidebar();
    setupSidebarEvents();
    
    // Load current collection items
    await loadItems(state.currentCollection);
  } catch (e) {
    console.error('Error loading data:', e);
    toast('Errore caricamento dati', 'error');
  } finally {
    hideLoading();
  }
}

function renderSidebar() {
  const nav = $('#sidebar-nav');
  const foodCategories = state.categories.filter(c => c.tipo_menu === 'food');
  
  // Count items per category
  const foodCounts = {};
  (state.allFood || []).forEach(item => {
    const cat = item.category || 'Altro';
    foodCounts[cat] = (foodCounts[cat] || 0) + 1;
  });
  
  // Build tree HTML - struttura identica al frontend
  let html = `
    <!-- SEZIONE HEADER -->
    <div class="tree-section-title">🍽️ FOOD</div>
    
    <!-- Piatti - mostra tutte le categorie food -->
    <div class="tree-section">
      <div class="tree-header expanded" data-collection="food" data-expandable="true">
        <span class="tree-toggle">▶</span>
        <span class="tree-icon">🍽️</span>
        <span class="tree-label">Piatti</span>
        <span class="tree-count">${state.allFood?.length || 0}</span>
      </div>
      <div class="tree-children">
        ${foodCategories.map(cat => `
          <div class="tree-item" data-collection="food" data-category="${cat.nome}">
            <span class="tree-item-icon">${cat.icona || '📦'}</span>
            <span class="tree-item-name">${cat.nome}</span>
            <span class="tree-item-count">${foodCounts[cat.nome] || 0}</span>
          </div>
        `).join('')}
      </div>
    </div>
    
    <div class="tree-divider"></div>
    <div class="tree-section-title">🍺 BEVERAGE</div>
    
    <!-- Birre -->
    <div class="tree-section">
      <div class="tree-item" data-collection="beers">
        <span class="tree-item-icon">🍺</span>
        <span class="tree-item-name">Birre</span>
      </div>
    </div>
    
    <!-- Cocktails -->
    <div class="tree-section">
      <div class="tree-item" data-collection="cocktails">
        <span class="tree-item-icon">🍸</span>
        <span class="tree-item-name">Cocktails</span>
      </div>
    </div>
    
    <!-- Analcolici -->
    <div class="tree-section">
      <div class="tree-item" data-collection="analcolici">
        <span class="tree-item-icon">🧃</span>
        <span class="tree-item-name">Analcolici</span>
      </div>
    </div>
    
    <!-- Bibite -->
    <div class="tree-section">
      <div class="tree-item" data-collection="bibite">
        <span class="tree-item-icon">🥤</span>
        <span class="tree-item-name">Bibite</span>
      </div>
    </div>
    
    <!-- Caffetteria -->
    <div class="tree-section">
      <div class="tree-item" data-collection="caffetteria">
        <span class="tree-item-icon">☕</span>
        <span class="tree-item-name">Caffetteria</span>
      </div>
    </div>
    
    <!-- Bollicine -->
    <div class="tree-section">
      <div class="tree-item" data-collection="bollicine">
        <span class="tree-item-icon">🥂</span>
        <span class="tree-item-name">Bollicine</span>
      </div>
    </div>
    
    <!-- Vini Bianchi -->
    <div class="tree-section">
      <div class="tree-item" data-collection="bianchi-fermi">
        <span class="tree-item-icon">🍾</span>
        <span class="tree-item-name">Vini Bianchi</span>
      </div>
    </div>
    
    <!-- Vini Rossi -->
    <div class="tree-section">
      <div class="tree-item" data-collection="vini-rossi">
        <span class="tree-item-icon">🍷</span>
        <span class="tree-item-name">Vini Rossi</span>
      </div>
    </div>
    
    <div class="tree-divider"></div>
    <div class="tree-section-title">⚙️ IMPOSTAZIONI</div>
    
    <!-- Gestione Categorie -->
    <div class="tree-section">
      <div class="tree-item" data-collection="categorie">
        <span class="tree-item-icon">📁</span>
        <span class="tree-item-name">Categorie</span>
      </div>
    </div>
  `;
  
  nav.innerHTML = html;
}

function setupSidebarEvents() {
  // Expandable headers
  $$('.tree-header[data-expandable]').forEach(header => {
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
  $$('.tree-header:not([data-expandable])').forEach(header => {
    header.addEventListener('click', () => {
      const collection = header.dataset.collection;
      if (collection) {
        selectTreeItem(collection, null);
        closeSidebar();
      }
    });
  });
  
  // Tree items (categories or collections)
  $$('.tree-item').forEach(item => {
    item.addEventListener('click', (e) => {
      e.stopPropagation();
      const collection = item.dataset.collection;
      const category = item.dataset.category || null;
      selectTreeItem(collection, category);
      closeSidebar();
    });
  });
}

function selectTreeItem(collection, category) {
  // Remove all active states
  $$('.tree-header.active, .tree-item.active').forEach(el => el.classList.remove('active'));
  
  // Set active state
  if (category) {
    const item = $(`.tree-item[data-collection="${collection}"][data-category="${category}"]`);
    if (item) item.classList.add('active');
  } else {
    const header = $(`.tree-header[data-collection="${collection}"]`);
    const item = $(`.tree-item[data-collection="${collection}"]:not([data-category])`);
    if (header) header.classList.add('active');
    if (item) item.classList.add('active');
  }
  
  selectCollection(collection, category);
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
  if (!items.length) {
    list.innerHTML = '<div class="empty-state"><h3>Nessun elemento</h3><p>Clicca "Nuovo" per aggiungere</p></div>';
    return;
  }
  const collection = COLLECTIONS[state.currentCollection];
  if (collection.groupByCategory && state.currentCollection === 'food') {
    renderGroupedItems(items);
  } else {
    list.innerHTML = items.map(renderItemCard).join('');
  }
  $$('.item-card').forEach(card => card.addEventListener('click', () => editItem(card.dataset.filename)));
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

function renderItemCard(item) {
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
    : `<span class="item-price">€${item.prezzo || '0'}</span>`;
  
  return `<div class="item-card ${item.disponibile === false || item.visibile === false ? 'unavailable' : ''}" data-filename="${item.filename}">
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
  if (search) items = items.filter(i => (i.nome || '').toLowerCase().includes(search));
  if (category) items = items.filter(i => i.category === category || i.sezione === category);
  if (status !== '') items = items.filter(i => (i.disponibile !== false) === (status === 'true'));
  return items;
}

function filterItems() { renderItems(); }


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
  
  form.innerHTML = collection.fields.map(field => {
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
  $$('.tag-option').forEach(tag => tag.addEventListener('click', () => tag.classList.toggle('selected')));
  
  // Auto-slug
  const nomeInput = form.querySelector('[name="nome"]');
  const slugInput = form.querySelector('[data-auto-slug="true"]');
  if (nomeInput && slugInput && state.isNew) {
    nomeInput.addEventListener('input', () => slugInput.value = slugify(nomeInput.value));
  }
  
  // Image upload handlers
  $$('.image-upload-btn').forEach(btn => {
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
  $$('.image-remove-btn').forEach(btn => {
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
  const preview = container.querySelector('.image-preview');
  const input = form.querySelector(`[name="${fieldName}"]`);
  const urlInput = form.querySelector(`[name="${fieldName}_url"]`);
  const removeBtn = container.querySelector('.image-remove-btn');
  
  // Show loading
  preview.innerHTML = '<div class="image-loading">⏳ Caricamento...</div>';
  
  // Convert file to base64
  const reader = new FileReader();
  reader.onload = async (evt) => {
    const base64Data = evt.target.result;
    
    // Show preview immediately
    preview.innerHTML = `<img src="${base64Data}" alt="Preview" class="image-preview-img">`;
    removeBtn.style.display = 'inline-flex';
    
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
        input.value = imageUrl;
        if (urlInput) urlInput.value = imageUrl;
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
  
  const filename = state.isNew ? `${slugify(data.nome || data.slug)}.md` : state.currentItem.filename;
  
  showLoading();
  
  try {
    const res = await fetch('/.netlify/functions/save-data', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        token: state.token,
        action: 'save',
        collection: collection.folder,
        filename: filename,
        data: data,
        sha: state.isNew ? null : state.currentItem.sha
      })
    });
    
    const result = await res.json();
    if (!res.ok) throw new Error(result.error || 'Errore salvataggio');
    
    toast('Salvato! Il menù si aggiornerà automaticamente.', 'success');
    
    if (state.currentCollection === 'categorie') await loadCategories();
    await loadItems(state.currentCollection);
    showListView();
  } catch (e) {
    console.error(e);
    toast(e.message || 'Errore nel salvataggio', 'error');
  } finally {
    hideLoading();
  }
}

async function deleteItem() {
  if (!state.currentItem) return;
  if (!confirm(`Eliminare "${state.currentItem.nome}"?`)) return;
  
  showLoading();
  
  try {
    const collection = COLLECTIONS[state.currentCollection];
    const res = await fetch('/.netlify/functions/save-data', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        token: state.token,
        action: 'delete',
        collection: collection.folder,
        filename: state.currentItem.filename,
        sha: state.currentItem.sha
      })
    });
    
    const result = await res.json();
    if (!res.ok) throw new Error(result.error || 'Errore eliminazione');
    
    toast('Eliminato!', 'success');
    
    if (state.currentCollection === 'categorie') await loadCategories();
    await loadItems(state.currentCollection);
    showListView();
  } catch (e) {
    console.error(e);
    toast(e.message || 'Errore eliminazione', 'error');
  } finally {
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