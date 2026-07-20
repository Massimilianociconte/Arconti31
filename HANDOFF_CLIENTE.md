# Guida handoff: da account tuo → account del cliente

Guida **passo-passo** per migrare Arconti31 da:

- **GitHub free** tuo (es. `Massimilianociconte/Arconti31`)
- **Netlify free** tuo

verso:

- **GitHub free** del cliente (lo crei tu per lui)
- **Netlify free** del cliente

Non serve pagare nulla. Non serve un database.  
Il CMS salva i menù **scrivendo file sul repository GitHub** tramite un token.

> ⚠️ **Solidità:** `REPO_OWNER` e `REPO_NAME` sono **sempre obbligatori** sulle variabili Netlify.  
> Senza di esse il CMS **non salva** (niente default silenziosi nel codice).  
> Dettagli e checklist post-deploy: [`SOLIDITY_NOTES.md`](./SOLIDITY_NOTES.md).

---

## Cosa stai spostando (in parole semplici)

| Cosa | Dove vive oggi | Dove deve vivere dopo |
|------|----------------|------------------------|
| Codice + menù (file) | Tuo GitHub | GitHub del cliente |
| Sito online | Tuo Netlify | Netlify del cliente |
| Login CMS (email/password) | Variabili Netlify | Variabili Netlify **del cliente** |
| Token che scrive i menù | Tuo `GITHUB_TOKEN` | Token del **cliente** |
| Target repo CMS (`REPO_OWNER` / `REPO_NAME`) | Env Netlify tuo | Env Netlify **del cliente** (username + nome repo **del cliente**) |
| Dominio custom (se ce l’hai) | DNS → Netlify tuo | DNS → Netlify **cliente** |
| Foto su Cloudinary (se usate) | Account Cloudinary attuale | Restano valide finché non cancelli quell’account |

**Regola d’oro:** non spegnere il sito vecchio finché sul sito **nuovo** non funziona:
1. il menù pubblico  
2. il login `/admin`  
3. un salvataggio CMS che crea un **commit sul GitHub del cliente** (non sul tuo)  
4. health: `/.netlify/functions/health` risponde **ok**

---

## Prima di iniziare (10 minuti)

Prepara un foglio (o password manager), **non** pubblicarlo:

| Campo | Valore (compila) |
|-------|------------------|
| Email del cliente (stabile) | ________________ |
| Password temporanea GitHub | ________________ |
| Password temporanea Netlify | (se diversa) ____ |
| Username GitHub del cliente (= `REPO_OWNER`) | ________________ |
| Nome repository (es. `Arconti31`) (= `REPO_NAME`) | ________________ |
| Branch da deployare (di solito `main`) | ________________ |
| Email CMS ristorante | ________________ |
| Password CMS nuova | ________________ |
| `CMS_TOKEN_SECRET` (random, consigliato) | ________________ |
| Ha dominio custom? | Sì / No |
| Dove gestisce il dominio (Aruba, GoDaddy, Cloudflare…)? | ________________ |
| Cloudinary resta tuo? | Sì (ok per ora) / No |

Avvisa il ristorante: **durante la migrazione non salvare modifiche nel CMS** (evita menù “spezzati” tra due siti).

---

## Ordine corretto (non saltare i passi)

```
1. Email cliente
2. Account GitHub cliente
3. Repository nuovo + caricamento codice
4. Token GitHub Classic (del cliente)
5. Account Netlify cliente (login con GitHub del cliente)
6. Import del repo + primo deploy
7. Variabili ambiente (REPO_* obbligatori) + nuovo deploy
8. Test su URL *.netlify.app (health + CMS + commit)
9. Freeze writer sul Netlify vecchio
10. (Opzionale) Dominio custom + piano rollback DNS
11. Consegna al cliente
12. Chiusura account vecchi / revoca token tuoi
```

---

## PASSO 1 — Email del cliente

1. Usa un’email **del cliente** (Gmail del titolare o email del locale).  
   **Non** usare la tua email personale come account “definitivo”.
2. Verifica di poter aprire quella casella (codici di verifica).

---

## PASSO 2 — Crea GitHub del cliente

1. Apri https://github.com sul browser.
2. Clicca **Sign up**.
3. Inserisci email del cliente, password, username.
4. Completa la verifica email (controlla inbox/spam).
5. Annota lo **username** esatto: sarà il valore di **`REPO_OWNER`**.

---

## PASSO 3 — Crea il repository vuoto

1. In GitHub (loggato come cliente): clicca **+** in alto a destra → **New repository**.
2. Compila:
   - **Repository name:** es. `Arconti31` (ricordalo esatto: sarà **`REPO_NAME`**)
   - **Public** (consigliato su free, più semplice)
   - **Non** spuntare “Add a README” (repo vuoto)
3. Clicca **Create repository**.
4. Annota l’URL, tipo:  
   `https://github.com/USERNAME_CLIENTE/NOME_REPO`

---

## PASSO 4 — Carica il codice sul GitHub del cliente

### Opzione consigliata (da Mac, con terminale)

Apri **Terminale**, spostati nella cartella del progetto sul tuo computer, poi:

```bash
cd /percorso/locale/del/progetto
```

Esempio se il progetto è nella cartella Documenti:

```bash
cd ~/Documents/Progetti/Arconti31
```

```bash
git status
```

Se ci sono modifiche non salvate (file modificati in rosso/verde), prima fai commit sul tuo branch locale (o chiedi supporto).  
Poi:

```bash
git remote -v
```

Aggiungi il remote del cliente (senza cancellare subito il tuo):

```bash
git remote add client https://github.com/USERNAME_CLIENTE/NOME_REPO.git
```

```bash
git push -u client main
```

GitHub potrebbe chiedere login: usa l’account **del cliente** (o un Personal Access Token del cliente come password).

### Opzione alternativa (senza terminale, più lenta)

1. Nella cartella del progetto, escludi `node_modules` e `.git`.
2. Crea uno ZIP del resto.
3. Su GitHub del cliente → repo → **uploading an existing file** → carica tutto → Commit.

---

## PASSO 5 — Crea il token GitHub del cliente (obbligatorio per il CMS)

> ⚠️ Deve essere un token **Classic**, non “Fine-grained”.

1. Loggato come **cliente** su GitHub, apri:  
   https://github.com/settings/tokens
2. **Generate new token** → **Generate new token (classic)**.
3. Compila:
   - **Note:** `Arconti31 CMS Netlify`
   - **Expiration:** 90 giorni o 1 anno (poi andrà rinnovato)
   - **Scopes:** spunta **`repo`** (tutta la riga)
4. **Generate token**.
5. **Copia subito** il valore che inizia con `ghp_...`  
   (si vede **una sola volta**).
6. Salvalo nel password manager del cliente.

Se perdi il token: ne crei uno nuovo e aggiorni Netlify.

---

## PASSO 6 — Crea Netlify del cliente

1. Apri https://app.netlify.com
2. **Sign up** → scegli **Sign up with GitHub**.
3. Autorizza Netlify sull’account GitHub **del cliente** (non il tuo).
4. Completa l’eventuale conferma email.

---

## PASSO 7 — Collega il repository e fai il primo deploy

1. In Netlify: **Add new site** → **Import an existing project**.
2. Scegli **GitHub** e autorizza l’accesso al repo se richiesto.
3. Seleziona il repository del cliente.
4. Impostazioni build (se non le legge da solo da `netlify.toml`):
   - **Branch:** `main` (o il branch che userai; allinealo a `GITHUB_BRANCH` se lo imposti)
   - **Build command:** `npm run build`
   - **Publish directory:** `.`  (punto = cartella root)
5. Clicca **Deploy site**.
6. Attendi lo stato verde (1–3 minuti).
7. Annota l’URL temporaneo, es.:  
   `https://qualcosa-casuale.netlify.app`

Apri quell’URL: il menù deve vedersi.  
(Il CMS **ancora no**: mancano le variabili ambiente.)

---

## PASSO 8 — Variabili ambiente (punto più importante)

1. In Netlify del cliente: apri il sito → **Site configuration** (o **Site settings**).
2. Vai su **Environment variables**.
3. Aggiungi **una per una** queste variabili:

### Obbligatorie (sempre)

| Nome variabile | Valore da mettere | Note |
|----------------|-------------------|------|
| `GITHUB_TOKEN` | `ghp_...` del **cliente** | Token del passo 5 |
| `REPO_OWNER` | username GitHub **del cliente** | **Sempre obbligatorio** — esatto, senza spazi |
| `REPO_NAME` | nome repo esatto | **Sempre obbligatorio** — es. `Arconti31` |
| `ADMIN_EMAIL` | email CMS | Più email: separate da virgola |
| `ADMIN_PASSWORD` | password CMS nuova | Comunicata solo al ristorante |

> ❗ Senza `REPO_OWNER` e `REPO_NAME` il CMS **non salva** (errore esplicito). Non esistono più default nel codice.

### Opzionali (consigliate / utili)

| Nome variabile | Valore | Note |
|----------------|--------|------|
| `GITHUB_BRANCH` | es. `main` | Opzionale. Se assente → default **`main`** |
| `CMS_TOKEN_SECRET` | stringa random lunga | Opzionale ma **consigliato**. Se assente → la firma token usa `ADMIN_PASSWORD` |
| `CLOUDINARY_CLOUD_NAME` | dal dashboard Cloudinary | Se usate upload immagini |
| `CLOUDINARY_UPLOAD_PRESET` | preset **unsigned** | Se upload dal browser |
| `CLOUDINARY_API_KEY` | se usate function signed | |
| `CLOUDINARY_API_SECRET` | se usate function signed | |
| `CLOUDINARY_FOLDER` | es. `arconti31` | Opzionale — cartella destinazione upload |
| `ALLOWED_ORIGINS` | URL extra, virgola-separati | Di solito non serve: l’URL del sito Netlify corrente è già gestito |

> Le foto **già** caricate con URL Cloudinary nel menù restano visibili anche senza riosare Cloudinary, finché l’account Cloudinary non le cancella.

4. **Obbligatorio dopo le variabili:**  
   **Deploys** → **Trigger deploy** → **Deploy site**  
   (senza questo le Functions non vedono le nuove variabili).

---

## PASSO 9 — Test obbligatori (prima del dominio)

Fai **tutti** questi test sul nuovo `https://….netlify.app` (sostituisci con l’URL reale del sito):

### A) Health
- [ ] Apri `https://URL-DEL-TUO-SITO/.netlify/functions/health`  
- [ ] La risposta deve essere **ok** (sito e functions raggiungibili)

### B) Sito pubblico
- [ ] Homepage / menù carica
- [ ] Si aprono le categorie e i prodotti
- [ ] Le immagini si vedono

### C) Login CMS
- [ ] Apri `https://URL-DEL-TUO-SITO/admin`
- [ ] Entra con `ADMIN_EMAIL` + `ADMIN_PASSWORD`
- [ ] Con password sbagliata **non** entra

### D) Test critico: salvataggio → commit sul GitHub **del cliente**
1. Su GitHub del cliente apri il repo → scheda **Commits** e annota l’ultimo commit.
2. Nel CMS modifica un prezzo di prova (es. `9.99` → `9.98`) → **Salva**.
3. Il CMS può mostrare un messaggio tipo **«Salvato su owner/repo»** (deve coincidere con username e nome repo del **cliente**).
4. Torna su GitHub del cliente: entro pochi secondi deve comparire un commit tipo  
   `CMS: Update food/....md` (e spesso anche un JSON aggiornato).
5. **Verifica che il commit NON sia finito sul tuo vecchio repo.**
6. Attendi 30–90 secondi (o il deploy automatico Netlify).
7. Ricarica il menù pubblico (meglio aggiornamento forzato: Cmd+Shift+R) e controlla il prezzo.
8. (Consigliato) ripristina il prezzo originale con un secondo salvataggio.

Se il punto D fallisce: **non** spostare il dominio. Vai a “Problemi comuni” in fondo.

---

## PASSO 9b — Freeze writer sul Netlify **vecchio**

Prima che il ristorante usi il CMS **nuovo**, blocca le scritture dal sito vecchio. Altrimenti qualcuno potrebbe ancora salvare sul repo sbagliato.

Scegli **una** delle due azioni sul Netlify **vecchio**:

1. **Rimuovi** la variabile `GITHUB_TOKEN` (il CMS vecchio non può più scrivere su GitHub), **oppure**  
2. **Cambia** `ADMIN_PASSWORD` (il login con la password comunicata al ristorante non funziona più sul sito vecchio)

Poi fai un **Trigger deploy** sul sito vecchio se richiesto da Netlify per applicare le env.

> Fallo **prima** che il ristorante inizi a usare regolarmente `/admin` sul sito nuovo.

---

## PASSO 10 — Dominio personalizzato (solo se usi un dominio tuo)

Obiettivo: il pubblico continua a usare lo stesso indirizzo, ma il sito “vero” diventa Netlify del cliente.

### 10.1 Prepara il nuovo Netlify
1. Netlify **cliente** → **Domain management** → **Add custom domain**.
2. Inserisci il dominio (es. `tuodominio.com` e se serve `www.tuodominio.com`).
3. Netlify ti mostra i **record DNS** da impostare (copiali esattamente).

### 10.2 Cutover DNS (ordine consigliato)
1. Ferma le modifiche CMS.
2. Conferma che i test del passo 9 sono verdi e che il freeze writer (passo 9b) è fatto.
3. Sul Netlify **tuo (vecchio)**: togli il dominio custom  
   (altrimenti due siti litigano per lo stesso dominio).
4. Sul **registrar** del dominio (dove l’hai comprato): aggiorna i record A/CNAME come detto da Netlify **nuovo**.
5. Aspetta la propagazione (spesso 5–60 minuti; a volte di più).
6. Controlla:
   - `https://tuodominio.com` apre il sito
   - Lucchetto HTTPS ok (Netlify crea il certificato da solo)
   - `https://tuodominio.com/.netlify/functions/health` → ok
7. Rifatta il **test CMS** anche da `https://tuodominio.com/admin` (non solo da `.netlify.app`).

### 10.3 Rollback DNS in ~15 minuti (se qualcosa va storto)

Se dopo il cutover il sito non risponde o punta al posto sbagliato:

1. Sul **registrar / DNS**, ripristina i record A/CNAME che puntavano al Netlify **precedente** (quello che funzionava prima).
2. Controlla che il dominio custom sia di nuovo associato solo al Netlify che deve ricevere il traffico di emergenza (toglilo dal sito sbagliato se serve).
3. Attendi la propagazione (spesso pochi minuti; a volte di più — tieni d’occhio con hard refresh).
4. Verifica:
   - sito pubblico ok
   - `/.netlify/functions/health` → ok
   - `/admin` raggiungibile
5. **Non** ripristinare il freeze writer sul vecchio a caso: se torni al Netlify vecchio come produzione, assicurati che lì ci siano `REPO_*` + `GITHUB_TOKEN` corretti **prima** di far salvare di nuovo il ristorante.

Tieni a portata di mano i valori DNS “vecchi” **prima** del cutover (screenshot o nota).

### QR code
- Se i QR puntano al **dominio custom**: non serve ristamparli.
- Se puntano a un vecchio `….netlify.app`: conviene farli puntare al dominio custom.

---

## PASSO 11 — Consegna al cliente

Consegna (meglio su carta o password manager):

1. URL pubblico del sito  
2. URL admin: `…/admin`  
3. Email e password CMS  
4. Accesso GitHub del cliente (email + password)  
5. Accesso Netlify del cliente  
6. (Se serve) dove si rinnova il dominio  
7. Questa guida + `GUIDA_RISTORATORE.md` per l’uso quotidiano del menù  
8. (Opzionale) link a `SOLIDITY_NOTES.md` per chi mantiene le env  

Poi il cliente **cambia le password** GitHub/Netlify/CMS.

---

## PASSO 12 — Chiudi il vecchio (dopo 7–14 giorni stabili)

1. Revoca il **tuo** vecchio token GitHub:  
   https://github.com/settings/tokens → Delete sul token usato per questo progetto  
2. Sul tuo Netlify: disabilita o cancella il sito vecchio (dopo aver tolto il dominio).  
3. Sul tuo GitHub: archivia (Archive) il repo vecchio; non cancellarlo subito.  
4. Esci dagli account del cliente se non devi più manutenere.  
5. Se resti in manutenzione: fatti aggiungere come **collaborator** sul repo del cliente, non usare il tuo repo come “produzione”.

---

## Checklist env minime (copia su Netlify cliente)

```
GITHUB_TOKEN=ghp_xxxxxxxx
REPO_OWNER=username_github_cliente
REPO_NAME=Arconti31
ADMIN_EMAIL=titolare@email.it
ADMIN_PASSWORD=********
```

Opzionali (consigliate dove indicato):
```
GITHUB_BRANCH=main
CMS_TOKEN_SECRET=segreto_random_lungo
CLOUDINARY_FOLDER=nome-cartella
CLOUDINARY_CLOUD_NAME=...
CLOUDINARY_UPLOAD_PRESET=...
CLOUDINARY_API_KEY=...
CLOUDINARY_API_SECRET=...
ALLOWED_ORIGINS=https://altro-dominio-eventuale.com
```

---

## Problemi comuni (e come risolverli)

| Cosa vedi | Causa tipica | Cosa fare |
|-----------|--------------|-----------|
| Login CMS fallisce | Env sbagliate o deploy non rifatto | Controlla `ADMIN_EMAIL` / `ADMIN_PASSWORD` → **Trigger deploy** |
| “GITHUB_TOKEN non configurato” | Manca la variabile | Aggiungi `GITHUB_TOKEN` → redeploy |
| Errore 401 / Bad credentials | Token sbagliato o non Classic | Crea token Classic con `repo`, aggiorna env, redeploy |
| CMS non salva / errore su `REPO_OWNER` o `REPO_NAME` | Env mancanti (ora **obbligatorie**) | Imposta entrambe → redeploy → rifai test salvataggio |
| Salva CMS ma il commit va sul **tuo** vecchio GitHub | Env del sito sbagliato o freeze writer non fatto | Controlla `REPO_*` sul Netlify **nuovo**; sul vecchio rimuovi token o cambia password |
| Messaggio «Salvato su X/Y» non è il repo cliente | Env sbagliate | Correggi `REPO_OWNER`/`REPO_NAME`, redeploy, salva di nuovo |
| Health non ok | Deploy fallito o functions non attive | Controlla Deploys Netlify e log functions |
| Salva ok su GitHub ma sito non cambia | Deploy fallito o cache browser | Guarda Deploys Netlify; hard refresh (Cmd+Shift+R) |
| Build Netlify rossa | Errore in `npm run build` | Apri i log del deploy; in locale: `npm run build` |
| Dominio senza HTTPS / non apre | DNS ancora sul vecchio o doppio collegamento | Un solo Netlify deve avere il dominio; riallinea DNS o usa **Rollback DNS** (passo 10.3) |
| Upload immagini non va | Cloudinary non configurato | Configura env Cloudinary **oppure** incolla URL esterni |
| Token scaduto dopo mesi | Expiration del PAT | Cliente genera nuovo token → aggiorna `GITHUB_TOKEN` → redeploy |

---

## Cosa ha già fatto / fa lo sviluppatore nel codice (per la migrazione)

Per ridurre i rischi di handoff, nel progetto valgono questi comportamenti **senza costi esterni**:

- **`REPO_OWNER` e `REPO_NAME` sempre obbligatori** — nessun default silenzioso; senza di essi il CMS non salva (*fail-loud*)
- Branch di scrittura da `GITHUB_BRANCH` (default `main` se assente)
- `CMS_TOKEN_SECRET` opzionale ma consigliato (se assente usa `ADMIN_PASSWORD` per firmare i token di sessione)
- `CLOUDINARY_FOLDER` opzionale
- CORS: il CMS accetta l’URL del sito Netlify corrente e origini extra da `ALLOWED_ORIGINS`
- Endpoint health: `/.netlify/functions/health`
- Dopo il salvataggio il CMS può mostrare dove ha scritto (es. «Salvato su owner/repo»)
- Documentazione allineata: `SETUP.md`, `DEPLOY_GUIDE.md`, `SOLIDITY_NOTES.md`

**Tu devi ancora fare in browser/UI:** account, token, env Netlify (anche sul sito **attuale** prima del deploy del codice aggiornato), freeze writer sul vecchio, DNS, test commit, revoca token vecchi.  
Queste cose **non** si possono completare dal solo codice. Vedi [`SOLIDITY_NOTES.md`](./SOLIDITY_NOTES.md).

---

## Mini-ruoli il giorno della migrazione

| Chi | Cosa fa |
|-----|---------|
| **Tu (sviluppatore)** | Push codice, env (anche sito attuale), freeze writer, test commit/health, cutover DNS, revoca token tuoi |
| **Cliente** | Possiede email, GitHub, Netlify, password finali |
| **Ristorante** | Non tocca il CMS finché non arriva “OK migrazione completata” |

---

## Fine

Quando i test del **passo 9** (health + CMS + commit sul repo cliente) sono verdi, il freeze writer sul vecchio è fatto e (se c’è) il dominio punta al Netlify del cliente, la migrazione è **completa**.  
Da quel momento la “fonte di verità” del menù è solo:

**GitHub del cliente + Netlify del cliente** (con `REPO_OWNER` / `REPO_NAME` del cliente).
