const fs = require('fs');
const path = require('path');
const {
  getCategoryFolder,
  getFilenameBase,
  normalizeSlug,
  parseFrontmatter,
  stringifyFrontmatter
} = require('../lib/menu-utils');

const ROOT_DIR = path.join(__dirname, '..');
const CATEGORIES_DIR = path.join(ROOT_DIR, 'categorie');

function listMarkdownFiles(dirPath) {
  if (!fs.existsSync(dirPath)) return [];
  return fs.readdirSync(dirPath).filter(file => file.endsWith('.md'));
}

function loadFrontmatterFile(filePath) {
  const raw = fs.readFileSync(filePath, 'utf8');
  return {
    raw,
    data: parseFrontmatter(raw)
  };
}

function loadCategories() {
  return listMarkdownFiles(CATEGORIES_DIR).map(file => {
    const filePath = path.join(CATEGORIES_DIR, file);
    const { data } = loadFrontmatterFile(filePath);
    return { ...data, _filename: file };
  });
}

function getCategoryAliases(category = {}) {
  const aliases = new Set();
  [category.nome, category.slug, category.folder, getFilenameBase(category._filename)].forEach(value => {
    const normalizedValue = normalizeSlug(value);
    if (normalizedValue) aliases.add(normalizedValue);
  });
  return [...aliases];
}

function findCategoryByReference(categories = [], value, typeMenu = null) {
  const normalizedValue = normalizeSlug(value);
  if (!normalizedValue) return null;

  return categories.find(category =>
    (!typeMenu || category.tipo_menu === typeMenu) &&
    getCategoryAliases(category).includes(normalizedValue)
  ) || null;
}

function upsertFieldAfter(data, fieldName, fieldValue, afterKey) {
  const result = {};
  let inserted = false;

  Object.entries(data)
    .filter(([key]) => key !== fieldName)
    .forEach(([key, value]) => {
      result[key] = value;
      if (!inserted && key === afterKey) {
        result[fieldName] = fieldValue;
        inserted = true;
      }
    });

  if (!inserted) {
    result[fieldName] = fieldValue;
  }

  return result;
}

function preserveLineEndings(content, originalContent) {
  if (originalContent.includes('\r\n')) {
    return content.replace(/\n/g, '\r\n');
  }
  return content;
}

function queueWrite(writes, filePath, originalContent, nextData) {
  const serialized = preserveLineEndings(stringifyFrontmatter(nextData), originalContent);
  if (serialized !== originalContent) {
    writes.push({ filePath, content: serialized });
  }
}

function backfillFood(categories, writes, errors) {
  const foodCategories = categories.filter(category => category.tipo_menu === 'food');
  const foodDir = path.join(ROOT_DIR, 'food');

  listMarkdownFiles(foodDir).forEach(file => {
    const filePath = path.join(foodDir, file);
    const { raw, data } = loadFrontmatterFile(filePath);
    const match = findCategoryByReference(foodCategories, data.category, 'food');

    if (!match) {
      errors.push(`food/${file}: categoria non risolta (${data.category || 'vuota'})`);
      return;
    }

    let nextData = { ...data, category: match.nome };
    nextData = upsertFieldAfter(
      nextData,
      'category_slug',
      normalizeSlug(data.category_slug || match.slug || match.nome),
      'category'
    );

    queueWrite(writes, filePath, raw, nextData);
  });
}

function backfillBeers(categories, writes, errors) {
  const beverageCategories = categories.filter(category => category.tipo_menu === 'beverage');
  const beersDir = path.join(ROOT_DIR, 'beers');

  listMarkdownFiles(beersDir).forEach(file => {
    const filePath = path.join(beersDir, file);
    const { raw, data } = loadFrontmatterFile(filePath);
    const match = findCategoryByReference(beverageCategories, data.sezione, 'beverage');

    if (!match) {
      errors.push(`beers/${file}: sezione non risolta (${data.sezione || 'vuota'})`);
      return;
    }

    let nextData = { ...data, sezione: match.nome };
    nextData = upsertFieldAfter(
      nextData,
      'sezione_slug',
      normalizeSlug(data.sezione_slug || match.slug || match.nome),
      'sezione'
    );

    queueWrite(writes, filePath, raw, nextData);
  });
}

function backfillBeverages(categories, writes) {
  const beverageCategories = categories.filter(category => category.tipo_menu === 'beverage');

  beverageCategories.forEach(category => {
    const folder = getCategoryFolder(category);
    const dirPath = path.join(ROOT_DIR, folder);

    if (!fs.existsSync(dirPath) || !fs.statSync(dirPath).isDirectory()) return;

    listMarkdownFiles(dirPath).forEach(file => {
      const filePath = path.join(dirPath, file);
      const { raw, data } = loadFrontmatterFile(filePath);
      const nextData = upsertFieldAfter(
        data,
        'tipo_slug',
        normalizeSlug(data.tipo_slug || category.slug || category.nome),
        'nome'
      );

      queueWrite(writes, filePath, raw, nextData);
    });
  });
}

function validateStableRefs() {
  const checks = [
    { dir: 'food', field: 'category_slug' },
    { dir: 'beers', field: 'sezione_slug' }
  ];

  const missing = [];

  checks.forEach(({ dir, field }) => {
    listMarkdownFiles(path.join(ROOT_DIR, dir)).forEach(file => {
      const filePath = path.join(ROOT_DIR, dir, file);
      const { data } = loadFrontmatterFile(filePath);
      if (!normalizeSlug(data[field])) {
        missing.push(`${dir}/${file}: manca ${field}`);
      }
    });
  });

  const categories = loadCategories().filter(category => category.tipo_menu === 'beverage');
  categories.forEach(category => {
    const folder = getCategoryFolder(category);
    const dirPath = path.join(ROOT_DIR, folder);
    if (!fs.existsSync(dirPath) || !fs.statSync(dirPath).isDirectory()) return;

    listMarkdownFiles(dirPath).forEach(file => {
      const filePath = path.join(dirPath, file);
      const { data } = loadFrontmatterFile(filePath);
      if (!normalizeSlug(data.tipo_slug)) {
        missing.push(`${folder}/${file}: manca tipo_slug`);
      }
    });
  });

  return missing;
}

function main() {
  const categories = loadCategories();
  const writes = [];
  const errors = [];

  backfillFood(categories, writes, errors);
  backfillBeers(categories, writes, errors);
  backfillBeverages(categories, writes);

  if (errors.length > 0) {
    console.error('❌ Backfill interrotto: trovati riferimenti non risolti.');
    errors.forEach(error => console.error(`- ${error}`));
    process.exit(1);
  }

  writes.forEach(({ filePath, content }) => {
    fs.writeFileSync(filePath, content);
  });

  const missing = validateStableRefs();
  if (missing.length > 0) {
    console.error('❌ Backfill incompleto: alcuni file non hanno i riferimenti stabili attesi.');
    missing.forEach(entry => console.error(`- ${entry}`));
    process.exit(1);
  }

  console.log(`✅ Backfill completato: ${writes.length} file aggiornati.`);
}

main();
