# Setup CMS Arconti31

## Configurazione Netlify

Per far funzionare il CMS devi configurare 2 variabili d'ambiente su Netlify:

### 1. Vai su Netlify Dashboard
- Site settings → Environment variables

### 2. Aggiungi queste variabili:

| Nome | Valore |
|------|--------|
| `GITHUB_TOKEN` | Il tuo Personal Access Token di GitHub |
| `ADMIN_PASSWORD_HASH` | Hash della password (opzionale, default: "password") |

### Come creare il GITHUB_TOKEN:

1. Vai su GitHub → Settings → Developer settings → Personal access tokens → Tokens (classic)
2. Clicca "Generate new token (classic)"
3. Nome: "Arconti31 CMS"
4. Scadenza: scegli quanto vuoi (o "No expiration")
5. Permessi: seleziona solo `repo` (Full control of private repositories)
6. Clicca "Generate token"
7. **COPIA IL TOKEN** (lo vedrai solo una volta!)
8. Incollalo come valore di `GITHUB_TOKEN` su Netlify

### Password di default

La password di default è: `password`

Per cambiarla, genera un nuovo hash e mettilo in `ADMIN_PASSWORD_HASH`.

## Dopo la configurazione

1. Fai un nuovo deploy su Netlify (o aspetta il deploy automatico)
2. Vai su `tuosito.com/admin/`
3. Inserisci la password
4. Inizia a gestire il menù!
