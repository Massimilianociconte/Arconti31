# Setup CMS Arconti31

## ⚠️ IMPORTANTE: Configurazione Netlify

Per far funzionare il CMS devi configurare le **variabili d'ambiente** su Netlify.

> **NOTA**: Il menù digitale si aggiorna automaticamente quando salvi dal CMS! I JSON vengono rigenerati automaticamente, non serve alcun intervento manuale.

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
2. Seleziona il sito **Arconti31**
3. Vai su: **Site configuration** → **Environment variables**
4. Aggiungi queste variabili:

### Variabili Obbligatorie

| Nome | Valore | Esempio |
|------|--------|---------|
| `GITHUB_TOKEN` | Token GitHub Classic | `ghp_xxxxxxxxxxxx` |
| `ADMIN_EMAIL` | Email ammesse (virgola-separate) | `admin@arconti31.com, staff@arconti31.com` |
| `ADMIN_PASSWORD` | Password sicura | `MiaPassword123!` |

### Variabili Opzionali (per upload immagini)

| Nome | Valore | Note |
|------|--------|------|
| `CLOUDINARY_CLOUD_NAME` | Cloud Name Cloudinary | Es: `ducwsodfw` |
| `CLOUDINARY_UPLOAD_PRESET` | Nome preset unsigned | Es: `arconti31_unsigned` |

---

## Passo 3: Fai un Nuovo Deploy

Dopo aver salvato le variabili:

1. Vai su **Deploys** nel menu Netlify
2. Clicca **"Trigger deploy"** → **"Deploy site"**
3. Aspetta che il deploy finisca (1-2 minuti)

---

## Passo 4: Accedi al CMS

1. Vai su: `https://arconti31.netlify.app/admin/`
2. Inserisci email e password configurati
3. Inizia a gestire il menù!

---

## Admin Multipli

Per aggiungere più admin, separa le email con virgola:

```
ADMIN_EMAIL = admin@arconti31.com, manager@arconti31.com, staff@arconti31.com
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

### Modifiche non visibili
- Attendi 30-60 secondi
- Ricarica la pagina (Ctrl+F5)
- Verifica che il JSON sia aggiornato su GitHub

---

## Sicurezza

- ✅ Credenziali in variabili ambiente (mai nel codice)
- ✅ Token generato per sessione (sessionStorage)
- ✅ Scadenza token dopo 7 giorni
- ✅ GITHUB_TOKEN solo lato server
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
   - **Preset name**: `arconti31_unsigned`
   - **Signing Mode**: **Unsigned** ⚠️
   - **Folder**: `arconti31` (opzionale)
4. Save

#### 3. Configura su Netlify

| Nome | Valore |
|------|--------|
| `CLOUDINARY_CLOUD_NAME` | Il tuo Cloud Name |
| `CLOUDINARY_UPLOAD_PRESET` | `arconti31_unsigned` |

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
| `GITHUB_TOKEN` | ✅ | Token Classic con permesso repo |
| `ADMIN_EMAIL` | ✅ | Email ammesse (virgola-separate) |
| `ADMIN_PASSWORD` | ✅ | Password accesso CMS |
| `CLOUDINARY_CLOUD_NAME` | ❌ | Per upload immagini |
| `CLOUDINARY_UPLOAD_PRESET` | ❌ | Preset unsigned Cloudinary |
| `REPO_OWNER` | ❌ | Default: Massimilianociconte |
| `REPO_NAME` | ❌ | Default: Arconti31 |
