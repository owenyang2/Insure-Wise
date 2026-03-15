import { pgTable, uuid, integer, text, jsonb, timestamp } from "drizzle-orm/pg-core";
import { userProfilesTable } from "./users";

export const quoteResultsTable = pgTable("quote_results", {
  id: uuid("id").defaultRandom().primaryKey(),
  userProfileId: integer("user_profile_id")
    .references(() => userProfilesTable.id, { onDelete: "cascade" }),
  insuranceType:    text("insurance_type").notNull(),
  inputsSnapshot:   jsonb("inputs_snapshot").notNull(),
  resultsSnapshot:  jsonb("results_snapshot").notNull(),
  resultCount:      integer("result_count").notNull(),
  cheapestMonthly:  integer("cheapest_monthly").notNull(),
  cheapestCarrier:  text("cheapest_carrier").notNull(),
  createdAt:        timestamp("created_at").defaultNow().notNull(),
});

export type QuoteResult_DB = typeof quoteResultsTable.$inferSelect;
export type NewQuoteResult_DB = typeof quoteResultsTable.$inferInsert;
