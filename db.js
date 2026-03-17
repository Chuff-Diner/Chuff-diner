const fs = require("fs");
const path = require("path");
const initSqlJs = require("sql.js/dist/sql-wasm.js");

const dataDir = path.join(__dirname, "data");
const dbPath = path.join(dataDir, "chuff-diner.sqlite");

let SQL;
let db;

function ensureDataDir() {
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }
}

function persistDatabase() {
  const binary = db.export();
  fs.writeFileSync(dbPath, Buffer.from(binary));
}

function queryRows(sql, params = []) {
  const statement = db.prepare(sql);
  statement.bind(params);

  const rows = [];
  while (statement.step()) {
    rows.push(statement.getAsObject());
  }

  statement.free();
  return rows;
}

async function run(sql, params = []) {
  db.run(sql, params);
  const row = queryRows("SELECT last_insert_rowid() AS id")[0];
  const changes = queryRows("SELECT changes() AS count")[0];
  persistDatabase();

  return {
    lastID: row ? row.id : 0,
    changes: changes ? changes.count : 0
  };
}

async function get(sql, params = []) {
  const rows = queryRows(sql, params);
  return rows[0];
}

async function all(sql, params = []) {
  return queryRows(sql, params);
}

async function seedMenu() {
  const menuCount = await get("SELECT COUNT(*) AS count FROM menu");
  if (menuCount.count > 0) {
    return;
  }

  await run(
    "INSERT INTO menu (id, name, price, description) VALUES (?, ?, ?, ?)",
    ["drink", "Drinks", 10.0, "Freshly brewed coffee, teas, juices, and soft drinks."]
  );
  await run(
    "INSERT INTO menu (id, name, price, description) VALUES (?, ?, ?, ?)",
    ["burger", "Burgers", 40.0, "Juicy beef or chicken burgers served with crispy fries."]
  );
  await run(
    "INSERT INTO menu (id, name, price, description) VALUES (?, ?, ?, ?)",
    ["pizza", "Pizzas", 70.0, "Hand-tossed pizzas with rich sauce and premium toppings."]
  );
}

async function seedDiners() {
  const dinerCount = await get("SELECT COUNT(*) AS count FROM diners");
  if (dinerCount.count > 0) {
    return;
  }

  await run(
    "INSERT INTO diners (branch, address, open_hours) VALUES (?, ?, ?)",
    ["Central", "12 Market Street, Johannesburg", "06:00 - 23:00"]
  );
  await run(
    "INSERT INTO diners (branch, address, open_hours) VALUES (?, ?, ?)",
    ["Riverside", "44 Riverside Drive, Pretoria", "07:00 - 22:00"]
  );
  await run(
    "INSERT INTO diners (branch, address, open_hours) VALUES (?, ?, ?)",
    ["Sunset", "8 Sunset Avenue, Cape Town", "08:00 - 00:00"]
  );
}

async function initDatabase() {
  ensureDataDir();
  SQL = await initSqlJs({
    locateFile: () => require.resolve("sql.js/dist/sql-wasm.wasm")
  });

  if (fs.existsSync(dbPath)) {
    const fileBuffer = fs.readFileSync(dbPath);
    db = new SQL.Database(fileBuffer);
  } else {
    db = new SQL.Database();
  }

  await run("CREATE TABLE IF NOT EXISTS menu (id TEXT PRIMARY KEY, name TEXT NOT NULL, price REAL NOT NULL, description TEXT NOT NULL)");
  await run("CREATE TABLE IF NOT EXISTS diners (id INTEGER PRIMARY KEY AUTOINCREMENT, branch TEXT NOT NULL, address TEXT NOT NULL, open_hours TEXT NOT NULL)");
  await run("CREATE TABLE IF NOT EXISTS orders (id INTEGER PRIMARY KEY AUTOINCREMENT, customer_name TEXT NOT NULL, item_id TEXT NOT NULL, item_name TEXT NOT NULL, quantity INTEGER NOT NULL, total REAL NOT NULL, created_at TEXT NOT NULL)");

  await seedMenu();
  await seedDiners();
}

module.exports = {
  all,
  get,
  initDatabase,
  run
};
