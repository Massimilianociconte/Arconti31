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
    this.pollingInterval = config.pollingInterval || 30000; // 30s default
    this.broadcastChannel = new BroadcastChannel('arconti31_sync');
    this.isInitialized = false;
    
    // Bind methods
    this.handleBroadcast = this.handleBroadcast.bind(this);
    this.checkUpdates = this.checkUpdates.bind(this);
  }

  async init() {
    if (this.isInitialized) return;

    this.db = await this.openDB();
    this.broadcastChannel.onmessage = this.handleBroadcast;
    
    // Avvia polling se configurato
    if (this.pollingInterval > 0) {
      setInterval(this.checkUpdates, this.pollingInterval);
    }

    this.isInitialized = true;
    console.log('🚀 SmartCache inizializzato');
    
    // Controllo iniziale
    this.checkUpdates();
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
   */
  async syncCollection(remoteItems, collectionName) {
    const localItems = await this.getAll('items');
    const collectionItems = localItems.filter(i => i._collection === collectionName);
    
    const changes = {
      added: [],
      updated: [],
      removed: [],
      collection: collectionName
    };

    const remoteMap = new Map(remoteItems.map(i => [i.filename || i.id, i]));
    const localMap = new Map(collectionItems.map(i => [i.id, i]));

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
        changes.added.push(itemToStore);
        await this.set('items', itemToStore);
      } else if (localItem._hash !== itemToStore._hash) {
        changes.updated.push(itemToStore);
        await this.set('items', itemToStore);
      }
    }

    // Rileva rimozioni
    for (const [id, localItem] of localMap) {
      if (!remoteMap.has(id)) {
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
    const { _lastUpdated, _hash, ...cleanItem } = item;
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
                     
        const res = await fetch(path + '?t=' + Date.now()); // Cache busting per il check
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

        await this.syncCollection(items, coll);
      }
    } catch (e) {
      console.error('SmartCache update check failed:', e);
    }
  }

  slugify(text) {
    return text.toString().toLowerCase().trim()
      .replace(/\s+/g, '-')
      .replace(/[^\w\-]+/g, '')
      .replace(/\-\-+/g, '-')
      .substring(0, 50);
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
