import { pgTable, text, serial, timestamp, numeric, boolean, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";

export const facilities = pgTable("facilities", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  address: text("address").notNull(),
  city: text("city").notNull(),
  state: text("state").notNull(),
  zipCode: text("zip_code").notNull(),
  latitude: numeric("latitude").notNull(),
  longitude: numeric("longitude").notNull(),
  type: text("type").notNull(),
  phone: text("phone").notNull(),
  website: text("website"),
  acceptsInsurance: boolean("accepts_insurance").default(false),
  isVerified: boolean("is_verified").default(false),
  services: jsonb("services").notNull(),
  operatingHours: jsonb("operating_hours").notNull(),
  acceptedInsuranceProviders: jsonb("accepted_insurance_providers"),
  languages: jsonb("languages"),
  amenities: jsonb("amenities"),
  facilityType: text("facility_type"),
  waitTime: text("wait_time"),
  emergencyServices: boolean("emergency_services").default(false),
  telehealth: boolean("telehealth").default(false),
  financialAssistance: jsonb("financial_assistance"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow()
});

export const laws = pgTable("laws", {
  id: serial("id").primaryKey(),
  state: text("state").notNull(),
  category: text("category").notNull(),
  title: text("title").notNull(),
  content: text("content").notNull(),
  source: text("source").notNull(),
  effectiveDate: timestamp("effective_date"),
  lastUpdated: timestamp("last_updated").defaultNow()
});

export const petitions = pgTable("petitions", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  url: text("url").notNull(),
  category: text("category").notNull(),
  deadline: timestamp("deadline"),
  createdAt: timestamp("created_at").defaultNow()
});

export const newsUpdates = pgTable("news_updates", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  content: text("content").notNull(),
  sourceUrl: text("source_url").notNull(),
  sourceName: text("source_name").notNull(),
  state: text("state"),
  category: text("category").notNull(),
  publishedAt: timestamp("published_at").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  relevanceScore: numeric("relevance_score").notNull()
});

export const insertFacilitySchema = createInsertSchema(facilities);
export const selectFacilitySchema = createSelectSchema(facilities);
export type Facility = typeof facilities.$inferSelect;
export type NewFacility = typeof facilities.$inferInsert;

export const insertLawSchema = createInsertSchema(laws);
export const selectLawSchema = createSelectSchema(laws);
export type Law = typeof laws.$inferSelect;
export type NewLaw = typeof laws.$inferInsert;

export const insertPetitionSchema = createInsertSchema(petitions);
export const selectPetitionSchema = createSelectSchema(petitions);
export type Petition = typeof petitions.$inferSelect;
export type NewPetition = typeof petitions.$inferInsert;

export const insertNewsUpdateSchema = createInsertSchema(newsUpdates);
export const selectNewsUpdateSchema = createSelectSchema(newsUpdates);
export type NewsUpdate = typeof newsUpdates.$inferSelect;
export type NewNewsUpdate = typeof newsUpdates.$inferInsert;