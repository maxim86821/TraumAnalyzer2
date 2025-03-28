import React, { useState } from "react";
import { Button } from "./ui/button";
import { Textarea } from "./ui/textarea";
import { Input } from "./ui/input";
import { Badge } from "./ui/badge";
import { XIcon, PlusIcon, TagIcon, BookOpenIcon, CalendarIcon, Upload, Sparkles } from "lucide-react";
import { useToast } from "../hooks/use-toast";
import { format } from "date-fns";
import { de } from "date-fns/locale";
import { apiRequest } from "../lib/queryClient";
import { queryClient } from "../lib/queryClient";
import { JournalEntry } from "@shared/schema";
import { useAuth } from "../hooks/use-auth";

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
  
  // Generate mood image
  const generateMoodImage = async () => {
    if (!content || content.trim().length < 10) {
      toast({
        title: "Hinweis",
        description: "Bitte füge mehr Inhalt hinzu, um ein besseres Stimmungsbild zu generieren.",
      });
      return;
    }
    
    setIsGeneratingImage(true);
    
    try {
      // Here we would normally call our API to generate an image
      // For now, let's simulate the generation with a placeholder
      
      // Mock image generation - in real implementation, call API
      setTimeout(() => {
        // This would be the response from our AI image generation
        const exampleColors = ["#86A7FC", "#7A9EF5", "#3468C0", "#91C8E4", "#749BC2", "#4682A9", 
                             "#BCA37F", "#DEBACE", "#FFBFBF", "#FFE17B", "#EBB02D", "#ABC270"];
        const randomColor = exampleColors[Math.floor(Math.random() * exampleColors.length)];
        
        // Creating a data URL for a simple SVG with random swirls or patterns
        const svgContent = `
        <svg xmlns="http://www.w3.org/2000/svg" width="400" height="400" viewBox="0 0 400 400">
          <rect width="100%" height="100%" fill="${randomColor}" opacity="0.2" />
          <path d="M50,250 C150,50 250,350 350,150" stroke="${randomColor}" stroke-width="20" fill="none" opacity="0.7" />
          <path d="M50,150 C150,350 250,50 350,250" stroke="${randomColor}" stroke-width="15" fill="none" opacity="0.5" />
          <circle cx="200" cy="200" r="50" fill="${randomColor}" opacity="0.3" />
          <circle cx="150" cy="150" r="20" fill="${randomColor}" opacity="0.4" />
          <circle cx="250" cy="250" r="30" fill="${randomColor}" opacity="0.4" />
        </svg>`;
        
        const dataUrl = `data:image/svg+xml;base64,${btoa(svgContent)}`;
        setImagePreview(dataUrl);
        setIsGeneratingImage(false);
        
        toast({
          title: "Erfolg",
          description: "Stimmungsbild wurde generiert",
        });
      }, 2000);
      
    } catch (error) {
      console.error("Error generating mood image:", error);
      toast({
        title: "Fehler",
        description: "Fehler bei der Generierung des Stimmungsbildes",
        variant: "destructive",
      });
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
                    onClick={generateMoodImage}
                    disabled={isGeneratingImage}
                    className="gap-2"
                  >
                    <Sparkles className="h-4 w-4" />
                    {isGeneratingImage ? "Wird generiert..." : "Generieren"}
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
                        }}
                      >
                        <XIcon className="h-4 w-4" />
                      </Button>
                    </div>
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
    </div>
  );
}