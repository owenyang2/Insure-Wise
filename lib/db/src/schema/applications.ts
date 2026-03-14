import { pgTable, text, timestamp, varchar, integer, jsonb } from "drizzle-orm/pg-core";
import { userProfilesTable } from "./users";

export const applicationsTable = pgTable("applications", {
  id: varchar("id", { length: 36 }).primaryKey().notNull(), // UUID
  userProfileId: integer("user_profile_id")
    .notNull()
    .references(() => userProfilesTable.id, { onDelete: "cascade" }),
  policyId: varchar("policy_id", { length: 128 }).notNull(),
  insurerName: varchar("insurer_name", { length: 128 }).notNull(),
  planName: varchar("plan_name", { length: 128 }).notNull(),
  monthlyPremium: integer("monthly_premium").notNull(), // In dollars or cents
  status: varchar("status", { length: 32 }).notNull().default("submitted"), // submitted, pending_review, approved
  formData: jsonb("form_data").notNull(), // Store the raw submitted key-value pairs
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export type Application = typeof applicationsTable.$inferSelect;
export type NewApplication = typeof applicationsTable.$inferInsert;
