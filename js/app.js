let allBeers = [];

// Carica e mostra le birre
async function loadBeers() {
    try {
        const response = await fetch('beers/beers.json');
        const data = await response.json();
        allBeers = data.beers;
        displayBeers(allBeers);
        setupFilters(allBeers);
    } catch (error) {
        console.error('Errore nel caricamento:', error);
        document.getElementById('beer-grid').innerHTML = 
            '<p class="loading">Errore nel caricamento delle birre. Riprova più tardi.</p>';
    }
}

function displayBeers(beers) {
    const grid = document.getElementById('beer-grid');
    
    if (!beers || beers.length === 0) {
        grid.innerHTML = '<p class="loading">Nessuna birra disponibile al momento.</p>';
        return;
    }

    grid.innerHTML = beers.map((beer, index) => {
        const tagsHtml = beer.tags && beer.tags.length > 0 && beer.tags[0] !== 'Nessuno'
            ? `<div class="beer-tags">
                ${beer.tags.map(tag => {
                    const tagClass = tag.toLowerCase().replace(/\s+/g, '-');
                    return `<span class="beer-tag ${tagClass}">${tag}</span>`;
                }).join('')}
               </div>`
            : '';
        
        return `
        <div class="beer-card" data-category="${beer.categoria}" data-index="${index}" style="animation-delay: ${index * 0.1}s" onclick="openModal(${index})">
            <img 
                src="${beer.immagine || 'https://via.placeholder.com/400x300?text=Birra'}" 
                alt="${beer.nome}"
                class="beer-image"
                loading="lazy"
            >
            <div class="beer-content">
                <div class="beer-header">
                    <h2 class="beer-name">${beer.nome}</h2>
                    <span class="beer-price">€${beer.prezzo}</span>
                </div>
                <span class="beer-category">${beer.categoria}</span>
                ${tagsHtml}
                <p class="beer-description">${beer.descrizione}</p>
                <div class="availability ${beer.disponibile ? 'available' : 'unavailable'}">
                    ${beer.disponibile ? 'Disponibile' : 'Non disponibile'}
                </div>
            </div>
        </div>
        `;
    }).join('');
}

function setupFilters(beers) {
    const filterButtons = document.querySelectorAll('.filter-btn');
    
    filterButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            // Rimuovi active da tutti
            filterButtons.forEach(b => b.classList.remove('active'));
            // Aggiungi active al bottone cliccato
            btn.classList.add('active');
            
            const filter = btn.dataset.filter;
            const cards = document.querySelectorAll('.beer-card');
            
            cards.forEach(card => {
                if (filter === 'all' || card.dataset.category.toLowerCase() === filter) {
                    card.classList.remove('hidden');
                } else {
                    card.classList.add('hidden');
                }
            });
        });
    });
}

// Modal functions
function openModal(index) {
    const beer = allBeers[index];
    const modal = document.getElementById('beer-modal');
    const modalBody = document.getElementById('modal-body');
    
    const tagsHtml = beer.tags && beer.tags.length > 0 && beer.tags[0] !== 'Nessuno'
        ? `<div class="beer-tags">
            ${beer.tags.map(tag => {
                const tagClass = tag.toLowerCase().replace(/\s+/g, '-');
                return `<span class="beer-tag ${tagClass}">${tag}</span>`;
            }).join('')}
           </div>`
        : '';
    
    const allergeniHtml = beer.allergeni && beer.allergeni.length > 0
        ? `<div class="modal-section">
            <div class="modal-section-title">⚠️ Allergeni</div>
            <div class="modal-allergens">
                ${beer.allergeni.map(allergene => 
                    `<span class="allergen-badge">${allergene}</span>`
                ).join('')}
            </div>
           </div>`
        : '';
    
    const metaItems = [];
    if (beer.gradazione) {
        metaItems.push(`<div class="modal-meta-item"><strong>Gradazione:</strong> ${beer.gradazione}</div>`);
    }
    if (beer.formato) {
        metaItems.push(`<div class="modal-meta-item"><strong>Formato:</strong> ${beer.formato}</div>`);
    }
    
    const metaHtml = metaItems.length > 0 
        ? `<div class="modal-meta">${metaItems.join('')}</div>`
        : '';
    
    const descrizioneCompleta = beer.descrizione_dettagliata || beer.descrizione;
    
    modalBody.innerHTML = `
        ${beer.immagine ? `<img src="${beer.immagine}" alt="${beer.nome}" class="modal-image">` : ''}
        <div class="modal-body">
            <div class="modal-header">
                <h2 class="modal-title">${beer.nome}</h2>
                <span class="modal-price">€${beer.prezzo}</span>
            </div>
            <span class="beer-category">${beer.categoria}</span>
            ${tagsHtml}
            ${metaHtml}
            <div class="modal-description">${descrizioneCompleta}</div>
            ${allergeniHtml}
            <div class="availability ${beer.disponibile ? 'available' : 'unavailable'}">
                ${beer.disponibile ? '✓ Disponibile' : '✗ Non disponibile'}
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

// Chiudi modal cliccando fuori
document.getElementById('beer-modal').addEventListener('click', (e) => {
    if (e.target.id === 'beer-modal') {
        closeModal();
    }
});

// Chiudi modal con ESC
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        closeModal();
    }
});

// Carica le birre all'avvio
document.addEventListener('DOMContentLoaded', loadBeers);
