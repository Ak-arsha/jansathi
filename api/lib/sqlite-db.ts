import { SEED_SCHEMES } from "@db/schemes-data";
import path from "path";
import fs from "fs";

let sqliteDb: any;

try {
  const Database = (await import("better-sqlite3")).default;
  const dataDir = path.resolve(process.cwd(), "data");
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }

  const dbPath = path.resolve(dataDir, "jansathi.db");
  sqliteDb = new Database(dbPath);
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

    const insertMany = sqliteDb.transaction((schemesList: any[]) => {
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
} catch (e) {
  console.warn("better-sqlite3 initialization warning, using memory fallback database:", e);
  
  // Mock DB fallback for static serverless deployment environment
  const mockSchemes = SEED_SCHEMES.map((s, idx) => ({
    id: idx + 1,
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
    created_at: new Date().toISOString()
  }));

  sqliteDb = {
    prepare: (query: string) => {
      const q = query.toLowerCase();
      return {
        all: (...params: any[]) => {
          if (q.includes("from schemes")) return mockSchemes;
          if (q.includes("distinct category")) return Array.from(new Set(mockSchemes.map(s => s.category))).map(c => ({ category: c }));
          return [];
        },
        get: (...params: any[]) => {
          if (q.includes("from schemes") && params[0]) {
            return mockSchemes.find(s => s.slug === params[0] || s.id === params[0]) || mockSchemes[0];
          }
          if (q.includes("count(*)")) return { count: mockSchemes.length };
          return null;
        },
        run: (...params: any[]) => ({ lastInsertRowid: 1, changes: 1 })
      };
    },
    exec: () => {},
    pragma: () => {},
    transaction: (fn: any) => fn
  };
}

export { sqliteDb };
