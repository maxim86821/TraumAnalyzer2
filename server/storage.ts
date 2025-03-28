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

  // Session store
  sessionStore: session.Store;
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
  public sessionStore: session.Store;

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
    
    // In-Memory Session Store erstellen
    const MemoryStore = require('memorystore')(session);
    this.sessionStore = new MemoryStore({
      checkPeriod: 86400000 // Prune expired entries every 24h
    });
    
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
}

// Create an instance of the storage implementation
// We use the DatabaseStorage for persistence between server restarts
export const storage = new DatabaseStorage();
