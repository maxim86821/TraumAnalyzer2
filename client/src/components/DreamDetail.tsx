import { Dream } from "@shared/schema";
import React, { useState, useEffect } from "react";
import { Button } from "../components/ui/button";
import { Textarea } from "../components/ui/textarea";
import { Input } from "../components/ui/input";
import { Badge } from "../components/ui/badge";
import { apiRequest } from "../lib/queryClient";
import { queryClient } from "../lib/queryClient";
import { format } from "date-fns";
import { de } from "date-fns/locale";
import { 
  PencilIcon, 
  CameraIcon, 
  XIcon, 
  CheckIcon, 
  TagIcon, 
  PlusIcon, 
  Sparkles, 
  Loader2,
  ZoomIn,
  X
} from "lucide-react";
import { useToast } from "../hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogClose } from "@/components/ui/dialog";
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface DreamDetailProps {
  dream: Dream;
}

export default function DreamDetail({ dream }: DreamDetailProps) {
  const { toast } = useToast();
  const [editing, setEditing] = useState(false);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [isUpdating, setIsUpdating] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [tags, setTags] = useState<string[]>([]);
  const [newTag, setNewTag] = useState("");
  const [moodBeforeSleep, setMoodBeforeSleep] = useState<number | null>(null);
  const [moodAfterWakeup, setMoodAfterWakeup] = useState<number | null>(null);
  const [moodNotes, setMoodNotes] = useState("");
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);
  const [newImage, setNewImage] = useState<string | null>(null);
  const [isImageModalOpen, setIsImageModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [analyzingDream, setAnalyzingDream] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  useEffect(() => {
    if (dream) {
      setTitle(dream.title);
      setContent(dream.content || "");
      setTags(dream.tags || []);
      setMoodBeforeSleep(dream.moodBeforeSleep || null);
      setMoodAfterWakeup(dream.moodAfterWakeup || null);
      setMoodNotes(dream.moodNotes || "");
    }
  }, [dream]);

  // Debugging the dream object
  const dreamId = dream?.id;
  console.log("Dream ID details:", {
    id: dream?.id, 
    parsedId: dreamId, 
    dreamTitle: dream?.title,
    idType: typeof dream?.id
  });

  // Vollständigen Trauminhalt und Analyse-Daten für Debugging anzeigen
  console.log("COMPLETE DREAM OBJECT:", dream);
  
  // Detaillierte Analyse des Dream-Objekts für Debugging
  console.log("Dream object details:", {
    id: dream.id,
    content: dream.content ? dream.content.substring(0, 30) + "..." : "No content",
    analysisPresent: !!dream.analysis,
    analysisType: typeof dream.analysis,
    rawAnalysis: dream.analysis ? 
      (typeof dream.analysis === 'string' ? 
        dream.analysis.substring(0, 30) + "..." : 
        "Analysis is an object") 
      : "No analysis"
  });

  // Parse the analysis JSON if it exists, mit verstärkter Fehlerbehandlung
  let analysis = null;
  try {
    if (dream.analysis) {
      console.log("Raw analysis data type:", typeof dream.analysis);
      console.log("Raw analysis data:", dream.analysis);
      
      if (typeof dream.analysis === 'string') {
        // Versuche alle möglichen Formate zu unterstützen
        if (dream.analysis.trim() === "") {
          console.log("Analysis string is empty");
        } else {
          try {
            analysis = JSON.parse(dream.analysis);
            console.log("Parsed analysis successfully:", !!analysis);
          } catch (parseError) {
            console.error("JSON parse error:", parseError);
            // Möglicherweise ist der String bereits formatiert
            console.log("Could not parse as JSON, trying alternate formats");
            // Versuche, den String direkt als Objekt zu verwenden
            analysis = { directText: dream.analysis };
          }
        }
      } else if (typeof dream.analysis === 'object') {
        // Bereits ein Objekt, kein Parsing notwendig
        analysis = dream.analysis;
        console.log("Analysis is already an object, no parsing needed");
      }
    } else {
      console.log("No analysis data available");
    }
  } catch (error) {
    console.error("Error parsing dream analysis:", error);
    console.log("Problematic raw analysis data:", dream.analysis);
  }
  
  // Debug the final analysis object
  console.log("Final analysis object:", analysis);

  // Format date in German with safe fallback
  const formattedDate = dream.date 
    ? format(new Date(dream.date), 'd. MMMM yyyy', { locale: de })
    : format(new Date(dream.createdAt || new Date()), 'd. MMMM yyyy', { locale: de });

  // Handle image selection
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setImageFile(file);
      
      // Create a preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // Cancel image upload
  const cancelImageUpload = () => {
    setImageFile(null);
    setImagePreview(null);
  };

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

  // Start editing the dream
  const startEditing = () => {
    setEditing(true);
  };

  // Cancel editing
  const cancelEditing = () => {
    setEditing(false);
    setTitle(dream.title);
    setContent(dream.content || "");
    setTags(dream.tags || []);
    setMoodBeforeSleep(dream.moodBeforeSleep || null);
    setMoodAfterWakeup(dream.moodAfterWakeup || null);
    setMoodNotes(dream.moodNotes || "");
    setImageFile(null);
    setImagePreview(null);
  };

  // Save the dream changes
  const saveDream = async () => {
    if (!title.trim() || !content.trim()) {
      toast({
        title: "Fehler",
        description: "Titel und Trauminhalt sind erforderlich",
        variant: "destructive",
      });
      return;
    }

    setIsUpdating(true);

    try {
      // First update the dream text and metadata
      const updateData = {
        title,
        content,
        tags,
        moodBeforeSleep,
        moodAfterWakeup,
        moodNotes
      };

      await apiRequest("PATCH", `/api/dreams/${dream.id}`, updateData);

      // Then upload image if there is one
      if (imageFile) {
        const formData = new FormData();
        formData.append('image', imageFile);

        const response = await fetch(`/api/dreams/${dream.id}/image`, {
          method: 'POST',
          body: formData,
        });

        if (!response.ok) {
          throw new Error('Failed to upload image');
        }
      }

      // Refresh the dream data
      queryClient.invalidateQueries({ queryKey: [`/api/dreams/${dream.id}`] });
      queryClient.invalidateQueries({ queryKey: ["/api/dreams"] });

      toast({
        title: "Erfolg",
        description: "Traum wurde aktualisiert",
      });

      setEditing(false);
      setIsUpdating(false);
    } catch (error) {
      toast({
        title: "Fehler",
        description: "Fehler beim Aktualisieren des Traums",
        variant: "destructive",
      });
      setIsUpdating(false);
    }
  };

  // Generate an image for the dream
  const generateDreamImage = async () => {
    setIsGeneratingImage(true);
    try {
      const response = await fetch(`/api/dreams/${dream.id}/generate-image`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to generate image');
      }

      const data = await response.json();
      console.log("Generated image response:", data);
      setNewImage(data.imageUrl);
      setIsImageModalOpen(true);

      // Refresh the dream data to get updated image
      queryClient.invalidateQueries({ queryKey: [`/api/dreams/${dream.id}`] });
      queryClient.invalidateQueries({ queryKey: ["/api/dreams"] });

      toast({
        title: "Erfolg",
        description: "Traumbildgenerierung abgeschlossen",
      });
    } catch (error) {
      console.error("Error generating dream image:", error);
      toast({
        title: "Fehler",
        description: "Fehler bei der Bildgenerierung",
        variant: "destructive",
      });
    } finally {
      setIsGeneratingImage(false);
    }
  };

  // Open image in modal
  const openImageModal = (imageUrl: string) => {
    setSelectedImage(imageUrl);
    setIsImageModalOpen(true);
  };

  // Close the image modal
  const closeImageModal = () => {
    setIsImageModalOpen(false);
    setNewImage(null);
  };

  // Open the delete confirmation modal
  const openDeleteModal = () => {
    setIsDeleteModalOpen(true);
  };

  // Close the delete confirmation modal
  const closeDeleteModal = () => {
    setIsDeleteModalOpen(false);
  };

  // Delete the dream
  const deleteDream = async () => {
    setIsDeleting(true);
    try {
      await apiRequest("DELETE", `/api/dreams/${dream.id}`);
      
      queryClient.invalidateQueries({ queryKey: ["/api/dreams"] });
      
      toast({
        title: "Erfolg",
        description: "Traum wurde gelöscht",
      });
      
      // Navigate back to dreams list (this would be handled by the parent component)
      // Here we just close the modal
      closeDeleteModal();
    } catch (error) {
      toast({
        title: "Fehler",
        description: "Fehler beim Löschen des Traums",
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
    }
  };

  // Trigger AI analysis of the dream
  const analyzeDream = async () => {
    setAnalyzingDream(true);
    try {
      const response = await apiRequest("POST", `/api/dreams/${dream.id}/analyze`, {});
      
      // Refresh the dream data to get the analysis
      queryClient.invalidateQueries({ queryKey: [`/api/dreams/${dream.id}`] });
      
      toast({
        title: "Erfolg",
        description: "Traumanalyse abgeschlossen",
      });
    } catch (error) {
      toast({
        title: "Fehler",
        description: "Fehler bei der Traumanalyse",
        variant: "destructive",
      });
    } finally {
      setAnalyzingDream(false);
    }
  };

  // Render mood indicator
  const renderMoodIndicator = (mood: number | null, label: string) => {
    if (mood === null) return null;
    
    const moodColors = [
      "bg-red-500", // 1: Sehr schlecht
      "bg-red-400", // 2
      "bg-orange-400", // 3
      "bg-orange-300", // 4
      "bg-yellow-300", // 5: Neutral
      "bg-yellow-200", // 6
      "bg-green-200", // 7
      "bg-green-300", // 8
      "bg-green-400", // 9
      "bg-green-500", // 10: Sehr gut
    ];
    
    return (
      <div className="flex items-center space-x-2">
        <span className="text-sm text-gray-600">{label}:</span>
        <div className={`w-5 h-5 rounded-full ${moodColors[mood-1]}`}></div>
        <span className="text-sm font-medium">{mood}/10</span>
      </div>
    );
  };

  return (
    <section className="bg-white rounded-lg shadow-sm overflow-hidden">
      {/* Dream header with date and actions */}
      <div className="p-6 border-b border-gray-200 flex justify-between items-center">
        <div className="flex flex-col">
          <h2 className="text-2xl font-bold text-gray-800">{dream.title}</h2>
          <div className="text-sm text-gray-500 flex items-center mt-1">
            <span>{formattedDate}</span>
            {(dream.moodBeforeSleep || dream.moodAfterWakeup) && (
              <div className="ml-4 flex space-x-4">
                {renderMoodIndicator(dream.moodBeforeSleep, "Vor dem Schlafen")}
                {renderMoodIndicator(dream.moodAfterWakeup, "Nach dem Aufwachen")}
              </div>
            )}
          </div>
        </div>
        
        <div className="flex space-x-2">
          {!editing && (
            <>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={startEditing}
                className="flex items-center gap-1"
              >
                <PencilIcon className="h-4 w-4" />
                <span className="hidden sm:inline">Bearbeiten</span>
              </Button>
              
              <Button 
                variant="outline" 
                size="sm" 
                onClick={generateDreamImage}
                disabled={isGeneratingImage}
                className="flex items-center gap-1"
              >
                {isGeneratingImage ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span className="hidden sm:inline">Generiere...</span>
                  </>
                ) : (
                  <>
                    <CameraIcon className="h-4 w-4" />
                    <span className="hidden sm:inline">Bild generieren</span>
                  </>
                )}
              </Button>
              
              {!dream.analysis && (
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={analyzeDream}
                  disabled={analyzingDream}
                  className="flex items-center gap-1"
                >
                  {analyzingDream ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span className="hidden sm:inline">Analysiere...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-4 w-4" />
                      <span className="hidden sm:inline">Analysieren</span>
                    </>
                  )}
                </Button>
              )}
              
              <Button 
                variant="destructive" 
                size="sm" 
                onClick={openDeleteModal}
                className="flex items-center gap-1"
              >
                <XIcon className="h-4 w-4" />
                <span className="hidden sm:inline">Löschen</span>
              </Button>
            </>
          )}
          
          {editing && (
            <>
              <Button 
                variant="default"
                size="sm" 
                onClick={saveDream}
                disabled={isUpdating}
                className="flex items-center gap-1"
              >
                {isUpdating ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Speichern...</span>
                  </>
                ) : (
                  <>
                    <CheckIcon className="h-4 w-4" />
                    <span>Speichern</span>
                  </>
                )}
              </Button>
              
              <Button 
                variant="outline" 
                size="sm" 
                onClick={cancelEditing}
                disabled={isUpdating}
                className="flex items-center gap-1"
              >
                <XIcon className="h-4 w-4" />
                <span>Abbrechen</span>
              </Button>
            </>
          )}
        </div>
      </div>
      
      {/* Dream content and metadata */}
      <div className="flex flex-col lg:flex-row">
        <div className="lg:w-2/3 p-6">
          {editing ? (
            <div className="space-y-4">
              <div>
                <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
                  Titel
                </label>
                <Input 
                  id="title"
                  value={title} 
                  onChange={(e) => setTitle(e.target.value)} 
                  placeholder="Traumtitel" 
                  className="w-full"
                />
              </div>
              
              <div>
                <label htmlFor="content" className="block text-sm font-medium text-gray-700 mb-1">
                  Trauminhalt
                </label>
                <Textarea 
                  id="content"
                  value={content} 
                  onChange={(e) => setContent(e.target.value)} 
                  placeholder="Beschreibe deinen Traum..." 
                  className="h-48 min-h-48 resize-y"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Stimmung vor dem Einschlafen (1-10)
                </label>
                <div className="flex items-center space-x-2">
                  <Input 
                    type="number" 
                    min="1" 
                    max="10"
                    value={moodBeforeSleep || ''} 
                    onChange={(e) => setMoodBeforeSleep(e.target.value ? parseInt(e.target.value) : null)} 
                    className="w-24"
                  />
                  {moodBeforeSleep && <div className={`w-5 h-5 rounded-full bg-${moodBeforeSleep >= 7 ? 'green' : moodBeforeSleep >= 4 ? 'yellow' : 'red'}-${moodBeforeSleep >= 8 ? '500' : moodBeforeSleep >= 6 ? '400' : moodBeforeSleep >= 4 ? '300' : '500'}`}></div>}
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Stimmung nach dem Aufwachen (1-10)
                </label>
                <div className="flex items-center space-x-2">
                  <Input 
                    type="number" 
                    min="1" 
                    max="10"
                    value={moodAfterWakeup || ''} 
                    onChange={(e) => setMoodAfterWakeup(e.target.value ? parseInt(e.target.value) : null)} 
                    className="w-24"
                  />
                  {moodAfterWakeup && <div className={`w-5 h-5 rounded-full bg-${moodAfterWakeup >= 7 ? 'green' : moodAfterWakeup >= 4 ? 'yellow' : 'red'}-${moodAfterWakeup >= 8 ? '500' : moodAfterWakeup >= 6 ? '400' : moodAfterWakeup >= 4 ? '300' : '500'}`}></div>}
                </div>
              </div>
              
              <div>
                <label htmlFor="mood-notes" className="block text-sm font-medium text-gray-700 mb-1">
                  Notizen zur Stimmung (optional)
                </label>
                <Textarea 
                  id="mood-notes"
                  value={moodNotes} 
                  onChange={(e) => setMoodNotes(e.target.value)} 
                  placeholder="Notizen zum Einschlafen oder Aufwachen..." 
                  className="h-24 resize-y"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
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
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Traumbild
                </label>
                {!imagePreview && !dream.imageUrl && (
                  <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md">
                    <div className="space-y-1 text-center">
                      <CameraIcon className="mx-auto h-12 w-12 text-gray-400" />
                      <div className="flex text-sm text-gray-600">
                        <label
                          htmlFor="image-upload"
                          className="relative cursor-pointer rounded-md font-medium text-blue-600 hover:text-blue-500 focus-within:outline-none"
                        >
                          <span>Lade ein Bild hoch</span>
                          <input
                            id="image-upload"
                            name="image"
                            type="file"
                            className="sr-only"
                            accept="image/*"
                            onChange={handleImageChange}
                          />
                        </label>
                        <p className="pl-1">oder ziehe es hierher</p>
                      </div>
                      <p className="text-xs text-gray-500">
                        PNG, JPG, GIF bis zu 10MB
                      </p>
                    </div>
                  </div>
                )}
                
                {imagePreview && (
                  <div className="relative mt-2">
                    <img 
                      src={imagePreview} 
                      alt="Dream image preview" 
                      className="w-full max-h-96 object-contain rounded-md border border-gray-200"
                    />
                    <Button 
                      type="button" 
                      variant="destructive" 
                      size="sm" 
                      className="absolute top-2 right-2 opacity-90 hover:opacity-100"
                      onClick={cancelImageUpload}
                    >
                      <XIcon className="h-4 w-4" />
                    </Button>
                  </div>
                )}
                
                {!imagePreview && dream.imageUrl && (
                  <div className="relative mt-2">
                    <img 
                      src={dream.imageUrl} 
                      alt="Current dream image" 
                      className="w-full max-h-96 object-contain rounded-md border border-gray-200"
                    />
                    <Button 
                      type="button" 
                      variant="default" 
                      size="sm" 
                      className="absolute top-2 right-2 opacity-90 hover:opacity-100 bg-black/50 hover:bg-black/70"
                      onClick={() => {
                        const input = document.getElementById('image-upload') as HTMLInputElement;
                        if (input) input.click();
                      }}
                    >
                      <PencilIcon className="h-4 w-4" />
                    </Button>
                    <input
                      id="image-upload"
                      name="image"
                      type="file"
                      className="sr-only"
                      accept="image/*"
                      onChange={handleImageChange}
                    />
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <p className="whitespace-pre-wrap text-gray-800">{dream.content}</p>
              
              {/* Tags */}
              {dream.tags && dream.tags.length > 0 && (
                <div className="mt-4">
                  <h3 className="text-sm font-medium text-gray-700 mb-2 flex items-center">
                    <TagIcon className="h-4 w-4 mr-1" />
                    Tags
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {dream.tags.map((tag, index) => (
                      <Badge key={index} variant="secondary" className="px-2 py-1">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
              
              {/* Mood notes */}
              {dream.moodNotes && (
                <div className="mt-4 p-3 bg-gray-50 rounded-md">
                  <h3 className="text-sm font-medium text-gray-700 mb-1">Stimmungsnotizen:</h3>
                  <p className="text-sm text-gray-600">{dream.moodNotes}</p>
                </div>
              )}
            </div>
          )}
        </div>
        
        {/* Right sidebar - Image and Analysis */}
        <div className="lg:w-1/3 bg-gray-50 p-6 border-t lg:border-t-0 lg:border-l border-gray-200">
          {/* Dream image */}
          {(dream.imageUrl || newImage) && (
            <div className="mb-6">
              <h3 className="text-sm font-medium text-gray-700 mb-2">Traumvisualisierung</h3>
              <div 
                className="relative overflow-hidden rounded-lg cursor-pointer transform transition-transform duration-300 hover:scale-[1.02] shadow-md"
                onClick={() => openImageModal(newImage || dream.imageUrl || "")}
              >
                <img 
                  src={newImage || dream.imageUrl || ""} 
                  alt="Dream visualization" 
                  className="w-full h-auto object-cover"
                />
                <div className="absolute inset-0 bg-black bg-opacity-0 hover:bg-opacity-10 flex items-center justify-center transition-opacity duration-300">
                  <ZoomIn className="text-white opacity-0 hover:opacity-100 h-8 w-8" />
                </div>
              </div>
            </div>
          )}
          
          {/* Dream analysis */}
          {analysis && (
            <div>
              <h3 className="text-sm font-medium text-gray-700 mb-2 flex items-center">
                <Sparkles className="h-4 w-4 mr-1 text-dream-primary" />
                Traumanalyse
              </h3>
              
              {/* Analysis content */}
              <div className="space-y-4">
                {/* Themes */}
                {analysis.themes && analysis.themes.length > 0 && (
                  <div>
                    <h4 className="text-xs uppercase text-gray-500 font-medium mb-1">Themen</h4>
                    <div className="flex flex-wrap gap-1.5">
                      {analysis.themes.map((theme: string, index: number) => (
                        <Badge key={index} className="bg-dream-primary/10 text-dream-primary hover:bg-dream-primary/15 border-dream-primary/20">
                          {theme}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
                
                {/* Emotions */}
                {analysis.emotions && analysis.emotions.length > 0 && (
                  <div>
                    <h4 className="text-xs uppercase text-gray-500 font-medium mb-1">Emotionen</h4>
                    <div className="space-y-1.5">
                      {analysis.emotions.map((emotion: { name: string, intensity: number }, index: number) => (
                        <div key={index} className="flex items-center">
                          <span className="text-sm w-24 text-gray-700">{emotion.name}</span>
                          <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-dream-primary rounded-full" 
                              style={{ width: `${emotion.intensity * 100}%` }}
                            ></div>
                          </div>
                          <span className="text-xs text-gray-500 ml-2">{Math.round(emotion.intensity * 100)}%</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                
                {/* Symbols */}
                {analysis.symbols && analysis.symbols.length > 0 && (
                  <div>
                    <h4 className="text-xs uppercase text-gray-500 font-medium mb-1">Symbole</h4>
                    <div className="space-y-2">
                      {analysis.symbols.map((symbol: { symbol: string, meaning: string }, index: number) => (
                        <div key={index} className="text-sm">
                          <span className="font-medium text-dream-primary">{symbol.symbol}</span>
                          <span className="text-gray-600"> - {symbol.meaning}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                
                {/* Interpretation */}
                {analysis.interpretation && (
                  <div>
                    <h4 className="text-xs uppercase text-gray-500 font-medium mb-1">Interpretation</h4>
                    <p className="text-sm text-gray-800">{analysis.interpretation}</p>
                  </div>
                )}
                
                {/* Quote */}
                {analysis.quote && (
                  <div className="mt-4 p-3 bg-dream-primary/5 rounded-md border-l-4 border-dream-primary/30 italic">
                    <p className="text-sm text-gray-700">{analysis.quote.text}</p>
                    {analysis.quote.source && (
                      <p className="text-xs text-gray-500 mt-1 text-right">— {analysis.quote.source}</p>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}
          
          {/* Show analysis loading state */}
          {analyzingDream && (
            <div className="flex flex-col items-center justify-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-dream-primary"></div>
              <p className="mt-4 text-gray-600">Analyse wird verarbeitet...</p>
            </div>
          )}
        </div>
      </div>

      {/* Image Modal */}
      <Dialog open={isImageModalOpen} onOpenChange={setIsImageModalOpen}>
        <DialogContent className="sm:max-w-4xl bg-black/95 border-none">
          <DialogHeader>
            <DialogTitle className="text-white">Traumbild</DialogTitle>
          </DialogHeader>
          <div className="flex items-center justify-center py-4">
            <img 
              src={newImage || dream.imageUrl || ""} 
              alt="Traumbild (Vergrößerte Ansicht)" 
              className="max-h-[70vh] max-w-full object-contain rounded-lg shadow-2xl animate-fadeIn" 
            />
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Modal */}
      <AlertDialog open={isDeleteModalOpen} onOpenChange={setIsDeleteModalOpen}>
        <AlertDialogContent className="sm:max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle>Traum löschen?</AlertDialogTitle>
            <AlertDialogDescription>
              Bist du sicher, dass du diesen Traum löschen möchtest? Diese Aktion kann nicht rückgängig gemacht werden.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Abbrechen</AlertDialogCancel>
            <AlertDialogAction 
              onClick={deleteDream}
              className="bg-red-500 hover:bg-red-600 text-white"
              disabled={isDeleting}
            >
              {isDeleting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Löschen...
                </>
              ) : (
                "Traum löschen"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </section>
  );
}