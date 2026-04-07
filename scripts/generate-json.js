const fs = require('fs');
const path = require('path');
const {
  BASE_BEVERAGE_CATEGORIES,
  getFilenameBase,
  getCategoryFolder,
  normalizeSlug,
  parseFrontmatter
} = require('../lib/menu-utils');

const buildErrors = [];

// Processa categorie dinamiche PRIMA di tutto
function loadCategories() {
  const categoriesDir = path.join(__dirname, '../categorie');
  const categories = [];
  
  if (fs.existsSync(categoriesDir)) {
    const files = fs.readdirSync(categoriesDir).filter(f => f.endsWith('.md'));
    
    files.forEach(file => {
      try {
        const content = fs.readFileSync(path.join(categoriesDir, file), 'utf8');
        const cat = parseFrontmatter(content);
        if (cat) {
          cat._filename = file;
          // INCLUDE TUTTE LE CATEGORIE nel JSON
          // Il filtro visibile deve essere fatto dal frontend (app.js), non qui.
          // Altrimenti il CMS non vede le categorie nascoste e non può riattivarle.
          categories.push(cat);
        }
      } catch (error) {
        console.error(`Errore nel processare categoria ${file}:`, error.message);
        buildErrors.push(`categorie/${file}: ${error.message}`);
      }
    });
  }
  
  // Ordina per order
  categories.sort((a, b) => (a.order || 0) - (b.order || 0));
  return categories;
}

const dynamicCategories = loadCategories();
console.log(`📁 Caricate ${dynamicCategories.length} categorie dinamiche`);

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

function processCollection(dirPath, itemType) {
  const items = [];
  
  if (fs.existsSync(dirPath)) {
    const files = fs.readdirSync(dirPath).filter(f => f.endsWith('.md'));
    
    files.forEach(file => {
      try {
        const content = fs.readFileSync(path.join(dirPath, file), 'utf8');

        const item = parseFrontmatter(content);
        if (item) {
          item._filename = file;
          items.push(item);
        }
      } catch (error) {
        console.error(`Errore nel processare ${file}:`, error.message);
        buildErrors.push(`${path.relative(path.join(__dirname, '..'), path.join(dirPath, file))}: ${error.message}`);
      }
    });
  }
  
  // Ordina per campo order
  items.sort((a, b) => (a.order || 0) - (b.order || 0));
  
  return items;
}

// Processa birre
const beersDir = path.join(__dirname, '../beers');
const beers = processCollection(beersDir, 'beer');
const beverageCategoriesList = dynamicCategories.filter(c => c.tipo_menu === 'beverage');

beers.forEach(beer => {
  const match = findCategoryByReference(beverageCategoriesList, beer.sezione, 'beverage');
  if (match) {
    beer.sezione = match.nome;
    beer.sezione_slug = normalizeSlug(beer.sezione_slug || match.slug || match.nome);
  } else if (beer.sezione_slug) {
    beer.sezione_slug = normalizeSlug(beer.sezione_slug);
  }
});

// Raggruppa birre per sezione
const beersBySection = {};
beers.forEach(beer => {
  const section = beer.sezione || 'Birre alla spina';
  if (!beersBySection[section]) {
    beersBySection[section] = [];
  }
  beersBySection[section].push(beer);
});

// Processa food (NUOVO)
const foodDir = path.join(__dirname, '../food');
const foodItems = processCollection(foodDir, 'food');
const foodCategoriesList = dynamicCategories.filter(c => c.tipo_menu === 'food');

foodItems.forEach(item => {
  const match = findCategoryByReference(foodCategoriesList, item.category, 'food');
  if (match) {
    item.category = match.nome;
    item.category_slug = normalizeSlug(item.category_slug || match.slug || match.nome);
  } else if (item.category_slug) {
    item.category_slug = normalizeSlug(item.category_slug);
  }
});

// Raggruppa food per categoria
const foodByCategory = {};

// Prima inizializza tutte le categorie food dinamiche (anche vuote)
dynamicCategories
  .filter(c => c.tipo_menu === 'food')
  .forEach(cat => {
    foodByCategory[cat.nome] = [];
  });

// Poi aggiungi i piatti
foodItems.forEach(item => {
  const category = item.category || 'Altro';
  if (!foodByCategory[category]) {
    foodByCategory[category] = [];
  }
  foodByCategory[category].push(item);
});

// Ordina le categorie secondo l'ordine definito nelle categorie dinamiche
const foodCategoryOrder = {};
dynamicCategories
  .filter(c => c.tipo_menu === 'food')
  .forEach((cat, idx) => {
    foodCategoryOrder[cat.nome] = cat.order || idx;
  });


// Processa tutte le categorie di bevande (hardcoded + dinamiche da categorie/*.md)

// Discover dynamic beverage folders from categories
const knownFolders = new Set(BASE_BEVERAGE_CATEGORIES.map(c => c.folder));
const allBeverageFolders = BASE_BEVERAGE_CATEGORIES.map(category => ({
  ...category,
  slug: category.folder
}));

dynamicCategories
  .filter(c => c.tipo_menu === 'beverage')
  .forEach(cat => {
    const folder = getCategoryFolder(cat);
    if (folder && !knownFolders.has(folder)) {
      allBeverageFolders.push({ name: cat.nome, folder, slug: normalizeSlug(cat.slug || cat.nome) });
      knownFolders.add(folder);
      console.log(`📦 Dynamic beverage folder discovered: ${folder} → "${cat.nome}"`);
    }
  });

const beveragesByType = {};
let totalBeverages = 0;

allBeverageFolders.forEach(category => {
  const dir = path.join(__dirname, `../${category.folder}`);
  const items = processCollection(dir, 'beverage');
  
  // Aggiungi il tipo a ogni item
  items.forEach(item => {
    item.tipo = category.name;
    item.tipo_slug = normalizeSlug(item.tipo_slug || category.slug || category.folder || category.name);
  });
  
  if (items.length > 0) {
    beveragesByType[category.name] = items;
    totalBeverages += items.length;
  }
});

// Crea array piatto di tutte le bevande
const allBeverages = [];
Object.values(beveragesByType).forEach(items => {
  allBeverages.push(...items);
});

if (buildErrors.length > 0) {
  console.error('\n❌ Build interrotta: trovati file markdown non validi.');
  buildErrors.forEach(error => console.error(`- ${error}`));
  process.exit(1);
}

// Scrivi i file JSON
const beersOutput = { 
  beers,
  beersBySection 
};
fs.writeFileSync(
  path.join(__dirname, '../beers/beers.json'),
  JSON.stringify(beersOutput, null, 2)
);

// Scrivi food.json con categorie ordinate
const foodOutput = {
  food: foodItems,
  foodByCategory,
  categoryOrder: foodCategoryOrder
};
if (!fs.existsSync(foodDir)) fs.mkdirSync(foodDir);
fs.writeFileSync(
  path.join(__dirname, '../food/food.json'),
  JSON.stringify(foodOutput, null, 2)
);

// Scrivi categorie.json per il frontend
const categoriesOutput = {
  categories: dynamicCategories,
  foodCategories: dynamicCategories.filter(c => c.tipo_menu === 'food'),
  beverageCategories: dynamicCategories.filter(c => c.tipo_menu === 'beverage')
};
const categoriesDir = path.join(__dirname, '../categorie');
if (!fs.existsSync(categoriesDir)) fs.mkdirSync(categoriesDir);
fs.writeFileSync(
  path.join(categoriesDir, 'categorie.json'),
  JSON.stringify(categoriesOutput, null, 2)
);

const beveragesOutput = { 
  beverages: allBeverages,
  beveragesByType 
};
// Ensure beverages dir exists
const beveragesDir = path.join(__dirname, '../beverages');
if (!fs.existsSync(beveragesDir)) fs.mkdirSync(beveragesDir);

fs.writeFileSync(
  path.join(beveragesDir, 'beverages.json'),
  JSON.stringify(beveragesOutput, null, 2)
);

console.log(`✅ Generato beers.json con ${beers.length} birre in ${Object.keys(beersBySection).length} sezioni`);
console.log(`✅ Generato food.json con ${foodItems.length} piatti in ${Object.keys(foodByCategory).length} categorie`);
console.log(`✅ Generato beverages.json con ${totalBeverages} bevande in ${Object.keys(beveragesByType).length} categorie`);
console.log(`✅ Generato categorie.json con ${dynamicCategories.length} categorie dinamiche`);
