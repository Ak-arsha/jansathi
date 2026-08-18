import Database from "better-sqlite3";
import path from "path";
import fs from "fs";
import { SEED_SCHEMES } from "@db/schemes-data";

const dataDir = path.resolve(process.cwd(), "data");
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const dbPath = path.resolve(dataDir, "jansathi.db");
export const sqliteDb = new Database(dbPath);

sqliteDb.pragma("journal_mode = WAL");

// ── Create Tables ─────────────────────────────────────────────────────────────
sqliteDb.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT,
    name TEXT NOT NULL,
    avatar TEXT,
    role TEXT NOT NULL DEFAULT 'user',
    auth_provider TEXT NOT NULL DEFAULT 'local',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS schemes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    slug TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    name_hi TEXT NOT NULL,
    ministry TEXT NOT NULL,
    category TEXT NOT NULL,
    level TEXT NOT NULL,
    summary TEXT NOT NULL,
    summary_hi TEXT NOT NULL,
    benefits TEXT NOT NULL,
    benefits_hi TEXT NOT NULL,
    rules TEXT NOT NULL,
    documents TEXT NOT NULL,
    steps TEXT NOT NULL,
    official_url TEXT NOT NULL,
    tags TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS profiles (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER UNIQUE NOT NULL,
    full_name TEXT,
    age INTEGER,
    gender TEXT,
    state TEXT,
    occupation TEXT,
    annual_income INTEGER,
    social_category TEXT,
    owns_land INTEGER DEFAULT 0,
    has_disability INTEGER DEFAULT 0,
    family_size INTEGER DEFAULT 1,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS applications (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    scheme_id INTEGER NOT NULL,
    status TEXT NOT NULL DEFAULT 'saved',
    notes TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, scheme_id)
  );
`);

// ── Seed Schemes Table ────────────────────────────────────────────────────────
const countStmt = sqliteDb.prepare("SELECT COUNT(*) as count FROM schemes");
const { count } = countStmt.get() as { count: number };

if (count === 0) {
  const insertScheme = sqliteDb.prepare(`
    INSERT INTO schemes (
      slug, name, name_hi, ministry, category, level, summary, summary_hi,
      benefits, benefits_hi, rules, documents, steps, official_url, tags
    ) VALUES (
      @slug, @name, @name_hi, @ministry, @category, @level, @summary, @summary_hi,
      @benefits, @benefits_hi, @rules, @documents, @steps, @official_url, @tags
    )
  `);

  const insertMany = sqliteDb.transaction((schemesList) => {
    for (const s of schemesList) {
      insertScheme.run({
        slug: s.slug,
        name: s.name,
        name_hi: s.nameHi,
        ministry: s.ministry,
        category: s.category,
        level: s.level,
        summary: s.summary,
        summary_hi: s.summaryHi,
        benefits: s.benefits,
        benefits_hi: s.benefitsHi,
        rules: JSON.stringify(s.rules),
        documents: JSON.stringify(s.documents),
        steps: JSON.stringify(s.steps),
        official_url: s.officialUrl,
        tags: JSON.stringify(s.tags),
      });
    }
  });

  insertMany(SEED_SCHEMES);
}
