import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import {
  analyzeDream,
  analyzePatterns,
  generateDreamImage,
  generateJournalMoodImage,
  generateDreamWritingPrompts,
} from "./openai";
import { saveBase64Image, deleteImage, saveUploadedFile } from "./utils";
import {
  insertDreamSchema,
  insertAchievementSchema,
  insertUserAchievementSchema,
  insertJournalEntrySchema,
  InsertJournalEntry,
  JournalEntry,
  // Collaborative dream interpretation imports
  insertSharedDreamSchema,
  insertDreamCommentSchema,
  insertCommentLikeSchema,
  insertDreamChallengeSchema,
  insertChallengeSubmissionSchema,
  // AI Assistant imports
  ChatRequest,
  InsertAssistantConversation,
  MoodData,
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
  const sessionSecret = process.env.SESSION_SECRET || "supersecretkey";

  app.use(
    session({
      secret: sessionSecret,
      resave: false,
      saveUninitialized: false,
      store: storage.sessionStore,
      cookie: {
        secure: process.env.NODE_ENV === "production",
        httpOnly: true,
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      },
    }),
  );

  // Setup Auth
  setupAuth(app);

  // Serve uploaded files
  const uploadsPath = path.join(__dirname, "../uploads");
  app.use("/uploads", express.static(uploadsPath));

  // Get personalized dream writing prompts - Must be defined BEFORE the `/api/dreams/:id` route
  app.get(
    "/api/dreams/prompts",
    authenticateJWT,
    async (req: Request, res: Response) => {
      try {
        if (!req.user) {
          return res.status(401).json({ message: "Nicht authentifiziert" });
        }

        // Get themes preference from query if available
        const preferredThemes = req.query.themes
          ? String(req.query.themes).split(",")
          : undefined;

        // Get previous dreams if user is authenticated
        const dreams = await storage.getDreamsByUserId(req.user.id);

        // Only use the 5 most recent dreams for context
        const recentDreams = dreams
          .sort(
            (a, b) =>
              new Date(b.date || b.createdAt).getTime() -
              new Date(a.date || a.createdAt).getTime(),
          )
          .slice(0, 5)
          .map((dream) => ({
            content: dream.content,
            date: dream.date || dream.createdAt,
            analysis: dream.analysis,
            tags: dream.tags || [],
          }));

        // Generate personalized prompts based on user's previous dreams
        const prompts = await generateDreamWritingPrompts(
          req.user.id,
          recentDreams,
          preferredThemes,
        );

        res.json({ prompts });
      } catch (error) {
        console.error("Error generating dream writing prompts:", error);
        res.status(500).json({
          message: "Fehler bei der Generierung von Schreibprompts",
          details: (error as Error).message,
        });
      }
    },
  );

  // Get pattern analysis for dreams - Must be defined BEFORE the `/api/dreams/:id` route
  app.get(
    "/api/dreams/patterns/analyze",
    authenticateJWT,
    async (req: Request, res: Response) => {
      try {
        if (!req.user) {
          return res.status(401).json({ message: "Nicht authentifiziert" });
        }

        // Get time range from query parameters
        const timeRange = (req.query.timeRange as string) || "30 Tage";
        const limit = parseInt(req.query.limit as string) || 0;

        // Get all dreams for the user
        const dreams = await storage.getDreamsByUserId(req.user.id);

        // Get all journal entries for the user
        const journalEntries = await storage.getJournalEntriesByUserId(
          req.user.id,
        );

        // Zähle die Gesamtzahl der Einträge (Träume + freigegebene Journaleinträge)
        const includedJournalEntries = journalEntries.filter(
          (entry) => entry.includeInAnalysis === true,
        );
        const totalEntries = dreams.length + includedJournalEntries.length;

        if (totalEntries < 3) {
          return res.status(400).json({
            message: "Nicht genügend Einträge",
            details:
              "Mindestens 3 Einträge (Träume und/oder Journaleinträge) werden für eine Musteranalyse benötigt.",
          });
        }

        // Apply limit if specified (nur auf Träume angewendet)
        const dreamsToAnalyze = limit > 0 ? dreams.slice(0, limit) : dreams;

        // Prepare dreams for analysis
        const dreamsForAnalysis = dreamsToAnalyze.map((dream) => ({
          id: dream.id,
          content: dream.content,
          title: dream.title,
          date: dream.date || dream.createdAt,
          analysis: dream.analysis,
          tags: dream.tags || [],
          moodBeforeSleep: dream.moodBeforeSleep || undefined,
          moodAfterWakeup: dream.moodAfterWakeup || undefined,
          moodNotes: dream.moodNotes || undefined,
        }));

        // Prepare journal entries for analysis
        const journalForAnalysis = includedJournalEntries.map((entry) => {
          // Konvertiere null zu undefined für das mood-Feld
          const mood = entry.mood === null ? undefined : entry.mood;

          return {
            id: entry.id,
            content: entry.content,
            title: entry.title,
            date: entry.date || entry.createdAt,
            tags: entry.tags || [],
            mood,
            includeInAnalysis: true,
          };
        });

        // Perform pattern analysis with both dreams and journal entries
        const patterns = await analyzePatterns(
          dreamsForAnalysis,
          journalForAnalysis,
          timeRange,
          req.user.id,
        );

        res.json(patterns);
      } catch (error) {
        console.error("Error analyzing patterns:", error);
        res.status(500).json({
          message: "Fehler bei der Musteranalyse",
          details: (error as Error).message,
        });
      }
    },
  );

  // Get all dreams for the authenticated user
  app.get(
    "/api/dreams",
    authenticateJWT,
    async (req: Request, res: Response) => {
      try {
        // If user is authenticated, return only their dreams
        if (req.user) {
          const dreams = await storage.getDreamsByUserId(req.user.id);
          return res.json(dreams);
        }

        // If no authentication, return empty array
        res.json([]);
      } catch (error) {
        console.error("Error fetching dreams:", error);
        res.status(500).json({ message: "Fehler beim Laden der Träume" });
      }
    },
  );

  // Get a specific dream by ID
  app.get(
    "/api/dreams/:id",
    authenticateJWT,
    async (req: Request, res: Response) => {
      try {
        console.log(
          `Dream request - ID param:`,
          req.params.id,
          `(type: ${typeof req.params.id})`,
        );
        const id = parseInt(req.params.id);

        if (isNaN(id)) {
          console.error(`Invalid dream ID format:`, req.params.id);
          return res.status(400).json({ message: "Ungültige Traum-ID" });
        }

        console.log(`Fetching dream with ID: ${id} (type: ${typeof id})`);
        const dream = await storage.getDream(id);

        if (!dream) {
          console.error(`Dream with ID ${id} not found`);
          return res.status(404).json({ message: "Traum nicht gefunden" });
        }

        console.log(`Dream found:`, {
          id: dream.id,
          title: dream.title,
          userId: dream.userId,
        });

        // Check if user is the owner of the dream
        if (dream.userId !== req.user?.id) {
          console.error(
            `Permission denied: User ${req.user?.id} attempting to view dream ${id} owned by user ${dream.userId}`,
          );
          return res
            .status(403)
            .json({ message: "Keine Berechtigung zum Anzeigen dieses Traums" });
        }

        // Ensure numeric ID in the response
        const normalizedDream = {
          ...dream,
          id: Number(dream.id),
        };

        console.log(`Sending normalized dream:`, {
          id: normalizedDream.id,
          idType: typeof normalizedDream.id,
        });

        res.json(normalizedDream);
      } catch (error) {
        console.error("Error fetching dream:", error);
        res.status(500).json({ message: "Fehler beim Laden des Traums" });
      }
    },
  );

  // Create a new dream
  app.post(
    "/api/dreams",
    authenticateJWT,
    async (req: Request, res: Response) => {
      try {
        // Validate the request body
        const parseResult = insertDreamSchema.safeParse(req.body);
        if (!parseResult.success) {
          return res.status(400).json({
            message: "Ungültige Traumdaten",
            errors: parseResult.error.errors,
          });
        }

        // Process image if it's included as base64
        if (req.body.imageBase64) {
          const parts = req.body.imageBase64.split(";base64,");
          if (parts.length === 2) {
            const mimeType = parts[0].replace("data:", "");
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
        const previousDreams = req.user
          ? (await storage.getDreamsByUserId(req.user.id))
              .filter((dream) => dream.id !== newDream.id)
              .slice(0, 5) // Use the 5 most recent dreams
              .map((dream) => ({
                content: dream.content,
                date: dream.createdAt,
                analysis: dream.analysis,
              }))
          : [];

        // Analyze the dream with OpenAI including previous dreams for context
        try {
          console.log(`Starting analysis for dream ID: ${newDream.id}`);
          const analysis = await analyzeDream(
            parseResult.data.content,
            previousDreams,
          );
          console.log(
            `Analysis completed for dream ID: ${newDream.id}, saving to database...`,
          );

          const updatedDream = await storage.saveDreamAnalysis(
            newDream.id,
            analysis,
          );
          console.log(`Analysis saved for dream ID: ${newDream.id}`);

          // Update the newDream object with the analysis for immediate response
          newDream.analysis = updatedDream.analysis;
        } catch (err) {
          console.error("Error analyzing dream:", err);
        }

        res.status(201).json(newDream);
      } catch (error) {
        console.error("Error creating dream:", error);
        res.status(500).json({ message: "Fehler beim Erstellen des Traums" });
      }
    },
  );

  // Update a dream
  app.patch(
    "/api/dreams/:id",
    authenticateJWT,
    async (req: Request, res: Response) => {
      try {
        const id = parseInt(req.params.id);
        if (isNaN(id)) {
          return res.status(400).json({ message: "Ungültige Traum-ID" });
        }

        // Get the existing dream
        const existingDream = await storage.getDream(id);
        if (!existingDream) {
          return res.status(404).json({ message: "Traum nicht gefunden" });
        }

        // Check if user is the owner of the dream
        if (existingDream.userId !== req.user?.id) {
          return res
            .status(403)
            .json({ message: "Keine Berechtigung zum Ändern dieses Traums" });
        }

        // Process image if it's included as base64
        if (req.body.imageBase64) {
          const parts = req.body.imageBase64.split(";base64,");
          if (parts.length === 2) {
            const mimeType = parts[0].replace("data:", "");
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
        if ("tags" in req.body) {
          // Ensure tags is always an array, even if empty
          req.body.tags = Array.isArray(req.body.tags) ? req.body.tags : [];
        }

        // Update the dream
        const updatedDream = await storage.updateDream(id, req.body);
        if (!updatedDream) {
          return res.status(404).json({ message: "Traum nicht gefunden" });
        }

        // If the content was updated, re-analyze the dream
        if (req.body.content) {
          // Get previous dreams if user is authenticated
          const previousDreams = req.user
            ? (await storage.getDreamsByUserId(req.user.id))
                .filter((dream) => dream.id !== id)
                .slice(0, 5) // Use the 5 most recent dreams
                .map((dream) => ({
                  content: dream.content,
                  date: dream.createdAt,
                  analysis: dream.analysis,
                }))
            : [];

          try {
            console.log(`Starting analysis for updated dream ID: ${id}`);
            const analysis = await analyzeDream(
              req.body.content,
              previousDreams,
            );
            console.log(
              `Analysis completed for updated dream ID: ${id}, saving to database...`,
            );

            const dreamWithAnalysis = await storage.saveDreamAnalysis(
              id,
              analysis,
            );
            console.log(`Analysis saved for updated dream ID: ${id}`);

            // Update the updatedDream object with the analysis for immediate response
            updatedDream.analysis = dreamWithAnalysis.analysis;
          } catch (err) {
            console.error("Error analyzing updated dream:", err);
          }
        }

        res.json(updatedDream);
      } catch (error) {
        console.error("Error updating dream:", error);
        res
          .status(500)
          .json({ message: "Fehler beim Aktualisieren des Traums" });
      }
    },
  );

  // Delete a dream
  app.delete(
    "/api/dreams/:id",
    authenticateJWT,
    async (req: Request, res: Response) => {
      try {
        const id = parseInt(req.params.id);
        if (isNaN(id)) {
          return res.status(400).json({ message: "Ungültige Traum-ID" });
        }

        // Get the dream to access its image URL
        const dream = await storage.getDream(id);
        if (!dream) {
          return res.status(404).json({ message: "Traum nicht gefunden" });
        }

        // Check if user is the owner of the dream
        if (dream.userId !== req.user?.id) {
          return res
            .status(403)
            .json({ message: "Keine Berechtigung zum Löschen dieses Traums" });
        }

        // Delete associated image if it exists
        if (dream.imageUrl) {
          await deleteImage(dream.imageUrl);
        }

        // Delete the dream
        const success = await storage.deleteDream(id);
        if (!success) {
          return res.status(404).json({ message: "Traum nicht gefunden" });
        }

        res.status(204).send();
      } catch (error) {
        console.error("Error deleting dream:", error);
        res.status(500).json({ message: "Fehler beim Löschen des Traums" });
      }
    },
  );

  // Upload dream image
  app.post(
    "/api/dreams/:id/image",
    authenticateJWT,
    upload.single("image"),
    async (req: Request, res: Response) => {
      try {
        const id = parseInt(req.params.id);
        if (isNaN(id)) {
          return res.status(400).json({ message: "Ungültige Traum-ID" });
        }

        if (!req.file) {
          return res.status(400).json({ message: "Kein Bild hochgeladen" });
        }

        // Get the existing dream
        const dream = await storage.getDream(id);
        if (!dream) {
          return res.status(404).json({ message: "Traum nicht gefunden" });
        }

        // Check if user is the owner of the dream
        if (dream.userId !== req.user?.id) {
          return res
            .status(403)
            .json({ message: "Keine Berechtigung zum Ändern dieses Traums" });
        }

        // Delete the old image if it exists
        if (dream.imageUrl) {
          await deleteImage(dream.imageUrl);
        }

        // Convert buffer to base64 and save
        const base64Data = req.file.buffer.toString("base64");
        const mimeType = req.file.mimetype;
        const imagePath = await saveBase64Image(base64Data, mimeType);

        // Update the dream with the new image URL
        const updatedDream = await storage.updateDream(id, {
          imageUrl: imagePath,
        });
        if (!updatedDream) {
          return res.status(404).json({ message: "Traum nicht gefunden" });
        }

        res.json(updatedDream);
      } catch (error) {
        console.error("Error uploading image:", error);
        res.status(500).json({ message: "Fehler beim Hochladen des Bildes" });
      }
    },
  );

  // Generate AI image for a dream
  app.post(
    "/api/dreams/:id/generate-image",
    authenticateJWT,
    async (req: Request, res: Response) => {
      try {
        const id = parseInt(req.params.id);
        if (isNaN(id)) {
          return res.status(400).json({ message: "Ungültige Traum-ID" });
        }

        // Get the existing dream
        const dream = await storage.getDream(id);
        if (!dream) {
          return res.status(404).json({ message: "Traum nicht gefunden" });
        }

        // Check if user is the owner of the dream
        if (dream.userId !== req.user?.id) {
          return res
            .status(403)
            .json({ message: "Keine Berechtigung zum Ändern dieses Traums" });
        }

        // Parse analysis if present
        let analysis = null;
        if (dream.analysis) {
          try {
            analysis = JSON.parse(dream.analysis);
          } catch (error) {
            console.error("Error parsing dream analysis:", error);
          }
        }

        // Prepare mood info (handle both null and undefined)
        const moodInfo = {
          beforeSleep: dream.moodBeforeSleep ?? undefined,
          afterWakeup: dream.moodAfterWakeup ?? undefined,
          notes: dream.moodNotes ?? undefined,
        };

        // Generate dream image
        const imageUrl = await generateDreamImage(
          dream.content,
          analysis,
          dream.tags,
          moodInfo,
        );

        // Save the image to our system
        try {
          // Fetch the image
          console.log("Fetching image from:", imageUrl);
          const imageResponse = await fetch(imageUrl);
          if (!imageResponse.ok) {
            throw new Error(
              `Failed to fetch image: ${imageResponse.statusText}`,
            );
          }

          const arrayBuffer = await imageResponse.arrayBuffer();
          const buffer = Buffer.from(arrayBuffer);
          const base64Data = buffer.toString("base64");
          const mimeType =
            imageResponse.headers.get("content-type") || "image/jpeg";

          // Delete the old image if it exists
          if (dream.imageUrl) {
            await deleteImage(dream.imageUrl);
          }

          // Save the new image
          const imagePath = await saveBase64Image(base64Data, mimeType);

          // Update the dream with the new image URL
          const updatedDream = await storage.updateDream(id, {
            imageUrl: imagePath,
          });

          res.json({
            success: true,
            dream: updatedDream,
          });
        } catch (error) {
          console.error("Error saving generated image:", error);
          // Return the external URL if we couldn't save it locally
          res.json({
            success: true,
            imageUrl,
            message:
              "Bild wurde generiert, konnte aber nicht lokal gespeichert werden.",
          });
        }
      } catch (error) {
        console.error("Error generating dream image:", error);
        res.status(500).json({
          success: false,
          message: "Fehler bei der Bildgenerierung",
          details: (error as Error).message,
        });
      }
    },
  );

  // ========= Achievement Routes =========

  // Get all achievements
  app.get("/api/achievements", async (req: Request, res: Response) => {
    try {
      const achievements = await storage.getAllAchievements();
      res.json(achievements);
    } catch (error) {
      console.error("Error fetching achievements:", error);
      res.status(500).json({ message: "Fehler beim Laden der Erfolge" });
    }
  });

  // Get user's achievements
  app.get(
    "/api/achievements/user",
    authenticateJWT,
    async (req: Request, res: Response) => {
      try {
        if (!req.user) {
          return res.status(401).json({ message: "Nicht authentifiziert" });
        }

        const userAchievements = await storage.getUserAchievements(req.user.id);
        res.json(userAchievements);
      } catch (error) {
        console.error("Error fetching user achievements:", error);
        res
          .status(500)
          .json({ message: "Fehler beim Laden der Benutzer-Erfolge" });
      }
    },
  );

  // Get latest completed achievements for the user
  app.get(
    "/api/achievements/user/latest",
    authenticateJWT,
    async (req: Request, res: Response) => {
      try {
        if (!req.user) {
          return res.status(401).json({ message: "Nicht authentifiziert" });
        }

        const limit = parseInt(req.query.limit as string) || 5;
        const latestAchievements = await storage.getLatestUserAchievements(
          req.user.id,
          limit,
        );

        // Fetch full achievement details for each user achievement
        const achievementsWithDetails = await Promise.all(
          latestAchievements.map(async (ua) => {
            const achievement = await storage.getAchievement(ua.achievementId);
            return {
              ...ua,
              achievement,
            };
          }),
        );

        res.json(achievementsWithDetails);
      } catch (error) {
        console.error("Error fetching latest user achievements:", error);
        res
          .status(500)
          .json({ message: "Fehler beim Laden der neuesten Benutzer-Erfolge" });
      }
    },
  );

  // Create a new achievement (admin only)
  app.post(
    "/api/achievements",
    authenticateJWT,
    async (req: Request, res: Response) => {
      try {
        // In a real app, check for admin role
        // For now, validate the request body
        const parseResult = insertAchievementSchema.safeParse(req.body);
        if (!parseResult.success) {
          return res.status(400).json({
            message: "Ungültige Achievement-Daten",
            errors: parseResult.error.errors,
          });
        }

        const newAchievement = await storage.createAchievement(
          parseResult.data,
        );
        res.status(201).json(newAchievement);
      } catch (error) {
        console.error("Error creating achievement:", error);
        res.status(500).json({ message: "Fehler beim Erstellen des Erfolgs" });
      }
    },
  );

  // Check and process user achievements
  app.post(
    "/api/achievements/check",
    authenticateJWT,
    async (req: Request, res: Response) => {
      try {
        if (!req.user) {
          return res.status(401).json({ message: "Nicht authentifiziert" });
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
            (ua) => ua.achievementId === achievement.id && ua.isCompleted,
          );

          if (existingAchievement) {
            continue;
          }

          // Get or create user achievement
          let userAchievement = userAchievements.find(
            (ua) => ua.achievementId === achievement.id,
          );

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
              currentValue = dreams.filter((dream) => dream.imageUrl).length;
              break;
            case "analysisCount":
              // Count dreams with analysis
              currentValue = dreams.filter((dream) => dream.analysis).length;
              break;
            case "moodTracking":
              // Count dreams with mood tracking
              currentValue = dreams.filter(
                (dream) =>
                  dream.moodBeforeSleep !== null ||
                  dream.moodAfterWakeup !== null,
              ).length;
              break;
            case "dreamLength":
              // Count dreams with content longer than threshold
              const minLength =
                achievement.criteria.additionalParams?.minLength || 100;
              currentValue = dreams.filter(
                (dream) => dream.content.length > minLength,
              ).length;
              break;
            // Additional types would be handled here
          }

          // Create progress object
          const progress = {
            currentValue,
            requiredValue: achievement.criteria.threshold,
            lastUpdated: new Date().toISOString(),
            details: achievement.criteria.additionalParams || {},
          };

          // If user achievement doesn't exist, create it
          if (!userAchievement) {
            userAchievement = await storage.createUserAchievement({
              userId,
              achievementId: achievement.id,
              progress,
              isCompleted: currentValue >= achievement.criteria.threshold,
            });
          } else {
            // Otherwise update existing progress
            userAchievement = await storage.updateUserAchievementProgress(
              userAchievement.id,
              progress,
            );
          }

          // If achievement is completed, add to new achievements
          if (
            userAchievement &&
            userAchievement.isCompleted &&
            !existingAchievement
          ) {
            const timestamp = userAchievement.unlockedAt.toISOString();
            newAchievements.push({
              achievementId: achievement.id,
              achievementName: achievement.name,
              achievementDescription: achievement.description,
              iconName: achievement.iconName,
              category: achievement.category,
              difficulty: achievement.difficulty,
              timestamp,
            });
          }
        }

        res.json({
          achievements: userAchievements,
          newAchievements,
        });
      } catch (error) {
        console.error("Error checking achievements:", error);
        res.status(500).json({ message: "Fehler beim Prüfen der Erfolge" });
      }
    },
  );

  // Helper functions for achievement processing
  function calculateStreakDays(dreams: any[]): number {
    if (dreams.length === 0) return 0;

    // Sort dreams by date (newest first)
    const sortedDreams = [...dreams].sort(
      (a, b) => b.date.getTime() - a.date.getTime(),
    );

    // Get unique days (in ISO string format YYYY-MM-DD)
    const uniqueDays = new Set<string>();
    sortedDreams.forEach((dream) => {
      uniqueDays.add(dream.date.toISOString().split("T")[0]);
    });

    // Convert to array and sort (newest first)
    const days = Array.from(uniqueDays).sort().reverse();

    // Count consecutive days
    let currentStreak = 1;
    let maxStreak = 1;

    for (let i = 1; i < days.length; i++) {
      const prevDay = new Date(days[i - 1]);
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

    dreams.forEach((dream) => {
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
  app.get(
    "/api/journal",
    authenticateJWT,
    async (req: Request, res: Response) => {
      try {
        if (!req.user) {
          return res.status(401).json({ message: "Nicht authentifiziert" });
        }

        const entries = await storage.getJournalEntriesByUserId(req.user.id);
        res.json(entries);
      } catch (error) {
        console.error("Error fetching journal entries:", error);
        res
          .status(500)
          .json({ message: "Fehler beim Laden der Journaleinträge" });
      }
    },
  );

  // Generiert ein Stimmungsbild für einen Journaleintrag
  app.post(
    "/api/journal/generate-image",
    authenticateJWT,
    async (req: Request, res: Response) => {
      try {
        if (!req.user) {
          return res.status(401).json({ message: "Nicht authentifiziert" });
        }

        const {
          journalContent,
          colorImpression,
          spontaneousThought,
          tags,
          mood,
        } = req.body;

        if (!journalContent || !colorImpression || !spontaneousThought) {
          return res.status(400).json({
            message:
              "Journalinhalt, Farbeindrücke und spontane Gedanken werden benötigt",
          });
        }

        // OpenAI API aufrufen, um ein Bild zu generieren
        const { imageUrl, description } = await generateJournalMoodImage(
          journalContent,
          colorImpression,
          spontaneousThought,
          tags,
          mood,
        );

        res.json({ imageUrl, description });
      } catch (error) {
        console.error("Error generating journal mood image:", error);
        res
          .status(500)
          .json({ message: "Fehler bei der Generierung des Stimmungsbildes" });
      }
    },
  );

  // Get a specific journal entry
  app.get(
    "/api/journal/:id",
    authenticateJWT,
    async (req: Request, res: Response) => {
      try {
        const id = parseInt(req.params.id);
        if (isNaN(id)) {
          return res.status(400).json({ message: "Ungültige Eintrags-ID" });
        }

        const entry = await storage.getJournalEntry(id);
        if (!entry) {
          return res.status(404).json({ message: "Eintrag nicht gefunden" });
        }

        // Check if user is the owner of the entry
        if (entry.userId !== req.user?.id) {
          return res.status(403).json({
            message: "Keine Berechtigung zum Anzeigen dieses Eintrags",
          });
        }

        res.json(entry);
      } catch (error) {
        console.error("Error fetching journal entry:", error);
        res
          .status(500)
          .json({ message: "Fehler beim Laden des Journaleintrags" });
      }
    },
  );

  // Create a new journal entry
  app.post(
    "/api/journal",
    authenticateJWT,
    async (req: Request, res: Response) => {
      try {
        if (!req.user) {
          return res.status(401).json({ message: "Nicht authentifiziert" });
        }

        // Überprüfe, ob die Pflichtfelder vorhanden sind
        if (!req.body.title || !req.body.content) {
          return res.status(400).json({
            message: "Titel und Inhalt sind erforderlich",
          });
        }

        // Korrekt typisiertes Objekt mit erforderlichen und optionalen Feldern
        const journalData: InsertJournalEntry = {
          userId: req.user.id,
          title: req.body.title,
          content: req.body.content,
          date: req.body.date ? new Date(req.body.date) : new Date(),
          // Pflichtfelder mit Default-Werten
          isPrivate:
            req.body.isPrivate !== undefined ? req.body.isPrivate : true,
          includeInAnalysis:
            req.body.includeInAnalysis !== undefined
              ? req.body.includeInAnalysis
              : false,
        };

        // Optionale Felder nur hinzufügen, wenn sie vorhanden sind
        if (req.body.tags && Array.isArray(req.body.tags))
          journalData.tags = req.body.tags;
        if (req.body.mood !== undefined) journalData.mood = req.body.mood;
        if (req.body.imageUrl) journalData.imageUrl = req.body.imageUrl;
        if (req.body.relatedDreamIds)
          journalData.relatedDreamIds = req.body.relatedDreamIds;

        // Create the journal entry
        const newEntry = await storage.createJournalEntry(journalData);
        res.status(201).json(newEntry);
      } catch (error) {
        console.error("Error creating journal entry:", error);
        res
          .status(500)
          .json({ message: "Fehler beim Erstellen des Journaleintrags" });
      }
    },
  );

  // Update a journal entry
  app.patch(
    "/api/journal/:id",
    authenticateJWT,
    async (req: Request, res: Response) => {
      try {
        const id = parseInt(req.params.id);
        if (isNaN(id)) {
          return res.status(400).json({ message: "Ungültige Eintrags-ID" });
        }

        // Get the existing entry
        const existingEntry = await storage.getJournalEntry(id);
        if (!existingEntry) {
          return res.status(404).json({ message: "Eintrag nicht gefunden" });
        }

        // Check if user is the owner of the entry
        if (existingEntry.userId !== req.user?.id) {
          return res
            .status(403)
            .json({ message: "Keine Berechtigung zum Ändern dieses Eintrags" });
        }

        // Überprüfe, ob die Pflichtfelder vorhanden sind
        if (req.body.title === "" || req.body.content === "") {
          return res.status(400).json({
            message: "Titel und Inhalt dürfen nicht leer sein",
          });
        }

        // Bereinige die Eingabedaten für das Update
        const updateData: any = {};

        // Nur Felder aktualisieren, die tatsächlich gesendet wurden
        if ("title" in req.body) updateData.title = req.body.title;
        if ("content" in req.body) updateData.content = req.body.content;
        if ("date" in req.body) updateData.date = new Date(req.body.date);
        if ("mood" in req.body) updateData.mood = req.body.mood;
        if ("isPrivate" in req.body) updateData.isPrivate = req.body.isPrivate;
        if ("imageUrl" in req.body) updateData.imageUrl = req.body.imageUrl;
        if ("includeInAnalysis" in req.body)
          updateData.includeInAnalysis = req.body.includeInAnalysis;
        if ("relatedDreamIds" in req.body)
          updateData.relatedDreamIds = req.body.relatedDreamIds;

        // Process tags if they're included
        if ("tags" in req.body) {
          // Ensure tags is always an array, even if empty
          updateData.tags = Array.isArray(req.body.tags) ? req.body.tags : [];
        }

        // Update the journal entry
        const updatedEntry = await storage.updateJournalEntry(id, updateData);
        if (!updatedEntry) {
          return res.status(404).json({ message: "Eintrag nicht gefunden" });
        }

        res.json(updatedEntry);
      } catch (error) {
        console.error("Error updating journal entry:", error);
        res
          .status(500)
          .json({ message: "Fehler beim Aktualisieren des Journaleintrags" });
      }
    },
  );

  // Delete a journal entry
  app.delete(
    "/api/journal/:id",
    authenticateJWT,
    async (req: Request, res: Response) => {
      try {
        const id = parseInt(req.params.id);
        if (isNaN(id)) {
          return res.status(400).json({ message: "Ungültige Eintrags-ID" });
        }

        // Get the entry
        const entry = await storage.getJournalEntry(id);
        if (!entry) {
          return res.status(404).json({ message: "Eintrag nicht gefunden" });
        }

        // Check if user is the owner of the entry
        if (entry.userId !== req.user?.id) {
          return res.status(403).json({
            message: "Keine Berechtigung zum Löschen dieses Eintrags",
          });
        }

        // Delete the entry
        const success = await storage.deleteJournalEntry(id);
        if (!success) {
          return res.status(404).json({ message: "Eintrag nicht gefunden" });
        }

        res.status(204).send();
      } catch (error) {
        console.error("Error deleting journal entry:", error);
        res
          .status(500)
          .json({ message: "Fehler beim Löschen des Journaleintrags" });
      }
    },
  );

  // AI Assistant Chat API

  // Get all conversations for the current user
  app.get(
    "/api/assistant/conversations",
    authenticateJWT,
    async (req: Request, res: Response) => {
      try {
        if (!req.user) {
          return res.status(401).json({ message: "Nicht authentifiziert" });
        }

        const conversations = await storage.getAssistantConversationsByUserId(
          req.user.id,
        );
        res.json(conversations);
      } catch (error) {
        console.error("Error fetching assistant conversations:", error);
        res
          .status(500)
          .json({ message: "Fehler beim Laden der Unterhaltungen" });
      }
    },
  );

  // Get a specific conversation by ID
  app.get(
    "/api/assistant/conversations/:id",
    authenticateJWT,
    async (req: Request, res: Response) => {
      try {
        if (!req.user) {
          return res.status(401).json({ message: "Nicht authentifiziert" });
        }

        const id = parseInt(req.params.id);
        if (isNaN(id)) {
          return res
            .status(400)
            .json({ message: "Ungültige Konversations-ID" });
        }

        const conversation = await storage.getAssistantConversation(id);

        if (!conversation) {
          return res
            .status(404)
            .json({ message: "Unterhaltung nicht gefunden" });
        }

        // Check if user is the owner of the conversation
        if (conversation.userId !== req.user.id) {
          return res.status(403).json({
            message: "Keine Berechtigung zum Anzeigen dieser Unterhaltung",
          });
        }

        // Get all messages for this conversation
        const messages = await storage.getAssistantMessagesByConversationId(id);

        // Return conversation with messages
        res.json({
          conversation,
          messages,
        });
      } catch (error) {
        console.error("Error fetching assistant conversation:", error);
        res.status(500).json({ message: "Fehler beim Laden der Unterhaltung" });
      }
    },
  );

  // Create a new conversation
  app.post(
    "/api/assistant/conversations",
    authenticateJWT,
    async (req: Request, res: Response) => {
      try {
        if (!req.user) {
          return res.status(401).json({ message: "Nicht authentifiziert" });
        }

        const newConversation: InsertAssistantConversation = {
          userId: req.user.id,
          title: req.body.title || "Neue Unterhaltung",
          isArchived: false,
        };

        const conversation =
          await storage.createAssistantConversation(newConversation);
        res.status(201).json(conversation);
      } catch (error) {
        console.error("Error creating assistant conversation:", error);
        res
          .status(500)
          .json({ message: "Fehler beim Erstellen der Unterhaltung" });
      }
    },
  );

  // Update a conversation
  app.patch(
    "/api/assistant/conversations/:id",
    authenticateJWT,
    async (req: Request, res: Response) => {
      try {
        if (!req.user) {
          return res.status(401).json({ message: "Nicht authentifiziert" });
        }

        const id = parseInt(req.params.id);
        if (isNaN(id)) {
          return res
            .status(400)
            .json({ message: "Ungültige Konversations-ID" });
        }

        // Get the existing conversation
        const existingConversation = await storage.getAssistantConversation(id);
        if (!existingConversation) {
          return res
            .status(404)
            .json({ message: "Unterhaltung nicht gefunden" });
        }

        // Check if user is the owner of the conversation
        if (existingConversation.userId !== req.user.id) {
          return res.status(403).json({
            message: "Keine Berechtigung zum Ändern dieser Unterhaltung",
          });
        }

        // Update the conversation
        const update: Partial<InsertAssistantConversation> = {};
        if (req.body.title !== undefined) update.title = req.body.title;
        if (req.body.isArchived !== undefined)
          update.isArchived = req.body.isArchived;

        const updatedConversation = await storage.updateAssistantConversation(
          id,
          update,
        );
        if (!updatedConversation) {
          return res
            .status(404)
            .json({ message: "Fehler beim Aktualisieren der Unterhaltung" });
        }

        res.json(updatedConversation);
      } catch (error) {
        console.error("Error updating assistant conversation:", error);
        res
          .status(500)
          .json({ message: "Fehler beim Aktualisieren der Unterhaltung" });
      }
    },
  );

  // Delete a conversation
  app.delete(
    "/api/assistant/conversations/:id",
    authenticateJWT,
    async (req: Request, res: Response) => {
      try {
        if (!req.user) {
          return res.status(401).json({ message: "Nicht authentifiziert" });
        }

        const id = parseInt(req.params.id);
        if (isNaN(id)) {
          return res
            .status(400)
            .json({ message: "Ungültige Konversations-ID" });
        }

        // Get the existing conversation
        const existingConversation = await storage.getAssistantConversation(id);
        if (!existingConversation) {
          return res
            .status(404)
            .json({ message: "Unterhaltung nicht gefunden" });
        }

        // Check if user is the owner of the conversation
        if (existingConversation.userId !== req.user.id) {
          return res.status(403).json({
            message: "Keine Berechtigung zum Löschen dieser Unterhaltung",
          });
        }

        // Delete the conversation (this also deletes all associated messages due to CASCADE)
        const success = await storage.deleteAssistantConversation(id);
        if (!success) {
          return res
            .status(500)
            .json({ message: "Fehler beim Löschen der Unterhaltung" });
        }

        res.status(204).send();
      } catch (error) {
        console.error("Error deleting assistant conversation:", error);
        res
          .status(500)
          .json({ message: "Fehler beim Löschen der Unterhaltung" });
      }
    },
  );

  // Get all messages for a conversation
  app.get(
    "/api/assistant/conversations/:id/messages",
    authenticateJWT,
    async (req: Request, res: Response) => {
      try {
        if (!req.user) {
          return res.status(401).json({ message: "Nicht authentifiziert" });
        }

        const id = parseInt(req.params.id);
        if (isNaN(id)) {
          return res
            .status(400)
            .json({ message: "Ungültige Konversations-ID" });
        }

        // Get the conversation to check ownership
        const conversation = await storage.getAssistantConversation(id);
        if (!conversation) {
          return res
            .status(404)
            .json({ message: "Unterhaltung nicht gefunden" });
        }

        // Check if user is the owner of the conversation
        if (conversation.userId !== req.user.id) {
          return res.status(403).json({
            message: "Keine Berechtigung zum Anzeigen dieser Unterhaltung",
          });
        }

        const messages = await storage.getAssistantMessagesByConversationId(id);
        res.json(messages);
      } catch (error) {
        console.error("Error fetching assistant messages:", error);
        res.status(500).json({ message: "Fehler beim Laden der Nachrichten" });
      }
    },
  );

  // Send a message to the assistant (and get a response)
  app.post(
    "/api/assistant/chat",
    authenticateJWT,
    async (req: Request, res: Response) => {
      try {
        if (!req.user) {
          return res.status(401).json({ message: "Nicht authentifiziert" });
        }

        // Validate request
        if (!req.body.message) {
          return res
            .status(400)
            .json({ message: "Nachricht ist erforderlich" });
        }

        // Prepare the chat request
        const chatRequest: ChatRequest = {
          conversationId: req.body.conversationId,
          message: req.body.message,
          relatedDreamId: req.body.relatedDreamId,
          relatedJournalId: req.body.relatedJournalId,
        };

        // Process the chat request
        const response = await storage.processAssistantChatRequest(
          req.user.id,
          chatRequest,
        );
        res.json(response);
      } catch (error) {
        console.error("Error processing chat request:", error);
        res.status(500).json({
          message: "Fehler bei der Verarbeitung der Chat-Anfrage",
          detail: (error as Error).message,
        });
      }
    },
  );

  const httpServer = createServer(app);
  // File upload route for journal and other images
  app.post(
    "/api/upload",
    authenticateJWT,
    upload.single("image"),
    async (req: Request, res: Response) => {
      try {
        if (!req.file) {
          return res.status(400).json({ message: "Kein Bild hochgeladen" });
        }

        // Check if user is authenticated
        if (!req.user) {
          return res.status(401).json({ message: "Nicht authentifiziert" });
        }

        // Save the uploaded file
        const imageUrl = await saveUploadedFile(
          req.file.buffer,
          req.file.mimetype,
        );

        res.status(201).json({
          imageUrl,
          message: "Bild erfolgreich hochgeladen",
        });
      } catch (error) {
        console.error("Error uploading image:", error);
        res.status(500).json({ message: "Fehler beim Hochladen des Bildes" });
      }
    },
  );

  // Traumsymbol-Bibliothek API-Routen

  // Kulturen
  app.get("/api/cultures", async (req, res) => {
    try {
      const cultures = await storage.getAllCultures();
      res.json(cultures);
    } catch (error) {
      console.error("Error fetching cultures:", error);
      res.status(500).json({ message: "Fehler beim Abrufen der Kulturen" });
    }
  });

  app.get("/api/cultures/:id", async (req, res) => {
    try {
      const culture = await storage.getCulture(parseInt(req.params.id));

      if (!culture) {
        return res.status(404).json({ message: "Kultur nicht gefunden" });
      }

      res.json(culture);
    } catch (error) {
      console.error("Error fetching culture:", error);
      res.status(500).json({ message: "Fehler beim Abrufen der Kultur" });
    }
  });

  app.post("/api/cultures", authenticateJWT, async (req, res) => {
    try {
      const culture = await storage.createCulture(req.body);
      res.status(201).json(culture);
    } catch (error) {
      console.error("Error creating culture:", error);
      res.status(500).json({ message: "Fehler beim Erstellen der Kultur" });
    }
  });

  app.put("/api/cultures/:id", authenticateJWT, async (req, res) => {
    try {
      const culture = await storage.updateCulture(
        parseInt(req.params.id),
        req.body,
      );

      if (!culture) {
        return res.status(404).json({ message: "Kultur nicht gefunden" });
      }

      res.json(culture);
    } catch (error) {
      console.error("Error updating culture:", error);
      res.status(500).json({ message: "Fehler beim Aktualisieren der Kultur" });
    }
  });

  app.delete("/api/cultures/:id", authenticateJWT, async (req, res) => {
    try {
      const deleted = await storage.deleteCulture(parseInt(req.params.id));

      if (!deleted) {
        return res.status(404).json({ message: "Kultur nicht gefunden" });
      }

      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting culture:", error);
      res.status(500).json({ message: "Fehler beim Löschen der Kultur" });
    }
  });

  // Traumsymbole
  app.get("/api/dream-symbols", async (req, res) => {
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
      console.error("Error fetching dream symbols:", error);
      res.status(500).json({ message: "Fehler beim Abrufen der Traumsymbole" });
    }
  });

  app.get("/api/dream-symbols/:id", async (req, res) => {
    try {
      const symbol = await storage.getDreamSymbol(parseInt(req.params.id));

      if (!symbol) {
        return res.status(404).json({ message: "Traumsymbol nicht gefunden" });
      }

      res.json(symbol);
    } catch (error) {
      console.error("Error fetching dream symbol:", error);
      res.status(500).json({ message: "Fehler beim Abrufen des Traumsymbols" });
    }
  });

  app.post("/api/dream-symbols", authenticateJWT, async (req, res) => {
    try {
      const symbol = await storage.createDreamSymbol(req.body);
      res.status(201).json(symbol);
    } catch (error) {
      console.error("Error creating dream symbol:", error);
      res
        .status(500)
        .json({ message: "Fehler beim Erstellen des Traumsymbols" });
    }
  });

  app.put("/api/dream-symbols/:id", authenticateJWT, async (req, res) => {
    try {
      const symbol = await storage.updateDreamSymbol(
        parseInt(req.params.id),
        req.body,
      );

      if (!symbol) {
        return res.status(404).json({ message: "Traumsymbol nicht gefunden" });
      }

      res.json(symbol);
    } catch (error) {
      console.error("Error updating dream symbol:", error);
      res
        .status(500)
        .json({ message: "Fehler beim Aktualisieren des Traumsymbols" });
    }
  });

  app.delete("/api/dream-symbols/:id", authenticateJWT, async (req, res) => {
    try {
      const deleted = await storage.deleteDreamSymbol(parseInt(req.params.id));

      if (!deleted) {
        return res.status(404).json({ message: "Traumsymbol nicht gefunden" });
      }

      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting dream symbol:", error);
      res.status(500).json({ message: "Fehler beim Löschen des Traumsymbols" });
    }
  });

  // Kulturelle Interpretationen
  app.get("/api/cultural-interpretations", async (req, res) => {
    try {
      const { symbolId, cultureId } = req.query;

      let interpretations;
      if (symbolId) {
        interpretations = await storage.getCulturalInterpretationsBySymbolId(
          parseInt(symbolId as string),
        );
      } else if (cultureId) {
        interpretations = await storage.getCulturalInterpretationsByCultureId(
          parseInt(cultureId as string),
        );
      } else {
        return res.status(400).json({
          message: "Entweder symbolId oder cultureId muss angegeben werden",
        });
      }

      res.json(interpretations);
    } catch (error) {
      console.error("Error fetching cultural interpretations:", error);
      res.status(500).json({
        message: "Fehler beim Abrufen der kulturellen Interpretationen",
      });
    }
  });

  app.get("/api/cultural-interpretations/:id", async (req, res) => {
    try {
      const interpretation = await storage.getCulturalInterpretation(
        parseInt(req.params.id),
      );

      if (!interpretation) {
        return res
          .status(404)
          .json({ message: "Kulturelle Interpretation nicht gefunden" });
      }

      res.json(interpretation);
    } catch (error) {
      console.error("Error fetching cultural interpretation:", error);
      res.status(500).json({
        message: "Fehler beim Abrufen der kulturellen Interpretation",
      });
    }
  });

  app.post(
    "/api/cultural-interpretations",
    authenticateJWT,
    async (req, res) => {
      try {
        const interpretation = await storage.createCulturalInterpretation(
          req.body,
        );
        res.status(201).json(interpretation);
      } catch (error) {
        console.error("Error creating cultural interpretation:", error);
        res.status(500).json({
          message: "Fehler beim Erstellen der kulturellen Interpretation",
        });
      }
    },
  );

  app.put(
    "/api/cultural-interpretations/:id",
    authenticateJWT,
    async (req, res) => {
      try {
        const interpretation = await storage.updateCulturalInterpretation(
          parseInt(req.params.id),
          req.body,
        );

        if (!interpretation) {
          return res
            .status(404)
            .json({ message: "Kulturelle Interpretation nicht gefunden" });
        }

        res.json(interpretation);
      } catch (error) {
        console.error("Error updating cultural interpretation:", error);
        res.status(500).json({
          message: "Fehler beim Aktualisieren der kulturellen Interpretation",
        });
      }
    },
  );

  app.delete(
    "/api/cultural-interpretations/:id",
    authenticateJWT,
    async (req, res) => {
      try {
        const deleted = await storage.deleteCulturalInterpretation(
          parseInt(req.params.id),
        );

        if (!deleted) {
          return res
            .status(404)
            .json({ message: "Kulturelle Interpretation nicht gefunden" });
        }

        res.json({ success: true });
      } catch (error) {
        console.error("Error deleting cultural interpretation:", error);
        res.status(500).json({
          message: "Fehler beim Löschen der kulturellen Interpretation",
        });
      }
    },
  );

  // Symbol-Vergleiche
  app.get("/api/symbol-comparisons", async (req, res) => {
    try {
      const { symbolId } = req.query;

      if (!symbolId) {
        return res
          .status(400)
          .json({ message: "symbolId muss angegeben werden" });
      }

      const comparisons = await storage.getSymbolComparisonsBySymbolId(
        parseInt(symbolId as string),
      );
      res.json(comparisons);
    } catch (error) {
      console.error("Error fetching symbol comparisons:", error);
      res
        .status(500)
        .json({ message: "Fehler beim Abrufen der Symbol-Vergleiche" });
    }
  });

  app.get("/api/symbol-comparisons/:id", async (req, res) => {
    try {
      const comparison = await storage.getSymbolComparison(
        parseInt(req.params.id),
      );

      if (!comparison) {
        return res
          .status(404)
          .json({ message: "Symbol-Vergleich nicht gefunden" });
      }

      res.json(comparison);
    } catch (error) {
      console.error("Error fetching symbol comparison:", error);
      res
        .status(500)
        .json({ message: "Fehler beim Abrufen des Symbol-Vergleichs" });
    }
  });

  app.post("/api/symbol-comparisons", authenticateJWT, async (req, res) => {
    try {
      const comparison = await storage.createSymbolComparison(req.body);
      res.status(201).json(comparison);
    } catch (error) {
      console.error("Error creating symbol comparison:", error);
      res
        .status(500)
        .json({ message: "Fehler beim Erstellen des Symbol-Vergleichs" });
    }
  });

  app.put("/api/symbol-comparisons/:id", authenticateJWT, async (req, res) => {
    try {
      const comparison = await storage.updateSymbolComparison(
        parseInt(req.params.id),
        req.body,
      );

      if (!comparison) {
        return res
          .status(404)
          .json({ message: "Symbol-Vergleich nicht gefunden" });
      }

      res.json(comparison);
    } catch (error) {
      console.error("Error updating symbol comparison:", error);
      res
        .status(500)
        .json({ message: "Fehler beim Aktualisieren des Symbol-Vergleichs" });
    }
  });

  app.delete(
    "/api/symbol-comparisons/:id",
    authenticateJWT,
    async (req, res) => {
      try {
        const deleted = await storage.deleteSymbolComparison(
          parseInt(req.params.id),
        );

        if (!deleted) {
          return res
            .status(404)
            .json({ message: "Symbol-Vergleich nicht gefunden" });
        }

        res.json({ success: true });
      } catch (error) {
        console.error("Error deleting symbol comparison:", error);
        res
          .status(500)
          .json({ message: "Fehler beim Löschen des Symbol-Vergleichs" });
      }
    },
  );

  // User profile endpoints
  app.get("/api/user/profile", authenticateJWT, async (req, res) => {
    try {
      const user = await storage.getUserById(req.user!.id);

      if (!user) {
        return res.status(404).json({ message: "Benutzer nicht gefunden" });
      }

      // Don't send password back to client
      const { password, ...userWithoutPassword } = user;

      // Ensure all expected fields are in the response
      const profile = {
        ...userWithoutPassword,
        username: userWithoutPassword.username || "",
        name: userWithoutPassword.name || userWithoutPassword.username || "",
        email: userWithoutPassword.email || "",
      };

      res.json(profile);
    } catch (error) {
      console.error("Error fetching user profile:", error);
      res
        .status(500)
        .json({ message: "Fehler beim Abrufen des Benutzerprofils" });
    }
  });

  app.patch("/api/user/profile", authenticateJWT, async (req, res) => {
    try {
      const { name, email } = req.body;

      // Update user profile
      const updatedUser = await storage.updateUser(req.user!.id, {
        name,
        email,
      });

      if (!updatedUser) {
        return res.status(404).json({ message: "Benutzer nicht gefunden" });
      }

      // Don't send password back to client
      const { password, ...userWithoutPassword } = updatedUser;

      // Ensure all expected fields are in the response
      const profile = {
        ...userWithoutPassword,
        username: userWithoutPassword.username || "",
        name: userWithoutPassword.name || userWithoutPassword.username || "",
        email: userWithoutPassword.email || "",
      };

      res.json(profile);
    } catch (error) {
      console.error("Error updating user profile:", error);
      console.error("Error stack:", (error as Error).stack);
      res
        .status(500)
        .json({ message: "Fehler beim Aktualisieren des Benutzerprofils" });
    }
  });

  // Benutzer-Favoriten
  app.get("/api/user/symbol-favorites", authenticateJWT, async (req, res) => {
    try {
      console.log(`Fetching symbol favorites for user ID: ${req.user!.id}`);
      const favorites = await storage.getUserSymbolFavoritesByUserId(
        req.user!.id,
      );
      res.json(favorites);
    } catch (error) {
      console.error("Error fetching user symbol favorites:", error);
      console.error("Error stack:", (error as Error).stack);
      res
        .status(500)
        .json({ message: "Fehler beim Abrufen der Benutzer-Favoriten" });
    }
  });

  app.post("/api/user/symbol-favorites", authenticateJWT, async (req, res) => {
    try {
      const favorite = await storage.createUserSymbolFavorite({
        userId: req.user!.id,
        symbolId: req.body.symbolId,
        notes: req.body.notes,
      });

      res.status(201).json(favorite);
    } catch (error) {
      console.error("Error creating user symbol favorite:", error);
      res
        .status(500)
        .json({ message: "Fehler beim Erstellen des Benutzer-Favoriten" });
    }
  });

  app.delete(
    "/api/user/symbol-favorites/:id",
    authenticateJWT,
    async (req, res) => {
      try {
        const deleted = await storage.deleteUserSymbolFavorite(
          parseInt(req.params.id),
        );

        if (!deleted) {
          return res
            .status(404)
            .json({ message: "Benutzer-Favorit nicht gefunden" });
        }

        res.json({ success: true });
      } catch (error) {
        console.error("Error deleting user symbol favorite:", error);
        res
          .status(500)
          .json({ message: "Fehler beim Löschen des Benutzer-Favoriten" });
      }
    },
  );

  // Update dream tags
  app.patch(
    "/api/dreams/:id/tags",
    authenticateJWT,
    async (req: Request, res: Response) => {
      try {
        if (!req.user) {
          return res.status(401).json({ message: "Unauthorized" });
        }

        const dreamId = parseInt(req.params.id, 10);
        const { tags } = req.body;

        if (!Array.isArray(tags)) {
          return res.status(400).json({ message: "Tags must be an array" });
        }

        const dream = await storage.getDream(dreamId);

        if (!dream) {
          return res.status(404).json({ message: "Dream not found" });
        }

        if (dream.userId !== req.user.id) {
          return res.status(403).json({ message: "Forbidden" });
        }

        const updatedDream = await storage.updateDreamTags(dreamId, tags);

        res.json(updatedDream);
      } catch (error) {
        console.error("Error updating dream tags:", error);
        res.status(500).json({ message: "Internal server error" });
      }
    },
  );

  // Update dream mood data
  app.patch(
    "/api/dreams/:id/mood",
    authenticateJWT,
    async (req: Request, res: Response) => {
      try {
        if (!req.user) {
          return res.status(401).json({ message: "Nicht authentifiziert" });
        }

        const dreamId = parseInt(req.params.id, 10);
        const { beforeSleep, afterWakeup, notes } = req.body;

        // Validate mood data
        const moodData: MoodData = {};

        if (beforeSleep !== undefined) {
          if (
            typeof beforeSleep !== "number" ||
            beforeSleep < 1 ||
            beforeSleep > 10
          ) {
            return res.status(400).json({
              message:
                "Stimmung vor dem Schlafen muss zwischen 1 und 10 liegen",
            });
          }
          moodData.beforeSleep = beforeSleep;
        }

        if (afterWakeup !== undefined) {
          if (
            typeof afterWakeup !== "number" ||
            afterWakeup < 1 ||
            afterWakeup > 10
          ) {
            return res.status(400).json({
              message:
                "Stimmung nach dem Aufwachen muss zwischen 1 und 10 liegen",
            });
          }
          moodData.afterWakeup = afterWakeup;
        }

        if (notes !== undefined) {
          if (typeof notes !== "string") {
            return res
              .status(400)
              .json({ message: "Notizen müssen ein Text sein" });
          }
          moodData.notes = notes;
        }

        const dream = await storage.getDream(dreamId);

        if (!dream) {
          return res.status(404).json({ message: "Traum nicht gefunden" });
        }

        if (dream.userId !== req.user.id) {
          return res.status(403).json({ message: "Nicht berechtigt" });
        }

        // Update the mood data in the database
        const updatedDream = await storage.updateDreamMood(dreamId, moodData);

        res.json(updatedDream);
      } catch (error) {
        console.error("Error updating dream mood:", error);
        res.status(500).json({ message: "Interner Serverfehler" });
      }
    },
  );

  // <Collaborative Dream Interpretation>

  // Shared Dreams Routes
  // Get all public shared dreams with optional pagination
  app.get(
    "/api/community/dreams/public",
    async (req: Request, res: Response) => {
      try {
        const limit = req.query.limit
          ? parseInt(req.query.limit as string)
          : undefined;
        const offset = req.query.offset
          ? parseInt(req.query.offset as string)
          : undefined;

        const dreams = await storage.getPublicSharedDreams(limit, offset);
        res.json(dreams);
      } catch (error) {
        console.error("Error fetching public shared dreams:", error);
        res.status(500).json({
          message: "Fehler beim Laden der öffentlichen Traumeinträge",
        });
      }
    },
  );

  // Get all community shared dreams with optional pagination
  app.get("/api/community/dreams", async (req: Request, res: Response) => {
    try {
      const limit = req.query.limit
        ? parseInt(req.query.limit as string)
        : undefined;
      const offset = req.query.offset
        ? parseInt(req.query.offset as string)
        : undefined;

      const dreams = await storage.getCommunitySharedDreams(limit, offset);
      res.json(dreams);
    } catch (error) {
      console.error("Error fetching community shared dreams:", error);
      res
        .status(500)
        .json({ message: "Fehler beim Laden der Community-Traumeinträge" });
    }
  });

  // Get featured shared dreams
  app.get(
    "/api/community/dreams/featured",
    async (req: Request, res: Response) => {
      try {
        const limit = req.query.limit
          ? parseInt(req.query.limit as string)
          : undefined;

        const dreams = await storage.getFeaturedSharedDreams(limit);
        res.json(dreams);
      } catch (error) {
        console.error("Error fetching featured shared dreams:", error);
        res
          .status(500)
          .json({ message: "Fehler beim Laden der empfohlenen Traumeinträge" });
      }
    },
  );

  // Get all shared dreams by the authenticated user
  app.get(
    "/api/community/dreams/my",
    authenticateJWT,
    async (req: Request, res: Response) => {
      try {
        if (!req.user) {
          return res.status(401).json({ message: "Nicht authentifiziert" });
        }

        const dreams = await storage.getSharedDreamsByUserId(req.user.id);
        res.json(dreams);
      } catch (error) {
        console.error("Error fetching user shared dreams:", error);
        res
          .status(500)
          .json({ message: "Fehler beim Laden Ihrer geteilten Traumeinträge" });
      }
    },
  );

  // Get a specific shared dream by ID
  app.get("/api/community/dreams/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Ungültige Traum-ID" });
      }

      const dream = await storage.getSharedDream(id);
      if (!dream) {
        return res
          .status(404)
          .json({ message: "Geteilter Traum nicht gefunden" });
      }

      // Increment view count
      await storage.incrementSharedDreamViewCount(id);

      // If the dream is private, only the owner can view it
      if (
        dream.visibility === "private" &&
        (!req.user || dream.userId !== req.user.id)
      ) {
        return res
          .status(403)
          .json({ message: "Keine Berechtigung zum Anzeigen dieses Traums" });
      }

      res.json(dream);
    } catch (error) {
      console.error("Error fetching shared dream:", error);
      res
        .status(500)
        .json({ message: "Fehler beim Laden des geteilten Traums" });
    }
  });

  // Create a new shared dream
  app.post(
    "/api/community/dreams",
    authenticateJWT,
    async (req: Request, res: Response) => {
      try {
        if (!req.user) {
          return res.status(401).json({ message: "Nicht authentifiziert" });
        }

        // Validate the request body
        const parseResult = insertSharedDreamSchema.safeParse(req.body);
        if (!parseResult.success) {
          return res.status(400).json({
            message: "Ungültige Daten für geteilten Traum",
            errors: parseResult.error.errors,
          });
        }

        // Set the user ID from the authenticated user
        parseResult.data.userId = req.user.id;

        // Create the shared dream
        const newSharedDream = await storage.createSharedDream(
          parseResult.data,
        );

        res.status(201).json(newSharedDream);
      } catch (error) {
        console.error("Error creating shared dream:", error);
        res
          .status(500)
          .json({ message: "Fehler beim Erstellen des geteilten Traums" });
      }
    },
  );

  // Update a shared dream
  app.patch(
    "/api/community/dreams/:id",
    authenticateJWT,
    async (req: Request, res: Response) => {
      try {
        if (!req.user) {
          return res.status(401).json({ message: "Nicht authentifiziert" });
        }

        const id = parseInt(req.params.id);
        if (isNaN(id)) {
          return res.status(400).json({ message: "Ungültige Traum-ID" });
        }

        // Get the existing shared dream
        const existingDream = await storage.getSharedDream(id);
        if (!existingDream) {
          return res
            .status(404)
            .json({ message: "Geteilter Traum nicht gefunden" });
        }

        // Check if user is the owner of the dream
        if (existingDream.userId !== req.user.id) {
          return res
            .status(403)
            .json({ message: "Keine Berechtigung zum Ändern dieses Traums" });
        }

        // Update the shared dream
        const updatedDream = await storage.updateSharedDream(id, req.body);
        if (!updatedDream) {
          return res
            .status(404)
            .json({ message: "Geteilter Traum nicht gefunden" });
        }

        res.json(updatedDream);
      } catch (error) {
        console.error("Error updating shared dream:", error);
        res
          .status(500)
          .json({ message: "Fehler beim Aktualisieren des geteilten Traums" });
      }
    },
  );

  // Delete a shared dream
  app.delete(
    "/api/community/dreams/:id",
    authenticateJWT,
    async (req: Request, res: Response) => {
      try {
        if (!req.user) {
          return res.status(401).json({ message: "Nicht authentifiziert" });
        }

        const id = parseInt(req.params.id);
        if (isNaN(id)) {
          return res.status(400).json({ message: "Ungültige Traum-ID" });
        }

        // Get the shared dream
        const dream = await storage.getSharedDream(id);
        if (!dream) {
          return res
            .status(404)
            .json({ message: "Geteilter Traum nicht gefunden" });
        }

        // Check if user is the owner of the dream
        if (dream.userId !== req.user.id) {
          return res
            .status(403)
            .json({ message: "Keine Berechtigung zum Löschen dieses Traums" });
        }

        // Delete the shared dream
        const success = await storage.deleteSharedDream(id);
        if (!success) {
          return res
            .status(404)
            .json({ message: "Geteilter Traum nicht gefunden" });
        }

        res.status(204).send();
      } catch (error) {
        console.error("Error deleting shared dream:", error);
        res
          .status(500)
          .json({ message: "Fehler beim Löschen des geteilten Traums" });
      }
    },
  );

  // Dream Comments Routes
  // Get all comments for a shared dream
  app.get(
    "/api/community/dreams/:dreamId/comments",
    async (req: Request, res: Response) => {
      try {
        const dreamId = parseInt(req.params.dreamId);
        if (isNaN(dreamId)) {
          return res.status(400).json({ message: "Ungültige Traum-ID" });
        }

        // Check if the shared dream exists
        const dream = await storage.getSharedDream(dreamId);
        if (!dream) {
          return res
            .status(404)
            .json({ message: "Geteilter Traum nicht gefunden" });
        }

        // If the dream is private, only the owner can view comments
        if (
          dream.visibility === "private" &&
          (!req.user || dream.userId !== req.user.id)
        ) {
          return res.status(403).json({
            message: "Keine Berechtigung zum Anzeigen der Kommentare",
          });
        }

        // Get comments
        const comments = await storage.getDreamCommentsBySharedDreamId(dreamId);

        res.json(comments);
      } catch (error) {
        console.error("Error fetching dream comments:", error);
        res.status(500).json({ message: "Fehler beim Laden der Kommentare" });
      }
    },
  );

  // Create a new comment for a shared dream
  app.post(
    "/api/community/dreams/:dreamId/comments",
    authenticateJWT,
    async (req: Request, res: Response) => {
      try {
        if (!req.user) {
          return res.status(401).json({ message: "Nicht authentifiziert" });
        }

        const dreamId = parseInt(req.params.dreamId);
        if (isNaN(dreamId)) {
          return res.status(400).json({ message: "Ungültige Traum-ID" });
        }

        // Check if the shared dream exists
        const dream = await storage.getSharedDream(dreamId);
        if (!dream) {
          return res
            .status(404)
            .json({ message: "Geteilter Traum nicht gefunden" });
        }

        // Check if comments are allowed
        if (!dream.allowComments) {
          return res
            .status(403)
            .json({ message: "Kommentare sind für diesen Traum deaktiviert" });
        }

        // If it's an interpretation, check if interpretations are allowed
        if (req.body.isInterpretation && !dream.allowInterpretations) {
          return res.status(403).json({
            message: "Interpretationen sind für diesen Traum deaktiviert",
          });
        }

        // Validate the request body
        const parseResult = insertDreamCommentSchema.safeParse({
          ...req.body,
          sharedDreamId: dreamId,
          userId: req.user.id,
        });

        if (!parseResult.success) {
          return res.status(400).json({
            message: "Ungültige Kommentardaten",
            errors: parseResult.error.errors,
          });
        }

        // Create the comment
        const newComment = await storage.createDreamComment(parseResult.data);

        res.status(201).json(newComment);
      } catch (error) {
        console.error("Error creating dream comment:", error);
        res
          .status(500)
          .json({ message: "Fehler beim Erstellen des Kommentars" });
      }
    },
  );

  // Update a comment
  app.patch(
    "/api/community/comments/:id",
    authenticateJWT,
    async (req: Request, res: Response) => {
      try {
        if (!req.user) {
          return res.status(401).json({ message: "Nicht authentifiziert" });
        }

        const id = parseInt(req.params.id);
        if (isNaN(id)) {
          return res.status(400).json({ message: "Ungültige Kommentar-ID" });
        }

        // Get the existing comment
        const existingComment = await storage.getDreamComment(id);
        if (!existingComment) {
          return res.status(404).json({ message: "Kommentar nicht gefunden" });
        }

        // Check if user is the owner of the comment
        if (existingComment.userId !== req.user.id) {
          return res.status(403).json({
            message: "Keine Berechtigung zum Ändern dieses Kommentars",
          });
        }

        // Update the comment
        const updatedComment = await storage.updateDreamComment(id, req.body);
        if (!updatedComment) {
          return res.status(404).json({ message: "Kommentar nicht gefunden" });
        }

        res.json(updatedComment);
      } catch (error) {
        console.error("Error updating dream comment:", error);
        res
          .status(500)
          .json({ message: "Fehler beim Aktualisieren des Kommentars" });
      }
    },
  );

  // Delete a comment
  app.delete(
    "/api/community/comments/:id",
    authenticateJWT,
    async (req: Request, res: Response) => {
      try {
        if (!req.user) {
          return res.status(401).json({ message: "Nicht authentifiziert" });
        }

        const id = parseInt(req.params.id);
        if (isNaN(id)) {
          return res.status(400).json({ message: "Ungültige Kommentar-ID" });
        }

        // Get the comment
        const comment = await storage.getDreamComment(id);
        if (!comment) {
          return res.status(404).json({ message: "Kommentar nicht gefunden" });
        }

        // Get the shared dream to check if user is the dream owner
        const dream = await storage.getSharedDream(comment.sharedDreamId);

        // Check if user is the owner of the comment or the owner of the dream
        if (comment.userId !== req.user.id && dream?.userId !== req.user.id) {
          return res.status(403).json({
            message: "Keine Berechtigung zum Löschen dieses Kommentars",
          });
        }

        // Delete the comment
        const success = await storage.deleteDreamComment(id);
        if (!success) {
          return res.status(404).json({ message: "Kommentar nicht gefunden" });
        }

        res.status(204).send();
      } catch (error) {
        console.error("Error deleting dream comment:", error);
        res.status(500).json({ message: "Fehler beim Löschen des Kommentars" });
      }
    },
  );

  // Comment Likes Routes
  // Like a comment
  app.post(
    "/api/community/comments/:commentId/like",
    authenticateJWT,
    async (req: Request, res: Response) => {
      try {
        if (!req.user) {
          return res.status(401).json({ message: "Nicht authentifiziert" });
        }

        const commentId = parseInt(req.params.commentId);
        if (isNaN(commentId)) {
          return res.status(400).json({ message: "Ungültige Kommentar-ID" });
        }

        // Check if the comment exists
        const comment = await storage.getDreamComment(commentId);
        if (!comment) {
          return res.status(404).json({ message: "Kommentar nicht gefunden" });
        }

        // Check if user has already liked this comment
        const existingLike = await storage.getCommentLike(
          commentId,
          req.user.id,
        );
        if (existingLike) {
          return res
            .status(400)
            .json({ message: "Kommentar wurde bereits geliked" });
        }

        // Create the like
        const newLike = await storage.createCommentLike({
          commentId,
          userId: req.user.id,
        });

        res.status(201).json(newLike);
      } catch (error) {
        console.error("Error liking comment:", error);
        res.status(500).json({ message: "Fehler beim Liken des Kommentars" });
      }
    },
  );

  // Unlike a comment
  app.delete(
    "/api/community/comments/:commentId/like",
    authenticateJWT,
    async (req: Request, res: Response) => {
      try {
        if (!req.user) {
          return res.status(401).json({ message: "Nicht authentifiziert" });
        }

        const commentId = parseInt(req.params.commentId);
        if (isNaN(commentId)) {
          return res.status(400).json({ message: "Ungültige Kommentar-ID" });
        }

        // Check if user has liked this comment
        const existingLike = await storage.getCommentLike(
          commentId,
          req.user.id,
        );
        if (!existingLike) {
          return res.status(404).json({ message: "Like nicht gefunden" });
        }

        // Delete the like
        const success = await storage.deleteCommentLike(existingLike.id);
        if (!success) {
          return res.status(404).json({ message: "Like nicht gefunden" });
        }

        res.status(204).send();
      } catch (error) {
        console.error("Error unliking comment:", error);
        res.status(500).json({ message: "Fehler beim Entfernen des Likes" });
      }
    },
  );

  // Dream Challenges Routes
  // Get all active challenges
  app.get(
    "/api/community/challenges/active",
    async (req: Request, res: Response) => {
      try {
        const challenges = await storage.getActiveDreamChallenges();
        res.json(challenges);
      } catch (error) {
        console.error("Error fetching active challenges:", error);
        res
          .status(500)
          .json({ message: "Fehler beim Laden der aktiven Challenges" });
      }
    },
  );

  // Get all challenges
  app.get("/api/community/challenges", async (req: Request, res: Response) => {
    try {
      const challenges = await storage.getAllDreamChallenges();
      res.json(challenges);
    } catch (error) {
      console.error("Error fetching all challenges:", error);
      res.status(500).json({ message: "Fehler beim Laden der Challenges" });
    }
  });

  // Get a specific challenge by ID
  app.get(
    "/api/community/challenges/:id",
    async (req: Request, res: Response) => {
      try {
        const id = parseInt(req.params.id);
        if (isNaN(id)) {
          return res.status(400).json({ message: "Ungültige Challenge-ID" });
        }

        const challenge = await storage.getDreamChallenge(id);
        if (!challenge) {
          return res.status(404).json({ message: "Challenge nicht gefunden" });
        }

        res.json(challenge);
      } catch (error) {
        console.error("Error fetching challenge:", error);
        res.status(500).json({ message: "Fehler beim Laden der Challenge" });
      }
    },
  );

  // Create a new challenge
  app.post(
    "/api/community/challenges",
    authenticateJWT,
    async (req: Request, res: Response) => {
      try {
        if (!req.user) {
          return res.status(401).json({ message: "Nicht authentifiziert" });
        }

        // Validate the request body
        const parseResult = insertDreamChallengeSchema.safeParse({
          ...req.body,
          createdBy: req.user.id,
        });

        if (!parseResult.success) {
          return res.status(400).json({
            message: "Ungültige Challenge-Daten",
            errors: parseResult.error.errors,
          });
        }

        // Create the challenge
        const newChallenge = await storage.createDreamChallenge(
          parseResult.data,
        );

        res.status(201).json(newChallenge);
      } catch (error) {
        console.error("Error creating challenge:", error);
        res
          .status(500)
          .json({ message: "Fehler beim Erstellen der Challenge" });
      }
    },
  );

  // Update a challenge
  app.patch(
    "/api/community/challenges/:id",
    authenticateJWT,
    async (req: Request, res: Response) => {
      try {
        if (!req.user) {
          return res.status(401).json({ message: "Nicht authentifiziert" });
        }

        const id = parseInt(req.params.id);
        if (isNaN(id)) {
          return res.status(400).json({ message: "Ungültige Challenge-ID" });
        }

        // Get the existing challenge
        const existingChallenge = await storage.getDreamChallenge(id);
        if (!existingChallenge) {
          return res.status(404).json({ message: "Challenge nicht gefunden" });
        }

        // Check if user is the creator of the challenge
        if (existingChallenge.createdBy !== req.user.id) {
          return res.status(403).json({
            message: "Keine Berechtigung zum Ändern dieser Challenge",
          });
        }

        // Update the challenge
        const updatedChallenge = await storage.updateDreamChallenge(
          id,
          req.body,
        );
        if (!updatedChallenge) {
          return res.status(404).json({ message: "Challenge nicht gefunden" });
        }

        res.json(updatedChallenge);
      } catch (error) {
        console.error("Error updating challenge:", error);
        res
          .status(500)
          .json({ message: "Fehler beim Aktualisieren der Challenge" });
      }
    },
  );

  // Delete a challenge
  app.delete(
    "/api/community/challenges/:id",
    authenticateJWT,
    async (req: Request, res: Response) => {
      try {
        if (!req.user) {
          return res.status(401).json({ message: "Nicht authentifiziert" });
        }

        const id = parseInt(req.params.id);
        if (isNaN(id)) {
          return res.status(400).json({ message: "Ungültige Challenge-ID" });
        }

        // Get the challenge
        const challenge = await storage.getDreamChallenge(id);
        if (!challenge) {
          return res.status(404).json({ message: "Challenge nicht gefunden" });
        }

        // Check if user is the creator of the challenge
        if (challenge.createdBy !== req.user.id) {
          return res.status(403).json({
            message: "Keine Berechtigung zum Löschen dieser Challenge",
          });
        }

        // Delete the challenge
        const success = await storage.deleteDreamChallenge(id);
        if (!success) {
          return res.status(404).json({ message: "Challenge nicht gefunden" });
        }

        res.status(204).send();
      } catch (error) {
        console.error("Error deleting challenge:", error);
        res.status(500).json({ message: "Fehler beim Löschen der Challenge" });
      }
    },
  );

  // Challenge Submissions Routes
  // Get all submissions for a challenge
  app.get(
    "/api/community/challenges/:challengeId/submissions",
    authenticateJWT,
    async (req: Request, res: Response) => {
      try {
        if (!req.user) {
          return res.status(401).json({ message: "Nicht authentifiziert" });
        }

        const challengeId = parseInt(req.params.challengeId);
        if (isNaN(challengeId)) {
          return res.status(400).json({ message: "Ungültige Challenge-ID" });
        }

        // Check if the challenge exists
        const challenge = await storage.getDreamChallenge(challengeId);
        if (!challenge) {
          return res.status(404).json({ message: "Challenge nicht gefunden" });
        }

        // Get submissions
        const submissions =
          await storage.getChallengeSubmissionsByChallengeId(challengeId);

        res.json(submissions);
      } catch (error) {
        console.error("Error fetching challenge submissions:", error);
        res
          .status(500)
          .json({ message: "Fehler beim Laden der Einreichungen" });
      }
    },
  );

  // Get all submissions by the authenticated user
  app.get(
    "/api/community/submissions/my",
    authenticateJWT,
    async (req: Request, res: Response) => {
      try {
        if (!req.user) {
          return res.status(401).json({ message: "Nicht authentifiziert" });
        }

        const submissions = await storage.getChallengeSubmissionsByUserId(
          req.user.id,
        );
        res.json(submissions);
      } catch (error) {
        console.error("Error fetching user submissions:", error);
        res
          .status(500)
          .json({ message: "Fehler beim Laden Ihrer Einreichungen" });
      }
    },
  );

  // Create a new submission for a challenge
  app.post(
    "/api/community/challenges/:challengeId/submissions",
    authenticateJWT,
    async (req: Request, res: Response) => {
      try {
        if (!req.user) {
          return res.status(401).json({ message: "Nicht authentifiziert" });
        }

        const challengeId = parseInt(req.params.challengeId);
        if (isNaN(challengeId)) {
          return res.status(400).json({ message: "Ungültige Challenge-ID" });
        }

        // Check if the challenge exists and is active
        const challenge = await storage.getDreamChallenge(challengeId);
        if (!challenge) {
          return res.status(404).json({ message: "Challenge nicht gefunden" });
        }

        const now = new Date();
        if (
          !challenge.isActive ||
          challenge.startDate > now ||
          challenge.endDate < now
        ) {
          return res.status(400).json({
            message:
              "Challenge ist nicht aktiv oder der Einreichungszeitraum ist abgelaufen",
          });
        }

        // Check if the shared dream exists
        const sharedDreamId = parseInt(req.body.sharedDreamId);
        if (isNaN(sharedDreamId)) {
          return res.status(400).json({ message: "Ungültige Traum-ID" });
        }

        const sharedDream = await storage.getSharedDream(sharedDreamId);
        if (!sharedDream) {
          return res
            .status(404)
            .json({ message: "Geteilter Traum nicht gefunden" });
        }

        // Check if user is the owner of the shared dream
        if (sharedDream.userId !== req.user.id) {
          return res.status(403).json({
            message: "Keine Berechtigung zum Einreichen dieses Traums",
          });
        }

        // Validate the request body
        const parseResult = insertChallengeSubmissionSchema.safeParse({
          challengeId,
          sharedDreamId,
          userId: req.user.id,
          notes: req.body.notes,
        });

        if (!parseResult.success) {
          return res.status(400).json({
            message: "Ungültige Einreichungsdaten",
            errors: parseResult.error.errors,
          });
        }

        // Create the submission
        const newSubmission = await storage.createChallengeSubmission(
          parseResult.data,
        );

        res.status(201).json(newSubmission);
      } catch (error) {
        console.error("Error creating challenge submission:", error);
        res
          .status(500)
          .json({ message: "Fehler beim Erstellen der Einreichung" });
      }
    },
  );

  // Update a submission status (for challenge creators only)
  app.patch(
    "/api/community/submissions/:id",
    authenticateJWT,
    async (req: Request, res: Response) => {
      try {
        if (!req.user) {
          return res.status(401).json({ message: "Nicht authentifiziert" });
        }

        const id = parseInt(req.params.id);
        if (isNaN(id)) {
          return res.status(400).json({ message: "Ungültige Einreichungs-ID" });
        }

        // Check if the submission exists
        const submission = await storage.getChallengeSubmission(id);
        if (!submission) {
          return res
            .status(404)
            .json({ message: "Einreichung nicht gefunden" });
        }

        // Get the challenge to check if user is the creator
        const challenge = await storage.getDreamChallenge(
          submission.challengeId,
        );
        if (!challenge) {
          return res.status(404).json({ message: "Challenge nicht gefunden" });
        }

        // Check if user is the creator of the challenge
        if (challenge.createdBy !== req.user.id) {
          return res.status(403).json({
            message: "Keine Berechtigung zum Ändern dieser Einreichung",
          });
        }

        // Update the submission
        const updatedSubmission = await storage.updateChallengeSubmission(id, {
          status: req.body.status,
          notes: req.body.notes,
        });

        if (!updatedSubmission) {
          return res
            .status(404)
            .json({ message: "Einreichung nicht gefunden" });
        }

        res.json(updatedSubmission);
      } catch (error) {
        console.error("Error updating submission:", error);
        res
          .status(500)
          .json({ message: "Fehler beim Aktualisieren der Einreichung" });
      }
    },
  );

  // Delete a submission (only allowed for the submitting user)
  app.delete(
    "/api/community/submissions/:id",
    authenticateJWT,
    async (req: Request, res: Response) => {
      try {
        if (!req.user) {
          return res.status(401).json({ message: "Nicht authentifiziert" });
        }

        const id = parseInt(req.params.id);
        if (isNaN(id)) {
          return res.status(400).json({ message: "Ungültige Einreichungs-ID" });
        }

        // Check if the submission exists
        const submission = await storage.getChallengeSubmission(id);
        if (!submission) {
          return res
            .status(404)
            .json({ message: "Einreichung nicht gefunden" });
        }

        // Check if user is the owner of the submission
        if (submission.userId !== req.user.id) {
          return res.status(403).json({
            message: "Keine Berechtigung zum Löschen dieser Einreichung",
          });
        }

        // Delete the submission
        const success = await storage.deleteChallengeSubmission(id);
        if (!success) {
          return res
            .status(404)
            .json({ message: "Einreichung nicht gefunden" });
        }

        res.status(204).send();
      } catch (error) {
        console.error("Error deleting submission:", error);
        res
          .status(500)
          .json({ message: "Fehler beim Löschen der Einreichung" });
      }
    },
  );

  // Dream Tag and Mood Operations
  // Update tags for a dream
  app.put(
    "/api/dreams/:id/tags",
    authenticateJWT,
    async (req: Request, res: Response) => {
      try {
        if (!req.user) {
          return res.status(401).json({ message: "Nicht authentifiziert" });
        }

        const id = parseInt(req.params.id);
        if (isNaN(id)) {
          return res.status(400).json({ message: "Ungültige Traum-ID" });
        }

        // Get the dream
        const dream = await storage.getDream(id);
        if (!dream) {
          return res.status(404).json({ message: "Traum nicht gefunden" });
        }

        // Check if user is the owner of the dream
        if (dream.userId !== req.user.id) {
          return res
            .status(403)
            .json({ message: "Keine Berechtigung zum Ändern dieses Traums" });
        }

        // Validate tags
        if (!Array.isArray(req.body.tags)) {
          return res
            .status(400)
            .json({ message: "Tags müssen als Array übergeben werden" });
        }

        // Update tags
        const updatedDream = await storage.updateDreamTags(id, req.body.tags);
        if (!updatedDream) {
          return res.status(404).json({ message: "Traum nicht gefunden" });
        }

        res.json(updatedDream);
      } catch (error) {
        console.error("Error updating dream tags:", error);
        res.status(500).json({ message: "Fehler beim Aktualisieren der Tags" });
      }
    },
  );

  // Update mood data for a dream
  app.put(
    "/api/dreams/:id/mood",
    authenticateJWT,
    async (req: Request, res: Response) => {
      try {
        if (!req.user) {
          return res.status(401).json({ message: "Nicht authentifiziert" });
        }

        const id = parseInt(req.params.id);
        if (isNaN(id)) {
          return res.status(400).json({ message: "Ungültige Traum-ID" });
        }

        // Get the dream
        const dream = await storage.getDream(id);
        if (!dream) {
          return res.status(404).json({ message: "Traum nicht gefunden" });
        }

        // Check if user is the owner of the dream
        if (dream.userId !== req.user.id) {
          return res
            .status(403)
            .json({ message: "Keine Berechtigung zum Ändern dieses Traums" });
        }

        // Validate mood data
        const moodData: MoodData = req.body;

        // Update mood data
        const updatedDream = await storage.updateDreamMood(id, moodData);
        if (!updatedDream) {
          return res.status(404).json({ message: "Traum nicht gefunden" });
        }

        res.json(updatedDream);
      } catch (error) {
        console.error("Error updating dream mood data:", error);
        res
          .status(500)
          .json({ message: "Fehler beim Aktualisieren der Stimmungsdaten" });
      }
    },
  );

  // </Collaborative Dream Interpretation>

  // <AI Assistant>

  // Get all conversations for the authenticated user
  app.get(
    "/api/assistant/conversations",
    authenticateJWT,
    async (req: Request, res: Response) => {
      try {
        if (!req.user) {
          return res.status(401).json({ message: "Nicht authentifiziert" });
        }

        const conversations = await storage.getUserAssistantConversations(
          req.user.id,
        );
        res.json(conversations);
      } catch (error) {
        console.error("Error fetching assistant conversations:", error);
        res
          .status(500)
          .json({ message: "Fehler beim Laden der Unterhaltungen" });
      }
    },
  );

  // Get a specific conversation with messages
  app.get(
    "/api/assistant/conversations/:id",
    authenticateJWT,
    async (req: Request, res: Response) => {
      try {
        if (!req.user) {
          return res.status(401).json({ message: "Nicht authentifiziert" });
        }

        const conversationId = parseInt(req.params.id);
        const conversation =
          await storage.getAssistantConversation(conversationId);

        if (!conversation || conversation.userId !== req.user.id) {
          return res
            .status(404)
            .json({ message: "Unterhaltung nicht gefunden" });
        }

        const messages = await storage.getAssistantMessages(conversationId);

        res.json({
          conversation,
          messages,
        });
      } catch (error) {
        console.error("Error fetching assistant conversation:", error);
        res.status(500).json({ message: "Fehler beim Laden der Unterhaltung" });
      }
    },
  );

  // Create a new conversation
  app.post(
    "/api/assistant/conversations",
    authenticateJWT,
    async (req: Request, res: Response) => {
      try {
        if (!req.user) {
          return res.status(401).json({ message: "Nicht authentifiziert" });
        }

        const newConversation = await storage.createAssistantConversation({
          userId: req.user.id,
          title: req.body.title || "Neue Unterhaltung",
        });

        res.status(201).json(newConversation);
      } catch (error) {
        console.error("Error creating assistant conversation:", error);
        res
          .status(500)
          .json({ message: "Fehler beim Erstellen der Unterhaltung" });
      }
    },
  );

  // Update a conversation (e.g., archive, change title)
  app.patch(
    "/api/assistant/conversations/:id",
    authenticateJWT,
    async (req: Request, res: Response) => {
      try {
        if (!req.user) {
          return res.status(401).json({ message: "Nicht authentifiziert" });
        }

        const conversationId = parseInt(req.params.id);
        const conversation =
          await storage.getAssistantConversation(conversationId);

        if (!conversation || conversation.userId !== req.user.id) {
          return res
            .status(404)
            .json({ message: "Unterhaltung nicht gefunden" });
        }

        const updatedConversation = await storage.updateAssistantConversation(
          conversationId,
          req.body,
        );
        res.json(updatedConversation);
      } catch (error) {
        console.error("Error updating assistant conversation:", error);
        res
          .status(500)
          .json({ message: "Fehler beim Aktualisieren der Unterhaltung" });
      }
    },
  );

  // Delete a conversation
  app.delete(
    "/api/assistant/conversations/:id",
    authenticateJWT,
    async (req: Request, res: Response) => {
      try {
        if (!req.user) {
          return res.status(401).json({ message: "Nicht authentifiziert" });
        }

        const conversationId = parseInt(req.params.id);
        const conversation =
          await storage.getAssistantConversation(conversationId);

        if (!conversation || conversation.userId !== req.user.id) {
          return res
            .status(404)
            .json({ message: "Unterhaltung nicht gefunden" });
        }

        await storage.deleteAssistantConversation(conversationId);
        res.json({ success: true });
      } catch (error) {
        console.error("Error deleting assistant conversation:", error);
        res
          .status(500)
          .json({ message: "Fehler beim Löschen der Unterhaltung" });
      }
    },
  );

  // Send a message to the assistant and get a response
  app.post(
    "/api/assistant/chat",
    authenticateJWT,
    async (req: Request, res: Response) => {
      try {
        if (!req.user) {
          return res.status(401).json({ message: "Nicht authentifiziert" });
        }

        const { conversationId, message, relatedDreamId, relatedJournalId } =
          req.body as ChatRequest;

        let activeConversationId = conversationId;

        // If no conversation ID is provided, create a new conversation
        if (!activeConversationId) {
          const newConversation = await storage.createAssistantConversation({
            userId: req.user.id,
            title: message.slice(0, 30) + (message.length > 30 ? "..." : ""), // Use part of the first message as the title
          });
          activeConversationId = newConversation.id;
        }

        // Save the user message
        const userMessage = await storage.createAssistantMessage({
          conversationId: activeConversationId,
          content: message,
          role: "user",
          relatedDreamId: relatedDreamId || null,
          relatedJournalId: relatedJournalId || null,
        });

        // Get related content if needed
        let relatedContent = null;
        if (relatedDreamId) {
          relatedContent = await storage.getDream(relatedDreamId);
        } else if (relatedJournalId) {
          relatedContent = await storage.getJournalEntry(relatedJournalId);
        }

        // Handle collecting context for the AI
        let context = `Du bist ein Traumdeutungs-Assistent in einer Traumtagebuch-App. 
Helfe dem Benutzer mit Einsichten zu Traumsymbolen, Traumdeutung, Schlafqualität und mehr.
Beantworte die Fragen knapp und präzise, aber freundlich und hilfreich.
Datum: ${new Date().toLocaleDateString("de-DE")}
`;

        if (relatedContent) {
          if (relatedDreamId) {
            context += `\nBezug auf Traum: "${relatedContent.title}"\n${relatedContent.content}\n`;
            if (relatedContent.analysis) {
              context += `Bisherige Analyse: ${relatedContent.analysis}\n`;
            }
          } else if (relatedJournalId) {
            context += `\nBezug auf Tagebucheintrag: "${relatedContent.title}"\n${relatedContent.content}\n`;
          }
        }

        // Get conversation history (last 10 messages)
        const conversationHistory =
          await storage.getAssistantMessages(activeConversationId);
        const recentMessages = conversationHistory
          .sort(
            (a, b) =>
              new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime(),
          )
          .slice(-10);

        if (recentMessages.length > 0) {
          context += "\nBisheriger Gesprächsverlauf:\n";
          for (const msg of recentMessages) {
            context += `${msg.role === "user" ? "Benutzer" : "Assistent"}: ${msg.content}\n`;
          }
        }

        // Call OpenAI to generate a response
        let assistantResponseText = "";
        try {
          const { response } = await analyzeDream(
            context + `\nBenutzer: ${message}\nAssistent:`,
            [],
          );
          assistantResponseText = response.trim();
        } catch (aiError) {
          console.error("Error generating AI response:", aiError);
          assistantResponseText =
            "Entschuldigung, ich konnte deine Nachricht nicht verarbeiten. Bitte versuche es noch einmal oder stelle eine andere Frage.";
        }

        // Store assistant's response
        const assistantMessage = await storage.createAssistantMessage({
          conversationId: activeConversationId,
          content: assistantResponseText,
          role: "assistant",
          relatedDreamId: relatedDreamId || null,
          relatedJournalId: relatedJournalId || null,
        });

        // Update conversation title if this is the first message
        if (conversationHistory.length <= 1) {
          // Generate a better title based on the first message
          let titlePrompt = `Erstelle einen kurzen, prägnanten Titel für eine Konversation, die mit dieser Nachricht beginnt: "${message}"
Der Titel sollte nicht länger als 40 Zeichen sein und das Thema der Nachricht präzise zusammenfassen.
Antworte nur mit dem Titel, keine Anführungszeichen oder andere Formatierung.`;

          try {
            const { response: titleResponse } = await analyzeDream(
              titlePrompt,
              [],
            );
            const title = titleResponse.trim();
            if (title && title.length <= 60) {
              await storage.updateAssistantConversation(activeConversationId, {
                title,
              });
            }
          } catch (titleError) {
            console.error("Error generating conversation title:", titleError);
            // Continue even if title generation fails
          }
        }

        res.json({
          conversationId: activeConversationId,
          message: assistantMessage,
          relatedContent,
        });
      } catch (error) {
        console.error("Error in assistant chat:", error);
        res.status(500).json({
          message: "Fehler bei der Kommunikation mit dem Assistenten",
        });
      }
    },
  );

  // </AI Assistant>

  return httpServer;
}
