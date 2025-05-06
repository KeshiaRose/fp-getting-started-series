const sqlite = require("sqlite");
const sqlite3 = require("sqlite3");

async function initializeDatabase() {
  const db = await sqlite.open({
    filename: "database.db",
    driver: sqlite3.Database,
  });

  await createTables(db);
  return db;
}

async function createTables(db) {
  const usersTable = `
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `;

  const userDevicesTable = `
    CREATE TABLE IF NOT EXISTS user_devices (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT NOT NULL,
      device_id TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `;

  const sessionsTable = `
    CREATE TABLE IF NOT EXISTS sessions (
      sid TEXT PRIMARY KEY,
      sess TEXT NOT NULL,
      expired INTEGER NOT NULL
    );
  `;

  await db.exec(usersTable);
  await db.exec(userDevicesTable);
  await db.exec(sessionsTable);
}

const dbPromise = initializeDatabase();
module.exports = dbPromise;
