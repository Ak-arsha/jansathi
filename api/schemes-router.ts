import { z } from "zod";
import { eq } from "drizzle-orm";
import { createRouter, publicQuery } from "./middleware";
import { getDb } from "./queries/connection";
import { schemes } from "@db/schema";
import { matchSchemes, type CitizenProfile } from "./lib/eligibility";

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
      const all = await getDb().select().from(schemes);
      let rows = all;
      if (input?.category && input.category !== "all") {
        rows = rows.filter((s) => s.category === input.category);
      }
      if (input?.search) {
        const q = input.search.toLowerCase();
        rows = rows.filter((s) => {
          const tags: string[] = JSON.parse(s.tags);
          return (
            s.name.toLowerCase().includes(q) ||
            s.nameHi.includes(q) ||
            s.summary.toLowerCase().includes(q) ||
            s.category.toLowerCase().includes(q) ||
            tags.some((t) => t.toLowerCase().includes(q))
          );
        });
      }
      return rows;
    }),

  categories: publicQuery.query(async () => {
    const all = await getDb().select({ category: schemes.category }).from(schemes);
    return [...new Set(all.map((r) => r.category))].sort();
  }),

  bySlug: publicQuery
    .input(z.object({ slug: z.string() }))
    .query(async ({ input }) => {
      const row = await getDb().query.schemes.findFirst({
        where: eq(schemes.slug, input.slug),
      });
      if (!row) throw new Error("Scheme not found");
      return row;
    }),

  match: publicQuery
    .input(z.object({ profile: profileInput }))
    .query(async ({ input }) => {
      const all = await getDb().select().from(schemes);
      return matchSchemes(all, input.profile as CitizenProfile);
    }),

  stats: publicQuery.query(async () => {
    const all = await getDb().select().from(schemes);
    return {
      totalSchemes: all.length,
      categories: new Set(all.map((s) => s.category)).size,
    };
  }),
});
