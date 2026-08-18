import { z } from "zod";
import { createRouter, publicQuery } from "./middleware";
import { fetchAllSchemes, fetchSchemeBySlug } from "./lib/db-fallback";
import { getDb } from "./queries/connection";
import { applications, schemes, type Application, type Scheme } from "@db/schema";
import { and, eq } from "drizzle-orm";

const STATUS = ["saved", "documents_ready", "submitted", "approved"] as const;

let inMemoryApps: { application: Application; scheme: Scheme }[] = [];

export const applicationsRouter = createRouter({
  list: publicQuery.query(async ({ ctx }) => {
    const userId = ctx.user?.id ?? 1;
    try {
      const db = getDb();
      const rows = await db
        .select({ application: applications, scheme: schemes })
        .from(applications)
        .innerJoin(schemes, eq(applications.schemeId, schemes.id))
        .where(eq(applications.userId, userId));
      if (rows && rows.length > 0) return rows;
    } catch {
      // fallback
    }
    return inMemoryApps;
  }),

  track: publicQuery
    .input(z.object({ schemeSlug: z.string(), notes: z.string().max(2000).optional() }))
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.user?.id ?? 1;
      const scheme = await fetchSchemeBySlug(input.schemeSlug);
      if (!scheme) throw new Error("Scheme not found");
      const newApp: Application = {
        id: inMemoryApps.length + 1,
        userId,
        schemeId: scheme.id,
        status: "saved",
        notes: input.notes ?? null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      try {
        const db = getDb();
        await db
          .insert(applications)
          .values({ userId, schemeId: scheme.id, notes: input.notes })
          .onDuplicateKeyUpdate({ set: { notes: input.notes ?? null } });
      } catch {
        inMemoryApps = inMemoryApps.filter((item) => item.scheme.id !== scheme.id);
        inMemoryApps.push({ application: newApp, scheme });
      }
      return { ok: true };
    }),

  updateStatus: publicQuery
    .input(z.object({ id: z.number(), status: z.enum(STATUS) }))
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.user?.id ?? 1;
      try {
        const db = getDb();
        await db
          .update(applications)
          .set({ status: input.status })
          .where(and(eq(applications.id, input.id), eq(applications.userId, userId)));
      } catch {
        inMemoryApps = inMemoryApps.map((item) =>
          item.application.id === input.id
            ? { ...item, application: { ...item.application, status: input.status } }
            : item,
        );
      }
      return { ok: true };
    }),

  updateNotes: publicQuery
    .input(z.object({ id: z.number(), notes: z.string().max(2000) }))
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.user?.id ?? 1;
      try {
        const db = getDb();
        await db
          .update(applications)
          .set({ notes: input.notes })
          .where(and(eq(applications.id, input.id), eq(applications.userId, userId)));
      } catch {
        inMemoryApps = inMemoryApps.map((item) =>
          item.application.id === input.id
            ? { ...item, application: { ...item.application, notes: input.notes } }
            : item,
        );
      }
      return { ok: true };
    }),

  remove: publicQuery
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.user?.id ?? 1;
      try {
        const db = getDb();
        await db
          .delete(applications)
          .where(and(eq(applications.id, input.id), eq(applications.userId, userId)));
      } catch {
        inMemoryApps = inMemoryApps.filter((item) => item.application.id !== input.id);
      }
      return { ok: true };
    }),
});
