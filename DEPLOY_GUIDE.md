# 🚀 Guida Completa al Deploy

## Prerequisiti

- Account GitHub (gratuito)
- Account Netlify (gratuito)
- Browser moderno
- (Opzionale) Account Cloudinary per upload immagini

> ⚠️ Dopo l’aggiornamento di solidità del codice, **senza `REPO_OWNER` e `REPO_NAME` il CMS non salva** (fail-loud).  
> Imposta sempre queste due variabili sul Netlify del sito, poi fai redeploy.  
> Dettagli: [`SOLIDITY_NOTES.md`](./SOLIDITY_NOTES.md).

## 📝 Step 1: Preparazione Repository GitHub

### 1.1 Crea Account GitHub

1. Vai su [github.com](https://github.com)
2. Clicca "Sign up"
3. Inserisci email, password, username
4. Verifica email

### 1.2 Crea Nuovo Repository

1. Clicca il pulsante "+" → "New repository"
2. Compila:
   - **Repository name**: es. `arconti31` (ricordalo: sarà `REPO_NAME`)
   - **Description**: "Menù digitale con CMS"
   - **Public**: Seleziona
3. Clicca "Create repository"

### 1.3 Carica i File

**Via Web:**
1. Clicca "uploading an existing file"
2. Trascina tutti i file e cartelle (escludi `node_modules` se presente)
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

- **Branch to deploy**: `main` (o il branch che usi; allinealo a `GITHUB_BRANCH` se lo imposti)
- **Build command**: `npm run build`
- **Publish directory**: `.`

Clicca "Deploy site"

## ⚙️ Step 4: Configura Variabili Ambiente

### 4.1 Variabili obbligatorie

1. In Netlify, vai su **Site configuration** → **Environment variables**
2. Aggiungi queste variabili:

| Nome | Valore | Note |
|------|--------|------|
| `GITHUB_TOKEN` | `ghp_xxxx...` | Token Classic (account proprietario del repo) |
| `REPO_OWNER` | `username-github` | **Sempre obbligatorio** — username del proprietario del repo |
| `REPO_NAME` | `Arconti31` | **Sempre obbligatorio** — nome esatto del repository |
| `ADMIN_EMAIL` | `admin@tuosito.com` | Email ammesse (virgola-separate) |
| `ADMIN_PASSWORD` | `PasswordSicura123!` | Password per accesso CMS |

> ❗ **Fail-loud:** dopo questo aggiornamento codice, se mancano `REPO_OWNER` o `REPO_NAME` il CMS **non salva**. Non ci sono default silenziosi nel codice.

> 📦 Per passare il progetto da un account GitHub/Netlify a un altro (cliente): segui **`HANDOFF_CLIENTE.md`**.

### 4.2 Variabili opzionali

| Nome | Valore | Note |
|------|--------|------|
| `GITHUB_BRANCH` | `main` | Opzionale. Se assente → default **`main`** |
| `CMS_TOKEN_SECRET` | stringa random lunga | Opzionale ma **consigliato**. Se assente → firma token con `ADMIN_PASSWORD` |
| `CLOUDINARY_CLOUD_NAME` | Il tuo Cloud Name | Upload immagini |
| `CLOUDINARY_UPLOAD_PRESET` | Nome preset unsigned | Upload dal browser |
| `CLOUDINARY_FOLDER` | es. `arconti31` | Opzionale — cartella destinazione |
| `CLOUDINARY_API_KEY` | API Key | Se usi function signed `upload-image` |
| `CLOUDINARY_API_SECRET` | API Secret | Se usi function signed `upload-image` |
| `ALLOWED_ORIGINS` | Origini CORS extra, virgola-separate | Di solito non serve |

### 4.3 Redeploy

Dopo aver aggiunto le variabili:
1. Vai su "Deploys"
2. Clicca "Trigger deploy" → "Deploy site"
3. Attendi 1-2 minuti

## ✅ Step 5: Verifica e Test

### 5.1 Health check

Apri:

`https://URL-DEL-TUO-SITO/.netlify/functions/health`

Deve rispondere **ok**.

### 5.2 Testa il Sito

1. Vai su `https://URL-DEL-TUO-SITO`
2. Verifica che le categorie siano visibili
3. Clicca su una categoria per vedere i prodotti

### 5.3 Testa il CMS

1. Vai su `https://URL-DEL-TUO-SITO/admin`
2. Inserisci email e password configurati
3. Dovresti vedere la sidebar con le collezioni:
   - ⚙️ Gestione Categorie
   - Menù Food
   - Menù Beverage: Birre
   - Menù Beverage: Cocktails
   - E altre...

### 5.4 Test Salvataggio

1. Modifica un prodotto
2. Clicca "Salva"
3. Il CMS può mostrare **«Salvato su owner/repo»** (deve coincidere con le env)
4. Attendi 30-60 secondi
5. Verifica che il commit sia sul repository GitHub corretto
6. Ricarica il frontend → modifica visibile!

## 🎨 Step 6: Personalizzazione

### 6.1 Cambia Nome Sito

1. In Netlify → "Site settings"
2. Clicca "Change site name"
3. Inserisci un nome (es. quello del locale)

### 6.2 Dominio Personalizzato (Opzionale)

1. Vai su "Domain settings"
2. Clicca "Add custom domain"
3. Segui istruzioni DNS
4. SSL gratuito automatico

In caso di cutover fallito: vedi **Rollback DNS ~15 minuti** in `HANDOFF_CLIENTE.md` e `SOLIDITY_NOTES.md`.

### 6.3 Admin Multipli

Per aggiungere più admin, separa le email con virgola:

```
ADMIN_EMAIL = admin@tuosito.com, manager@tuosito.com, staff@tuosito.com
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

### CMS non salva / errore repository

- Mancano `REPO_OWNER` o `REPO_NAME` (obbligatorie)
- Aggiungile → **Trigger deploy** → riprova
- Controlla che `GITHUB_TOKEN` abbia accesso a quel repo

### Le modifiche non si vedono

1. Attendi 1-2 minuti
2. Controlla che il JSON sia aggiornato su GitHub (repo di `REPO_OWNER`/`REPO_NAME`)
3. Svuota cache browser (Ctrl+F5 / Cmd+Shift+R)

### Build fallisce

1. Leggi i log di build su Netlify
2. Verifica che `package.json` sia corretto
3. Controlla che tutte le cartelle esistano

### Upload immagini non funziona

- Verifica `CLOUDINARY_CLOUD_NAME` e `CLOUDINARY_UPLOAD_PRESET`
- Il preset deve essere **UNSIGNED**
- In alternativa, usa URL esterni

### Health non ok

- Controlla l’ultimo deploy e i log delle Functions

## 📊 Monitoring

### Verifica Deploy

1. Dashboard Netlify → "Deploys"
2. Ogni deploy mostra stato e log

### Rollback deploy Netlify

Se qualcosa va storto sul codice pubblicato:
1. "Deploys" → trova deploy funzionante
2. "Publish deploy"
3. Sito ripristinato!

> Attenzione: un rollback del **deploy** non ripristina da solo i record DNS. Per il dominio custom usa la procedura di rollback DNS in handoff.

## 🎓 Prossimi Passi

1. ✅ Configura le categorie desiderate
2. ✅ Aggiungi prodotti reali
3. ✅ Carica foto di qualità
4. ✅ Personalizza colori in `css/style.css`
5. ✅ Condividi il link con i clienti
6. ✅ Forma il personale sull'uso del CMS

## 🎉 Congratulazioni!

Il tuo menù digitale è online! Gestisci tutto in autonomia, senza costi e senza complicazioni.
