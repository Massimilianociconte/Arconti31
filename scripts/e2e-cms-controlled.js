const assert = require('assert');
const crypto = require('crypto');
const fs = require('fs');
const os = require('os');
const path = require('path');

const REPO_ROOT = path.join(__dirname, '..');
const FIXTURE_DIRS = [
  'food',
  'beers',
  'beverages',
  'categorie',
  'cocktails',
  'analcolici',
  'bibite',
  'caffetteria',
  'bollicine',
  'bianchi-fermi',
  'vini-rossi',
  'ammazza-caffe',
  'i-nostri-rhum',
  'classici',
  'artigianali',
  'grappe',
  'selezione-di-gin',
  'selezione-di-whisky'
];

function calculateGitBlobSha(content) {
  return crypto
    .createHash('sha1')
    .update(`blob ${Buffer.byteLength(content, 'utf8')}\0${content}`, 'utf8')
    .digest('hex');
}

function ensureDir(filePath) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
}

function copyFixture(tempRoot) {
  for (const dir of FIXTURE_DIRS) {
    const source = path.join(REPO_ROOT, dir);
    if (!fs.existsSync(source)) continue;
    fs.cpSync(source, path.join(tempRoot, dir), { recursive: true });
  }
}

class MockResponse {
  constructor(status, body, headers = {}) {
    this.status = status;
    this.ok = status >= 200 && status < 300;
    this.headers = headers;
    this._body = body;
  }

  async text() {
    if (typeof this._body === 'string') return this._body;
    return JSON.stringify(this._body);
  }

  async json() {
    if (typeof this._body === 'string') {
      return JSON.parse(this._body);
    }
    return this._body;
  }
}

class GitHubRepoMock {
  constructor(root, owner, repo) {
    this.root = root;
    this.owner = owner;
    this.repo = repo;
    this.sequence = 0;
    this.headSha = this.nextId('commit');
    this.treeSha = this.nextId('tree');
    this.pendingTrees = new Map();
    this.pendingCommits = new Map();
    this.apiCalls = [];
    this.rawCalls = [];
  }

  nextId(prefix) {
    this.sequence += 1;
    return `${prefix}-${this.sequence}`;
  }

  repoPath(repoFilePath) {
    return path.join(this.root, repoFilePath);
  }

  readFile(repoFilePath) {
    const filePath = this.repoPath(repoFilePath);
    if (!fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
      throw new Error(`404 Not Found: ${repoFilePath}`);
    }
    return fs.readFileSync(filePath, 'utf8');
  }

  writeFile(repoFilePath, content) {
    const filePath = this.repoPath(repoFilePath);
    ensureDir(filePath);
    fs.writeFileSync(filePath, content, 'utf8');
  }

  deleteFile(repoFilePath) {
    const filePath = this.repoPath(repoFilePath);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
  }

  fileSha(repoFilePath) {
    return calculateGitBlobSha(this.readFile(repoFilePath));
  }

  listDirectory(repoDirPath) {
    const dirPath = this.repoPath(repoDirPath);
    if (!fs.existsSync(dirPath) || !fs.statSync(dirPath).isDirectory()) {
      throw new Error(`404 Not Found: ${repoDirPath}`);
    }

    return fs.readdirSync(dirPath).map(name => {
      const fullPath = path.join(dirPath, name);
      const relPath = path.posix.join(repoDirPath, name).replace(/^\.\//, '');
      const isDirectory = fs.statSync(fullPath).isDirectory();
      return {
        name,
        path: relPath,
        type: isDirectory ? 'dir' : 'file',
        sha: isDirectory ? null : this.fileSha(relPath)
      };
    });
  }

  touchRef() {
    this.treeSha = this.nextId('tree');
    this.headSha = this.nextId('commit');
  }

  applyTreeEntries(entries) {
    entries.forEach(entry => {
      if (entry.sha === null) {
        this.deleteFile(entry.path);
        return;
      }
      this.writeFile(entry.path, entry.content || '');
    });
    this.touchRef();
  }

  async handle(url, options = {}) {
    if (url.hostname === 'api.github.com') {
      return this.handleApi(url, options);
    }
    if (url.hostname === 'raw.githubusercontent.com') {
      return this.handleRaw(url);
    }
    throw new Error(`Unexpected fetch URL: ${url.toString()}`);
  }

  async handleRaw(url) {
    this.rawCalls.push(url.pathname);
    const prefix = `/${this.owner}/${this.repo}/main/`;
    if (!url.pathname.startsWith(prefix)) {
      return new MockResponse(404, 'Not Found');
    }

    const repoFilePath = decodeURIComponent(url.pathname.slice(prefix.length));
    try {
      return new MockResponse(200, this.readFile(repoFilePath));
    } catch (error) {
      return new MockResponse(404, 'Not Found');
    }
  }

  async handleApi(url, options) {
    const method = (options.method || 'GET').toUpperCase();
    this.apiCalls.push(`${method} ${url.pathname}`);
    const basePrefix = `/repos/${this.owner}/${this.repo}/`;
    if (!url.pathname.startsWith(basePrefix)) {
      return new MockResponse(404, 'Not Found');
    }

    const relativePath = url.pathname.slice(basePrefix.length);
    const body = options.body ? JSON.parse(options.body) : null;

    if (method === 'GET' && relativePath === 'branches/main') {
      return new MockResponse(200, {
        commit: {
          sha: this.headSha,
          commit: {
            tree: { sha: this.treeSha }
          }
        }
      });
    }

    if (method === 'POST' && relativePath === 'git/trees') {
      const treeSha = this.nextId('tree');
      this.pendingTrees.set(treeSha, body.tree || []);
      return new MockResponse(201, { sha: treeSha });
    }

    if (method === 'POST' && relativePath === 'git/commits') {
      const commitSha = this.nextId('commit');
      this.pendingCommits.set(commitSha, this.pendingTrees.get(body.tree) || []);
      return new MockResponse(201, { sha: commitSha });
    }

    if (method === 'PATCH' && relativePath === 'git/refs/heads/main') {
      const entries = this.pendingCommits.get(body.sha);
      if (!entries) return new MockResponse(404, 'Not Found');
      this.applyTreeEntries(entries);
      return new MockResponse(200, { object: { sha: this.headSha } });
    }

    if (relativePath.startsWith('contents/')) {
      const repoFilePath = decodeURIComponent(relativePath.slice('contents/'.length));

      if (method === 'GET') {
        try {
          const absolutePath = this.repoPath(repoFilePath);
          if (fs.existsSync(absolutePath) && fs.statSync(absolutePath).isDirectory()) {
            return new MockResponse(200, this.listDirectory(repoFilePath));
          }

          const content = this.readFile(repoFilePath);
          return new MockResponse(200, {
            content: Buffer.from(content, 'utf8').toString('base64'),
            sha: this.fileSha(repoFilePath)
          });
        } catch (error) {
          return new MockResponse(404, 'Not Found');
        }
      }

      if (method === 'PUT') {
        const content = Buffer.from(body.content, 'base64').toString('utf8');
        this.writeFile(repoFilePath, content);
        this.touchRef();
        return new MockResponse(200, {
          content: {
            path: repoFilePath,
            sha: this.fileSha(repoFilePath)
          }
        });
      }

      if (method === 'DELETE') {
        this.deleteFile(repoFilePath);
        this.touchRef();
        return new MockResponse(200, { commit: { sha: this.headSha } });
      }
    }

    return new MockResponse(404, 'Not Found');
  }

  snapshotCounts() {
    return {
      api: this.apiCalls.length,
      raw: this.rawCalls.length
    };
  }

  deltaCounts(before) {
    return {
      api: this.apiCalls.length - before.api,
      raw: this.rawCalls.length - before.raw
    };
  }
}

function createEvent(body, extraHeaders = {}) {
  return {
    httpMethod: 'POST',
    headers: { origin: 'http://localhost:8000', ...extraHeaders },
    body: JSON.stringify(body)
  };
}

async function parseResponse(response) {
  return {
    statusCode: response.statusCode,
    body: response.body ? JSON.parse(response.body) : null
  };
}

function clearModule(modulePath) {
  delete require.cache[require.resolve(modulePath)];
}

async function main() {
  const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'arconti31-e2e-'));
  copyFixture(tempRoot);

  process.env.ADMIN_EMAIL = 'admin@example.com';
  process.env.ADMIN_PASSWORD = 'super-secret';
  process.env.GITHUB_TOKEN = 'mock-token';
  process.env.REPO_OWNER = 'mock-owner';
  process.env.REPO_NAME = 'mock-repo';

  clearModule('../netlify/functions/auth.js');
  clearModule('../netlify/functions/read-data.js');
  clearModule('../netlify/functions/save-data.js');

  const mock = new GitHubRepoMock(tempRoot, process.env.REPO_OWNER, process.env.REPO_NAME);
  const originalFetch = global.fetch;
  global.fetch = async (input, options = {}) => {
    const url = new URL(typeof input === 'string' ? input : input.url);
    return mock.handle(url, options);
  };

  try {
    const auth = require('../netlify/functions/auth.js');
    const { handler: saveHandler } = require('../netlify/functions/save-data.js');
    const { handler: readHandler } = require('../netlify/functions/read-data.js');

    const results = [];

    const login = await parseResponse(await saveHandler(createEvent({
      action: 'login',
      email: 'admin@example.com',
      password: 'super-secret'
    })));
    assert.strictEqual(login.statusCode, 200, 'Login should succeed');
    assert.strictEqual(login.body.user.email, 'admin@example.com');
    const token = login.body.token || auth.generateToken('admin@example.com');
    results.push(['login', mock.deltaCounts({ api: 0, raw: 0 })]);

    const initialFoodRead = await parseResponse(await readHandler(createEvent({ folder: 'food' })));
    assert.strictEqual(initialFoodRead.statusCode, 200, 'JSON read should succeed');
    assert.ok(initialFoodRead.body.items.length > 0, 'Food JSON should contain items');

    const existingFoodSingle = await parseResponse(await readHandler(createEvent({
      folder: 'food',
      mode: 'api',
      token,
      filename: 'bacon-burger.md'
    })));
    assert.strictEqual(existingFoodSingle.statusCode, 200);
    assert.strictEqual(existingFoodSingle.body.items.length, 1);
    assert.ok(existingFoodSingle.body.items[0].sha, 'Existing item should expose SHA');

    const beforeFoodSave = mock.snapshotCounts();
    const saveFood = await parseResponse(await saveHandler(createEvent({
      token,
      action: 'save',
      collection: 'food',
      filename: 'e2e-panino-prova.md',
      data: {
        nome: 'E2E Panino Prova',
        category: 'Panini Ciabatta',
        prezzo: '12.50',
        descrizione: 'Panino di test controllato',
        disponibile: true,
        order: 999
      }
    })));
    assert.strictEqual(saveFood.statusCode, 200, 'Atomic food save should succeed');
    assert.ok(saveFood.body.sha, 'Atomic save should return file SHA');
    results.push(['save-food', mock.deltaCounts(beforeFoodSave)]);

    const foodJsonAfterSave = JSON.parse(fs.readFileSync(path.join(tempRoot, 'food/food.json'), 'utf8'));
    const savedFoodItem = foodJsonAfterSave.food.find(item => item.nome === 'E2E Panino Prova');
    assert.ok(savedFoodItem, 'food.json should include saved item');
    const categoriesJson = JSON.parse(fs.readFileSync(path.join(tempRoot, 'categorie/categorie.json'), 'utf8'));
    const expectedFoodCategorySlug = categoriesJson.categories.find(category => category.nome === 'Panini Ciabatta')?.slug;
    assert.strictEqual(savedFoodItem.category_slug, expectedFoodCategorySlug, 'food JSON should expose canonical category slug');
    assert.ok(foodJsonAfterSave.foodByCategory['Panini Ciabatta'].some(item => item.nome === 'E2E Panino Prova'));
    const savedFoodMarkdown = fs.readFileSync(path.join(tempRoot, 'food/e2e-panino-prova.md'), 'utf8');
    assert.ok(savedFoodMarkdown.includes(`category_slug: "${expectedFoodCategorySlug}"`), 'food markdown should dual-write category_slug');

    const freshFoodSingle = await parseResponse(await readHandler(createEvent({
      folder: 'food',
      mode: 'api',
      token,
      filename: 'e2e-panino-prova.md'
    })));
    assert.strictEqual(freshFoodSingle.statusCode, 200);
    assert.strictEqual(freshFoodSingle.body.items.length, 1);
    assert.strictEqual(freshFoodSingle.body.items[0].sha, saveFood.body.sha, 'Returned SHA should match stored file SHA');

    const beforeFoodDelete = mock.snapshotCounts();
    const deleteFood = await parseResponse(await saveHandler(createEvent({
      token,
      action: 'delete',
      collection: 'food',
      filename: 'e2e-panino-prova.md',
      sha: freshFoodSingle.body.items[0].sha
    })));
    assert.strictEqual(deleteFood.statusCode, 200, 'Atomic food delete should succeed');
    results.push(['delete-food', mock.deltaCounts(beforeFoodDelete)]);

    const foodJsonAfterDelete = JSON.parse(fs.readFileSync(path.join(tempRoot, 'food/food.json'), 'utf8'));
    assert.ok(!foodJsonAfterDelete.food.some(item => item.nome === 'E2E Panino Prova'), 'food.json should remove deleted item');
    assert.ok(!fs.existsSync(path.join(tempRoot, 'food/e2e-panino-prova.md')), 'Food markdown should be deleted');

    const protectedCategory = await parseResponse(await readHandler(createEvent({
      folder: 'categorie',
      mode: 'api',
      token,
      filename: 'piatti-speciali.md'
    })));
    assert.strictEqual(protectedCategory.statusCode, 200);
    const protectedData = protectedCategory.body.items[0].parsedItem;
    const protectedSha = protectedCategory.body.items[0].sha;

    const renameBlocked = await parseResponse(await saveHandler(createEvent({
      token,
      action: 'save',
      collection: 'categorie',
      filename: 'piatti-speciali.md',
      sha: protectedSha,
      data: {
        ...protectedData,
        slug: 'piatti-speciali-e-griglieria-v2'
      }
    })));
    assert.strictEqual(renameBlocked.statusCode, 400, 'Dependent category rename should be blocked');
    assert.ok(/Impossibile modificare la categoria/.test(renameBlocked.body.error));

    const deleteBlocked = await parseResponse(await saveHandler(createEvent({
      token,
      action: 'delete',
      collection: 'categorie',
      filename: 'piatti-speciali.md',
      sha: protectedSha
    })));
    assert.strictEqual(deleteBlocked.statusCode, 400, 'Dependent category delete should be blocked');
    assert.ok(/Impossibile eliminare la categoria/.test(deleteBlocked.body.error));

    const beforeBeverageSave = mock.snapshotCounts();
    const saveBeverage = await parseResponse(await saveHandler(createEvent({
      token,
      action: 'save',
      collection: 'ammazza-caffe',
      filename: 'e2e-amaro-prova.md',
      data: {
        nome: 'E2E Amaro Prova',
        prezzo: '7.00',
        descrizione: 'Amaro di test controllato',
        disponibile: true,
        order: 777
      }
    })));
    assert.strictEqual(saveBeverage.statusCode, 200, 'Dynamic beverage save should succeed');
    assert.ok(saveBeverage.body.sha);
    results.push(['save-beverage', mock.deltaCounts(beforeBeverageSave)]);

    const beveragesJsonAfterSave = JSON.parse(fs.readFileSync(path.join(tempRoot, 'beverages/beverages.json'), 'utf8'));
    const savedBeverageItem = beveragesJsonAfterSave.beverages.find(item => item.nome === 'E2E Amaro Prova' && item.tipo === 'Amari e Distillati');
    assert.ok(savedBeverageItem);
    assert.strictEqual(savedBeverageItem.tipo_slug, 'amari-distillati', 'beverages JSON should expose stable type slug');

    const beverageJsonRead = await parseResponse(await readHandler(createEvent({ folder: 'ammazza-caffe' })));
    assert.strictEqual(beverageJsonRead.statusCode, 200);
    const savedBeverageFromJson = beverageJsonRead.body.items.find(item => item.parsedItem?.nome === 'E2E Amaro Prova');
    assert.ok(savedBeverageFromJson, 'Dynamic beverage should be readable from JSON facade');

    const beverageSingle = await parseResponse(await readHandler(createEvent({
      folder: 'ammazza-caffe',
      mode: 'api',
      token,
      filename: 'e2e-amaro-prova.md'
    })));
    assert.strictEqual(beverageSingle.statusCode, 200);
    assert.strictEqual(beverageSingle.body.items.length, 1);

    const beforeBeverageDelete = mock.snapshotCounts();
    const deleteBeverage = await parseResponse(await saveHandler(createEvent({
      token,
      action: 'delete',
      collection: 'ammazza-caffe',
      filename: 'e2e-amaro-prova.md',
      sha: beverageSingle.body.items[0].sha
    })));
    assert.strictEqual(deleteBeverage.statusCode, 200, 'Dynamic beverage delete should succeed');
    results.push(['delete-beverage', mock.deltaCounts(beforeBeverageDelete)]);

    const beveragesJsonAfterDelete = JSON.parse(fs.readFileSync(path.join(tempRoot, 'beverages/beverages.json'), 'utf8'));
    assert.ok(!beveragesJsonAfterDelete.beverages.some(item => item.nome === 'E2E Amaro Prova'));

    const bulkListing = await parseResponse(await readHandler(createEvent({
      folder: 'categorie',
      mode: 'api',
      token,
      filenames: ['piatti-speciali.md', 'lammazza-caffe.md']
    })));
    assert.strictEqual(bulkListing.statusCode, 200);
    assert.deepStrictEqual(
      bulkListing.body.items.map(item => item.filename).sort(),
      ['lammazza-caffe.md', 'piatti-speciali.md']
    );
    assert.ok(bulkListing.body.items.every(item => item.sha), 'Bulk listing should return SHAs');

    console.log('\nE2E controlled test passed.');
    results.forEach(([name, counts]) => {
      console.log(`- ${name}: ${counts.api} GitHub API calls, ${counts.raw} raw fetch`);
    });
  } finally {
    global.fetch = originalFetch;
    fs.rmSync(tempRoot, { recursive: true, force: true });
  }
}

main().catch(error => {
  console.error('\nE2E controlled test failed.');
  console.error(error);
  process.exitCode = 1;
});
