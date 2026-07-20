// Shared repository config for Netlify Functions
// REPO_OWNER e REPO_NAME sono obbligatori — nessun default hardcodato

/**
 * Risolve owner/repo/branch dalle variabili ambiente.
 * @returns {{ owner: string, repo: string, branch: string }}
 * @throws {{ message: string, code: 'REPO_CONFIG_MISSING' }} se manca owner o name
 */
function resolveRepoConfig() {
  const owner = (process.env.REPO_OWNER || '').trim();
  const repo = (process.env.REPO_NAME || '').trim();
  const branch = (process.env.GITHUB_BRANCH || 'main').trim() || 'main';

  if (!owner || !repo) {
    const err = new Error(
      'Configurazione repository mancante: imposta REPO_OWNER e REPO_NAME nelle variabili ambiente Netlify.'
    );
    err.code = 'REPO_CONFIG_MISSING';
    throw err;
  }

  return { owner, repo, branch };
}

module.exports = { resolveRepoConfig };
