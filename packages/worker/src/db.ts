import Database from "better-sqlite3";
import path from "path";
import fs from "fs";

// Quando bundled: __dirname = dist/ → data fica em dist/../data = <raiz>/data
// Quando via tsx:  __dirname = packages/worker/src/ → sobe 3 níveis
const DATA_DIR = path.resolve(
  __dirname,
  __dirname.endsWith("dist") ? "../data" : "../../../data"
);
if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });

const workerId = process.env.WORKER_ID ?? "worker-default";
const dbPath = path.join(DATA_DIR, `${workerId}.db`);

const db = new Database(dbPath);

db.exec(`
  CREATE TABLE IF NOT EXISTS _migrations (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    migration_id TEXT UNIQUE NOT NULL,
    filename    TEXT NOT NULL,
    applied_at  TEXT NOT NULL
  )
`);

export function isMigrationApplied(migrationId: string): boolean {
  const row = db
    .prepare("SELECT 1 FROM _migrations WHERE migration_id = ?")
    .get(migrationId);
  return row !== undefined;
}

export function applyMigration(
  migrationId: string,
  filename: string,
  sql: string
): void {
  db.transaction(() => {
    db.exec(sql);
    db.prepare(
      "INSERT INTO _migrations (migration_id, filename, applied_at) VALUES (?, ?, ?)"
    ).run(migrationId, filename, new Date().toISOString());
  })();
}

export function listAppliedMigrations(): {
  migration_id: string;
  filename: string;
  applied_at: string;
}[] {
  return db
    .prepare(
      "SELECT migration_id, filename, applied_at FROM _migrations ORDER BY id"
    )
    .all() as { migration_id: string; filename: string; applied_at: string }[];
}
