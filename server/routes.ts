import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { analyzeDream } from "./openai";
import { saveBase64Image, deleteImage } from "./utils";
import { insertDreamSchema } from "@shared/schema";
import { setupAuth, authenticateJWT } from "./auth";
import express from "express";
import multer from "multer";
import path from "path";
import { fileURLToPath } from "url";

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

  // Get a specific dream by ID
  app.get('/api/dreams/:id', authenticateJWT, async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: 'Ungültige Traum-ID' });
      }

      const dream = await storage.getDream(id);
      if (!dream) {
        return res.status(404).json({ message: 'Traum nicht gefunden' });
      }

      // Check if user is the owner of the dream
      if (dream.userId !== req.user?.id) {
        return res.status(403).json({ message: 'Keine Berechtigung zum Anzeigen dieses Traums' });
      }

      res.json(dream);
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

      // Analyze the dream with OpenAI in the background, including previous dreams for context
      analyzeDream(parseResult.data.content, previousDreams)
        .then(analysis => {
          storage.saveDreamAnalysis(newDream.id, analysis)
            .catch(err => console.error('Error saving dream analysis:', err));
        })
        .catch(err => console.error('Error analyzing dream:', err));

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

        analyzeDream(req.body.content, previousDreams)
          .then(analysis => {
            storage.saveDreamAnalysis(id, analysis)
              .catch(err => console.error('Error updating dream analysis:', err));
          })
          .catch(err => console.error('Error analyzing updated dream:', err));
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

  const httpServer = createServer(app);
  return httpServer;
}
