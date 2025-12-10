/* ========================================
   ARCONTI31 CUSTOM CMS - APP
   ======================================== */

// Configuration
const CONFIG = {
  owner: 'Massimilianociconte',
  repo: 'Arconti31',
  branch: 'main',
  useGitGateway: true,
  gitGatewayUrl: '/.netlify/git/github'
};

// Default categories (will be merged with dynamic ones)
const DEFAULT_FOOD_CATEGORIES = [
  'Hamburger di bufala', 'Hamburger Fassona e Street food', 'OKTOBERFEST',
  'Panini', 'Griglieria', 'Piatti Speciali', 'Piadine', 'Fritti', 'Dolci', 'Aperitivo'
];

// Collection schemas - categories will be loaded dynamically
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
      { name: 'immagine', label: 'Immagine', type: 'text', hint: 'Percorso immagine' },
      { name: 'allergeni', label: 'Allergeni', type: 'tags', options: [
        'Glutine', 'Lattosio', 'Uova', 'Frutta a Guscio', 'Pesce', 'Soia'
      ]},
      { name: 'tags', label: 'Tag Speciali', type: 'tags', options: [
        'Novità', 'Vegetariano', 'Vegano', 'Piccante', 'Più venduto', 'Specialità'
      ]},
      { name: 'disponibile', label: 'Disponibile', type: 'toggle', default: true },
      { name: 'order', label: 'Ordine', type: 'number', default: 0 }
    ]
  },
  beers: {
    label: 'Birre',
    folder: 'beers',
    fields: [
      { name: 'nome', label: 'Nome Birra', type: 'text', required: true },
      { name: 'sezione', label: 'Sezione', type: 'select', options: [
        'Birre artigianali alla spina a rotazione', 'Birre alla spina', 
        'Birre speciali in bottiglia', 'Frigo Birre'
      ]},
      { name: 'prezzo', label: 'Prezzo (€)', type: 'text', required: true },
      { name: 'descrizione', label: 'Descrizione', type: 'textarea' },
      { name: 'formato', label: 'Formato', type: 'text', hint: 'Es: 50cl, BOCCALE 0,5L' },
      { name: 'gradazione', label: 'Gradazione (%)', type: 'text' },
      { name: 'categoria', label: 'Tipo Birra', type: 'select', options: [
        'Chiara', 'Scura', 'Rossa', 'Artigianale', 'IPA', 'Lager', 'Weiss'
      ]},
      { name: 'immagine', label: 'Immagine', type: 'text' },
      { name: 'logo', label: 'Logo', type: 'text' },
      { name: 'tags', label: 'Tag', type: 'tags', options: [
        'Novità', 'Senza Glutine', 'Specialità', 'Più venduto'
      ]},
      { name: 'allergeni', label: 'Allergeni', type: 'tags', options: [
        'Glutine', 'Lattosio', 'Solfiti', 'Frutta a Guscio'
      ]},
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
      { name: 'formato', label: 'Formato', type: 'text' },
      { name: 'gradazione', label: 'Gradazione (%)', type: 'text' },
      { name: 'immagine', label: 'Immagine', type: 'text' },
      { name: 'tags', label: 'Tag', type: 'tags', options: [
        'Novità', 'Senza Glutine', 'Specialità', 'Biologico', 'Più venduto'
      ]},
      { name: 'allergeni', label: 'Allergeni', type: 'tags', options: [
        'Glutine', 'Lattosio', 'Solfiti', 'Frutta a Guscio', 'Sedano', 'Uova'
      ]},
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
      { name: 'formato', label: 'Formato', type: 'text' },
      { name: 'immagine', label: 'Immagine', type: 'text' },
      { name: 'tags', label: 'Tag', type: 'tags', options: [
        'Novità', 'Senza Glutine', 'Biologico', 'Più venduto'
      ]},
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
      { name: 'formato', label: 'Formato', type: 'text' },
      { name: 'immagine', label: 'Immagine', type: 'text' },
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
      { name: 'immagine', label: 'Immagine', type: 'text' },
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
      { name: 'formato', label: 'Formato', type: 'text' },
      { name: 'gradazione', label: 'Gradazione (%)', type: 'text' },
      { name: 'immagine', label: 'Immagine', type: 'text' },
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
      { name: 'formato', label: 'Formato', type: 'text' },
      { name: 'gradazione', label: 'Gradazione (%)', type: 'text' },
      { name: 'immagine', label: 'Immagine', type: 'text' },
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
      { name: 'formato', label: 'Formato', type: 'text' },
      { name: 'gradazione', label: 'Gradazione (%)', type: 'text' },
      { name: 'immagine', label: 'Immagine', type: 'text' },
      { name: 'disponibile', label: 'Disponibile', type: 'toggle', default: true },
      { name: 'order', label: 'Ordine', type: 'number', default: 0 }
    ]
  },
  categorie: {
    label: 'Categorie',
    folder: 'categorie',
    fields: [
      { name: 'nome', label: 'Nome Categoria', type: 'text', required: true },
      { name: 'slug', label: 'Slug', type: 'text', required: true, hint: 'ID univoco (es: hamburger-bufala)', autoSlug: true },
      { name: 'tipo_menu', label: 'Tipo Menù', type: 'select', options: ['food', 'beverage'], required: true },
      { name: 'icona', label: 'Icona', type: 'text', hint: 'Es: 🍔 🍺 🍷' },
      { name: 'descrizione', label: 'Descrizione', type: 'textarea' },
      { name: 'colore', label: 'Colore', type: 'text', hint: 'Es: #d4a853' },
      { name: 'visibile', label: 'Visibile nel menù', type: 'toggle', default: true },
      { name: 'order', label: 'Ordine', type: 'number', default: 0 }
    ]
  }
};

// App State
let state = {
  token: null,
  user: null,
  currentCollection: 'food',
  items: [],
  categories: [], // Dynamic categories loaded from files
  currentItem: null,
  isNew: false
};

// DOM Elements
const $ = (sel) => document.querySelector(sel);
const $$ = (sel) => document.querySelectorAll(sel);

// Initialize App
document.addEventListener('DOMContentLoaded', init);

function init() {
  initNetlifyIdentity();
  setupEventListeners();
}

function initNetlifyIdentity() {
  if (window.netlifyIdentity) {
    window.netlifyIdentity.on('init', user => {
      if (user) {
        handleLogin(user);
      } else {
        showLoginScreen();
      }
    });

    window.netlifyIdentity.on('login', user => {
      handleLogin(user);
      window.netlifyIdentity.close();
    });

    window.netlifyIdentity.on('logout', () => {
      handleLogout();
    });

    window.netlifyIdentity.on('error', err => {
      console.error('Netlify Identity Error:', err);
      toast('Errore di autenticazione', 'error');
    });

    window.netlifyIdentity.init();
  } else {
    console.error('Netlify Identity widget not loaded');
    toast('Errore: widget di login non caricato', 'error');
  }
}

async function handleLogin(user) {
  state.user = user;
  state.token = user.token.access_token;
  showMainApp();
  // Load categories first, then items
  await loadCategories();
  loadItems(state.currentCollection);
}

function handleLogout() {
  state.user = null;
  state.token = null;
  state.categories = [];
  showLoginScreen();
}

function setupEventListeners() {
  const loginBtn = $('#netlify-login');
  if (loginBtn) {
    loginBtn.addEventListener('click', () => {
      if (window.netlifyIdentity) {
        window.netlifyIdentity.open('login');
      }
    });
  }
  
  $('#menu-toggle').addEventListener('click', toggleSidebar);
  $$('.nav-item').forEach(item => {
    item.addEventListener('click', (e) => {
      e.preventDefault();
      selectCollection(item.dataset.collection);
      closeSidebar();
    });
  });
  
  $('#add-new-btn').addEventListener('click', createNew);
  $('#back-btn').addEventListener('click', showListView);
  $('#save-btn').addEventListener('click', saveItem);
  $('#delete-btn').addEventListener('click', deleteItem);
  $('#sync-btn').addEventListener('click', async () => {
    await loadCategories();
    loadItems(state.currentCollection);
  });
  $('#logout-btn').addEventListener('click', logout);
  
  $('#search-input').addEventListener('input', filterItems);
  $('#filter-category').addEventListener('change', filterItems);
  $('#filter-status').addEventListener('change', filterItems);
}

function logout() {
  if (window.netlifyIdentity) {
    window.netlifyIdentity.logout();
  }
}

// ========================================
// CATEGORIES MANAGEMENT
// ========================================

async function loadCategories() {
  try {
    // Use Netlify Git Gateway
    const apiUrl = `/.netlify/git/github/contents/categorie`;
    const headers = state.token ? { 'Authorization': `Bearer ${state.token}` } : {};
    
    const response = await fetch(apiUrl, { headers });
    
    if (!response.ok) {
      console.log('No categories folder found, using defaults');
      state.categories = [];
      return;
    }
    
    const files = await response.json();
    const mdFiles = files.filter(f => f.name.endsWith('.md'));
    
    const categories = await Promise.all(mdFiles.map(async file => {
      const contentRes = await fetch(file.download_url);
      const content = await contentRes.text();
      return parseMarkdown(content, file.name, file.sha);
    }));
    
    state.categories = categories.filter(c => c.visibile !== false).sort((a, b) => (a.order || 0) - (b.order || 0));
    console.log('Loaded categories:', state.categories);
  } catch (error) {
    console.error('Error loading categories:', error);
    state.categories = [];
  }
}

function getCategoriesForType(type) {
  const dynamicCats = state.categories
    .filter(c => c.tipo_menu === type)
    .map(c => c.nome);
  
  if (type === 'food') {
    // Merge with defaults, avoiding duplicates
    const allCats = [...new Set([...dynamicCats, ...DEFAULT_FOOD_CATEGORIES])];
    return allCats;
  }
  
  return dynamicCats;
}


// ========================================
// UI HELPERS
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

function showLoading() {
  $('#loading-overlay').classList.add('active');
}

function hideLoading() {
  $('#loading-overlay').classList.remove('active');
}

function toast(message, type = 'info') {
  const container = $('#toast-container');
  const toastEl = document.createElement('div');
  toastEl.className = `toast ${type}`;
  toastEl.textContent = message;
  container.appendChild(toastEl);
  setTimeout(() => toastEl.remove(), 3000);
}

// ========================================
// COLLECTION MANAGEMENT
// ========================================

function selectCollection(collectionName) {
  state.currentCollection = collectionName;
  
  $$('.nav-item').forEach(item => {
    item.classList.toggle('active', item.dataset.collection === collectionName);
  });
  
  const collection = COLLECTIONS[collectionName];
  $('#collection-title').textContent = collection.label;
  
  updateCategoryFilter(collectionName);
  loadItems(collectionName);
  showListView();
}

function updateCategoryFilter(collectionName) {
  const select = $('#filter-category');
  select.innerHTML = '<option value="">Tutte le categorie</option>';
  
  const collection = COLLECTIONS[collectionName];
  
  // Check for dynamic-select field
  const dynamicField = collection.fields.find(f => f.type === 'dynamic-select');
  if (dynamicField) {
    const categories = getCategoriesForType(dynamicField.categoryType);
    categories.forEach(opt => {
      select.innerHTML += `<option value="${opt}">${opt}</option>`;
    });
    return;
  }
  
  // Fallback to static options
  const categoryField = collection.fields.find(f => 
    f.name === 'category' || f.name === 'sezione' || f.name === 'categoria'
  );
  
  if (categoryField && categoryField.options) {
    categoryField.options.forEach(opt => {
      select.innerHTML += `<option value="${opt}">${opt}</option>`;
    });
  }
}

// ========================================
// DATA LOADING
// ========================================

async function loadItems(collectionName) {
  showLoading();
  const collection = COLLECTIONS[collectionName];
  
  try {
    // Use Netlify Git Gateway
    let apiUrl = `/.netlify/git/github/contents/${collection.folder}`;
    const headers = state.token ? { 'Authorization': `Bearer ${state.token}` } : {};
    
    const response = await fetch(apiUrl, { headers });
    
    if (!response.ok) throw new Error('Errore caricamento');
    
    const files = await response.json();
    const mdFiles = files.filter(f => f.name.endsWith('.md') && f.name !== '.gitkeep');
    
    const items = await Promise.all(mdFiles.map(async file => {
      const contentRes = await fetch(file.download_url);
      const content = await contentRes.text();
      return parseMarkdown(content, file.name, file.sha);
    }));
    
    state.items = items.sort((a, b) => (a.order || 0) - (b.order || 0));
    renderItems();
  } catch (error) {
    console.error(error);
    toast('Errore nel caricamento dei dati', 'error');
  } finally {
    hideLoading();
  }
}

function parseMarkdown(content, filename, sha) {
  const match = content.match(/^---\n([\s\S]*?)\n---/);
  if (!match) return { filename, sha };
  
  const frontmatter = match[1];
  const data = { filename, sha };
  
  let currentKey = null;
  let inArray = false;
  let arrayValues = [];
  
  frontmatter.split('\n').forEach(line => {
    if (line.startsWith('  - ')) {
      arrayValues.push(line.replace('  - ', '').replace(/"/g, '').trim());
    } else if (line.includes(':')) {
      if (currentKey && inArray) {
        data[currentKey] = arrayValues;
        arrayValues = [];
        inArray = false;
      }
      
      const [key, ...valueParts] = line.split(':');
      const value = valueParts.join(':').trim();
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
  
  if (currentKey && inArray) {
    data[currentKey] = arrayValues;
  }
  
  return data;
}

// ========================================
// RENDERING
// ========================================

function renderItems() {
  const list = $('#items-list');
  const items = getFilteredItems();
  const collection = COLLECTIONS[state.currentCollection];
  
  if (items.length === 0) {
    list.innerHTML = `
      <div class="empty-state">
        <svg viewBox="0 0 24 24"><path fill="currentColor" d="M19 5v14H5V5h14m0-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2z"/></svg>
        <h3>Nessun elemento</h3>
        <p>Clicca "Nuovo" per aggiungere il primo elemento</p>
      </div>
    `;
    return;
  }
  
  // Group by category for food collection
  if (collection.groupByCategory && state.currentCollection === 'food') {
    renderGroupedItems(items);
  } else {
    renderFlatItems(items);
  }
  
  // Add click handlers
  $$('.item-card').forEach(card => {
    card.addEventListener('click', () => editItem(card.dataset.filename));
  });
}

function renderGroupedItems(items) {
  const list = $('#items-list');
  
  // Group items by category
  const grouped = {};
  items.forEach(item => {
    const cat = item.category || 'Senza categoria';
    if (!grouped[cat]) grouped[cat] = [];
    grouped[cat].push(item);
  });
  
  // Get category order from state.categories
  const categoryOrder = {};
  state.categories.forEach((cat, idx) => {
    categoryOrder[cat.nome] = cat.order || idx;
  });
  
  // Sort categories
  const sortedCategories = Object.keys(grouped).sort((a, b) => {
    const orderA = categoryOrder[a] ?? 999;
    const orderB = categoryOrder[b] ?? 999;
    return orderA - orderB;
  });
  
  let html = '';
  sortedCategories.forEach(category => {
    const categoryData = state.categories.find(c => c.nome === category);
    const icon = categoryData?.icona || '📦';
    const color = categoryData?.colore || '#d4a853';
    
    html += `
      <div class="category-group">
        <div class="category-header" style="border-left-color: ${color}">
          <span class="category-icon">${icon}</span>
          <span class="category-name">${category}</span>
          <span class="category-count">${grouped[category].length}</span>
        </div>
        <div class="category-items">
          ${grouped[category].map(item => renderItemCard(item)).join('')}
        </div>
      </div>
    `;
  });
  
  list.innerHTML = html;
}

function renderFlatItems(items) {
  const list = $('#items-list');
  list.innerHTML = items.map(item => renderItemCard(item)).join('');
}

function renderItemCard(item) {
  return `
    <div class="item-card ${item.disponibile === false ? 'unavailable' : ''}" data-filename="${item.filename}">
      ${item.immagine ? `<img src="${item.immagine}" class="item-image" alt="">` : 
        `<div class="item-image"></div>`}
      <div class="item-info">
        <div class="item-name">${item.nome || 'Senza nome'}</div>
        <div class="item-meta">
          <span class="item-price">€${item.prezzo || '0'}</span>
          <span class="item-status">
            <span class="status-dot ${item.disponibile !== false ? 'available' : 'unavailable'}"></span>
            ${item.disponibile !== false ? 'Disp.' : 'Non disp.'}
          </span>
        </div>
        ${item.tags && item.tags.length ? `
          <div class="item-tags">
            ${item.tags.map(t => `<span class="tag">${t}</span>`).join('')}
          </div>
        ` : ''}
      </div>
    </div>
  `;
}

function getFilteredItems() {
  let items = [...state.items];
  
  const search = $('#search-input').value.toLowerCase();
  const category = $('#filter-category').value;
  const status = $('#filter-status').value;
  
  if (search) {
    items = items.filter(item => 
      (item.nome || '').toLowerCase().includes(search) ||
      (item.descrizione || '').toLowerCase().includes(search)
    );
  }
  
  if (category) {
    items = items.filter(item => 
      item.category === category || 
      item.sezione === category || 
      item.categoria === category
    );
  }
  
  if (status !== '') {
    const isAvailable = status === 'true';
    items = items.filter(item => (item.disponibile !== false) === isAvailable);
  }
  
  return items;
}

function filterItems() {
  renderItems();
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
  
  form.innerHTML = collection.fields.map(field => {
    const value = data[field.name] ?? field.default ?? '';
    
    switch (field.type) {
      case 'text':
        return `
          <div class="form-group">
            <label class="form-label">${field.label}${field.required ? ' *' : ''}</label>
            <input type="text" name="${field.name}" class="form-input" 
              value="${escapeHtml(value)}" ${field.required ? 'required' : ''}
              ${field.autoSlug ? 'data-auto-slug="true"' : ''}>
            ${field.hint ? `<div class="form-hint">${field.hint}</div>` : ''}
          </div>
        `;
        
      case 'number':
        return `
          <div class="form-group">
            <label class="form-label">${field.label}</label>
            <input type="number" name="${field.name}" class="form-input" value="${value}">
          </div>
        `;
        
      case 'textarea':
        return `
          <div class="form-group">
            <label class="form-label">${field.label}</label>
            <textarea name="${field.name}" class="form-textarea">${escapeHtml(value)}</textarea>
          </div>
        `;
        
      case 'select':
        return `
          <div class="form-group">
            <label class="form-label">${field.label}${field.required ? ' *' : ''}</label>
            <select name="${field.name}" class="form-select" ${field.required ? 'required' : ''}>
              <option value="">-- Seleziona --</option>
              ${field.options.map(opt => 
                `<option value="${opt}" ${value === opt ? 'selected' : ''}>${opt}</option>`
              ).join('')}
            </select>
          </div>
        `;
      
      case 'dynamic-select':
        const categories = getCategoriesForType(field.categoryType);
        return `
          <div class="form-group">
            <label class="form-label">${field.label}</label>
            <select name="${field.name}" class="form-select">
              <option value="">-- Seleziona --</option>
              ${categories.map(opt => 
                `<option value="${opt}" ${value === opt ? 'selected' : ''}>${opt}</option>`
              ).join('')}
            </select>
            <div class="form-hint">Le categorie si gestiscono dalla sezione "Categorie"</div>
          </div>
        `;
        
      case 'toggle':
        const checked = value === true || value === 'true' || (value === '' && field.default);
        return `
          <div class="form-group">
            <div class="toggle-wrapper">
              <label class="toggle">
                <input type="checkbox" name="${field.name}" ${checked ? 'checked' : ''}>
                <span class="toggle-slider"></span>
              </label>
              <span class="toggle-label">${field.label}</span>
            </div>
          </div>
        `;
        
      case 'tags':
        const selectedTags = Array.isArray(value) ? value : [];
        return `
          <div class="form-group">
            <label class="form-label">${field.label}</label>
            <div class="tags-input" data-field="${field.name}">
              ${field.options.map(opt => `
                <span class="tag-option ${selectedTags.includes(opt) ? 'selected' : ''}" 
                  data-value="${opt}">${opt}</span>
              `).join('')}
            </div>
          </div>
        `;
        
      default:
        return '';
    }
  }).join('');
  
  // Add tag click handlers
  $$('.tag-option').forEach(tag => {
    tag.addEventListener('click', () => {
      tag.classList.toggle('selected');
    });
  });
  
  // Auto-slug for categories
  const nomeInput = form.querySelector('[name="nome"]');
  const slugInput = form.querySelector('[data-auto-slug="true"]');
  if (nomeInput && slugInput && state.isNew) {
    nomeInput.addEventListener('input', () => {
      slugInput.value = slugify(nomeInput.value);
    });
  }
}

function escapeHtml(text) {
  if (typeof text !== 'string') return text;
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
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
      const selected = [...container.querySelectorAll('.tag-option.selected')];
      data[field.name] = selected.map(el => el.dataset.value);
    } else if (field.type === 'number') {
      data[field.name] = parseInt(formData.get(field.name)) || 0;
    } else {
      data[field.name] = formData.get(field.name) || '';
    }
  });
  
  const missingFields = collection.fields
    .filter(f => f.required && !data[f.name])
    .map(f => f.label);
  
  if (missingFields.length) {
    toast(`Compila i campi: ${missingFields.join(', ')}`, 'error');
    return;
  }
  
  let filename;
  if (state.isNew) {
    const slug = slugify(data.nome || data.slug);
    filename = `${slug}.md`;
  } else {
    filename = state.currentItem.filename;
  }
  
  const content = generateMarkdown(data);
  
  showLoading();
  
  try {
    const path = `${collection.folder}/${filename}`;
    const sha = state.isNew ? null : state.currentItem.sha;
    
    await saveToGitHub(path, content, sha);
    
    // Reload categories if we saved a category
    if (state.currentCollection === 'categorie') {
      await loadCategories();
    }
    
    toast('Salvato con successo!', 'success');
    await loadItems(state.currentCollection);
    showListView();
  } catch (error) {
    console.error(error);
    toast('Errore nel salvataggio', 'error');
  } finally {
    hideLoading();
  }
}

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

function slugify(text) {
  if (!text) return '';
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[àáâãäå]/g, 'a')
    .replace(/[èéêë]/g, 'e')
    .replace(/[ìíîï]/g, 'i')
    .replace(/[òóôõö]/g, 'o')
    .replace(/[ùúûü]/g, 'u')
    .replace(/[^a-z0-9-]/g, '')
    .replace(/-+/g, '-')
    .substring(0, 50);
}

async function saveToGitHub(path, content, sha = null) {
  const body = {
    message: `Update ${path}`,
    content: btoa(unescape(encodeURIComponent(content))),
    branch: CONFIG.branch
  };
  
  if (sha) {
    body.sha = sha;
  }
  
  // Use Netlify Git Gateway instead of GitHub API directly
  const apiUrl = `/.netlify/git/github/contents/${path}`;
  const headers = {
    'Authorization': `Bearer ${state.token}`,
    'Content-Type': 'application/json'
  };
  
  const response = await fetch(apiUrl, {
    method: 'PUT',
    headers,
    body: JSON.stringify(body)
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message);
  }
  
  return response.json();
}

async function deleteItem() {
  if (!state.currentItem) return;
  
  const confirmed = confirm(`Sei sicuro di voler eliminare "${state.currentItem.nome}"?`);
  if (!confirmed) return;
  
  showLoading();
  
  try {
    const collection = COLLECTIONS[state.currentCollection];
    const path = `${collection.folder}/${state.currentItem.filename}`;
    
    // Use Netlify Git Gateway
    const apiUrl = `/.netlify/git/github/contents/${path}`;
    const headers = {
      'Authorization': `Bearer ${state.token}`,
      'Content-Type': 'application/json'
    };
    
    const response = await fetch(apiUrl, {
      method: 'DELETE',
      headers,
      body: JSON.stringify({
        message: `Delete ${path}`,
        sha: state.currentItem.sha,
        branch: CONFIG.branch
      })
    });
    
    if (!response.ok) throw new Error('Errore eliminazione');
    
    // Reload categories if we deleted a category
    if (state.currentCollection === 'categorie') {
      await loadCategories();
    }
    
    toast('Eliminato con successo!', 'success');
    await loadItems(state.currentCollection);
    showListView();
  } catch (error) {
    console.error(error);
    toast("Errore nell'eliminazione", 'error');
  } finally {
    hideLoading();
  }
}
