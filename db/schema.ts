import {
  mysqlTable,
  mysqlEnum,
  serial,
  bigint,
  int,
  varchar,
  text,
  boolean,
  timestamp,
  uniqueIndex,
  index,
} from "drizzle-orm/mysql-core";

export const users = mysqlTable("users", {
  id: serial("id").primaryKey(),
  unionId: varchar("unionId", { length: 255 }).notNull().unique(),
  name: varchar("name", { length: 255 }),
  email: varchar("email", { length: 320 }),
  avatar: text("avatar"),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt")
    .defaultNow()
    .notNull()
    .$onUpdate(() => new Date()),
  lastSignInAt: timestamp("lastSignInAt").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

/**
 * Curated knowledge base of government welfare schemes.
 * `rules` holds a JSON-encoded eligibility rule set evaluated by the
 * reasoning engine in api/lib/eligibility.ts.
 */
export const schemes = mysqlTable(
  "schemes",
  {
    id: serial("id").primaryKey(),
    slug: varchar("slug", { length: 128 }).notNull().unique(),
    name: varchar("name", { length: 255 }).notNull(),
    nameHi: varchar("nameHi", { length: 255 }).notNull(),
    ministry: varchar("ministry", { length: 255 }).notNull(),
    category: varchar("category", { length: 64 }).notNull(),
    level: mysqlEnum("level", ["central", "state"]).notNull(),
    summary: text("summary").notNull(),
    summaryHi: text("summaryHi").notNull(),
    benefits: text("benefits").notNull(),
    benefitsHi: text("benefitsHi").notNull(),
    // JSON: { minAge?, maxAge?, maxAnnualIncome?, occupations?, gender?,
    //         socialCategories?, requiresLand?, forDisabled?, states? }
    rules: text("rules").notNull(),
    // JSON string[]
    documents: text("documents").notNull(),
    // JSON string[]
    steps: text("steps").notNull(),
    officialUrl: varchar("officialUrl", { length: 512 }).notNull(),
    // JSON string[] — keywords used by the assistant for entity matching
    tags: text("tags").notNull(),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
  },
  (table) => ({
    categoryIdx: index("category_idx").on(table.category),
  }),
);

export type Scheme = typeof schemes.$inferSelect;
export type InsertScheme = typeof schemes.$inferInsert;

/** Citizen profile used by the eligibility reasoning engine. */
export const profiles = mysqlTable("profiles", {
  id: serial("id").primaryKey(),
  userId: bigint("userId", { mode: "number", unsigned: true })
    .notNull()
    .unique(),
  fullName: varchar("fullName", { length: 255 }),
  age: int("age"),
  gender: varchar("gender", { length: 16 }),
  state: varchar("state", { length: 64 }),
  occupation: varchar("occupation", { length: 64 }),
  annualIncome: int("annualIncome"),
  socialCategory: varchar("socialCategory", { length: 16 }),
  ownsLand: boolean("ownsLand"),
  hasDisability: boolean("hasDisability"),
  familySize: int("familySize"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt")
    .defaultNow()
    .notNull()
    .$onUpdate(() => new Date()),
});

export type Profile = typeof profiles.$inferSelect;
export type InsertProfile = typeof profiles.$inferInsert;

/** Schemes a citizen is tracking / applying for. */
export const applications = mysqlTable(
  "applications",
  {
    id: serial("id").primaryKey(),
    userId: bigint("userId", { mode: "number", unsigned: true }).notNull(),
    schemeId: bigint("schemeId", { mode: "number", unsigned: true }).notNull(),
    status: mysqlEnum("status", [
      "saved",
      "documents_ready",
      "submitted",
      "approved",
    ])
      .default("saved")
      .notNull(),
    notes: text("notes"),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt")
      .defaultNow()
      .notNull()
      .$onUpdate(() => new Date()),
  },
  (table) => ({
    userSchemeUnique: uniqueIndex("user_scheme_unique").on(
      table.userId,
      table.schemeId,
    ),
    userIdx: index("user_idx").on(table.userId),
  }),
);

export type Application = typeof applications.$inferSelect;
export type InsertApplication = typeof applications.$inferInsert;
