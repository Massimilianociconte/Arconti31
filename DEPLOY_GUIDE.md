# 🚀 Guida Completa al Deploy

## Prerequisiti

- Account GitHub (gratuito)
- Account Netlify (gratuito)
- Browser moderno
- (Opzionale) Account Cloudinary per upload immagini

## 📝 Step 1: Preparazione Repository GitHub

### 1.1 Crea Account GitHub

1. Vai su [github.com](https://github.com)
2. Clicca "Sign up"
3. Inserisci email, password, username
4. Verifica email

### 1.2 Crea Nuovo Repository

1. Clicca il pulsante "+" → "New repository"
2. Compila:
   - **Repository name**: `arconti31`
   - **Description**: "Menù digitale con CMS"
   - **Public**: Seleziona
3. Clicca "Create repository"

### 1.3 Carica i File

**Via Web:**
1. Clicca "uploading an existing file"
2. Trascina tutti i file e cartelle
3. Commit message: "Initial commit"
4. Clicca "Commit changes"

## 📝 Step 2: Crea Token GitHub (CLASSIC)

> ⚠️ **IMPORTANTE**: Deve essere un token **CLASSIC**, NON "Fine-grained"!

1. Vai su: https://github.com/settings/tokens
2. Clicca **"Generate new token"** → **"Generate new token (classic)"**
3. Compila:
   - **Note**: `Arconti31 CMS`
   - **Expiration**: `No expiration`
   - **Scopes**: Seleziona ✅ `repo`
4. Clicca **"Generate token"**
5. **COPIA IL TOKEN** (inizia con `ghp_...`)

## 🌐 Step 3: Deploy su Netlify

### 3.1 Crea Account Netlify

1. Vai su [netlify.com](https://www.netlify.com)
2. Clicca "Sign up with GitHub"
3. Autorizza Netlify

### 3.2 Importa Progetto

1. Clicca "Add new site" → "Import an existing project"
2. Clicca "Deploy with GitHub"
3. Seleziona il repository

### 3.3 Configura Build

- **Branch to deploy**: `main`
- **Build command**: `npm run build`
- **Publish directory**: `.`

Clicca "Deploy site"

## ⚙️ Step 4: Configura Variabili Ambiente

### 4.1 Variabili Obbligatorie

1. In Netlify, vai su **Site configuration** → **Environment variables**
2. Aggiungi queste variabili:

| Nome | Valore | Note |
|------|--------|------|
| `GITHUB_TOKEN` | `ghp_xxxx...` | Token Classic creato |
| `ADMIN_EMAIL` | `admin@tuosito.com` | Email ammesse (virgola-separate) |
| `ADMIN_PASSWORD` | `PasswordSicura123!` | Password per accesso CMS |

### 4.2 Variabili Opzionali (Cloudinary)

| Nome | Valore |
|------|--------|
| `CLOUDINARY_CLOUD_NAME` | Il tuo Cloud Name |
| `CLOUDINARY_UPLOAD_PRESET` | Nome preset unsigned |

### 4.3 Redeploy

Dopo aver aggiunto le variabili:
1. Vai su "Deploys"
2. Clicca "Trigger deploy" → "Deploy site"
3. Attendi 1-2 minuti

## ✅ Step 5: Verifica e Test

### 5.1 Testa il Sito

1. Vai su `https://tuosito.netlify.app`
2. Verifica che le categorie siano visibili
3. Clicca su una categoria per vedere i prodotti

### 5.2 Testa il CMS

1. Vai su `https://tuosito.netlify.app/admin`
2. Inserisci email e password configurati
3. Dovresti vedere la sidebar con le collezioni:
   - ⚙️ Gestione Categorie
   - Menù Food
   - Menù Beverage: Birre
   - Menù Beverage: Cocktails
   - E altre...

### 5.3 Test Salvataggio

1. Modifica un prodotto
2. Clicca "Salva"
3. Attendi 30-60 secondi
4. Verifica che il JSON sia aggiornato su GitHub
5. Ricarica il frontend → modifica visibile!

## 🎨 Step 6: Personalizzazione

### 6.1 Cambia Nome Sito

1. In Netlify → "Site settings"
2. Clicca "Change site name"
3. Inserisci nome (es. `arconti31`)

### 6.2 Dominio Personalizzato (Opzionale)

1. Vai su "Domain settings"
2. Clicca "Add custom domain"
3. Segui istruzioni DNS
4. SSL gratuito automatico

### 6.3 Admin Multipli

Per aggiungere più admin, separa le email con virgola:

```
ADMIN_EMAIL = admin@arconti31.com, manager@arconti31.com, staff@arconti31.com
```

Tutti useranno la stessa password.

## 🐛 Troubleshooting

### Errore "Password non valida"

- Verifica `ADMIN_EMAIL` e `ADMIN_PASSWORD` su Netlify
- Fai un nuovo deploy dopo aver modificato le variabili

### Errore "Bad credentials" / 401

- Hai creato un token **Fine-grained** invece di **Classic**
- Il token è scaduto
- Non hai selezionato il permesso `repo`

### Le modifiche non si vedono

1. Attendi 1-2 minuti
2. Controlla che il JSON sia aggiornato su GitHub
3. Svuota cache browser (Ctrl+F5)

### Build fallisce

1. Leggi i log di build su Netlify
2. Verifica che `package.json` sia corretto
3. Controlla che tutte le cartelle esistano

### Upload immagini non funziona

- Verifica `CLOUDINARY_CLOUD_NAME` e `CLOUDINARY_UPLOAD_PRESET`
- Il preset deve essere **UNSIGNED**
- In alternativa, usa URL esterni

## 📊 Monitoring

### Verifica Deploy

1. Dashboard Netlify → "Deploys"
2. Ogni deploy mostra stato e log

### Rollback

Se qualcosa va storto:
1. "Deploys" → trova deploy funzionante
2. "Publish deploy"
3. Sito ripristinato!

## 🎓 Prossimi Passi

1. ✅ Configura le categorie desiderate
2. ✅ Aggiungi prodotti reali
3. ✅ Carica foto di qualità
4. ✅ Personalizza colori in `css/style.css`
5. ✅ Condividi il link con i clienti
6. ✅ Forma il personale sull'uso del CMS

## 🎉 Congratulazioni!

Il tuo menù digitale è online! Gestisci tutto in autonomia, senza costi e senza complicazioni.
