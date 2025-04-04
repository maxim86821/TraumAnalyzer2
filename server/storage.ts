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
  InsertUserSymbolFavorite,
  // Collaborative dream interpretation imports
  SharedDream,
  InsertSharedDream,
  DreamComment,
  InsertDreamComment,
  CommentLike,
  InsertCommentLike,
  DreamChallenge,
  InsertDreamChallenge,
  ChallengeSubmission,
  InsertChallengeSubmission,
  MoodData,
  // AI Assistant imports
  AssistantConversation,
  InsertAssistantConversation,
  AssistantMessage,
  InsertAssistantMessage,
  ChatRequest,
  ChatResponse,
} from "@shared/schema";
import pg from "pg";
import session from "express-session";
import connectPg from "connect-pg-simple";
import OpenAI from "openai";

const PostgresSessionStore = connectPg(session);

export interface IStorage {
  // Users
  getUser(id: number): Promise<any | undefined>;
  getUserById(id: number): Promise<any | undefined>;
  getUserByUsername(username: string): Promise<any | undefined>;
  createUser(user: any): Promise<any>;
  updateUser(
    id: number,
    userData: Partial<{ name?: string; email?: string }>,
  ): Promise<any | undefined>;

  // Dreams
  createDream(dream: InsertDream): Promise<Dream>;
  getDreams(): Promise<Dream[]>;
  getDreamsByUserId(userId: number): Promise<Dream[]>;
  getDream(id: number): Promise<Dream | undefined>;
  updateDream(
    id: number,
    dream: Partial<InsertDream>,
  ): Promise<Dream | undefined>;
  deleteDream(id: number): Promise<boolean>;

  // Dream analysis
  saveDreamAnalysis(
    dreamId: number,
    analysis: AnalysisResponse,
  ): Promise<Dream>;

  // Achievements
  createAchievement(achievement: InsertAchievement): Promise<Achievement>;
  getAchievement(id: number): Promise<Achievement | undefined>;
  getAllAchievements(): Promise<Achievement[]>;

  // User Achievements
  createUserAchievement(
    userAchievement: InsertUserAchievement,
  ): Promise<UserAchievement>;
  getUserAchievements(userId: number): Promise<UserAchievement[]>;
  getUserAchievement(
    userId: number,
    achievementId: number,
  ): Promise<UserAchievement | undefined>;
  updateUserAchievementProgress(
    id: number,
    progress: AchievementProgress,
  ): Promise<UserAchievement | undefined>;
  completeUserAchievement(id: number): Promise<UserAchievement | undefined>;
  getLatestUserAchievements(
    userId: number,
    limit: number,
  ): Promise<UserAchievement[]>;

  // Journal entries
  createJournalEntry(entry: InsertJournalEntry): Promise<JournalEntry>;
  getJournalEntriesByUserId(userId: number): Promise<JournalEntry[]>;
  getJournalEntry(id: number): Promise<JournalEntry | undefined>;
  updateJournalEntry(
    id: number,
    entry: Partial<InsertJournalEntry>,
  ): Promise<JournalEntry | undefined>;
  deleteJournalEntry(id: number): Promise<boolean>;

  // Dream content entries for "Was ist Träumen?"
  createDreamContentEntry(
    entry: InsertDreamContentEntry,
  ): Promise<DreamContentEntry>;
  getDreamContentEntries(): Promise<DreamContentEntry[]>;
  getDreamContentEntry(id: number): Promise<DreamContentEntry | undefined>;
  updateDreamContentEntry(
    id: number,
    entry: Partial<InsertDreamContentEntry>,
  ): Promise<DreamContentEntry | undefined>;
  deleteDreamContentEntry(id: number): Promise<boolean>;
  getFeaturedDreamContentEntries(limit: number): Promise<DreamContentEntry[]>;
  getDreamContentEntriesByType(
    contentType: string,
  ): Promise<DreamContentEntry[]>;
  incrementDreamContentViewCount(
    id: number,
  ): Promise<DreamContentEntry | undefined>;

  // Content comments
  createContentComment(comment: InsertContentComment): Promise<ContentComment>;
  getContentCommentsByContentId(contentId: number): Promise<ContentComment[]>;
  deleteContentComment(id: number): Promise<boolean>;

  // Kulturelle Traumsymbol-Bibliothek

  // AI Assistant
  createAssistantConversation(
    conversation: InsertAssistantConversation,
  ): Promise<AssistantConversation>;
  getAssistantConversation(
    id: number,
  ): Promise<AssistantConversation | undefined>;
  getUserAssistantConversations(
    userId: number,
  ): Promise<AssistantConversation[]>;
  updateAssistantConversation(
    id: number,
    data: Partial<InsertAssistantConversation>,
  ): Promise<AssistantConversation | undefined>;
  deleteAssistantConversation(id: number): Promise<boolean>;

  // Assistant Messages
  createAssistantMessage(
    message: InsertAssistantMessage,
  ): Promise<AssistantMessage>;
  getAssistantMessages(conversationId: number): Promise<AssistantMessage[]>;

  // Kulturen
  createCulture(culture: InsertCulture): Promise<Culture>;
  getCulture(id: number): Promise<Culture | undefined>;
  getAllCultures(): Promise<Culture[]>;
  updateCulture(
    id: number,
    culture: Partial<InsertCulture>,
  ): Promise<Culture | undefined>;
  deleteCulture(id: number): Promise<boolean>;

  // Traumsymbole
  createDreamSymbol(symbol: InsertDreamSymbol): Promise<DreamSymbol>;
  getDreamSymbol(id: number): Promise<DreamSymbol | undefined>;
  getAllDreamSymbols(): Promise<DreamSymbol[]>;
  getDreamSymbolsByCategory(category: string): Promise<DreamSymbol[]>;
  searchDreamSymbols(query: string): Promise<DreamSymbol[]>;
  updateDreamSymbol(
    id: number,
    symbol: Partial<InsertDreamSymbol>,
  ): Promise<DreamSymbol | undefined>;
  deleteDreamSymbol(id: number): Promise<boolean>;

  // Kulturspezifische Interpretationen
  createCulturalInterpretation(
    interpretation: InsertCulturalSymbolInterpretation,
  ): Promise<CulturalSymbolInterpretation>;
  getCulturalInterpretationsBySymbolId(
    symbolId: number,
  ): Promise<CulturalSymbolInterpretation[]>;
  getCulturalInterpretationsByCultureId(
    cultureId: number,
  ): Promise<CulturalSymbolInterpretation[]>;
  getCulturalInterpretation(
    id: number,
  ): Promise<CulturalSymbolInterpretation | undefined>;
  updateCulturalInterpretation(
    id: number,
    interpretation: Partial<InsertCulturalSymbolInterpretation>,
  ): Promise<CulturalSymbolInterpretation | undefined>;
  deleteCulturalInterpretation(id: number): Promise<boolean>;

  // Symbol-Vergleiche
  createSymbolComparison(
    comparison: InsertSymbolComparison,
  ): Promise<SymbolComparison>;
  getSymbolComparison(id: number): Promise<SymbolComparison | undefined>;
  getSymbolComparisonsBySymbolId(symbolId: number): Promise<SymbolComparison[]>;
  updateSymbolComparison(
    id: number,
    comparison: Partial<InsertSymbolComparison>,
  ): Promise<SymbolComparison | undefined>;
  deleteSymbolComparison(id: number): Promise<boolean>;

  // Benutzer-Favoriten
  createUserSymbolFavorite(
    favorite: InsertUserSymbolFavorite,
  ): Promise<UserSymbolFavorite>;
  getUserSymbolFavoritesByUserId(userId: number): Promise<UserSymbolFavorite[]>;
  deleteUserSymbolFavorite(id: number): Promise<boolean>;

  // Custom methods for tag and mood operations
  updateDreamTags(id: number, tags: string[]): Promise<Dream | undefined>;
  updateDreamMood(id: number, moodData: MoodData): Promise<Dream | undefined>;

  // Collaborative Dream Interpretation
  // Shared Dreams
  createSharedDream(sharedDream: InsertSharedDream): Promise<SharedDream>;
  getSharedDream(id: number): Promise<SharedDream | undefined>;
  getSharedDreamsByUserId(userId: number): Promise<SharedDream[]>;
  getPublicSharedDreams(
    limit?: number,
    offset?: number,
  ): Promise<SharedDream[]>;
  getCommunitySharedDreams(
    limit?: number,
    offset?: number,
  ): Promise<SharedDream[]>;
  getFeaturedSharedDreams(limit?: number): Promise<SharedDream[]>;
  updateSharedDream(
    id: number,
    sharedDream: Partial<InsertSharedDream>,
  ): Promise<SharedDream | undefined>;
  deleteSharedDream(id: number): Promise<boolean>;
  incrementSharedDreamViewCount(id: number): Promise<SharedDream | undefined>;

  // Dream Comments
  createDreamComment(comment: InsertDreamComment): Promise<DreamComment>;
  getDreamCommentsBySharedDreamId(
    sharedDreamId: number,
  ): Promise<DreamComment[]>;
  getDreamComment(id: number): Promise<DreamComment | undefined>;
  updateDreamComment(
    id: number,
    comment: Partial<InsertDreamComment>,
  ): Promise<DreamComment | undefined>;
  deleteDreamComment(id: number): Promise<boolean>;

  // Comment Likes
  createCommentLike(like: InsertCommentLike): Promise<CommentLike>;
  getCommentLike(
    commentId: number,
    userId: number,
  ): Promise<CommentLike | undefined>;
  deleteCommentLike(id: number): Promise<boolean>;
  updateCommentLikesCount(commentId: number): Promise<number>;

  // Dream Challenges
  createDreamChallenge(
    challenge: InsertDreamChallenge,
  ): Promise<DreamChallenge>;
  getDreamChallenge(id: number): Promise<DreamChallenge | undefined>;
  getActiveDreamChallenges(): Promise<DreamChallenge[]>;
  getAllDreamChallenges(): Promise<DreamChallenge[]>;
  updateDreamChallenge(
    id: number,
    challenge: Partial<InsertDreamChallenge>,
  ): Promise<DreamChallenge | undefined>;
  deleteDreamChallenge(id: number): Promise<boolean>;

  // Challenge Submissions
  createChallengeSubmission(
    submission: InsertChallengeSubmission,
  ): Promise<ChallengeSubmission>;
  getChallengeSubmission(id: number): Promise<ChallengeSubmission | undefined>;
  getChallengeSubmissionsByUserId(
    userId: number,
  ): Promise<ChallengeSubmission[]>;
  getChallengeSubmissionsByChallengeId(
    challengeId: number,
  ): Promise<ChallengeSubmission[]>;
  updateChallengeSubmission(
    id: number,
    submission: Partial<InsertChallengeSubmission>,
  ): Promise<ChallengeSubmission | undefined>;
  deleteChallengeSubmission(id: number): Promise<boolean>;

  // Challenge Submissions
  getChallengeSubmission(id: number): Promise<ChallengeSubmission | undefined>;

  // AI Assistant functionality
  createAssistantConversation(
    conversation: InsertAssistantConversation,
  ): Promise<AssistantConversation>;
  getAssistantConversation(
    id: number,
  ): Promise<AssistantConversation | undefined>;
  getAssistantConversationsByUserId(
    userId: number,
  ): Promise<AssistantConversation[]>;
  updateAssistantConversation(
    id: number,
    conversation: Partial<InsertAssistantConversation>,
  ): Promise<AssistantConversation | undefined>;
  deleteAssistantConversation(id: number): Promise<boolean>;

  // AI Assistant messages
  createAssistantMessage(
    message: InsertAssistantMessage,
  ): Promise<AssistantMessage>;
  getAssistantMessagesByConversationId(
    conversationId: number,
  ): Promise<AssistantMessage[]>;
  getAssistantMessageThread(
    conversationId: number,
    limit?: number,
  ): Promise<AssistantMessage[]>;

  // Process chat request (main interaction point)
  processAssistantChatRequest(
    userId: number,
    request: ChatRequest,
  ): Promise<ChatResponse>;

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
  // Community data storage
  private sharedDreams: Map<number, SharedDream>;
  private dreamComments: Map<number, DreamComment>;
  private commentLikes: Map<string, CommentLike>; // Key: `${commentId}:${userId}`
  private dreamChallenges: Map<number, DreamChallenge>;
  private challengeSubmissions: Map<number, ChallengeSubmission>;
  // Traumsymbol-Bibliothek
  private cultures: Map<number, Culture>;
  private dreamSymbols: Map<number, DreamSymbol>;
  private culturalInterpretations: Map<number, CulturalSymbolInterpretation>;
  private symbolComparisons: Map<number, SymbolComparison>;
  private userSymbolFavorites: Map<number, UserSymbolFavorite>;
  // AI Assistant storage
  private assistantConversations: Map<number, AssistantConversation>;
  private assistantMessages: Map<number, AssistantMessage>;
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
  private currentSharedDreamId: number;
  private currentDreamCommentId: number;
  private currentCommentLikeId: number;
  private currentDreamChallengeId: number;
  private currentChallengeSubmissionId: number;
  private currentAssistantConversationId: number;
  private currentAssistantMessageId: number;
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
    // Collaborative Dream Interpretation Maps initialisieren
    this.sharedDreams = new Map();
    this.dreamComments = new Map();
    this.commentLikes = new Map();
    this.dreamChallenges = new Map();
    this.challengeSubmissions = new Map();
    // AI Assistant Maps initialisieren
    this.assistantConversations = new Map();
    this.assistantMessages = new Map();
    // IDs initialisieren
    this.currentUserId = 1;

    // Testdaten für Community-Funktionen initialisieren
    this.initializeCommunityData();
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
    this.currentSharedDreamId = 1;
    this.currentDreamCommentId = 1;
    this.currentCommentLikeId = 1;
    this.currentDreamChallengeId = 1;
    this.currentChallengeSubmissionId = 1;
    this.currentAssistantConversationId = 1;
    this.currentAssistantMessageId = 1;

    // In-Memory Session Store erstellen
    const MemoryStore = require("memorystore")(session);
    this.sessionStore = new MemoryStore({
      checkPeriod: 86400000, // Prune expired entries every 24h
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
        description:
          "Traumdeutung aus westlicher, psychologischer Perspektive, basierend auf Theorien von Freud, Jung und modernen Psychologen.",
        region: "Europa, Nordamerika",
        historicalContext:
          "Moderne westliche Traumdeutung hat ihre Wurzeln in der Psychoanalyse des 19. und 20. Jahrhunderts.",
      });

      const ostasiatischeKulturResult = await this.createCulture({
        name: "Ostasiatisch",
        description:
          "Traumdeutung aus chinesischer und japanischer Tradition, stark beeinflusst von Taoismus, Buddhismus und lokalen spirituellen Praktiken.",
        region: "China, Japan, Korea",
        historicalContext:
          "Asiatische Traumdeutung geht Tausende von Jahren zurück und ist eng mit spirituellen Praktiken verbunden.",
      });

      const indigeneKulturResult = await this.createCulture({
        name: "Indigene Traditionen",
        description:
          "Traumdeutung aus der Perspektive indigener Völker, die Träume oft als Verbindung zur spirituellen Welt und zu Ahnen sehen.",
        region: "Nordamerika, Südamerika, Australien",
        historicalContext:
          "Indigene Kulturen betrachten Träume seit Jahrtausenden als heilige Botschaften und spirituelle Reisen.",
      });

      // Einige wichtige Traumsymbole erstellen
      const wasserSymbolResult = await this.createDreamSymbol({
        name: "Wasser",
        generalMeaning:
          "Wasser repräsentiert oft Emotionen, das Unbewusste und Lebensenergie.",
        category: "Natur",
        tags: ["Fluss", "Meer", "See", "Emotion"],
        popularity: 90,
      });

      const fallSymbolResult = await this.createDreamSymbol({
        name: "Fallen",
        generalMeaning:
          "Fallen symbolisiert oft Kontrollverlust, Unsicherheit oder Ängste.",
        category: "Handlung",
        tags: ["Angst", "Kontrollverlust", "Hilflosigkeit"],
        popularity: 85,
      });

      const fliegenSymbolResult = await this.createDreamSymbol({
        name: "Fliegen",
        generalMeaning:
          "Fliegen steht häufig für Freiheit, Selbstverwirklichung oder Transzendenz.",
        category: "Handlung",
        tags: ["Freiheit", "Erfolg", "Überwindung"],
        popularity: 80,
      });

      const schlangeSymbolResult = await this.createDreamSymbol({
        name: "Schlange",
        generalMeaning:
          "Schlangen haben vielfältige Bedeutungen von Transformation und Heilung bis hin zu verborgenen Ängsten und Sexualität.",
        category: "Tiere",
        tags: ["Transformation", "Gefahr", "Weisheit", "Heilung"],
        popularity: 75,
      });

      const hausSymbolResult = await this.createDreamSymbol({
        name: "Haus",
        generalMeaning:
          "Ein Haus repräsentiert oft das Selbst, die Psyche oder persönlichen Lebensraum.",
        category: "Objekte",
        tags: ["Selbst", "Sicherheit", "Vergangenheit"],
        popularity: 85,
      });

      const zaehneSymbolResult = await this.createDreamSymbol({
        name: "Zähne verlieren",
        generalMeaning:
          "Zahnverlust im Traum kann Ängste vor Kontrollverlust, Attraktivitätsverlust oder großen Veränderungen symbolisieren.",
        category: "Körper",
        tags: ["Angst", "Verlust", "Veränderung", "Körper"],
        popularity: 70,
      });

      // Kulturelle Interpretationen hinzufügen

      // Wasser-Interpretationen
      await this.createCulturalInterpretation({
        symbolId: wasserSymbolResult.id,
        cultureId: westlicheKulturResult.id,
        interpretation:
          "In westlicher Psychologie symbolisiert Wasser das Unbewusste. Ruhiges Wasser kann emotionale Ausgeglichenheit bedeuten, während stürmisches Wasser auf innere Unruhe hinweisen kann.",
        examples:
          "Träume vom Schwimmen im klaren Wasser können ein Zeichen für emotionales Wohlbefinden sein. Untergehen oder Ertrinken kann Überwältigung durch Gefühle symbolisieren.",
        literaryReferences:
          "C.G. Jung sah Wasser als Symbol des kollektiven Unbewussten.",
      });

      await this.createCulturalInterpretation({
        symbolId: wasserSymbolResult.id,
        cultureId: ostasiatischeKulturResult.id,
        interpretation:
          "In ostasiatischen Traditionen wird Wasser mit dem Prinzip des Fließens und der Anpassungsfähigkeit verbunden. Es steht für das Yin-Element und verkörpert passive, weibliche Energie.",
        examples:
          "In chinesischer Traumdeutung kann klares, fließendes Wasser Wohlstand und Erfolg bedeuten, während schmutziges oder stehendes Wasser auf Probleme hinweist.",
        literaryReferences:
          "Im I Ging (Buch der Wandlungen) verkörpert das Wasser das Prinzip der Anpassungsfähigkeit und des stetigen Fließens.",
      });

      await this.createCulturalInterpretation({
        symbolId: wasserSymbolResult.id,
        cultureId: indigeneKulturResult.id,
        interpretation:
          "In vielen indigenen Traditionen wird Wasser als heilig und reinigend angesehen. Es kann die Verbindung zur spirituellen Welt symbolisieren oder eine Transformation andeuten.",
        examples:
          "Bei einigen Stämmen Nordamerikas können Träume vom Überqueren eines Gewässers eine spirituelle Reise oder einen Übergangsritus symbolisieren.",
      });

      // Weitere Symbole mit kulturellen Interpretationen

      // Haus-Interpretationen
      await this.createCulturalInterpretation({
        symbolId: hausSymbolResult.id,
        cultureId: westlicheKulturResult.id,
        interpretation:
          "In westlicher Traumdeutung repräsentiert ein Haus oft die eigene Psyche. Verschiedene Räume können verschiedene Aspekte des Selbst darstellen.",
        examples:
          "Der Dachboden kann für das Über-Ich stehen, der Keller für das Unbewusste oder verdrängte Erinnerungen.",
        literaryReferences:
          "Freud und Jung interpretierten Häuser als Repräsentationen des Selbst mit verschiedenen Ebenen des Bewusstseins.",
      });

      // Schlange-Interpretationen
      await this.createCulturalInterpretation({
        symbolId: schlangeSymbolResult.id,
        cultureId: westlicheKulturResult.id,
        interpretation:
          "In westlicher Psychologie wird die Schlange oft mit verborgenen Ängsten, Sexualität oder Transformation assoziiert.",
        examples:
          "Eine häutende Schlange kann Erneuerung symbolisieren, während eine beißende Schlange auf unterdrückte Ängste hindeuten kann.",
        literaryReferences:
          "Freud sah in der Schlange ein phallisches Symbol; Jung betrachtete sie als Archetyp der Weisheit und Transformation.",
      });

      await this.createCulturalInterpretation({
        symbolId: schlangeSymbolResult.id,
        cultureId: ostasiatischeKulturResult.id,
        interpretation:
          "In ostasiatischen Kulturen wird die Schlange oft mit Weisheit, Glück und Langlebigkeit assoziiert. Der Drache, eine mythologische Schlange, symbolisiert Macht und Glück.",
        examples:
          "In chinesischer Traumdeutung kann eine weiße Schlange Glück und Erfolg bedeuten.",
      });

      // Symbol-Vergleiche erstellen
      await this.createSymbolComparison({
        symbolId: wasserSymbolResult.id,
        title: "Wasser in verschiedenen Kulturen",
        content:
          "Das Wassersymbol zeigt faszinierende kulturelle Unterschiede: Während westliche Interpretationen Wasser mit dem Unbewussten verbinden, betonen ostasiatische Traditionen das Fließen und den Kreislauf des Lebens. Indigene Kulturen sehen Wasser oft als heilig und als Verbindung zur spirituellen Welt. Gemeinsam ist allen Interpretationen die Verbindung zu Emotionen und Transformation. Diese unterschiedlichen Betrachtungen zeigen, wie kulturelle Hintergründe unsere Traumsymbolik prägen.",
      });

      await this.createSymbolComparison({
        symbolId: schlangeSymbolResult.id,
        title: "Die Schlange als universelles Symbol",
        content:
          "Die Schlange ist eines der ältesten und universellsten Traumsymbole mit stark variierenden Bedeutungen: In westlichen Interpretationen oft mit Gefahr, verborgenen Ängsten oder Sexualität verbunden; in ostasiatischen Kulturen ein Symbol für Weisheit, Glück und Langlebigkeit; in indigenen Traditionen häufig ein spiritueller Bote oder Heilsymbol. Die starken Kontraste zeigen, wie kulturelle Erzählungen und Mythen unsere Traumdeutung prägen, während die transformative Natur der Schlange (Häutung) kulturübergreifend erkannt wird.",
      });

      console.log("Default cultures and dream symbols created");
    } catch (error) {
      console.error("Error creating default cultures and symbols:", error);
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
        threshold: 1,
      } as any,
    });

    this.createAchievement({
      name: "Traumtagebuch-Starter",
      description: "Zeichne 5 Träume auf",
      category: "beginner" as any,
      difficulty: "bronze" as any,
      iconName: "book",
      criteria: {
        type: "dreamCount" as any,
        threshold: 5,
      } as any,
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
        threshold: 3,
      } as any,
    });

    this.createAchievement({
      name: "Traum-Enthusiast",
      description: "Zeichne Träume an 7 aufeinanderfolgenden Tagen auf",
      category: "consistency" as any,
      difficulty: "gold" as any,
      iconName: "award",
      criteria: {
        type: "streakDays" as any,
        threshold: 7,
      } as any,
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
        threshold: 5,
      } as any,
    });

    this.createAchievement({
      name: "Bildliche Erinnerung",
      description: "Füge 3 Bildern zu deinen Traumeinträgen hinzu",
      category: "exploration" as any,
      difficulty: "bronze" as any,
      iconName: "image",
      criteria: {
        type: "imageCount" as any,
        threshold: 3,
      } as any,
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
        threshold: 5,
      } as any,
    });

    this.createAchievement({
      name: "Traumdeuter",
      description: "Analysiere 3 deiner Träume mit KI",
      category: "insight" as any,
      difficulty: "silver" as any,
      iconName: "brain",
      criteria: {
        type: "analysisCount" as any,
        threshold: 3,
      } as any,
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
        threshold: 30,
      } as any,
    });

    this.createAchievement({
      name: "Detaillierter Träumer",
      description:
        "Schreibe 5 ausführliche Traumeinträge (mindestens 200 Zeichen)",
      category: "mastery" as any,
      difficulty: "silver" as any,
      iconName: "file-text",
      criteria: {
        type: "dreamLength" as any,
        threshold: 5,
        additionalParams: {
          minLength: 200,
        },
      } as any,
    });
  }

  /**
   * Initialisiert die Testdaten für Community-Funktionen
   * Erstellt Shared Dreams, Dream Comments, Dream Challenges und Challenge Submissions
   */
  private initializeCommunityData() {
    // Prüfen, ob bereits Daten vorhanden sind
    if (this.sharedDreams.size > 0) {
      return; // Daten bereits initialisiert
    }

    try {
      // Demo-Benutzer erstellen, falls noch nicht vorhanden
      if (this.users.size === 0) {
        this.createUser({
          username: "dreamwalker",
          name: "Alex Träumer",
          email: "alex@example.com",
          password: "hashedpassword123",
        });

        this.createUser({
          username: "traumreisender",
          name: "Maria Nachtfalter",
          email: "maria@example.com",
          password: "hashedpassword456",
        });

        this.createUser({
          username: "traumdeuterNRW",
          name: "Thomas Schlafwandler",
          email: "thomas@example.com",
          password: "hashedpassword789",
        });

        this.createUser({
          username: "naturträumer",
          name: "Jana Waldtraum",
          email: "jana@example.com",
          password: "hashedpassword101",
        });
      }

      // Shared Dreams erstellen
      const dream1 = {
        userId: 2,
        dreamId: null,
        title: "Flug über eine fremde Stadt",
        content:
          "Ich flog über eine Stadt mit merkwürdigen Gebäuden, die wie Kristalle aussahen. Die Sonne spiegelte sich in ihnen und erzeugte ein faszinierendes Lichtspiel. Ich konnte die Menschen unten sehen, wie sie ihren Alltag nachgingen, aber sie schienen mich nicht zu bemerken. Die ganze Stadt pulsierte in einem sanften blauen Licht.",
        imageUrl: null,
        tags: ["fliegen", "stadt", "kristalle"],
        visibility: "public",
        allowComments: true,
        allowInterpretations: true,
        viewCount: 24,
        createdAt: new Date("2025-03-20T14:32:00Z"),
        username: "traumreisender",
      };

      const dream2 = {
        userId: 3,
        dreamId: null,
        title: "Im Labyrinth der Erinnerungen",
        content:
          "Ich befand mich in einem sich ständig verändernden Labyrinth. An jeder Ecke sah ich Szenen aus meiner Vergangenheit, aber leicht verändert. Menschen, die ich kannte, verhielten sich anders, Orte sahen nicht ganz so aus, wie ich sie in Erinnerung hatte. Je tiefer ich ins Labyrinth vordrang, desto unbekannter wurden die Erinnerungen.",
        imageUrl: null,
        tags: ["labyrinth", "erinnerungen", "vergangenheit"],
        visibility: "public",
        allowComments: true,
        allowInterpretations: true,
        viewCount: 18,
        createdAt: new Date("2025-03-25T09:15:00Z"),
        username: "traumdeuterNRW",
      };

      const dream3 = {
        userId: 4,
        dreamId: null,
        title: "Die sprechenden Bäume",
        content:
          "In einem alten Wald begannen die Bäume mit mir zu sprechen. Sie erzählten Geschichten von längst vergangenen Zeiten und gaben mir Ratschläge für die Zukunft. Ein besonders alter Baum in der Mitte des Waldes sagte, ich solle auf meine innere Stimme hören und meinem Pfad treu bleiben.",
        imageUrl: null,
        tags: ["natur", "kommunikation", "weisheit"],
        visibility: "public",
        allowComments: true,
        allowInterpretations: true,
        viewCount: 42,
        createdAt: new Date("2025-03-15T16:20:00Z"),
        username: "naturträumer",
      };

      const dream4 = {
        userId: 1,
        dreamId: 10,
        title: "Reise zum Meeresgrund",
        content:
          "Ich konnte unter Wasser atmen und erkundete den Meeresboden. Seltsame leuchtende Wesen begleiteten mich auf meiner Reise. Sie schienen mir den Weg zu einer versunkenen Stadt zu zeigen. Als ich die Stadt erreichte, konnte ich verstehen, was die Meeresbewohner sagten.",
        imageUrl: null,
        tags: ["meer", "unterwasser", "entdeckung"],
        visibility: "public",
        allowComments: true,
        allowInterpretations: true,
        viewCount: 8,
        createdAt: new Date("2025-03-26T22:10:00Z"),
        username: "dreamwalker",
      };

      // Shared Dreams in die Map einfügen
      this.sharedDreams.set(1, {
        id: 1,
        ...dream1,
      });

      this.sharedDreams.set(2, {
        id: 2,
        ...dream2,
      });

      this.sharedDreams.set(3, {
        id: 3,
        ...dream3,
      });

      this.sharedDreams.set(4, {
        id: 4,
        ...dream4,
      });

      // Dream Comments erstellen
      this.dreamComments.set(1, {
        id: 1,
        userId: 1,
        sharedDreamId: 3,
        text: "Dieser Traum erinnert mich an alte Mythen über die Weisheit der Natur. Die Bäume könnten dein Unterbewusstsein repräsentieren, das versucht, dir wichtige Botschaften mitzuteilen.",
        isInterpretation: true,
        likesCount: 5,
        createdAt: new Date("2025-03-16T10:45:00Z"),
        username: "dreamwalker",
      });

      this.dreamComments.set(2, {
        id: 2,
        userId: 2,
        sharedDreamId: 3,
        text: "Ich hatte auch schon Träume mit sprechenden Bäumen! Bei mir waren sie allerdings eher beunruhigend und haben Warnungen ausgesprochen. Interessant, wie unterschiedlich ähnliche Symbole wirken können.",
        isInterpretation: false,
        likesCount: 2,
        createdAt: new Date("2025-03-17T14:20:00Z"),
        username: "traumreisender",
      });

      this.dreamComments.set(3, {
        id: 3,
        userId: 3,
        sharedDreamId: 1,
        text: "Das Fliegen im Traum symbolisiert oft ein Gefühl der Freiheit und des Loslassens. Die kristalline Stadt könnte für Klarheit und neue Perspektiven stehen, die du in deinem Leben gewinnst.",
        isInterpretation: true,
        likesCount: 3,
        createdAt: new Date("2025-03-21T08:30:00Z"),
        username: "traumdeuterNRW",
      });

      // Dream Challenges erstellen
      this.dreamChallenges.set(1, {
        id: 1,
        title: "Wochentema: Wasser",
        description:
          "Achte diese Woche besonders auf Traumsymbole, die mit Wasser zu tun haben. Teile deinen Traum und die Bedeutung, die Wasser darin hatte.",
        imageUrl: null,
        difficulty: "medium",
        startDate: new Date("2025-03-20T00:00:00Z"),
        endDate: new Date("2025-03-27T23:59:59Z"),
        isActive: true,
        tags: ["wasser", "symbolik", "elemente"],
        createdAt: new Date("2025-03-19T12:00:00Z"),
      });

      this.dreamChallenges.set(2, {
        id: 2,
        title: "Lucides Träumen",
        description:
          "Versuche, in dieser Woche einen luziden Traum zu erleben und zu dokumentieren. Teile deine Erfahrungen und Techniken, die dir dabei geholfen haben.",
        imageUrl: null,
        difficulty: "hard",
        startDate: new Date("2025-03-25T00:00:00Z"),
        endDate: new Date("2025-04-01T23:59:59Z"),
        isActive: true,
        tags: ["luzid", "kontrolle", "bewusstsein"],
        createdAt: new Date("2025-03-24T15:30:00Z"),
      });

      // Challenge Submissions erstellen
      this.challengeSubmissions.set(1, {
        id: 1,
        userId: 4,
        challengeId: 1,
        dreamId: null,
        title: "Der sprechende Ozean",
        content:
          "In meinem Traum stand ich am Ufer eines unendlich weiten Ozeans. Das Wasser begann, mit einer tiefen, hallenden Stimme zu sprechen. Es erzählte von den Geheimnissen der Tiefsee und den Veränderungen, die der Planet durchmacht. Ich fühlte mich gleichzeitig klein und verbunden mit etwas viel Größerem.",
        reflection:
          "Wasser scheint in meinen Träumen oft als Vermittler von tiefem Wissen zu fungieren. Es repräsentiert für mich die Verbindung zur Natur und zu größeren Zusammenhängen.",
        imageUrl: null,
        tags: ["ozean", "kommunikation", "natur"],
        submissionDate: new Date("2025-03-23T19:45:00Z"),
        likesCount: 7,
        username: "naturträumer",
      });

      console.log("Community test data initialized");
    } catch (error) {
      console.error("Error initializing community data:", error);
    }
  }

  // User methods
  async getUser(id: number): Promise<any | undefined> {
    return this.users.get(id);
  }

  async getUserById(id: number): Promise<any | undefined> {
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

  async updateUser(
    id: number,
    userData: Partial<{ name?: string; email?: string }>,
  ): Promise<any | undefined> {
    const user = this.users.get(id);
    if (!user) {
      return undefined;
    }

    const updatedUser = {
      ...user,
      ...userData,
    };

    this.users.set(id, updatedUser);
    return updatedUser;
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
      moodNotes: dream.moodNotes || null,
      moodData: {}, // Initialize moodData
    };

    this.dreams.set(id, newDream);
    return newDream;
  }

  async getDreams(): Promise<Dream[]> {
    // Return dreams in reverse chronological order (newest first)
    return Array.from(this.dreams.values()).sort(
      (a, b) => b.date.getTime() - a.date.getTime(),
    );
  }

  async getDream(id: number): Promise<Dream | undefined> {
    return this.dreams.get(id);
  }

  async updateDream(
    id: number,
    dreamUpdate: Partial<InsertDream>,
  ): Promise<Dream | undefined> {
    const dream = this.dreams.get(id);
    if (!dream) {
      return undefined;
    }

    const updatedDream: Dream = {
      ...dream,
      ...dreamUpdate,
      // Ensure date is a Date object
      date: dreamUpdate.date ? new Date(dreamUpdate.date) : dream.date,
    };

    this.dreams.set(id, updatedDream);
    return updatedDream;
  }

  async deleteDream(id: number): Promise<boolean> {
    return this.dreams.delete(id);
  }

  // Dream analysis methods
  async saveDreamAnalysis(
    dreamId: number,
    analysis: AnalysisResponse,
  ): Promise<Dream> {
    // First, check if dream exists
    const dream = this.dreams.get(dreamId);
    if (!dream) {
      throw new Error(`Dream with ID ${dreamId} not found`);
    }

    // Store the analysis JSON string in the dream record
    const analysisString = JSON.stringify(analysis);
    const updatedDream: Dream = {
      ...dream,
      analysis: analysisString,
    };

    this.dreams.set(dreamId, updatedDream);
    return updatedDream;
  }

  // Get dreams by user ID
  async getDreamsByUserId(userId: number): Promise<Dream[]> {
    return Array.from(this.dreams.values())
      .filter((dream) => dream.userId === userId)
      .sort((a, b) => b.date.getTime() - a.date.getTime());
  }

  // Achievement methods
  async createAchievement(
    achievement: InsertAchievement,
  ): Promise<Achievement> {
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
      createdAt,
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
  async createUserAchievement(
    userAchievement: InsertUserAchievement,
  ): Promise<UserAchievement> {
    const id = this.currentUserAchievementId++;
    const unlockedAt = new Date();

    const newUserAchievement: UserAchievement = {
      id,
      userId: userAchievement.userId,
      achievementId: userAchievement.achievementId,
      progress: userAchievement.progress as any, // Type-Assertion, da wir die Validierung bereits im Schema haben
      isCompleted: userAchievement.isCompleted || false,
      unlockedAt,
    };

    this.userAchievements.set(id, newUserAchievement);
    return newUserAchievement;
  }

  async getUserAchievements(userId: number): Promise<UserAchievement[]> {
    return Array.from(this.userAchievements.values())
      .filter((ua) => ua.userId === userId)
      .sort((a, b) => b.unlockedAt.getTime() - a.unlockedAt.getTime());
  }

  async getUserAchievement(
    userId: number,
    achievementId: number,
  ): Promise<UserAchievement | undefined> {
    return Array.from(this.userAchievements.values()).find(
      (ua) => ua.userId === userId && ua.achievementId === achievementId,
    );
  }

  async updateUserAchievementProgress(
    id: number,
    progress: AchievementProgress,
  ): Promise<UserAchievement | undefined> {
    const userAchievement = this.userAchievements.get(id);
    if (!userAchievement) {
      return undefined;
    }

    const updatedUserAchievement: UserAchievement = {
      ...userAchievement,
      progress,
    };

    // Überprüfen, ob das Achievement abgeschlossen ist
    if (
      progress.currentValue >= progress.requiredValue &&
      !userAchievement.isCompleted
    ) {
      updatedUserAchievement.isCompleted = true;
    }

    this.userAchievements.set(id, updatedUserAchievement);
    return updatedUserAchievement;
  }

  async completeUserAchievement(
    id: number,
  ): Promise<UserAchievement | undefined> {
    const userAchievement = this.userAchievements.get(id);
    if (!userAchievement) {
      return undefined;
    }

    const updatedUserAchievement: UserAchievement = {
      ...userAchievement,
      isCompleted: true,
    };

    this.userAchievements.set(id, updatedUserAchievement);
    return updatedUserAchievement;
  }

  async getLatestUserAchievements(
    userId: number,
    limit: number,
  ): Promise<UserAchievement[]> {
    return Array.from(this.userAchievements.values())
      .filter((ua) => ua.userId === userId && ua.isCompleted)
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
      relatedDreamIds: entry.relatedDreamIds || null,
    };

    this.journalEntries.set(id, newEntry);
    return newEntry;
  }

  async getJournalEntriesByUserId(userId: number): Promise<JournalEntry[]> {
    return Array.from(this.journalEntries.values())
      .filter((entry) => entry.userId === userId)
      .sort((a, b) => b.date.getTime() - a.date.getTime());
  }

  async getJournalEntry(id: number): Promise<JournalEntry | undefined> {
    return this.journalEntries.get(id);
  }

  async updateJournalEntry(
    id: number,
    entryUpdate: Partial<InsertJournalEntry>,
  ): Promise<JournalEntry | undefined> {
    const entry = this.journalEntries.get(id);
    if (!entry) {
      return undefined;
    }

    const updatedEntry: JournalEntry = {
      ...entry,
      ...entryUpdate,
      // Ensure date is a Date object
      date: entryUpdate.date ? new Date(entryUpdate.date) : entry.date,
      updatedAt: new Date(),
    };

    this.journalEntries.set(id, updatedEntry);
    return updatedEntry;
  }

  async deleteJournalEntry(id: number): Promise<boolean> {
    return this.journalEntries.delete(id);
  }

  // Dream content entry methods
  async createDreamContentEntry(
    entry: InsertDreamContentEntry,
  ): Promise<DreamContentEntry> {
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
      relatedContentIds: entry.relatedContentIds || null,
    };

    this.dreamContentEntries.set(id, newEntry);
    return newEntry;
  }

  async getDreamContentEntries(): Promise<DreamContentEntry[]> {
    return Array.from(this.dreamContentEntries.values())
      .filter((entry) => entry.isPublished)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  async getDreamContentEntry(
    id: number,
  ): Promise<DreamContentEntry | undefined> {
    return this.dreamContentEntries.get(id);
  }

  async updateDreamContentEntry(
    id: number,
    entryUpdate: Partial<InsertDreamContentEntry>,
  ): Promise<DreamContentEntry | undefined> {
    const entry = this.dreamContentEntries.get(id);
    if (!entry) {
      return undefined;
    }

    const updatedEntry: DreamContentEntry = {
      ...entry,
      ...entryUpdate,
      updatedAt: new Date(),
    };

    this.dreamContentEntries.set(id, updatedEntry);
    return updatedEntry;
  }

  async deleteDreamContentEntry(id: number): Promise<boolean> {
    return this.dreamContentEntries.delete(id);
  }

  async getFeaturedDreamContentEntries(
    limit: number,
  ): Promise<DreamContentEntry[]> {
    return Array.from(this.dreamContentEntries.values())
      .filter((entry) => entry.isPublished && entry.isFeatured)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .slice(0, limit);
  }

  async getDreamContentEntriesByType(
    contentType: string,
  ): Promise<DreamContentEntry[]> {
    return Array.from(this.dreamContentEntries.values())
      .filter((entry) => entry.isPublished && entry.contentType === contentType)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  async incrementDreamContentViewCount(
    id: number,
  ): Promise<DreamContentEntry | undefined> {
    const entry = this.dreamContentEntries.get(id);
    if (!entry) {
      return undefined;
    }

    const updatedEntry: DreamContentEntry = {
      ...entry,
      viewCount: entry.viewCount + 1,
    };

    this.dreamContentEntries.set(id, updatedEntry);
    return updatedEntry;
  }

  // Content comment methods
  async createContentComment(
    comment: InsertContentComment,
  ): Promise<ContentComment> {
    const id = this.currentContentCommentId++;
    const createdAt = new Date();

    const newComment: ContentComment = {
      id,
      contentId: comment.contentId,
      userId: comment.userId,
      text: comment.text,
      createdAt,
      updatedAt: createdAt,
    };

    this.contentComments.set(id, newComment);
    return newComment;
  }

  async getContentCommentsByContentId(
    contentId: number,
  ): Promise<ContentComment[]> {
    return Array.from(this.contentComments.values())
      .filter((comment) => comment.contentId === contentId)
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
      updatedAt,
    };

    this.cultures.set(id, newCulture);
    return newCulture;
  }

  async getCulture(id: number): Promise<Culture | undefined> {
    return this.cultures.get(id);
  }

  async getAllCultures(): Promise<Culture[]> {
    return Array.from(this.cultures.values()).sort((a, b) =>
      a.name.localeCompare(b.name),
    );
  }

  async updateCulture(
    id: number,
    cultureUpdate: Partial<InsertCulture>,
  ): Promise<Culture | undefined> {
    const culture = this.cultures.get(id);
    if (!culture) {
      return undefined;
    }

    const updatedCulture: Culture = {
      ...culture,
      ...cultureUpdate,
      updatedAt: new Date(),
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
      updatedAt,
    };

    this.dreamSymbols.set(id, newSymbol);
    return newSymbol;
  }

  async getDreamSymbol(id: number): Promise<DreamSymbol | undefined> {
    return this.dreamSymbols.get(id);
  }

  async getAllDreamSymbols(): Promise<DreamSymbol[]> {
    return Array.from(this.dreamSymbols.values()).sort(
      (a, b) => b.popularity - a.popularity,
    );
  }

  async getDreamSymbolsByCategory(category: string): Promise<DreamSymbol[]> {
    return Array.from(this.dreamSymbols.values())
      .filter((symbol) => symbol.category === category)
      .sort((a, b) => b.popularity - a.popularity);
  }

  async searchDreamSymbols(query: string): Promise<DreamSymbol[]> {
    const searchTermLower = query.toLowerCase();
    return Array.from(this.dreamSymbols.values())
      .filter((symbol) => {
        // Suche im Namen des Symbols
        if (symbol.name.toLowerCase().includes(searchTermLower)) {
          return true;
        }

        // Suche in der Bedeutung
        if (symbol.generalMeaning.toLowerCase().includes(searchTermLower)) {
          return true;
        }

        // Suche in Tags
        if (
          symbol.tags &&
          symbol.tags.some((tag) => tag.toLowerCase().includes(searchTermLower))
        ) {
          return true;
        }

        return false;
      })
      .sort((a, b) => b.popularity - a.popularity);
  }

  async updateDreamSymbol(
    id: number,
    symbolUpdate: Partial<InsertDreamSymbol>,
  ): Promise<DreamSymbol | undefined> {
    const symbol = this.dreamSymbols.get(id);
    if (!symbol) {
      return undefined;
    }

    const updatedSymbol: DreamSymbol = {
      ...symbol,
      ...symbolUpdate,
      updatedAt: new Date(),
    };

    this.dreamSymbols.set(id, updatedSymbol);
    return updatedSymbol;
  }

  async deleteDreamSymbol(id: number): Promise<boolean> {
    return this.dreamSymbols.delete(id);
  }

  // Kulturelle Interpretations-Methoden
  async createCulturalInterpretation(
    interpretation: InsertCulturalSymbolInterpretation,
  ): Promise<CulturalSymbolInterpretation> {
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
      updatedAt,
    };

    this.culturalInterpretations.set(id, newInterpretation);
    return newInterpretation;
  }

  async getCulturalInterpretation(
    id: number,
  ): Promise<CulturalSymbolInterpretation | undefined> {
    return this.culturalInterpretations.get(id);
  }

  async getCulturalInterpretationsBySymbolId(
    symbolId: number,
  ): Promise<CulturalSymbolInterpretation[]> {
    return Array.from(this.culturalInterpretations.values()).filter(
      (interpretation) => interpretation.symbolId === symbolId,
    );
  }

  async getCulturalInterpretationsByCultureId(
    cultureId: number,
  ): Promise<CulturalSymbolInterpretation[]> {
    return Array.from(this.culturalInterpretations.values()).filter(
      (interpretation) => interpretation.cultureId === cultureId,
    );
  }

  async updateCulturalInterpretation(
    id: number,
    interpretationUpdate: Partial<InsertCulturalSymbolInterpretation>,
  ): Promise<CulturalSymbolInterpretation | undefined> {
    const interpretation = this.culturalInterpretations.get(id);
    if (!interpretation) {
      return undefined;
    }

    const updatedInterpretation: CulturalSymbolInterpretation = {
      ...interpretation,
      ...interpretationUpdate,
      updatedAt: new Date(),
    };

    this.culturalInterpretations.set(id, updatedInterpretation);
    return updatedInterpretation;
  }

  async deleteCulturalInterpretation(id: number): Promise<boolean> {
    return this.culturalInterpretations.delete(id);
  }

  // Symbol-Vergleiche Methoden
  async createSymbolComparison(
    comparison: InsertSymbolComparison,
  ): Promise<SymbolComparison> {
    const id = this.currentSymbolComparisonId++;
    const createdAt = new Date();
    const updatedAt = createdAt;

    const newComparison: SymbolComparison = {
      id,
      symbolId: comparison.symbolId,
      title: comparison.title,
      content: comparison.content,
      createdAt,
      updatedAt,
    };

    this.symbolComparisons.set(id, newComparison);
    return newComparison;
  }

  async getSymbolComparison(id: number): Promise<SymbolComparison | undefined> {
    return this.symbolComparisons.get(id);
  }

  async getSymbolComparisonsBySymbolId(
    symbolId: number,
  ): Promise<SymbolComparison[]> {
    return Array.from(this.symbolComparisons.values()).filter(
      (comparison) => comparison.symbolId === symbolId,
    );
  }

  async updateSymbolComparison(
    id: number,
    comparisonUpdate: Partial<InsertSymbolComparison>,
  ): Promise<SymbolComparison | undefined> {
    const comparison = this.symbolComparisons.get(id);
    if (!comparison) {
      return undefined;
    }

    const updatedComparison: SymbolComparison = {
      ...comparison,
      ...comparisonUpdate,
      updatedAt: new Date(),
    };

    this.symbolComparisons.set(id, updatedComparison);
    return updatedComparison;
  }

  async deleteSymbolComparison(id: number): Promise<boolean> {
    return this.symbolComparisons.delete(id);
  }

  // Benutzer-Favoriten Methoden
  async createUserSymbolFavorite(
    favorite: InsertUserSymbolFavorite,
  ): Promise<UserSymbolFavorite> {
    const id = this.currentUserSymbolFavoriteId++;
    const createdAt = new Date();

    const newFavorite: UserSymbolFavorite = {
      id,
      userId: favorite.userId,
      symbolId: favorite.symbolId,
      notes: favorite.notes || null,
      createdAt,
    };

    this.userSymbolFavorites.set(id, newFavorite);
    return newFavorite;
  }

  async getUserSymbolFavoritesByUserId(
    userId: number,
  ): Promise<UserSymbolFavorite[]> {
    return Array.from(this.userSymbolFavorites.values()).filter(
      (favorite) => favorite.userId === userId,
    );
  }

  async deleteUserSymbolFavorite(id: number): Promise<boolean> {
    return this.userSymbolFavorites.delete(id);
  }

  // Custom methods for tag and mood operations
  async updateDreamTags(
    id: number,
    tags: string[],
  ): Promise<Dream | undefined> {
    const dream = this.dreams.get(id);
    if (!dream) {
      return undefined;
    }

    const updatedDream = {
      ...dream,
      tags: tags,
    };

    this.dreams.set(id, updatedDream);
    return updatedDream;
  }

  async updateDreamMood(
    id: number,
    moodData: MoodData,
  ): Promise<Dream | undefined> {
    const dream = this.dreams.get(id);
    if (!dream) {
      return undefined;
    }

    const updatedDream = {
      ...dream,
      moodBeforeSleep: moodData.beforeSleep || dream.moodBeforeSleep,
      moodAfterWakeup: moodData.afterWakeup || dream.moodAfterWakeup,
      moodNotes: moodData.notes || dream.moodNotes,
    };

    this.dreams.set(id, updatedDream);
    return updatedDream;
  }

  // Collaborative Dream Interpretation methods

  // Shared Dreams
  async createSharedDream(
    sharedDream: InsertSharedDream,
  ): Promise<SharedDream> {
    const id = this.currentSharedDreamId++;
    const now = new Date();

    const newSharedDream: SharedDream = {
      id,
      dreamId: sharedDream.dreamId,
      userId: sharedDream.userId,
      title: sharedDream.title,
      content: sharedDream.content,
      anonymousShare: sharedDream.anonymousShare || false,
      visibility: sharedDream.visibility || "community",
      allowComments:
        sharedDream.allowComments !== undefined
          ? sharedDream.allowComments
          : true,
      allowInterpretations:
        sharedDream.allowInterpretations !== undefined
          ? sharedDream.allowInterpretations
          : true,
      includeAiAnalysis: sharedDream.includeAiAnalysis || false,
      featuredInCommunity: false,
      viewCount: 0,
      createdAt: now,
      updatedAt: now,
      tags: sharedDream.tags || [],
      imageUrl: sharedDream.imageUrl || null,
    };

    this.sharedDreams.set(id, newSharedDream);
    return newSharedDream;
  }

  async getSharedDream(id: number): Promise<SharedDream | undefined> {
    return this.sharedDreams.get(id);
  }

  async getSharedDreamsByUserId(userId: number): Promise<SharedDream[]> {
    return Array.from(this.sharedDreams.values()).filter(
      (dream) => dream.userId === userId,
    );
  }

  async getPublicSharedDreams(
    limit?: number,
    offset?: number,
  ): Promise<SharedDream[]> {
    let dreams = Array.from(this.sharedDreams.values())
      .filter((dream) => dream.visibility === "public")
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

    if (offset !== undefined) {
      dreams = dreams.slice(offset);
    }

    if (limit !== undefined) {
      dreams = dreams.slice(0, limit);
    }

    return dreams;
  }

  async getCommunitySharedDreams(
    limit?: number,
    offset?: number,
  ): Promise<SharedDream[]> {
    let dreams = Array.from(this.sharedDreams.values())
      .filter(
        (dream) =>
          dream.visibility === "community" || dream.visibility === "public",
      )
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

    if (offset !== undefined) {
      dreams = dreams.slice(offset);
    }

    if (limit !== undefined) {
      dreams = dreams.slice(0, limit);
    }

    return dreams;
  }

  async getFeaturedSharedDreams(limit?: number): Promise<SharedDream[]> {
    let dreams = Array.from(this.sharedDreams.values())
      .filter((dream) => dream.featuredInCommunity)
      .sort((a, b) => b.viewCount - a.viewCount);

    if (limit !== undefined) {
      dreams = dreams.slice(0, limit);
    }

    return dreams;
  }

  async updateSharedDream(
    id: number,
    sharedDream: Partial<InsertSharedDream>,
  ): Promise<SharedDream | undefined> {
    const dream = this.sharedDreams.get(id);
    if (!dream) {
      return undefined;
    }

    const updatedDream = {
      ...dream,
      ...sharedDream,
      updatedAt: new Date(),
    };

    this.sharedDreams.set(id, updatedDream);
    return updatedDream;
  }

  async deleteSharedDream(id: number): Promise<boolean> {
    // Also delete all comments and likes associated with this shared dream
    Array.from(this.dreamComments.values())
      .filter((comment) => comment.sharedDreamId === id)
      .forEach((comment) => {
        this.dreamComments.delete(comment.id);

        // Delete all likes associated with this comment
        Array.from(this.commentLikes.values())
          .filter((like) => like.commentId === comment.id)
          .forEach((like) => this.commentLikes.delete(like.id));
      });

    return this.sharedDreams.delete(id);
  }

  async incrementSharedDreamViewCount(
    id: number,
  ): Promise<SharedDream | undefined> {
    const dream = this.sharedDreams.get(id);
    if (!dream) {
      return undefined;
    }

    const updatedDream = {
      ...dream,
      viewCount: dream.viewCount + 1,
    };

    this.sharedDreams.set(id, updatedDream);
    return updatedDream;
  }

  // Dream Comments
  async createDreamComment(comment: InsertDreamComment): Promise<DreamComment> {
    const id = this.currentDreamCommentId++;
    const now = new Date();

    const newComment: DreamComment = {
      id,
      sharedDreamId: comment.sharedDreamId,
      userId: comment.userId,
      content: comment.content,
      isInterpretation: comment.isInterpretation || false,
      likes: 0,
      parentCommentId: comment.parentCommentId || null,
      createdAt: now,
      updatedAt: now,
    };

    this.dreamComments.set(id, newComment);
    return newComment;
  }

  async getDreamCommentsBySharedDreamId(
    sharedDreamId: number,
  ): Promise<DreamComment[]> {
    return Array.from(this.dreamComments.values())
      .filter((comment) => comment.sharedDreamId === sharedDreamId)
      .sort((a, b) => {
        // Sort top-level comments by creation time (newest first)
        if (!a.parentCommentId && !b.parentCommentId) {
          return b.createdAt.getTime() - a.createdAt.getTime();
        }
        // Put replies after their parent comments
        if (a.parentCommentId && !b.parentCommentId) return 1;
        if (!a.parentCommentId && b.parentCommentId) return -1;

        // If both are replies, sort by creation time (oldest first)
        return a.createdAt.getTime() - b.createdAt.getTime();
      });
  }

  async getDreamComment(id: number): Promise<DreamComment | undefined> {
    return this.dreamComments.get(id);
  }

  async updateDreamComment(
    id: number,
    comment: Partial<InsertDreamComment>,
  ): Promise<DreamComment | undefined> {
    const existingComment = this.dreamComments.get(id);
    if (!existingComment) {
      return undefined;
    }

    const updatedComment = {
      ...existingComment,
      ...comment,
      updatedAt: new Date(),
    };

    this.dreamComments.set(id, updatedComment);
    return updatedComment;
  }

  async deleteDreamComment(id: number): Promise<boolean> {
    // Delete all likes associated with this comment
    Array.from(this.commentLikes.values())
      .filter((like) => like.commentId === id)
      .forEach((like) => this.commentLikes.delete(like.id));

    // Delete all child comments (replies)
    Array.from(this.dreamComments.values())
      .filter((comment) => comment.parentCommentId === id)
      .forEach((comment) => this.deleteDreamComment(comment.id));

    return this.dreamComments.delete(id);
  }

  // Comment Likes
  async createCommentLike(like: InsertCommentLike): Promise<CommentLike> {
    const id = this.currentCommentLikeId++;

    const newLike: CommentLike = {
      id,
      commentId: like.commentId,
      userId: like.userId,
      createdAt: new Date(),
    };

    this.commentLikes.set(id, newLike);

    // Increment the likes count on the comment
    await this.updateCommentLikesCount(like.commentId);

    return newLike;
  }

  async getCommentLike(
    commentId: number,
    userId: number,
  ): Promise<CommentLike | undefined> {
    return Array.from(this.commentLikes.values()).find(
      (like) => like.commentId === commentId && like.userId === userId,
    );
  }

  async deleteCommentLike(id: number): Promise<boolean> {
    const like = this.commentLikes.get(id);
    if (like) {
      const result = this.commentLikes.delete(id);

      // Update the likes count on the comment
      await this.updateCommentLikesCount(like.commentId);

      return result;
    }
    return false;
  }

  async updateCommentLikesCount(commentId: number): Promise<number> {
    const comment = this.dreamComments.get(commentId);
    if (!comment) {
      return 0;
    }

    const likesCount = Array.from(this.commentLikes.values()).filter(
      (like) => like.commentId === commentId,
    ).length;

    const updatedComment = {
      ...comment,
      likes: likesCount,
    };

    this.dreamComments.set(commentId, updatedComment);
    return likesCount;
  }

  // Dream Challenges
  async createDreamChallenge(
    challenge: InsertDreamChallenge,
  ): Promise<DreamChallenge> {
    const id = this.currentDreamChallengeId++;
    const now = new Date();

    const newChallenge: DreamChallenge = {
      id,
      title: challenge.title,
      description: challenge.description,
      startDate: new Date(challenge.startDate),
      endDate: new Date(challenge.endDate),
      isActive: challenge.isActive !== undefined ? challenge.isActive : true,
      createdBy: challenge.createdBy,
      prizes: challenge.prizes || null,
      rules: challenge.rules,
      createdAt: now,
      updatedAt: now,
    };

    this.dreamChallenges.set(id, newChallenge);
    return newChallenge;
  }

  async getDreamChallenge(id: number): Promise<DreamChallenge | undefined> {
    return this.dreamChallenges.get(id);
  }

  async getActiveDreamChallenges(): Promise<DreamChallenge[]> {
    const now = new Date();

    return Array.from(this.dreamChallenges.values())
      .filter(
        (challenge) =>
          challenge.isActive &&
          challenge.startDate <= now &&
          challenge.endDate >= now,
      )
      .sort((a, b) => b.endDate.getTime() - a.endDate.getTime());
  }

  async getAllDreamChallenges(): Promise<DreamChallenge[]> {
    return Array.from(this.dreamChallenges.values()).sort(
      (a, b) => b.createdAt.getTime() - a.createdAt.getTime(),
    );
  }

  async updateDreamChallenge(
    id: number,
    challenge: Partial<InsertDreamChallenge>,
  ): Promise<DreamChallenge | undefined> {
    const existingChallenge = this.dreamChallenges.get(id);
    if (!existingChallenge) {
      return undefined;
    }

    const updatedChallenge = {
      ...existingChallenge,
      ...challenge,
      startDate: challenge.startDate
        ? new Date(challenge.startDate)
        : existingChallenge.startDate,
      endDate: challenge.endDate
        ? new Date(challenge.endDate)
        : existingChallenge.endDate,
      updatedAt: new Date(),
    };

    this.dreamChallenges.set(id, updatedChallenge);
    return updatedChallenge;
  }

  async deleteDreamChallenge(id: number): Promise<boolean> {
    // Delete all submissions for this challenge
    Array.from(this.challengeSubmissions.values())
      .filter((submission) => submission.challengeId === id)
      .forEach((submission) => this.challengeSubmissions.delete(submission.id));

    return this.dreamChallenges.delete(id);
  }

  // Challenge Submissions
  async createChallengeSubmission(
    submission: InsertChallengeSubmission,
  ): Promise<ChallengeSubmission> {
    const id = this.currentChallengeSubmissionId++;

    const newSubmission: ChallengeSubmission = {
      id,
      challengeId: submission.challengeId,
      sharedDreamId: submission.sharedDreamId,
      userId: submission.userId,
      submissionDate: new Date(),
      status: submission.status || "pending",
      notes: submission.notes || null,
      createdAt: new Date(),
    };

    this.challengeSubmissions.set(id, newSubmission);
    return newSubmission;
  }

  async getChallengeSubmissionsByUserId(
    userId: number,
  ): Promise<ChallengeSubmission[]> {
    return Array.from(this.challengeSubmissions.values())
      .filter((submission) => submission.userId === userId)
      .sort((a, b) => b.submissionDate.getTime() - a.submissionDate.getTime());
  }

  async getChallengeSubmissionsByChallengeId(
    challengeId: number,
  ): Promise<ChallengeSubmission[]> {
    return Array.from(this.challengeSubmissions.values())
      .filter((submission) => submission.challengeId === challengeId)
      .sort((a, b) => b.submissionDate.getTime() - a.submissionDate.getTime());
  }

  async getChallengeSubmission(
    id: number,
  ): Promise<ChallengeSubmission | undefined> {
    return this.challengeSubmissions.get(id);
  }

  async updateChallengeSubmission(
    id: number,
    submission: Partial<InsertChallengeSubmission>,
  ): Promise<ChallengeSubmission | undefined> {
    const existingSubmission = this.challengeSubmissions.get(id);
    if (!existingSubmission) {
      return undefined;
    }

    const updatedSubmission = {
      ...existingSubmission,
      ...submission,
    };

    this.challengeSubmissions.set(id, updatedSubmission);
    return updatedSubmission;
  }

  async deleteChallengeSubmission(id: number): Promise<boolean> {
    return this.challengeSubmissions.delete(id);
  }

  // AI Assistant methods

  async createAssistantConversation(
    conversation: InsertAssistantConversation,
  ): Promise<AssistantConversation> {
    const id = this.currentAssistantConversationId++;
    const now = new Date();

    const newConversation: AssistantConversation = {
      id,
      userId: conversation.userId,
      title: conversation.title || "Neue Unterhaltung",
      summary: null,
      createdAt: now,
      updatedAt: now,
      isArchived: conversation.isArchived || false,
    };

    this.assistantConversations.set(id, newConversation);
    return newConversation;
  }

  async getAssistantConversation(
    id: number,
  ): Promise<AssistantConversation | undefined> {
    return this.assistantConversations.get(id);
  }

  async getAssistantConversationsByUserId(
    userId: number,
  ): Promise<AssistantConversation[]> {
    const conversations: AssistantConversation[] = [];

    this.assistantConversations.forEach((conversation) => {
      if (conversation.userId === userId) {
        conversations.push(conversation);
      }
    });

    // Sort by most recently updated
    return conversations.sort(
      (a, b) =>
        new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
    );
  }

  async updateAssistantConversation(
    id: number,
    conversation: Partial<InsertAssistantConversation>,
  ): Promise<AssistantConversation | undefined> {
    const existingConversation = this.assistantConversations.get(id);

    if (!existingConversation) {
      return undefined;
    }

    const updatedConversation: AssistantConversation = {
      ...existingConversation,
      title: conversation.title ?? existingConversation.title,
      updatedAt: new Date(),
      isArchived: conversation.isArchived ?? existingConversation.isArchived,
    };

    this.assistantConversations.set(id, updatedConversation);
    return updatedConversation;
  }

  async deleteAssistantConversation(id: number): Promise<boolean> {
    // Delete all messages in this conversation first
    this.assistantMessages.forEach((message, msgId) => {
      if (message.conversationId === id) {
        this.assistantMessages.delete(msgId);
      }
    });

    // Then delete the conversation itself
    return this.assistantConversations.delete(id);
  }

  async createAssistantMessage(
    message: InsertAssistantMessage,
  ): Promise<AssistantMessage> {
    const id = this.currentAssistantMessageId++;
    const now = new Date();

    const newMessage: AssistantMessage = {
      id,
      conversationId: message.conversationId,
      content: message.content,
      role: message.role,
      timestamp: now,
      relatedDreamId: message.relatedDreamId || null,
      relatedJournalId: message.relatedJournalId || null,
      metadata: message.metadata || null,
    };

    this.assistantMessages.set(id, newMessage);

    // Update conversation's updatedAt timestamp
    const conversation = this.assistantConversations.get(
      message.conversationId,
    );
    if (conversation) {
      conversation.updatedAt = now;
      this.assistantConversations.set(message.conversationId, conversation);
    }

    return newMessage;
  }

  async getAssistantMessagesByConversationId(
    conversationId: number,
  ): Promise<AssistantMessage[]> {
    const messages: AssistantMessage[] = [];

    this.assistantMessages.forEach((message) => {
      if (message.conversationId === conversationId) {
        messages.push(message);
      }
    });

    // Sort by timestamp (oldest first)
    return messages.sort(
      (a, b) =>
        new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime(),
    );
  }

  async getAssistantMessageThread(
    conversationId: number,
    limit?: number,
  ): Promise<AssistantMessage[]> {
    const messages =
      await this.getAssistantMessagesByConversationId(conversationId);

    if (limit) {
      return messages.slice(0, limit);
    }

    return messages;
  }

  async processAssistantChatRequest(
    userId: number,
    request: ChatRequest,
  ): Promise<ChatResponse> {
    let conversationId = request.conversationId;
    let conversation: AssistantConversation | undefined;

    try {
      // If no conversation ID is provided, create a new conversation
      if (!conversationId) {
        const newConversation: InsertAssistantConversation = {
          userId,
          title: "Neue Unterhaltung",
          isArchived: false,
        };

        conversation = await this.createAssistantConversation(newConversation);
        conversationId = conversation.id;
      } else {
        // Verify the conversation exists and belongs to the user
        conversation = await this.getAssistantConversation(conversationId);

        if (!conversation) {
          throw new Error("Conversation not found");
        }

        if (conversation.userId !== userId) {
          throw new Error("Unauthorized access to conversation");
        }
      }

      // Save the user message
      const userMessage = await this.createAssistantMessage({
        conversationId,
        content: request.message,
        role: "user",
        relatedDreamId: request.relatedDreamId,
        relatedJournalId: request.relatedJournalId,
      });

      // Get related content if needed
      let relatedContent: any = null;
      let contextPrompt = "";

      if (request.relatedDreamId) {
        const dream = await this.getDream(request.relatedDreamId);

        if (dream && dream.userId === userId) {
          relatedContent = dream;
          contextPrompt = `Bezüglich des Traums "${dream.title}" vom ${dream.date?.toLocaleDateString()}:\n${dream.content}\n\n`;

          // If there's analysis, add it to the context
          if (dream.analysis) {
            try {
              const analysis = JSON.parse(dream.analysis);
              contextPrompt += `Traumanalyse: ${analysis.interpretation || "Keine Interpretation verfügbar."}\n\n`;
            } catch (e) {
              // Ignore parsing errors
            }
          }
        }
      } else if (request.relatedJournalId) {
        const journal = await this.getJournalEntry(request.relatedJournalId);

        if (journal && journal.userId === userId) {
          relatedContent = journal;
          contextPrompt = `Bezüglich des Tagebucheintrags "${journal.title}" vom ${journal.date?.toLocaleDateString()}:\n${journal.content}\n\n`;
        }
      }

      // Get conversation history for context
      const conversations =
        await this.getAssistantMessagesByConversationId(conversationId);
      const historyPrompt = conversations
        .map(
          (msg) =>
            `${msg.role === "user" ? "Benutzer" : "Assistent"}: ${msg.content}`,
        )
        .join("\n");

      // Generate AI response
      const messageForAI = `${contextPrompt}${request.message}`;
      console.log("Sending message to OpenAI:", messageForAI);

      // Call the OpenAI API
      const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

      try {
        const completion = await openai.chat.completions.create({
          model: "gpt-4o",
          messages: [
            {
              role: "system",
              content: `Du bist ein hilfreicher Assistent für Traumdeutung und Traumforschung. 
              
  Verwende die folgende Anleitung für deine Antworten:
  
  1. Sei einfühlsam und verständnisvoll - Träume können tiefgreifende persönliche Bedeutung haben.
  2. Verbinde deine Antworten mit wissenschaftlichen Erkenntnissen über Träume und Schlaf, wenn möglich.
  3. Beziehe dich auf psychologische Perspektiven (Jung, Freud, etc.), aber betone die Subjektivität der Traumdeutung.
  4. Wenn der Benutzer einen bestimmten Traum erwähnt, gehe auf den emotionalen Gehalt ein und biete mögliche Interpretationen an.
  5. Erwähne bei Bedarf kulturübergreifende Interpretationen von Traumsymbolen.
  6. Gib keine medizinischen Diagnosen und verweise bei gesundheitsbezogenen Fragen auf Fachleute.
  7. Halte Antworten knapp, aber informativ - höchstens 2-3 Absätze.
  8. Präsentiere Interpretationen immer als Möglichkeiten, nicht als definitive Wahrheiten.
  9. Achte auf kulturellen Kontext bei deinen Interpretationen.
  10. Vermittle eine ausgewogene Perspektive zwischen wissenschaftlicher und spiritueller Traumdeutung.
  
  Bisherige Konversation:
  ${historyPrompt}`,
            },
            {
              role: "user",
              content: messageForAI,
            },
          ],
        });

        const aiResponse =
          completion.choices[0].message.content ||
          "Entschuldigung, ich konnte deine Nachricht nicht verarbeiten.";

        // Save the assistant's response
        const assistantMessage = await this.createAssistantMessage({
          conversationId,
          content: aiResponse,
          role: "assistant",
          relatedDreamId: request.relatedDreamId,
          relatedJournalId: request.relatedJournalId,
        });

        // Update conversation title if it's new (only 2 messages including this one)
        if (conversation && conversations.length === 1) {
          try {
            // Generate a title based on the first user message
            const titleCompletion = await openai.chat.completions.create({
              model: "gpt-4o",
              messages: [
                {
                  role: "system",
                  content:
                    "Erstelle einen kurzen, aussagekräftigen Titel (max. 5 Wörter) für das folgende Gespräch. Gib nur den Titel zurück, ohne Anführungszeichen oder zusätzlichen Text.",
                },
                {
                  role: "user",
                  content: request.message,
                },
              ],
            });

            const generatedTitle =
              titleCompletion.choices[0].message.content || "Neue Unterhaltung";

            await this.updateAssistantConversation(conversationId, {
              title: generatedTitle,
            });

            // Update the conversation object for the response
            conversation.title = generatedTitle;
          } catch (e) {
            console.error("Error generating title:", e);
            // Continue even if title generation fails
          }
        }

        return {
          conversationId,
          message: assistantMessage,
          relatedContent,
        };
      } catch (error) {
        console.error("Error calling OpenAI API:", error);

        // Create an error message
        const errorMessage = await this.createAssistantMessage({
          conversationId,
          content:
            "Entschuldigung, es gab ein Problem bei der Verarbeitung deiner Anfrage. Bitte versuche es später noch einmal.",
          role: "assistant",
          relatedDreamId: request.relatedDreamId,
          relatedJournalId: request.relatedJournalId,
        });

        return {
          conversationId,
          message: errorMessage,
          relatedContent,
        };
      }
    } catch (error) {
      console.error("Error processing chat request:", error);

      // If we have a conversation ID, create an error message
      if (conversationId) {
        const errorMessage = await this.createAssistantMessage({
          conversationId,
          content:
            "Entschuldigung, es gab ein Problem bei der Verarbeitung deiner Anfrage. Bitte versuche es später noch einmal.",
          role: "assistant",
        });

        return {
          conversationId,
          message: errorMessage,
        };
      }

      // If we don't even have a conversation ID, create a new conversation with an error message
      const newConversation = await this.createAssistantConversation({
        userId,
        title: "Fehlerhafte Unterhaltung",
        isArchived: false,
      });

      const errorMessage = await this.createAssistantMessage({
        conversationId: newConversation.id,
        content:
          "Entschuldigung, es gab ein Problem bei der Verarbeitung deiner Anfrage. Bitte versuche es später noch einmal.",
        role: "assistant",
      });

      return {
        conversationId: newConversation.id,
        message: errorMessage,
      };
    }
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
      createTableIfMissing: true,
    });

    // Tabellen initialisieren
    this.initTables()
      .then(() => {
        console.log("Database tables initialized");

        // Vordefinierte Achievements anlegen
        this.initializeDefaultAchievements()
          .then(() => {
            console.log("Default achievements created");
          })
          .catch((err) => {
            console.error("Error creating default achievements:", err);
          });
      })
      .catch((err) => {
        console.error("Error initializing database tables:", err);
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
        mood_notes TEXT,
        mood_data JSONB
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
    const result = await this.pool.query("SELECT COUNT(*) FROM achievements");
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
        threshold: 1,
      } as any,
    });

    await this.createAchievement({
      name: "Traumtagebuch-Starter",
      description: "Zeichne 5 Träume auf",
      category: "beginner" as any,
      difficulty: "bronze" as any,
      iconName: "book",
      criteria: {
        type: "dreamCount" as any,
        threshold: 5,
      } as any,
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
        threshold: 3,
      } as any,
    });

    await this.createAchievement({
      name: "Traum-Enthusiast",
      description: "Zeichne Träume an 7 aufeinanderfolgenden Tagen auf",
      category: "consistency" as any,
      difficulty: "gold" as any,
      iconName: "award",
      criteria: {
        type: "streakDays" as any,
        threshold: 7,
      } as any,
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
        threshold: 5,
      } as any,
    });

    await this.createAchievement({
      name: "Bildliche Erinnerung",
      description: "Füge 3 Bildern zu deinen Traumeinträgen hinzu",
      category: "exploration" as any,
      difficulty: "bronze" as any,
      iconName: "image",
      criteria: {
        type: "imageCount" as any,
        threshold: 3,
      } as any,
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
        threshold: 5,
      } as any,
    });

    await this.createAchievement({
      name: "Traumdeuter",
      description: "Analysiere 3 deiner Träume mit KI",
      category: "insight" as any,
      difficulty: "silver" as any,
      iconName: "brain",
      criteria: {
        type: "analysisCount" as any,
        threshold: 3,
      } as any,
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
        threshold: 30,
      } as any,
    });

    await this.createAchievement({
      name: "Detaillierter Träumer",
      description:
        "Schreibe 5 ausführliche Traumeinträge (mindestens 200 Zeichen)",
      category: "mastery" as any,
      difficulty: "silver" as any,
      iconName: "file-text",
      criteria: {
        type: "dreamLength" as any,
        threshold: 5,
        additionalParams: {
          minLength: 200,
        },
      } as any,
    });
  }

  // User methods
  async getUser(id: number): Promise<any | undefined> {
    const result = await this.pool.query("SELECT * FROM users WHERE id = $1", [
      id,
    ]);
    return result.rows[0] || undefined;
  }

  async getUserById(id: number): Promise<any | undefined> {
    const result = await this.pool.query("SELECT * FROM users WHERE id = $1", [
      id,
    ]);
    return result.rows[0] || undefined;
  }

  async getUserByUsername(username: string): Promise<any | undefined> {
    const result = await this.pool.query(
      "SELECT * FROM users WHERE username = $1",
      [username],
    );
    return result.rows[0] || undefined;
  }

  async updateUser(
    id: number,
    userData: Partial<{ name?: string; email?: string }>,
  ): Promise<any | undefined> {
    // Build the SET clause dynamically based on provided fields
    const updates = [];
    const values = [];
    let paramIndex = 1;

    if (userData.name !== undefined) {
      updates.push(`name = $${paramIndex}`);
      values.push(userData.name);
      paramIndex++;
    }

    if (userData.email !== undefined) {
      updates.push(`email = $${paramIndex}`);
      values.push(userData.email);
      paramIndex++;
    }

    // If no fields to update, return the current user
    if (updates.length === 0) {
      return this.getUser(id);
    }

    // Add the ID as the last parameter
    values.push(id);

    const result = await this.pool.query(
      `UPDATE users SET ${updates.join(", ")} WHERE id = $${paramIndex} RETURNING *`,
      values,
    );

    return result.rows[0] || undefined;
  }

  async createUser(user: any): Promise<any> {
    const result = await this.pool.query(
      "INSERT INTO users (username, password) VALUES ($1, $2) RETURNING *",
      [user.username, user.password],
    );
    return result.rows[0];
  }

  // Dream methods
  async createDream(dream: InsertDream): Promise<Dream> {
    const result = await this.pool.query(
      `INSERT INTO dreams 
        (user_id, title, content, image_url, date, tags, mood_before_sleep, mood_after_wakeup, mood_notes, mood_data) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) 
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
        dream.moodNotes || null,
        JSON.stringify(dream.moodData || {}), // Handle undefined moodData
      ],
    );

    // Convert DB snake_case names to camelCase for API
    const newDream = this.transformDreamDbToApi(result.rows[0]);
    return newDream;
  }

  async getDreams(): Promise<Dream[]> {
    const result = await this.pool.query(
      "SELECT * FROM dreams ORDER BY date DESC",
    );
    return result.rows.map((dream) => this.transformDreamDbToApi(dream));
  }

  async getDreamsByUserId(userId: number): Promise<Dream[]> {
    const result = await this.pool.query(
      "SELECT * FROM dreams WHERE user_id = $1 ORDER BY date DESC",
      [userId],
    );
    return result.rows.map((dream) => this.transformDreamDbToApi(dream));
  }

  async getDream(id: number): Promise<Dream | undefined> {
    const result = await this.pool.query("SELECT * FROM dreams WHERE id = $1", [
      id,
    ]);
    return result.rows[0]
      ? this.transformDreamDbToApi(result.rows[0])
      : undefined;
  }

  async updateDream(
    id: number,
    dreamUpdate: Partial<InsertDream>,
  ): Promise<Dream | undefined> {
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

    if (dreamUpdate.moodData !== undefined) {
      updates.push(`mood_data = $${paramCounter++}`);
      values.push(JSON.stringify(dreamUpdate.moodData));
    }

    // If there's nothing to update, return the original dream
    if (updates.length === 0) {
      return this.getDream(id);
    }

    // Add the id parameter
    values.push(id);

    const result = await this.pool.query(
      `UPDATE dreams SET ${updates.join(", ")} WHERE id = $${paramCounter} RETURNING *`,
      values,
    );

    return result.rows[0]
      ? this.transformDreamDbToApi(result.rows[0])
      : undefined;
  }

  async deleteDream(id: number): Promise<boolean> {
    const result = await this.pool.query(
      "DELETE FROM dreams WHERE id = $1 RETURNING id",
      [id],
    );
    return result.rows.length > 0;
  }

  async saveDreamAnalysis(
    dreamId: number,
    analysis: AnalysisResponse,
  ): Promise<Dream> {
    const analysisStr = JSON.stringify(analysis);

    const result = await this.pool.query(
      "UPDATE dreams SET analysis = $1 WHERE id = $2 RETURNING *",
      [analysisStr, dreamId],
    );

    if (result.rows.length === 0) {
      throw new Error(`Dream with ID ${dreamId} not found`);
    }

    return this.transformDreamDbToApi(result.rows[0]);
  }

  // Achievement methods
  async createAchievement(
    achievement: InsertAchievement,
  ): Promise<Achievement> {
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
        JSON.stringify(achievement.criteria),
      ],
    );

    return this.transformAchievementDbToApi(result.rows[0]);
  }

  async getAchievement(id: number): Promise<Achievement | undefined> {
    const result = await this.pool.query(
      "SELECT * FROM achievements WHERE id = $1",
      [id],
    );
    return result.rows[0]
      ? this.transformAchievementDbToApi(result.rows[0])
      : undefined;
  }

  async getAllAchievements(): Promise<Achievement[]> {
    const result = await this.pool.query("SELECT * FROM achievements");
    return result.rows.map((achievement) =>
      this.transformAchievementDbToApi(achievement),
    );
  }

  // User Achievement methods
  async createUserAchievement(
    userAchievement: InsertUserAchievement,
  ): Promise<UserAchievement> {
    const result = await this.pool.query(
      `INSERT INTO user_achievements 
        (user_id, achievement_id, progress, is_completed) 
       VALUES ($1, $2, $3, $4) 
       RETURNING *`,
      [
        userAchievement.userId,
        userAchievement.achievementId,
        JSON.stringify(userAchievement.progress),
        userAchievement.isCompleted || false,
      ],
    );

    return this.transformUserAchievementDbToApi(result.rows[0]);
  }

  async getUserAchievements(userId: number): Promise<UserAchievement[]> {
    const result = await this.pool.query(
      "SELECT * FROM user_achievements WHERE user_id = $1 ORDER BY unlocked_at DESC",
      [userId],
    );
    return result.rows.map((ua) => this.transformUserAchievementDbToApi(ua));
  }

  async getUserAchievement(
    userId: number,
    achievementId: number,
  ): Promise<UserAchievement | undefined> {
    const result = await this.pool.query(
      "SELECT * FROM user_achievements WHERE user_id = $1 AND achievement_id = $2",
      [userId, achievementId],
    );
    return result.rows[0]
      ? this.transformUserAchievementDbToApi(result.rows[0])
      : undefined;
  }

  async updateUserAchievementProgress(
    id: number,
    progress: AchievementProgress,
  ): Promise<UserAchievement | undefined> {
    const isCompleted = progress.currentValue >= progress.requiredValue;

    const result = await this.pool.query(
      "UPDATE user_achievements SET progress = $1, is_completed = $2 WHERE id = $3 RETURNING *",
      [JSON.stringify(progress), isCompleted, id],
    );

    return result.rows[0]
      ? this.transformUserAchievementDbToApi(result.rows[0])
      : undefined;
  }

  async completeUserAchievement(
    id: number,
  ): Promise<UserAchievement | undefined> {
    const result = await this.pool.query(
      "UPDATE user_achievements SET is_completed = true WHERE id = $1 RETURNING *",
      [id],
    );

    return result.rows[0]
      ? this.transformUserAchievementDbToApi(result.rows[0])
      : undefined;
  }

  async getLatestUserAchievements(
    userId: number,
    limit: number,
  ): Promise<UserAchievement[]> {
    const result = await this.pool.query(
      "SELECT * FROM user_achievements WHERE user_id = $1 AND is_completed = true ORDER BY unlocked_at DESC LIMIT $2",
      [userId, limit],
    );
    return result.rows.map((ua) => this.transformUserAchievementDbToApi(ua));
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
        entry.relatedDreamIds || null,
      ],
    );

    return this.transformJournalEntryDbToApi(result.rows[0]);
  }

  async getJournalEntriesByUserId(userId: number): Promise<JournalEntry[]> {
    const result = await this.pool.query(
      "SELECT * FROM journal_entries WHERE user_id = $1 ORDER BY date DESC",
      [userId],
    );
    return result.rows.map((entry) => this.transformJournalEntryDbToApi(entry));
  }

  async getJournalEntry(id: number): Promise<JournalEntry | undefined> {
    const result = await this.pool.query(
      "SELECT * FROM journal_entries WHERE id = $1",
      [id],
    );
    return result.rows[0]
      ? this.transformJournalEntryDbToApi(result.rows[0])
      : undefined;
  }

  async updateJournalEntry(
    id: number,
    entryUpdate: Partial<InsertJournalEntry>,
  ): Promise<JournalEntry | undefined> {
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

    // If there's nothing to update, return the existing entry
    if (updates.length === 0) {
      return this.getJournalEntry(id);
    }

    // Add the id to the values array
    values.push(id);

    const query = `
      UPDATE journal_entries
      SET ${updates.join(", ")}
      WHERE id = $${paramCounter}
      RETURNING *
    `;

    const result = await this.pool.query(query, values);
    return result.rows[0]
      ? this.transformJournalEntryDbToApi(result.rows[0])
      : undefined;
  }

  async deleteJournalEntry(id: number): Promise<boolean> {
    const result = await this.pool.query(
      "DELETE FROM journal_entries WHERE id = $1 RETURNING id",
      [id],
    );
    return result.rowCount > 0;
  }

  // Dream content entries
  async createDreamContentEntry(
    entry: InsertDreamContentEntry,
  ): Promise<DreamContentEntry> {
    const result = await this.pool.query(
      `
      INSERT INTO dream_content_entries (
        title, summary, content, content_type, url, author, featured, view_count, 
        image_url, video_url, external_links, category, related_content_ids
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
      RETURNING *
    `,
      [
        entry.title,
        entry.summary,
        entry.content,
        entry.contentType,
        entry.url || null,
        entry.author || null,
        entry.featured || false,
        0, // Initial view count
        entry.imageUrl || null,
        entry.videoUrl || null,
        entry.externalLinks || [],
        entry.category || null,
        entry.relatedContentIds || [],
      ],
    );

    return this.transformDreamContentEntryDbToApi(result.rows[0]);
  }

  async getDreamContentEntries(): Promise<DreamContentEntry[]> {
    const result = await this.pool.query(
      "SELECT * FROM dream_content_entries ORDER BY created_at DESC",
    );
    return result.rows.map((entry) =>
      this.transformDreamContentEntryDbToApi(entry),
    );
  }

  async getDreamContentEntry(
    id: number,
  ): Promise<DreamContentEntry | undefined> {
    const result = await this.pool.query(
      "SELECT * FROM dream_content_entries WHERE id = $1",
      [id],
    );
    return result.rows[0]
      ? this.transformDreamContentEntryDbToApi(result.rows[0])
      : undefined;
  }

  async updateDreamContentEntry(
    id: number,
    entry: Partial<InsertDreamContentEntry>,
  ): Promise<DreamContentEntry | undefined> {
    const updates: string[] = [];
    const values: any[] = [];
    let paramCounter = 1;

    if (entry.title !== undefined) {
      updates.push(`title = $${paramCounter++}`);
      values.push(entry.title);
    }

    if (entry.summary !== undefined) {
      updates.push(`summary = $${paramCounter++}`);
      values.push(entry.summary);
    }

    if (entry.content !== undefined) {
      updates.push(`content = $${paramCounter++}`);
      values.push(entry.content);
    }

    if (entry.contentType !== undefined) {
      updates.push(`content_type = $${paramCounter++}`);
      values.push(entry.contentType);
    }

    if (entry.url !== undefined) {
      updates.push(`url = $${paramCounter++}`);
      values.push(entry.url);
    }

    if (entry.author !== undefined) {
      updates.push(`author = $${paramCounter++}`);
      values.push(entry.author);
    }

    if (entry.featured !== undefined) {
      updates.push(`featured = $${paramCounter++}`);
      values.push(entry.featured);
    }

    if (entry.imageUrl !== undefined) {
      updates.push(`image_url = $${paramCounter++}`);
      values.push(entry.imageUrl);
    }

    if (entry.videoUrl !== undefined) {
      updates.push(`video_url = $${paramCounter++}`);
      values.push(entry.videoUrl);
    }

    if (entry.externalLinks !== undefined) {
      updates.push(`external_links = $${paramCounter++}`);
      values.push(entry.externalLinks);
    }

    if (entry.category !== undefined) {
      updates.push(`category = $${paramCounter++}`);
      values.push(entry.category);
    }

    if (entry.relatedContentIds !== undefined) {
      updates.push(`related_content_ids = $${paramCounter++}`);
      values.push(entry.relatedContentIds);
    }

    // Always update the updated_at timestamp
    updates.push(`updated_at = CURRENT_TIMESTAMP`);

    // If there's nothing to update, return the existing entry
    if (updates.length === 0) {
      return this.getDreamContentEntry(id);
    }

    // Add the id to the values array
    values.push(id);

    const query = `
      UPDATE dream_content_entries
      SET ${updates.join(", ")}
      WHERE id = $${paramCounter}
      RETURNING *
    `;

    const result = await this.pool.query(query, values);
    return result.rows[0]
      ? this.transformDreamContentEntryDbToApi(result.rows[0])
      : undefined;
  }

  async deleteDreamContentEntry(id: number): Promise<boolean> {
    const result = await this.pool.query(
      "DELETE FROM dream_content_entries WHERE id = $1 RETURNING id",
      [id],
    );
    return result.rowCount > 0;
  }

  async getFeaturedDreamContentEntries(
    limit: number,
  ): Promise<DreamContentEntry[]> {
    const result = await this.pool.query(
      "SELECT * FROM dream_content_entries WHERE featured = true ORDER BY created_at DESC LIMIT $1",
      [limit],
    );
    return result.rows.map((entry) =>
      this.transformDreamContentEntryDbToApi(entry),
    );
  }

  async getDreamContentEntriesByType(
    contentType: string,
  ): Promise<DreamContentEntry[]> {
    const result = await this.pool.query(
      "SELECT * FROM dream_content_entries WHERE content_type = $1 ORDER BY created_at DESC",
      [contentType],
    );
    return result.rows.map((entry) =>
      this.transformDreamContentEntryDbToApi(entry),
    );
  }

  async incrementDreamContentViewCount(
    id: number,
  ): Promise<DreamContentEntry | undefined> {
    const result = await this.pool.query(
      "UPDATE dream_content_entries SET view_count = view_count + 1 WHERE id = $1 RETURNING *",
      [id],
    );
    return result.rows[0]
      ? this.transformDreamContentEntryDbToApi(result.rows[0])
      : undefined;
  }

  // Content comments
  async createContentComment(
    comment: InsertContentComment,
  ): Promise<ContentComment> {
    const result = await this.pool.query(
      `
      INSERT INTO content_comments (
        content_id, user_id, text, parent_comment_id
      )
      VALUES ($1, $2, $3, $4)
      RETURNING *
    `,
      [
        comment.contentId,
        comment.userId,
        comment.text,
        comment.parentCommentId || null,
      ],
    );

    return this.transformContentCommentDbToApi(result.rows[0]);
  }

  async getContentCommentsByContentId(
    contentId: number,
  ): Promise<ContentComment[]> {
    const result = await this.pool.query(
      "SELECT * FROM content_comments WHERE content_id = $1 ORDER BY created_at ASC",
      [contentId],
    );
    return result.rows.map((comment) =>
      this.transformContentCommentDbToApi(comment),
    );
  }

  async deleteContentComment(id: number): Promise<boolean> {
    const result = await this.pool.query(
      "DELETE FROM content_comments WHERE id = $1 RETURNING id",
      [id],
    );
    return result.rowCount > 0;
  }

  // Helper methods for transforming database rows to API format
  private transformDreamContentEntryDbToApi(entry: any): DreamContentEntry {
    return {
      id: entry.id,
      title: entry.title,
      summary: entry.summary,
      content: entry.content,
      contentType: entry.content_type,
      url: entry.url,
      author: entry.author,
      featured: entry.featured,
      viewCount: entry.view_count,
      imageUrl: entry.image_url,
      videoUrl: entry.video_url,
      externalLinks: entry.external_links,
      category: entry.category,
      relatedContentIds: entry.related_content_ids,
      createdAt: entry.created_at,
      updatedAt: entry.updated_at,
    };
  }

  private transformContentCommentDbToApi(comment: any): ContentComment {
    return {
      id: comment.id,
      contentId: comment.content_id,
      userId: comment.user_id,
      text: comment.text,
      parentCommentId: comment.parent_comment_id,
      createdAt: comment.created_at,
      updatedAt: comment.updated_at,
    };
  }

  private transformJournalEntryDbToApi(entry: any): JournalEntry {
    return {
      id: entry.id,
      userId: entry.user_id,
      title: entry.title,
      content: entry.content,
      tags: entry.tags,
      mood: entry.mood,
      imageUrl: entry.image_url,
      isPrivate: entry.is_private,
      includeInAnalysis: entry.include_in_analysis,
      date: entry.date,
      createdAt: entry.created_at,
      updatedAt: entry.updated_at,
      relatedDreamIds: entry.related_dream_ids,
    };
  }

  private transformDreamDbToApi(dream: any): Dream {
    return {
      id: dream.id,
      userId: dream.user_id,
      title: dream.title,
      content: dream.content,
      date: dream.date,
      tags: dream.tags,
      mood: dream.mood,
      imageUrl: dream.image_url,
      isPrivate: dream.is_private,
      analysis: dream.analysis,
      createdAt: dream.created_at,
      updatedAt: dream.updated_at,
    };
  }

  private transformAchievementDbToApi(achievement: any): Achievement {
    return {
      id: achievement.id,
      name: achievement.name,
      description: achievement.description,
      criteria: achievement.criteria,
      iconUrl: achievement.icon_url,
      category: achievement.category,
      points: achievement.points,
      createdAt: achievement.created_at,
    };
  }

  private transformUserAchievementDbToApi(
    userAchievement: any,
  ): UserAchievement {
    return {
      id: userAchievement.id,
      userId: userAchievement.user_id,
      achievementId: userAchievement.achievement_id,
      completed: userAchievement.completed,
      progress: userAchievement.progress,
      earnedDate: userAchievement.earned_date,
      createdAt: userAchievement.created_at,
      updatedAt: userAchievement.updated_at,
    };
  }

  // User Symbol Favorites methods
  async createUserSymbolFavorite(
    favorite: InsertUserSymbolFavorite,
  ): Promise<UserSymbolFavorite> {
    try {
      const result = await this.pool.query(
        `INSERT INTO user_symbol_favorites (user_id, symbol_id, notes)
         VALUES ($1, $2, $3)
         RETURNING id, user_id, symbol_id, notes, created_at`,
        [favorite.userId, favorite.symbolId, favorite.notes],
      );

      return {
        id: result.rows[0].id,
        userId: result.rows[0].user_id,
        symbolId: result.rows[0].symbol_id,
        notes: result.rows[0].notes,
        createdAt: result.rows[0].created_at,
      };
    } catch (error) {
      console.error("Error creating user symbol favorite:", error);
      throw error;
    }
  }

  async getUserSymbolFavoritesByUserId(
    userId: number,
  ): Promise<UserSymbolFavorite[]> {
    try {
      console.log(
        `DatabaseStorage.getUserSymbolFavoritesByUserId called with userId: ${userId}`,
      );

      // First check if the table exists
      try {
        const tableCheck = await this.pool.query(
          `SELECT EXISTS (
            SELECT FROM information_schema.tables 
            WHERE table_schema = 'public'
            AND table_name = 'user_symbol_favorites'
          )`,
        );
        console.log("Table check result:", tableCheck.rows[0]);

        if (!tableCheck.rows[0].exists) {
          console.log(
            "user_symbol_favorites table does not exist, creating it now",
          );
          await this.pool.query(
            `CREATE TABLE IF NOT EXISTS user_symbol_favorites (
              id SERIAL PRIMARY KEY,
              user_id INTEGER NOT NULL,
              symbol_id INTEGER NOT NULL,
              notes TEXT,
              created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
              FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
              FOREIGN KEY (symbol_id) REFERENCES dream_symbols(id) ON DELETE CASCADE
            )`,
          );
          console.log("user_symbol_favorites table created successfully");
          return []; // Return empty array as the table was just created
        }
      } catch (tableError) {
        console.error("Error checking/creating table:", tableError);
      }

      const result = await this.pool.query(
        `SELECT usf.id, usf.user_id, usf.symbol_id, usf.notes, usf.created_at,
                ds.name as symbol_name, ds.general_meaning as symbol_meaning
         FROM user_symbol_favorites usf
         LEFT JOIN dream_symbols ds ON usf.symbol_id = ds.id
         WHERE usf.user_id = $1
         ORDER BY usf.created_at DESC`,
        [userId],
      );

      console.log(`Query result:`, result.rows);

      return result.rows.map((row) => ({
        id: row.id,
        userId: row.user_id,
        symbolId: row.symbol_id,
        notes: row.notes,
        createdAt: row.created_at,
        symbol: row.symbol_name
          ? {
              name: row.symbol_name,
              generalMeaning: row.symbol_meaning,
            }
          : null,
      }));
    } catch (error) {
      console.error("Error getting user symbol favorites:", error);
      console.error("Stack trace:", (error as Error).stack);
      // Return empty array instead of throwing to avoid breaking the app
      return [];
    }
  }

  async deleteUserSymbolFavorite(id: number): Promise<boolean> {
    try {
      const result = await this.pool.query(
        "DELETE FROM user_symbol_favorites WHERE id = $1 RETURNING id",
        [id],
      );

      return result.rows.length > 0;
    } catch (error) {
      console.error("Error deleting user symbol favorite:", error);
      throw error;
    }
  }

  // AI Assistant implementation

  async createAssistantConversation(
    conversation: InsertAssistantConversation,
  ): Promise<AssistantConversation> {
    const id = this.currentAssistantConversationId++;
    const now = new Date();

    const newConversation: AssistantConversation = {
      id,
      userId: conversation.userId,
      title: conversation.title || "Neue Unterhaltung",
      summary: null,
      createdAt: now,
      updatedAt: now,
      isArchived: conversation.isArchived || false,
    };

    this.assistantConversations.set(id, newConversation);
    return newConversation;
  }

  async getAssistantConversation(
    id: number,
  ): Promise<AssistantConversation | undefined> {
    return this.assistantConversations.get(id);
  }

  async getAssistantConversationsByUserId(
    userId: number,
  ): Promise<AssistantConversation[]> {
    return Array.from(this.assistantConversations.values())
      .filter((conv) => conv.userId === userId)
      .sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime()); // Sort by most recent
  }

  async updateAssistantConversation(
    id: number,
    conversation: Partial<InsertAssistantConversation>,
  ): Promise<AssistantConversation | undefined> {
    const existingConversation = this.assistantConversations.get(id);

    if (!existingConversation) {
      return undefined;
    }

    const updatedConversation: AssistantConversation = {
      ...existingConversation,
      title: conversation.title ?? existingConversation.title,
      isArchived: conversation.isArchived ?? existingConversation.isArchived,
      updatedAt: new Date(),
    };

    this.assistantConversations.set(id, updatedConversation);
    return updatedConversation;
  }

  async deleteAssistantConversation(id: number): Promise<boolean> {
    // Get all messages in this conversation to delete them too
    const messages = await this.getAssistantMessagesByConversationId(id);

    // Delete all the messages
    for (const message of messages) {
      this.assistantMessages.delete(message.id);
    }

    // Delete the conversation
    return this.assistantConversations.delete(id);
  }

  async createAssistantMessage(
    message: InsertAssistantMessage,
  ): Promise<AssistantMessage> {
    const id = this.currentAssistantMessageId++;
    const now = new Date();

    const newMessage: AssistantMessage = {
      id,
      conversationId: message.conversationId,
      content: message.content,
      role: message.role,
      timestamp: now,
      relatedDreamId: message.relatedDreamId || null,
      relatedJournalId: message.relatedJournalId || null,
      metadata: message.metadata || null,
    };

    this.assistantMessages.set(id, newMessage);

    // Update the conversation's updatedAt timestamp
    const conversation = this.assistantConversations.get(
      message.conversationId,
    );
    if (conversation) {
      conversation.updatedAt = now;
      this.assistantConversations.set(conversation.id, conversation);
    }

    return newMessage;
  }

  async getAssistantMessagesByConversationId(
    conversationId: number,
  ): Promise<AssistantMessage[]> {
    return Array.from(this.assistantMessages.values())
      .filter((msg) => msg.conversationId === conversationId)
      .sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime()); // Sort by timestamp
  }

  async getAssistantMessageThread(
    conversationId: number,
    limit?: number,
  ): Promise<AssistantMessage[]> {
    const messages =
      await this.getAssistantMessagesByConversationId(conversationId);

    if (limit && messages.length > limit) {
      return messages.slice(-limit); // Get only the most recent messages
    }

    return messages;
  }

  async processAssistantChatRequest(
    userId: number,
    request: ChatRequest,
  ): Promise<ChatResponse> {
    let conversationId = request.conversationId;
    let conversation: AssistantConversation | undefined;

    // If no conversation ID is provided, create a new conversation
    if (!conversationId) {
      conversation = await this.createAssistantConversation({
        userId,
        title: "Neue Unterhaltung", // Default title
        isArchived: false,
      });
      conversationId = conversation.id;
    } else {
      conversation = await this.getAssistantConversation(conversationId);

      // Check if the conversation exists and belongs to the user
      if (!conversation || conversation.userId !== userId) {
        throw new Error("Conversation not found or unauthorized");
      }
    }

    // Save the user message
    const userMessage = await this.createAssistantMessage({
      conversationId,
      content: request.message,
      role: "user",
      relatedDreamId: request.relatedDreamId,
      relatedJournalId: request.relatedJournalId,
    });

    try {
      // Fetch related content if needed
      let relatedContent: any = null;
      let contextPrompt = "";

      if (request.relatedDreamId) {
        const dream = await this.getDream(request.relatedDreamId);
        if (dream) {
          relatedContent = dream;
          contextPrompt = `Bezüglich des Traums "${dream.title}" vom ${dream.date.toLocaleDateString()}:\n${dream.content}\n\n`;

          // If there's analysis, add it to the context
          if (dream.analysis) {
            try {
              const analysis = JSON.parse(dream.analysis);
              contextPrompt += `Traumanalyse: ${analysis.interpretation || "Keine Interpretation verfügbar."}\n\n`;
            } catch (e) {
              // Ignore parsing errors
            }
          }
        }
      } else if (request.relatedJournalId) {
        const journal = await this.getJournalEntry(request.relatedJournalId);
        if (journal) {
          relatedContent = journal;
          contextPrompt = `Bezüglich des Tagebucheintrags "${journal.title}" vom ${journal.date.toLocaleDateString()}:\n${journal.content}\n\n`;
        }
      }

      // Prepare conversation history for context
      const conversationHistory = await this.getAssistantMessageThread(
        conversationId,
        10,
      );
      const historyPrompt = conversationHistory
        .map(
          (msg) =>
            `${msg.role === "user" ? "Benutzer" : "Assistent"}: ${msg.content}`,
        )
        .join("\n");

      // Generate AI response
      const messageForAI = `${contextPrompt}${request.message}`;
      console.log("Sending message to OpenAI:", messageForAI);

      // Call the OpenAI API
      const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
      const completion = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content: `Du bist ein hilfreicher Assistent für Traumdeutung und Traumforschung. 
            
Verwende die folgende Anleitung für deine Antworten:

1. Sei einfühlsam und verständnisvoll - Träume können tiefgreifende persönliche Bedeutung haben.
2. Verbinde deine Antworten mit wissenschaftlichen Erkenntnissen über Träume und Schlaf, wenn möglich.
3. Beziehe dich auf psychologische Perspektiven (Jung, Freud, etc.), aber betone die Subjektivität der Traumdeutung.
4. Wenn der Benutzer einen bestimmten Traum erwähnt, gehe auf den emotionalen Gehalt ein und biete mögliche Interpretationen an.
5. Erwähne bei Bedarf kulturübergreifende Interpretationen von Traumsymbolen.
6. Gib keine medizinischen Diagnosen und verweise bei gesundheitsbezogenen Fragen auf Fachleute.
7. Halte Antworten knapp, aber informativ - höchstens 2-3 Absätze.
8. Präsentiere Interpretationen immer als Möglichkeiten, nicht als definitive Wahrheiten.
9. Achte auf kulturellen Kontext bei deinen Interpretationen.
10. Vermittle eine ausgewogene Perspektive zwischen wissenschaftlicher und spiritueller Traumdeutung.

Bisherige Konversation:
${historyPrompt}`,
          },
          {
            role: "user",
            content: messageForAI,
          },
        ],
      });

      const aiResponse =
        completion.choices[0].message.content ||
        "Entschuldigung, ich konnte deine Nachricht nicht verarbeiten.";

      // Save the assistant's response
      const assistantMessage = await this.createAssistantMessage({
        conversationId,
        content: aiResponse,
        role: "assistant",
        relatedDreamId: request.relatedDreamId,
        relatedJournalId: request.relatedJournalId,
      });

      // Update conversation title if it's new
      if (conversation && conversationHistory.length === 0) {
        // Generate a title based on the first user message
        const titleCompletion = await openai.chat.completions.create({
          model: "gpt-4o",
          messages: [
            {
              role: "system",
              content:
                "Erstelle einen kurzen, aussagekräftigen Titel (max. 5 Wörter) für das folgende Gespräch. Gib nur den Titel zurück, ohne Anführungszeichen oder zusätzlichen Text.",
            },
            {
              role: "user",
              content: request.message,
            },
          ],
        });

        const generatedTitle =
          titleCompletion.choices[0].message.content || "Neue Unterhaltung";
        await this.updateAssistantConversation(conversationId, {
          title: generatedTitle,
        });
      }

      return {
        conversationId,
        message: assistantMessage,
        relatedContent,
      };
    } catch (error) {
      console.error("Error processing assistant chat request:", error);

      // Create an error response message
      const errorMessage = await this.createAssistantMessage({
        conversationId,
        content:
          "Entschuldigung, es gab ein Problem bei der Verarbeitung deiner Anfrage. Bitte versuche es später noch einmal.",
        role: "assistant",
      });

      return {
        conversationId,
        message: errorMessage,
      };
    }
  }

  // AI Assistant methods

  async createAssistantConversation(
    conversation: InsertAssistantConversation,
  ): Promise<AssistantConversation> {
    try {
      const now = new Date();
      const result = await this.pool.query(
        `INSERT INTO assistant_conversations 
        (user_id, title, summary, created_at, updated_at, is_archived) 
        VALUES ($1, $2, $3, $4, $5, $6) 
        RETURNING *`,
        [
          conversation.userId,
          conversation.title || "Neue Unterhaltung",
          null,
          now,
          now,
          conversation.isArchived || false,
        ],
      );

      return {
        id: result.rows[0].id,
        userId: result.rows[0].user_id,
        title: result.rows[0].title,
        summary: result.rows[0].summary,
        createdAt: result.rows[0].created_at,
        updatedAt: result.rows[0].updated_at,
        isArchived: result.rows[0].is_archived,
      };
    } catch (error) {
      console.error("Error creating assistant conversation:", error);
      throw error;
    }
  }

  async getAssistantConversation(
    id: number,
  ): Promise<AssistantConversation | undefined> {
    try {
      const result = await this.pool.query(
        "SELECT * FROM assistant_conversations WHERE id = $1",
        [id],
      );

      if (result.rows.length === 0) {
        return undefined;
      }

      return {
        id: result.rows[0].id,
        userId: result.rows[0].user_id,
        title: result.rows[0].title,
        summary: result.rows[0].summary,
        createdAt: result.rows[0].created_at,
        updatedAt: result.rows[0].updated_at,
        isArchived: result.rows[0].is_archived,
      };
    } catch (error) {
      console.error("Error getting assistant conversation:", error);
      throw error;
    }
  }

  async getAssistantConversationsByUserId(
    userId: number,
  ): Promise<AssistantConversation[]> {
    try {
      const result = await this.pool.query(
        "SELECT * FROM assistant_conversations WHERE user_id = $1 ORDER BY updated_at DESC",
        [userId],
      );

      return result.rows.map((row) => ({
        id: row.id,
        userId: row.user_id,
        title: row.title,
        summary: row.summary,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
        isArchived: row.is_archived,
      }));
    } catch (error) {
      console.error("Error getting assistant conversations by user ID:", error);
      return [];
    }
  }

  async updateAssistantConversation(
    id: number,
    conversation: Partial<InsertAssistantConversation>,
  ): Promise<AssistantConversation | undefined> {
    try {
      // Get the existing conversation first
      const existingConversation = await this.getAssistantConversation(id);

      if (!existingConversation) {
        return undefined;
      }

      const now = new Date();
      const result = await this.pool.query(
        `UPDATE assistant_conversations 
        SET title = $1, is_archived = $2, updated_at = $3 
        WHERE id = $4 
        RETURNING *`,
        [
          conversation.title ?? existingConversation.title,
          conversation.isArchived ?? existingConversation.isArchived,
          now,
          id,
        ],
      );

      if (result.rows.length === 0) {
        return undefined;
      }

      return {
        id: result.rows[0].id,
        userId: result.rows[0].user_id,
        title: result.rows[0].title,
        summary: result.rows[0].summary,
        createdAt: result.rows[0].created_at,
        updatedAt: result.rows[0].updated_at,
        isArchived: result.rows[0].is_archived,
      };
    } catch (error) {
      console.error("Error updating assistant conversation:", error);
      throw error;
    }
  }

  async deleteAssistantConversation(id: number): Promise<boolean> {
    try {
      // Delete all messages in this conversation first
      await this.pool.query(
        "DELETE FROM assistant_messages WHERE conversation_id = $1",
        [id],
      );

      // Then delete the conversation
      const result = await this.pool.query(
        "DELETE FROM assistant_conversations WHERE id = $1 RETURNING id",
        [id],
      );

      return result.rows.length > 0;
    } catch (error) {
      console.error("Error deleting assistant conversation:", error);
      throw error;
    }
  }

  async createAssistantMessage(
    message: InsertAssistantMessage,
  ): Promise<AssistantMessage> {
    try {
      const now = new Date();
      const result = await this.pool.query(
        `INSERT INTO assistant_messages 
        (conversation_id, content, role, timestamp, related_dream_id, related_journal_id, metadata) 
        VALUES ($1, $2, $3, $4, $5, $6, $7) 
        RETURNING *`,
        [
          message.conversationId,
          message.content,
          message.role,
          now,
          message.relatedDreamId || null,
          message.relatedJournalId || null,
          message.metadata ? JSON.stringify(message.metadata) : null,
        ],
      );

      // Update the conversation's updatedAt timestamp
      await this.pool.query(
        "UPDATE assistant_conversations SET updated_at = $1 WHERE id = $2",
        [now, message.conversationId],
      );

      return {
        id: result.rows[0].id,
        conversationId: result.rows[0].conversation_id,
        content: result.rows[0].content,
        role: result.rows[0].role,
        timestamp: result.rows[0].timestamp,
        relatedDreamId: result.rows[0].related_dream_id,
        relatedJournalId: result.rows[0].related_journal_id,
        metadata: result.rows[0].metadata
          ? JSON.parse(result.rows[0].metadata)
          : null,
      };
    } catch (error) {
      console.error("Error creating assistant message:", error);
      throw error;
    }
  }

  async getAssistantMessagesByConversationId(
    conversationId: number,
  ): Promise<AssistantMessage[]> {
    try {
      const result = await this.pool.query(
        "SELECT * FROM assistant_messages WHERE conversation_id = $1 ORDER BY timestamp ASC",
        [conversationId],
      );

      return result.rows.map((row) => ({
        id: row.id,
        conversationId: row.conversation_id,
        content: row.content,
        role: row.role,
        timestamp: row.timestamp,
        relatedDreamId: row.related_dream_id,
        relatedJournalId: row.related_journal_id,
        metadata: row.metadata ? JSON.parse(row.metadata) : null,
      }));
    } catch (error) {
      console.error(
        "Error getting assistant messages by conversation ID:",
        error,
      );
      return [];
    }
  }

  async getAssistantMessageThread(
    conversationId: number,
    limit?: number,
  ): Promise<AssistantMessage[]> {
    try {
      let query =
        "SELECT * FROM assistant_messages WHERE conversation_id = $1 ORDER BY timestamp ASC";
      const params = [conversationId];

      if (limit) {
        query += " LIMIT $2";
        params.push(limit);
      }

      const result = await this.pool.query(query, params);

      return result.rows.map((row) => ({
        id: row.id,
        conversationId: row.conversation_id,
        content: row.content,
        role: row.role,
        timestamp: row.timestamp,
        relatedDreamId: row.related_dream_id,
        relatedJournalId: row.related_journal_id,
        metadata: row.metadata ? JSON.parse(row.metadata) : null,
      }));
    } catch (error) {
      console.error("Error getting assistant message thread:", error);
      return [];
    }
  }

  async processAssistantChatRequest(
    userId: number,
    request: ChatRequest,
  ): Promise<ChatResponse> {
    let conversationId = request.conversationId;
    let conversation: AssistantConversation | undefined;

    // Start a transaction to ensure data consistency
    const client = await this.pool.connect();

    try {
      await client.query("BEGIN");

      // If no conversation ID is provided, create a new conversation
      if (!conversationId) {
        const createResult = await client.query(
          `INSERT INTO assistant_conversations 
          (user_id, title, created_at, updated_at, is_archived) 
          VALUES ($1, $2, $3, $4, $5) 
          RETURNING *`,
          [userId, "Neue Unterhaltung", new Date(), new Date(), false],
        );

        conversation = {
          id: createResult.rows[0].id,
          userId: createResult.rows[0].user_id,
          title: createResult.rows[0].title,
          summary: createResult.rows[0].summary,
          createdAt: createResult.rows[0].created_at,
          updatedAt: createResult.rows[0].updated_at,
          isArchived: createResult.rows[0].is_archived,
        };

        conversationId = conversation.id;
      } else {
        // Verify the conversation exists and belongs to the user
        const conversationResult = await client.query(
          "SELECT * FROM assistant_conversations WHERE id = $1 AND user_id = $2",
          [conversationId, userId],
        );

        if (conversationResult.rows.length === 0) {
          throw new Error("Conversation not found or unauthorized");
        }

        conversation = {
          id: conversationResult.rows[0].id,
          userId: conversationResult.rows[0].user_id,
          title: conversationResult.rows[0].title,
          summary: conversationResult.rows[0].summary,
          createdAt: conversationResult.rows[0].created_at,
          updatedAt: conversationResult.rows[0].updated_at,
          isArchived: conversationResult.rows[0].is_archived,
        };
      }

      // Save the user message
      const now = new Date();
      const userMessageResult = await client.query(
        `INSERT INTO assistant_messages 
        (conversation_id, content, role, timestamp, related_dream_id, related_journal_id) 
        VALUES ($1, $2, $3, $4, $5, $6) 
        RETURNING *`,
        [
          conversationId,
          request.message,
          "user",
          now,
          request.relatedDreamId || null,
          request.relatedJournalId || null,
        ],
      );

      // Update conversation timestamp
      await client.query(
        "UPDATE assistant_conversations SET updated_at = $1 WHERE id = $2",
        [now, conversationId],
      );

      const userMessage = {
        id: userMessageResult.rows[0].id,
        conversationId: userMessageResult.rows[0].conversation_id,
        content: userMessageResult.rows[0].content,
        role: userMessageResult.rows[0].role,
        timestamp: userMessageResult.rows[0].timestamp,
        relatedDreamId: userMessageResult.rows[0].related_dream_id,
        relatedJournalId: userMessageResult.rows[0].related_journal_id,
        metadata: userMessageResult.rows[0].metadata
          ? JSON.parse(userMessageResult.rows[0].metadata)
          : null,
      };

      // Get related content if needed
      let relatedContent: any = null;
      let contextPrompt = "";

      if (request.relatedDreamId) {
        const dreamResult = await client.query(
          "SELECT * FROM dreams WHERE id = $1 AND user_id = $2",
          [request.relatedDreamId, userId],
        );

        if (dreamResult.rows.length > 0) {
          const dream = {
            id: dreamResult.rows[0].id,
            userId: dreamResult.rows[0].user_id,
            date: dreamResult.rows[0].date,
            title: dreamResult.rows[0].title,
            content: dreamResult.rows[0].content,
            imageUrl: dreamResult.rows[0].image_url,
            createdAt: dreamResult.rows[0].created_at,
            analysis: dreamResult.rows[0].analysis,
            tags: dreamResult.rows[0].tags,
            moodBeforeSleep: dreamResult.rows[0].mood_before_sleep,
            moodAfterWakeup: dreamResult.rows[0].mood_after_wakeup,
            moodNotes: dreamResult.rows[0].mood_notes,
          };

          relatedContent = dream;
          contextPrompt = `Bezüglich des Traums "${dream.title}" vom ${dream.date.toLocaleDateString()}:\n${dream.content}\n\n`;

          // If there's analysis, add it to the context
          if (dream.analysis) {
            try {
              const analysis = JSON.parse(dream.analysis);
              contextPrompt += `Traumanalyse: ${analysis.interpretation || "Keine Interpretation verfügbar."}\n\n`;
            } catch (e) {
              // Ignore parsing errors
            }
          }
        }
      } else if (request.relatedJournalId) {
        const journalResult = await client.query(
          "SELECT * FROM journal_entries WHERE id = $1 AND user_id = $2",
          [request.relatedJournalId, userId],
        );

        if (journalResult.rows.length > 0) {
          const journal = {
            id: journalResult.rows[0].id,
            userId: journalResult.rows[0].user_id,
            date: journalResult.rows[0].date,
            title: journalResult.rows[0].title,
            content: journalResult.rows[0].content,
            imageUrl: journalResult.rows[0].image_url,
            createdAt: journalResult.rows[0].created_at,
          };

          relatedContent = journal;
          contextPrompt = `Bezüglich des Tagebucheintrags "${journal.title}" vom ${journal.date.toLocaleDateString()}:\n${journal.content}\n\n`;
        }
      }

      // Get conversation history for context
      const historyResult = await client.query(
        "SELECT * FROM assistant_messages WHERE conversation_id = $1 ORDER BY timestamp ASC LIMIT 10",
        [conversationId],
      );

      const conversationHistory = historyResult.rows.map((row) => ({
        id: row.id,
        conversationId: row.conversation_id,
        content: row.content,
        role: row.role,
        timestamp: row.timestamp,
        relatedDreamId: row.related_dream_id,
        relatedJournalId: row.related_journal_id,
        metadata: row.metadata ? JSON.parse(row.metadata) : null,
      }));

      const historyPrompt = conversationHistory
        .map(
          (msg) =>
            `${msg.role === "user" ? "Benutzer" : "Assistent"}: ${msg.content}`,
        )
        .join("\n");

      // Generate AI response
      const messageForAI = `${contextPrompt}${request.message}`;
      console.log("Sending message to OpenAI:", messageForAI);

      // Call the OpenAI API
      const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
      const completion = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content: `Du bist ein hilfreicher Assistent für Traumdeutung und Traumforschung. 
            
Verwende die folgende Anleitung für deine Antworten:

1. Sei einfühlsam und verständnisvoll - Träume können tiefgreifende persönliche Bedeutung haben.
2. Verbinde deine Antworten mit wissenschaftlichen Erkenntnissen über Träume und Schlaf, wenn möglich.
3. Beziehe dich auf psychologische Perspektiven (Jung, Freud, etc.), aber betone die Subjektivität der Traumdeutung.
4. Wenn der Benutzer einen bestimmten Traum erwähnt, gehe auf den emotionalen Gehalt ein und biete mögliche Interpretationen an.
5. Erwähne bei Bedarf kulturübergreifende Interpretationen von Traumsymbolen.
6. Gib keine medizinischen Diagnosen und verweise bei gesundheitsbezogenen Fragen auf Fachleute.
7. Halte Antworten knapp, aber informativ - höchstens 2-3 Absätze.
8. Präsentiere Interpretationen immer als Möglichkeiten, nicht als definitive Wahrheiten.
9. Achte auf kulturellen Kontext bei deinen Interpretationen.
10. Vermittle eine ausgewogene Perspektive zwischen wissenschaftlicher und spiritueller Traumdeutung.

Bisherige Konversation:
${historyPrompt}`,
          },
          {
            role: "user",
            content: messageForAI,
          },
        ],
      });

      const aiResponse =
        completion.choices[0].message.content ||
        "Entschuldigung, ich konnte deine Nachricht nicht verarbeiten.";

      // Save the assistant's response
      const assistantMessageResult = await client.query(
        `INSERT INTO assistant_messages 
        (conversation_id, content, role, timestamp, related_dream_id, related_journal_id) 
        VALUES ($1, $2, $3, $4, $5, $6) 
        RETURNING *`,
        [
          conversationId,
          aiResponse,
          "assistant",
          new Date(),
          request.relatedDreamId || null,
          request.relatedJournalId || null,
        ],
      );

      const assistantMessage = {
        id: assistantMessageResult.rows[0].id,
        conversationId: assistantMessageResult.rows[0].conversation_id,
        content: assistantMessageResult.rows[0].content,
        role: assistantMessageResult.rows[0].role,
        timestamp: assistantMessageResult.rows[0].timestamp,
        relatedDreamId: assistantMessageResult.rows[0].related_dream_id,
        relatedJournalId: assistantMessageResult.rows[0].related_journal_id,
        metadata: assistantMessageResult.rows[0].metadata
          ? JSON.parse(assistantMessageResult.rows[0].metadata)
          : null,
      };

      // Update conversation title if it's new
      if (conversation && conversationHistory.length === 0) {
        try {
          // Generate a title based on the first user message
          const titleCompletion = await openai.chat.completions.create({
            model: "gpt-4o",
            messages: [
              {
                role: "system",
                content:
                  "Erstelle einen kurzen, aussagekräftigen Titel (max. 5 Wörter) für das folgende Gespräch. Gib nur den Titel zurück, ohne Anführungszeichen oder zusätzlichen Text.",
              },
              {
                role: "user",
                content: request.message,
              },
            ],
          });

          const generatedTitle =
            titleCompletion.choices[0].message.content || "Neue Unterhaltung";

          await client.query(
            "UPDATE assistant_conversations SET title = $1 WHERE id = $2",
            [generatedTitle, conversationId],
          );
        } catch (e) {
          console.error("Error generating title:", e);
          // Continue even if title generation fails
        }
      }

      // Commit the transaction
      await client.query("COMMIT");

      return {
        conversationId,
        message: assistantMessage,
        relatedContent,
      };
    } catch (error) {
      // Rollback the transaction on error
      await client.query("ROLLBACK");
      console.error("Error processing assistant chat request:", error);

      // Create an error response message
      try {
        const errorResult = await this.pool.query(
          `INSERT INTO assistant_messages 
          (conversation_id, content, role, timestamp) 
          VALUES ($1, $2, $3, $4) 
          RETURNING *`,
          [
            conversationId,
            "Entschuldigung, es gab ein Problem bei der Verarbeitung deiner Anfrage. Bitte versuche es später noch einmal.",
            "assistant",
            new Date(),
          ],
        );

        const errorMessage = {
          id: errorResult.rows[0].id,
          conversationId: errorResult.rows[0].conversation_id,
          content: errorResult.rows[0].content,
          role: errorResult.rows[0].role,
          timestamp: errorResult.rows[0].timestamp,
          relatedDreamId: errorResult.rows[0].related_dream_id,
          relatedJournalId: errorResult.rows[0].related_journal_id,
          metadata: errorResult.rows[0].metadata
            ? JSON.parse(errorResult.rows[0].metadata)
            : null,
        };

        return {
          conversationId: conversationId!,
          message: errorMessage,
        };
      } catch (e) {
        console.error("Error creating error message:", e);
        throw error; // Re-throw if we can't even create an error message
      }
    } finally {
      client.release();
    }
  }
}

// Define MoodData interface for tracking mood information
export interface MoodData {
  happiness?: number;
  anxiety?: number;
  energy?: number;
  clarity?: number;
  overall?: number;
  notes?: string;
}

// Create a storage instance based on the environment
// If we're in production and have a DATABASE_URL, use PostgreSQL, otherwise use in-memory storage
let usePostgres = !!process.env.DATABASE_URL;

export let storage: IStorage;

if (usePostgres) {
  console.log("Using PostgreSQL database storage");
  const pool = new pg.Pool({
    connectionString: process.env.DATABASE_URL,
    ssl:
      process.env.NODE_ENV === "production"
        ? { rejectUnauthorized: false }
        : false,
  });

  storage = new DatabaseStorage(pool);
} else {
  console.log("Using in-memory storage (no database URL found)");
  storage = new MemStorage();
}
