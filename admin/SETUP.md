# Setup CMS Arconti31

## ⚠️ IMPORTANTE: Configurazione Netlify

Per far funzionare il CMS devi configurare **2 variabili d'ambiente** su Netlify.

> **NOTA**: Il menù digitale si aggiorna automaticamente quando salvi dal CMS! Non serve più rigenerare JSON o fare redeploy.

---

## Passo 1: Crea un Token GitHub (CLASSIC)

> ⚠️ **ATTENZIONE**: Devi creare un token **CLASSIC**, NON "Fine-grained"!

1. Vai su: https://github.com/settings/tokens
2. Clicca **"Generate new token"** → **"Generate new token (classic)"**
3. Compila:
   - **Note**: `Arconti31 CMS`
   - **Expiration**: `No expiration` (o scegli una durata)
   - **Scopes**: Seleziona SOLO ✅ `repo` (Full control of private repositories)
4. Clicca **"Generate token"**
5. **COPIA SUBITO IL TOKEN** (inizia con `ghp_...`) - lo vedrai solo una volta!

---

## Passo 2: Configura le Variabili su Netlify

1. Vai su [Netlify Dashboard](https://app.netlify.com)
2. Seleziona il sito **Arconti31**
3. Vai su: **Site configuration** → **Environment variables**
4. Aggiungi queste variabili:

| Nome | Valore |
|------|--------|
| `GITHUB_TOKEN` | Il token copiato (es: `ghp_xxxxxxxxxxxx`) |
| `ADMIN_EMAIL` | La tua email (es: `admin@arconti31.com`) |
| `ADMIN_PASSWORD` | Una password sicura (es: `MiaPassword123!`) |

---

## Passo 3: Fai un Nuovo Deploy

Dopo aver salvato le variabili:

1. Vai su **Deploys** nel menu Netlify
2. Clicca **"Trigger deploy"** → **"Deploy site"**
3. Aspetta che il deploy finisca (1-2 minuti)

---

## Passo 4: Accedi al CMS

1. Vai su: `https://arconti31.com/admin/`
2. Inserisci la password: `arconti31admin` (o quella che hai scelto)
3. Inizia a gestire il menù!

---

## Risoluzione Problemi

### Errore "Password non valida"
- Verifica che la variabile `ADMIN_PASSWORD` su Netlify sia esattamente uguale alla password che inserisci
- Dopo aver modificato le variabili, fai sempre un nuovo deploy

### Errore "Bad credentials" o "401"
- Hai creato un token **Fine-grained** invece di **Classic** → Ricrea il token seguendo le istruzioni sopra
- Il token è scaduto → Creane uno nuovo
- Non hai selezionato il permesso `repo` → Ricrea il token con il permesso corretto

### Errore "GITHUB_TOKEN non configurato"
- La variabile `GITHUB_TOKEN` non è stata salvata su Netlify
- Verifica di aver fatto il deploy dopo aver aggiunto la variabile

---

## Credenziali di Default

- **Email CMS**: `admin@arconti31.com`
- **Password CMS**: `arconti31admin`
- **Repository**: `Massimilianociconte/Arconti31`
- **Branch**: `main`

## Sicurezza

- ✅ Email e password validate lato server
- ✅ Token generato per ogni sessione (non salvato in localStorage)
- ✅ Logout automatico quando chiudi il browser
- ✅ Nessun dato sensibile salvato localmente

---

## Upload Immagini

### Opzione 1: Senza Cloudinary (Semplice)

Puoi incollare URL di immagini già online:
- **Google Drive**: Condividi pubblicamente e copia il link
- **Imgur**: Carica e copia il link diretto
- **Qualsiasi URL pubblico**: Funziona!

Nel CMS, nel campo "Immagine", incolla l'URL e salva. Fatto!

### Opzione 2: Con Cloudinary (Upload diretto)

Per abilitare l'upload diretto di immagini dal CMS, configura Cloudinary (gratuito fino a 25GB):

### 1. Crea account Cloudinary
1. Vai su https://cloudinary.com e registrati (gratuito)
2. Dalla Dashboard, copia il **Cloud Name** (es: `ducwsodfw`)

### 2. Crea Upload Preset UNSIGNED
⚠️ **IMPORTANTE**: Deve essere UNSIGNED (non Signed)

1. Vai su **Settings** (icona ingranaggio in basso a sinistra)
2. Clicca su **Upload** nel menu a sinistra
3. Scorri fino a **Upload presets**
4. Clicca **"Add upload preset"** (pulsante blu in alto a destra)
5. Compila:
   - **Preset name**: `arconti31_unsigned`
   - **Signing Mode**: Cambia da "Signed" a **"Unsigned"** ⚠️
   - **Folder**: `arconti31` (opzionale)
6. Clicca **"Save"**

### 3. Aggiungi variabili su Netlify
1. Vai su [Netlify Dashboard](https://app.netlify.com)
2. Seleziona **Arconti31**
3. **Site configuration** → **Environment variables**
4. Aggiungi/modifica:

| Nome | Valore |
|------|--------|
| `CLOUDINARY_CLOUD_NAME` | Il tuo Cloud Name (es: `ducwsodfw`) |
| `CLOUDINARY_UPLOAD_PRESET` | `arconti31_unsigned` |

5. Clicca **Save**

### 4. Redeploy
1. Vai su **Deploys**
2. Clicca **"Trigger deploy"** → **"Deploy site"**
3. Aspetta che finisca (1-2 minuti)

### Troubleshooting

**Errore 401 (Unauthorized)**:
- ✅ Verifica che il preset sia **UNSIGNED** (non Signed)
- ✅ Verifica che il nome del preset sia esattamente `arconti31_unsigned`
- ✅ Verifica che le variabili su Netlify siano corrette
- ✅ Fai un nuovo deploy dopo aver modificato le variabili

---

## Dove trovare URL di immagini

### Google Drive
1. Carica immagine su Google Drive
2. Clicca destro → **Condividi**
3. Cambia a "Chiunque abbia il link"
4. Copia il link e modifica così:
   - Da: `https://drive.google.com/file/d/FILE_ID/view`
   - A: `https://drive.google.com/uc?export=view&id=FILE_ID`

### Imgur
1. Vai su https://imgur.com
2. Carica immagine
3. Clicca destro su immagine → **Copia link immagine**
4. Incolla nel CMS

### Qualsiasi URL pubblico
Se hai un'immagine online (es: sito web, CDN), copia l'URL diretto e incolla nel CMS.
