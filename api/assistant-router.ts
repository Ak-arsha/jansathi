import { z } from "zod";
import { eq } from "drizzle-orm";
import { createRouter, publicQuery } from "./middleware";
import { getDb } from "./queries/connection";
import { schemes, profiles } from "@db/schema";
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
      const allSchemes = await getDb().select().from(schemes);

      // If the citizen is signed in, ground answers in their saved profile.
      let profile = null;
      if (ctx.user) {
        const row = await getDb().query.profiles.findFirst({
          where: eq(profiles.userId, ctx.user.id),
        });
        profile = row ?? null;
      }

      return generateReply(input.message, allSchemes, input.lang, profile);
    }),
});
