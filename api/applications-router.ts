import { z } from "zod";
import { createRouter, publicQuery } from "./middleware";
import { sqliteDb } from "./lib/sqlite-db";

const STATUS = ["saved", "documents_ready", "submitted", "approved"] as const;

export const applicationsRouter = createRouter({
  list: publicQuery.query(async ({ ctx }) => {
    const userId = ctx.user?.id ?? 1;
    const rows = sqliteDb.prepare(`
      SELECT 
        a.id as app_id, a.user_id, a.scheme_id, a.status, a.notes, a.created_at as app_created_at,
        s.id as s_id, s.slug, s.name, s.name_hi, s.ministry, s.category, s.level, s.summary,
        s.summary_hi, s.benefits, s.benefits_hi, s.rules, s.documents, s.steps, s.official_url, s.tags,
        s.created_at as s_created_at
      FROM applications a
      JOIN schemes s ON a.scheme_id = s.id
      WHERE a.user_id = ?
      ORDER BY a.updated_at DESC
    `).all(userId) as any[];

    return rows.map((r) => ({
      application: {
        id: r.app_id,
        userId: r.user_id,
        schemeId: r.scheme_id,
        status: r.status,
        notes: r.notes,
        createdAt: new Date(r.app_created_at),
        updatedAt: new Date(r.app_created_at),
      },
      scheme: {
        id: r.s_id,
        slug: r.slug,
        name: r.name,
        nameHi: r.name_hi,
        ministry: r.ministry,
        category: r.category,
        level: r.level,
        summary: r.summary,
        summaryHi: r.summary_hi,
        benefits: r.benefits,
        benefitsHi: r.benefits_hi,
        rules: r.rules,
        documents: r.documents,
        steps: r.steps,
        officialUrl: r.official_url,
        tags: r.tags,
        createdAt: new Date(r.s_created_at),
      },
    }));
  }),

  track: publicQuery
    .input(z.object({ schemeSlug: z.string(), notes: z.string().max(2000).optional() }))
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.user?.id ?? 1;
      const scheme = sqliteDb.prepare("SELECT id FROM schemes WHERE slug = ?").get(input.schemeSlug) as any;
      if (!scheme) throw new Error("Scheme not found");

      const stmt = sqliteDb.prepare(`
        INSERT INTO applications (user_id, scheme_id, notes, status)
        VALUES (?, ?, ?, 'saved')
        ON CONFLICT(user_id, scheme_id) DO UPDATE SET notes=excluded.notes, updated_at=CURRENT_TIMESTAMP
      `);
      stmt.run(userId, scheme.id, input.notes ?? null);

      return { ok: true };
    }),

  updateStatus: publicQuery
    .input(z.object({ id: z.number(), status: z.enum(STATUS) }))
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.user?.id ?? 1;
      sqliteDb.prepare(`
        UPDATE applications SET status = ?, updated_at = CURRENT_TIMESTAMP
        WHERE id = ? AND user_id = ?
      `).run(input.status, input.id, userId);

      return { ok: true };
    }),

  updateNotes: publicQuery
    .input(z.object({ id: z.number(), notes: z.string().max(2000) }))
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.user?.id ?? 1;
      sqliteDb.prepare(`
        UPDATE applications SET notes = ?, updated_at = CURRENT_TIMESTAMP
        WHERE id = ? AND user_id = ?
      `).run(input.notes, input.id, userId);

      return { ok: true };
    }),

  remove: publicQuery
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.user?.id ?? 1;
      sqliteDb.prepare("DELETE FROM applications WHERE id = ? AND user_id = ?").run(input.id, userId);
      return { ok: true };
    }),
});
