import {
  pgTable,
  text,
  serial,
  integer,
  boolean,
  timestamp,
  json,
  varchar,
} from "drizzle-orm/pg-core";
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

export const insertUserSchema = createInsertSchema(users)
  .pick({
    username: true,
    password: true,
  })
  .extend({
    // Add validation rules
    username: z
      .string()
      .min(3, { message: "Benutzername muss mindestens 3 Zeichen lang sein" }),
    password: z
      .string()
      .min(6, { message: "Passwort muss mindestens 6 Zeichen lang sein" }),
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
export const insertDreamSchema = createInsertSchema(dreams)
  .omit({
    id: true,
    createdAt: true,
    analysis: true,
  })
  .extend({
    // Ensure the title is at least 3 characters long
    title: z
      .string()
      .min(3, { message: "Titel muss mindestens 3 Zeichen lang sein" }),
    // Ensure the content is at least 10 characters long
    content: z
      .string()
      .min(10, { message: "Trauminhalt muss mindestens 10 Zeichen lang sein" }),
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
export const insertDreamAnalysisSchema = createInsertSchema(dreamAnalysis).omit(
  {
    id: true,
  },
);

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
  energyLevel?: number; // Energielevel am Tag, 1-10
  stressLevel?: number; // Stresslevel am Tag, 1-10
  exerciseMinutes?: number; // Sportliche Aktivität in Minuten
  caffeineIntake?: number; // Koffeinkonsum (Tassen/Gläser)
  screenTimeBeforeBed?: number; // Bildschirmzeit vor dem Schlafengehen in Minuten
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
    }[];
  };
  recommendations: {
    general: string[]; // Allgemeine Empfehlungen
    actionable: string[]; // Konkrete Handlungsvorschläge
  };
}

// Achievement-System und Gamification

export const achievementCategories = [
  "beginner", // Anfänger-Erfolge
  "consistency", // Konsequenz-Erfolge
  "exploration", // Erkundungs-Erfolge
  "insight", // Einsicht-Erfolge
  "mastery", // Meister-Erfolge
  "special", // Besondere Erfolge
] as const;

export type AchievementCategory = (typeof achievementCategories)[number];

export const achievementDifficulties = [
  "bronze", // Leicht zu erreichen
  "silver", // Mäßig schwer zu erreichen
  "gold", // Schwer zu erreichen
  "platinum", // Sehr schwer zu erreichen
] as const;

export type AchievementDifficulty = (typeof achievementDifficulties)[number];

// Achievement-Definitionen
export const achievements = pgTable("achievements", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description").notNull(),
  category: text("category").notNull().$type<AchievementCategory>(),
  difficulty: text("difficulty").notNull().$type<AchievementDifficulty>(),
  iconName: text("icon_name").notNull(),
  criteria: json("criteria").notNull().$type<AchievementCriteria>(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Benutzer-Achievements
export const userAchievements = pgTable("user_achievements", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  achievementId: integer("achievement_id").notNull(),
  unlockedAt: timestamp("unlocked_at").notNull().defaultNow(),
  progress: json("progress").notNull().$type<AchievementProgress>(),
  isCompleted: boolean("is_completed").notNull().default(false),
});

// Achievement-Schema für's Einfügen
export const insertAchievementSchema = createInsertSchema(achievements).omit({
  id: true,
  createdAt: true,
});

// Benutzer-Achievement-Schema für's Einfügen
export const insertUserAchievementSchema = createInsertSchema(
  userAchievements,
).omit({
  id: true,
  unlockedAt: true,
});

// Typen für Achievements
export type Achievement = typeof achievements.$inferSelect;
export type InsertAchievement = z.infer<typeof insertAchievementSchema>;

export type UserAchievement = typeof userAchievements.$inferSelect;
export type InsertUserAchievement = z.infer<typeof insertUserAchievementSchema>;

// Kriterien für Achievements
export interface AchievementCriteria {
  type:
    | "dreamCount" // Basierend auf Anzahl der Träume
    | "streakDays" // Basierend auf Anzahl aufeinanderfolgender Tage
    | "tagCount" // Basierend auf Anzahl verwendeter Tags
    | "imageCount" // Basierend auf Anzahl hochgeladener Bilder
    | "analysisCount" // Basierend auf Anzahl der Analysen
    | "patternCount" // Basierend auf Anzahl der Musteranalysen
    | "moodTracking" // Basierend auf Stimmungstracking
    | "dreamLength" // Basierend auf Länge der Traumeinträge
    | "specialTag" // Basierend auf speziellen Tags
    | "combinedCriteria"; // Kombination mehrerer Kriterien
  threshold: number; // Schwellenwert für Erfüllung
  additionalParams?: Record<string, any>; // Zusätzliche Parameter für bestimmte Kriterien
}

// Fortschritt für Achievements
export interface AchievementProgress {
  currentValue: number; // Aktueller Wert
  requiredValue: number; // Erforderlicher Wert
  lastUpdated: string; // Zeitpunkt der letzten Aktualisierung
  details?: Record<string, any>; // Zusätzliche Details
}

// Achievement Notification für das Frontend
export interface AchievementNotification {
  achievementId: number;
  achievementName: string;
  achievementDescription: string;
  iconName: string;
  category: AchievementCategory;
  difficulty: AchievementDifficulty;
  timestamp: string;
}

// Journaling und Content-Rubrik Tabellen

// Content-Typen für die Content-Rubrik
export const contentTypes = [
  "article", // Artikel
  "video", // Video
  "link", // Externe Verlinkung
  "quote", // Zitat
  "image", // Bild
  "infographic", // Infografik
  "audio", // Audio/Podcast
  "exercise", // Übung
] as const;

export type ContentType = (typeof contentTypes)[number];

// Journal-Einträge
export const journalEntries = pgTable("journal_entries", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  title: text("title").notNull(),
  content: text("content").notNull(),
  mood: integer("mood"), // Stimmung (1-10)
  tags: text("tags").array(),
  isPrivate: boolean("is_private").notNull().default(true),
  imageUrl: text("image_url"), // URL zum optionalen Stimmungsbild
  includeInAnalysis: boolean("include_in_analysis").notNull().default(false), // Ob der Eintrag in die Traumanalyse einfließen soll
  date: timestamp("date").notNull().defaultNow(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
  relatedDreamIds: integer("related_dream_ids").array(), // IDs von verknüpften Träumen
});

// Insert-Schema für Journal-Einträge
export const insertJournalEntrySchema = createInsertSchema(journalEntries)
  .omit({
    id: true,
    createdAt: true,
    updatedAt: true,
  })
  .extend({
    title: z
      .string()
      .min(3, { message: "Titel muss mindestens 3 Zeichen lang sein" }),
    content: z
      .string()
      .min(10, { message: "Inhalt muss mindestens 10 Zeichen lang sein" }),
    mood: z.number().min(1).max(10).optional(),
    tags: z.array(z.string()).optional(),
    isPrivate: z.boolean().default(true),
    imageUrl: z.string().optional(),
    includeInAnalysis: z.boolean().default(false),
    date: z.string().or(z.date()),
    relatedDreamIds: z.array(z.number()).optional(),
  });

// Content-Einträge für die Content-Rubrik "Was ist Träumen?"
export const dreamContentEntries = pgTable("dream_content_entries", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  summary: text("summary").notNull(),
  content: text("content").notNull(),
  contentType: varchar("content_type", { length: 20 })
    .notNull()
    .$type<ContentType>(),
  url: text("url"), // URL für externes Material (Videos, Links)
  imageUrl: text("image_url"), // Bild-URL
  tags: text("tags").array(),
  authorId: integer("author_id"), // Null bedeutet KI-generierter Inhalt
  isFeatured: boolean("is_featured").notNull().default(false), // Hervorgehobener Inhalt
  isPublished: boolean("is_published").notNull().default(false), // Veröffentlicht ja/nein
  viewCount: integer("view_count").notNull().default(0), // Anzahl der Aufrufe
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
  relatedContentIds: integer("related_content_ids").array(), // Verwandte Inhalte
});

// Insert-Schema für Content-Einträge
export const insertDreamContentEntrySchema = createInsertSchema(
  dreamContentEntries,
)
  .omit({
    id: true,
    viewCount: true,
    createdAt: true,
    updatedAt: true,
  })
  .extend({
    title: z
      .string()
      .min(3, { message: "Titel muss mindestens 3 Zeichen lang sein" }),
    summary: z.string().min(10, {
      message: "Zusammenfassung muss mindestens 10 Zeichen lang sein",
    }),
    content: z
      .string()
      .min(50, { message: "Inhalt muss mindestens 50 Zeichen lang sein" }),
    contentType: z.enum(contentTypes),
    url: z.string().url().optional(),
    imageUrl: z.string().optional(),
    tags: z.array(z.string()).optional(),
    authorId: z.number().optional(),
    isFeatured: z.boolean().default(false),
    isPublished: z.boolean().default(false),
    relatedContentIds: z.array(z.number()).optional(),
  });

// Kommentare für Content-Einträge
export const contentComments = pgTable("content_comments", {
  id: serial("id").primaryKey(),
  contentId: integer("content_id").notNull(),
  userId: integer("user_id").notNull(),
  text: text("text").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// Insert-Schema für Kommentare
export const insertContentCommentSchema = createInsertSchema(contentComments)
  .omit({
    id: true,
    createdAt: true,
    updatedAt: true,
  })
  .extend({
    text: z
      .string()
      .min(3, { message: "Kommentar muss mindestens 3 Zeichen lang sein" }),
  });

// Typ-Definitionen
export type JournalEntry = typeof journalEntries.$inferSelect;
export type InsertJournalEntry = z.infer<typeof insertJournalEntrySchema>;

export type DreamContentEntry = typeof dreamContentEntries.$inferSelect;
export type InsertDreamContentEntry = z.infer<
  typeof insertDreamContentEntrySchema
>;

export type ContentComment = typeof contentComments.$inferSelect;
export type InsertContentComment = z.infer<typeof insertContentCommentSchema>;

// Kulturelle Traumsymbol-Bibliothek

// Kultur-Tabelle für die Verwaltung verschiedener kultureller Kontexte
export const cultures = pgTable("cultures", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(), // Name der Kultur (z.B. "Westlich", "Chinesisch", "Indianisch")
  description: text("description").notNull(), // Beschreibung der Kultur und ihrer Traumsymbolik
  imageUrl: text("image_url"), // Optionales repräsentatives Bild
  region: text("region"), // Geografische Region
  historicalContext: text("historical_context"), // Historischer Kontext
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// Insert-Schema für Kulturen
export const insertCultureSchema = createInsertSchema(cultures)
  .omit({
    id: true,
    createdAt: true,
    updatedAt: true,
  })
  .extend({
    name: z
      .string()
      .min(2, { message: "Name muss mindestens 2 Zeichen lang sein" }),
    description: z.string().min(10, {
      message: "Beschreibung muss mindestens 10 Zeichen lang sein",
    }),
  });

// Traumsymbol-Tabelle
export const dreamSymbols = pgTable("dream_symbols", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(), // Name des Symbols (z.B. "Wasser", "Schlange", "Fliegen")
  generalMeaning: text("general_meaning").notNull(), // Allgemeine Symbolbedeutung
  imageUrl: text("image_url"), // Optionales Bild
  category: text("category").notNull(), // Kategorie (z.B. "Natur", "Tiere", "Objekte", "Handlungen")
  tags: text("tags").array(), // Tags für bessere Suche
  popularity: integer("popularity").notNull().default(0), // Beliebtheit/Häufigkeit in Träumen (0-100)
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// Insert-Schema für Traumsymbole
export const insertDreamSymbolSchema = createInsertSchema(dreamSymbols)
  .omit({
    id: true,
    createdAt: true,
    updatedAt: true,
  })
  .extend({
    name: z
      .string()
      .min(2, { message: "Name muss mindestens 2 Zeichen lang sein" }),
    generalMeaning: z
      .string()
      .min(10, { message: "Bedeutung muss mindestens 10 Zeichen lang sein" }),
    category: z.string().min(2, { message: "Kategorie muss angegeben werden" }),
    tags: z.array(z.string()).optional(),
    popularity: z.number().min(0).max(100).default(50),
  });

// Kulturspezifische Symbolinterpretationen
export const culturalSymbolInterpretations = pgTable(
  "cultural_symbol_interpretations",
  {
    id: serial("id").primaryKey(),
    symbolId: integer("symbol_id").notNull(), // Referenz zum Traumsymbol
    cultureId: integer("culture_id").notNull(), // Referenz zur Kultur
    interpretation: text("interpretation").notNull(), // Kulturspezifische Interpretation
    examples: text("examples"), // Beispiele aus dieser Kultur
    literaryReferences: text("literary_references"), // Literarische Quellen
    additionalInfo: text("additional_info"), // Zusätzliche Informationen
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
);

// Insert-Schema für kulturelle Symbolinterpretationen
export const insertCulturalInterpretationSchema = createInsertSchema(
  culturalSymbolInterpretations,
)
  .omit({
    id: true,
    createdAt: true,
    updatedAt: true,
  })
  .extend({
    interpretation: z.string().min(10, {
      message: "Interpretation muss mindestens 10 Zeichen lang sein",
    }),
  });

// Symbol-Vergleiche (zum Vergleichen desselben Symbols in verschiedenen Kulturen)
export const symbolComparisons = pgTable("symbol_comparisons", {
  id: serial("id").primaryKey(),
  symbolId: integer("symbol_id").notNull(), // Referenz zum verglichenen Symbol
  title: text("title").notNull(), // Titel des Vergleichs
  content: text("content").notNull(), // Inhalt des Vergleichs
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// Insert-Schema für Symbol-Vergleiche
export const insertSymbolComparisonSchema = createInsertSchema(
  symbolComparisons,
)
  .omit({
    id: true,
    createdAt: true,
    updatedAt: true,
  })
  .extend({
    title: z
      .string()
      .min(3, { message: "Titel muss mindestens 3 Zeichen lang sein" }),
    content: z
      .string()
      .min(50, { message: "Inhalt muss mindestens 50 Zeichen lang sein" }),
  });

// Benutzer-Favoriten für Traumsymbole
export const userSymbolFavorites = pgTable("user_symbol_favorites", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  symbolId: integer("symbol_id").notNull(),
  notes: text("notes"), // Persönliche Notizen des Benutzers zu diesem Symbol
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Insert-Schema für Benutzer-Favoriten
export const insertUserSymbolFavoriteSchema = createInsertSchema(
  userSymbolFavorites,
).omit({
  id: true,
  createdAt: true,
});

// Typ-Definitionen für die Traumsymbol-Bibliothek
export type Culture = typeof cultures.$inferSelect;
export type InsertCulture = z.infer<typeof insertCultureSchema>;

export type DreamSymbol = typeof dreamSymbols.$inferSelect;
export type InsertDreamSymbol = z.infer<typeof insertDreamSymbolSchema>;

export type CulturalSymbolInterpretation =
  typeof culturalSymbolInterpretations.$inferSelect;
export type InsertCulturalSymbolInterpretation = z.infer<
  typeof insertCulturalInterpretationSchema
>;

export type SymbolComparison = typeof symbolComparisons.$inferSelect;
export type InsertSymbolComparison = z.infer<
  typeof insertSymbolComparisonSchema
>;

export type UserSymbolFavorite = typeof userSymbolFavorites.$inferSelect;
export type InsertUserSymbolFavorite = z.infer<
  typeof insertUserSymbolFavoriteSchema
>;

// Collaborative Dream Interpretation Community

// Visibility options for shared dreams
export const dreamVisibilityOptions = [
  "private", // Only visible to the owner
  "community", // Visible to all authenticated users
  "public", // Visible to everyone, even without login
  "selected", // Visible only to selected users
] as const;

export type DreamVisibility = (typeof dreamVisibilityOptions)[number];

// Shared dream settings table
export const sharedDreams = pgTable("shared_dreams", {
  id: serial("id").primaryKey(),
  dreamId: integer("dream_id").notNull(), // Reference to the original dream
  userId: integer("user_id").notNull(), // The owner/creator of the dream
  title: text("title").notNull(), // Can be different from original dream title
  content: text("content").notNull(), // The dream content
  anonymousShare: boolean("anonymous_share").notNull().default(false), // Whether to hide the author's identity
  visibility: text("visibility")
    .notNull()
    .$type<DreamVisibility>()
    .default("community"),
  allowComments: boolean("allow_comments").notNull().default(true),
  allowInterpretations: boolean("allow_interpretations")
    .notNull()
    .default(true),
  includeAiAnalysis: boolean("include_ai_analysis").notNull().default(false), // Whether to show AI analysis
  featuredInCommunity: boolean("featured_in_community")
    .notNull()
    .default(false), // Admin can feature dreams
  viewCount: integer("view_count").notNull().default(0),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
  tags: text("tags").array(),
  imageUrl: text("image_url"), // Optional dream image
});

// Insert schema for shared dreams
export const insertSharedDreamSchema = createInsertSchema(sharedDreams)
  .omit({
    id: true,
    viewCount: true,
    createdAt: true,
    updatedAt: true,
    featuredInCommunity: true,
  })
  .extend({
    title: z
      .string()
      .min(3, { message: "Titel muss mindestens 3 Zeichen lang sein" }),
    content: z
      .string()
      .min(10, { message: "Inhalt muss mindestens 10 Zeichen lang sein" }),
    visibility: z.enum(dreamVisibilityOptions).default("community"),
    tags: z.array(z.string()).optional(),
  });

// Dream comments
export const dreamComments = pgTable("dream_comments", {
  id: serial("id").primaryKey(),
  sharedDreamId: integer("shared_dream_id").notNull(),
  userId: integer("user_id").notNull(),
  content: text("content").notNull(),
  isInterpretation: boolean("is_interpretation").notNull().default(false), // Whether this is an interpretation
  likes: integer("likes").notNull().default(0),
  parentCommentId: integer("parent_comment_id"), // For threaded replies
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// Insert schema for dream comments
export const insertDreamCommentSchema = createInsertSchema(dreamComments)
  .omit({
    id: true,
    likes: true,
    createdAt: true,
    updatedAt: true,
  })
  .extend({
    content: z
      .string()
      .min(3, { message: "Kommentar muss mindestens 3 Zeichen lang sein" }),
    isInterpretation: z.boolean().default(false),
    parentCommentId: z.number().optional(),
  });

// Comment likes from users
export const commentLikes = pgTable("comment_likes", {
  id: serial("id").primaryKey(),
  commentId: integer("comment_id").notNull(),
  userId: integer("user_id").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Insert schema for comment likes
export const insertCommentLikeSchema = createInsertSchema(commentLikes).omit({
  id: true,
  createdAt: true,
});

// Dream interpretation challenges (for community engagement)
export const dreamChallenges = pgTable("dream_challenges", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  startDate: timestamp("start_date").notNull(),
  endDate: timestamp("end_date").notNull(),
  isActive: boolean("is_active").notNull().default(true),
  createdBy: integer("created_by").notNull(), // Admin or moderator who created the challenge
  prizes: text("prizes"), // Description of prizes if any
  rules: text("rules").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// Insert schema for dream challenges
export const insertDreamChallengeSchema = createInsertSchema(dreamChallenges)
  .omit({
    id: true,
    createdAt: true,
    updatedAt: true,
  })
  .extend({
    title: z
      .string()
      .min(3, { message: "Titel muss mindestens 3 Zeichen lang sein" }),
    description: z.string().min(10, {
      message: "Beschreibung muss mindestens 10 Zeichen lang sein",
    }),
    startDate: z.string().or(z.date()),
    endDate: z.string().or(z.date()),
    rules: z
      .string()
      .min(10, { message: "Regeln müssen mindestens 10 Zeichen lang sein" }),
  });

// Challenge submissions (dreams submitted to challenges)
export const challengeSubmissions = pgTable("challenge_submissions", {
  id: serial("id").primaryKey(),
  challengeId: integer("challenge_id").notNull(),
  sharedDreamId: integer("shared_dream_id").notNull(),
  userId: integer("user_id").notNull(),
  submissionDate: timestamp("submission_date").notNull().defaultNow(),
  status: text("status").notNull().default("pending"), // pending, approved, rejected
  notes: text("notes"), // Admin notes about the submission
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Insert schema for challenge submissions
export const insertChallengeSubmissionSchema = createInsertSchema(
  challengeSubmissions,
)
  .omit({
    id: true,
    submissionDate: true,
    createdAt: true,
  })
  .extend({
    status: z.string().default("pending"),
    notes: z.string().optional(),
  });

// Export types for collaborative dream features
export type SharedDream = typeof sharedDreams.$inferSelect;
export type InsertSharedDream = z.infer<typeof insertSharedDreamSchema>;

export type DreamComment = typeof dreamComments.$inferSelect;
export type InsertDreamComment = z.infer<typeof insertDreamCommentSchema>;

export type CommentLike = typeof commentLikes.$inferSelect;
export type InsertCommentLike = z.infer<typeof insertCommentLikeSchema>;

export type DreamChallenge = typeof dreamChallenges.$inferSelect;
export type InsertDreamChallenge = z.infer<typeof insertDreamChallengeSchema>;

export type ChallengeSubmission = typeof challengeSubmissions.$inferSelect;
export type InsertChallengeSubmission = z.infer<
  typeof insertChallengeSubmissionSchema
>;

// AI Assistant Chat Features

// Conversation with AI Assistant
export const assistantConversations = pgTable("assistant_conversations", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  title: text("title").notNull().default("Neue Unterhaltung"),
  summary: text("summary"), // AI-generated summary of the conversation
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
  isArchived: boolean("is_archived").notNull().default(false),
});

// Insert schema for assistant conversations
export const insertAssistantConversationSchema = createInsertSchema(
  assistantConversations,
)
  .omit({
    id: true,
    createdAt: true,
    updatedAt: true,
    summary: true,
  })
  .extend({
    title: z.string().default("Neue Unterhaltung"),
  });

// Messages in a conversation
export const assistantMessages = pgTable("assistant_messages", {
  id: serial("id").primaryKey(),
  conversationId: integer("conversation_id").notNull(),
  content: text("content").notNull(),
  role: text("role").notNull(), // "user" or "assistant"
  timestamp: timestamp("timestamp").notNull().defaultNow(),
  relatedDreamId: integer("related_dream_id"), // Optional reference to a dream
  relatedJournalId: integer("related_journal_id"), // Optional reference to a journal entry
  metadata: json("metadata"), // Additional info like references, sources, etc.
});

// Insert schema for assistant messages
export const insertAssistantMessageSchema = createInsertSchema(
  assistantMessages,
)
  .omit({
    id: true,
    timestamp: true,
  })
  .extend({
    content: z.string().min(1, { message: "Nachricht darf nicht leer sein" }),
    role: z.enum(["user", "assistant"]),
    relatedDreamId: z.number().optional(),
    relatedJournalId: z.number().optional(),
    metadata: z.any().optional(),
  });

// Assistant conversation types
export type AssistantConversation = typeof assistantConversations.$inferSelect;
export type InsertAssistantConversation = z.infer<
  typeof insertAssistantConversationSchema
>;

// Assistant message types
export type AssistantMessage = typeof assistantMessages.$inferSelect;
export type InsertAssistantMessage = z.infer<
  typeof insertAssistantMessageSchema
>;

// Interfaces for message interaction
export interface ChatRequest {
  conversationId?: number;
  message: string;
  relatedDreamId?: number;
  relatedJournalId?: number;
}

export interface ChatResponse {
  conversationId: number;
  message: AssistantMessage;
  relatedContent?: any;
}
