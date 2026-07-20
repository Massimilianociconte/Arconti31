# Note di solidità (breaking changes e azioni esterne)

Documento breve e operativo. Descrive cosa cambia con l’aggiornamento di solidità del CMS e **cosa devi fare tu** fuori dal codice (Netlify, GitHub, DNS).

Non sostituisce `HANDOFF_CLIENTE.md` (migrazione completa al cliente) né `admin/SETUP.md` (setup CMS).

---

## Breaking changes

1. **`REPO_OWNER` e `REPO_NAME` sono sempre obbligatori**  
   Non c’è più un default nel codice (niente più fallback silenzioso a un repo “storico”).  
   Se mancano, **il CMS non salva** (comportamento *fail-loud*: errore chiaro, non salvataggio sul posto sbagliato).

2. **Dopo il deploy di questo codice, senza `REPO_*` sul Netlify il CMS si ferma**  
   Vale per il sito **attuale** e per ogni sito cliente. Imposta le env **prima** o **subito** al deploy, poi fai redeploy.

3. **Branch GitHub configurabile**  
   Il branch di scrittura non è più solo hardcodato: usa `GITHUB_BRANCH` (opzionale, default `main`).

4. **Segreto token CMS separabile dalla password**  
   Con `CMS_TOKEN_SECRET` (opzionale ma consigliato) la firma dei token di sessione non dipende solo da `ADMIN_PASSWORD`.  
   Se assente, si continua a usare la password (comportamento compatibile).

---

## Cosa fa il codice ora (in sintesi)

| Comportamento | Dettaglio |
|---------------|-----------|
| Target repo | Solo da env: `REPO_OWNER` + `REPO_NAME` (obbligatori) |
| Branch commit | `GITHUB_BRANCH` se impostato, altrimenti `main` |
| Login CMS | `ADMIN_EMAIL` + `ADMIN_PASSWORD` |
| Firma token sessione | `CMS_TOKEN_SECRET` se presente, altrimenti `ADMIN_PASSWORD` |
| Cartella Cloudinary | `CLOUDINARY_FOLDER` opzionale |
| CORS extra | `ALLOWED_ORIGINS` (virgola-separate); l’URL del sito Netlify corrente è già considerato |
| Health check | `/.netlify/functions/health` deve rispondere **ok** |
| Messaggio dopo salvataggio | Il CMS può mostrare dove ha scritto, es. **«Salvato su owner/repo»** |

---

## Azioni esterne obbligatorie (tu / Netlify / GitHub)

Queste operazioni **non** si risolvono solo con il codice. Fallle a mano.

### A) Sul Netlify del sito ATTUALE (prima o subito al deploy del nuovo codice)

1. **Imposta subito** (esempio valori storici di sviluppo):
   - `REPO_OWNER=Massimilianociconte`
   - `REPO_NAME=Arconti31`  
   Senza queste due variabili, **dopo il deploy il CMS non salva più**.
2. Verifica che restino presenti: `GITHUB_TOKEN`, `ADMIN_EMAIL`, `ADMIN_PASSWORD`.
3. (Consigliato) genera un `CMS_TOKEN_SECRET` casuale lungo (es. 32+ caratteri) e impostalo su Netlify.
4. (Opzionale) `GITHUB_BRANCH=main` se vuoi esplicitarlo; se assente usa `main`.
5. (Opzionale) `CLOUDINARY_FOLDER` se usi una cartella dedicata su Cloudinary.
6. **Trigger deploy** → **Deploy site** dopo ogni modifica alle env.
7. Test health: apri `https://URL-DEL-TUO-SITO/.netlify/functions/health` → deve dare **ok**.
8. Test CMS: login → modifica di prova → salva → sul repo GitHub corretto deve comparire il commit; il CMS può mostrare «Salvato su owner/repo».

### B) Sul Netlify del CLIENTE (in handoff / migrazione)

1. Imposta **sempre**:
   - `REPO_OWNER` = username GitHub **del cliente**
   - `REPO_NAME` = nome esatto del repository del cliente
   - `GITHUB_TOKEN` = token Classic del cliente (scope `repo`)
   - `ADMIN_EMAIL`, `ADMIN_PASSWORD`
2. Opzionali consigliati: `CMS_TOKEN_SECRET`, `GITHUB_BRANCH`, Cloudinary, `ALLOWED_ORIGINS`.
3. Redeploy dopo le env.
4. Test health + test salvataggio con commit **solo** sul repo del cliente.

### C) Freeze writer sul Netlify VECCHIO (prima che il ristorante usi il CMS nuovo)

Per evitare che qualcuno salvi ancora sul sito vecchio mentre il menù “vero” è sul nuovo:

1. **Rimuovi** `GITHUB_TOKEN` dal Netlify vecchio, **oppure**
2. **Cambia** `ADMIN_PASSWORD` sul Netlify vecchio (così il login vecchio non funziona più con la password comunicata al ristorante).

Fai questo **prima** che il ristorante usi regolarmente il CMS nuovo.

### D) Rollback DNS in ~15 minuti (se il dominio custom va male)

1. Sul registrar (o DNS), ripristina i record A/CNAME che puntavano al Netlify **precedente** (quello che funzionava).
2. Assicurati che un solo Netlify “possegga” il dominio custom in quel momento (togli il dominio dal sito sbagliato se serve).
3. Attendi la propagazione (spesso pochi minuti; a volte di più).
4. Verifica: sito pubblico + `https://tuodominio/admin` + health.

---

## Env minime (promemoria)

**Obbligatorie**

```
GITHUB_TOKEN=ghp_...
REPO_OWNER=username_github
REPO_NAME=nome_repo
ADMIN_EMAIL=email@esempio.it
ADMIN_PASSWORD=********
```

**Opzionali (consigliate dove indicato)**

```
GITHUB_BRANCH=main
CMS_TOKEN_SECRET=segreto_random_lungo
CLOUDINARY_FOLDER=nome-cartella
ALLOWED_ORIGINS=https://altro-dominio.example
CLOUDINARY_CLOUD_NAME=...
CLOUDINARY_UPLOAD_PRESET=...
CLOUDINARY_API_KEY=...
CLOUDINARY_API_SECRET=...
```

---

## Checklist rapida post-deploy

- [ ] `REPO_OWNER` e `REPO_NAME` presenti sul Netlify **giusto**
- [ ] Redeploy fatto dopo le env
- [ ] `/.netlify/functions/health` → ok
- [ ] Login CMS ok
- [ ] Salvataggio CMS → commit sul **repo corretto** (messaggio tipo «Salvato su owner/repo»)
- [ ] Freeze writer sul Netlify vecchio (token rimosso o password cambiata)
- [ ] (Se dominio) cutover DNS solo dopo test verdi; rollback DNS pronto

---

## Riferimenti

- Migrazione account: [`HANDOFF_CLIENTE.md`](./HANDOFF_CLIENTE.md)
- Setup CMS: [`admin/SETUP.md`](./admin/SETUP.md)
- Deploy generale: [`DEPLOY_GUIDE.md`](./DEPLOY_GUIDE.md)
