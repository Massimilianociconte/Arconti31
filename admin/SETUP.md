# Setup CMS Arconti31

## ⚠️ IMPORTANTE: Configurazione Netlify

Per far funzionare il CMS devi configurare le **variabili d'ambiente** su Netlify.

> **NOTA**: Il menù digitale si aggiorna automaticamente quando salvi dal CMS! I JSON vengono rigenerati automaticamente, non serve alcun intervento manuale.

> ⚠️ **`REPO_OWNER` e `REPO_NAME` sono sempre obbligatori.**  
> Senza di esse il CMS **non salva** (niente default nel codice).  
> Dopo aver impostato le env: **sempre un nuovo deploy**.

---

## Passo 1: Crea un Token GitHub (CLASSIC)

> ⚠️ **ATTENZIONE**: Devi creare un token **CLASSIC**, NON "Fine-grained"!

1. Vai su: https://github.com/settings/tokens
2. Clicca **"Generate new token"** → **"Generate new token (classic)"**
3. Compila:
   - **Note**: `Arconti31 CMS`
   - **Expiration**: `No expiration` (o scegli durata)
   - **Scopes**: Seleziona ✅ `repo` (Full control of private repositories)
4. Clicca **"Generate token"**
5. **COPIA SUBITO IL TOKEN** (inizia con `ghp_...`) - lo vedrai solo una volta!

---

## Passo 2: Configura le Variabili su Netlify

1. Vai su [Netlify Dashboard](https://app.netlify.com)
2. Seleziona il **tuo sito**
3. Vai su: **Site configuration** → **Environment variables**
4. Aggiungi queste variabili:

### Variabili obbligatorie

| Nome | Valore | Esempio |
|------|--------|---------|
| `GITHUB_TOKEN` | Token GitHub Classic (account proprietario del repo) | `ghp_xxxxxxxxxxxx` |
| `REPO_OWNER` | Username GitHub del **proprietario del repo** — **sempre ✅ obbligatorio** | `username-github` |
| `REPO_NAME` | Nome esatto del repository — **sempre ✅ obbligatorio** | `Arconti31` |
| `ADMIN_EMAIL` | Email ammesse (virgola-separate) | `admin@tuodominio.com, staff@tuodominio.com` |
| `ADMIN_PASSWORD` | Password sicura | `MiaPassword123!` |

### Variabili opzionali

| Nome | Valore | Note |
|------|--------|------|
| `GITHUB_BRANCH` | Branch su cui il CMS scrive i commit | Default se assente: **`main`** |
| `CMS_TOKEN_SECRET` | Segreto random per firmare i token di sessione CMS | **Consigliato.** Se assente usa `ADMIN_PASSWORD` |
| `ALLOWED_ORIGINS` | Origini CORS extra (virgola-separate) | Di solito non serve: l’URL del sito Netlify corrente è già gestito |
| `CLOUDINARY_CLOUD_NAME` | Cloud Name Cloudinary | Per upload immagini |
| `CLOUDINARY_UPLOAD_PRESET` | Nome preset **unsigned** | Es: `arconti31_unsigned` |
| `CLOUDINARY_FOLDER` | Cartella destinazione upload | Opzionale |
| `CLOUDINARY_API_KEY` | API Key | Solo se usi la function signed `upload-image` |
| `CLOUDINARY_API_SECRET` | API Secret | Solo se usi la function signed `upload-image` |

---

## Passo 3: Fai un Nuovo Deploy

Dopo aver salvato le variabili:

1. Vai su **Deploys** nel menu Netlify
2. Clicca **"Trigger deploy"** → **"Deploy site"**
3. Aspetta che il deploy finisca (1-2 minuti)

---

## Passo 4: Verifica e accedi al CMS

1. Test health: apri `https://URL-DEL-TUO-SITO/.netlify/functions/health` → deve dare **ok**
2. Vai su: `https://URL-DEL-TUO-SITO/admin/`
3. Inserisci email e password configurati
4. Inizia a gestire il menù!
5. Dopo un salvataggio, verifica che su GitHub compaia il commit sul repo indicato da `REPO_OWNER`/`REPO_NAME`. Il CMS può mostrare un messaggio tipo **«Salvato su owner/repo»**.

Sostituisci sempre `URL-DEL-TUO-SITO` con l’indirizzo reale del tuo sito Netlify (o dominio custom).

---

## Admin Multipli

Per aggiungere più admin, separa le email con virgola:

```
ADMIN_EMAIL = admin@tuodominio.com, manager@tuodominio.com, staff@tuodominio.com
```

Tutti gli utenti useranno la stessa password.

---

## Risoluzione Problemi

### Errore "Password non valida"
- Verifica che `ADMIN_EMAIL` contenga la tua email (case-insensitive)
- Verifica che `ADMIN_PASSWORD` sia esattamente uguale
- Dopo aver modificato le variabili, fai sempre un nuovo deploy

### Errore "Bad credentials" o "401"
- Hai creato un token **Fine-grained** invece di **Classic** → Ricrea il token
- Il token è scaduto → Creane uno nuovo
- Non hai selezionato il permesso `repo` → Ricrea il token

### Errore "GITHUB_TOKEN non configurato"
- La variabile non è stata salvata su Netlify
- Fai un deploy dopo aver aggiunto la variabile

### CMS non salva / errore su repository
- Controlla che `REPO_OWNER` e `REPO_NAME` siano **entrambe** impostate (obbligatorie)
- Fai **Trigger deploy** dopo averle aggiunte
- Verifica che il token abbia accesso a quel repo

### Health non ok
- Controlla che l’ultimo deploy sia andato a buon fine
- Apri i log delle Functions su Netlify

### Modifiche non visibili
- Attendi 30-60 secondi
- Ricarica la pagina (Ctrl+F5 / Cmd+Shift+R)
- Verifica che il JSON sia aggiornato su GitHub

---

## Sicurezza

- ✅ Credenziali in variabili ambiente (mai nel codice)
- ✅ Token generato per sessione (sessionStorage)
- ✅ Scadenza token dopo 7 giorni
- ✅ `GITHUB_TOKEN` solo lato server
- ✅ `CMS_TOKEN_SECRET` consigliato (se assente si usa la password)
- ✅ Logout automatico chiudendo il browser

---

## Upload Immagini

### Opzione 1: URL Esterni (Semplice)

Puoi incollare URL di immagini già online:
- **Google Drive**: Condividi pubblicamente
- **Imgur**: Carica e copia link
- **Qualsiasi URL pubblico**

Nel CMS, nel campo "Immagine", incolla l'URL e salva.

### Opzione 2: Cloudinary (Upload Diretto)

Per abilitare upload diretto dal CMS:

#### 1. Crea account Cloudinary
1. Vai su https://cloudinary.com e registrati (gratuito)
2. Dalla Dashboard, copia il **Cloud Name**

#### 2. Crea Upload Preset UNSIGNED
⚠️ **IMPORTANTE**: Deve essere UNSIGNED (non Signed)

1. Settings → Upload
2. Upload presets → Add upload preset
3. Compila:
   - **Preset name**: es. `tuosito_unsigned`
   - **Signing Mode**: **Unsigned** ⚠️
   - **Folder**: (opzionale; puoi anche usare env `CLOUDINARY_FOLDER`)
4. Save

#### 3. Configura su Netlify

| Nome | Valore |
|------|--------|
| `CLOUDINARY_CLOUD_NAME` | Il tuo Cloud Name |
| `CLOUDINARY_UPLOAD_PRESET` | Nome del preset unsigned |
| `CLOUDINARY_FOLDER` | (Opzionale) cartella destinazione |

#### 4. Redeploy
Fai un nuovo deploy dopo aver aggiunto le variabili.

### Troubleshooting Upload

**Errore 401 (Unauthorized)**:
- Verifica che il preset sia **UNSIGNED**
- Verifica nome preset esatto
- Verifica variabili su Netlify
- Fai nuovo deploy

---

## Dove Trovare URL Immagini

### Google Drive
1. Carica immagine
2. Clicca destro → Condividi → "Chiunque abbia il link"
3. Modifica URL:
   - Da: `https://drive.google.com/file/d/FILE_ID/view`
   - A: `https://drive.google.com/uc?export=view&id=FILE_ID`

### Imgur
1. Vai su https://imgur.com
2. Carica immagine
3. Clicca destro → "Copia link immagine"

---

## Riepilogo Variabili Ambiente

| Variabile | Obbligatoria | Descrizione |
|-----------|--------------|-------------|
| `GITHUB_TOKEN` | ✅ | Token Classic con permesso `repo` (dell'account che possiede il repo) |
| `REPO_OWNER` | ✅ **sempre** | Username GitHub del proprietario del repo. **Senza → CMS non salva** |
| `REPO_NAME` | ✅ **sempre** | Nome esatto del repository. **Senza → CMS non salva** |
| `ADMIN_EMAIL` | ✅ | Email ammesse (virgola-separate) |
| `ADMIN_PASSWORD` | ✅ | Password accesso CMS |
| `GITHUB_BRANCH` | ❌ | Branch commit CMS (default `main`) |
| `CMS_TOKEN_SECRET` | ❌ (consigliato) | Segreto firma token sessione; se assente usa `ADMIN_PASSWORD` |
| `ALLOWED_ORIGINS` | ❌ | Origini extra CORS (virgola-separate). Il sito Netlify corrente è già incluso automaticamente |
| `CLOUDINARY_CLOUD_NAME` | ❌ | Per upload immagini |
| `CLOUDINARY_UPLOAD_PRESET` | ❌ | Preset unsigned Cloudinary (se usi upload dal browser) |
| `CLOUDINARY_FOLDER` | ❌ | Cartella destinazione upload Cloudinary |
| `CLOUDINARY_API_KEY` | ❌ | Richiesto se usi la function `upload-image` (signed) |
| `CLOUDINARY_API_SECRET` | ❌ | Richiesto se usi la function `upload-image` (signed) |

> 📖 Migrazione completa verso account GitHub/Netlify del cliente: **`HANDOFF_CLIENTE.md`** (root del progetto).  
> 📖 Breaking changes e azioni esterne obbligatorie: **`SOLIDITY_NOTES.md`**.
