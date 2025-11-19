const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');

function processCollection(dirPath, itemType) {
  const items = [];
  
  if (fs.existsSync(dirPath)) {
    const files = fs.readdirSync(dirPath).filter(f => f.endsWith('.md'));
    
    files.forEach(file => {
      try {
        const content = fs.readFileSync(path.join(dirPath, file), 'utf8');
        
        // Estrai i dati dal frontmatter usando yaml
        const match = content.match(/---\n([\s\S]*?)\n---/);
        if (match) {
          const frontmatter = match[1];
          const item = yaml.load(frontmatter);
          
          // Converti i tipi
          if (item.prezzo) item.prezzo = parseFloat(item.prezzo);
          if (item.disponibile !== undefined) item.disponibile = item.disponibile === true || item.disponibile === 'true';
          if (item.order) item.order = parseInt(item.order);
          
          // Assicurati che tags e allergeni siano array
          if (item.tags && !Array.isArray(item.tags)) {
            item.tags = [item.tags];
          }
          if (item.allergeni && !Array.isArray(item.allergeni)) {
            item.allergeni = [item.allergeni];
          }
          
          items.push(item);
        }
      } catch (error) {
        console.error(`Errore nel processare ${file}:`, error.message);
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

// Raggruppa food per categoria
const foodByCategory = {};
foodItems.forEach(item => {
  const category = item.category || 'Altro';
  if (!foodByCategory[category]) {
    foodByCategory[category] = [];
  }
  foodByCategory[category].push(item);
});


// Processa tutte le categorie di bevande
const categories = [
  { name: 'Cocktails', folder: 'cocktails' },
  { name: 'Analcolici', folder: 'analcolici' },
  { name: 'Bibite', folder: 'bibite' },
  { name: 'Caffetteria', folder: 'caffetteria' },
  { name: 'Bollicine', folder: 'bollicine' },
  { name: 'Bianchi fermi', folder: 'bianchi-fermi' },
  { name: 'Vini rossi', folder: 'vini-rossi' }
];

const beveragesByType = {};
let totalBeverages = 0;

categories.forEach(category => {
  const dir = path.join(__dirname, `../${category.folder}`);
  const items = processCollection(dir, 'beverage');
  
  // Aggiungi il tipo a ogni item
  items.forEach(item => {
    item.tipo = category.name;
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

// Scrivi i file JSON
const beersOutput = { 
  beers,
  beersBySection 
};
fs.writeFileSync(
  path.join(__dirname, '../beers/beers.json'),
  JSON.stringify(beersOutput, null, 2)
);

// Scrivi food.json (NUOVO)
const foodOutput = {
  food: foodItems,
  foodByCategory
};
// Ensure food dir exists (already done but good for safety)
if (!fs.existsSync(foodDir)) fs.mkdirSync(foodDir);
fs.writeFileSync(
  path.join(__dirname, '../food/food.json'),
  JSON.stringify(foodOutput, null, 2)
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
