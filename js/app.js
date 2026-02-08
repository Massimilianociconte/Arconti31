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
    'Crostacei': '🦐',
    'Uova': '🥚',
    'Pesce': '🐟',
    'Arachidi': '🥜',
    'Soia': '🫘',
    'Latte': '🥛',
    'Frutta a guscio': '🌰',
    'Sedano': '🥬',
    'Senape': '🟡',
    'Sesamo': '⚪',
    'Anidride solforosa e solfiti': '🍷',
    'Lupini': '🫛',
    'Molluschi': '🦪',
    'Lattosio': '🥛',
    'Senza Glutine': '✅',
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
let currentCategory = null;
let currentCategoryType = null;

// ========================================
// UTILITY FUNCTIONS
// ========================================

/**
 * Escape HTML per prevenire XSS
 */
function escapeHtml(str) {
  if (!str) return '';
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

// ========================================
// FORMATTAZIONE PREZZI (Locale IT)
// ========================================

/**
 * Formatta un prezzo con localizzazione italiana (virgola come separatore decimale)
 * @param {string|number} price - Il prezzo da formattare (accetta sia punto che virgola)
 * @returns {string} - Prezzo formattato (es: "14,50")
 */
function formatPrice(price) {
  if (price === undefined || price === null || price === '') return '0,00';
  
  // Converti in stringa e normalizza: sostituisci virgola con punto per parsing
  let normalized = String(price).replace(',', '.');
  
  // Rimuovi eventuali caratteri non numerici (tranne punto e segno)
  normalized = normalized.replace(/[^\d.-]/g, '');
  
  // Parsa come float
  const numValue = parseFloat(normalized);
  
  // Se non è un numero valido, ritorna '0,00'
  if (isNaN(numValue)) return '0,00';
  
  // Usa Intl.NumberFormat per formattazione italiana
  return new Intl.NumberFormat('it-IT', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(numValue);
}

// ========================================
// CARICAMENTO DATI DA JSON STATICI
// ========================================

/**
 * Carica un file JSON con cache buster per avere sempre dati freschi
 */
async function loadFromJSON(jsonPath) {
  try {
    // Cache buster: 60s granularity allows browser to reuse within the same minute
    const cacheBuster = `?_=${Math.floor(Date.now() / 60000)}`;
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
  
  // Salva l'hash PRIMA di qualsiasi operazione (per il restore dopo)
  const initialHash = window.location.hash.slice(1);

  // Init SmartCache
  if (window.SmartCache) {
    await window.SmartCache.init();
    
    // Try to load from cache first (ma filtra items eliminati)
    const cachedFood = await window.SmartCache.getAll('items');
    const validCachedItems = cachedFood.filter(i => !i._deleted);
    
    if (validCachedItems.length > 0) {
      console.log('⚡ Loaded items from SmartCache');
      processItems(validCachedItems);
      
      // Se c'è un hash, naviga alla categoria invece di mostrare home
      if (initialHash) {
        const category = findCategoryBySlug(initialHash);
        if (category) {
          showCategory(category.name, category.type);
        } else {
          showCategoriesView();
        }
      } else {
        showCategoriesView();
      }
      hideLoading();
    }

    // Subscribe to updates
    window.SmartCache.subscribe((changes) => {
      console.log('🔄 SmartCache update received:', changes);
      // Aggiorna i dati in background senza cambiare la vista corrente
      window.SmartCache.getAll('items').then(items => {
        // Filtra sempre gli items eliminati
        processItems(items.filter(i => !i._deleted));
        // NON fare goHome() - l'utente potrebbe essere in una categoria
        // Aggiorna solo se siamo nella home
        if (currentView === 'home') {
          showCategoriesView();
        }
        // Se siamo in una categoria, i dati sono già aggiornati in memoria
        // e verranno mostrati al prossimo render
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
      if (categoriesRes?.categories) await window.SmartCache.syncCollection(categoriesRes.categories, 'categorie');
      if (foodRes?.food) await window.SmartCache.syncCollection(foodRes.food, 'food');
      if (beersRes?.beers) await window.SmartCache.syncCollection(beersRes.beers, 'beers');
      if (beveragesRes?.beverages) await window.SmartCache.syncCollection(beveragesRes.beverages, 'beverages');
      
      // RE-FETCH from SmartCache to get the authoritative version (including local edits)
      // This ensures that if we have local changes (protected by stale data check),
      // we use THOSE instead of the stale JSON we just downloaded.
      const cachedItems = await window.SmartCache.getAll('items');
      allItems = cachedItems.filter(i => !i._deleted);
    }

    // Process for UI
    processItems(allItems);

    console.log(`✅ Dati caricati: ${foodData.length} piatti, ${beersData.length} birre, ${beveragesData.length} bevande`);

    // Controlla se c'è un hash nell'URL per navigare direttamente alla categoria
    // (usa initialHash salvato all'inizio per evitare race condition)
    if (initialHash) {
      const category = findCategoryBySlug(initialHash);
      if (category) {
        showCategory(category.name, category.type);
      } else {
        showCategoriesView();
      }
    } else {
      showCategoriesView();
    }
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
  currentCategory = null;
  currentCategoryType = null;
  
  // Aggiorna URL senza hash
  if (window.location.hash) {
    history.pushState(null, '', window.location.pathname);
  }
  
  document.getElementById('breadcrumb').style.display = 'none';
  document.getElementById('categories-view').style.display = 'block';
  document.getElementById('detail-view').style.display = 'none';

  const categoriesView = document.getElementById('categories-view');
  let html = '';

  // 1. CUCINA (Food)
  // Usa SOLO le categorie dinamiche caricate (che sono già filtrate per visibilità)
  const foodCategories = categoriesData.filter(c => c.tipo_menu === 'food');
  
  if (foodCategories.length > 0) {
    html += '<h2 class="section-header">Cucina</h2><div class="categories-grid">';
    foodCategories.forEach(cat => {
      const items = foodData.filter(f => f.category === cat.nome && f.disponibile !== false);
      html += createCategoryCard(cat, items.length, 'food');
    });
    html += '</div>';
  }

  // 2. BEVERAGE (Beers + Beverages)
  const beverageCategories = categoriesData.filter(c => c.tipo_menu === 'beverage');
  
  if (beverageCategories.length > 0) {
    html += '<h2 class="section-header">Beverage</h2><div class="categories-grid">';
    
    beverageCategories.forEach(cat => {
      // Cerca in birre
      let items = beersData.filter(b => b.sezione === cat.nome && b.disponibile !== false);
      let type = 'beer';
      
      // Se non trovato, cerca in beverages
      if (items.length === 0) {
        items = beveragesData.filter(b => b.tipo === cat.nome && b.disponibile !== false);
        type = 'beverage';
      }
      
      html += createCategoryCard(cat, items.length, type);
    });
    
    html += '</div>';
  }
  
  // Fallback se non ci sono categorie caricate (es. errore o tutto nascosto)
  if (foodCategories.length === 0 && beverageCategories.length === 0) {
     html = '<div class="empty-state" style="text-align:center; padding: 2rem;">Nessuna categoria disponibile al momento.</div>';
  }

  categoriesView.innerHTML = html;
  
  // Event delegation per le category card (evita inline onclick)
  categoriesView.querySelectorAll('.category-card').forEach(card => {
    card.addEventListener('click', () => {
      const categoryName = card.dataset.category;
      const type = card.dataset.type;
      if (categoryName && type) {
        showCategory(categoryName, type);
      }
    });
  });
}

function createCategoryCard(cat, count, type) {
  // Priorità: immagine dalla categoria dinamica > fallback hardcoded
  let imageUrl = cat.immagine || DEFAULT_CATEGORY_IMAGES[cat.nome] || null;
  
  // Sanitizza per prevenire XSS
  const safeName = escapeHtml(cat.nome);
  const safeType = escapeHtml(type);

  const hasImageClass = imageUrl ? 'has-bg-image' : '';
  const imageHtml = imageUrl
    ? `<img src="${escapeHtml(imageUrl)}" alt="${safeName}" class="category-bg-img" loading="lazy" decoding="async">`
    : '';

  return `
    <div class="category-card ${hasImageClass}" data-category="${safeName}" data-type="${safeType}">
      <div class="category-bg-layer">${imageHtml}</div>
      <div class="category-overlay-layer"></div>
      <div class="category-content-wrapper">
        <div class="category-info">
          <div class="category-title">${safeName}</div>
          <div class="category-count">${count} prodotti</div>
        </div>
        <div class="category-arrow">→</div>
      </div>
    </div>
  `;
}

function showCategory(categoryName, type) {
  currentView = 'detail';
  currentCategory = categoryName;
  currentCategoryType = type;
  
  // Aggiorna URL con hash per permettere refresh e condivisione
  const slug = slugifyCategory(categoryName);
  history.pushState({ category: categoryName, type: type }, '', `#${slug}`);
  
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
    <h2 class="section-title">${escapeHtml(categoryName)}</h2>
    <div class="beer-grid">
      ${items.map((item, index) => renderCard(item, index, type)).join('')}
    </div>
  `;
  
  // Event delegation per le beer-card (evita inline onclick)
  detailContent.querySelectorAll('.beer-card').forEach(card => {
    card.addEventListener('click', () => {
      const itemName = card.dataset.itemName;
      const itemType = card.dataset.itemType;
      if (itemName && itemType) {
        openModal(itemName, itemType);
      }
    });
  });

  window.scrollTo(0, 0);
}

/**
 * Converte il nome categoria in uno slug URL-friendly
 */
function slugifyCategory(name) {
  return name.toString().toLowerCase().trim()
    .replace(/\s+/g, '-')
    .replace(/[àáâãäå]/g, 'a').replace(/[èéêë]/g, 'e')
    .replace(/[ìíîï]/g, 'i').replace(/[òóôõö]/g, 'o').replace(/[ùúûü]/g, 'u')
    .replace(/[^a-z0-9-]/g, '').replace(/-+/g, '-');
}

/**
 * Trova una categoria dal suo slug
 */
function findCategoryBySlug(slug) {
  if (!slug) return null;
  
  const normalizedSlug = slug.toLowerCase();
  
  // Cerca in tutte le categorie
  for (const cat of categoriesData) {
    if (slugifyCategory(cat.nome) === normalizedSlug) {
      // Determina il tipo
      let type = 'food';
      if (cat.tipo_menu === 'beverage') {
        // Controlla se è birra o altra bevanda
        const isBeer = beersData.some(b => b.sezione === cat.nome);
        type = isBeer ? 'beer' : 'beverage';
      }
      return { name: cat.nome, type: type };
    }
  }
  
  return null;
}

/**
 * Gestisce la navigazione da URL hash (refresh o link diretto)
 */
function handleHashNavigation() {
  const hash = window.location.hash.slice(1); // Rimuovi il #
  
  if (!hash) {
    // Nessun hash, mostra home
    if (currentView !== 'home') {
      showCategoriesView();
    }
    return;
  }
  
  // Cerca la categoria corrispondente
  const category = findCategoryBySlug(hash);
  
  if (category) {
    showCategory(category.name, category.type);
  } else {
    // Hash non valido, vai alla home
    showCategoriesView();
  }
}

function goHome() {
  // Aggiorna URL rimuovendo l'hash
  history.pushState(null, '', window.location.pathname);
  showCategoriesView();
  window.scrollTo(0, 0);
}

// ========================================
// CARD RENDERING
// ========================================

function renderCard(item, index, type) {
  // Sanitizza per prevenire XSS
  const safeName = escapeHtml(item.nome);
  const safeType = escapeHtml(type);
  const safeDescription = item.descrizione ? escapeHtml(item.descrizione) : '';
  const safeCategoryLabel = type === 'beer' ? escapeHtml(item.sezione || '') : (type === 'food' ? escapeHtml(item.category || '') : escapeHtml(item.tipo || ''));
  
  // Immagine copertina (opzionale)
  const hasImage = item.immagine || item.immagine_copertina;
  const imageUrl = item.immagine_copertina || item.immagine;

  const imageHtml = hasImage
    ? `<div class="card-image-container"><img src="${escapeHtml(imageUrl)}" alt="${safeName}" class="beer-image" loading="lazy" decoding="async"></div>`
    : '';

  const noImageClass = !hasImage ? 'no-image-card' : '';

  // Avatar/Logo (opzionale)
  const logoUrl = item.immagine_avatar || item.logo;
  const logoHtml = logoUrl
    ? `<img src="${escapeHtml(logoUrl)}" alt="${safeName}" class="beer-logo">`
    : '';

  // Tags
  let tagsHtml = '';
  if (item.tags) {
    let tagsList = Array.isArray(item.tags) ? item.tags : [item.tags];
    tagsList = tagsList.filter(t => t && t !== 'Nessuno');
    if (tagsList.length > 0) {
      tagsHtml = `<div class="card-badges">
        ${tagsList.map(tag => {
        const icon = ICONS.tags[tag] || ICONS.tags['default'];
        const className = escapeHtml(tag).toLowerCase().replace(/[^a-z0-9]+/g, '-');
        return `<span class="badge badge-${className}">${icon} ${escapeHtml(tag)}</span>`;
      }).join('')}
      </div>`;
    }
  }

  const description = safeDescription ? `<p class="beer-description">${safeDescription}</p>` : '';

  return `
    <div class="beer-card ${noImageClass}" style="animation-delay: ${(index % 10) * 0.05}s" data-item-name="${safeName}" data-item-type="${safeType}">
      ${imageHtml}
      <div class="beer-content">
        <div class="card-header">
          <div class="header-left">
            ${logoHtml}
            <div class="title-group">
              ${safeCategoryLabel ? `<span class="tiny-category">${safeCategoryLabel}</span>` : ''}
              <h3 class="beer-name">${safeName}</h3>
            </div>
          </div>
          <div class="price-tag">€${formatPrice(item.prezzo)}</div>
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

  // Sanitizza tutti i campi per prevenire XSS
  const safeName = escapeHtml(item.nome);
  const safeDescription = escapeHtml(item.descrizione_dettagliata || item.descrizione || 'Nessuna descrizione aggiuntiva.');
  const safeGradazione = item.gradazione ? escapeHtml(item.gradazione) : '';
  const safeFormato = item.formato ? escapeHtml(item.formato) : '';

  // Immagine copertina
  const imageUrl = item.immagine_copertina || item.immagine;
  const imageHtml = imageUrl ? `<div class="modal-hero-wrapper"><img src="${escapeHtml(imageUrl)}" class="modal-hero-img" alt="${safeName}"></div>` : '';

  // Avatar
  const avatarUrl = item.immagine_avatar || item.logo;
  const avatarHtml = avatarUrl ? `<img src="${escapeHtml(avatarUrl)}" class="modal-logo-small" alt="Logo">` : '';

  // Tags (sanitizzati)
  let tagsHtml = '';
  if (item.tags) {
    let tagsList = Array.isArray(item.tags) ? item.tags : [item.tags];
    tagsList = tagsList.filter(t => t && t !== 'Nessuno');
    if (tagsList.length > 0) {
      tagsHtml = `<div class="modal-tags-list">
        ${tagsList.map(tag => {
        const icon = ICONS.tags[tag] || ICONS.tags['default'];
        return `<span class="modal-tag">${icon} ${escapeHtml(tag)}</span>`;
      }).join('')}
      </div>`;
    }
  }

  // Allergeni (sanitizzati)
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
        return `<div class="allergen-item"><span class="allergen-icon">${icon}</span> ${escapeHtml(a)}</div>`;
      }).join('')}
          </div>
        </div>`;
    }
  }

  modalBody.innerHTML = `
    ${imageHtml}
    <div class="modal-content-scroll">
      <div class="modal-header-row">
        <h2 class="modal-title">${safeName}</h2>
        <span class="modal-price-big">€${formatPrice(item.prezzo)}</span>
      </div>
      ${avatarHtml}
      <div class="modal-desc-text">
        ${safeDescription}
      </div>
      ${tagsHtml}
      <div class="modal-meta-info">
        ${safeGradazione ? `<div class="meta-box"><strong>Alcol</strong> ${safeGradazione}</div>` : ''}
        ${safeFormato ? `<div class="meta-box"><strong>Formato</strong> ${safeFormato}</div>` : ''}
      </div>
      ${allergeniHtml}
    </div>
    <div class="modal-close-btn-wrapper">
      <button class="modal-close-action">Chiudi</button>
    </div>
  `;
  
  // Event listener per chiusura (evita inline onclick)
  modalBody.querySelector('.modal-close-action').addEventListener('click', closeModal);

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

// Gestione navigazione browser (back/forward)
window.addEventListener('popstate', (event) => {
  if (event.state && event.state.category) {
    // Naviga alla categoria salvata nello state
    showCategory(event.state.category, event.state.type);
  } else {
    // Nessuno state o hash vuoto = home
    handleHashNavigation();
  }
});

// Gestione hash change (per link diretti)
window.addEventListener('hashchange', handleHashNavigation);
