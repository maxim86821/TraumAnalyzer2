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
import { PencilIcon, CameraIcon, XIcon, CheckIcon, TagIcon, PlusIcon, Sparkles, Loader2 } from "lucide-react";
import { useToast } from "../hooks/use-toast";

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
                  placeholder="Beschreibe deinen Traum detailliert..." 
                  rows={8}
                  className="w-full"
                />
              </div>
              
              <div>
                <label htmlFor="tags" className="block text-sm font-medium text-gray-700 mb-1">
                  Tags
                </label>
                <div className="flex flex-wrap gap-2 mb-2">
                  {tags.map((tag, index) => (
                    <Badge key={index} variant="secondary" className="flex items-center gap-1">
                      {tag}
                      <XIcon 
                        className="h-3 w-3 cursor-pointer hover:text-red-500" 
                        onClick={() => removeTag(tag)} 
                      />
                    </Badge>
                  ))}
                </div>
                <div className="flex">
                  <Input 
                    id="tags"
                    value={newTag} 
                    onChange={(e) => setNewTag(e.target.value)} 
                    onKeyPress={handleTagKeyPress}
                    placeholder="Neuen Tag hinzufügen..." 
                    className="w-full"
                  />
                  <Button 
                    type="button" 
                    onClick={addTag} 
                    disabled={!newTag.trim()}
                    className="ml-2 flex items-center"
                    variant="outline"
                  >
                    <PlusIcon className="h-4 w-4" />
                    <span className="ml-1">Tag</span>
                  </Button>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="moodBeforeSleep" className="block text-sm font-medium text-gray-700 mb-1">
                    Stimmung vor dem Schlafen (1-10)
                  </label>
                  <Input 
                    id="moodBeforeSleep"
                    type="number" 
                    min="1" 
                    max="10" 
                    value={moodBeforeSleep || ''} 
                    onChange={(e) => setMoodBeforeSleep(e.target.value ? parseInt(e.target.value) : null)} 
                    placeholder="1-10" 
                  />
                </div>
                
                <div>
                  <label htmlFor="moodAfterWakeup" className="block text-sm font-medium text-gray-700 mb-1">
                    Stimmung nach dem Aufwachen (1-10)
                  </label>
                  <Input 
                    id="moodAfterWakeup"
                    type="number" 
                    min="1" 
                    max="10" 
                    value={moodAfterWakeup || ''} 
                    onChange={(e) => setMoodAfterWakeup(e.target.value ? parseInt(e.target.value) : null)} 
                    placeholder="1-10" 
                  />
                </div>
              </div>
              
              <div>
                <label htmlFor="moodNotes" className="block text-sm font-medium text-gray-700 mb-1">
                  Stimmungsnotizen
                </label>
                <Textarea 
                  id="moodNotes"
                  value={moodNotes} 
                  onChange={(e) => setMoodNotes(e.target.value)} 
                  placeholder="Zusätzliche Notizen zur Stimmung..." 
                  rows={3}
                  className="w-full"
                />
              </div>
              
              <div>
                <label htmlFor="dreamImage" className="block text-sm font-medium text-gray-700 mb-1">
                  Traumbild (optional)
                </label>
                {imagePreview ? (
                  <div className="relative">
                    <img 
                      src={imagePreview} 
                      alt="Preview" 
                      className="max-h-60 rounded-md object-contain" 
                    />
                    <Button 
                      variant="destructive" 
                      size="sm" 
                      onClick={cancelImageUpload}
                      className="absolute top-2 right-2"
                    >
                      <XIcon className="h-4 w-4" />
                    </Button>
                  </div>
                ) : (
                  <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md">
                    <div className="space-y-1 text-center">
                      <CameraIcon className="mx-auto h-12 w-12 text-gray-400" />
                      <div className="flex text-sm text-gray-600">
                        <label
                          htmlFor="dreamImage"
                          className="relative cursor-pointer bg-white rounded-md font-medium text-blue-600 hover:text-blue-500 focus-within:outline-none"
                        >
                          <span>Bild hochladen</span>
                          <input
                            id="dreamImage"
                            name="dreamImage"
                            type="file"
                            accept="image/*"
                            onChange={handleImageChange}
                            className="sr-only"
                          />
                        </label>
                        <p className="pl-1">oder hierher ziehen</p>
                      </div>
                      <p className="text-xs text-gray-500">
                        PNG, JPG, GIF bis zu 10MB
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div>
              {/* Dream content */}
              <div className="prose prose-md max-w-none">
                <p className="whitespace-pre-line text-gray-800">{dream.content}</p>
              </div>
              
              {/* Tags */}
              {dream.tags && dream.tags.length > 0 && (
                <div className="mt-4">
                  <div className="flex items-center text-sm text-gray-600 mb-2">
                    <TagIcon className="h-4 w-4 mr-1" />
                    <span>Tags:</span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {dream.tags.map((tag, index) => (
                      <Badge key={index} variant="secondary">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
              
              {/* Mood notes */}
              {dream.moodNotes && (
                <div className="mt-4 bg-gray-50 p-4 rounded-md">
                  <h4 className="text-sm font-medium text-gray-700 mb-2">Stimmungsnotizen:</h4>
                  <p className="text-sm text-gray-600">{dream.moodNotes}</p>
                </div>
              )}
              
              {/* Dream image */}
              {dream.imageUrl && (
                <div className="mt-6">
                  <h4 className="text-sm font-medium text-gray-700 mb-2">Traumbild:</h4>
                  <img 
                    src={dream.imageUrl} 
                    alt="Traumbild" 
                    className="rounded-lg shadow-sm max-h-96 max-w-full object-contain" 
                  />
                </div>
              )}
            </div>
          )}
        </div>
        
        <div className="lg:w-1/3 bg-dream-light p-6 border-l border-gray-200">
          <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-dream-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
            </svg>
            KI-Analyse
          </h3>
          
          {analysis ? (
            'directText' in analysis ? (
              // Fallback für direktText (wenn analyse nicht korrekt geparst wurde)
              <div className="prose prose-sm">
                <p className="text-gray-600">
                  {analysis.directText || "Keine Details zur Analyse verfügbar."}
                </p>
              </div>
            ) : (
              <>
                {/* Themes section */}
                <div className="mb-6">
                  <h4 className="text-sm font-medium text-gray-700 mb-2">Hauptthemen</h4>
                  <div className="flex flex-wrap gap-2">
                    {analysis.themes && analysis.themes.map((theme: string, index: number) => {
                      // Different background colors for variety
                      const colorClasses = [
                        "bg-dream-primary/10 text-dream-primary",
                        "bg-blue-50 text-blue-600",
                        "bg-yellow-50 text-yellow-600",
                        "bg-green-50 text-green-600",
                        "bg-purple-50 text-purple-600"
                      ];
                      const colorClass = colorClasses[index % colorClasses.length];
                      
                      return (
                        <span 
                          key={index} 
                          className={`inline-block ${colorClass} text-sm px-3 py-1 rounded-full font-medium ai-analysis-tag hover:scale-105 transition-all`}
                        >
                          {theme}
                        </span>
                      );
                    })}
                  </div>
                </div>
                
                {/* Emotions section */}
                <div className="mb-6">
                  <h4 className="text-sm font-medium text-gray-700 mb-2">Emotionale Landschaft</h4>
                  <div className="flex flex-col space-y-2">
                    {analysis.emotions && analysis.emotions.map((emotion: { name: string, intensity: number }, index: number) => (
                      <div key={index} className="flex items-center">
                        <span className="text-sm text-gray-700 w-24">{emotion.name}:</span>
                        <div className="flex-grow bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-dream-accent h-2 rounded-full" 
                            style={{ width: `${emotion.intensity * 100}%` }}
                          ></div>
                        </div>
                        <span className="text-xs text-gray-500 ml-2">{Math.round(emotion.intensity * 100)}%</span>
                      </div>
                    ))}
                  </div>
                </div>
                
                {/* Symbols section */}
                <div className="mb-6">
                  <h4 className="text-sm font-medium text-gray-700 mb-2">Symbolische Bedeutungen</h4>
                  <ul className="text-sm text-gray-700 space-y-2">
                    {analysis.symbols && analysis.symbols.map((symbol: { symbol: string, meaning: string }, index: number) => (
                      <li key={index} className="flex flex-col">
                        <span className="text-dream-primary font-medium">{symbol.symbol}:</span>
                        <span className="ml-1">{symbol.meaning}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                
                {/* Keywords section */}
                {analysis.keywords && Array.isArray(analysis.keywords) && analysis.keywords.length > 0 && (
                  <div className="mb-6">
                    <h4 className="text-sm font-medium text-gray-700 mb-2">Schlüsselwörter</h4>
                    <div className="flex flex-wrap gap-2">
                      {analysis.keywords.map((keyword: string, index: number) => (
                        <span 
                          key={index} 
                          className="inline-block bg-dream-dark/10 text-dream-dark text-sm px-3 py-1 rounded-full font-medium"
                        >
                          {keyword}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                
                {/* Cultural references for keywords */}
                {analysis.keywordReferences && Array.isArray(analysis.keywordReferences) && analysis.keywordReferences.length > 0 && (
                  <div className="mb-6">
                    <h4 className="text-sm font-medium text-gray-700 mb-2">Kulturelle Referenzen</h4>
                    <div className="space-y-4">
                      {analysis.keywordReferences.map((ref: any, index: number) => (
                        <div key={index} className="border-l-2 border-dream-primary pl-3">
                          <div className="font-medium text-dream-primary">{ref.word}</div>
                          <div className="text-sm text-gray-700 mb-1">{ref.meaning}</div>
                          <div className="space-y-1">
                            {ref.culturalReferences && Array.isArray(ref.culturalReferences) && ref.culturalReferences.map((culture: any, cIndex: number) => (
                              <div key={cIndex} className="text-xs">
                                <span className="font-medium text-gray-600">{culture.culture}:</span>{" "}
                                <span className="text-gray-600">{culture.interpretation}</span>
                              </div>
                            ))}
                          </div>
                          {ref.url && (
                            <a 
                              href={ref.url} 
                              target="_blank" 
                              rel="noopener noreferrer" 
                              className="text-xs text-dream-accent hover:underline mt-1 inline-block"
                            >
                              Mehr erfahren →
                            </a>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                
                {/* Interpretation */}
                {analysis.interpretation && (
                  <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100 mb-6">
                    <h4 className="text-sm font-medium text-gray-700 mb-2">Zusammenfassende Deutung</h4>
                    <p className="text-sm text-gray-600">
                      {analysis.interpretation}
                    </p>
                  </div>
                )}
                
                {/* Quote */}
                {analysis.quote && typeof analysis.quote === 'object' && analysis.quote.text && (
                  <div className="mb-6">
                    <blockquote className="text-sm italic text-gray-600 border-l-4 border-dream-accent pl-3 py-2">
                      "{analysis.quote.text}"
                      <footer className="text-xs text-gray-500 mt-1">— {analysis.quote.source || 'Unbekannt'}</footer>
                    </blockquote>
                  </div>
                )}
                
                {/* Motivational Insight */}
                {analysis.motivationalInsight && (
                  <div className="mb-6">
                    <h4 className="text-sm font-medium text-gray-700 mb-2">Motivierender Gedanke</h4>
                    <p className="text-sm italic text-gray-600">{analysis.motivationalInsight}</p>
                  </div>
                )}
                
                {/* Weekly Insight if available */}
                {analysis.weeklyInsight && typeof analysis.weeklyInsight === 'object' && (
                  <div className="bg-dream-light/50 p-4 rounded-lg border border-dream-primary/20 mt-4">
                    <h4 className="text-sm font-medium text-gray-700 mb-2">Wöchentliche Einsicht</h4>
                    <p className="text-sm text-gray-600 mb-2">{analysis.weeklyInsight.summary}</p>
                    
                    {analysis.weeklyInsight.patterns && Array.isArray(analysis.weeklyInsight.patterns) && analysis.weeklyInsight.patterns.length > 0 && (
                      <div className="mb-2">
                        <h5 className="text-xs font-medium text-gray-700 mb-1">Erkannte Muster:</h5>
                        <ul className="list-disc list-inside text-xs text-gray-600 space-y-1">
                          {analysis.weeklyInsight.patterns.map((pattern: string, index: number) => (
                            <li key={index}>{pattern}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                    
                    {analysis.weeklyInsight.recommendations && Array.isArray(analysis.weeklyInsight.recommendations) && analysis.weeklyInsight.recommendations.length > 0 && (
                      <div>
                        <h5 className="text-xs font-medium text-gray-700 mb-1">Empfehlungen:</h5>
                        <ul className="list-disc list-inside text-xs text-gray-600 space-y-1">
                          {analysis.weeklyInsight.recommendations.map((rec: string, index: number) => (
                            <li key={index}>{rec}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                )}
              </>
            )
          ) : (
            <div className="flex flex-col items-center justify-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-dream-primary"></div>
              <p className="mt-4 text-gray-600">Analyse wird verarbeitet...</p>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}