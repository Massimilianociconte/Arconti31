// ========================================
// ARCONTI31 - MENU DIGITALE
// Lettura da JSON statici (zero rate limiting)
// ========================================

const CONFIG = {
  owner: 'Massimilianociconte',
  repo: 'Arconti31',
  branch: 'main'
};

// Icon mapping per Tags e Allergeni
const ICONS = {
  tags: {
    'Novità': '✨',
    'Senza Glutine': '🌾🚫',
    'Vegetariano': '🌿',
    'Vegano': '🌱',
    'Piccante': '🌶️',
    'Specialità': '⭐',
    'Biologico': 'bio',
    'Più venduto': '🔥',
    'default': '🏷️'
  },
  allergeni: {
    'Glutine': '🌾',
    'Lattosio': '🥛',
    'Uova': '🥚',
    'Frutta a Guscio': '🥜',
    'Pesce': '🐟',
    'Soia': '🫘',
    'Senza Glutine': '✅',
    'Solfiti': '🍷',
    'Sedano': '🥬',
    'default': '⚠️'
  }
};

// Fallback immagini categorie (usate solo se non definite nel CMS)
const DEFAULT_CATEGORY_IMAGES = {
  'Hamburger di bufala': 'images/minicard sezioni/hamburger-bufala.png',
  'Hamburger Fassona e Street food': 'images/minicard sezioni/bufala-streetfood.png',
  'OKTOBERFEST': 'images/minicard sezioni/oktoberfest.jpg',
  'Panini': 'images/minicard sezioni/panini.jpg',
  'Griglieria': 'images/minicard sezioni/picanha.jpg',
  'Piatti Speciali': 'images/minicard sezioni/piatti-speciali.jpg',
  'Piadine': 'images/minicard sezioni/piadine.jpg',
  'Fritti': 'images/minicard sezioni/fritti.jpg',
  'Dolci': 'images/minicard sezioni/dolci.jpg',
  'Aperitivo': 'images/minicard sezioni/aperitivo.jpg',
  'Birre artigianali alla spina a rotazione': 'images/minicard sezioni/birre-spina-rotazione.png',
  'Birre alla spina': 'images/minicard sezioni/birra-spina.png',
  'Birre speciali in bottiglia': 'images/minicard sezioni/speciali-bottiglia.png',
  'Frigo Birre': 'images/minicard sezioni/frigo-birre.png',
  'Cocktails': 'images/minicard sezioni/cocktail.jpg',
  'Analcolici': 'images/minicard sezioni/analcolici.jpg',
  'Bibite': 'images/minicard sezioni/bevande.jpg',
  'Caffetteria': 'images/minicard sezioni/caffetteria.jpg',
  'Bollicine': 'images/minicard sezioni/bollicine.jpg',
  'Bianchi fermi': 'images/minicard sezioni/bianchi-fermi.png',
  'Vini rossi': 'images/minicard sezioni/rossi.jpg'
};

// State
let categoriesData = [];
let foodData = [];
let beersData = [];
let beveragesData = [];
let currentView = 'home';

// ========================================
// CARICAMENTO DATI DA JSON STATICI
// ========================================

/**
 * Carica un file JSON con cache buster per avere sempre dati freschi
 */
async function loadFromJSON(jsonPath) {
  try {
    // Cache buster per evitare dati stantii
    const cacheBuster = `?t=${Date.now()}`;
    const res = await fetch(jsonPath + cacheBuster);
    if (!res.ok) {
      console.warn(`⚠️ Errore caricamento ${jsonPath}: ${res.status}`);
      return null;
    }
    return await res.json();
  } catch (e) {
    console.error(`❌ Errore fetch ${jsonPath}:`, e);
    return null;
  }
}

// ========================================
// DATA LOADING
// ========================================

// ========================================
// DATA LOADING
// ========================================

async function loadAllData() {
  showLoading();

  // Init SmartCache
  if (window.SmartCache) {
    await window.SmartCache.init();
    
    // Try to load from cache first
    const cachedFood = await window.SmartCache.getAll('items');
    if (cachedFood.length > 0) {
      console.log('⚡ Loaded items from SmartCache');
      processItems(cachedFood);
      showCategoriesView();
      hideLoading();
    }

    // Subscribe to updates
    window.SmartCache.subscribe((changes) => {
      console.log('🔄 SmartCache update received:', changes);
      // Reload data from cache (which is now updated)
      window.SmartCache.getAll('items').then(items => {
        processItems(items);
        // Re-render current view
        if (currentView === 'home') showCategoriesView();
        else if (currentView === 'detail') {
          // Find current category name from DOM or state (simplified here)
          const title = document.querySelector('.section-title')?.textContent;
          if (title) {
             // Determine type based on title/items
             // This is a bit hacky, better to store currentCategory in state
             // For now, just go home to be safe or try to refresh
             goHome(); 
          }
        }
      });
    });
  }

  try {
    // Carica tutti i JSON in parallelo (velocissimo, zero rate limiting!)
    const [categoriesRes, foodRes, beersRes, beveragesRes] = await Promise.all([
      loadFromJSON('/categorie/categorie.json'),
      loadFromJSON('/food/food.json'),
      loadFromJSON('/beers/beers.json'),
      loadFromJSON('/beverages/beverages.json')
    ]);

    // Process raw JSON data
    let allItems = [];
    if (categoriesRes?.categories) allItems = allItems.concat(categoriesRes.categories.map(i => ({...i, _collection: 'categorie'})));
    if (foodRes?.food) allItems = allItems.concat(foodRes.food.map(i => ({...i, _collection: 'food'})));
    if (beersRes?.beers) allItems = allItems.concat(beersRes.beers.map(i => ({...i, _collection: 'beers'})));
    if (beveragesRes?.beverages) allItems = allItems.concat(beveragesRes.beverages.map(i => ({...i, _collection: 'beverages'})));

    // Update SmartCache
    if (window.SmartCache) {
      // Sync each collection
      if (categoriesRes?.categories) window.SmartCache.syncCollection(categoriesRes.categories, 'categorie');
      if (foodRes?.food) window.SmartCache.syncCollection(foodRes.food, 'food');
      if (beersRes?.beers) window.SmartCache.syncCollection(beersRes.beers, 'beers');
      if (beveragesRes?.beverages) window.SmartCache.syncCollection(beveragesRes.beverages, 'beverages');
    }

    // Process for UI
    processItems(allItems);

    console.log(`✅ Dati caricati: ${foodData.length} piatti, ${beersData.length} birre, ${beveragesData.length} bevande`);

    showCategoriesView();
  } catch (error) {
    console.error('Errore nel caricamento:', error);
    document.getElementById('categories-view').innerHTML =
      '<p class="loading">Errore nel caricamento. Riprova più tardi.</p>';
  } finally {
    hideLoading();
  }
}

function processItems(items) {
  // Filter by collection/type
  categoriesData = items.filter(i => i._collection === 'categorie' || (!i._collection && i.tipo_menu))
    .filter(c => c.visibile !== false)
    .sort((a, b) => (a.order || 0) - (b.order || 0));

  foodData = items.filter(i => i._collection === 'food' || (!i._collection && i.category))
    .sort((a, b) => (a.order || 0) - (b.order || 0));

  beersData = items.filter(i => i._collection === 'beers' || (!i._collection && i.sezione))
    .sort((a, b) => (a.order || 0) - (b.order || 0));

  beveragesData = items.filter(i => i._collection === 'beverages' || (!i._collection && i.tipo))
    .sort((a, b) => (a.order || 0) - (b.order || 0));
}

function showLoading() {
  document.getElementById('categories-view').innerHTML =
    '<div class="loading">Caricamento Menù...</div>';
}

function hideLoading() {
  // Loading viene sostituito dal contenuto
}

// ========================================
// VIEWS
// ========================================

function showCategoriesView() {
  currentView = 'home';
  document.getElementById('breadcrumb').style.display = 'none';
  document.getElementById('categories-view').style.display = 'block';
  document.getElementById('detail-view').style.display = 'none';

  const categoriesView = document.getElementById('categories-view');
  let html = '';

  // Food Categories
  const foodCategories = categoriesData.filter(c => c.tipo_menu === 'food');

  // Se non ci sono categorie dinamiche, usa default
  const defaultFoodOrder = [
    { nome: 'Hamburger di bufala', icona: '🍔' },
    { nome: 'OKTOBERFEST', icona: '🥨' },
    { nome: 'Hamburger Fassona e Street food', icona: '🥩' },
    { nome: 'Panini', icona: '🥪' },
    { nome: 'Griglieria', icona: '🔥' },
    { nome: 'Piatti Speciali', icona: '🍽️' },
    { nome: 'Piadine', icona: '🥯' },
    { nome: 'Fritti', icona: '🍟' },
    { nome: 'Dolci', icona: '🍰' },
    { nome: 'Aperitivo', icona: '🥜' }
  ];

  const foodOrder = foodCategories.length > 0 ? foodCategories : defaultFoodOrder;

  html += '<h2 class="section-header">Cucina</h2><div class="categories-grid">';
  foodOrder.forEach(cat => {
    const items = foodData.filter(f => f.category === cat.nome && f.disponibile !== false);
    // Mostra categoria se ha prodotti o è definita dinamicamente
    if (items.length > 0 || foodCategories.find(c => c.nome === cat.nome)) {
      html += createCategoryCard(cat, items.length, 'food');
    }
  });
  html += '</div>';

  // Beer Categories
  html += '<h2 class="section-header">Beverage</h2><div class="categories-grid">';

  const beerSections = [
    { nome: 'Birre artigianali alla spina a rotazione', icona: '🍺' },
    { nome: 'Birre alla spina', icona: '🍻' },
    { nome: 'Birre speciali in bottiglia', icona: '🍾' },
    { nome: 'Frigo Birre', icona: '❄️' }
  ];

  beerSections.forEach(section => {
    const items = beersData.filter(b => b.sezione === section.nome && b.disponibile !== false);
    if (items.length > 0) {
      html += createCategoryCard(section, items.length, 'beer');
    }
  });

  // Other Beverages
  const beverageTypes = [
    { nome: 'Cocktails', icona: '🍹' },
    { nome: 'Analcolici', icona: '🥤' },
    { nome: 'Bibite', icona: '🥫' },
    { nome: 'Caffetteria', icona: '☕' },
    { nome: 'Bollicine', icona: '🥂' },
    { nome: 'Bianchi fermi', icona: '🍷' },
    { nome: 'Vini rossi', icona: '🍷' }
  ];

  beverageTypes.forEach(type => {
    const items = beveragesData.filter(b => b.tipo === type.nome && b.disponibile !== false);
    if (items.length > 0) {
      // Cerca categoria dinamica per immagine
      const dynamicCat = categoriesData.find(c => c.nome === type.nome);
      const catData = dynamicCat || type;
      html += createCategoryCard(catData, items.length, 'beverage');
    }
  });

  html += '</div>';

  categoriesView.innerHTML = html;
}

function createCategoryCard(cat, count, type) {
  // Priorità: immagine dalla categoria dinamica > fallback hardcoded
  let imageUrl = cat.immagine || DEFAULT_CATEGORY_IMAGES[cat.nome] || null;

  const hasImageClass = imageUrl ? 'has-bg-image' : '';
  const imageHtml = imageUrl
    ? `<img src="${imageUrl}" alt="${cat.nome}" class="category-bg-img" loading="lazy" decoding="async">`
    : '';

  return `
    <div class="category-card ${hasImageClass}" onclick="showCategory('${cat.nome}', '${type}')">
      <div class="category-bg-layer">${imageHtml}</div>
      <div class="category-overlay-layer"></div>
      <div class="category-content-wrapper">
        <div class="category-info">
          <div class="category-title">${cat.nome}</div>
          <div class="category-count">${count} prodotti</div>
        </div>
        <div class="category-arrow">→</div>
      </div>
    </div>
  `;
}

function showCategory(categoryName, type) {
  currentView = 'detail';
  document.getElementById('breadcrumb').style.display = 'flex';
  document.getElementById('categories-view').style.display = 'none';
  document.getElementById('detail-view').style.display = 'block';

  let items = [];

  if (type === 'beer') {
    items = beersData.filter(b => b.sezione === categoryName && b.disponibile !== false);
  } else if (type === 'beverage') {
    items = beveragesData.filter(b => b.tipo === categoryName && b.disponibile !== false);
  } else if (type === 'food') {
    items = foodData.filter(f => f.category === categoryName && f.disponibile !== false);
  }

  // Ordina per order
  items.sort((a, b) => (a.order || 0) - (b.order || 0));

  const detailContent = document.getElementById('detail-content');
  detailContent.innerHTML = `
    <h2 class="section-title">${categoryName}</h2>
    <div class="beer-grid">
      ${items.map((item, index) => renderCard(item, index, type)).join('')}
    </div>
  `;

  window.scrollTo(0, 0);
}

function goHome() {
  showCategoriesView();
  window.scrollTo(0, 0);
}

// ========================================
// CARD RENDERING
// ========================================

function renderCard(item, index, type) {
  // Immagine copertina (opzionale)
  const hasImage = item.immagine || item.immagine_copertina;
  const imageUrl = item.immagine_copertina || item.immagine;

  const imageHtml = hasImage
    ? `<div class="card-image-container"><img src="${imageUrl}" alt="${item.nome}" class="beer-image" loading="lazy" decoding="async"></div>`
    : '';

  const noImageClass = !hasImage ? 'no-image-card' : '';

  // Avatar/Logo (opzionale)
  const logoUrl = item.immagine_avatar || item.logo;
  const logoHtml = logoUrl
    ? `<img src="${logoUrl}" alt="${item.nome}" class="beer-logo">`
    : '';

  const categoryLabel = type === 'beer' ? item.sezione : (type === 'food' ? item.category : item.tipo);

  // Tags
  let tagsHtml = '';
  if (item.tags) {
    let tagsList = Array.isArray(item.tags) ? item.tags : [item.tags];
    tagsList = tagsList.filter(t => t && t !== 'Nessuno');
    if (tagsList.length > 0) {
      tagsHtml = `<div class="card-badges">
        ${tagsList.map(tag => {
        const icon = ICONS.tags[tag] || ICONS.tags['default'];
        const className = tag.toLowerCase().replace(/[^a-z0-9]+/g, '-');
        return `<span class="badge badge-${className}">${icon} ${tag}</span>`;
      }).join('')}
      </div>`;
    }
  }

  const description = item.descrizione ? `<p class="beer-description">${item.descrizione}</p>` : '';

  return `
    <div class="beer-card ${noImageClass}" style="animation-delay: ${(index % 10) * 0.05}s" onclick="openModal('${item.nome.replace(/'/g, "\\'")}', '${type}')">
      ${imageHtml}
      <div class="beer-content">
        <div class="card-header">
          <div class="header-left">
            ${logoHtml}
            <div class="title-group">
              ${categoryLabel ? `<span class="tiny-category">${categoryLabel}</span>` : ''}
              <h3 class="beer-name">${item.nome}</h3>
            </div>
          </div>
          <div class="price-tag">€${item.prezzo}</div>
        </div>
        ${description}
        <div class="card-footer">
          ${tagsHtml}
          <div class="availability-dot ${item.disponibile !== false ? 'available' : 'unavailable'}" title="${item.disponibile !== false ? 'Disponibile' : 'Non disponibile'}"></div>
        </div>
      </div>
    </div>
  `;
}

// ========================================
// MODAL
// ========================================

function openModal(itemName, type) {
  let allItems = [];
  if (type === 'beer') allItems = beersData;
  else if (type === 'beverage') allItems = beveragesData;
  else if (type === 'food') allItems = foodData;

  const item = allItems.find(i => i.nome === itemName.replace(/\\'/g, "'"));
  if (!item) return;

  const modal = document.getElementById('beer-modal');
  const modalBody = document.getElementById('modal-body');

  // Immagine copertina
  const imageUrl = item.immagine_copertina || item.immagine;
  const imageHtml = imageUrl ? `<div class="modal-hero-wrapper"><img src="${imageUrl}" class="modal-hero-img"></div>` : '';

  // Avatar
  const avatarUrl = item.immagine_avatar || item.logo;
  const avatarHtml = avatarUrl ? `<img src="${avatarUrl}" class="modal-logo-small" alt="Logo">` : '';

  // Tags
  let tagsHtml = '';
  if (item.tags) {
    let tagsList = Array.isArray(item.tags) ? item.tags : [item.tags];
    tagsList = tagsList.filter(t => t && t !== 'Nessuno');
    if (tagsList.length > 0) {
      tagsHtml = `<div class="modal-tags-list">
        ${tagsList.map(tag => {
        const icon = ICONS.tags[tag] || ICONS.tags['default'];
        return `<span class="modal-tag">${icon} ${tag}</span>`;
      }).join('')}
      </div>`;
    }
  }

  // Allergeni
  let allergeniHtml = '';
  if (item.allergeni) {
    let allList = Array.isArray(item.allergeni) ? item.allergeni : [item.allergeni];
    allList = allList.filter(a => a);
    if (allList.length > 0) {
      allergeniHtml = `
        <div class="modal-allergens-section">
          <h4>Allergeni</h4>
          <div class="allergens-grid">
            ${allList.map(a => {
        const icon = ICONS.allergeni[a] || ICONS.allergeni['default'];
        return `<div class="allergen-item"><span class="allergen-icon">${icon}</span> ${a}</div>`;
      }).join('')}
          </div>
        </div>`;
    }
  }

  modalBody.innerHTML = `
    ${imageHtml}
    <div class="modal-content-scroll">
      <div class="modal-header-row">
        <h2 class="modal-title">${item.nome}</h2>
        <span class="modal-price-big">€${item.prezzo}</span>
      </div>
      ${avatarHtml}
      <div class="modal-desc-text">
        ${item.descrizione_dettagliata || item.descrizione || 'Nessuna descrizione aggiuntiva.'}
      </div>
      ${tagsHtml}
      <div class="modal-meta-info">
        ${item.gradazione ? `<div class="meta-box"><strong>Alcol</strong> ${item.gradazione}</div>` : ''}
        ${item.formato ? `<div class="meta-box"><strong>Formato</strong> ${item.formato}</div>` : ''}
      </div>
      ${allergeniHtml}
    </div>
    <div class="modal-close-btn-wrapper">
      <button onclick="closeModal()" class="modal-close-action">Chiudi</button>
    </div>
  `;

  modal.classList.add('active');
  document.body.style.overflow = 'hidden';
}

function closeModal() {
  document.getElementById('beer-modal').classList.remove('active');
  document.body.style.overflow = '';
}

// Event listeners
document.getElementById('beer-modal').addEventListener('click', (e) => {
  if (e.target.id === 'beer-modal') closeModal();
});

document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') closeModal();
});

function toggleCompactView() {
  const grid = document.querySelector('.beer-grid');
  const toggleText = document.querySelector('.toggle-text');
  if (grid) {
    grid.classList.toggle('compact-view');
    toggleText.textContent = grid.classList.contains('compact-view') ? 'Lista' : 'Griglia';
  }
}

// Init
document.addEventListener('DOMContentLoaded', loadAllData);
