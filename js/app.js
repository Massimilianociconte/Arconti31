let beersData = null;
let beveragesData = null;
let foodData = null;
let currentView = 'home';

// Carica tutte le bevande e il cibo
async function loadAllBeverages() {
    try {
        const [beersResponse, beveragesResponse, foodResponse] = await Promise.all([
            fetch('beers/beers.json'),
            fetch('beverages/beverages.json').catch(() => ({ json: async () => ({ beverages: [], beveragesByType: {} }) })),
            fetch('food/food.json').catch(() => ({ json: async () => ({ food: [], foodByCategory: {} }) }))
        ]);
        
        beersData = await beersResponse.json();
        beveragesData = await beveragesResponse.json();
        foodData = await foodResponse.json();
        
        showCategoriesView();
    } catch (error) {
        console.error('Errore nel caricamento:', error);
        document.getElementById('categories-view').innerHTML = 
            '<p class="loading">Errore nel caricamento. Riprova più tardi.</p>';
    }
}

function showCategoriesView() {
    currentView = 'home';
    document.getElementById('breadcrumb').style.display = 'none';
    document.getElementById('categories-view').style.display = 'block';
    document.getElementById('detail-view').style.display = 'none';
    
    const categoriesView = document.getElementById('categories-view');
    let html = '';
    
    // Sezioni Food (NUOVO)
    if (foodData && foodData.foodByCategory) {
        const foodOrder = [
            { name: 'Hamburger di bufala', icon: '🍔' },
            { name: 'Hamburger Fassona e Street food', icon: '🥩' },
            { name: 'OKTOBERFEST', icon: '🥨' },
            { name: 'Panini', icon: '🥪' },
            { name: 'Griglieria', icon: '🔥' },
            { name: 'Piatti Speciali', icon: '🍽️' },
            { name: 'Piadine', icon: '🥯' },
            { name: 'Fritti', icon: '🍟' },
            { name: 'Dolci', icon: '🍰' },
            { name: 'Aperitivo', icon: '🥜' }
        ];
        
        // Aggiungi header per il cibo se ci sono elementi
        const hasFood = foodOrder.some(cat => foodData.foodByCategory[cat.name]);
        if (hasFood) {
            html += '<h2 class="section-header">Menù Food</h2>';
            foodOrder.forEach(cat => {
                const items = foodData.foodByCategory[cat.name];
                if (items && items.length > 0) {
                    html += createCategoryCard(cat.name, items.length, cat.icon, 'food');
                }
            });
        }
    }

    // Sezioni Menù Beverage (Header)
    if ((beersData && beersData.beersBySection) || (beveragesData && beveragesData.beveragesByType)) {
        html += '<h2 class="section-header">Menù Beverage</h2>';
    }

    // Sezioni birre
    if (beersData && beersData.beersBySection) {
        const sectionOrder = [
            { name: 'Birre artigianali alla spina a rotazione', icon: '🍺' },
            { name: 'Birre alla spina', icon: '🍻' },
            { name: 'Birre speciali in bottiglia', icon: '🍾' },
            { name: 'Frigo Birre', icon: '❄️' }
        ];
        
        sectionOrder.forEach(section => {
            const items = beersData.beersBySection[section.name];
            if (items && items.length > 0) {
                html += createCategoryCard(section.name, items.length, section.icon, 'beer');
            }
        });
    }
    
    // Categorie bevande
    if (beveragesData && beveragesData.beveragesByType) {
        const typeOrder = [
            { name: 'Cocktails', icon: '🍹' },
            { name: 'Analcolici', icon: '🥤' },
            { name: 'Bibite', icon: '🥫' },
            { name: 'Caffetteria', icon: '☕' },
            { name: 'Bollicine', icon: '🥂' },
            { name: 'Bianchi fermi', icon: '🍷' },
            { name: 'Vini rossi', icon: '🍷' }
        ];
        
        typeOrder.forEach(type => {
            const items = beveragesData.beveragesByType[type.name];
            if (items && items.length > 0) {
                html += createCategoryCard(type.name, items.length, type.icon, 'beverage');
            }
        });
    }
    
    categoriesView.innerHTML = html || '<p class="loading">Nessuna categoria disponibile.</p>';
}

function createCategoryCard(name, count, icon, type) {
    return `
        <div class="category-card" onclick="showCategory('${name}', '${type}')">
            <div class="category-header">
                <div class="category-title">
                    <span class="category-icon">${icon}</span>
                    <span>${name}</span>
                </div>
                <div style="display: flex; align-items: center; gap: 1rem;">
                    <span class="category-count">${count} ${count === 1 ? 'prodotto' : 'prodotti'}</span>
                    <span class="category-arrow">→</span>
                </div>
            </div>
        </div>
    `;
}

function showCategory(categoryName, type) {
    currentView = 'detail';
    document.getElementById('breadcrumb').style.display = 'block';
    document.getElementById('categories-view').style.display = 'none';
    document.getElementById('detail-view').style.display = 'block';
    
    const detailContent = document.getElementById('detail-content');
    let items = [];
    
    if (type === 'beer' && beersData && beersData.beersBySection) {
        items = beersData.beersBySection[categoryName] || [];
    } else if (type === 'beverage' && beveragesData && beveragesData.beveragesByType) {
        items = beveragesData.beveragesByType[categoryName] || [];
    } else if (type === 'food' && foodData && foodData.foodByCategory) {
        items = foodData.foodByCategory[categoryName] || [];
    }
    
    let html = `
        <h2 class="section-title">${categoryName}</h2>
        <div class="beer-grid">
            ${items.map((item, index) => renderCard(item, index, type)).join('')}
        </div>
    `;
    
    detailContent.innerHTML = html;
    window.scrollTo(0, 0);
}

function goHome() {
    showCategoriesView();
    window.scrollTo(0, 0);
}

function renderCard(item, index, type) {
    let tags = [];
    if (item.tags) {
        if (Array.isArray(item.tags)) {
            tags = item.tags.filter(t => t && t !== 'Nessuno');
        } else if (typeof item.tags === 'string') {
            tags = [item.tags].filter(t => t && t !== 'Nessuno');
        }
    }
    
    const tagsHtml = tags.length > 0
        ? `<div class="beer-tags">
            ${tags.map(tag => {
                const tagClass = tag.toLowerCase().replace(/\s+/g, '-');
                return `<span class="beer-tag ${tagClass}">${tag}</span>`;
            }).join('')}
           </div>`
        : '';
    
    const hasFullImage = item.immagine && !item.logo;
    const hasLogo = item.logo;
    const cardClass = hasLogo && !hasFullImage ? 'logo-only' : '';
    
    const imageHtml = hasFullImage 
        ? `<img src="${item.immagine}" alt="${item.nome}" class="beer-image" loading="lazy">`
        : '';
    
    const logoHtml = hasLogo 
        ? `<img src="${item.logo}" alt="${item.nome}" class="beer-logo">`
        : '';
    
    const categoryLabel = type === 'beer' ? item.categoria : (type === 'food' ? item.category : item.tipo);
    
    return `
        <div class="beer-card ${cardClass}" data-category="${item.categoria || item.category || ''}" data-type="${type}" style="animation-delay: ${(index % 10) * 0.1}s" onclick="openModal(${index}, '${type}', '${item.nome.replace(/'/g, "\\'")}')">
            ${imageHtml}
            <div class="beer-content">
                <div class="beer-header">
                    <div class="beer-name-wrapper">
                        ${logoHtml}
                        <h2 class="beer-name">${item.nome}</h2>
                    </div>
                    <span class="beer-price">€${item.prezzo}</span>
                </div>
                ${categoryLabel ? `<span class="beer-category">${categoryLabel}</span>` : ''}
                ${tagsHtml}
                <p class="beer-description">${item.descrizione}</p>
                <div class="availability ${item.disponibile ? 'available' : 'unavailable'}">
                    ${item.disponibile ? 'Disponibile' : 'Non disponibile'}
                </div>
            </div>
        </div>
    `;
}

function openModal(index, type, itemName) {
    let items = [];
    
    // Trova gli items della categoria corrente
    if (type === 'beer' && beersData && beersData.beersBySection) {
        Object.values(beersData.beersBySection).forEach(sectionItems => {
            items = items.concat(sectionItems);
        });
    } else if (type === 'beverage' && beveragesData && beveragesData.beveragesByType) {
        Object.values(beveragesData.beveragesByType).forEach(typeItems => {
            items = items.concat(typeItems);
        });
    } else if (type === 'food' && foodData && foodData.foodByCategory) {
        Object.values(foodData.foodByCategory).forEach(catItems => {
            items = items.concat(catItems);
        });
    }
    
    // Questo metodo di trovare l'item per indice globale è fragile se filtriamo per categoria
    // Ma per ora manteniamo la logica esistente, assicurandoci che l'ordine sia consistente
    // Un approccio migliore sarebbe passare l'oggetto item completo o ID
    
    // FIX: Se siamo in detail view, items dovrebbe essere SOLO quelli della categoria
    // Ma qui stiamo ricostruendo items globali... 
    // In showCategory, passiamo l'indice relativo alla lista filtrata.
    // Qui dobbiamo recuperare l'item corretto.
    
    // Riprovo a cercare l'item giusto
    let targetItem = null;
    
    // Se siamo in detail view, dovremmo cercare nella categoria attiva
    // Ma openModal viene chiamato con index relativo alla lista renderizzata
    // Quindi dobbiamo ricostruire la lista della categoria corrente se possibile
    // Ma non abbiamo 'categoryName' qui.
    
    // TRUCCO: Per ora, cerchiamo l'item per nome (non ideale se duplicati)
    // O modifichiamo renderCard per passare l'oggetto (non si può in HTML string)
    
    // Recuperiamo l'item dalla lista filtrata che abbiamo renderizzato in showCategory
    // Sfortunatamente 'items' in showCategory è locale.
    
    // SOLUZIONE MIGLIORE: Modifichiamo openModal per accettare categoryName se possibile
    // Ma cambiamo troppo codice.
    
    // Cerchiamo l'item in tutti gli item del tipo che hanno quel nome
    const allItemsOfType = items; // items qui contiene tutti gli item del tipo (appiattiti)
    // Wait, items construction above is flattened all sections.
    // renderCard index is relative to the category view!
    
    // Se clicco sul primo item della categoria "Hamburger", l'index è 0.
    // Ma nel mio array flattened, potrebbe essere 50.
    // Questo codice esistente sembra buggato per le detail view se usa indici relativi.
    // Vediamo showCategory: items = beveragesData.beveragesByType[categoryName]
    // renderCard usa index (0, 1, 2...)
    // openModal riceve (0, 'food', 'Nome')
    
    // Quindi openModal DEVE sapere la categoria per risolvere l'indice 0.
    // Ma la firma è openModal(index, type, itemName).
    
    // Cerco l'item per nome e tipo
    targetItem = allItemsOfType.find(i => i.nome === itemName.replace(/\\'/g, "'"));
    
    if (!targetItem) return;
    const item = targetItem;
    
    const modal = document.getElementById('beer-modal');
    const modalBody = document.getElementById('modal-body');
    
    let tags = [];
    if (item.tags) {
        if (Array.isArray(item.tags)) {
            tags = item.tags.filter(t => t && t !== 'Nessuno');
        } else if (typeof item.tags === 'string') {
            tags = [item.tags].filter(t => t && t !== 'Nessuno');
        }
    }
    
    const tagsHtml = tags.length > 0
        ? `<div class="beer-tags">
            ${tags.map(tag => {
                const tagClass = tag.toLowerCase().replace(/\s+/g, '-');
                return `<span class="beer-tag ${tagClass}">${tag}</span>`;
            }).join('')}
           </div>`
        : '';
    
    let allergeni = [];
    if (item.allergeni) {
        if (Array.isArray(item.allergeni)) {
            allergeni = item.allergeni.filter(a => a);
        } else if (typeof item.allergeni === 'string') {
            allergeni = [item.allergeni].filter(a => a);
        }
    }
    
    const allergeniHtml = allergeni.length > 0
        ? `<div class="modal-section">
            <div class="modal-section-title">Allergeni</div>
            <div class="modal-allergens">
                ${allergeni.map(allergene => 
                    `<span class="allergen-badge">${allergene}</span>`
                ).join('')}
            </div>
           </div>`
        : '';
    
    const metaItems = [];
    if (item.gradazione) {
        metaItems.push(`<div class="modal-meta-item"><strong>Gradazione:</strong> ${item.gradazione}</div>`);
    }
    if (item.formato) {
        metaItems.push(`<div class="modal-meta-item"><strong>Formato:</strong> ${item.formato}</div>`);
    }
    
    const metaHtml = metaItems.length > 0 
        ? `<div class="modal-meta">${metaItems.join('')}</div>`
        : '';
    
    const descrizioneCompleta = item.descrizione_dettagliata || item.descrizione || '';
    const logoHtml = item.logo ? `<img src="${item.logo}" alt="${item.nome}" class="modal-logo">` : '';
    const categoryLabel = item.categoria || item.category || item.tipo || '';
    
    modalBody.innerHTML = `
        ${item.immagine ? `<img src="${item.immagine}" alt="${item.nome}" class="modal-image">` : ''}
        <div class="modal-body">
            <div class="modal-header">
                <div class="modal-title-wrapper">
                    ${logoHtml}
                    <h2 class="modal-title">${item.nome}</h2>
                </div>
                <span class="modal-price">€${item.prezzo}</span>
            </div>
            ${categoryLabel ? `<span class="beer-category">${categoryLabel}</span>` : ''}
            ${tagsHtml}
            ${metaHtml}
            <div class="modal-description">${descrizioneCompleta}</div>
            ${allergeniHtml}
            <div class="availability ${item.disponibile ? 'available' : 'unavailable'}">
                ${item.disponibile ? '✓ Disponibile' : '✗ Non disponibile'}
            </div>
        </div>
    `;
    
    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
}

function closeModal() {
    const modal = document.getElementById('beer-modal');
    modal.classList.remove('active');
    document.body.style.overflow = '';
}

document.getElementById('beer-modal').addEventListener('click', (e) => {
    if (e.target.id === 'beer-modal') {
        closeModal();
    }
});

document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        if (document.getElementById('beer-modal').classList.contains('active')) {
            closeModal();
        } else if (currentView === 'detail') {
            goHome();
        }
    }
});

function toggleCompactView() {
    const grid = document.querySelector('.beer-grid');
    const toggleBtn = document.getElementById('toggle-view-btn');
    const toggleText = toggleBtn.querySelector('.toggle-text');
    
    if (grid.classList.contains('compact-view')) {
        grid.classList.remove('compact-view');
        toggleBtn.classList.remove('active');
        toggleText.textContent = 'Vista Compatta';
    } else {
        grid.classList.add('compact-view');
        toggleBtn.classList.add('active');
        toggleText.textContent = 'Vista Completa';
    }
}

document.addEventListener('DOMContentLoaded', loadAllBeverages);
