# 🍽️ Menù Digitale Arconti31

Sistema di gestione contenuti (CMS) completo per menù digitale di ristorante/bar, con pannello di amministrazione semplice e intuitivo.

## ✨ Caratteristiche

- ✅ **100% Gratuito** - Hosting su Netlify, nessun costo mensile
- 📱 **Mobile-First** - Perfetto su smartphone e tablet
- ⚡ **Velocissimo** - Sito statico ottimizzato con JSON pre-generati
- 🎨 **CMS Personalizzato** - Interfaccia grafica in italiano per gestire il menù
- 🖼️ **Upload Immagini** - Cloudinary o URL esterni
- 🔄 **Aggiornamento Automatico** - JSON rigenerati automaticamente ad ogni modifica
- 📴 **PWA Ready** - Funziona anche offline
- 🔐 **Autenticazione Sicura** - Login con email/password via Netlify Functions
- 🚀 **Zero Manutenzione** - Nessun database, nessun server da gestire

## 📚 Categorie Gestibili

### 🍔 Menù Food
- Hamburger di bufala
- Hamburger Fassona e Street food
- Panini
- Griglieria
- Piatti Speciali
- Piadine
- Fritti
- Dolci
- Aperitivo
- E altre categorie personalizzabili

### 🍺 Menù Beverage
- **Birre** (4 sezioni: artigianali a rotazione, alla spina, speciali in bottiglia, frigo)
- **Cocktails**
- **Analcolici**
- **Bibite**
- **Caffetteria**
- **Bollicine** (Prosecco, Spumanti)
- **Bianchi fermi**
- **Vini rossi**

## 🚀 Setup Iniziale

### 1. Crea Repository GitHub

1. Vai su [GitHub](https://github.com) e crea un account
2. Clicca su "New Repository"
3. Nome: `arconti31` (o quello che preferisci)
4. Seleziona "Public"
5. Clicca "Create repository"

### 2. Carica i File

1. Scarica tutti i file di questo progetto
2. Caricali nel repository GitHub

### 3. Collega Netlify

1. Vai su [Netlify](https://www.netlify.com) e registrati
2. Clicca "Add new site" → "Import an existing project"
3. Scegli "GitHub" e autorizza
4. Seleziona il repository
5. Impostazioni build:
   - Build command: `npm run build`
   - Publish directory: `.`
6. Clicca "Deploy site"

### 4. Configura Variabili Ambiente

In Netlify Dashboard → Site Configuration → Environment Variables, aggiungi:

| Variabile | Descrizione |
|-----------|-------------|
| `GITHUB_TOKEN` | Token GitHub Classic con permesso `repo` |
| `ADMIN_EMAIL` | Email admin (può essere multipla, separate da virgola) |
| `ADMIN_PASSWORD` | Password per accesso CMS |
| `CLOUDINARY_CLOUD_NAME` | (Opzionale) Cloud Name Cloudinary |
| `CLOUDINARY_UPLOAD_PRESET` | (Opzionale) Preset upload unsigned |

## 📝 Come Gestire il Menù

### Accedere al Pannello

1. Vai su `https://tuosito.netlify.app/admin`
2. Inserisci email e password configurati
3. Vedrai la sidebar con tutte le collezioni

### Gestire Categorie

1. Clicca su "⚙️ Gestione Categorie"
2. Puoi creare, modificare, riordinare categorie
3. Ogni categoria ha: nome, slug, icona, immagine, ordine, visibilità

### Aggiungere Prodotti

1. Seleziona la collezione (es. "Menù Food", "Birre", "Cocktails")
2. Clicca "Nuovo"
3. Compila i campi richiesti
4. Clicca "Salva"
5. Il menù si aggiorna automaticamente in 30-60 secondi

### Campi Disponibili per Prodotto

- **Nome** (obbligatorio)
- **Categoria/Sezione**
- **Immagine Grande** (opzionale)
- **Logo Piccolo** (opzionale)
- **Descrizione Breve** (max 500 caratteri)
- **Descrizione Dettagliata** (max 2000 caratteri, visibile nel popup)
- **Prezzo**
- **Formato** (es: Boccale 0,5L, Calice)
- **Gradazione Alcolica**
- **Tag Speciali** (Novità, Senza Glutine, Biologico, Più venduto)
- **Allergeni** (Glutine, Lattosio, Solfiti, ecc.)
- **Disponibilità**
- **Ordine**

## 🎨 Personalizzazione

### Cambiare Colori

Modifica il file `css/style.css`, sezione `:root`:

```css
:root {
    --primary: #f59e0b;
    --secondary: #1f2937;
    --text: #374151;
    --bg: #f9fafb;
}
```

### Aggiungere Nuove Categorie

Usa il pannello admin "Gestione Categorie" per creare nuove categorie senza toccare codice.

## 💰 Costi

**ZERO €** - Tutto completamente gratuito:
- Netlify: 100 GB bandwidth/mese gratis
- GitHub: Repository pubblici illimitati
- Cloudinary: 25 GB storage gratuito
- Nessun canone mensile

## 🔧 Architettura

- **Frontend**: HTML5, CSS3, JavaScript Vanilla
- **CMS**: Custom (cms-simple.js)
- **Backend**: Netlify Functions
- **Storage**: GitHub + JSON statici
- **Immagini**: Cloudinary o URL esterni
- **PWA**: Service Worker + Manifest

## 📈 Performance

- ✅ Lighthouse Score > 90
- ✅ Caricamento < 2 secondi
- ✅ Mobile-friendly
- ✅ SEO ottimizzato
- ✅ Lazy loading immagini
- ✅ JSON statici (zero rate limiting)

## 📄 Licenza

MIT - Usa liberamente per il tuo ristorante!
Progetto sviluppato da [WebNovis](https://webnovis.com) — Agenzia di sviluppo web e SEO a Rho (Milano).

## 📞 Contatti

**Arconti31**  
Via Vittorio Arconti, 31  
21013 Gallarate VA
