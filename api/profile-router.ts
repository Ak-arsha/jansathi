import { z } from "zod";
import { eq } from "drizzle-orm";
import { createRouter, authedQuery } from "./middleware";
import { getDb } from "./queries/connection";
import { profiles } from "@db/schema";

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

export const profileRouter = createRouter({
  get: authedQuery.query(async ({ ctx }) => {
    return (
      (await getDb().query.profiles.findFirst({
        where: eq(profiles.userId, ctx.user.id),
      })) ?? null
    );
  }),

  save: authedQuery.input(profileShape).mutation(async ({ ctx, input }) => {
    const db = getDb();
    await db
      .insert(profiles)
      .values({ userId: ctx.user.id, ...input })
      .onDuplicateKeyUpdate({ set: { ...input } });
    return db.query.profiles.findFirst({
      where: eq(profiles.userId, ctx.user.id),
    });
  }),
});
