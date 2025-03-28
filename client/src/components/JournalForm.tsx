import React, { useState } from "react";
import { Button } from "./ui/button";
import { Textarea } from "./ui/textarea";
import { Input } from "./ui/input";
import { Badge } from "./ui/badge";
import { XIcon, PlusIcon, TagIcon, BookOpenIcon, CalendarIcon, Upload, Sparkles, Palette, Wind } from "lucide-react";
import { useToast } from "../hooks/use-toast";
import { format } from "date-fns";
import { de } from "date-fns/locale";
import { apiRequest } from "../lib/queryClient";
import { queryClient } from "../lib/queryClient";
import { JournalEntry } from "@shared/schema";
import { useAuth } from "../hooks/use-auth";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "./ui/dialog";

interface JournalFormProps {
  existingEntry?: JournalEntry;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export default function JournalForm({ existingEntry, onSuccess, onCancel }: JournalFormProps) {
  const { toast } = useToast();
  const { user } = useAuth();
  const [title, setTitle] = useState(existingEntry?.title || "");
  const [content, setContent] = useState(existingEntry?.content || "");
  const [tags, setTags] = useState<string[]>(existingEntry?.tags || []);
  const [newTag, setNewTag] = useState("");
  const [mood, setMood] = useState<number | undefined>(existingEntry?.mood || undefined);
  const [date, setDate] = useState<string>(existingEntry?.date 
    ? format(new Date(existingEntry.date), 'yyyy-MM-dd') 
    : format(new Date(), 'yyyy-MM-dd')
  );
  const [isPrivate, setIsPrivate] = useState(existingEntry?.isPrivate !== false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showMoodImageArea, setShowMoodImageArea] = useState(false);
  const [uploadedImage, setUploadedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(existingEntry?.imageUrl || null);
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);
  const [includeInAnalysis, setIncludeInAnalysis] = useState(false);
  const [imagePrompt, setImagePrompt] = useState("");
  const [showImageDialog, setShowImageDialog] = useState(false);
  const [colorThought, setColorThought] = useState("");
  const [spontaneousThought, setSpontaneousThought] = useState("");
  const [generatedDescription, setGeneratedDescription] = useState("");

  // Add a new tag
  const addTag = () => {
    if (newTag.trim() !== "" && !tags.includes(newTag.trim())) {
      setTags([...tags, newTag.trim()]);
      setNewTag("");
    }
  };

  // Remove a tag
  const removeTag = (tagToRemove: string) => {
    setTags(tags.filter(tag => tag !== tagToRemove));
  };

  // Handle tag input key press
  const handleTagKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addTag();
    }
  };
  
  // Handle image uploads
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    // Check file type
    if (!file.type.startsWith('image/')) {
      toast({
        title: "Fehler",
        description: "Bitte wähle ein Bild aus",
        variant: "destructive",
      });
      return;
    }
    
    // Create preview
    const reader = new FileReader();
    reader.onload = (event) => {
      if (event.target?.result) {
        setImagePreview(event.target.result as string);
      }
    };
    reader.readAsDataURL(file);
    
    setUploadedImage(file);
  };
  
  // Öffnet den Dialog für die Bildgenerierung
  const openImageGenerationDialog = () => {
    if (!content || content.trim().length < 10) {
      toast({
        title: "Hinweis",
        description: "Bitte füge mehr Inhalt hinzu, um ein besseres Stimmungsbild zu generieren.",
      });
      return;
    }
    
    // Setze Standardwerte zurück
    setColorThought("");
    setSpontaneousThought("");
    setGeneratedDescription("");
    
    // Öffne den Dialog
    setShowImageDialog(true);
  };
  
  // Schließt den Dialog
  const closeImageDialog = () => {
    setShowImageDialog(false);
  };
  
  // Generate mood image
  const generateMoodImage = async () => {
    if (!colorThought || !spontaneousThought) {
      toast({
        title: "Hinweis",
        description: "Bitte beantworte beide Fragen, um ein aussagekräftiges Stimmungsbild zu generieren.",
      });
      return;
    }
    
    setIsGeneratingImage(true);
    
    try {
      // Stelle eine Anfrage an den Server zur Bildgenerierung
      const response = await fetch('/api/journal/generate-image', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          journalContent: content,
          colorImpression: colorThought,
          spontaneousThought: spontaneousThought,
          tags,
          mood
        }),
      });
      
      if (!response.ok) {
        throw new Error('Fehler bei der API-Anfrage');
      }
      
      const result = await response.json();
      
      // Setze das generierte Bild und die Beschreibung
      setImagePreview(result.imageUrl);
      setGeneratedDescription(result.description);
      
      // Schließe den Dialog nach erfolgreicher Generierung
      closeImageDialog();
      
      toast({
        title: "Erfolg",
        description: "Stimmungsbild wurde generiert",
      });
      
    } catch (error) {
      console.error("Error generating mood image:", error);
      
      // Fallback zur Offline-Generierung, falls die API nicht verfügbar ist
      toast({
        title: "Hinweis",
        description: "Lokales Fallback-Bild wird generiert, da die KI-Bildgenerierung nicht verfügbar ist.",
      });
      
      // Extrahiere wichtige Schlüsselwörter aus dem Journalinhalt
      const words = content.toLowerCase().split(/\s+/).filter(w => w.length > 4);
      // Erstelle ein Array mit eindeutigen Wörtern
      const uniqueWords = Array.from(new Set(words));
      const importantWords = uniqueWords.slice(0, 5);
      
      // Farben extrahieren und SVG-Fallback generieren
      const colorName = colorThought.toLowerCase();
      let baseColor = "#86A7FC"; // Default blau
      
      if (colorName.includes("rot") || colorName.includes("orange")) {
        baseColor = "#FF7F50";
      } else if (colorName.includes("grün")) {
        baseColor = "#4C9A2A";
      } else if (colorName.includes("blau")) {
        baseColor = "#1E90FF";
      } else if (colorName.includes("gelb")) {
        baseColor = "#FFD700";
      } else if (colorName.includes("violett") || colorName.includes("lila")) {
        baseColor = "#8A2BE2";
      }
      
      // Einfaches SVG zur Darstellung der Stimmung
      const svgContent = `
      <svg xmlns="http://www.w3.org/2000/svg" width="400" height="400" viewBox="0 0 400 400">
        <rect width="100%" height="100%" fill="${baseColor}" opacity="0.2" />
        <path d="M50,250 C150,50 250,350 350,150" stroke="${baseColor}" stroke-width="20" fill="none" opacity="0.7" />
        <circle cx="200" cy="200" r="50" fill="${baseColor}" opacity="0.3" />
      </svg>`;
      
      const dataUrl = `data:image/svg+xml;base64,${btoa(svgContent)}`;
      setImagePreview(dataUrl);
      
      // Einfache Beschreibung
      setGeneratedDescription(`Ein Kunstwerk in ${colorThought}, inspiriert von Ihrem Gedanken "${spontaneousThought}".`);
      
      // Dialog schließen
      closeImageDialog();
      setIsGeneratingImage(false);
    }
  };

  // Submit the form
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!title.trim() || !content.trim()) {
      toast({
        title: "Fehler",
        description: "Titel und Inhalt sind erforderlich",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      // Handle image upload if there's an uploaded file
      let imageUrl = imagePreview;
      
      if (uploadedImage) {
        const formData = new FormData();
        formData.append('image', uploadedImage);
        
        // Upload the image
        const response = await fetch('/api/upload', {
          method: 'POST',
          body: formData
        });
        
        if (!response.ok) {
          throw new Error('Fehler beim Hochladen des Bildes');
        }
        
        const data = await response.json();
        imageUrl = data.imageUrl;
      }
      
      const journalData = {
        userId: user?.id, // Wichtig: userId muss für neue Einträge mitgegeben werden
        title,
        content,
        tags,
        mood,
        date: new Date(date),
        isPrivate,
        imageUrl,
        includeInAnalysis,
        ...(existingEntry?.relatedDreamIds ? { relatedDreamIds: existingEntry.relatedDreamIds } : {})
      };

      if (existingEntry) {
        // Update
        await apiRequest("PATCH", `/api/journal/${existingEntry.id}`, journalData);
        toast({
          title: "Erfolg",
          description: "Journaleintrag aktualisiert",
        });
      } else {
        // Create
        await apiRequest("POST", "/api/journal", journalData);
        toast({
          title: "Erfolg",
          description: "Journaleintrag erstellt",
        });
      }

      // Invalidate queries to refetch journal entries
      queryClient.invalidateQueries({ queryKey: ["/api/journal"] });
      
      // Reset form if not editing an existing entry
      if (!existingEntry) {
        setTitle("");
        setContent("");
        setTags([]);
        setMood(undefined);
        setDate(format(new Date(), 'yyyy-MM-dd'));
        setIsPrivate(true);
        setShowMoodImageArea(false);
        setImagePreview(null);
        setUploadedImage(null);
        setIncludeInAnalysis(false);
      }

      if (onSuccess) onSuccess();
    } catch (error) {
      console.error("Error saving journal entry:", error);
      toast({
        title: "Fehler",
        description: "Fehler beim Speichern des Journaleintrags",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <div className="flex items-center justify-between mb-2">
            <label htmlFor="journal-title" className="block text-sm font-medium text-gray-700">
              Titel
            </label>
            <div className="flex items-center space-x-2">
              <CalendarIcon className="w-4 h-4 text-gray-500" />
              <Input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-40 h-8 text-sm"
              />
            </div>
          </div>
          <Input
            id="journal-title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Mein Journaleintrag..."
            className="w-full"
          />
        </div>

        <div>
          <label htmlFor="journal-content" className="block text-sm font-medium text-gray-700 mb-2">
            Inhalt
          </label>
          <Textarea
            id="journal-content"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Schreibe deine Gedanken, Ziele oder Reflexionen..."
            className="min-h-[200px] resize-y"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center">
              <TagIcon className="w-4 h-4 mr-1" />
              Tags
            </label>
            <div className="flex flex-wrap items-center gap-2 mb-3">
              {tags.map((tag, index) => (
                <Badge key={index} variant="secondary" className="px-2 py-1">
                  {tag}
                  <button
                    type="button"
                    onClick={() => removeTag(tag)}
                    className="ml-2 text-xs text-gray-400 hover:text-gray-600"
                  >
                    <XIcon className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
              {tags.length === 0 && (
                <span className="text-sm text-gray-500 italic">Keine Tags</span>
              )}
            </div>
            <div className="flex">
              <Input
                value={newTag}
                onChange={(e) => setNewTag(e.target.value)}
                onKeyDown={handleTagKeyPress}
                placeholder="Neuer Tag..."
                className="mr-2"
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addTag}
                disabled={!newTag.trim()}
              >
                <PlusIcon className="h-4 w-4 mr-1" />
                Hinzufügen
              </Button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Stimmung (1-10)
            </label>
            <div className="flex items-center space-x-2">
              <Input
                type="number"
                min="1"
                max="10"
                value={mood || ""}
                onChange={(e) => setMood(e.target.value ? parseInt(e.target.value) : undefined)}
                placeholder="1-10"
                className="w-24"
              />
              {mood && (
                <div className={`w-5 h-5 rounded-full ${
                  mood >= 8 ? 'bg-green-500' : 
                  mood >= 6 ? 'bg-green-400' : 
                  mood >= 5 ? 'bg-yellow-300' : 
                  mood >= 3 ? 'bg-orange-400' : 
                  'bg-red-500'
                }`}></div>
              )}
              <span className="text-sm text-gray-500">
                {mood 
                  ? mood >= 8 ? 'Sehr gut' 
                    : mood >= 6 ? 'Gut' 
                    : mood >= 5 ? 'Neutral' 
                    : mood >= 3 ? 'Nicht so gut' 
                    : 'Schlecht' 
                  : 'Keine Angabe'}
              </span>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          {/* Bild Bereich */}
          <div className="border rounded-lg p-4">
            <div className="flex justify-between items-center mb-2">
              <h3 className="text-sm font-medium text-gray-700">Stimmungsbild</h3>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setShowMoodImageArea(!showMoodImageArea)}
              >
                {showMoodImageArea ? "Ausblenden" : "Hinzufügen"}
              </Button>
            </div>

            {showMoodImageArea && (
              <div className="space-y-3">
                <div className="flex gap-2 flex-wrap">
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    onClick={openImageGenerationDialog}
                    className="gap-2"
                  >
                    <Sparkles className="h-4 w-4" />
                    Stimmungsbild erstellen
                  </Button>

                  <div className="relative">
                    <Button
                      type="button"
                      variant="secondary"
                      size="sm"
                      className="gap-2"
                      onClick={() => document.getElementById('image-upload')?.click()}
                    >
                      <Upload className="h-4 w-4" />
                      Hochladen
                    </Button>
                    <input
                      type="file"
                      id="image-upload"
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="hidden"
                    />
                  </div>
                </div>

                {/* Vorschläge für Stimmungsbilder */}
                <div className="text-xs text-gray-500 italic">
                  <p>Beispielprompts für die Generierung:</p>
                  <ul className="list-disc pl-5 pt-1 space-y-1">
                    <li>Ein friedlicher Waldsee bei Sonnenuntergang mit sanftem Nebel</li>
                    <li>Abstraktes Farbspiel aus Blau und Türkis mit fließenden Übergängen</li>
                    <li>Gebirgszug mit Schneebedeckung im goldenen Morgenlicht</li>
                  </ul>
                </div>

                {/* Bildvorschau */}
                {imagePreview && (
                  <div className="mt-3">
                    <p className="text-sm text-gray-700 mb-2">Vorschau:</p>
                    <div className="relative w-full aspect-video bg-gray-100 rounded-lg overflow-hidden">
                      <img 
                        src={imagePreview} 
                        alt="Vorschau" 
                        className="object-cover w-full h-full"
                      />
                      <Button
                        type="button"
                        variant="destructive"
                        size="sm"
                        className="absolute top-2 right-2 opacity-80 hover:opacity-100"
                        onClick={() => {
                          setImagePreview(null);
                          setUploadedImage(null);
                          setGeneratedDescription("");
                        }}
                      >
                        <XIcon className="h-4 w-4" />
                      </Button>
                    </div>
                    
                    {/* Zeige die Bildbeschreibung an, wenn eine generiert wurde */}
                    {generatedDescription && (
                      <div className="mt-2 p-3 bg-gray-50 rounded-md text-sm italic text-gray-600">
                        {generatedDescription}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Analyse Option */}
          <div className="flex items-center">
            <input
              type="checkbox"
              id="include-in-analysis"
              checked={includeInAnalysis}
              onChange={(e) => setIncludeInAnalysis(e.target.checked)}
              className="h-4 w-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
            />
            <label htmlFor="include-in-analysis" className="ml-2 block text-sm text-gray-700">
              In Selbstanalyse einbeziehen (vorher: Traumanalyse)
            </label>
          </div>

          {/* Privat Option */}
          <div className="flex items-center">
            <input
              type="checkbox"
              id="journal-private"
              checked={isPrivate}
              onChange={(e) => setIsPrivate(e.target.checked)}
              className="h-4 w-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
            />
            <label htmlFor="journal-private" className="ml-2 block text-sm text-gray-700">
              Privater Eintrag (nur für dich sichtbar)
            </label>
          </div>
        </div>

        <div className="flex justify-end space-x-2 pt-2">
          {onCancel && (
            <Button 
              type="button" 
              variant="outline" 
              onClick={onCancel}
              disabled={isSubmitting}
            >
              Abbrechen
            </Button>
          )}
          <Button 
            type="submit" 
            disabled={isSubmitting}
            className="gap-2"
          >
            {isSubmitting ? (
              <>
                <span className="animate-spin">⏳</span>
                Speichern...
              </>
            ) : (
              <>
                <BookOpenIcon className="h-4 w-4" />
                {existingEntry ? "Aktualisieren" : "Speichern"}
              </>
            )}
          </Button>
        </div>
      </form>
      
      {/* Dialog für die Bildgenerierung */}
      <Dialog open={showImageDialog} onOpenChange={setShowImageDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Stimmungsbild erstellen</DialogTitle>
            <DialogDescription>
              Beantworten Sie diese kurzen Fragen, um ein einzigartiges Stimmungsbild zu generieren.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label htmlFor="color-thought" className="text-sm font-medium flex items-center">
                <Palette className="h-4 w-4 mr-2 text-blue-500" />
                An welche Farbe denken Sie gerade?
              </label>
              <Input
                id="color-thought"
                placeholder="z.B. Blau, Smaragdgrün, Sonnenuntergang-Orange..."
                value={colorThought}
                onChange={(e) => setColorThought(e.target.value)}
              />
            </div>
            
            <div className="space-y-2">
              <label htmlFor="spontaneous-thought" className="text-sm font-medium flex items-center">
                <Wind className="h-4 w-4 mr-2 text-blue-500" />
                Was beschäftigt Sie in diesem Moment?
              </label>
              <Textarea
                id="spontaneous-thought"
                placeholder="Ein spontaner Gedanke, eine Empfindung oder ein Wunsch..."
                value={spontaneousThought}
                onChange={(e) => setSpontaneousThought(e.target.value)}
                className="resize-none"
                rows={3}
              />
            </div>

            {imagePreview && generatedDescription && (
              <div className="mt-2 p-3 bg-gray-50 rounded-md text-sm italic text-gray-600">
                {generatedDescription}
              </div>
            )}
          </div>
          
          <DialogFooter className="flex justify-between sm:justify-between">
            <Button 
              type="button" 
              variant="outline" 
              onClick={closeImageDialog}
            >
              Abbrechen
            </Button>
            <Button 
              type="button"
              onClick={generateMoodImage}
              disabled={isGeneratingImage || !colorThought || !spontaneousThought}
              className="gap-2"
            >
              {isGeneratingImage ? (
                <>
                  <span className="animate-spin">⏳</span>
                  Wird generiert...
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4" />
                  Bild generieren
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}