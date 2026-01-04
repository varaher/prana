import { sql } from "drizzle-orm";
import { pgTable, text, varchar, serial, integer, timestamp, boolean, uniqueIndex, real, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: varchar("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

export const conversations = pgTable("conversations", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`).notNull(),
});

export const messages = pgTable("messages", {
  id: serial("id").primaryKey(),
  conversationId: integer("conversation_id").notNull().references(() => conversations.id, { onDelete: "cascade" }),
  role: text("role").notNull(),
  content: text("content").notNull(),
  createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`).notNull(),
});

export const insertConversationSchema = createInsertSchema(conversations).omit({
  id: true,
  createdAt: true,
});

export const insertMessageSchema = createInsertSchema(messages).omit({
  id: true,
  createdAt: true,
});

export type Conversation = typeof conversations.$inferSelect;
export type InsertConversation = z.infer<typeof insertConversationSchema>;
export type Message = typeof messages.$inferSelect;
export type InsertMessage = z.infer<typeof insertMessageSchema>;

export const chronicConditions = pgTable("chronic_conditions", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(),
  category: text("category").notNull(),
  description: text("description"),
});

export const alternativeMedicines = pgTable("alternative_medicines", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(),
  type: text("type").notNull(),
  description: text("description"),
});

export const userAlternativeMedicineUsage = pgTable("user_alternative_medicine_usage", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull(),
  conditionId: integer("condition_id").notNull().references(() => chronicConditions.id),
  medicineId: integer("medicine_id").notNull().references(() => alternativeMedicines.id),
  isHelping: boolean("is_helping").default(false),
  dosage: text("dosage"),
  frequency: text("frequency"),
  notes: text("notes"),
  startedAt: timestamp("started_at").default(sql`CURRENT_TIMESTAMP`).notNull(),
  createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`).notNull(),
}, (table) => ({
  uniqueUserConditionMedicine: uniqueIndex("unique_user_condition_medicine").on(table.userId, table.conditionId, table.medicineId),
}));

export const insertChronicConditionSchema = createInsertSchema(chronicConditions).omit({ id: true });
export const insertAlternativeMedicineSchema = createInsertSchema(alternativeMedicines).omit({ id: true });
export const insertUserAlternativeMedicineUsageSchema = createInsertSchema(userAlternativeMedicineUsage).omit({ id: true, createdAt: true });

export type ChronicCondition = typeof chronicConditions.$inferSelect;
export type InsertChronicCondition = z.infer<typeof insertChronicConditionSchema>;
export type AlternativeMedicine = typeof alternativeMedicines.$inferSelect;
export type InsertAlternativeMedicine = z.infer<typeof insertAlternativeMedicineSchema>;
export type UserAlternativeMedicineUsage = typeof userAlternativeMedicineUsage.$inferSelect;
export type InsertUserAlternativeMedicineUsage = z.infer<typeof insertUserAlternativeMedicineUsageSchema>;

export const wearableReadings = pgTable("wearable_readings", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull(),
  recordedAt: timestamp("recorded_at").default(sql`CURRENT_TIMESTAMP`).notNull(),
  heartRate: integer("heart_rate"),
  heartRateVariability: integer("heart_rate_variability"),
  restingHeartRate: integer("resting_heart_rate"),
  bloodOxygenSaturation: real("blood_oxygen_saturation"),
  bloodPressureSystolic: integer("blood_pressure_systolic"),
  bloodPressureDiastolic: integer("blood_pressure_diastolic"),
  respiratoryRate: integer("respiratory_rate"),
  bodyTemperature: real("body_temperature"),
  skinTemperature: real("skin_temperature"),
  steps: integer("steps"),
  distance: real("distance"),
  caloriesBurned: integer("calories_burned"),
  activeMinutes: integer("active_minutes"),
  flightsClimbed: integer("flights_climbed"),
  sleepDuration: integer("sleep_duration"),
  sleepQuality: integer("sleep_quality"),
  deepSleep: integer("deep_sleep"),
  lightSleep: integer("light_sleep"),
  remSleep: integer("rem_sleep"),
  sleepLatency: integer("sleep_latency"),
  stressLevel: integer("stress_level"),
  vo2Max: real("vo2_max"),
  recoveryScore: integer("recovery_score"),
  ambientTemperature: real("ambient_temperature"),
  humidity: real("humidity"),
  uvExposure: real("uv_exposure"),
  altitude: real("altitude"),
  noiseLevel: real("noise_level"),
  ecgReading: text("ecg_reading"),
  afibDetected: boolean("afib_detected"),
  fallDetected: boolean("fall_detected"),
  notes: text("notes"),
  deviceType: text("device_type"),
  createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`).notNull(),
});

export const healthReports = pgTable("health_reports", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull(),
  reportType: text("report_type").notNull(),
  periodStart: timestamp("period_start").notNull(),
  periodEnd: timestamp("period_end").notNull(),
  summary: text("summary").notNull(),
  insights: jsonb("insights"),
  recommendations: jsonb("recommendations"),
  riskFactors: jsonb("risk_factors"),
  trends: jsonb("trends"),
  overallScore: integer("overall_score"),
  heartHealthScore: integer("heart_health_score"),
  sleepScore: integer("sleep_score"),
  activityScore: integer("activity_score"),
  stressScore: integer("stress_score"),
  createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`).notNull(),
});

export const insertWearableReadingSchema = createInsertSchema(wearableReadings).omit({ id: true, createdAt: true });
export const insertHealthReportSchema = createInsertSchema(healthReports).omit({ id: true, createdAt: true });

export type WearableReading = typeof wearableReadings.$inferSelect;
export type InsertWearableReading = z.infer<typeof insertWearableReadingSchema>;
export type HealthReport = typeof healthReports.$inferSelect;
export type InsertHealthReport = z.infer<typeof insertHealthReportSchema>;
