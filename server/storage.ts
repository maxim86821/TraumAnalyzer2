import { Dream, InsertDream, AnalysisResponse, DreamAnalysis, InsertDreamAnalysis } from "@shared/schema";

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
}

export class MemStorage implements IStorage {
  private users: Map<number, any>;
  private dreams: Map<number, Dream>;
  private dreamAnalyses: Map<number, DreamAnalysis>;
  private currentUserId: number;
  private currentDreamId: number;
  private currentAnalysisId: number;

  constructor() {
    this.users = new Map();
    this.dreams = new Map();
    this.dreamAnalyses = new Map();
    this.currentUserId = 1;
    this.currentDreamId = 1;
    this.currentAnalysisId = 1;
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
}

export const storage = new MemStorage();
