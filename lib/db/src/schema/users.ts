import { pgTable, text, serial, timestamp, integer, real, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const userProfilesTable = pgTable("user_profiles", {
  id: serial("id").primaryKey(),
  sessionId: text("session_id").notNull().unique(),
  name: text("name").notNull(),
  age: integer("age").notNull(),
  location: text("location").notNull(),
  budgetMonthly: real("budget_monthly").notNull(),
  insuranceType: text("insurance_type").notNull(),
  priorities: jsonb("priorities").notNull().$type<{ price: number; coverage: number; rating: number }>(),
  requirements: text("requirements").array().notNull().default([]),
  vehicleDetails: jsonb("vehicle_details").$type<{ make: string; model: string; year: number; vin?: string } | null>(),
  propertyDetails: jsonb("property_details").$type<{ address: string; type: string; yearBuilt?: number; squareFeet?: number } | null>(),
  onboardingComplete: text("onboarding_complete").notNull().default("false"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const insertUserProfileSchema = createInsertSchema(userProfilesTable).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertUserProfile = z.infer<typeof insertUserProfileSchema>;
export type UserProfile = typeof userProfilesTable.$inferSelect;
