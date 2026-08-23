import { z } from "zod";
import { createRouter, publicQuery } from "./middleware";
import { sqliteDb } from "./lib/sqlite-db";
import { matchSchemes, type CitizenProfile } from "./lib/eligibility";
import type { Scheme } from "@db/schema";

const profileInput = z.object({
  age: z.number().int().min(0).max(120).nullish(),
  gender: z.string().nullish(),
  state: z.string().nullish(),
  occupation: z.string().nullish(),
  annualIncome: z.number().int().min(0).nullish(),
  socialCategory: z.string().nullish(),
  ownsLand: z.boolean().nullish(),
  hasDisability: z.boolean().nullish(),
});

function normalizeSearchText(value: unknown): string {
  return String(value ?? "")
    .toLocaleLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .trim();
}

function formatSchemeRow(row: any): Scheme {
  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    nameHi: row.name_hi,
    ministry: row.ministry,
    category: row.category,
    level: row.level,
    summary: row.summary,
    summaryHi: row.summary_hi,
    benefits: row.benefits,
    benefitsHi: row.benefits_hi,
    rules: row.rules,
    documents: row.documents,
    steps: row.steps,
    officialUrl: row.official_url,
    tags: row.tags,
    createdAt: new Date(row.created_at),
  };
}

export const schemesRouter = createRouter({
  list: publicQuery
    .input(
      z
        .object({
          search: z.string().optional(),
          category: z.string().optional(),
        })
        .optional(),
    )
    .query(async ({ input }) => {
      const rows = sqliteDb.prepare("SELECT * FROM schemes ORDER BY id ASC").all() as any[];
      let results = rows.map(formatSchemeRow);

      if (input?.category && input.category !== "all") {
        results = results.filter((s) => s.category === input.category);
      }

      if (input?.search) {
        const q = normalizeSearchText(input.search);
        results = results.filter((s) => {
          try {
            const tags: unknown[] = typeof s.tags === "string" ? JSON.parse(s.tags) : s.tags;
            const searchableText = [
              s.slug,
              s.name,
              s.nameHi,
              s.ministry,
              s.category,
              s.summary,
              s.summaryHi,
              s.benefits,
              s.benefitsHi,
              ...(Array.isArray(tags) ? tags : []),
            ]
              .map(normalizeSearchText)
              .join(" ");

            return searchableText.includes(q);
          } catch {
            return [s.slug, s.name, s.nameHi, s.ministry, s.category, s.summary, s.summaryHi]
              .map(normalizeSearchText)
              .join(" ")
              .includes(q);
          }
        });
      }

      return results;
    }),

  categories: publicQuery.query(async () => {
    const rows = sqliteDb.prepare("SELECT DISTINCT category FROM schemes ORDER BY category ASC").all() as { category: string }[];
    return rows.map((r) => r.category);
  }),

  bySlug: publicQuery
    .input(z.object({ slug: z.string() }))
    .query(async ({ input }) => {
      const row = sqliteDb.prepare("SELECT * FROM schemes WHERE slug = ?").get(input.slug) as any;
      if (!row) throw new Error("Scheme not found");
      return formatSchemeRow(row);
    }),

  match: publicQuery
    .input(z.object({ profile: profileInput }))
    .mutation(async ({ input }) => {
      const rows = sqliteDb.prepare("SELECT * FROM schemes").all() as any[];
      const schemesList = rows.map(formatSchemeRow);
      return matchSchemes(schemesList, input.profile as CitizenProfile);
    }),

  stats: publicQuery.query(async () => {
    const rows = sqliteDb.prepare("SELECT category FROM schemes").all() as { category: string }[];
    return {
      totalSchemes: rows.length,
      categories: new Set(rows.map((s) => s.category)).size,
    };
  }),
});
