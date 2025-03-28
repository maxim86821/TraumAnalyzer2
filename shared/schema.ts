import { pgTable, text, serial, integer, boolean, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  name: text("name"),
  email: text("email"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
  name: true,
  email: true,
}).extend({
  // Add validation rules
  username: z.string().min(3, { message: "Benutzername muss mindestens 3 Zeichen lang sein" }),
  password: z.string().min(6, { message: "Passwort muss mindestens 6 Zeichen lang sein" }),
  email: z.string().email({ message: "Ungültige E-Mail-Adresse" }).optional(),
});

export const dreams = pgTable("dreams", {
  id: serial("id").primaryKey(),
  userId: integer("user_id"),
  title: text("title").notNull(),
  content: text("content").notNull(),
  imageUrl: text("image_url"),
  date: timestamp("date").notNull().defaultNow(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  analysis: text("analysis"),
  tags: text("tags").array(),
});

export const dreamAnalysis = pgTable("dream_analysis", {
  id: serial("id").primaryKey(),
  dreamId: integer("dream_id").notNull(),
  themes: text("themes").array(),
  emotions: text("emotions").array(),
  symbols: text("symbols").array(),
  interpretation: text("interpretation"),
});

// Dream insert schema
export const insertDreamSchema = createInsertSchema(dreams).omit({
  id: true,
  createdAt: true,
  analysis: true,
}).extend({
  // Ensure the title is at least 3 characters long
  title: z.string().min(3, { message: "Titel muss mindestens 3 Zeichen lang sein" }),
  // Ensure the content is at least 10 characters long
  content: z.string().min(10, { message: "Trauminhalt muss mindestens 10 Zeichen lang sein" }),
  // Date is required
  date: z.string().or(z.date()),
  // Tags are optional
  tags: z.array(z.string()).optional(),
});

// Dream analysis schema
export const insertDreamAnalysisSchema = createInsertSchema(dreamAnalysis).omit({
  id: true,
});

// Type definitions
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

export type Dream = typeof dreams.$inferSelect;
export type InsertDream = z.infer<typeof insertDreamSchema>;

export type DreamAnalysis = typeof dreamAnalysis.$inferSelect;
export type InsertDreamAnalysis = z.infer<typeof insertDreamAnalysisSchema>;

// Analysis response from AI
export interface AnalysisResponse {
  themes: string[];
  emotions: { name: string; intensity: number }[];
  symbols: { symbol: string; meaning: string }[];
  interpretation: string;
}
