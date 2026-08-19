import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import * as schema from "./schema";
import path from "path";
import fs from "fs";

const dbPath = process.env.DATABASE_URL?.replace("file:", "") ||
  path.join(process.cwd(), "data", "app.db");

// Ensure the parent directory exists before opening the file — better-sqlite3
// throws (not creates) if it doesn't, which otherwise breaks builds/deploys
// on hosts like Railway where the data dir isn't there yet.
fs.mkdirSync(path.dirname(dbPath), { recursive: true });

// timeout: how long (ms) to wait for a lock before throwing SQLITE_BUSY —
// Next's build spins up several workers that each import this module and
// open the file concurrently (e.g. collecting page data for multiple
// routes at once); without a timeout the loser of that race fails the
// whole build instead of just waiting its turn.
const sqlite = new Database(dbPath, { timeout: 10000 });
sqlite.pragma("journal_mode = WAL");
sqlite.pragma("foreign_keys = ON");
sqlite.pragma("busy_timeout = 10000");

export const db = drizzle(sqlite, { schema });
export type DB = typeof db;
