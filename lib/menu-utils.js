const yaml = require('js-yaml');

const BASE_BEVERAGE_CATEGORIES = [
  { name: 'Cocktails', folder: 'cocktails' },
  { name: 'Analcolici', folder: 'analcolici' },
  { name: 'Bibite', folder: 'bibite' },
  { name: 'Caffetteria', folder: 'caffetteria' },
  { name: 'Bollicine', folder: 'bollicine' },
  { name: 'Bianchi fermi', folder: 'bianchi-fermi' },
  { name: 'Vini rossi', folder: 'vini-rossi' }
];

const LEGACY_BEVERAGE_FOLDER_ALIASES = {
  'amari-distillati': 'ammazza-caffe',
  'i-nostri-rum': 'i-nostri-rhum'
};

function normalizeSlug(value) {
  if (!value) return '';

  return String(value)
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[àáâãäå]/g, 'a')
    .replace(/[èéêë]/g, 'e')
    .replace(/[ìíîï]/g, 'i')
    .replace(/[òóôõö]/g, 'o')
    .replace(/[ùúûü]/g, 'u')
    .replace(/[^a-z0-9-]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

function getFilenameBase(filename) {
  if (!filename) return '';
  return String(filename).replace(/\.md$/i, '');
}

function getCategoryCollectionKey(category = {}) {
  return normalizeSlug(category.slug || category.nome || '');
}

function getCategoryFolder(category = {}) {
  if (category.folder) return category.folder;
  const collectionKey = getCategoryCollectionKey(category);
  return LEGACY_BEVERAGE_FOLDER_ALIASES[collectionKey] || collectionKey;
}

function getCategoryFolderAliases(category = {}) {
  const aliases = new Set();
  const collectionKey = getCategoryCollectionKey(category);
  const folder = getCategoryFolder(category);

  if (collectionKey) aliases.add(collectionKey);
  if (folder) aliases.add(folder);

  return [...aliases];
}

function findBeverageCategoryByFolder(categories = [], folder) {
  const normalizedFolder = normalizeSlug(folder);
  if (!normalizedFolder) return null;

  return categories.find(category =>
    category.tipo_menu === 'beverage' &&
    getCategoryFolderAliases(category).includes(normalizedFolder)
  ) || null;
}

function sanitizeFrontmatterData(data = {}) {
  const sanitized = {};

  Object.entries(data).forEach(([key, value]) => {
    if (key.startsWith('_') || value === undefined || value === null) return;

    if (Array.isArray(value)) {
      const cleanValues = value
        .filter(item => item !== undefined && item !== null && String(item).trim() !== '')
        .map(item => String(item));

      if (cleanValues.length > 0) {
        sanitized[key] = cleanValues;
      }
      return;
    }

    if (typeof value === 'boolean') {
      sanitized[key] = value;
      return;
    }

    if (typeof value === 'number') {
      sanitized[key] = key === 'prezzo' ? String(value) : value;
      return;
    }

    const stringValue = String(value);
    if (stringValue === '') return;

    sanitized[key] = key === 'prezzo' ? stringValue : stringValue;
  });

  return sanitized;
}

function stringifyFrontmatter(data = {}) {
  const sanitized = sanitizeFrontmatterData(data);
  const dumped = yaml.dump(sanitized, {
    forceQuotes: true,
    lineWidth: -1,
    noRefs: true,
    quotingType: '"'
  }).trimEnd();

  return `---\n${dumped}\n---\n`;
}

function normalizeFrontmatterData(data) {
  const normalized = { ...data };

  if (normalized.prezzo !== undefined && normalized.prezzo !== null) {
    normalized.prezzo = String(normalized.prezzo);
  }

  ['disponibile', 'visibile'].forEach(field => {
    if (normalized[field] !== undefined) {
      normalized[field] = normalized[field] === true || normalized[field] === 'true';
    }
  });

  if (normalized.order !== undefined && normalized.order !== null && normalized.order !== '') {
    normalized.order = parseInt(normalized.order, 10) || 0;
  }

  ['tags', 'allergeni'].forEach(field => {
    if (normalized[field] && !Array.isArray(normalized[field])) {
      normalized[field] = [normalized[field]];
    }
  });

  return normalized;
}

function parseFrontmatter(content) {
  const match = content.match(/---\r?\n([\s\S]*?)\r?\n---/);
  if (!match) return null;

  const parsed = yaml.load(match[1]);
  if (parsed === null || parsed === undefined) return {};
  if (typeof parsed !== 'object' || Array.isArray(parsed)) {
    throw new Error('Frontmatter non valido: atteso oggetto YAML');
  }

  return normalizeFrontmatterData(parsed);
}

module.exports = {
  BASE_BEVERAGE_CATEGORIES,
  findBeverageCategoryByFolder,
  getCategoryCollectionKey,
  getCategoryFolder,
  getCategoryFolderAliases,
  getFilenameBase,
  normalizeFrontmatterData,
  normalizeSlug,
  parseFrontmatter,
  stringifyFrontmatter
};
