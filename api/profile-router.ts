import { z } from "zod";
import { createRouter, publicQuery } from "./middleware";
import { fetchProfile, saveProfileData } from "./lib/db-fallback";

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
  get: publicQuery.query(async ({ ctx }) => {
    const userId = ctx.user?.id ?? 1;
    return await fetchProfile(userId);
  }),

  save: publicQuery.input(profileShape).mutation(async ({ ctx, input }) => {
    const userId = ctx.user?.id ?? 1;
    return await saveProfileData(userId, input);
  }),
});
