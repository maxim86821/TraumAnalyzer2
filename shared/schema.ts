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
}).extend({
  // Add validation rules
  username: z.string().min(3, { message: "Benutzername muss mindestens 3 Zeichen lang sein" }),
  password: z.string().min(6, { message: "Passwort muss mindestens 6 Zeichen lang sein" }),
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
  moodBeforeSleep: integer("mood_before_sleep"), // Stimmung vor dem Schlafen (1-10)
  moodAfterWakeup: integer("mood_after_wakeup"), // Stimmung nach dem Aufwachen (1-10)
  moodNotes: text("mood_notes"), // Notizen zur Stimmung
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
  // Mood values are optional but must be between 1-10 if provided
  moodBeforeSleep: z.number().min(1).max(10).optional(),
  moodAfterWakeup: z.number().min(1).max(10).optional(),
  moodNotes: z.string().optional(),
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
export interface MoodData {
  beforeSleep?: number; // Stimmung vor dem Schlafen, 1-10
  afterWakeup?: number; // Stimmung nach dem Aufwachen, 1-10
  notes?: string; // Optionale Notizen zur Stimmung
}

export interface KeywordReference {
  word: string;
  meaning: string;
  culturalReferences: { culture: string; interpretation: string }[];
  url?: string; // Optionale URL für weitere Informationen
}

export interface WeeklyInsight {
  summary: string; // Zusammenfassung der Träume der letzten Woche
  patterns: string[]; // Identifizierte Muster
  recommendations: string[]; // Empfehlungen basierend auf den Mustern
}

export interface AnalysisResponse {
  themes: string[];
  emotions: { name: string; intensity: number }[];
  symbols: { symbol: string; meaning: string }[];
  interpretation: string;
  keywords: string[]; // Wichtige Schlüsselwörter im Traum
  keywordReferences?: KeywordReference[]; // Referenzen zu den Schlüsselwörtern
  quote?: { text: string; source: string }; // Passendes Zitat
  motivationalInsight?: string; // Motivierender oder interessanter Gedanke
  weeklyInsight?: WeeklyInsight; // Wöchentliche Einsicht (nur vorhanden, wenn genug Daten verfügbar sind)
}

// Tiefere Musteranalyse basierend auf mehreren Träumen
export interface PatternSymbol {
  symbol: string;
  frequency: number; // Wie oft das Symbol auftaucht (in %)
  description: string; // Beschreibung des wiederkehrenden Symbols
  possibleMeaning: string; // Mögliche psychologische Bedeutung
  contexts: string[]; // Zusammenhänge, in denen das Symbol erschien
}

export interface PatternTheme {
  theme: string;
  frequency: number; // Wie oft das Thema auftaucht (in %)
  description: string; // Beschreibung des Themas
  relatedSymbols: string[]; // Verbundene Symbole
  emotionalTone: string; // Emotionale Ausrichtung
}

export interface PatternEmotion {
  emotion: string;
  averageIntensity: number; // Durchschnittliche Intensität (0-1)
  frequency: number; // Wie oft die Emotion auftritt (in %)
  trend: "rising" | "falling" | "stable"; // Entwicklungstrend
  associatedThemes: string[]; // Themen, mit denen diese Emotion häufig verbunden ist
}

export interface LifeAreaInsight {
  area: string; // z.B. "Arbeit", "Beziehungen", "Persönliches Wachstum"
  relatedSymbols: string[]; // Symbole, die mit diesem Lebensbereich in Verbindung stehen
  challenges: string[]; // Identifizierte Herausforderungen
  strengths: string[]; // Identifizierte Stärken
  suggestions: string[]; // Empfehlungen
}

export interface DeepPatternResponse {
  overview: {
    summary: string; // Allgemeine Zusammenfassung
    timespan: string; // z.B. "Letzte 30 Tage"
    dreamCount: number; // Anzahl der analysierten Träume
    dominantMood: string; // Vorherrschende Stimmung
  };
  recurringSymbols: PatternSymbol[]; // Wiederkehrende Symbole sortiert nach Häufigkeit
  dominantThemes: PatternTheme[]; // Hauptthemen
  emotionalPatterns: PatternEmotion[]; // Emotionale Muster
  lifeAreaInsights: LifeAreaInsight[]; // Einsichten nach Lebensbereichen
  personalGrowth: {
    potentialAreas: string[]; // Bereiche mit Wachstumspotential
    suggestions: string[]; // Vorschläge für persönliches Wachstum
  };
  wordFrequency: { word: string; count: number }[]; // Häufigkeit wichtiger Wörter
  timeline: {
    periods: {
      timeframe: string; // z.B. "5.-10. März"
      dominantThemes: string[];
      dominantEmotions: string[];
      summary: string;
    }[]
  };
  recommendations: {
    general: string[]; // Allgemeine Empfehlungen
    actionable: string[]; // Konkrete Handlungsvorschläge
  };
}
