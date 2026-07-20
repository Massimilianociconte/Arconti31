/**
 * One-shot DATA-001: rimuove cartella orfana i-nostri-rum/ dopo merge in i-nostri-rhum/.
 * Idempotente. Eseguito automaticamente all'inizio di generate-json.js.
 */
const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const orphanDir = path.join(root, 'i-nostri-rum');
const canonicalDir = path.join(root, 'i-nostri-rhum');

function cleanupOrphanRumDir() {
  if (!fs.existsSync(orphanDir)) {
    return { removed: false, files: [] };
  }

  // Safety: non cancellare se la canonica non esiste
  if (!fs.existsSync(canonicalDir)) {
    console.warn('⚠️  i-nostri-rhum/ assente: skip cleanup i-nostri-rum/');
    return { removed: false, files: [], skipped: true };
  }

  const files = fs.readdirSync(orphanDir);
  const removedFiles = [];
  for (const file of files) {
    const full = path.join(orphanDir, file);
    const stat = fs.statSync(full);
    if (stat.isFile()) {
      fs.unlinkSync(full);
      removedFiles.push(file);
    }
  }

  // Rimuovi solo se directory vuota (o solo dir residue)
  const remaining = fs.readdirSync(orphanDir);
  if (remaining.length === 0) {
    fs.rmdirSync(orphanDir);
  } else {
    // force remove tree if only empty leftovers
    try {
      fs.rmSync(orphanDir, { recursive: true, force: true });
    } catch (e) {
      console.warn('⚠️  Impossibile rimuovere i-nostri-rum/:', e.message);
      return { removed: false, files: removedFiles };
    }
  }

  console.log(`🧹 DATA-001: rimossa cartella orfana i-nostri-rum/ (${removedFiles.length} file)`);
  return { removed: true, files: removedFiles };
}

if (require.main === module) {
  const result = cleanupOrphanRumDir();
  if (result.removed) {
    result.files.forEach(f => console.log('  - deleted i-nostri-rum/' + f));
  } else if (!result.skipped) {
    console.log('i-nostri-rum/ già assente');
  }
}

module.exports = { cleanupOrphanRumDir };
