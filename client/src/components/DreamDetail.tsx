import { Dream } from "@shared/schema";
import { useState } from "react";
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
  const [title, setTitle] = useState(dream.title);
  const [content, setContent] = useState(dream.content);
  const [isUpdating, setIsUpdating] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [tagInput, setTagInput] = useState("");
  const [tags, setTags] = useState<string[]>(dream.tags || []);
  const [moodBeforeSleep, setMoodBeforeSleep] = useState<number | undefined>(dream.moodBeforeSleep || undefined);
  const [moodAfterWakeup, setMoodAfterWakeup] = useState<number | undefined>(dream.moodAfterWakeup || undefined);
  const [moodNotes, setMoodNotes] = useState<string | undefined>(dream.moodNotes || undefined);
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);

  // Parse the analysis JSON if it exists
  const analysis = dream.analysis ? JSON.parse(dream.analysis) : null;

  // Format date in German
  const formattedDate = format(new Date(dream.date), 'd. MMMM yyyy', { locale: de });

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

  // Add a tag
  const addTag = () => {
    const trimmedTag = tagInput.trim();
    if (trimmedTag && !tags.includes(trimmedTag)) {
      setTags([...tags, trimmedTag]);
      setTagInput("");
    }
  };
  
  // Remove a tag
  const removeTag = (tagToRemove: string) => {
    setTags(tags.filter(tag => tag !== tagToRemove));
  };
  
  // Handle tag input keydown events
  const handleTagInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      addTag();
    }
  };

  // Handle save changes
  const handleSave = async () => {
    try {
      setIsUpdating(true);
      
      const updateData: any = {
        title,
        content,
        tags,
        moodBeforeSleep,
        moodAfterWakeup,
        moodNotes
      };
      
      // Include image if it was changed
      if (imagePreview && imageFile) {
        updateData.imageBase64 = imagePreview;
      }
      
      // Update the dream
      await apiRequest('PATCH', `/api/dreams/${dream.id}`, updateData);
      
      // Invalidate the cache to refresh data
      queryClient.invalidateQueries({ queryKey: ['/api/dreams', dream.id] });
      queryClient.invalidateQueries({ queryKey: ['/api/dreams'] });
      
      setEditing(false);
      toast({
        title: "Traum aktualisiert",
        description: "Dein Traum wurde erfolgreich aktualisiert.",
      });
    } catch (error) {
      console.error('Error updating dream:', error);
      toast({
        title: "Fehler",
        description: "Der Traum konnte nicht aktualisiert werden.",
        variant: "destructive",
      });
    } finally {
      setIsUpdating(false);
    }
  };

  // Cancel editing
  const handleCancel = () => {
    setTitle(dream.title);
    setContent(dream.content);
    setTags(dream.tags || []);
    setTagInput("");
    setImagePreview(null);
    setImageFile(null);
    setMoodBeforeSleep(dream.moodBeforeSleep || undefined);
    setMoodAfterWakeup(dream.moodAfterWakeup || undefined);
    setMoodNotes(dream.moodNotes || undefined);
    setEditing(false);
  };
  
  // Generate AI image for the dream
  const handleGenerateImage = async () => {
    try {
      setIsGeneratingImage(true);
      toast({
        title: "Bild wird generiert",
        description: "Das KI-Bild wird basierend auf deinem Traum erstellt. Dies kann einen Moment dauern...",
      });
      
      const response = await apiRequest('POST', `/api/dreams/${dream.id}/generate-image`);
      const data = await response.json();
      
      if (data.success) {
        // Invalidate the cache to refresh data
        queryClient.invalidateQueries({ queryKey: ['/api/dreams', dream.id] });
        queryClient.invalidateQueries({ queryKey: ['/api/dreams'] });
        
        toast({
          title: "Bild generiert!",
          description: "Dein Traumbild wurde erfolgreich erstellt.",
          variant: "default",
        });
      } else {
        throw new Error(data.details || "Fehler bei der Bildgenerierung");
      }
    } catch (error) {
      console.error('Error generating dream image:', error);
      toast({
        title: "Fehler",
        description: "Das Bild konnte nicht generiert werden. " + (error as Error).message,
        variant: "destructive",
      });
    } finally {
      setIsGeneratingImage(false);
    }
  };

  if (!dream) return null;

  return (
    <section className="bg-white rounded-xl shadow-lg overflow-hidden mb-8">
      <div className="flex flex-col lg:flex-row">
        {/* Left side: Dream content */}
        <div className="lg:w-2/3 p-6">
          <div className="flex justify-between items-start mb-6">
            {editing ? (
              <Input 
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="text-2xl font-serif font-bold text-gray-800"
              />
            ) : (
              <h2 className="text-2xl font-serif font-bold text-gray-800">{dream.title}</h2>
            )}
            <div className="text-sm text-gray-500 flex items-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              {formattedDate}
            </div>
          </div>
          
          <div className="mt-4 relative">
            {(imagePreview || dream.imageUrl) ? (
              <img 
                src={imagePreview || dream.imageUrl || ''} 
                alt="Traumvisualisierung" 
                className="w-full h-56 object-cover rounded-lg"
              />
            ) : (
              <div className="w-full h-56 flex items-center justify-center bg-gray-100 rounded-lg">
                <span className="text-gray-500 text-sm">Kein Bild verfügbar</span>
              </div>
            )}
            
            {/* Controls for editing and generating images */}
            <div className="absolute bottom-4 right-4 flex gap-2">
              {editing && (
                <label className="bg-white p-2 rounded-full shadow-md hover:bg-gray-50 transition-colors cursor-pointer">
                  <CameraIcon className="h-5 w-5 text-gray-600" />
                  <input 
                    type="file" 
                    className="hidden" 
                    accept="image/*"
                    onChange={handleImageChange}
                  />
                </label>
              )}
              
              {!editing && (
                <Button
                  variant="outline"
                  size="sm"
                  className="bg-white/80 backdrop-blur-sm hover:bg-white/90 text-dream-primary border-dream-primary"
                  onClick={handleGenerateImage}
                  disabled={isGeneratingImage}
                >
                  {isGeneratingImage ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                      Generiere...
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-4 w-4 mr-1" />
                      Bild generieren
                    </>
                  )}
                </Button>
              )}
            </div>
          </div>
          
          {/* Mood tracking display/edit */}
          {((dream.moodBeforeSleep || dream.moodAfterWakeup) || editing) && (
            <div className="mt-6 bg-gray-50 rounded-lg p-4">
              <h3 className="text-lg font-semibold text-gray-800 mb-3">Stimmungstracking</h3>
              
              {editing ? (
                // Edit mode
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <h4 className="text-sm font-medium text-gray-700 mb-2">Stimmung vor dem Schlafen (1-10)</h4>
                      <div className="flex items-center gap-2">
                        <Input 
                          type="number" 
                          min="1" 
                          max="10"
                          placeholder="1-10"
                          value={moodBeforeSleep || ""}
                          onChange={(e) => {
                            const value = parseInt(e.target.value);
                            if (!isNaN(value) && value >= 1 && value <= 10) {
                              setMoodBeforeSleep(value);
                            } else if (e.target.value === "") {
                              setMoodBeforeSleep(undefined);
                            }
                          }}
                          className="max-w-[100px]"
                        />
                        {moodBeforeSleep && (
                          <div className="flex-grow bg-gray-200 rounded-full h-3">
                            <div 
                              className="bg-indigo-400 h-3 rounded-full" 
                              style={{ width: `${(moodBeforeSleep / 10) * 100}%` }}
                            ></div>
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <div>
                      <h4 className="text-sm font-medium text-gray-700 mb-2">Stimmung nach dem Aufwachen (1-10)</h4>
                      <div className="flex items-center gap-2">
                        <Input 
                          type="number" 
                          min="1" 
                          max="10"
                          placeholder="1-10"
                          value={moodAfterWakeup || ""}
                          onChange={(e) => {
                            const value = parseInt(e.target.value);
                            if (!isNaN(value) && value >= 1 && value <= 10) {
                              setMoodAfterWakeup(value);
                            } else if (e.target.value === "") {
                              setMoodAfterWakeup(undefined);
                            }
                          }}
                          className="max-w-[100px]"
                        />
                        {moodAfterWakeup && (
                          <div className="flex-grow bg-gray-200 rounded-full h-3">
                            <div 
                              className="bg-teal-400 h-3 rounded-full" 
                              style={{ width: `${(moodAfterWakeup / 10) * 100}%` }}
                            ></div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <div>
                    <h4 className="text-sm font-medium text-gray-700 mb-2">Stimmungsnotizen (optional)</h4>
                    <Textarea 
                      placeholder="Notizen zu deiner Stimmung oder Faktoren, die sie beeinflusst haben könnten..." 
                      value={moodNotes || ""}
                      onChange={(e) => setMoodNotes(e.target.value)}
                      className="min-h-[80px]"
                    />
                  </div>
                </div>
              ) : (
                // View mode
                <>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {dream.moodBeforeSleep && (
                      <div>
                        <h4 className="text-sm font-medium text-gray-700 mb-2">Stimmung vor dem Schlafen</h4>
                        <div className="flex items-center">
                          <div className="flex-grow bg-gray-200 rounded-full h-3">
                            <div 
                              className="bg-indigo-400 h-3 rounded-full" 
                              style={{ width: `${(dream.moodBeforeSleep / 10) * 100}%` }}
                            ></div>
                          </div>
                          <span className="text-sm font-medium ml-2">{dream.moodBeforeSleep}/10</span>
                        </div>
                      </div>
                    )}
                    
                    {dream.moodAfterWakeup && (
                      <div>
                        <h4 className="text-sm font-medium text-gray-700 mb-2">Stimmung nach dem Aufwachen</h4>
                        <div className="flex items-center">
                          <div className="flex-grow bg-gray-200 rounded-full h-3">
                            <div 
                              className="bg-teal-400 h-3 rounded-full" 
                              style={{ width: `${(dream.moodAfterWakeup / 10) * 100}%` }}
                            ></div>
                          </div>
                          <span className="text-sm font-medium ml-2">{dream.moodAfterWakeup}/10</span>
                        </div>
                      </div>
                    )}
                  </div>
                  
                  {dream.moodNotes && (
                    <div className="mt-3">
                      <h4 className="text-sm font-medium text-gray-700 mb-1">Notizen</h4>
                      <p className="text-sm text-gray-600 italic">{dream.moodNotes}</p>
                    </div>
                  )}
                </>
              )}
            </div>
          )}
          
          <div className="mt-6">
            <div className="flex justify-between items-center mb-3">
              <h3 className="text-lg font-semibold text-gray-800">Trauminhalt</h3>
              {!editing ? (
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => setEditing(true)}
                  className="text-dream-primary hover:text-dream-dark focus:outline-none text-sm font-medium flex items-center"
                >
                  <PencilIcon className="h-4 w-4 mr-1" />
                  Bearbeiten
                </Button>
              ) : (
                <div className="flex gap-2">
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={handleCancel}
                    disabled={isUpdating}
                    className="text-gray-500 hover:text-gray-700 focus:outline-none text-sm font-medium flex items-center"
                  >
                    <XIcon className="h-4 w-4 mr-1" />
                    Abbrechen
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={handleSave}
                    disabled={isUpdating}
                    className="text-green-600 hover:text-green-700 focus:outline-none text-sm font-medium flex items-center"
                  >
                    <CheckIcon className="h-4 w-4 mr-1" />
                    Speichern
                  </Button>
                </div>
              )}
            </div>
            
            {/* Tags section */}
            <div className="mb-4">
              <div className="flex justify-between items-center mb-2">
                <h4 className="text-sm font-medium text-gray-700">Tags</h4>
                {dream.tags && dream.tags.length > 0 && !editing && (
                  <span className="text-xs text-gray-500">{dream.tags.length} Tag{dream.tags.length !== 1 ? 's' : ''}</span>
                )}
              </div>
              
              {editing ? (
                <div className="mb-4">
                  <div className="flex gap-2 mb-2">
                    <Input
                      placeholder="Tag hinzufügen (Enter drücken)"
                      value={tagInput}
                      onChange={(e) => setTagInput(e.target.value)}
                      onKeyDown={handleTagInputKeyDown}
                      className="flex-grow"
                    />
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={addTag}
                      className="px-3 text-dream-primary border-dream-primary"
                    >
                      <PlusIcon className="h-4 w-4" />
                    </Button>
                  </div>
                  
                  <div className="flex flex-wrap gap-2">
                    {tags.map((tag, idx) => (
                      <Badge key={idx} variant="secondary" className="px-3 py-1 group">
                        <span className="flex items-center gap-1">
                          <TagIcon className="h-3 w-3" />
                          {tag}
                          <XIcon 
                            className="h-3 w-3 ml-1 cursor-pointer opacity-70 hover:opacity-100" 
                            onClick={() => removeTag(tag)}
                          />
                        </span>
                      </Badge>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="flex flex-wrap gap-2 mb-4">
                  {dream.tags && dream.tags.map((tag, idx) => (
                    <Badge key={idx} variant="secondary" className="px-3 py-1">
                      <span className="flex items-center gap-1">
                        <TagIcon className="h-3 w-3" />
                        {tag}
                      </span>
                    </Badge>
                  ))}
                  {(!dream.tags || dream.tags.length === 0) && (
                    <span className="text-sm text-gray-500 italic">Keine Tags</span>
                  )}
                </div>
              )}
            </div>
            
            <div className="prose max-w-none">
              {editing ? (
                <Textarea 
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  className="min-h-[200px]"
                />
              ) : (
                content.split('\n').map((paragraph, index) => (
                  <p key={index}>{paragraph}</p>
                ))
              )}
            </div>
          </div>
        </div>
        
        {/* Right side: AI Analysis */}
        <div className="lg:w-1/3 bg-dream-light p-6 border-l border-gray-200">
          <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-dream-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
            </svg>
            KI-Analyse
          </h3>
          
          {analysis ? (
            <>
              {/* Themes section */}
              <div className="mb-6">
                <h4 className="text-sm font-medium text-gray-700 mb-2">Hauptthemen</h4>
                <div className="flex flex-wrap gap-2">
                  {analysis.themes.map((theme: string, index: number) => {
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
                  {analysis.emotions.map((emotion: { name: string, intensity: number }, index: number) => (
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
                  {analysis.symbols.map((symbol: { symbol: string, meaning: string }, index: number) => (
                    <li key={index} className="flex flex-col">
                      <span className="text-dream-primary font-medium">{symbol.symbol}:</span>
                      <span className="ml-1">{symbol.meaning}</span>
                    </li>
                  ))}
                </ul>
              </div>
              
              {/* Keywords section */}
              {analysis.keywords && analysis.keywords.length > 0 && (
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
              {analysis.keywordReferences && analysis.keywordReferences.length > 0 && (
                <div className="mb-6">
                  <h4 className="text-sm font-medium text-gray-700 mb-2">Kulturelle Referenzen</h4>
                  <div className="space-y-4">
                    {analysis.keywordReferences.map((ref: any, index: number) => (
                      <div key={index} className="border-l-2 border-dream-primary pl-3">
                        <div className="font-medium text-dream-primary">{ref.word}</div>
                        <div className="text-sm text-gray-700 mb-1">{ref.meaning}</div>
                        <div className="space-y-1">
                          {ref.culturalReferences.map((culture: any, cIndex: number) => (
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
              <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100 mb-6">
                <h4 className="text-sm font-medium text-gray-700 mb-2">Zusammenfassende Deutung</h4>
                <p className="text-sm text-gray-600">
                  {analysis.interpretation}
                </p>
              </div>
              
              {/* Quote */}
              {analysis.quote && (
                <div className="mb-6">
                  <blockquote className="text-sm italic text-gray-600 border-l-4 border-dream-accent pl-3 py-2">
                    "{analysis.quote.text}"
                    <footer className="text-xs text-gray-500 mt-1">— {analysis.quote.source}</footer>
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
              {analysis.weeklyInsight && (
                <div className="bg-dream-light/50 p-4 rounded-lg border border-dream-primary/20 mt-4">
                  <h4 className="text-sm font-medium text-gray-700 mb-2">Wöchentliche Einsicht</h4>
                  <p className="text-sm text-gray-600 mb-2">{analysis.weeklyInsight.summary}</p>
                  
                  {analysis.weeklyInsight.patterns.length > 0 && (
                    <div className="mb-2">
                      <h5 className="text-xs font-medium text-gray-700 mb-1">Erkannte Muster:</h5>
                      <ul className="list-disc list-inside text-xs text-gray-600 space-y-1">
                        {analysis.weeklyInsight.patterns.map((pattern: string, index: number) => (
                          <li key={index}>{pattern}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                  
                  {analysis.weeklyInsight.recommendations.length > 0 && (
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
