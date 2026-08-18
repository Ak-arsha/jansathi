import { z } from "zod";
import { and, eq } from "drizzle-orm";
import { createRouter, authedQuery } from "./middleware";
import { getDb } from "./queries/connection";
import { applications, schemes } from "@db/schema";

const STATUS = ["saved", "documents_ready", "submitted", "approved"] as const;

export const applicationsRouter = createRouter({
  list: authedQuery.query(async ({ ctx }) => {
    const db = getDb();
    const rows = await db
      .select({ application: applications, scheme: schemes })
      .from(applications)
      .innerJoin(schemes, eq(applications.schemeId, schemes.id))
      .where(eq(applications.userId, ctx.user.id));
    return rows;
  }),

  track: authedQuery
    .input(z.object({ schemeSlug: z.string(), notes: z.string().max(2000).optional() }))
    .mutation(async ({ ctx, input }) => {
      const db = getDb();
      const scheme = await db.query.schemes.findFirst({
        where: eq(schemes.slug, input.schemeSlug),
      });
      if (!scheme) throw new Error("Scheme not found");
      await db
        .insert(applications)
        .values({ userId: ctx.user.id, schemeId: scheme.id, notes: input.notes })
        .onDuplicateKeyUpdate({ set: { notes: input.notes ?? null } });
      return { ok: true };
    }),

  updateStatus: authedQuery
    .input(z.object({ id: z.number(), status: z.enum(STATUS) }))
    .mutation(async ({ ctx, input }) => {
      const db = getDb();
      await db
        .update(applications)
        .set({ status: input.status })
        .where(and(eq(applications.id, input.id), eq(applications.userId, ctx.user.id)));
      return { ok: true };
    }),

  updateNotes: authedQuery
    .input(z.object({ id: z.number(), notes: z.string().max(2000) }))
    .mutation(async ({ ctx, input }) => {
      const db = getDb();
      await db
        .update(applications)
        .set({ notes: input.notes })
        .where(and(eq(applications.id, input.id), eq(applications.userId, ctx.user.id)));
      return { ok: true };
    }),

  remove: authedQuery
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const db = getDb();
      await db
        .delete(applications)
        .where(and(eq(applications.id, input.id), eq(applications.userId, ctx.user.id)));
      return { ok: true };
    }),
});
