import { authRouter } from "./auth-router";
import { schemesRouter } from "./schemes-router";
import { assistantRouter } from "./assistant-router";
import { profileRouter } from "./profile-router";
import { applicationsRouter } from "./applications-router";
import { createRouter, publicQuery } from "./middleware";

export const appRouter = createRouter({
  ping: publicQuery.query(() => ({ ok: true, ts: Date.now() })),
  auth: authRouter,
  schemes: schemesRouter,
  assistant: assistantRouter,
  profile: profileRouter,
  applications: applicationsRouter,
});

export type AppRouter = typeof appRouter;
