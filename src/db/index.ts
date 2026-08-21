import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import * as schema from "./schema";
import path from "path";
import fs from "fs";

const dbPath = process.env.DATABASE_URL?.replace("file:", "") ||
  path.join(process.cwd(), "data", "app.db");

type DrizzleDb = ReturnType<typeof drizzle<typeof schema>>;
let cached: DrizzleDb | null = null;

// The connection is opened lazily, on first actual query, rather than at
// module import time. `next build` imports every route module (including
// this one, transitively) just to read its exports — it never calls a
// handler — so a module-scope `new Database(...)` used to open the real
// SQLite file during the build's "Collecting page data" step too. With
// many build workers doing that at once (or the live server holding the
// file open at the same time), that raced for the file lock and could
// fail the whole build with "database is locked". Opening on first use
// means a build that never executes a query never touches the file.
function getDb(): DrizzleDb {
  if (cached) return cached;

  // Ensure the parent directory exists before opening the file —
  // better-sqlite3 throws (not creates) if it doesn't, which otherwise
  // breaks first boot on hosts like Railway where the data dir isn't
  // there yet.
  fs.mkdirSync(path.dirname(dbPath), { recursive: true });

  // timeout: how long (ms) to wait for a lock before throwing SQLITE_BUSY —
  // keeps a slow-to-release lock (e.g. mid-deploy overlap) from failing
  // outright instead of just waiting its turn.
  const sqlite = new Database(dbPath, { timeout: 10000 });
  sqlite.pragma("journal_mode = WAL");
  sqlite.pragma("foreign_keys = ON");
  sqlite.pragma("busy_timeout = 10000");

  cached = drizzle(sqlite, { schema });
  return cached;
}

// A Proxy so existing call sites (`db.query...`, `db.insert(...)`, etc.)
// keep working unchanged — the real connection is created transparently
// the first time any property on `db` is actually accessed.
export const db: DrizzleDb = new Proxy({} as DrizzleDb, {
  get(_target, prop, receiver) {
    return Reflect.get(getDb() as object, prop, receiver);
  },
});
export type DB = typeof db;
