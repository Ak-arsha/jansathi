import { z } from "zod";
import { createRouter, publicQuery } from "./middleware";
import { fetchAllSchemes, fetchProfile } from "./lib/db-fallback";
import { generateReply } from "./lib/assistant";
import { AgenticAIEngine } from "./lib/agentic-ai";
import { exec } from "child_process";
import path from "path";

export const assistantRouter = createRouter({
  chat: publicQuery
    .input(
      z.object({
        message: z.string().min(1).max(2000),
        lang: z.enum(["en", "hi"]).default("en"),
        useAgenticAI: z.boolean().optional().default(true),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const allSchemes = await fetchAllSchemes();
      const userId = ctx.user?.id ?? 1;
      const profile = await fetchProfile(userId);

      if (input.useAgenticAI) {
        const agenticEngine = new AgenticAIEngine(allSchemes);
        const agenticRes = agenticEngine.processTask(input.message, profile, input.lang);
        return {
          reply: agenticRes.finalAnswer,
          schemeSlugs: [],
          suggestions: agenticRes.suggestedActions,
          executionChain: agenticRes.executionChain,
          action: "none" as const,
        };
      }

      return generateReply(input.message, allSchemes, input.lang, profile);
    }),

  triggerScraper: publicQuery.mutation(async () => {
    return new Promise((resolve) => {
      const scriptPath = path.resolve(process.cwd(), "python_services", "scraper.py");
      exec(`python "${scriptPath}"`, (error, stdout) => {
        if (error) {
          console.error("Python scraper error:", error);
          resolve({ status: "error", message: error.message });
          return;
        }
        try {
          const lines = stdout.trim().split("\n");
          const lastLine = lines[lines.length - 1];
          const parsed = JSON.parse(lastLine);
          resolve({ status: "success", count: parsed.count, data: parsed.data });
        } catch {
          resolve({ status: "success", message: stdout });
        }
      });
    });
  }),
});
