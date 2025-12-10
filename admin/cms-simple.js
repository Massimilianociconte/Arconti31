/* ========================================
   ARCONTI31 CMS - VERSIONE SEMPLIFICATA
   Autenticazione con password locale
   ======================================== */

const CONFIG = {
  owner: 'Massimilianociconte',
  repo: 'Arconti31',
  branch: 'main'
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
      { name: 'immagine', label: 'Immagine', type: 'text', hint: 'Percorso immagine' },
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
      { name: 'descrizione', label: 'Descrizione', type: 'textarea' },
      { name: 'visibile', label: 'Visibile', type: 'toggle', default: true },
      { name: 'order', label: 'Ordine', type: 'number', default: 0 }
    ]
  }
};

// State
let state = {
  password: sessionStorage.getItem('cms_password') || '',
  isLoggedIn: false,
  currentCollection: 'food',
  items: [],
  categories: [],
  currentItem: null,
  isNew: false
};

// DOM helpers
const $ = sel => document.querySelector(sel);
const $$ = sel => document.querySelectorAll(sel);

// Init
document.addEventListener('DOMContentLoaded', init);

function init() {
  setupEventListeners();
  
  // Auto-login se password salvata
  if (state.password) {
    state.isLoggedIn = true;
    showMainApp();
    loadCategories().then(() => loadItems(state.currentCollection));
  }
}

function setupEventListeners() {
  // Login
  $('#login-form').addEventListener('submit', handleLogin);
  
  // Sidebar
  $('#menu-toggle').addEventListener('click', toggleSidebar);
  $$('.nav-item').forEach(item => {
    item.addEventListener('click', e => {
      e.preventDefault();
      selectCollection(item.dataset.collection);
      closeSidebar();
    });
  });
  
  // Actions
  $('#add-new-btn').addEventListener('click', createNew);
  $('#back-btn').addEventListener('click', showListView);
  $('#save-btn').addEventListener('click', saveItem);
  $('#delete-btn').addEventListener('click', deleteItem);
  $('#sync-btn').addEventListener('click', () => {
    loadCategories().then(() => loadItems(state.currentCollection));
  });
  $('#logout-btn').addEventListener('click', logout);
  
  // Filters
  $('#search-input').addEventListener('input', filterItems);
  $('#filter-category').addEventListener('change', filterItems);
  $('#filter-status').addEventListener('change', filterItems);
}

// ========================================
// AUTH
// ========================================

function handleLogin(e) {
  e.preventDefault();
  const password = $('#password-input').value;
  
  if (!password) {
    toast('Inserisci la password', 'error');
    return;
  }
  
  state.password = password;
  sessionStorage.setItem('cms_password', password);
  state.isLoggedIn = true;
  
  showMainApp();
  loadCategories().then(() => loadItems(state.currentCollection));
}

function logout() {
  state.password = '';
  state.isLoggedIn = false;
  sessionStorage.removeItem('cms_password');
  showLoginScreen();
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

function showLoading() {
  $('#loading-overlay').classList.add('active');
}

function hideLoading() {
  $('#loading-overlay').classList.remove('active');
}

function toast(message, type = 'info') {
  const container = $('#toast-container');
  const t = document.createElement('div');
  t.className = `toast ${type}`;
  t.textContent = message;
  container.appendChild(t);
  setTimeout(() => t.remove(), 3000);
}

// ========================================
// DATA LOADING (GitHub API - no auth needed for public repos)
// ========================================

async function loadCategories() {
  try {
    const url = `https://api.github.com/repos/${CONFIG.owner}/${CONFIG.repo}/contents/categorie`;
    const res = await fetch(url);
    
    if (!res.ok) {
      state.categories = [];
      return;
    }
    
    const files = await res.json();
    const mdFiles = files.filter(f => f.name.endsWith('.md'));
    
    const categories = await Promise.all(mdFiles.map(async file => {
      const content = await (await fetch(file.download_url)).text();
      return parseMarkdown(content, file.name, file.sha);
    }));
    
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
    const url = `https://api.github.com/repos/${CONFIG.owner}/${CONFIG.repo}/contents/${collection.folder}`;
    const res = await fetch(url);
    
    if (!res.ok) throw new Error('Errore caricamento');
    
    const files = await res.json();
    const mdFiles = files.filter(f => f.name.endsWith('.md') && f.name !== '.gitkeep');
    
    const items = await Promise.all(mdFiles.map(async file => {
      const content = await (await fetch(file.download_url)).text();
      return parseMarkdown(content, file.name, file.sha);
    }));
    
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
// COLLECTION & RENDERING
// ========================================

function selectCollection(name) {
  state.currentCollection = name;
  $$('.nav-item').forEach(item => item.classList.toggle('active', item.dataset.collection === name));
  $('#collection-title').textContent = COLLECTIONS[name].label;
  updateCategoryFilter(name);
  loadItems(name);
  showListView();
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
    html += `
      <div class="category-group">
        <div class="category-header">
          <span class="category-icon">${catData?.icona || '📦'}</span>
          <span class="category-name">${cat}</span>
          <span class="category-count">${grouped[cat].length}</span>
        </div>
        <div class="category-items">${grouped[cat].map(renderItemCard).join('')}</div>
      </div>
    `;
  });
  
  list.innerHTML = html;
}

function renderItemCard(item) {
  return `
    <div class="item-card ${item.disponibile === false ? 'unavailable' : ''}" data-filename="${item.filename}">
      <div class="item-info">
        <div class="item-name">${item.nome || 'Senza nome'}</div>
        <div class="item-meta">
          <span class="item-price">€${item.prezzo || '0'}</span>
          <span class="status-dot ${item.disponibile !== false ? 'available' : 'unavailable'}"></span>
        </div>
      </div>
    </div>
  `;
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
        
      default: return '';
    }
  }).join('');
  
  // Tag click handlers
  $$('.tag-option').forEach(tag => tag.addEventListener('click', () => tag.classList.toggle('selected')));
  
  // Auto-slug
  const nomeInput = form.querySelector('[name="nome"]');
  const slugInput = form.querySelector('[data-auto-slug="true"]');
  if (nomeInput && slugInput && state.isNew) {
    nomeInput.addEventListener('input', () => slugInput.value = slugify(nomeInput.value));
  }
}

function escapeHtml(text) {
  if (typeof text !== 'string') return text;
  return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

// ========================================
// SAVE & DELETE (via Netlify Function)
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
        password: state.password,
        action: 'save',
        collection: collection.folder,
        filename: filename,
        data: data,
        sha: state.isNew ? null : state.currentItem.sha
      })
    });
    
    const result = await res.json();
    
    if (!res.ok) {
      throw new Error(result.error || 'Errore salvataggio');
    }
    
    toast('Salvato!', 'success');
    
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
        password: state.password,
        action: 'delete',
        collection: collection.folder,
        filename: state.currentItem.filename,
        sha: state.currentItem.sha
      })
    });
    
    const result = await res.json();
    
    if (!res.ok) {
      throw new Error(result.error || 'Errore eliminazione');
    }
    
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
