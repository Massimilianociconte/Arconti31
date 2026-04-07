# 🏗️ Architettura Tecnica del Progetto

## 📋 Panoramica

Sistema di gestione contenuti (CMS) headless completo per menù digitale, con backend serverless Netlify Functions, rigenerazione automatica JSON, e interfaccia frontend ottimizzata.

## 🔧 Stack Tecnologico

### Frontend
- **HTML5**: Struttura semantica
- **CSS3**: Styling responsive con CSS Grid e Flexbox
- **JavaScript Vanilla**: Nessuna dipendenza esterna

### Backend (Netlify Functions)
- **save-data.js**: Salvataggio dati + rigenerazione JSON automatica
- **read-data.js**: Lettura dati con fallback JSON statici
- **upload-image.js**: Upload immagini via Cloudinary
- **auth-callback.js**: Callback autenticazione

### CMS
- **cms-simple.js**: CMS custom con autenticazione, CRUD completo, ricerca globale
- **cms-styles.css**: Stili dedicati pannello admin

### Storage
- **GitHub**: Versioning file markdown
- **JSON Statici**: Cache pre-generata per performance
- **Cloudinary**: Storage immagini (opzionale)

### Hosting
- **Netlify**: Hosting statico con Functions e CI/CD automatico

## 📁 Struttura del Progetto

```
arconti31/
├── admin/
│   ├── index.html          # Pannello CMS
│   ├── cms-simple.js       # CMS JavaScript (71KB)
│   ├── cms-styles.css      # Stili CMS
│   ├── config.yml          # Configurazione collezioni
│   ├── config.json         # Config JSON
│   ├── manifest.json       # PWA Manifest
│   ├── sw.js               # Service Worker
│   └── SETUP.md            # Guida setup CMS
│
├── netlify/
│   └── functions/
│       ├── save-data.js    # Salvataggio + rigenerazione JSON
│       ├── read-data.js    # Lettura dati con fallback
│       ├── upload-image.js # Upload Cloudinary
│       └── auth-callback.js
│
├── food/
│   ├── food.json           # JSON pre-generato
│   └── *.md                # File markdown prodotti
│
├── beers/
│   ├── beers.json          # JSON pre-generato
│   └── *.md                # File markdown birre
│
├── beverages/
│   └── beverages.json      # JSON aggregato bevande
│
├── categorie/
│   ├── categorie.json      # JSON categorie
│   └── *.md                # Definizioni categorie
│
├── cocktails/              # Collezione cocktails
├── analcolici/             # Collezione analcolici
├── bibite/                 # Collezione bibite
├── caffetteria/            # Collezione caffetteria
├── bollicine/              # Collezione bollicine
├── bianchi-fermi/          # Collezione vini bianchi
├── vini-rossi/             # Collezione vini rossi
│
├── css/
│   └── style.css           # Stili frontend
│
├── js/
│   └── app.js              # Logica frontend
│
├── images/
│   ├── beverages/          # Immagini bevande
│   └── minicard sezioni/   # Immagini categorie
│
├── index.html              # Homepage menù
├── menu.html               # Pagina menù
├── ristoranti.html         # Pagina ristorante
├── netlify.toml            # Configurazione Netlify
├── package.json            # Dipendenze Node.js
└── README.md               # Documentazione
```

## 🔄 Flusso di Lavoro

### 1. Modifica Contenuti (Ristoratore)

```
Ristoratore → /admin → Login (email/password)
                ↓
        Modifica/Aggiungi Prodotto
                ↓
        Clicca "Salva"
                ↓
        Netlify Function save-data.js
                ↓
        Salva .md su GitHub + Rigenera JSON
                ↓
        Commit automatico
```

### 2. Rigenerazione Automatica JSON

```
save-data.js riceve richiesta
        ↓
Salva file .md su GitHub
        ↓
Legge tutti i .md della collezione
        ↓
Genera JSON aggregato (food.json, beers.json, ecc.)
        ↓
Commit JSON su GitHub
        ↓
Sito aggiornato (30-60 sec)
```

### 3. Lettura Dati (CMS/Frontend)

```
Richiesta dati
        ↓
read-data.js cerca JSON statico
        ↓
Se JSON esiste → ritorna dati (veloce!)
        ↓
Se JSON non esiste → fallback API GitHub
        ↓
Se rate limit → fallback JSON statico
```

### 4. Visualizzazione (Utente)

```
Utente visita sito
        ↓
Browser carica index.html
        ↓
JavaScript fetch JSON statici
        ↓
Rendering categorie
        ↓
Lazy loading immagini
```

## 🗂️ Gestione Dati

### Collezioni Configurate

| Collezione | Folder | JSON Output |
|------------|--------|-------------|
| Categorie | categorie/ | categorie/categorie.json |
| Food | food/ | food/food.json |
| Birre | beers/ | beers/beers.json |
| Cocktails | cocktails/ | beverages/beverages.json |
| Analcolici | analcolici/ | beverages/beverages.json |
| Bibite | bibite/ | beverages/beverages.json |
| Caffetteria | caffetteria/ | beverages/beverages.json |
| Bollicine | bollicine/ | beverages/beverages.json |
| Bianchi fermi | bianchi-fermi/ | beverages/beverages.json |
| Vini rossi | vini-rossi/ | beverages/beverages.json |

### Formato Dati

**File Markdown (sorgente)**
```markdown
---
nome: "Hamburger Classico"
category: "hamburger-bufala"
prezzo: 12.50
descrizione: "Carne di bufala 100%, pomodoro, insalata"
allergeni:
  - "Glutine"
  - "Lattosio"
tags:
  - "Più venduto"
disponibile: true
order: 1
---
```

**File JSON (generato automaticamente)**
```json
{
  "food": [
    {
      "nome": "Hamburger Classico",
      "category": "hamburger-bufala",
      "prezzo": 12.50,
      "descrizione": "Carne di bufala 100%, pomodoro, insalata",
      "allergeni": ["Glutine", "Lattosio"],
      "tags": ["Più venduto"],
      "disponibile": true,
      "order": 1
    }
  ],
  "foodByCategory": { ... },
  "categoryOrder": { ... }
}
```

## 🔐 Autenticazione e Sicurezza

### Sistema Login

1. **Credenziali**: Email + Password configurati in variabili ambiente
2. **Token**: Generato come Base64 di `email:timestamp`
3. **Validazione**: Verificata lato server in Netlify Function
4. **Scadenza**: Token valido per 7 giorni
5. **Multi-utente**: Supporto email multiple (separate da virgola)

### Sicurezza

- ✅ HTTPS automatico (certificato SSL gratuito)
- ✅ Token non salvato in localStorage (solo sessionStorage)
- ✅ Credenziali in variabili ambiente (non nel codice)
- ✅ GITHUB_TOKEN solo server-side
- ✅ Nessun database esposto

## ⚡ Performance

### Ottimizzazioni

1. **JSON Statici**
   - Lettura da raw.githubusercontent.com
   - Non conta verso rate limit API
   - Caching automatico

2. **Lazy Loading**
   - Immagini caricate solo quando visibili
   - Placeholder durante caricamento

3. **Rigenerazione Intelligente**
   - JSON rigenerati solo alla modifica
   - Commit unico per ogni collezione

4. **Frontend Leggero**
   - Vanilla JS (nessun framework)
   - CSS Grid nativo
   - < 100KB bundle totale

### Metriche Target

- **First Contentful Paint**: < 1.5s
- **Time to Interactive**: < 3s
- **Lighthouse Score**: > 90
- **Bundle Size**: < 100KB (senza immagini)

## 📱 PWA

### Caratteristiche

- **Manifest**: Icone, nome, colori tema
- **Service Worker**: Cache assets statici
- **Installabile**: Aggiungibile a schermata home
- **Offline**: Contenuti cachati disponibili offline

## 🔌 Netlify Functions

### save-data.js

```javascript
// Azioni supportate:
- login          // Autenticazione utente
- verify-token   // Verifica sessione
- save           // Salva prodotto + rigenera JSON
- delete         // Elimina prodotto + rigenera JSON
- get-cloudinary-config  // Configurazione upload
```

### read-data.js

```javascript
// Strategie lettura:
1. Prova JSON statico (veloce, no rate limit)
2. Fallback API GitHub (per ottenere SHA)
3. Fallback JSON su rate limit
```

### upload-image.js

```javascript
// Upload immagini Cloudinary
- Richiede: CLOUDINARY_CLOUD_NAME, CLOUDINARY_UPLOAD_PRESET
- Supporta upload unsigned
```

## 📊 Variabili Ambiente

| Variabile | Obbligatoria | Descrizione |
|-----------|--------------|-------------|
| `GITHUB_TOKEN` | ✅ | Token Classic con permesso repo |
| `ADMIN_EMAIL` | ✅ | Email ammesse (virgola-separate) |
| `ADMIN_PASSWORD` | ✅ | Password accesso CMS |
| `REPO_OWNER` | ❌ | Default: Massimilianociconte |
| `REPO_NAME` | ❌ | Default: Arconti31 |
| `CLOUDINARY_CLOUD_NAME` | ❌ | Per upload immagini |
| `CLOUDINARY_UPLOAD_PRESET` | ❌ | Preset unsigned Cloudinary |

## 🧪 Testing

### Test Manuali

1. Aggiungi prodotto da /admin
2. Verifica JSON rigenerato su GitHub
3. Ricarica frontend → prodotto visibile
4. Test filtri categorie
5. Test responsive (Chrome DevTools)
6. Test offline (PWA)

## 🔧 Manutenzione

### Zero Manutenzione Richiesta

- ✅ Nessun aggiornamento software
- ✅ Nessun database da ottimizzare
- ✅ Nessun server da patchare
- ✅ Backup automatici (Git)
- ✅ JSON rigenerati automaticamente

### Backup

- Ogni modifica = commit Git
- Storia completa su GitHub
- Rollback facile da Netlify dashboard

## 📚 Risorse Utili

- [Netlify Functions Docs](https://docs.netlify.com/functions/overview/)
- [Cloudinary Docs](https://cloudinary.com/documentation)
- [GitHub API Docs](https://docs.github.com/en/rest)
