import { z } from "zod";
import { createRouter, publicQuery } from "./middleware";
import { fetchAllSchemes, fetchProfile } from "./lib/db-fallback";
import { generateReply } from "./lib/assistant";

export const assistantRouter = createRouter({
  chat: publicQuery
    .input(
      z.object({
        message: z.string().min(1).max(2000),
        lang: z.enum(["en", "hi"]).default("en"),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const allSchemes = await fetchAllSchemes();
      const userId = ctx.user?.id ?? 1;
      const profile = await fetchProfile(userId);

      return generateReply(input.message, allSchemes, input.lang, profile);
    }),
});
