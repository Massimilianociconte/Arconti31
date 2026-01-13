/**
 * SmartCache - Sistema di caching intelligente e reattivo
 * Gestisce IndexedDB, rilevamento modifiche granulari e sincronizzazione
 */
class SmartCache {
  constructor(config = {}) {
    this.dbName = config.dbName || 'Arconti31Cache';
    this.dbVersion = config.dbVersion || 1;
    this.stores = ['items', 'metadata', 'manifest'];
    this.db = null;
    this.subscribers = new Set();
    this.pollingInterval = 0; // DISABILITATO - polling manuale solo su richiesta
    this.broadcastChannel = new BroadcastChannel('arconti31_sync');
    this.isInitialized = false;
    this.lastSaveTime = 0; // Timestamp ultimo salvataggio locale
    
    // Bind methods
    this.handleBroadcast = this.handleBroadcast.bind(this);
    this.checkUpdates = this.checkUpdates.bind(this);
  }

  async init() {
    if (this.isInitialized) return;

    this.db = await this.openDB();
    this.broadcastChannel.onmessage = this.handleBroadcast;
    
    // NOTA: Polling automatico DISABILITATO per evitare flickering
    // Gli aggiornamenti arrivano solo da:
    // 1. Caricamento iniziale pagina
    // 2. Salvataggio locale (notifySubscribers)
    // 3. Sync da altri tab (BroadcastChannel)
    // 4. Refresh manuale (pulsante sync)

    this.isInitialized = true;
    console.log('🚀 SmartCache inizializzato (polling disabilitato)');
  }

  openDB() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.dbVersion);

      request.onerror = (event) => reject('IndexedDB error: ' + event.target.error);

      request.onupgradeneeded = (event) => {
        const db = event.target.result;
        this.stores.forEach(storeName => {
          if (!db.objectStoreNames.contains(storeName)) {
            db.createObjectStore(storeName, { keyPath: 'id' });
          }
        });
      };

      request.onsuccess = (event) => resolve(event.target.result);
    });
  }

  async get(storeName, id) {
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([storeName], 'readonly');
      const store = transaction.objectStore(storeName);
      const request = store.get(id);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async getAll(storeName) {
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([storeName], 'readonly');
      const store = transaction.objectStore(storeName);
      const request = store.getAll();
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async set(storeName, item) {
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([storeName], 'readwrite');
      const store = transaction.objectStore(storeName);
      const request = store.put(item);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async delete(storeName, id) {
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([storeName], 'readwrite');
      const store = transaction.objectStore(storeName);
      const request = store.delete(id);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  // ==========================================
  // LOGICA DI SINCRONIZZAZIONE
  // ==========================================

  /**
   * Confronta i dati remoti con la cache locale e rileva le differenze
   * @param {Array} remoteItems - Lista di oggetti dal server
   * @param {String} collectionName - Nome della collezione (es. 'food')
   * @param {String} source - 'static' (JSON) o 'live' (API/Broadcast)
   */
  async syncCollection(remoteItems, collectionName, source = 'static') {
    // Normalize items ensuring ID/filename exists
    // Questo è fondamentale perché i JSON raw (es. food.json) non hanno filename/id
    const normalizedRemoteItems = remoteItems.map(i => {
      const id = i.filename || i.id || (i.slug || (i.nome ? this.slugify(i.nome) : 'unknown-' + Math.random().toString(36).slice(2, 11))) + '.md';
      return { ...i, id: id, filename: id };
    });

    const localItems = await this.getAll('items');
    const collectionItems = localItems.filter(i => i._collection === collectionName);
    
    const changes = {
      added: [],
      updated: [],
      removed: [],
      collection: collectionName
    };

    const remoteMap = new Map(normalizedRemoteItems.map(i => [i.id, i]));
    const localMap = new Map(collectionItems.map(i => [i.id, i]));

    // Tempo di protezione per modifiche locali recenti (2 minuti - per permettere rebuild Netlify)
    const STALE_PROTECTION_MS = 2 * 60 * 1000;

    // Rileva aggiunte e modifiche
    for (const [id, remoteItem] of remoteMap) {
      const localItem = localMap.get(id);
      
      // Normalizza item per storage
      const itemToStore = {
        ...remoteItem,
        id: id, // Assicura ID
        _collection: collectionName,
        _hash: this.generateHash(remoteItem),
        _lastUpdated: Date.now()
      };

      if (!localItem) {
        // Item nuovo dal server - aggiungilo
        changes.added.push(itemToStore);
        await this.set('items', itemToStore);
      } else {
        // Item esiste localmente - controlla se aggiornare
        
        // PROTEZIONE 1: Item marcato come eliminato localmente
        // NON resuscitare item eliminati di recente, anche se il JSON vecchio li contiene ancora
        if (localItem._deleted && localItem._writeTime && (Date.now() - localItem._writeTime < STALE_PROTECTION_MS)) {
          console.log(`🛡️ SmartCache: Ignorato item eliminato localmente: ${id}`);
          continue;
        }
        
        // Se l'item era marcato come eliminato ma è passato il tempo di protezione,
        // rimuovilo definitivamente dalla cache invece di resuscitarlo
        if (localItem._deleted) {
          await this.delete('items', id);
          continue;
        }
        
        // PROTEZIONE 2: Item modificato localmente di recente
        // Se l'hash è diverso ma l'item locale è stato scritto di recente, ignora l'update stale
        if (localItem._hash !== itemToStore._hash) {
          if (source === 'static' && localItem._writeTime && (Date.now() - localItem._writeTime < STALE_PROTECTION_MS)) {
            console.log(`🛡️ SmartCache: Ignorato aggiornamento stale per ${id} (modificato localmente di recente)`);
            continue;
          }
          
          // Accetta l'aggiornamento remoto
          await this.set('items', itemToStore);
          changes.updated.push(itemToStore);
        }
      }
    }

    // Rileva rimozioni (item presenti localmente ma non nel remoto)
    for (const [id, localItem] of localMap) {
      if (!remoteMap.has(id)) {
        // Se l'item è già marcato come eliminato, rimuovilo definitivamente
        if (localItem._deleted) {
          await this.delete('items', id);
          continue;
        }
        
        // PROTEZIONE STALE DATA (Rimozioni):
        // Se l'item locale è stato modificato di recente, non rimuoverlo
        // (potrebbe essere che il JSON non è ancora aggiornato)
        if (source === 'static' && localItem._writeTime && (Date.now() - localItem._writeTime < STALE_PROTECTION_MS)) {
           console.log(`🛡️ SmartCache: Ignorata rimozione stale per ${id}`);
           continue;
        }

        changes.removed.push(localItem);
        await this.delete('items', id);
      }
    }

    if (changes.added.length || changes.updated.length || changes.removed.length) {
      this.notifySubscribers(changes);
      return changes;
    }
    
    return null;
  }

  /**
   * Genera un hash semplice per il confronto
   */
  generateHash(item) {
    // Rimuovi campi volatili o interni
    const { _lastUpdated, _hash, _writeTime, ...cleanItem } = item;
    return JSON.stringify(cleanItem).split('').reduce((a, b) => {
      a = ((a << 5) - a) + b.charCodeAt(0);
      return a & a;
    }, 0);
  }

  /**
   * Controlla aggiornamenti dal server (Manifest o JSON)
   */
  async checkUpdates() {
    try {
      // Scarica il manifest globale (se esiste) o controlla gli header dei JSON
      // Per ora usiamo un approccio basato sui JSON statici che sono veloci
      const collections = ['food', 'beers', 'categorie', 'beverages'];
      
      for (const coll of collections) {
        const path = coll === 'categorie' ? '/categorie/categorie.json' : 
                     coll === 'beverages' ? '/beverages/beverages.json' : 
                     `/${coll}/${coll}.json`;
        
        // Cache buster aggressivo
        const cacheBuster = `?_=${Date.now()}&r=${Math.random().toString(36).slice(2, 11)}`;
        const res = await fetch(path + cacheBuster, {
          cache: 'no-store',
          headers: {
            'Cache-Control': 'no-cache',
            'Pragma': 'no-cache'
          }
        });
        if (!res.ok) continue;
        
        const data = await res.json();
        let items = [];
        
        if (coll === 'food') items = data.food;
        else if (coll === 'beers') items = data.beers;
        else if (coll === 'categorie') items = data.categories;
        else if (coll === 'beverages') items = data.beverages;
        
        // Aggiungi filename come ID se manca
        items = items.map(i => ({
          ...i,
          filename: i.filename || (i.slug || this.slugify(i.nome)) + '.md'
        }));

        await this.syncCollection(items, coll, 'static');
      }
    } catch (e) {
      console.error('SmartCache update check failed:', e);
    }
  }

  /**
   * Forza un refresh immediato (chiamato dopo salvataggio)
   */
  async forceRefresh() {
    console.log('🔄 SmartCache: Force refresh triggered');
    await this.checkUpdates();
  }

  slugify(text) {
    if (!text) return '';
    return text.toString().toLowerCase().trim()
      .replace(/\s+/g, '-')
      .replace(/[àáâãäå]/g, 'a').replace(/[èéêë]/g, 'e')
      .replace(/[ìíîï]/g, 'i').replace(/[òóôõö]/g, 'o').replace(/[ùúûü]/g, 'u')
      .replace(/[^a-z0-9-]/g, '').replace(/-+/g, '-').substring(0, 50);
  }

  // ==========================================
  // EVENTI E NOTIFICHE
  // ==========================================

  subscribe(callback) {
    this.subscribers.add(callback);
    return () => this.subscribers.delete(callback);
  }

  notifySubscribers(changes) {
    this.subscribers.forEach(cb => cb(changes));
    // Notifica anche altri tab
    this.broadcastChannel.postMessage({ type: 'CACHE_UPDATE', changes });
  }

  handleBroadcast(event) {
    if (event.data && event.data.type === 'CACHE_UPDATE') {
      // Ricevuto aggiornamento da un altro tab
      // Ricarica i dati locali se necessario o notifica la UI
      const changes = event.data.changes;
      console.log('🔄 Sync ricevuto da altro tab:', changes);
      
      // Aggiorna la UI locale
      this.subscribers.forEach(cb => cb(changes));
    }
  }
}

// Export singleton
window.SmartCache = new SmartCache();
