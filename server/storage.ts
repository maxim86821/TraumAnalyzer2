import { 
  Dream, 
  InsertDream, 
  AnalysisResponse, 
  DreamAnalysis, 
  InsertDreamAnalysis,
  Achievement,
  InsertAchievement,
  UserAchievement,
  InsertUserAchievement,
  AchievementProgress,
  JournalEntry,
  InsertJournalEntry,
  DreamContentEntry,
  InsertDreamContentEntry,
  ContentComment,
  InsertContentComment,
  Culture,
  InsertCulture,
  DreamSymbol,
  InsertDreamSymbol,
  CulturalSymbolInterpretation,
  InsertCulturalSymbolInterpretation,
  SymbolComparison,
  InsertSymbolComparison,
  UserSymbolFavorite,
  InsertUserSymbolFavorite
} from "@shared/schema";
import pg from 'pg';
import session from "express-session";
import connectPg from "connect-pg-simple";

const PostgresSessionStore = connectPg(session);

export interface IStorage {
  // Users
  getUser(id: number): Promise<any | undefined>;
  getUserByUsername(username: string): Promise<any | undefined>;
  createUser(user: any): Promise<any>;

  // Dreams
  createDream(dream: InsertDream): Promise<Dream>;
  getDreams(): Promise<Dream[]>;
  getDreamsByUserId(userId: number): Promise<Dream[]>;
  getDream(id: number): Promise<Dream | undefined>;
  updateDream(id: number, dream: Partial<InsertDream>): Promise<Dream | undefined>;
  deleteDream(id: number): Promise<boolean>;

  // Dream analysis
  saveDreamAnalysis(dreamId: number, analysis: AnalysisResponse): Promise<Dream>;
  
  // Achievements
  createAchievement(achievement: InsertAchievement): Promise<Achievement>;
  getAchievement(id: number): Promise<Achievement | undefined>;
  getAllAchievements(): Promise<Achievement[]>;
  
  // User Achievements
  createUserAchievement(userAchievement: InsertUserAchievement): Promise<UserAchievement>;
  getUserAchievements(userId: number): Promise<UserAchievement[]>;
  getUserAchievement(userId: number, achievementId: number): Promise<UserAchievement | undefined>;
  updateUserAchievementProgress(id: number, progress: AchievementProgress): Promise<UserAchievement | undefined>;
  completeUserAchievement(id: number): Promise<UserAchievement | undefined>;
  getLatestUserAchievements(userId: number, limit: number): Promise<UserAchievement[]>;

  // Journal entries
  createJournalEntry(entry: InsertJournalEntry): Promise<JournalEntry>;
  getJournalEntriesByUserId(userId: number): Promise<JournalEntry[]>;
  getJournalEntry(id: number): Promise<JournalEntry | undefined>;
  updateJournalEntry(id: number, entry: Partial<InsertJournalEntry>): Promise<JournalEntry | undefined>;
  deleteJournalEntry(id: number): Promise<boolean>;
  
  // Dream content entries for "Was ist Träumen?"
  createDreamContentEntry(entry: InsertDreamContentEntry): Promise<DreamContentEntry>;
  getDreamContentEntries(): Promise<DreamContentEntry[]>;
  getDreamContentEntry(id: number): Promise<DreamContentEntry | undefined>;
  updateDreamContentEntry(id: number, entry: Partial<InsertDreamContentEntry>): Promise<DreamContentEntry | undefined>;
  deleteDreamContentEntry(id: number): Promise<boolean>;
  getFeaturedDreamContentEntries(limit: number): Promise<DreamContentEntry[]>;
  getDreamContentEntriesByType(contentType: string): Promise<DreamContentEntry[]>;
  incrementDreamContentViewCount(id: number): Promise<DreamContentEntry | undefined>;
  
  // Content comments
  createContentComment(comment: InsertContentComment): Promise<ContentComment>;
  getContentCommentsByContentId(contentId: number): Promise<ContentComment[]>;
  deleteContentComment(id: number): Promise<boolean>;
  
  // Kulturelle Traumsymbol-Bibliothek
  
  // Kulturen
  createCulture(culture: InsertCulture): Promise<Culture>;
  getCulture(id: number): Promise<Culture | undefined>;
  getAllCultures(): Promise<Culture[]>;
  updateCulture(id: number, culture: Partial<InsertCulture>): Promise<Culture | undefined>;
  deleteCulture(id: number): Promise<boolean>;
  
  // Traumsymbole
  createDreamSymbol(symbol: InsertDreamSymbol): Promise<DreamSymbol>;
  getDreamSymbol(id: number): Promise<DreamSymbol | undefined>;
  getAllDreamSymbols(): Promise<DreamSymbol[]>;
  getDreamSymbolsByCategory(category: string): Promise<DreamSymbol[]>;
  searchDreamSymbols(query: string): Promise<DreamSymbol[]>;
  updateDreamSymbol(id: number, symbol: Partial<InsertDreamSymbol>): Promise<DreamSymbol | undefined>;
  deleteDreamSymbol(id: number): Promise<boolean>;
  
  // Kulturspezifische Interpretationen
  createCulturalInterpretation(interpretation: InsertCulturalSymbolInterpretation): Promise<CulturalSymbolInterpretation>;
  getCulturalInterpretationsBySymbolId(symbolId: number): Promise<CulturalSymbolInterpretation[]>;
  getCulturalInterpretationsByCultureId(cultureId: number): Promise<CulturalSymbolInterpretation[]>;
  getCulturalInterpretation(id: number): Promise<CulturalSymbolInterpretation | undefined>;
  updateCulturalInterpretation(id: number, interpretation: Partial<InsertCulturalSymbolInterpretation>): Promise<CulturalSymbolInterpretation | undefined>;
  deleteCulturalInterpretation(id: number): Promise<boolean>;
  
  // Symbol-Vergleiche
  createSymbolComparison(comparison: InsertSymbolComparison): Promise<SymbolComparison>;
  getSymbolComparison(id: number): Promise<SymbolComparison | undefined>;
  getSymbolComparisonsBySymbolId(symbolId: number): Promise<SymbolComparison[]>;
  updateSymbolComparison(id: number, comparison: Partial<InsertSymbolComparison>): Promise<SymbolComparison | undefined>;
  deleteSymbolComparison(id: number): Promise<boolean>;
  
  // Benutzer-Favoriten
  createUserSymbolFavorite(favorite: InsertUserSymbolFavorite): Promise<UserSymbolFavorite>;
  getUserSymbolFavoritesByUserId(userId: number): Promise<UserSymbolFavorite[]>;
  deleteUserSymbolFavorite(id: number): Promise<boolean>;
  
  // Session store
  sessionStore: session.Store;
}

export class MemStorage implements IStorage {
  private users: Map<number, any>;
  private dreams: Map<number, Dream>;
  private dreamAnalyses: Map<number, DreamAnalysis>;
  private achievements: Map<number, Achievement>;
  private userAchievements: Map<number, UserAchievement>;
  private journalEntries: Map<number, JournalEntry>;
  private dreamContentEntries: Map<number, DreamContentEntry>;
  private contentComments: Map<number, ContentComment>;
  // Traumsymbol-Bibliothek
  private cultures: Map<number, Culture>;
  private dreamSymbols: Map<number, DreamSymbol>;
  private culturalInterpretations: Map<number, CulturalSymbolInterpretation>;
  private symbolComparisons: Map<number, SymbolComparison>;
  private userSymbolFavorites: Map<number, UserSymbolFavorite>;
  // Laufende IDs
  private currentUserId: number;
  private currentDreamId: number;
  private currentAnalysisId: number;
  private currentAchievementId: number;
  private currentUserAchievementId: number;
  private currentJournalEntryId: number;
  private currentDreamContentEntryId: number;
  private currentContentCommentId: number;
  private currentCultureId: number;
  private currentDreamSymbolId: number;
  private currentCulturalInterpretationId: number;
  private currentSymbolComparisonId: number;
  private currentUserSymbolFavoriteId: number;
  public sessionStore: session.Store;

  constructor() {
    this.users = new Map();
    this.dreams = new Map();
    this.dreamAnalyses = new Map();
    this.achievements = new Map();
    this.userAchievements = new Map();
    this.journalEntries = new Map();
    this.dreamContentEntries = new Map();
    this.contentComments = new Map();
    // Traumsymbol-Bibliothek Maps initialisieren
    this.cultures = new Map();
    this.dreamSymbols = new Map();
    this.culturalInterpretations = new Map();
    this.symbolComparisons = new Map();
    this.userSymbolFavorites = new Map();
    // IDs initialisieren
    this.currentUserId = 1;
    this.currentDreamId = 1;
    this.currentAnalysisId = 1;
    this.currentAchievementId = 1;
    this.currentUserAchievementId = 1;
    this.currentJournalEntryId = 1;
    this.currentDreamContentEntryId = 1;
    this.currentContentCommentId = 1;
    this.currentCultureId = 1;
    this.currentDreamSymbolId = 1;
    this.currentCulturalInterpretationId = 1;
    this.currentSymbolComparisonId = 1;
    this.currentUserSymbolFavoriteId = 1;
    
    // In-Memory Session Store erstellen
    const MemoryStore = require('memorystore')(session);
    this.sessionStore = new MemoryStore({
      checkPeriod: 86400000 // Prune expired entries every 24h
    });
    
    // Vordefinierte Achievements anlegen
    this.initializeDefaultAchievements();
    
    // Vordefinierte Kulturen und Traumsymbole anlegen
    this.initializeDefaultCulturesAndSymbols();
  }
  
  /**
   * Initialisiert die Grunddaten für die Traumsymbol-Bibliothek
   * Fügt einige Beispielkulturen und -symbole hinzu
   */
  private async initializeDefaultCulturesAndSymbols() {
    // In MemStorage haben wir keine pool-Eigenschaft, daher prüfen wir direkt die Map
    if (this.dreamSymbols.size > 0) {
      return; // Symbole bereits vorhanden
    }
    
    try {
      // Kulturen erstellen
      const westlicheKulturResult = await this.createCulture({
        name: "Westlich",
        description: "Traumdeutung aus westlicher, psychologischer Perspektive, basierend auf Theorien von Freud, Jung und modernen Psychologen.",
        region: "Europa, Nordamerika",
        historicalContext: "Moderne westliche Traumdeutung hat ihre Wurzeln in der Psychoanalyse des 19. und 20. Jahrhunderts."
      });
      
      const ostasiatischeKulturResult = await this.createCulture({
        name: "Ostasiatisch",
        description: "Traumdeutung aus chinesischer und japanischer Tradition, stark beeinflusst von Taoismus, Buddhismus und lokalen spirituellen Praktiken.",
        region: "China, Japan, Korea",
        historicalContext: "Asiatische Traumdeutung geht Tausende von Jahren zurück und ist eng mit spirituellen Praktiken verbunden."
      });
      
      const indigeneKulturResult = await this.createCulture({
        name: "Indigene Traditionen",
        description: "Traumdeutung aus der Perspektive indigener Völker, die Träume oft als Verbindung zur spirituellen Welt und zu Ahnen sehen.",
        region: "Nordamerika, Südamerika, Australien",
        historicalContext: "Indigene Kulturen betrachten Träume seit Jahrtausenden als heilige Botschaften und spirituelle Reisen."
      });
      
      // Einige wichtige Traumsymbole erstellen
      const wasserSymbolResult = await this.createDreamSymbol({
        name: "Wasser",
        generalMeaning: "Wasser repräsentiert oft Emotionen, das Unbewusste und Lebensenergie.",
        category: "Natur",
        tags: ["Fluss", "Meer", "See", "Emotion"],
        popularity: 90
      });
      
      const fallSymbolResult = await this.createDreamSymbol({
        name: "Fallen",
        generalMeaning: "Fallen symbolisiert oft Kontrollverlust, Unsicherheit oder Ängste.",
        category: "Handlung",
        tags: ["Angst", "Kontrollverlust", "Hilflosigkeit"],
        popularity: 85
      });
      
      const fliegenSymbolResult = await this.createDreamSymbol({
        name: "Fliegen",
        generalMeaning: "Fliegen steht häufig für Freiheit, Selbstverwirklichung oder Transzendenz.",
        category: "Handlung",
        tags: ["Freiheit", "Erfolg", "Überwindung"],
        popularity: 80
      });
      
      const schlangeSymbolResult = await this.createDreamSymbol({
        name: "Schlange",
        generalMeaning: "Schlangen haben vielfältige Bedeutungen von Transformation und Heilung bis hin zu verborgenen Ängsten und Sexualität.",
        category: "Tiere",
        tags: ["Transformation", "Gefahr", "Weisheit", "Heilung"],
        popularity: 75
      });
      
      const hausSymbolResult = await this.createDreamSymbol({
        name: "Haus",
        generalMeaning: "Ein Haus repräsentiert oft das Selbst, die Psyche oder persönlichen Lebensraum.",
        category: "Objekte",
        tags: ["Selbst", "Sicherheit", "Vergangenheit"],
        popularity: 85
      });
      
      const zaehneSymbolResult = await this.createDreamSymbol({
        name: "Zähne verlieren",
        generalMeaning: "Zahnverlust im Traum kann Ängste vor Kontrollverlust, Attraktivitätsverlust oder großen Veränderungen symbolisieren.",
        category: "Körper",
        tags: ["Angst", "Verlust", "Veränderung", "Körper"],
        popularity: 70
      });
      
      // Kulturelle Interpretationen hinzufügen
      
      // Wasser-Interpretationen
      await this.createCulturalInterpretation({
        symbolId: wasserSymbolResult.id,
        cultureId: westlicheKulturResult.id,
        interpretation: "In westlicher Psychologie symbolisiert Wasser das Unbewusste. Ruhiges Wasser kann emotionale Ausgeglichenheit bedeuten, während stürmisches Wasser auf innere Unruhe hinweisen kann.",
        examples: "Träume vom Schwimmen im klaren Wasser können ein Zeichen für emotionales Wohlbefinden sein. Untergehen oder Ertrinken kann Überwältigung durch Gefühle symbolisieren.",
        literaryReferences: "C.G. Jung sah Wasser als Symbol des kollektiven Unbewussten."
      });
      
      await this.createCulturalInterpretation({
        symbolId: wasserSymbolResult.id,
        cultureId: ostasiatischeKulturResult.id,
        interpretation: "In ostasiatischen Traditionen wird Wasser mit dem Prinzip des Fließens und der Anpassungsfähigkeit verbunden. Es steht für das Yin-Element und verkörpert passive, weibliche Energie.",
        examples: "In chinesischer Traumdeutung kann klares, fließendes Wasser Wohlstand und Erfolg bedeuten, während schmutziges oder stehendes Wasser auf Probleme hinweist.",
        literaryReferences: "Im I Ging (Buch der Wandlungen) verkörpert das Wasser das Prinzip der Anpassungsfähigkeit und des stetigen Fließens."
      });
      
      await this.createCulturalInterpretation({
        symbolId: wasserSymbolResult.id,
        cultureId: indigeneKulturResult.id,
        interpretation: "In vielen indigenen Traditionen wird Wasser als heilig und reinigend angesehen. Es kann die Verbindung zur spirituellen Welt symbolisieren oder eine Transformation andeuten.",
        examples: "Bei einigen Stämmen Nordamerikas können Träume vom Überqueren eines Gewässers eine spirituelle Reise oder einen Übergangsritus symbolisieren."
      });
      
      // Weitere Symbole mit kulturellen Interpretationen
      
      // Haus-Interpretationen
      await this.createCulturalInterpretation({
        symbolId: hausSymbolResult.id,
        cultureId: westlicheKulturResult.id,
        interpretation: "In westlicher Traumdeutung repräsentiert ein Haus oft die eigene Psyche. Verschiedene Räume können verschiedene Aspekte des Selbst darstellen.",
        examples: "Der Dachboden kann für das Über-Ich stehen, der Keller für das Unbewusste oder verdrängte Erinnerungen.",
        literaryReferences: "Freud und Jung interpretierten Häuser als Repräsentationen des Selbst mit verschiedenen Ebenen des Bewusstseins."
      });
      
      // Schlange-Interpretationen
      await this.createCulturalInterpretation({
        symbolId: schlangeSymbolResult.id,
        cultureId: westlicheKulturResult.id,
        interpretation: "In westlicher Psychologie wird die Schlange oft mit verborgenen Ängsten, Sexualität oder Transformation assoziiert.",
        examples: "Eine häutende Schlange kann Erneuerung symbolisieren, während eine beißende Schlange auf unterdrückte Ängste hindeuten kann.",
        literaryReferences: "Freud sah in der Schlange ein phallisches Symbol; Jung betrachtete sie als Archetyp der Weisheit und Transformation."
      });
      
      await this.createCulturalInterpretation({
        symbolId: schlangeSymbolResult.id,
        cultureId: ostasiatischeKulturResult.id,
        interpretation: "In ostasiatischen Kulturen wird die Schlange oft mit Weisheit, Glück und Langlebigkeit assoziiert. Der Drache, eine mythologische Schlange, symbolisiert Macht und Glück.",
        examples: "In chinesischer Traumdeutung kann eine weiße Schlange Glück und Erfolg bedeuten."
      });
      
      // Symbol-Vergleiche erstellen
      await this.createSymbolComparison({
        symbolId: wasserSymbolResult.id,
        title: "Wasser in verschiedenen Kulturen",
        content: "Das Wassersymbol zeigt faszinierende kulturelle Unterschiede: Während westliche Interpretationen Wasser mit dem Unbewussten verbinden, betonen ostasiatische Traditionen das Fließen und den Kreislauf des Lebens. Indigene Kulturen sehen Wasser oft als heilig und als Verbindung zur spirituellen Welt. Gemeinsam ist allen Interpretationen die Verbindung zu Emotionen und Transformation. Diese unterschiedlichen Betrachtungen zeigen, wie kulturelle Hintergründe unsere Traumsymbolik prägen."
      });
      
      await this.createSymbolComparison({
        symbolId: schlangeSymbolResult.id,
        title: "Die Schlange als universelles Symbol",
        content: "Die Schlange ist eines der ältesten und universellsten Traumsymbole mit stark variierenden Bedeutungen: In westlichen Interpretationen oft mit Gefahr, verborgenen Ängsten oder Sexualität verbunden; in ostasiatischen Kulturen ein Symbol für Weisheit, Glück und Langlebigkeit; in indigenen Traditionen häufig ein spiritueller Bote oder Heilsymbol. Die starken Kontraste zeigen, wie kulturelle Erzählungen und Mythen unsere Traumdeutung prägen, während die transformative Natur der Schlange (Häutung) kulturübergreifend erkannt wird."
      });
      
      console.log("Default cultures and dream symbols created");
    } catch (error) {
      console.error('Error creating default cultures and symbols:', error);
    }
  }
  
  /**
   * Erstellt vordefinierte Achievements für die Anwendung
   * Diese werden bei der Initialisierung des Speichers angelegt
   */
  private initializeDefaultAchievements() {
    // Beginner Achievements
    this.createAchievement({
      name: "Traumfänger",
      description: "Zeichne deinen ersten Traum auf",
      category: "beginner" as any,
      difficulty: "bronze" as any,
      iconName: "moon",
      criteria: {
        type: "dreamCount" as any,
        threshold: 1
      } as any
    });
    
    this.createAchievement({
      name: "Traumtagebuch-Starter",
      description: "Zeichne 5 Träume auf",
      category: "beginner" as any,
      difficulty: "bronze" as any,
      iconName: "book",
      criteria: {
        type: "dreamCount" as any,
        threshold: 5
      } as any
    });
    
    // Consistency Achievements
    this.createAchievement({
      name: "Traumkonstanz",
      description: "Zeichne Träume an 3 aufeinanderfolgenden Tagen auf",
      category: "consistency" as any,
      difficulty: "silver" as any,
      iconName: "calendar-check",
      criteria: {
        type: "streakDays" as any,
        threshold: 3
      } as any
    });
    
    this.createAchievement({
      name: "Traum-Enthusiast",
      description: "Zeichne Träume an 7 aufeinanderfolgenden Tagen auf",
      category: "consistency" as any,
      difficulty: "gold" as any,
      iconName: "award",
      criteria: {
        type: "streakDays" as any,
        threshold: 7
      } as any
    });
    
    // Exploration Achievements
    this.createAchievement({
      name: "Traumkategorisierer",
      description: "Verwende 5 verschiedene Tags in deinen Träumen",
      category: "exploration" as any,
      difficulty: "silver" as any,
      iconName: "tags",
      criteria: {
        type: "tagCount" as any,
        threshold: 5
      } as any
    });
    
    this.createAchievement({
      name: "Bildliche Erinnerung",
      description: "Füge 3 Bildern zu deinen Traumeinträgen hinzu",
      category: "exploration" as any,
      difficulty: "bronze" as any,
      iconName: "image",
      criteria: {
        type: "imageCount" as any,
        threshold: 3
      } as any
    });
    
    // Insight Achievements
    this.createAchievement({
      name: "Selbstreflexion",
      description: "Verfolge deine Stimmung in 5 Traumeinträgen",
      category: "insight" as any,
      difficulty: "bronze" as any,
      iconName: "smile",
      criteria: {
        type: "moodTracking" as any,
        threshold: 5
      } as any
    });
    
    this.createAchievement({
      name: "Traumdeuter",
      description: "Analysiere 3 deiner Träume mit KI",
      category: "insight" as any,
      difficulty: "silver" as any,
      iconName: "brain",
      criteria: {
        type: "analysisCount" as any,
        threshold: 3
      } as any
    });
    
    // Mastery Achievements
    this.createAchievement({
      name: "Traummeister",
      description: "Zeichne 30 Träume auf",
      category: "mastery" as any,
      difficulty: "gold" as any,
      iconName: "trophy",
      criteria: {
        type: "dreamCount" as any,
        threshold: 30
      } as any
    });
    
    this.createAchievement({
      name: "Detaillierter Träumer",
      description: "Schreibe 5 ausführliche Traumeinträge (mindestens 200 Zeichen)",
      category: "mastery" as any,
      difficulty: "silver" as any,
      iconName: "file-text",
      criteria: {
        type: "dreamLength" as any,
        threshold: 5,
        additionalParams: {
          minLength: 200
        }
      } as any
    });
  }

  // User methods
  async getUser(id: number): Promise<any | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<any | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(user: any): Promise<any> {
    const id = this.currentUserId++;
    const newUser = { ...user, id };
    this.users.set(id, newUser);
    return newUser;
  }

  // Dream methods
  async createDream(dream: InsertDream): Promise<Dream> {
    const id = this.currentDreamId++;
    const createdAt = new Date();
    
    const newDream: Dream = {
      id,
      userId: dream.userId || null,
      title: dream.title,
      content: dream.content,
      imageUrl: dream.imageUrl || null,
      date: new Date(dream.date),
      createdAt,
      analysis: null,
      tags: dream.tags || null,
      moodBeforeSleep: dream.moodBeforeSleep || null,
      moodAfterWakeup: dream.moodAfterWakeup || null,
      moodNotes: dream.moodNotes || null
    };
    
    this.dreams.set(id, newDream);
    return newDream;
  }

  async getDreams(): Promise<Dream[]> {
    // Return dreams in reverse chronological order (newest first)
    return Array.from(this.dreams.values()).sort((a, b) => 
      b.date.getTime() - a.date.getTime()
    );
  }

  async getDream(id: number): Promise<Dream | undefined> {
    return this.dreams.get(id);
  }

  async updateDream(id: number, dreamUpdate: Partial<InsertDream>): Promise<Dream | undefined> {
    const dream = this.dreams.get(id);
    if (!dream) {
      return undefined;
    }

    const updatedDream: Dream = {
      ...dream,
      ...dreamUpdate,
      // Ensure date is a Date object
      date: dreamUpdate.date ? new Date(dreamUpdate.date) : dream.date
    };

    this.dreams.set(id, updatedDream);
    return updatedDream;
  }

  async deleteDream(id: number): Promise<boolean> {
    return this.dreams.delete(id);
  }

  // Dream analysis methods
  async saveDreamAnalysis(dreamId: number, analysis: AnalysisResponse): Promise<Dream> {
    // First, check if dream exists
    const dream = this.dreams.get(dreamId);
    if (!dream) {
      throw new Error(`Dream with ID ${dreamId} not found`);
    }

    // Store the analysis JSON string in the dream record
    const analysisString = JSON.stringify(analysis);
    const updatedDream: Dream = {
      ...dream,
      analysis: analysisString
    };

    this.dreams.set(dreamId, updatedDream);
    return updatedDream;
  }
  
  // Get dreams by user ID
  async getDreamsByUserId(userId: number): Promise<Dream[]> {
    return Array.from(this.dreams.values())
      .filter(dream => dream.userId === userId)
      .sort((a, b) => b.date.getTime() - a.date.getTime());
  }
  
  // Achievement methods
  async createAchievement(achievement: InsertAchievement): Promise<Achievement> {
    const id = this.currentAchievementId++;
    const createdAt = new Date();
    
    const newAchievement: Achievement = {
      id,
      name: achievement.name,
      description: achievement.description,
      category: achievement.category as any, // Type-Assertion, da wir die Validierung bereits im Schema haben
      difficulty: achievement.difficulty as any, // Type-Assertion, da wir die Validierung bereits im Schema haben
      iconName: achievement.iconName,
      criteria: achievement.criteria as any, // Type-Assertion, da wir die Validierung bereits im Schema haben
      createdAt
    };
    
    this.achievements.set(id, newAchievement);
    return newAchievement;
  }
  
  async getAchievement(id: number): Promise<Achievement | undefined> {
    return this.achievements.get(id);
  }
  
  async getAllAchievements(): Promise<Achievement[]> {
    return Array.from(this.achievements.values());
  }
  
  // User Achievement methods
  async createUserAchievement(userAchievement: InsertUserAchievement): Promise<UserAchievement> {
    const id = this.currentUserAchievementId++;
    const unlockedAt = new Date();
    
    const newUserAchievement: UserAchievement = {
      id,
      userId: userAchievement.userId,
      achievementId: userAchievement.achievementId,
      progress: userAchievement.progress as any, // Type-Assertion, da wir die Validierung bereits im Schema haben
      isCompleted: userAchievement.isCompleted || false,
      unlockedAt
    };
    
    this.userAchievements.set(id, newUserAchievement);
    return newUserAchievement;
  }
  
  async getUserAchievements(userId: number): Promise<UserAchievement[]> {
    return Array.from(this.userAchievements.values())
      .filter(ua => ua.userId === userId)
      .sort((a, b) => b.unlockedAt.getTime() - a.unlockedAt.getTime());
  }
  
  async getUserAchievement(userId: number, achievementId: number): Promise<UserAchievement | undefined> {
    return Array.from(this.userAchievements.values())
      .find(ua => ua.userId === userId && ua.achievementId === achievementId);
  }
  
  async updateUserAchievementProgress(id: number, progress: AchievementProgress): Promise<UserAchievement | undefined> {
    const userAchievement = this.userAchievements.get(id);
    if (!userAchievement) {
      return undefined;
    }
    
    const updatedUserAchievement: UserAchievement = {
      ...userAchievement,
      progress
    };
    
    // Überprüfen, ob das Achievement abgeschlossen ist
    if (progress.currentValue >= progress.requiredValue && !userAchievement.isCompleted) {
      updatedUserAchievement.isCompleted = true;
    }
    
    this.userAchievements.set(id, updatedUserAchievement);
    return updatedUserAchievement;
  }
  
  async completeUserAchievement(id: number): Promise<UserAchievement | undefined> {
    const userAchievement = this.userAchievements.get(id);
    if (!userAchievement) {
      return undefined;
    }
    
    const updatedUserAchievement: UserAchievement = {
      ...userAchievement,
      isCompleted: true
    };
    
    this.userAchievements.set(id, updatedUserAchievement);
    return updatedUserAchievement;
  }
  
  async getLatestUserAchievements(userId: number, limit: number): Promise<UserAchievement[]> {
    return Array.from(this.userAchievements.values())
      .filter(ua => ua.userId === userId && ua.isCompleted)
      .sort((a, b) => b.unlockedAt.getTime() - a.unlockedAt.getTime())
      .slice(0, limit);
  }
  
  // Journal entry methods
  async createJournalEntry(entry: InsertJournalEntry): Promise<JournalEntry> {
    const id = this.currentJournalEntryId++;
    const createdAt = new Date();
    const date = entry.date ? new Date(entry.date) : new Date();
    
    const newEntry: JournalEntry = {
      id,
      userId: entry.userId,
      title: entry.title,
      content: entry.content,
      mood: entry.mood || null,
      tags: entry.tags || null,
      isPrivate: entry.isPrivate || true,
      imageUrl: entry.imageUrl || null,
      includeInAnalysis: entry.includeInAnalysis || false,
      date,
      createdAt,
      updatedAt: createdAt,
      relatedDreamIds: entry.relatedDreamIds || null
    };
    
    this.journalEntries.set(id, newEntry);
    return newEntry;
  }
  
  async getJournalEntriesByUserId(userId: number): Promise<JournalEntry[]> {
    return Array.from(this.journalEntries.values())
      .filter(entry => entry.userId === userId)
      .sort((a, b) => b.date.getTime() - a.date.getTime());
  }
  
  async getJournalEntry(id: number): Promise<JournalEntry | undefined> {
    return this.journalEntries.get(id);
  }
  
  async updateJournalEntry(id: number, entryUpdate: Partial<InsertJournalEntry>): Promise<JournalEntry | undefined> {
    const entry = this.journalEntries.get(id);
    if (!entry) {
      return undefined;
    }
    
    const updatedEntry: JournalEntry = {
      ...entry,
      ...entryUpdate,
      // Ensure date is a Date object
      date: entryUpdate.date ? new Date(entryUpdate.date) : entry.date,
      updatedAt: new Date()
    };
    
    this.journalEntries.set(id, updatedEntry);
    return updatedEntry;
  }
  
  async deleteJournalEntry(id: number): Promise<boolean> {
    return this.journalEntries.delete(id);
  }
  
  // Dream content entry methods
  async createDreamContentEntry(entry: InsertDreamContentEntry): Promise<DreamContentEntry> {
    const id = this.currentDreamContentEntryId++;
    const createdAt = new Date();
    
    const newEntry: DreamContentEntry = {
      id,
      title: entry.title,
      summary: entry.summary,
      content: entry.content,
      contentType: entry.contentType,
      url: entry.url || null,
      imageUrl: entry.imageUrl || null,
      tags: entry.tags || null,
      authorId: entry.authorId || null,
      isFeatured: entry.isFeatured || false,
      isPublished: entry.isPublished || false,
      viewCount: 0,
      createdAt,
      updatedAt: createdAt,
      relatedContentIds: entry.relatedContentIds || null
    };
    
    this.dreamContentEntries.set(id, newEntry);
    return newEntry;
  }
  
  async getDreamContentEntries(): Promise<DreamContentEntry[]> {
    return Array.from(this.dreamContentEntries.values())
      .filter(entry => entry.isPublished)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }
  
  async getDreamContentEntry(id: number): Promise<DreamContentEntry | undefined> {
    return this.dreamContentEntries.get(id);
  }
  
  async updateDreamContentEntry(id: number, entryUpdate: Partial<InsertDreamContentEntry>): Promise<DreamContentEntry | undefined> {
    const entry = this.dreamContentEntries.get(id);
    if (!entry) {
      return undefined;
    }
    
    const updatedEntry: DreamContentEntry = {
      ...entry,
      ...entryUpdate,
      updatedAt: new Date()
    };
    
    this.dreamContentEntries.set(id, updatedEntry);
    return updatedEntry;
  }
  
  async deleteDreamContentEntry(id: number): Promise<boolean> {
    return this.dreamContentEntries.delete(id);
  }
  
  async getFeaturedDreamContentEntries(limit: number): Promise<DreamContentEntry[]> {
    return Array.from(this.dreamContentEntries.values())
      .filter(entry => entry.isPublished && entry.isFeatured)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .slice(0, limit);
  }
  
  async getDreamContentEntriesByType(contentType: string): Promise<DreamContentEntry[]> {
    return Array.from(this.dreamContentEntries.values())
      .filter(entry => entry.isPublished && entry.contentType === contentType)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }
  
  async incrementDreamContentViewCount(id: number): Promise<DreamContentEntry | undefined> {
    const entry = this.dreamContentEntries.get(id);
    if (!entry) {
      return undefined;
    }
    
    const updatedEntry: DreamContentEntry = {
      ...entry,
      viewCount: entry.viewCount + 1
    };
    
    this.dreamContentEntries.set(id, updatedEntry);
    return updatedEntry;
  }
  
  // Content comment methods
  async createContentComment(comment: InsertContentComment): Promise<ContentComment> {
    const id = this.currentContentCommentId++;
    const createdAt = new Date();
    
    const newComment: ContentComment = {
      id,
      contentId: comment.contentId,
      userId: comment.userId,
      text: comment.text,
      createdAt,
      updatedAt: createdAt
    };
    
    this.contentComments.set(id, newComment);
    return newComment;
  }
  
  async getContentCommentsByContentId(contentId: number): Promise<ContentComment[]> {
    return Array.from(this.contentComments.values())
      .filter(comment => comment.contentId === contentId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }
  
  async deleteContentComment(id: number): Promise<boolean> {
    return this.contentComments.delete(id);
  }

  // Kulturelle Traumsymbol-Bibliothek Methoden
  
  // Kultur-Methoden
  async createCulture(culture: InsertCulture): Promise<Culture> {
    const id = this.currentCultureId++;
    const createdAt = new Date();
    const updatedAt = createdAt;
    
    const newCulture: Culture = {
      id,
      name: culture.name,
      description: culture.description,
      imageUrl: culture.imageUrl || null,
      region: culture.region || null,
      historicalContext: culture.historicalContext || null,
      createdAt,
      updatedAt
    };
    
    this.cultures.set(id, newCulture);
    return newCulture;
  }
  
  async getCulture(id: number): Promise<Culture | undefined> {
    return this.cultures.get(id);
  }
  
  async getAllCultures(): Promise<Culture[]> {
    return Array.from(this.cultures.values())
      .sort((a, b) => a.name.localeCompare(b.name));
  }
  
  async updateCulture(id: number, cultureUpdate: Partial<InsertCulture>): Promise<Culture | undefined> {
    const culture = this.cultures.get(id);
    if (!culture) {
      return undefined;
    }
    
    const updatedCulture: Culture = {
      ...culture,
      ...cultureUpdate,
      updatedAt: new Date()
    };
    
    this.cultures.set(id, updatedCulture);
    return updatedCulture;
  }
  
  async deleteCulture(id: number): Promise<boolean> {
    return this.cultures.delete(id);
  }
  
  // Traumsymbol-Methoden
  async createDreamSymbol(symbol: InsertDreamSymbol): Promise<DreamSymbol> {
    const id = this.currentDreamSymbolId++;
    const createdAt = new Date();
    const updatedAt = createdAt;
    
    const newSymbol: DreamSymbol = {
      id,
      name: symbol.name,
      generalMeaning: symbol.generalMeaning,
      imageUrl: symbol.imageUrl || null,
      category: symbol.category,
      tags: symbol.tags || null,
      popularity: symbol.popularity || 50,
      createdAt,
      updatedAt
    };
    
    this.dreamSymbols.set(id, newSymbol);
    return newSymbol;
  }
  
  async getDreamSymbol(id: number): Promise<DreamSymbol | undefined> {
    return this.dreamSymbols.get(id);
  }
  
  async getAllDreamSymbols(): Promise<DreamSymbol[]> {
    return Array.from(this.dreamSymbols.values())
      .sort((a, b) => b.popularity - a.popularity);
  }
  
  async getDreamSymbolsByCategory(category: string): Promise<DreamSymbol[]> {
    return Array.from(this.dreamSymbols.values())
      .filter(symbol => symbol.category === category)
      .sort((a, b) => b.popularity - a.popularity);
  }
  
  async searchDreamSymbols(query: string): Promise<DreamSymbol[]> {
    const searchTermLower = query.toLowerCase();
    return Array.from(this.dreamSymbols.values())
      .filter(symbol => {
        // Suche im Namen des Symbols
        if (symbol.name.toLowerCase().includes(searchTermLower)) {
          return true;
        }
        
        // Suche in der Bedeutung
        if (symbol.generalMeaning.toLowerCase().includes(searchTermLower)) {
          return true;
        }
        
        // Suche in Tags
        if (symbol.tags && symbol.tags.some(tag => tag.toLowerCase().includes(searchTermLower))) {
          return true;
        }
        
        return false;
      })
      .sort((a, b) => b.popularity - a.popularity);
  }
  
  async updateDreamSymbol(id: number, symbolUpdate: Partial<InsertDreamSymbol>): Promise<DreamSymbol | undefined> {
    const symbol = this.dreamSymbols.get(id);
    if (!symbol) {
      return undefined;
    }
    
    const updatedSymbol: DreamSymbol = {
      ...symbol,
      ...symbolUpdate,
      updatedAt: new Date()
    };
    
    this.dreamSymbols.set(id, updatedSymbol);
    return updatedSymbol;
  }
  
  async deleteDreamSymbol(id: number): Promise<boolean> {
    return this.dreamSymbols.delete(id);
  }
  
  // Kulturelle Interpretations-Methoden
  async createCulturalInterpretation(interpretation: InsertCulturalSymbolInterpretation): Promise<CulturalSymbolInterpretation> {
    const id = this.currentCulturalInterpretationId++;
    const createdAt = new Date();
    const updatedAt = createdAt;
    
    const newInterpretation: CulturalSymbolInterpretation = {
      id,
      symbolId: interpretation.symbolId,
      cultureId: interpretation.cultureId,
      interpretation: interpretation.interpretation,
      examples: interpretation.examples || null,
      literaryReferences: interpretation.literaryReferences || null,
      additionalInfo: interpretation.additionalInfo || null,
      createdAt,
      updatedAt
    };
    
    this.culturalInterpretations.set(id, newInterpretation);
    return newInterpretation;
  }
  
  async getCulturalInterpretation(id: number): Promise<CulturalSymbolInterpretation | undefined> {
    return this.culturalInterpretations.get(id);
  }
  
  async getCulturalInterpretationsBySymbolId(symbolId: number): Promise<CulturalSymbolInterpretation[]> {
    return Array.from(this.culturalInterpretations.values())
      .filter(interpretation => interpretation.symbolId === symbolId);
  }
  
  async getCulturalInterpretationsByCultureId(cultureId: number): Promise<CulturalSymbolInterpretation[]> {
    return Array.from(this.culturalInterpretations.values())
      .filter(interpretation => interpretation.cultureId === cultureId);
  }
  
  async updateCulturalInterpretation(id: number, interpretationUpdate: Partial<InsertCulturalSymbolInterpretation>): Promise<CulturalSymbolInterpretation | undefined> {
    const interpretation = this.culturalInterpretations.get(id);
    if (!interpretation) {
      return undefined;
    }
    
    const updatedInterpretation: CulturalSymbolInterpretation = {
      ...interpretation,
      ...interpretationUpdate,
      updatedAt: new Date()
    };
    
    this.culturalInterpretations.set(id, updatedInterpretation);
    return updatedInterpretation;
  }
  
  async deleteCulturalInterpretation(id: number): Promise<boolean> {
    return this.culturalInterpretations.delete(id);
  }
  
  // Symbol-Vergleiche Methoden
  async createSymbolComparison(comparison: InsertSymbolComparison): Promise<SymbolComparison> {
    const id = this.currentSymbolComparisonId++;
    const createdAt = new Date();
    const updatedAt = createdAt;
    
    const newComparison: SymbolComparison = {
      id,
      symbolId: comparison.symbolId,
      title: comparison.title,
      content: comparison.content,
      createdAt,
      updatedAt
    };
    
    this.symbolComparisons.set(id, newComparison);
    return newComparison;
  }
  
  async getSymbolComparison(id: number): Promise<SymbolComparison | undefined> {
    return this.symbolComparisons.get(id);
  }
  
  async getSymbolComparisonsBySymbolId(symbolId: number): Promise<SymbolComparison[]> {
    return Array.from(this.symbolComparisons.values())
      .filter(comparison => comparison.symbolId === symbolId);
  }
  
  async updateSymbolComparison(id: number, comparisonUpdate: Partial<InsertSymbolComparison>): Promise<SymbolComparison | undefined> {
    const comparison = this.symbolComparisons.get(id);
    if (!comparison) {
      return undefined;
    }
    
    const updatedComparison: SymbolComparison = {
      ...comparison,
      ...comparisonUpdate,
      updatedAt: new Date()
    };
    
    this.symbolComparisons.set(id, updatedComparison);
    return updatedComparison;
  }
  
  async deleteSymbolComparison(id: number): Promise<boolean> {
    return this.symbolComparisons.delete(id);
  }
  
  // Benutzer-Favoriten Methoden
  async createUserSymbolFavorite(favorite: InsertUserSymbolFavorite): Promise<UserSymbolFavorite> {
    const id = this.currentUserSymbolFavoriteId++;
    const createdAt = new Date();
    
    const newFavorite: UserSymbolFavorite = {
      id,
      userId: favorite.userId,
      symbolId: favorite.symbolId,
      notes: favorite.notes || null,
      createdAt
    };
    
    this.userSymbolFavorites.set(id, newFavorite);
    return newFavorite;
  }
  
  async getUserSymbolFavoritesByUserId(userId: number): Promise<UserSymbolFavorite[]> {
    return Array.from(this.userSymbolFavorites.values())
      .filter(favorite => favorite.userId === userId);
  }
  
  async deleteUserSymbolFavorite(id: number): Promise<boolean> {
    return this.userSymbolFavorites.delete(id);
  }
}

// PostgreSQL Speicherimplementierung
export class DatabaseStorage implements IStorage {
  private pool: pg.Pool;
  public sessionStore: session.Store;
  
  constructor() {
    // Verbindung zur Datenbank herstellen
    this.pool = new pg.Pool({
      connectionString: process.env.DATABASE_URL,
    });
    
    // Session-Store initialisieren
    this.sessionStore = new PostgresSessionStore({ 
      pool: this.pool,
      createTableIfMissing: true 
    });
    
    // Tabellen initialisieren
    this.initTables().then(() => {
      console.log('Database tables initialized');
      
      // Vordefinierte Achievements anlegen
      this.initializeDefaultAchievements().then(() => {
        console.log('Default achievements created');
      }).catch(err => {
        console.error('Error creating default achievements:', err);
      });
    }).catch(err => {
      console.error('Error initializing database tables:', err);
    });
  }
  
  // Initialize database tables
  private async initTables(): Promise<void> {
    await this.pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        username VARCHAR(100) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
      
      CREATE TABLE IF NOT EXISTS dreams (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id),
        title VARCHAR(255) NOT NULL,
        content TEXT NOT NULL,
        image_url TEXT,
        date DATE NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        analysis TEXT,
        tags TEXT[],
        mood_before_sleep INTEGER,
        mood_after_wakeup INTEGER,
        mood_notes TEXT
      );
      
      CREATE TABLE IF NOT EXISTS achievements (
        id SERIAL PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        description TEXT NOT NULL,
        category VARCHAR(50) NOT NULL,
        difficulty VARCHAR(50) NOT NULL,
        icon_name VARCHAR(50) NOT NULL,
        criteria JSONB NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
      
      CREATE TABLE IF NOT EXISTS user_achievements (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) NOT NULL,
        achievement_id INTEGER REFERENCES achievements(id) NOT NULL,
        progress JSONB NOT NULL,
        is_completed BOOLEAN DEFAULT FALSE,
        unlocked_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(user_id, achievement_id)
      );
      
      -- Neue Tabellen für Journal-Einträge
      CREATE TABLE IF NOT EXISTS journal_entries (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) NOT NULL,
        title VARCHAR(255) NOT NULL,
        content TEXT NOT NULL,
        mood INTEGER,
        tags TEXT[],
        is_private BOOLEAN NOT NULL DEFAULT TRUE,
        image_url TEXT,
        include_in_analysis BOOLEAN NOT NULL DEFAULT FALSE,
        date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
        created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
        related_dream_ids INTEGER[]
      );
      
      -- Content-Einträge für "Was ist Träumen?"
      CREATE TABLE IF NOT EXISTS dream_content_entries (
        id SERIAL PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        summary TEXT NOT NULL,
        content TEXT NOT NULL,
        content_type VARCHAR(20) NOT NULL,
        url TEXT,
        image_url TEXT,
        tags TEXT[],
        author_id INTEGER REFERENCES users(id),
        is_featured BOOLEAN NOT NULL DEFAULT FALSE,
        is_published BOOLEAN NOT NULL DEFAULT FALSE,
        view_count INTEGER NOT NULL DEFAULT 0,
        created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
        related_content_ids INTEGER[]
      );
      
      -- Kommentare für Content-Einträge
      CREATE TABLE IF NOT EXISTS content_comments (
        id SERIAL PRIMARY KEY,
        content_id INTEGER REFERENCES dream_content_entries(id) NOT NULL,
        user_id INTEGER REFERENCES users(id) NOT NULL,
        text TEXT NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
      );
      
      -- Tabellen für die Traumsymbol-Bibliothek
      
      -- Kulturen
      CREATE TABLE IF NOT EXISTS cultures (
        id SERIAL PRIMARY KEY,
        name VARCHAR(100) UNIQUE NOT NULL,
        description TEXT NOT NULL,
        image_url TEXT,
        region VARCHAR(100),
        historical_context TEXT,
        created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
      );
      
      -- Traumsymbole
      CREATE TABLE IF NOT EXISTS dream_symbols (
        id SERIAL PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        general_meaning TEXT NOT NULL,
        image_url TEXT,
        category VARCHAR(50) NOT NULL,
        tags TEXT[],
        popularity INTEGER NOT NULL DEFAULT 50,
        created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
      );
      
      -- Kulturspezifische Interpretationen
      CREATE TABLE IF NOT EXISTS cultural_symbol_interpretations (
        id SERIAL PRIMARY KEY,
        symbol_id INTEGER REFERENCES dream_symbols(id) NOT NULL,
        culture_id INTEGER REFERENCES cultures(id) NOT NULL,
        interpretation TEXT NOT NULL,
        examples TEXT,
        literary_references TEXT,
        additional_info TEXT,
        created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(symbol_id, culture_id)
      );
      
      -- Symbol-Vergleiche
      CREATE TABLE IF NOT EXISTS symbol_comparisons (
        id SERIAL PRIMARY KEY,
        symbol_id INTEGER REFERENCES dream_symbols(id) NOT NULL,
        title VARCHAR(255) NOT NULL,
        content TEXT NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
      );
      
      -- Benutzer-Favoriten
      CREATE TABLE IF NOT EXISTS user_symbol_favorites (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) NOT NULL,
        symbol_id INTEGER REFERENCES dream_symbols(id) NOT NULL,
        notes TEXT,
        created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(user_id, symbol_id)
      );
    `);
  }
  
  /**
   * Erstellt vordefinierte Achievements für die Anwendung
   */
  private async initializeDefaultAchievements(): Promise<void> {
    // Prüfen, ob bereits Achievements vorhanden sind
    const result = await this.pool.query('SELECT COUNT(*) FROM achievements');
    if (parseInt(result.rows[0].count) > 0) {
      return; // Achievements bereits vorhanden
    }
    
    // Beginner Achievements
    await this.createAchievement({
      name: "Traumfänger",
      description: "Zeichne deinen ersten Traum auf",
      category: "beginner" as any,
      difficulty: "bronze" as any,
      iconName: "moon",
      criteria: {
        type: "dreamCount" as any,
        threshold: 1
      } as any
    });
    
    await this.createAchievement({
      name: "Traumtagebuch-Starter",
      description: "Zeichne 5 Träume auf",
      category: "beginner" as any,
      difficulty: "bronze" as any,
      iconName: "book",
      criteria: {
        type: "dreamCount" as any,
        threshold: 5
      } as any
    });
    
    // Consistency Achievements
    await this.createAchievement({
      name: "Traumkonstanz",
      description: "Zeichne Träume an 3 aufeinanderfolgenden Tagen auf",
      category: "consistency" as any,
      difficulty: "silver" as any,
      iconName: "calendar-check",
      criteria: {
        type: "streakDays" as any,
        threshold: 3
      } as any
    });
    
    await this.createAchievement({
      name: "Traum-Enthusiast",
      description: "Zeichne Träume an 7 aufeinanderfolgenden Tagen auf",
      category: "consistency" as any,
      difficulty: "gold" as any,
      iconName: "award",
      criteria: {
        type: "streakDays" as any,
        threshold: 7
      } as any
    });
    
    // Exploration Achievements
    await this.createAchievement({
      name: "Traumkategorisierer",
      description: "Verwende 5 verschiedene Tags in deinen Träumen",
      category: "exploration" as any,
      difficulty: "silver" as any,
      iconName: "tags",
      criteria: {
        type: "tagCount" as any,
        threshold: 5
      } as any
    });
    
    await this.createAchievement({
      name: "Bildliche Erinnerung",
      description: "Füge 3 Bildern zu deinen Traumeinträgen hinzu",
      category: "exploration" as any,
      difficulty: "bronze" as any,
      iconName: "image",
      criteria: {
        type: "imageCount" as any,
        threshold: 3
      } as any
    });
    
    // Insight Achievements
    await this.createAchievement({
      name: "Selbstreflexion",
      description: "Verfolge deine Stimmung in 5 Traumeinträgen",
      category: "insight" as any,
      difficulty: "bronze" as any,
      iconName: "smile",
      criteria: {
        type: "moodTracking" as any,
        threshold: 5
      } as any
    });
    
    await this.createAchievement({
      name: "Traumdeuter",
      description: "Analysiere 3 deiner Träume mit KI",
      category: "insight" as any,
      difficulty: "silver" as any,
      iconName: "brain",
      criteria: {
        type: "analysisCount" as any,
        threshold: 3
      } as any
    });
    
    // Mastery Achievements
    await this.createAchievement({
      name: "Traummeister",
      description: "Zeichne 30 Träume auf",
      category: "mastery" as any,
      difficulty: "gold" as any,
      iconName: "trophy",
      criteria: {
        type: "dreamCount" as any,
        threshold: 30
      } as any
    });
    
    await this.createAchievement({
      name: "Detaillierter Träumer",
      description: "Schreibe 5 ausführliche Traumeinträge (mindestens 200 Zeichen)",
      category: "mastery" as any,
      difficulty: "silver" as any,
      iconName: "file-text",
      criteria: {
        type: "dreamLength" as any,
        threshold: 5,
        additionalParams: {
          minLength: 200
        }
      } as any
    });
  }
  
  // User methods
  async getUser(id: number): Promise<any | undefined> {
    const result = await this.pool.query(
      'SELECT * FROM users WHERE id = $1',
      [id]
    );
    return result.rows[0] || undefined;
  }
  
  async getUserByUsername(username: string): Promise<any | undefined> {
    const result = await this.pool.query(
      'SELECT * FROM users WHERE username = $1',
      [username]
    );
    return result.rows[0] || undefined;
  }
  
  async createUser(user: any): Promise<any> {
    const result = await this.pool.query(
      'INSERT INTO users (username, password) VALUES ($1, $2) RETURNING *',
      [user.username, user.password]
    );
    return result.rows[0];
  }
  
  // Dream methods
  async createDream(dream: InsertDream): Promise<Dream> {
    const result = await this.pool.query(
      `INSERT INTO dreams 
        (user_id, title, content, image_url, date, tags, mood_before_sleep, mood_after_wakeup, mood_notes) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) 
       RETURNING *`,
      [
        dream.userId,
        dream.title,
        dream.content,
        dream.imageUrl || null,
        dream.date,
        dream.tags || null,
        dream.moodBeforeSleep || null,
        dream.moodAfterWakeup || null,
        dream.moodNotes || null
      ]
    );
    
    // Convert DB snake_case names to camelCase for API
    const newDream = this.transformDreamDbToApi(result.rows[0]);
    return newDream;
  }
  
  async getDreams(): Promise<Dream[]> {
    const result = await this.pool.query(
      'SELECT * FROM dreams ORDER BY date DESC'
    );
    return result.rows.map(dream => this.transformDreamDbToApi(dream));
  }
  
  async getDreamsByUserId(userId: number): Promise<Dream[]> {
    const result = await this.pool.query(
      'SELECT * FROM dreams WHERE user_id = $1 ORDER BY date DESC',
      [userId]
    );
    return result.rows.map(dream => this.transformDreamDbToApi(dream));
  }
  
  async getDream(id: number): Promise<Dream | undefined> {
    const result = await this.pool.query(
      'SELECT * FROM dreams WHERE id = $1',
      [id]
    );
    return result.rows[0] ? this.transformDreamDbToApi(result.rows[0]) : undefined;
  }
  
  async updateDream(id: number, dreamUpdate: Partial<InsertDream>): Promise<Dream | undefined> {
    // Build the SET part of the query dynamically based on the fields being updated
    const updates: string[] = [];
    const values: any[] = [];
    let paramCounter = 1;
    
    if (dreamUpdate.title !== undefined) {
      updates.push(`title = $${paramCounter++}`);
      values.push(dreamUpdate.title);
    }
    
    if (dreamUpdate.content !== undefined) {
      updates.push(`content = $${paramCounter++}`);
      values.push(dreamUpdate.content);
    }
    
    if (dreamUpdate.imageUrl !== undefined) {
      updates.push(`image_url = $${paramCounter++}`);
      values.push(dreamUpdate.imageUrl);
    }
    
    if (dreamUpdate.date !== undefined) {
      updates.push(`date = $${paramCounter++}`);
      values.push(dreamUpdate.date);
    }
    
    if (dreamUpdate.tags !== undefined) {
      updates.push(`tags = $${paramCounter++}`);
      values.push(dreamUpdate.tags);
    }
    
    if (dreamUpdate.moodBeforeSleep !== undefined) {
      updates.push(`mood_before_sleep = $${paramCounter++}`);
      values.push(dreamUpdate.moodBeforeSleep);
    }
    
    if (dreamUpdate.moodAfterWakeup !== undefined) {
      updates.push(`mood_after_wakeup = $${paramCounter++}`);
      values.push(dreamUpdate.moodAfterWakeup);
    }
    
    if (dreamUpdate.moodNotes !== undefined) {
      updates.push(`mood_notes = $${paramCounter++}`);
      values.push(dreamUpdate.moodNotes);
    }
    
    // If there's nothing to update, return the original dream
    if (updates.length === 0) {
      return this.getDream(id);
    }
    
    // Add the id parameter
    values.push(id);
    
    const result = await this.pool.query(
      `UPDATE dreams SET ${updates.join(', ')} WHERE id = $${paramCounter} RETURNING *`,
      values
    );
    
    return result.rows[0] ? this.transformDreamDbToApi(result.rows[0]) : undefined;
  }
  
  async deleteDream(id: number): Promise<boolean> {
    const result = await this.pool.query(
      'DELETE FROM dreams WHERE id = $1 RETURNING id',
      [id]
    );
    return result.rows.length > 0;
  }
  
  async saveDreamAnalysis(dreamId: number, analysis: AnalysisResponse): Promise<Dream> {
    const analysisStr = JSON.stringify(analysis);
    
    const result = await this.pool.query(
      'UPDATE dreams SET analysis = $1 WHERE id = $2 RETURNING *',
      [analysisStr, dreamId]
    );
    
    if (result.rows.length === 0) {
      throw new Error(`Dream with ID ${dreamId} not found`);
    }
    
    return this.transformDreamDbToApi(result.rows[0]);
  }
  
  // Achievement methods
  async createAchievement(achievement: InsertAchievement): Promise<Achievement> {
    const result = await this.pool.query(
      `INSERT INTO achievements 
        (name, description, category, difficulty, icon_name, criteria) 
       VALUES ($1, $2, $3, $4, $5, $6) 
       RETURNING *`,
      [
        achievement.name,
        achievement.description,
        achievement.category,
        achievement.difficulty,
        achievement.iconName,
        JSON.stringify(achievement.criteria)
      ]
    );
    
    return this.transformAchievementDbToApi(result.rows[0]);
  }
  
  async getAchievement(id: number): Promise<Achievement | undefined> {
    const result = await this.pool.query(
      'SELECT * FROM achievements WHERE id = $1',
      [id]
    );
    return result.rows[0] ? this.transformAchievementDbToApi(result.rows[0]) : undefined;
  }
  
  async getAllAchievements(): Promise<Achievement[]> {
    const result = await this.pool.query('SELECT * FROM achievements');
    return result.rows.map(achievement => this.transformAchievementDbToApi(achievement));
  }
  
  // User Achievement methods
  async createUserAchievement(userAchievement: InsertUserAchievement): Promise<UserAchievement> {
    const result = await this.pool.query(
      `INSERT INTO user_achievements 
        (user_id, achievement_id, progress, is_completed) 
       VALUES ($1, $2, $3, $4) 
       RETURNING *`,
      [
        userAchievement.userId,
        userAchievement.achievementId,
        JSON.stringify(userAchievement.progress),
        userAchievement.isCompleted || false
      ]
    );
    
    return this.transformUserAchievementDbToApi(result.rows[0]);
  }
  
  async getUserAchievements(userId: number): Promise<UserAchievement[]> {
    const result = await this.pool.query(
      'SELECT * FROM user_achievements WHERE user_id = $1 ORDER BY unlocked_at DESC',
      [userId]
    );
    return result.rows.map(ua => this.transformUserAchievementDbToApi(ua));
  }
  
  async getUserAchievement(userId: number, achievementId: number): Promise<UserAchievement | undefined> {
    const result = await this.pool.query(
      'SELECT * FROM user_achievements WHERE user_id = $1 AND achievement_id = $2',
      [userId, achievementId]
    );
    return result.rows[0] ? this.transformUserAchievementDbToApi(result.rows[0]) : undefined;
  }
  
  async updateUserAchievementProgress(id: number, progress: AchievementProgress): Promise<UserAchievement | undefined> {
    const isCompleted = progress.currentValue >= progress.requiredValue;
    
    const result = await this.pool.query(
      'UPDATE user_achievements SET progress = $1, is_completed = $2 WHERE id = $3 RETURNING *',
      [JSON.stringify(progress), isCompleted, id]
    );
    
    return result.rows[0] ? this.transformUserAchievementDbToApi(result.rows[0]) : undefined;
  }
  
  async completeUserAchievement(id: number): Promise<UserAchievement | undefined> {
    const result = await this.pool.query(
      'UPDATE user_achievements SET is_completed = true WHERE id = $1 RETURNING *',
      [id]
    );
    
    return result.rows[0] ? this.transformUserAchievementDbToApi(result.rows[0]) : undefined;
  }
  
  async getLatestUserAchievements(userId: number, limit: number): Promise<UserAchievement[]> {
    const result = await this.pool.query(
      'SELECT * FROM user_achievements WHERE user_id = $1 AND is_completed = true ORDER BY unlocked_at DESC LIMIT $2',
      [userId, limit]
    );
    return result.rows.map(ua => this.transformUserAchievementDbToApi(ua));
  }
  
  // Journal entry methods
  async createJournalEntry(entry: InsertJournalEntry): Promise<JournalEntry> {
    const result = await this.pool.query(
      `INSERT INTO journal_entries 
        (user_id, title, content, mood, tags, is_private, image_url, include_in_analysis, date, related_dream_ids) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) 
       RETURNING *`,
      [
        entry.userId,
        entry.title,
        entry.content,
        entry.mood || null,
        entry.tags || null,
        entry.isPrivate || true,
        entry.imageUrl || null,
        entry.includeInAnalysis || false,
        entry.date || new Date(),
        entry.relatedDreamIds || null
      ]
    );
    
    return this.transformJournalEntryDbToApi(result.rows[0]);
  }
  
  async getJournalEntriesByUserId(userId: number): Promise<JournalEntry[]> {
    const result = await this.pool.query(
      'SELECT * FROM journal_entries WHERE user_id = $1 ORDER BY date DESC',
      [userId]
    );
    return result.rows.map(entry => this.transformJournalEntryDbToApi(entry));
  }
  
  async getJournalEntry(id: number): Promise<JournalEntry | undefined> {
    const result = await this.pool.query(
      'SELECT * FROM journal_entries WHERE id = $1',
      [id]
    );
    return result.rows[0] ? this.transformJournalEntryDbToApi(result.rows[0]) : undefined;
  }
  
  async updateJournalEntry(id: number, entryUpdate: Partial<InsertJournalEntry>): Promise<JournalEntry | undefined> {
    // Build the SET part of the query dynamically based on the fields being updated
    const updates: string[] = [];
    const values: any[] = [];
    let paramCounter = 1;
    
    if (entryUpdate.title !== undefined) {
      updates.push(`title = $${paramCounter++}`);
      values.push(entryUpdate.title);
    }
    
    if (entryUpdate.content !== undefined) {
      updates.push(`content = $${paramCounter++}`);
      values.push(entryUpdate.content);
    }
    
    if (entryUpdate.mood !== undefined) {
      updates.push(`mood = $${paramCounter++}`);
      values.push(entryUpdate.mood);
    }
    
    if (entryUpdate.tags !== undefined) {
      updates.push(`tags = $${paramCounter++}`);
      values.push(entryUpdate.tags);
    }
    
    if (entryUpdate.isPrivate !== undefined) {
      updates.push(`is_private = $${paramCounter++}`);
      values.push(entryUpdate.isPrivate);
    }
    
    if (entryUpdate.imageUrl !== undefined) {
      updates.push(`image_url = $${paramCounter++}`);
      values.push(entryUpdate.imageUrl);
    }
    
    if (entryUpdate.includeInAnalysis !== undefined) {
      updates.push(`include_in_analysis = $${paramCounter++}`);
      values.push(entryUpdate.includeInAnalysis);
    }
    
    if (entryUpdate.date !== undefined) {
      updates.push(`date = $${paramCounter++}`);
      values.push(entryUpdate.date);
    }
    
    if (entryUpdate.relatedDreamIds !== undefined) {
      updates.push(`related_dream_ids = $${paramCounter++}`);
      values.push(entryUpdate.relatedDreamIds);
    }
    
    // Always update the updated_at timestamp
    updates.push(`updated_at = CURRENT_TIMESTAMP`);
    
    // If there's nothing to update, return the original entry
    if (updates.length === 1) { // Only the updated_at field would be updated
      return this.getJournalEntry(id);
    }
    
    // Add the id parameter
    values.push(id);
    
    const result = await this.pool.query(
      `UPDATE journal_entries SET ${updates.join(', ')} WHERE id = $${paramCounter} RETURNING *`,
      values
    );
    
    return result.rows[0] ? this.transformJournalEntryDbToApi(result.rows[0]) : undefined;
  }
  
  async deleteJournalEntry(id: number): Promise<boolean> {
    const result = await this.pool.query(
      'DELETE FROM journal_entries WHERE id = $1 RETURNING id',
      [id]
    );
    return result.rows.length > 0;
  }
  
  // Dream content entry methods
  async createDreamContentEntry(entry: InsertDreamContentEntry): Promise<DreamContentEntry> {
    const result = await this.pool.query(
      `INSERT INTO dream_content_entries 
        (title, summary, content, content_type, url, image_url, tags, author_id, is_featured, is_published) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) 
       RETURNING *`,
      [
        entry.title,
        entry.summary,
        entry.content,
        entry.contentType,
        entry.url || null,
        entry.imageUrl || null,
        entry.tags || null,
        entry.authorId || null,
        entry.isFeatured || false,
        entry.isPublished || false
      ]
    );
    
    return this.transformDreamContentEntryDbToApi(result.rows[0]);
  }
  
  async getDreamContentEntries(): Promise<DreamContentEntry[]> {
    const result = await this.pool.query(
      'SELECT * FROM dream_content_entries WHERE is_published = true ORDER BY created_at DESC'
    );
    return result.rows.map(entry => this.transformDreamContentEntryDbToApi(entry));
  }
  
  async getDreamContentEntry(id: number): Promise<DreamContentEntry | undefined> {
    const result = await this.pool.query(
      'SELECT * FROM dream_content_entries WHERE id = $1',
      [id]
    );
    return result.rows[0] ? this.transformDreamContentEntryDbToApi(result.rows[0]) : undefined;
  }
  
  async updateDreamContentEntry(id: number, entryUpdate: Partial<InsertDreamContentEntry>): Promise<DreamContentEntry | undefined> {
    const updates: string[] = [];
    const values: any[] = [];
    let paramCounter = 1;
    
    if (entryUpdate.title !== undefined) {
      updates.push(`title = $${paramCounter++}`);
      values.push(entryUpdate.title);
    }
    
    if (entryUpdate.summary !== undefined) {
      updates.push(`summary = $${paramCounter++}`);
      values.push(entryUpdate.summary);
    }
    
    if (entryUpdate.content !== undefined) {
      updates.push(`content = $${paramCounter++}`);
      values.push(entryUpdate.content);
    }
    
    if (entryUpdate.contentType !== undefined) {
      updates.push(`content_type = $${paramCounter++}`);
      values.push(entryUpdate.contentType);
    }
    
    if (entryUpdate.url !== undefined) {
      updates.push(`url = $${paramCounter++}`);
      values.push(entryUpdate.url);
    }
    
    if (entryUpdate.imageUrl !== undefined) {
      updates.push(`image_url = $${paramCounter++}`);
      values.push(entryUpdate.imageUrl);
    }
    
    if (entryUpdate.tags !== undefined) {
      updates.push(`tags = $${paramCounter++}`);
      values.push(entryUpdate.tags);
    }
    
    if (entryUpdate.authorId !== undefined) {
      updates.push(`author_id = $${paramCounter++}`);
      values.push(entryUpdate.authorId);
    }
    
    if (entryUpdate.isFeatured !== undefined) {
      updates.push(`is_featured = $${paramCounter++}`);
      values.push(entryUpdate.isFeatured);
    }
    
    if (entryUpdate.isPublished !== undefined) {
      updates.push(`is_published = $${paramCounter++}`);
      values.push(entryUpdate.isPublished);
    }
    
    if (entryUpdate.relatedContentIds !== undefined) {
      updates.push(`related_content_ids = $${paramCounter++}`);
      values.push(entryUpdate.relatedContentIds);
    }
    
    // Always update the updated_at timestamp
    updates.push(`updated_at = CURRENT_TIMESTAMP`);
    
    // If there's nothing to update, return the original entry
    if (updates.length === 1) { // Only the updated_at field would be updated
      return this.getDreamContentEntry(id);
    }
    
    // Add the id parameter
    values.push(id);
    
    const result = await this.pool.query(
      `UPDATE dream_content_entries SET ${updates.join(', ')} WHERE id = $${paramCounter} RETURNING *`,
      values
    );
    
    return result.rows[0] ? this.transformDreamContentEntryDbToApi(result.rows[0]) : undefined;
  }
  
  async deleteDreamContentEntry(id: number): Promise<boolean> {
    const result = await this.pool.query(
      'DELETE FROM dream_content_entries WHERE id = $1 RETURNING id',
      [id]
    );
    return result.rows.length > 0;
  }
  
  async getFeaturedDreamContentEntries(limit: number): Promise<DreamContentEntry[]> {
    const result = await this.pool.query(
      'SELECT * FROM dream_content_entries WHERE is_published = true AND is_featured = true ORDER BY created_at DESC LIMIT $1',
      [limit]
    );
    return result.rows.map(entry => this.transformDreamContentEntryDbToApi(entry));
  }
  
  async getDreamContentEntriesByType(contentType: string): Promise<DreamContentEntry[]> {
    const result = await this.pool.query(
      'SELECT * FROM dream_content_entries WHERE is_published = true AND content_type = $1 ORDER BY created_at DESC',
      [contentType]
    );
    return result.rows.map(entry => this.transformDreamContentEntryDbToApi(entry));
  }
  
  async incrementDreamContentViewCount(id: number): Promise<DreamContentEntry | undefined> {
    const result = await this.pool.query(
      'UPDATE dream_content_entries SET view_count = view_count + 1 WHERE id = $1 RETURNING *',
      [id]
    );
    return result.rows[0] ? this.transformDreamContentEntryDbToApi(result.rows[0]) : undefined;
  }
  
  // Content comment methods
  async createContentComment(comment: InsertContentComment): Promise<ContentComment> {
    const result = await this.pool.query(
      `INSERT INTO content_comments 
        (content_id, user_id, text) 
       VALUES ($1, $2, $3) 
       RETURNING *`,
      [
        comment.contentId,
        comment.userId,
        comment.text
      ]
    );
    
    return this.transformContentCommentDbToApi(result.rows[0]);
  }
  
  async getContentCommentsByContentId(contentId: number): Promise<ContentComment[]> {
    const result = await this.pool.query(
      'SELECT * FROM content_comments WHERE content_id = $1 ORDER BY created_at DESC',
      [contentId]
    );
    return result.rows.map(comment => this.transformContentCommentDbToApi(comment));
  }
  
  async deleteContentComment(id: number): Promise<boolean> {
    const result = await this.pool.query(
      'DELETE FROM content_comments WHERE id = $1 RETURNING id',
      [id]
    );
    return result.rows.length > 0;
  }
  
  // Kulturelle Traumsymbol-Bibliothek Methoden
  
  // Kultur-Methoden
  async createCulture(culture: InsertCulture): Promise<Culture> {
    const result = await this.pool.query(
      `INSERT INTO cultures 
        (name, description, image_url, region, historical_context) 
       VALUES ($1, $2, $3, $4, $5) 
       RETURNING *`,
      [
        culture.name,
        culture.description,
        culture.imageUrl || null,
        culture.region || null,
        culture.historicalContext || null
      ]
    );
    
    return this.transformCultureDbToApi(result.rows[0]);
  }
  
  async getCulture(id: number): Promise<Culture | undefined> {
    const result = await this.pool.query(
      'SELECT * FROM cultures WHERE id = $1',
      [id]
    );
    return result.rows[0] ? this.transformCultureDbToApi(result.rows[0]) : undefined;
  }
  
  async getAllCultures(): Promise<Culture[]> {
    const result = await this.pool.query(
      'SELECT * FROM cultures ORDER BY name'
    );
    return result.rows.map(culture => this.transformCultureDbToApi(culture));
  }
  
  async updateCulture(id: number, cultureUpdate: Partial<InsertCulture>): Promise<Culture | undefined> {
    // Build the SET part of the query dynamically
    const updates: string[] = [];
    const values: any[] = [];
    let paramCounter = 1;
    
    if (cultureUpdate.name !== undefined) {
      updates.push(`name = $${paramCounter++}`);
      values.push(cultureUpdate.name);
    }
    
    if (cultureUpdate.description !== undefined) {
      updates.push(`description = $${paramCounter++}`);
      values.push(cultureUpdate.description);
    }
    
    if (cultureUpdate.imageUrl !== undefined) {
      updates.push(`image_url = $${paramCounter++}`);
      values.push(cultureUpdate.imageUrl);
    }
    
    if (cultureUpdate.region !== undefined) {
      updates.push(`region = $${paramCounter++}`);
      values.push(cultureUpdate.region);
    }
    
    if (cultureUpdate.historicalContext !== undefined) {
      updates.push(`historical_context = $${paramCounter++}`);
      values.push(cultureUpdate.historicalContext);
    }
    
    // If there's nothing to update, return the original culture
    if (updates.length === 0) {
      return this.getCulture(id);
    }
    
    // Add updated_at timestamp and id parameter
    updates.push(`updated_at = CURRENT_TIMESTAMP`);
    values.push(id);
    
    const result = await this.pool.query(
      `UPDATE cultures SET ${updates.join(', ')} WHERE id = $${paramCounter} RETURNING *`,
      values
    );
    
    return result.rows[0] ? this.transformCultureDbToApi(result.rows[0]) : undefined;
  }
  
  async deleteCulture(id: number): Promise<boolean> {
    const result = await this.pool.query(
      'DELETE FROM cultures WHERE id = $1 RETURNING id',
      [id]
    );
    return result.rows.length > 0;
  }
  
  // Traumsymbol-Methoden
  async createDreamSymbol(symbol: InsertDreamSymbol): Promise<DreamSymbol> {
    const result = await this.pool.query(
      `INSERT INTO dream_symbols 
        (name, general_meaning, image_url, category, tags, popularity) 
       VALUES ($1, $2, $3, $4, $5, $6) 
       RETURNING *`,
      [
        symbol.name,
        symbol.generalMeaning,
        symbol.imageUrl || null,
        symbol.category,
        symbol.tags || null,
        symbol.popularity || 50
      ]
    );
    
    return this.transformDreamSymbolDbToApi(result.rows[0]);
  }
  
  async getDreamSymbol(id: number): Promise<DreamSymbol | undefined> {
    const result = await this.pool.query(
      'SELECT * FROM dream_symbols WHERE id = $1',
      [id]
    );
    return result.rows[0] ? this.transformDreamSymbolDbToApi(result.rows[0]) : undefined;
  }
  
  async getAllDreamSymbols(): Promise<DreamSymbol[]> {
    const result = await this.pool.query(
      'SELECT * FROM dream_symbols ORDER BY popularity DESC'
    );
    return result.rows.map(symbol => this.transformDreamSymbolDbToApi(symbol));
  }
  
  async getDreamSymbolsByCategory(category: string): Promise<DreamSymbol[]> {
    const result = await this.pool.query(
      'SELECT * FROM dream_symbols WHERE category = $1 ORDER BY popularity DESC',
      [category]
    );
    return result.rows.map(symbol => this.transformDreamSymbolDbToApi(symbol));
  }
  
  async searchDreamSymbols(query: string): Promise<DreamSymbol[]> {
    const searchTerm = `%${query.toLowerCase()}%`;
    
    // Suche in Name, Bedeutung und Tags
    const result = await this.pool.query(
      `SELECT * FROM dream_symbols 
       WHERE LOWER(name) LIKE $1 
          OR LOWER(general_meaning) LIKE $1 
          OR EXISTS (SELECT 1 FROM unnest(tags) tag WHERE LOWER(tag) LIKE $1)
       ORDER BY popularity DESC`,
      [searchTerm]
    );
    
    return result.rows.map(symbol => this.transformDreamSymbolDbToApi(symbol));
  }
  
  async updateDreamSymbol(id: number, symbolUpdate: Partial<InsertDreamSymbol>): Promise<DreamSymbol | undefined> {
    // Build the SET part of the query dynamically
    const updates: string[] = [];
    const values: any[] = [];
    let paramCounter = 1;
    
    if (symbolUpdate.name !== undefined) {
      updates.push(`name = $${paramCounter++}`);
      values.push(symbolUpdate.name);
    }
    
    if (symbolUpdate.generalMeaning !== undefined) {
      updates.push(`general_meaning = $${paramCounter++}`);
      values.push(symbolUpdate.generalMeaning);
    }
    
    if (symbolUpdate.imageUrl !== undefined) {
      updates.push(`image_url = $${paramCounter++}`);
      values.push(symbolUpdate.imageUrl);
    }
    
    if (symbolUpdate.category !== undefined) {
      updates.push(`category = $${paramCounter++}`);
      values.push(symbolUpdate.category);
    }
    
    if (symbolUpdate.tags !== undefined) {
      updates.push(`tags = $${paramCounter++}`);
      values.push(symbolUpdate.tags);
    }
    
    if (symbolUpdate.popularity !== undefined) {
      updates.push(`popularity = $${paramCounter++}`);
      values.push(symbolUpdate.popularity);
    }
    
    // If there's nothing to update, return the original symbol
    if (updates.length === 0) {
      return this.getDreamSymbol(id);
    }
    
    // Add updated_at timestamp and id parameter
    updates.push(`updated_at = CURRENT_TIMESTAMP`);
    values.push(id);
    
    const result = await this.pool.query(
      `UPDATE dream_symbols SET ${updates.join(', ')} WHERE id = $${paramCounter} RETURNING *`,
      values
    );
    
    return result.rows[0] ? this.transformDreamSymbolDbToApi(result.rows[0]) : undefined;
  }
  
  async deleteDreamSymbol(id: number): Promise<boolean> {
    const result = await this.pool.query(
      'DELETE FROM dream_symbols WHERE id = $1 RETURNING id',
      [id]
    );
    return result.rows.length > 0;
  }
  
  // Kulturelle Interpretations-Methoden
  async createCulturalInterpretation(interpretation: InsertCulturalSymbolInterpretation): Promise<CulturalSymbolInterpretation> {
    const result = await this.pool.query(
      `INSERT INTO cultural_symbol_interpretations 
        (symbol_id, culture_id, interpretation, examples, literary_references, additional_info) 
       VALUES ($1, $2, $3, $4, $5, $6) 
       RETURNING *`,
      [
        interpretation.symbolId,
        interpretation.cultureId,
        interpretation.interpretation,
        interpretation.examples || null,
        interpretation.literaryReferences || null,
        interpretation.additionalInfo || null
      ]
    );
    
    return this.transformCulturalInterpretationDbToApi(result.rows[0]);
  }
  
  async getCulturalInterpretation(id: number): Promise<CulturalSymbolInterpretation | undefined> {
    const result = await this.pool.query(
      'SELECT * FROM cultural_symbol_interpretations WHERE id = $1',
      [id]
    );
    return result.rows[0] ? this.transformCulturalInterpretationDbToApi(result.rows[0]) : undefined;
  }
  
  async getCulturalInterpretationsBySymbolId(symbolId: number): Promise<CulturalSymbolInterpretation[]> {
    const result = await this.pool.query(
      'SELECT * FROM cultural_symbol_interpretations WHERE symbol_id = $1',
      [symbolId]
    );
    return result.rows.map(interpretation => this.transformCulturalInterpretationDbToApi(interpretation));
  }
  
  async getCulturalInterpretationsByCultureId(cultureId: number): Promise<CulturalSymbolInterpretation[]> {
    const result = await this.pool.query(
      'SELECT * FROM cultural_symbol_interpretations WHERE culture_id = $1',
      [cultureId]
    );
    return result.rows.map(interpretation => this.transformCulturalInterpretationDbToApi(interpretation));
  }
  
  async updateCulturalInterpretation(id: number, interpretationUpdate: Partial<InsertCulturalSymbolInterpretation>): Promise<CulturalSymbolInterpretation | undefined> {
    // Build the SET part of the query dynamically
    const updates: string[] = [];
    const values: any[] = [];
    let paramCounter = 1;
    
    if (interpretationUpdate.symbolId !== undefined) {
      updates.push(`symbol_id = $${paramCounter++}`);
      values.push(interpretationUpdate.symbolId);
    }
    
    if (interpretationUpdate.cultureId !== undefined) {
      updates.push(`culture_id = $${paramCounter++}`);
      values.push(interpretationUpdate.cultureId);
    }
    
    if (interpretationUpdate.interpretation !== undefined) {
      updates.push(`interpretation = $${paramCounter++}`);
      values.push(interpretationUpdate.interpretation);
    }
    
    if (interpretationUpdate.examples !== undefined) {
      updates.push(`examples = $${paramCounter++}`);
      values.push(interpretationUpdate.examples);
    }
    
    if (interpretationUpdate.literaryReferences !== undefined) {
      updates.push(`literary_references = $${paramCounter++}`);
      values.push(interpretationUpdate.literaryReferences);
    }
    
    if (interpretationUpdate.additionalInfo !== undefined) {
      updates.push(`additional_info = $${paramCounter++}`);
      values.push(interpretationUpdate.additionalInfo);
    }
    
    // If there's nothing to update, return the original interpretation
    if (updates.length === 0) {
      return this.getCulturalInterpretation(id);
    }
    
    // Add updated_at timestamp and id parameter
    updates.push(`updated_at = CURRENT_TIMESTAMP`);
    values.push(id);
    
    const result = await this.pool.query(
      `UPDATE cultural_symbol_interpretations SET ${updates.join(', ')} WHERE id = $${paramCounter} RETURNING *`,
      values
    );
    
    return result.rows[0] ? this.transformCulturalInterpretationDbToApi(result.rows[0]) : undefined;
  }
  
  async deleteCulturalInterpretation(id: number): Promise<boolean> {
    const result = await this.pool.query(
      'DELETE FROM cultural_symbol_interpretations WHERE id = $1 RETURNING id',
      [id]
    );
    return result.rows.length > 0;
  }
  
  // Symbol-Vergleiche Methoden
  async createSymbolComparison(comparison: InsertSymbolComparison): Promise<SymbolComparison> {
    const result = await this.pool.query(
      `INSERT INTO symbol_comparisons 
        (symbol_id, title, content) 
       VALUES ($1, $2, $3) 
       RETURNING *`,
      [
        comparison.symbolId,
        comparison.title,
        comparison.content
      ]
    );
    
    return this.transformSymbolComparisonDbToApi(result.rows[0]);
  }
  
  async getSymbolComparison(id: number): Promise<SymbolComparison | undefined> {
    const result = await this.pool.query(
      'SELECT * FROM symbol_comparisons WHERE id = $1',
      [id]
    );
    return result.rows[0] ? this.transformSymbolComparisonDbToApi(result.rows[0]) : undefined;
  }
  
  async getSymbolComparisonsBySymbolId(symbolId: number): Promise<SymbolComparison[]> {
    const result = await this.pool.query(
      'SELECT * FROM symbol_comparisons WHERE symbol_id = $1',
      [symbolId]
    );
    return result.rows.map(comparison => this.transformSymbolComparisonDbToApi(comparison));
  }
  
  async updateSymbolComparison(id: number, comparisonUpdate: Partial<InsertSymbolComparison>): Promise<SymbolComparison | undefined> {
    // Build the SET part of the query dynamically
    const updates: string[] = [];
    const values: any[] = [];
    let paramCounter = 1;
    
    if (comparisonUpdate.symbolId !== undefined) {
      updates.push(`symbol_id = $${paramCounter++}`);
      values.push(comparisonUpdate.symbolId);
    }
    
    if (comparisonUpdate.title !== undefined) {
      updates.push(`title = $${paramCounter++}`);
      values.push(comparisonUpdate.title);
    }
    
    if (comparisonUpdate.content !== undefined) {
      updates.push(`content = $${paramCounter++}`);
      values.push(comparisonUpdate.content);
    }
    
    // If there's nothing to update, return the original comparison
    if (updates.length === 0) {
      return this.getSymbolComparison(id);
    }
    
    // Add updated_at timestamp and id parameter
    updates.push(`updated_at = CURRENT_TIMESTAMP`);
    values.push(id);
    
    const result = await this.pool.query(
      `UPDATE symbol_comparisons SET ${updates.join(', ')} WHERE id = $${paramCounter} RETURNING *`,
      values
    );
    
    return result.rows[0] ? this.transformSymbolComparisonDbToApi(result.rows[0]) : undefined;
  }
  
  async deleteSymbolComparison(id: number): Promise<boolean> {
    const result = await this.pool.query(
      'DELETE FROM symbol_comparisons WHERE id = $1 RETURNING id',
      [id]
    );
    return result.rows.length > 0;
  }
  
  // Benutzer-Favoriten Methoden
  async createUserSymbolFavorite(favorite: InsertUserSymbolFavorite): Promise<UserSymbolFavorite> {
    const result = await this.pool.query(
      `INSERT INTO user_symbol_favorites 
        (user_id, symbol_id, notes) 
       VALUES ($1, $2, $3) 
       RETURNING *`,
      [
        favorite.userId,
        favorite.symbolId,
        favorite.notes || null
      ]
    );
    
    return this.transformUserSymbolFavoriteDbToApi(result.rows[0]);
  }
  
  async getUserSymbolFavoritesByUserId(userId: number): Promise<UserSymbolFavorite[]> {
    const result = await this.pool.query(
      'SELECT * FROM user_symbol_favorites WHERE user_id = $1',
      [userId]
    );
    return result.rows.map(favorite => this.transformUserSymbolFavoriteDbToApi(favorite));
  }
  
  async deleteUserSymbolFavorite(id: number): Promise<boolean> {
    const result = await this.pool.query(
      'DELETE FROM user_symbol_favorites WHERE id = $1 RETURNING id',
      [id]
    );
    return result.rows.length > 0;
  }
  
  // Hilfsfunktionen für die Transformation von DB-Einträgen zu API-Objekten
  private transformCultureDbToApi(culture: any): Culture {
    return {
      id: culture.id,
      name: culture.name,
      description: culture.description,
      imageUrl: culture.image_url,
      region: culture.region,
      historicalContext: culture.historical_context,
      createdAt: culture.created_at,
      updatedAt: culture.updated_at
    };
  }
  
  private transformDreamSymbolDbToApi(symbol: any): DreamSymbol {
    return {
      id: symbol.id,
      name: symbol.name,
      generalMeaning: symbol.general_meaning,
      imageUrl: symbol.image_url,
      category: symbol.category,
      tags: symbol.tags,
      popularity: symbol.popularity,
      createdAt: symbol.created_at,
      updatedAt: symbol.updated_at
    };
  }
  
  private transformCulturalInterpretationDbToApi(interpretation: any): CulturalSymbolInterpretation {
    return {
      id: interpretation.id,
      symbolId: interpretation.symbol_id,
      cultureId: interpretation.culture_id,
      interpretation: interpretation.interpretation,
      examples: interpretation.examples,
      literaryReferences: interpretation.literary_references,
      additionalInfo: interpretation.additional_info,
      createdAt: interpretation.created_at,
      updatedAt: interpretation.updated_at
    };
  }
  
  private transformSymbolComparisonDbToApi(comparison: any): SymbolComparison {
    return {
      id: comparison.id,
      symbolId: comparison.symbol_id,
      title: comparison.title,
      content: comparison.content,
      createdAt: comparison.created_at,
      updatedAt: comparison.updated_at
    };
  }
  
  private transformUserSymbolFavoriteDbToApi(favorite: any): UserSymbolFavorite {
    return {
      id: favorite.id,
      userId: favorite.user_id,
      symbolId: favorite.symbol_id,
      notes: favorite.notes,
      createdAt: favorite.created_at
    };
  }
  
  // Helper functions to transform database snake_case to API camelCase
  private transformDreamDbToApi(dream: any): Dream {
    return {
      id: dream.id,
      userId: dream.user_id,
      title: dream.title,
      content: dream.content,
      imageUrl: dream.image_url,
      date: new Date(dream.date),
      createdAt: new Date(dream.created_at),
      analysis: dream.analysis,
      tags: dream.tags,
      moodBeforeSleep: dream.mood_before_sleep,
      moodAfterWakeup: dream.mood_after_wakeup,
      moodNotes: dream.mood_notes
    };
  }
  
  private transformAchievementDbToApi(achievement: any): Achievement {
    return {
      id: achievement.id,
      name: achievement.name,
      description: achievement.description,
      category: achievement.category,
      difficulty: achievement.difficulty,
      iconName: achievement.icon_name,
      criteria: achievement.criteria,
      createdAt: new Date(achievement.created_at)
    };
  }
  
  private transformUserAchievementDbToApi(userAchievement: any): UserAchievement {
    return {
      id: userAchievement.id,
      userId: userAchievement.user_id,
      achievementId: userAchievement.achievement_id,
      progress: userAchievement.progress,
      isCompleted: userAchievement.is_completed,
      unlockedAt: new Date(userAchievement.unlocked_at)
    };
  }
  
  private transformJournalEntryDbToApi(journalEntry: any): JournalEntry {
    return {
      id: journalEntry.id,
      userId: journalEntry.user_id,
      title: journalEntry.title,
      content: journalEntry.content,
      mood: journalEntry.mood,
      tags: journalEntry.tags,
      isPrivate: journalEntry.is_private,
      imageUrl: journalEntry.image_url,
      includeInAnalysis: journalEntry.include_in_analysis,
      date: new Date(journalEntry.date),
      createdAt: new Date(journalEntry.created_at),
      updatedAt: new Date(journalEntry.updated_at),
      relatedDreamIds: journalEntry.related_dream_ids
    };
  }
  
  private transformDreamContentEntryDbToApi(contentEntry: any): DreamContentEntry {
    return {
      id: contentEntry.id,
      title: contentEntry.title,
      summary: contentEntry.summary,
      content: contentEntry.content,
      contentType: contentEntry.content_type,
      url: contentEntry.url,
      imageUrl: contentEntry.image_url,
      tags: contentEntry.tags,
      authorId: contentEntry.author_id,
      isFeatured: contentEntry.is_featured,
      isPublished: contentEntry.is_published,
      viewCount: contentEntry.view_count,
      createdAt: new Date(contentEntry.created_at),
      updatedAt: new Date(contentEntry.updated_at),
      relatedContentIds: contentEntry.related_content_ids
    };
  }
  
  private transformContentCommentDbToApi(comment: any): ContentComment {
    return {
      id: comment.id,
      contentId: comment.content_id,
      userId: comment.user_id,
      text: comment.text,
      createdAt: new Date(comment.created_at),
      updatedAt: new Date(comment.updated_at)
    };
  }
}

// Create an instance of the storage implementation
// We use the DatabaseStorage for persistence between server restarts
export const storage = new DatabaseStorage();
