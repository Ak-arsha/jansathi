import { z } from "zod";
import { createRouter, authedQuery, publicQuery } from "./middleware";
import { sqliteDb } from "./lib/sqlite-db";

const profileShape = z.object({
  fullName: z.string().max(255).nullish(),
  age: z.number().int().min(0).max(120).nullish(),
  gender: z.string().nullish(),
  state: z.string().nullish(),
  occupation: z.string().nullish(),
  annualIncome: z.number().int().min(0).nullish(),
  socialCategory: z.string().nullish(),
  ownsLand: z.boolean().nullish(),
  hasDisability: z.boolean().nullish(),
  familySize: z.number().int().min(1).max(50).nullish(),
});

function formatProfile(row: any) {
  if (!row) return null;
  return {
    id: row.id,
    userId: row.user_id,
    fullName: row.full_name,
    age: row.age,
    gender: row.gender,
    state: row.state,
    occupation: row.occupation,
    annualIncome: row.annual_income,
    socialCategory: row.social_category,
    ownsLand: Boolean(row.owns_land),
    hasDisability: Boolean(row.has_disability),
    familySize: row.family_size,
    createdAt: new Date(row.updated_at),
    updatedAt: new Date(row.updated_at),
  };
}

export const profileRouter = createRouter({
  get: publicQuery.query(async ({ ctx }) => {
    const userId = ctx.user?.id ?? 1;
    const row = sqliteDb.prepare("SELECT * FROM profiles WHERE user_id = ?").get(userId);
    return formatProfile(row);
  }),

  save: publicQuery.input(profileShape).mutation(async ({ ctx, input }) => {
    const userId = ctx.user?.id ?? 1;
    const stmt = sqliteDb.prepare(`
      INSERT INTO profiles (
        user_id, full_name, age, gender, state, occupation,
        annual_income, social_category, owns_land, has_disability, family_size
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(user_id) DO UPDATE SET
        full_name=excluded.full_name,
        age=excluded.age,
        gender=excluded.gender,
        state=excluded.state,
        occupation=excluded.occupation,
        annual_income=excluded.annual_income,
        social_category=excluded.social_category,
        owns_land=excluded.owns_land,
        has_disability=excluded.has_disability,
        family_size=excluded.family_size,
        updated_at=CURRENT_TIMESTAMP
    `);

    stmt.run(
      userId,
      input.fullName ?? null,
      input.age ?? null,
      input.gender ?? null,
      input.state ?? null,
      input.occupation ?? null,
      input.annualIncome ?? null,
      input.socialCategory ?? null,
      input.ownsLand ? 1 : 0,
      input.hasDisability ? 1 : 0,
      input.familySize ?? 1,
    );

    const updated = sqliteDb.prepare("SELECT * FROM profiles WHERE user_id = ?").get(userId);
    return formatProfile(updated);
  }),
});
