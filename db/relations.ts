import { relations } from "drizzle-orm";
import { users, schemes, profiles, applications } from "./schema";

export const usersRelations = relations(users, ({ one, many }) => ({
  profile: one(profiles, {
    fields: [users.id],
    references: [profiles.userId],
  }),
  applications: many(applications),
}));

export const profilesRelations = relations(profiles, ({ one }) => ({
  user: one(users, { fields: [profiles.userId], references: [users.id] }),
}));

export const applicationsRelations = relations(applications, ({ one }) => ({
  user: one(users, { fields: [applications.userId], references: [users.id] }),
  scheme: one(schemes, {
    fields: [applications.schemeId],
    references: [schemes.id],
  }),
}));

export const schemesRelations = relations(schemes, ({ many }) => ({
  applications: many(applications),
}));
