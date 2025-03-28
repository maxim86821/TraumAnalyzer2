import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { analyzeDream, analyzePatterns, generateDreamImage, generateJournalMoodImage } from "./openai";
import { saveBase64Image, deleteImage, saveUploadedFile } from "./utils";
import { 
  insertDreamSchema, 
  insertAchievementSchema, 
  insertUserAchievementSchema, 
  insertJournalEntrySchema,
  InsertJournalEntry,
  JournalEntry
} from "@shared/schema";
import { setupAuth, authenticateJWT } from "./auth";
import express from "express";
import multer from "multer";
import path from "path";
import { fileURLToPath } from "url";
import session from "express-session";

// Get the directory name in ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configure multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB file size limit
  },
});

export async function registerRoutes(app: Express): Promise<Server> {
  // Session setup
  const sessionSecret = process.env.SESSION_SECRET || 'supersecretkey';
  
  app.use(session({
    secret: sessionSecret,
    resave: false,
    saveUninitialized: false,
    store: storage.sessionStore,
    cookie: {
      secure: process.env.NODE_ENV === 'production',
      httpOnly: true,
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    }
  }));
  
  // Setup Auth
  setupAuth(app);
  
  // Serve uploaded files
  const uploadsPath = path.join(__dirname, '../uploads');
  app.use('/uploads', express.static(uploadsPath));

  // Get all dreams for the authenticated user
  app.get('/api/dreams', authenticateJWT, async (req: Request, res: Response) => {
    try {
      // If user is authenticated, return only their dreams
      if (req.user) {
        const dreams = await storage.getDreamsByUserId(req.user.id);
        return res.json(dreams);
      }
      
      // If no authentication, return empty array
      res.json([]);
    } catch (error) {
      console.error('Error fetching dreams:', error);
      res.status(500).json({ message: 'Fehler beim Laden der Träume' });
    }
  });

  // Get pattern analysis for dreams
  app.get('/api/dreams/patterns/analyze', authenticateJWT, async (req: Request, res: Response) => {
    try {
      if (!req.user) {
        return res.status(401).json({ message: 'Nicht authentifiziert' });
      }

      // Get time range from query parameters
      const timeRange = req.query.timeRange as string || "30 Tage";
      const limit = parseInt(req.query.limit as string) || 0;
      
      // Get all dreams for the user
      const dreams = await storage.getDreamsByUserId(req.user.id);
      
      // Get all journal entries for the user
      const journalEntries = await storage.getJournalEntriesByUserId(req.user.id);
      
      // Zähle die Gesamtzahl der Einträge (Träume + freigegebene Journaleinträge)
      const includedJournalEntries = journalEntries.filter(entry => entry.includeInAnalysis === true);
      const totalEntries = dreams.length + includedJournalEntries.length;
      
      if (totalEntries < 3) {
        return res.status(400).json({ 
          message: 'Nicht genügend Einträge',
          details: 'Mindestens 3 Einträge (Träume und/oder Journaleinträge) werden für eine Musteranalyse benötigt.'
        });
      }

      // Apply limit if specified (nur auf Träume angewendet)
      const dreamsToAnalyze = limit > 0 ? dreams.slice(0, limit) : dreams;
      
      // Prepare dreams for analysis
      const dreamsForAnalysis = dreamsToAnalyze.map(dream => ({
        id: dream.id,
        content: dream.content,
        title: dream.title,
        date: dream.date || dream.createdAt,
        analysis: dream.analysis,
        tags: dream.tags || [],
        moodBeforeSleep: dream.moodBeforeSleep || undefined,
        moodAfterWakeup: dream.moodAfterWakeup || undefined,
        moodNotes: dream.moodNotes || undefined
      }));
      
      // Prepare journal entries for analysis
      const journalForAnalysis = includedJournalEntries.map(entry => {
        // Konvertiere null zu undefined für das mood-Feld
        const mood = entry.mood === null ? undefined : entry.mood;
        
        return {
          id: entry.id,
          content: entry.content,
          title: entry.title,
          date: entry.date || entry.createdAt,
          tags: entry.tags || [],
          mood, 
          includeInAnalysis: true
        };
      });
      
      // Perform pattern analysis with both dreams and journal entries
      const patterns = await analyzePatterns(dreamsForAnalysis, journalForAnalysis, timeRange, req.user.id);
      
      res.json(patterns);
    } catch (error) {
      console.error('Error analyzing patterns:', error);
      res.status(500).json({ 
        message: 'Fehler bei der Musteranalyse',
        details: (error as Error).message
      });
    }
  });

  // Get a specific dream by ID
  app.get('/api/dreams/:id', authenticateJWT, async (req: Request, res: Response) => {
    try {
      console.log(`Dream request - ID param:`, req.params.id, `(type: ${typeof req.params.id})`);
      const id = parseInt(req.params.id);
      
      if (isNaN(id)) {
        console.error(`Invalid dream ID format:`, req.params.id);
        return res.status(400).json({ message: 'Ungültige Traum-ID' });
      }
      
      console.log(`Fetching dream with ID: ${id} (type: ${typeof id})`);
      const dream = await storage.getDream(id);
      
      if (!dream) {
        console.error(`Dream with ID ${id} not found`);
        return res.status(404).json({ message: 'Traum nicht gefunden' });
      }
      
      console.log(`Dream found:`, { id: dream.id, title: dream.title, userId: dream.userId });
      
      // Check if user is the owner of the dream
      if (dream.userId !== req.user?.id) {
        console.error(`Permission denied: User ${req.user?.id} attempting to view dream ${id} owned by user ${dream.userId}`);
        return res.status(403).json({ message: 'Keine Berechtigung zum Anzeigen dieses Traums' });
      }

      // Ensure numeric ID in the response
      const normalizedDream = {
        ...dream,
        id: Number(dream.id)
      };
      
      console.log(`Sending normalized dream:`, { 
        id: normalizedDream.id, 
        idType: typeof normalizedDream.id 
      });
      
      res.json(normalizedDream);
    } catch (error) {
      console.error('Error fetching dream:', error);
      res.status(500).json({ message: 'Fehler beim Laden des Traums' });
    }
  });

  // Create a new dream
  app.post('/api/dreams', authenticateJWT, async (req: Request, res: Response) => {
    try {
      // Validate the request body
      const parseResult = insertDreamSchema.safeParse(req.body);
      if (!parseResult.success) {
        return res.status(400).json({ 
          message: 'Ungültige Traumdaten', 
          errors: parseResult.error.errors 
        });
      }

      // Process image if it's included as base64
      if (req.body.imageBase64) {
        const parts = req.body.imageBase64.split(';base64,');
        if (parts.length === 2) {
          const mimeType = parts[0].replace('data:', '');
          const base64Data = parts[1];
          const imagePath = await saveBase64Image(base64Data, mimeType);
          parseResult.data.imageUrl = imagePath;
        }
      }
      
      // Process tags if they're included
      if (req.body.tags && Array.isArray(req.body.tags)) {
        parseResult.data.tags = req.body.tags;
      }

      // Set the user ID from the authenticated user
      parseResult.data.userId = req.user?.id;
      
      // Create the dream
      const newDream = await storage.createDream(parseResult.data);

      // Get previous dreams if user is authenticated
      const previousDreams = req.user ? 
        (await storage.getDreamsByUserId(req.user.id))
          .filter(dream => dream.id !== newDream.id)
          .slice(0, 5) // Use the 5 most recent dreams
          .map(dream => ({
            content: dream.content,
            date: dream.createdAt,
            analysis: dream.analysis
          }))
        : [];

      // Analyze the dream with OpenAI including previous dreams for context
      try {
        console.log(`Starting analysis for dream ID: ${newDream.id}`);
        const analysis = await analyzeDream(parseResult.data.content, previousDreams);
        console.log(`Analysis completed for dream ID: ${newDream.id}, saving to database...`);
        
        const updatedDream = await storage.saveDreamAnalysis(newDream.id, analysis);
        console.log(`Analysis saved for dream ID: ${newDream.id}`);
        
        // Update the newDream object with the analysis for immediate response
        newDream.analysis = updatedDream.analysis;
      } catch (err) {
        console.error('Error analyzing dream:', err);
      }

      res.status(201).json(newDream);
    } catch (error) {
      console.error('Error creating dream:', error);
      res.status(500).json({ message: 'Fehler beim Erstellen des Traums' });
    }
  });

  // Update a dream
  app.patch('/api/dreams/:id', authenticateJWT, async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: 'Ungültige Traum-ID' });
      }

      // Get the existing dream
      const existingDream = await storage.getDream(id);
      if (!existingDream) {
        return res.status(404).json({ message: 'Traum nicht gefunden' });
      }
      
      // Check if user is the owner of the dream
      if (existingDream.userId !== req.user?.id) {
        return res.status(403).json({ message: 'Keine Berechtigung zum Ändern dieses Traums' });
      }

      // Process image if it's included as base64
      if (req.body.imageBase64) {
        const parts = req.body.imageBase64.split(';base64,');
        if (parts.length === 2) {
          const mimeType = parts[0].replace('data:', '');
          const base64Data = parts[1];
          
          // Delete the old image if it exists
          if (existingDream.imageUrl) {
            await deleteImage(existingDream.imageUrl);
          }
          
          const imagePath = await saveBase64Image(base64Data, mimeType);
          req.body.imageUrl = imagePath;
        }
        
        // Remove the base64 data from the object to avoid saving it
        delete req.body.imageBase64;
      }
      
      // Process tags if they're included
      if ('tags' in req.body) {
        // Ensure tags is always an array, even if empty
        req.body.tags = Array.isArray(req.body.tags) ? req.body.tags : [];
      }

      // Update the dream
      const updatedDream = await storage.updateDream(id, req.body);
      if (!updatedDream) {
        return res.status(404).json({ message: 'Traum nicht gefunden' });
      }

      // If the content was updated, re-analyze the dream
      if (req.body.content) {
        // Get previous dreams if user is authenticated
        const previousDreams = req.user ? 
          (await storage.getDreamsByUserId(req.user.id))
            .filter(dream => dream.id !== id)
            .slice(0, 5) // Use the 5 most recent dreams
            .map(dream => ({
              content: dream.content,
              date: dream.createdAt,
              analysis: dream.analysis
            }))
          : [];

        try {
          console.log(`Starting analysis for updated dream ID: ${id}`);
          const analysis = await analyzeDream(req.body.content, previousDreams);
          console.log(`Analysis completed for updated dream ID: ${id}, saving to database...`);
          
          const dreamWithAnalysis = await storage.saveDreamAnalysis(id, analysis);
          console.log(`Analysis saved for updated dream ID: ${id}`);
          
          // Update the updatedDream object with the analysis for immediate response
          updatedDream.analysis = dreamWithAnalysis.analysis;
        } catch (err) {
          console.error('Error analyzing updated dream:', err);
        }
      }

      res.json(updatedDream);
    } catch (error) {
      console.error('Error updating dream:', error);
      res.status(500).json({ message: 'Fehler beim Aktualisieren des Traums' });
    }
  });

  // Delete a dream
  app.delete('/api/dreams/:id', authenticateJWT, async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: 'Ungültige Traum-ID' });
      }

      // Get the dream to access its image URL
      const dream = await storage.getDream(id);
      if (!dream) {
        return res.status(404).json({ message: 'Traum nicht gefunden' });
      }
      
      // Check if user is the owner of the dream
      if (dream.userId !== req.user?.id) {
        return res.status(403).json({ message: 'Keine Berechtigung zum Löschen dieses Traums' });
      }

      // Delete associated image if it exists
      if (dream.imageUrl) {
        await deleteImage(dream.imageUrl);
      }

      // Delete the dream
      const success = await storage.deleteDream(id);
      if (!success) {
        return res.status(404).json({ message: 'Traum nicht gefunden' });
      }

      res.status(204).send();
    } catch (error) {
      console.error('Error deleting dream:', error);
      res.status(500).json({ message: 'Fehler beim Löschen des Traums' });
    }
  });

  // Upload dream image
  app.post('/api/dreams/:id/image', authenticateJWT, upload.single('image'), async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: 'Ungültige Traum-ID' });
      }

      if (!req.file) {
        return res.status(400).json({ message: 'Kein Bild hochgeladen' });
      }

      // Get the existing dream
      const dream = await storage.getDream(id);
      if (!dream) {
        return res.status(404).json({ message: 'Traum nicht gefunden' });
      }
      
      // Check if user is the owner of the dream
      if (dream.userId !== req.user?.id) {
        return res.status(403).json({ message: 'Keine Berechtigung zum Ändern dieses Traums' });
      }

      // Delete the old image if it exists
      if (dream.imageUrl) {
        await deleteImage(dream.imageUrl);
      }

      // Convert buffer to base64 and save
      const base64Data = req.file.buffer.toString('base64');
      const mimeType = req.file.mimetype;
      const imagePath = await saveBase64Image(base64Data, mimeType);

      // Update the dream with the new image URL
      const updatedDream = await storage.updateDream(id, { imageUrl: imagePath });
      if (!updatedDream) {
        return res.status(404).json({ message: 'Traum nicht gefunden' });
      }

      res.json(updatedDream);
    } catch (error) {
      console.error('Error uploading image:', error);
      res.status(500).json({ message: 'Fehler beim Hochladen des Bildes' });
    }
  });
  
  // Generate AI image for a dream
  app.post('/api/dreams/:id/generate-image', authenticateJWT, async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: 'Ungültige Traum-ID' });
      }

      // Get the existing dream
      const dream = await storage.getDream(id);
      if (!dream) {
        return res.status(404).json({ message: 'Traum nicht gefunden' });
      }
      
      // Check if user is the owner of the dream
      if (dream.userId !== req.user?.id) {
        return res.status(403).json({ message: 'Keine Berechtigung zum Ändern dieses Traums' });
      }

      // Parse analysis if present
      let analysis = null;
      if (dream.analysis) {
        try {
          analysis = JSON.parse(dream.analysis);
        } catch (error) {
          console.error('Error parsing dream analysis:', error);
        }
      }

      // Prepare mood info (handle both null and undefined)
      const moodInfo = {
        beforeSleep: dream.moodBeforeSleep ?? undefined,
        afterWakeup: dream.moodAfterWakeup ?? undefined,
        notes: dream.moodNotes ?? undefined
      };

      // Generate dream image
      const imageUrl = await generateDreamImage(dream.content, analysis, dream.tags, moodInfo);

      // Save the image to our system
      try {
        // Fetch the image
        console.log("Fetching image from:", imageUrl);
        const imageResponse = await fetch(imageUrl);
        if (!imageResponse.ok) {
          throw new Error(`Failed to fetch image: ${imageResponse.statusText}`);
        }
        
        const arrayBuffer = await imageResponse.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        const base64Data = buffer.toString('base64');
        const mimeType = imageResponse.headers.get('content-type') || 'image/jpeg';
        
        // Delete the old image if it exists
        if (dream.imageUrl) {
          await deleteImage(dream.imageUrl);
        }
        
        // Save the new image
        const imagePath = await saveBase64Image(base64Data, mimeType);
        
        // Update the dream with the new image URL
        const updatedDream = await storage.updateDream(id, { imageUrl: imagePath });
        
        res.json({
          success: true,
          dream: updatedDream
        });
      } catch (error) {
        console.error('Error saving generated image:', error);
        // Return the external URL if we couldn't save it locally
        res.json({
          success: true,
          imageUrl,
          message: 'Bild wurde generiert, konnte aber nicht lokal gespeichert werden.'
        });
      }
    } catch (error) {
      console.error('Error generating dream image:', error);
      res.status(500).json({ 
        success: false,
        message: 'Fehler bei der Bildgenerierung', 
        details: (error as Error).message
      });
    }
  });

  // ========= Achievement Routes =========

  // Get all achievements
  app.get('/api/achievements', async (req: Request, res: Response) => {
    try {
      const achievements = await storage.getAllAchievements();
      res.json(achievements);
    } catch (error) {
      console.error('Error fetching achievements:', error);
      res.status(500).json({ message: 'Fehler beim Laden der Erfolge' });
    }
  });

  // Get user's achievements
  app.get('/api/achievements/user', authenticateJWT, async (req: Request, res: Response) => {
    try {
      if (!req.user) {
        return res.status(401).json({ message: 'Nicht authentifiziert' });
      }

      const userAchievements = await storage.getUserAchievements(req.user.id);
      res.json(userAchievements);
    } catch (error) {
      console.error('Error fetching user achievements:', error);
      res.status(500).json({ message: 'Fehler beim Laden der Benutzer-Erfolge' });
    }
  });

  // Get latest completed achievements for the user
  app.get('/api/achievements/user/latest', authenticateJWT, async (req: Request, res: Response) => {
    try {
      if (!req.user) {
        return res.status(401).json({ message: 'Nicht authentifiziert' });
      }

      const limit = parseInt(req.query.limit as string) || 5;
      const latestAchievements = await storage.getLatestUserAchievements(req.user.id, limit);
      
      // Fetch full achievement details for each user achievement
      const achievementsWithDetails = await Promise.all(
        latestAchievements.map(async (ua) => {
          const achievement = await storage.getAchievement(ua.achievementId);
          return {
            ...ua,
            achievement
          };
        })
      );
      
      res.json(achievementsWithDetails);
    } catch (error) {
      console.error('Error fetching latest user achievements:', error);
      res.status(500).json({ message: 'Fehler beim Laden der neuesten Benutzer-Erfolge' });
    }
  });

  // Create a new achievement (admin only)
  app.post('/api/achievements', authenticateJWT, async (req: Request, res: Response) => {
    try {
      // In a real app, check for admin role
      // For now, validate the request body
      const parseResult = insertAchievementSchema.safeParse(req.body);
      if (!parseResult.success) {
        return res.status(400).json({ 
          message: 'Ungültige Achievement-Daten', 
          errors: parseResult.error.errors 
        });
      }

      const newAchievement = await storage.createAchievement(parseResult.data);
      res.status(201).json(newAchievement);
    } catch (error) {
      console.error('Error creating achievement:', error);
      res.status(500).json({ message: 'Fehler beim Erstellen des Erfolgs' });
    }
  });

  // Check and process user achievements
  app.post('/api/achievements/check', authenticateJWT, async (req: Request, res: Response) => {
    try {
      if (!req.user) {
        return res.status(401).json({ message: 'Nicht authentifiziert' });
      }

      const userId = req.user.id;
      
      // Get all achievements and user's dreams
      const achievements = await storage.getAllAchievements();
      const dreams = await storage.getDreamsByUserId(userId);
      
      // Get user's existing achievements
      const userAchievements = await storage.getUserAchievements(userId);
      
      // Object to collect new achievements
      const newAchievements = [];
      
      // Check each achievement
      for (const achievement of achievements) {
        // Skip if user already has this achievement and it's completed
        const existingAchievement = userAchievements.find(
          ua => ua.achievementId === achievement.id && ua.isCompleted
        );
        
        if (existingAchievement) {
          continue;
        }
        
        // Get or create user achievement
        let userAchievement = userAchievements.find(ua => ua.achievementId === achievement.id);
        
        // Calculate current progress based on achievement criteria
        let currentValue = 0;
        
        switch (achievement.criteria.type) {
          case "dreamCount":
            currentValue = dreams.length;
            break;
          case "streakDays":
            // Calculate consecutive days with dreams
            currentValue = calculateStreakDays(dreams);
            break;
          case "tagCount":
            // Count unique tags
            currentValue = countUniqueTags(dreams);
            break;
          case "imageCount":
            // Count dreams with images
            currentValue = dreams.filter(dream => dream.imageUrl).length;
            break;
          case "analysisCount":
            // Count dreams with analysis
            currentValue = dreams.filter(dream => dream.analysis).length;
            break;
          case "moodTracking":
            // Count dreams with mood tracking
            currentValue = dreams.filter(dream => 
              dream.moodBeforeSleep !== null || dream.moodAfterWakeup !== null
            ).length;
            break;
          case "dreamLength":
            // Count dreams with content longer than threshold
            const minLength = achievement.criteria.additionalParams?.minLength || 100;
            currentValue = dreams.filter(dream => dream.content.length > minLength).length;
            break;
          // Additional types would be handled here
        }
        
        // Create progress object
        const progress = {
          currentValue,
          requiredValue: achievement.criteria.threshold,
          lastUpdated: new Date().toISOString(),
          details: achievement.criteria.additionalParams || {}
        };
        
        // If user achievement doesn't exist, create it
        if (!userAchievement) {
          userAchievement = await storage.createUserAchievement({
            userId,
            achievementId: achievement.id,
            progress,
            isCompleted: currentValue >= achievement.criteria.threshold
          });
        } else {
          // Otherwise update existing progress
          userAchievement = await storage.updateUserAchievementProgress(userAchievement.id, progress);
        }
        
        // If achievement is completed, add to new achievements
        if (userAchievement && userAchievement.isCompleted && !existingAchievement) {
          const timestamp = userAchievement.unlockedAt.toISOString();
          newAchievements.push({
            achievementId: achievement.id,
            achievementName: achievement.name,
            achievementDescription: achievement.description,
            iconName: achievement.iconName,
            category: achievement.category,
            difficulty: achievement.difficulty,
            timestamp
          });
        }
      }
      
      res.json({
        achievements: userAchievements,
        newAchievements
      });
    } catch (error) {
      console.error('Error checking achievements:', error);
      res.status(500).json({ message: 'Fehler beim Prüfen der Erfolge' });
    }
  });

  // Helper functions for achievement processing
  function calculateStreakDays(dreams: any[]): number {
    if (dreams.length === 0) return 0;
    
    // Sort dreams by date (newest first)
    const sortedDreams = [...dreams].sort((a, b) => b.date.getTime() - a.date.getTime());
    
    // Get unique days (in ISO string format YYYY-MM-DD)
    const uniqueDays = new Set<string>();
    sortedDreams.forEach(dream => {
      uniqueDays.add(dream.date.toISOString().split('T')[0]);
    });
    
    // Convert to array and sort (newest first)
    const days = Array.from(uniqueDays).sort().reverse();
    
    // Count consecutive days
    let currentStreak = 1;
    let maxStreak = 1;
    
    for (let i = 1; i < days.length; i++) {
      const prevDay = new Date(days[i-1]);
      const currentDay = new Date(days[i]);
      
      // Check if days are consecutive
      const timeDiff = Math.abs(prevDay.getTime() - currentDay.getTime());
      const dayDiff = Math.ceil(timeDiff / (1000 * 3600 * 24));
      
      if (dayDiff === 1) {
        currentStreak++;
        maxStreak = Math.max(maxStreak, currentStreak);
      } else {
        currentStreak = 1;
      }
    }
    
    return maxStreak;
  }
  
  function countUniqueTags(dreams: any[]): number {
    const allTags = new Set<string>();
    
    dreams.forEach(dream => {
      if (dream.tags && Array.isArray(dream.tags)) {
        dream.tags.forEach((tag: string) => allTags.add(tag));
      }
    });
    
    return allTags.size;
  }

  // =======================================================
  // Journal API Routes
  // =======================================================
  
  // Get all journal entries for a user
  app.get('/api/journal', authenticateJWT, async (req: Request, res: Response) => {
    try {
      if (!req.user) {
        return res.status(401).json({ message: 'Nicht authentifiziert' });
      }
      
      const entries = await storage.getJournalEntriesByUserId(req.user.id);
      res.json(entries);
    } catch (error) {
      console.error('Error fetching journal entries:', error);
      res.status(500).json({ message: 'Fehler beim Laden der Journaleinträge' });
    }
  });
  
  // Generiert ein Stimmungsbild für einen Journaleintrag
  app.post('/api/journal/generate-image', authenticateJWT, async (req: Request, res: Response) => {
    try {
      if (!req.user) {
        return res.status(401).json({ message: 'Nicht authentifiziert' });
      }
      
      const { journalContent, colorImpression, spontaneousThought, tags, mood } = req.body;
      
      if (!journalContent || !colorImpression || !spontaneousThought) {
        return res.status(400).json({ 
          message: 'Journalinhalt, Farbeindrücke und spontane Gedanken werden benötigt' 
        });
      }
      
      // OpenAI API aufrufen, um ein Bild zu generieren
      const { imageUrl, description } = await generateJournalMoodImage(
        journalContent,
        colorImpression,
        spontaneousThought,
        tags,
        mood
      );
      
      res.json({ imageUrl, description });
    } catch (error) {
      console.error('Error generating journal mood image:', error);
      res.status(500).json({ message: 'Fehler bei der Generierung des Stimmungsbildes' });
    }
  });
  
  // Get a specific journal entry
  app.get('/api/journal/:id', authenticateJWT, async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: 'Ungültige Eintrags-ID' });
      }
      
      const entry = await storage.getJournalEntry(id);
      if (!entry) {
        return res.status(404).json({ message: 'Eintrag nicht gefunden' });
      }
      
      // Check if user is the owner of the entry
      if (entry.userId !== req.user?.id) {
        return res.status(403).json({ message: 'Keine Berechtigung zum Anzeigen dieses Eintrags' });
      }
      
      res.json(entry);
    } catch (error) {
      console.error('Error fetching journal entry:', error);
      res.status(500).json({ message: 'Fehler beim Laden des Journaleintrags' });
    }
  });
  
  // Create a new journal entry
  app.post('/api/journal', authenticateJWT, async (req: Request, res: Response) => {
    try {
      if (!req.user) {
        return res.status(401).json({ message: 'Nicht authentifiziert' });
      }
      
      // Überprüfe, ob die Pflichtfelder vorhanden sind
      if (!req.body.title || !req.body.content) {
        return res.status(400).json({ 
          message: 'Titel und Inhalt sind erforderlich',
        });
      }
      
      // Korrekt typisiertes Objekt mit erforderlichen und optionalen Feldern
      const journalData: InsertJournalEntry = {
        userId: req.user.id,
        title: req.body.title,
        content: req.body.content,
        date: req.body.date ? new Date(req.body.date) : new Date(),
        // Pflichtfelder mit Default-Werten
        isPrivate: req.body.isPrivate !== undefined ? req.body.isPrivate : true,
        includeInAnalysis: req.body.includeInAnalysis !== undefined ? req.body.includeInAnalysis : false,
      };

      // Optionale Felder nur hinzufügen, wenn sie vorhanden sind
      if (req.body.tags && Array.isArray(req.body.tags)) journalData.tags = req.body.tags;
      if (req.body.mood !== undefined) journalData.mood = req.body.mood;
      if (req.body.imageUrl) journalData.imageUrl = req.body.imageUrl;
      if (req.body.relatedDreamIds) journalData.relatedDreamIds = req.body.relatedDreamIds;
      
      // Create the journal entry
      const newEntry = await storage.createJournalEntry(journalData);
      res.status(201).json(newEntry);
    } catch (error) {
      console.error('Error creating journal entry:', error);
      res.status(500).json({ message: 'Fehler beim Erstellen des Journaleintrags' });
    }
  });
  
  // Update a journal entry
  app.patch('/api/journal/:id', authenticateJWT, async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: 'Ungültige Eintrags-ID' });
      }
      
      // Get the existing entry
      const existingEntry = await storage.getJournalEntry(id);
      if (!existingEntry) {
        return res.status(404).json({ message: 'Eintrag nicht gefunden' });
      }
      
      // Check if user is the owner of the entry
      if (existingEntry.userId !== req.user?.id) {
        return res.status(403).json({ message: 'Keine Berechtigung zum Ändern dieses Eintrags' });
      }
      
      // Überprüfe, ob die Pflichtfelder vorhanden sind
      if (req.body.title === '' || req.body.content === '') {
        return res.status(400).json({ 
          message: 'Titel und Inhalt dürfen nicht leer sein',
        });
      }
      
      // Bereinige die Eingabedaten für das Update
      const updateData: any = {};
      
      // Nur Felder aktualisieren, die tatsächlich gesendet wurden
      if ('title' in req.body) updateData.title = req.body.title;
      if ('content' in req.body) updateData.content = req.body.content;
      if ('date' in req.body) updateData.date = new Date(req.body.date);
      if ('mood' in req.body) updateData.mood = req.body.mood;
      if ('isPrivate' in req.body) updateData.isPrivate = req.body.isPrivate;
      if ('imageUrl' in req.body) updateData.imageUrl = req.body.imageUrl;
      if ('includeInAnalysis' in req.body) updateData.includeInAnalysis = req.body.includeInAnalysis;
      if ('relatedDreamIds' in req.body) updateData.relatedDreamIds = req.body.relatedDreamIds;
      
      // Process tags if they're included
      if ('tags' in req.body) {
        // Ensure tags is always an array, even if empty
        updateData.tags = Array.isArray(req.body.tags) ? req.body.tags : [];
      }
      
      // Update the journal entry
      const updatedEntry = await storage.updateJournalEntry(id, updateData);
      if (!updatedEntry) {
        return res.status(404).json({ message: 'Eintrag nicht gefunden' });
      }
      
      res.json(updatedEntry);
    } catch (error) {
      console.error('Error updating journal entry:', error);
      res.status(500).json({ message: 'Fehler beim Aktualisieren des Journaleintrags' });
    }
  });
  
  // Delete a journal entry
  app.delete('/api/journal/:id', authenticateJWT, async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: 'Ungültige Eintrags-ID' });
      }
      
      // Get the entry
      const entry = await storage.getJournalEntry(id);
      if (!entry) {
        return res.status(404).json({ message: 'Eintrag nicht gefunden' });
      }
      
      // Check if user is the owner of the entry
      if (entry.userId !== req.user?.id) {
        return res.status(403).json({ message: 'Keine Berechtigung zum Löschen dieses Eintrags' });
      }
      
      // Delete the entry
      const success = await storage.deleteJournalEntry(id);
      if (!success) {
        return res.status(404).json({ message: 'Eintrag nicht gefunden' });
      }
      
      res.status(204).send();
    } catch (error) {
      console.error('Error deleting journal entry:', error);
      res.status(500).json({ message: 'Fehler beim Löschen des Journaleintrags' });
    }
  });
  
  const httpServer = createServer(app);
  // File upload route for journal and other images
  app.post('/api/upload', authenticateJWT, upload.single('image'), async (req: Request, res: Response) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: 'Kein Bild hochgeladen' });
      }

      // Check if user is authenticated
      if (!req.user) {
        return res.status(401).json({ message: 'Nicht authentifiziert' });
      }

      // Save the uploaded file
      const imageUrl = await saveUploadedFile(req.file.buffer, req.file.mimetype);

      res.status(201).json({ 
        imageUrl,
        message: 'Bild erfolgreich hochgeladen' 
      });
    } catch (error) {
      console.error('Error uploading image:', error);
      res.status(500).json({ message: 'Fehler beim Hochladen des Bildes' });
    }
  });

  // Traumsymbol-Bibliothek API-Routen

  // Kulturen
  app.get('/api/cultures', async (req, res) => {
    try {
      const cultures = await storage.getAllCultures();
      res.json(cultures);
    } catch (error) {
      console.error('Error fetching cultures:', error);
      res.status(500).json({ message: 'Fehler beim Abrufen der Kulturen' });
    }
  });

  app.get('/api/cultures/:id', async (req, res) => {
    try {
      const culture = await storage.getCulture(parseInt(req.params.id));
      
      if (!culture) {
        return res.status(404).json({ message: 'Kultur nicht gefunden' });
      }
      
      res.json(culture);
    } catch (error) {
      console.error('Error fetching culture:', error);
      res.status(500).json({ message: 'Fehler beim Abrufen der Kultur' });
    }
  });

  app.post('/api/cultures', authenticateJWT, async (req, res) => {
    try {
      const culture = await storage.createCulture(req.body);
      res.status(201).json(culture);
    } catch (error) {
      console.error('Error creating culture:', error);
      res.status(500).json({ message: 'Fehler beim Erstellen der Kultur' });
    }
  });

  app.put('/api/cultures/:id', authenticateJWT, async (req, res) => {
    try {
      const culture = await storage.updateCulture(parseInt(req.params.id), req.body);
      
      if (!culture) {
        return res.status(404).json({ message: 'Kultur nicht gefunden' });
      }
      
      res.json(culture);
    } catch (error) {
      console.error('Error updating culture:', error);
      res.status(500).json({ message: 'Fehler beim Aktualisieren der Kultur' });
    }
  });

  app.delete('/api/cultures/:id', authenticateJWT, async (req, res) => {
    try {
      const deleted = await storage.deleteCulture(parseInt(req.params.id));
      
      if (!deleted) {
        return res.status(404).json({ message: 'Kultur nicht gefunden' });
      }
      
      res.json({ success: true });
    } catch (error) {
      console.error('Error deleting culture:', error);
      res.status(500).json({ message: 'Fehler beim Löschen der Kultur' });
    }
  });

  // Traumsymbole
  app.get('/api/dream-symbols', async (req, res) => {
    try {
      const { category, query } = req.query;
      
      let symbols;
      if (category) {
        symbols = await storage.getDreamSymbolsByCategory(category as string);
      } else if (query) {
        symbols = await storage.searchDreamSymbols(query as string);
      } else {
        symbols = await storage.getAllDreamSymbols();
      }
      
      res.json(symbols);
    } catch (error) {
      console.error('Error fetching dream symbols:', error);
      res.status(500).json({ message: 'Fehler beim Abrufen der Traumsymbole' });
    }
  });

  app.get('/api/dream-symbols/:id', async (req, res) => {
    try {
      const symbol = await storage.getDreamSymbol(parseInt(req.params.id));
      
      if (!symbol) {
        return res.status(404).json({ message: 'Traumsymbol nicht gefunden' });
      }
      
      res.json(symbol);
    } catch (error) {
      console.error('Error fetching dream symbol:', error);
      res.status(500).json({ message: 'Fehler beim Abrufen des Traumsymbols' });
    }
  });

  app.post('/api/dream-symbols', authenticateJWT, async (req, res) => {
    try {
      const symbol = await storage.createDreamSymbol(req.body);
      res.status(201).json(symbol);
    } catch (error) {
      console.error('Error creating dream symbol:', error);
      res.status(500).json({ message: 'Fehler beim Erstellen des Traumsymbols' });
    }
  });

  app.put('/api/dream-symbols/:id', authenticateJWT, async (req, res) => {
    try {
      const symbol = await storage.updateDreamSymbol(parseInt(req.params.id), req.body);
      
      if (!symbol) {
        return res.status(404).json({ message: 'Traumsymbol nicht gefunden' });
      }
      
      res.json(symbol);
    } catch (error) {
      console.error('Error updating dream symbol:', error);
      res.status(500).json({ message: 'Fehler beim Aktualisieren des Traumsymbols' });
    }
  });

  app.delete('/api/dream-symbols/:id', authenticateJWT, async (req, res) => {
    try {
      const deleted = await storage.deleteDreamSymbol(parseInt(req.params.id));
      
      if (!deleted) {
        return res.status(404).json({ message: 'Traumsymbol nicht gefunden' });
      }
      
      res.json({ success: true });
    } catch (error) {
      console.error('Error deleting dream symbol:', error);
      res.status(500).json({ message: 'Fehler beim Löschen des Traumsymbols' });
    }
  });

  // Kulturelle Interpretationen
  app.get('/api/cultural-interpretations', async (req, res) => {
    try {
      const { symbolId, cultureId } = req.query;
      
      let interpretations;
      if (symbolId) {
        interpretations = await storage.getCulturalInterpretationsBySymbolId(parseInt(symbolId as string));
      } else if (cultureId) {
        interpretations = await storage.getCulturalInterpretationsByCultureId(parseInt(cultureId as string));
      } else {
        return res.status(400).json({ message: 'Entweder symbolId oder cultureId muss angegeben werden' });
      }
      
      res.json(interpretations);
    } catch (error) {
      console.error('Error fetching cultural interpretations:', error);
      res.status(500).json({ message: 'Fehler beim Abrufen der kulturellen Interpretationen' });
    }
  });

  app.get('/api/cultural-interpretations/:id', async (req, res) => {
    try {
      const interpretation = await storage.getCulturalInterpretation(parseInt(req.params.id));
      
      if (!interpretation) {
        return res.status(404).json({ message: 'Kulturelle Interpretation nicht gefunden' });
      }
      
      res.json(interpretation);
    } catch (error) {
      console.error('Error fetching cultural interpretation:', error);
      res.status(500).json({ message: 'Fehler beim Abrufen der kulturellen Interpretation' });
    }
  });

  app.post('/api/cultural-interpretations', authenticateJWT, async (req, res) => {
    try {
      const interpretation = await storage.createCulturalInterpretation(req.body);
      res.status(201).json(interpretation);
    } catch (error) {
      console.error('Error creating cultural interpretation:', error);
      res.status(500).json({ message: 'Fehler beim Erstellen der kulturellen Interpretation' });
    }
  });

  app.put('/api/cultural-interpretations/:id', authenticateJWT, async (req, res) => {
    try {
      const interpretation = await storage.updateCulturalInterpretation(parseInt(req.params.id), req.body);
      
      if (!interpretation) {
        return res.status(404).json({ message: 'Kulturelle Interpretation nicht gefunden' });
      }
      
      res.json(interpretation);
    } catch (error) {
      console.error('Error updating cultural interpretation:', error);
      res.status(500).json({ message: 'Fehler beim Aktualisieren der kulturellen Interpretation' });
    }
  });

  app.delete('/api/cultural-interpretations/:id', authenticateJWT, async (req, res) => {
    try {
      const deleted = await storage.deleteCulturalInterpretation(parseInt(req.params.id));
      
      if (!deleted) {
        return res.status(404).json({ message: 'Kulturelle Interpretation nicht gefunden' });
      }
      
      res.json({ success: true });
    } catch (error) {
      console.error('Error deleting cultural interpretation:', error);
      res.status(500).json({ message: 'Fehler beim Löschen der kulturellen Interpretation' });
    }
  });

  // Symbol-Vergleiche
  app.get('/api/symbol-comparisons', async (req, res) => {
    try {
      const { symbolId } = req.query;
      
      if (!symbolId) {
        return res.status(400).json({ message: 'symbolId muss angegeben werden' });
      }
      
      const comparisons = await storage.getSymbolComparisonsBySymbolId(parseInt(symbolId as string));
      res.json(comparisons);
    } catch (error) {
      console.error('Error fetching symbol comparisons:', error);
      res.status(500).json({ message: 'Fehler beim Abrufen der Symbol-Vergleiche' });
    }
  });

  app.get('/api/symbol-comparisons/:id', async (req, res) => {
    try {
      const comparison = await storage.getSymbolComparison(parseInt(req.params.id));
      
      if (!comparison) {
        return res.status(404).json({ message: 'Symbol-Vergleich nicht gefunden' });
      }
      
      res.json(comparison);
    } catch (error) {
      console.error('Error fetching symbol comparison:', error);
      res.status(500).json({ message: 'Fehler beim Abrufen des Symbol-Vergleichs' });
    }
  });

  app.post('/api/symbol-comparisons', authenticateJWT, async (req, res) => {
    try {
      const comparison = await storage.createSymbolComparison(req.body);
      res.status(201).json(comparison);
    } catch (error) {
      console.error('Error creating symbol comparison:', error);
      res.status(500).json({ message: 'Fehler beim Erstellen des Symbol-Vergleichs' });
    }
  });

  app.put('/api/symbol-comparisons/:id', authenticateJWT, async (req, res) => {
    try {
      const comparison = await storage.updateSymbolComparison(parseInt(req.params.id), req.body);
      
      if (!comparison) {
        return res.status(404).json({ message: 'Symbol-Vergleich nicht gefunden' });
      }
      
      res.json(comparison);
    } catch (error) {
      console.error('Error updating symbol comparison:', error);
      res.status(500).json({ message: 'Fehler beim Aktualisieren des Symbol-Vergleichs' });
    }
  });

  app.delete('/api/symbol-comparisons/:id', authenticateJWT, async (req, res) => {
    try {
      const deleted = await storage.deleteSymbolComparison(parseInt(req.params.id));
      
      if (!deleted) {
        return res.status(404).json({ message: 'Symbol-Vergleich nicht gefunden' });
      }
      
      res.json({ success: true });
    } catch (error) {
      console.error('Error deleting symbol comparison:', error);
      res.status(500).json({ message: 'Fehler beim Löschen des Symbol-Vergleichs' });
    }
  });

  // Benutzer-Favoriten
  app.get('/api/user/symbol-favorites', authenticateJWT, async (req, res) => {
    try {
      const favorites = await storage.getUserSymbolFavoritesByUserId(req.user!.id);
      res.json(favorites);
    } catch (error) {
      console.error('Error fetching user symbol favorites:', error);
      res.status(500).json({ message: 'Fehler beim Abrufen der Benutzer-Favoriten' });
    }
  });

  app.post('/api/user/symbol-favorites', authenticateJWT, async (req, res) => {
    try {
      const favorite = await storage.createUserSymbolFavorite({
        userId: req.user!.id,
        symbolId: req.body.symbolId,
        notes: req.body.notes
      });
      
      res.status(201).json(favorite);
    } catch (error) {
      console.error('Error creating user symbol favorite:', error);
      res.status(500).json({ message: 'Fehler beim Erstellen des Benutzer-Favoriten' });
    }
  });

  app.delete('/api/user/symbol-favorites/:id', authenticateJWT, async (req, res) => {
    try {
      const deleted = await storage.deleteUserSymbolFavorite(parseInt(req.params.id));
      
      if (!deleted) {
        return res.status(404).json({ message: 'Benutzer-Favorit nicht gefunden' });
      }
      
      res.json({ success: true });
    } catch (error) {
      console.error('Error deleting user symbol favorite:', error);
      res.status(500).json({ message: 'Fehler beim Löschen des Benutzer-Favoriten' });
    }
  });

  return httpServer;
}