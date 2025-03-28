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
  AchievementProgress
} from "@shared/schema";

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
}

export class MemStorage implements IStorage {
  private users: Map<number, any>;
  private dreams: Map<number, Dream>;
  private dreamAnalyses: Map<number, DreamAnalysis>;
  private achievements: Map<number, Achievement>;
  private userAchievements: Map<number, UserAchievement>;
  private currentUserId: number;
  private currentDreamId: number;
  private currentAnalysisId: number;
  private currentAchievementId: number;
  private currentUserAchievementId: number;

  constructor() {
    this.users = new Map();
    this.dreams = new Map();
    this.dreamAnalyses = new Map();
    this.achievements = new Map();
    this.userAchievements = new Map();
    this.currentUserId = 1;
    this.currentDreamId = 1;
    this.currentAnalysisId = 1;
    this.currentAchievementId = 1;
    this.currentUserAchievementId = 1;
    
    // Vordefinierte Achievements anlegen
    this.initializeDefaultAchievements();
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
}

export const storage = new MemStorage();
