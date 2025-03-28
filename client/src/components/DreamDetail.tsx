import { Dream } from "@shared/schema";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { apiRequest } from "@/lib/queryClient";
import { queryClient } from "@/lib/queryClient";
import { format } from "date-fns";
import { de } from "date-fns/locale";
import { PencilIcon, CameraIcon, XIcon, CheckIcon } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

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

  // Handle save changes
  const handleSave = async () => {
    try {
      setIsUpdating(true);
      
      const updateData: any = {
        title,
        content
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
    setImagePreview(null);
    setImageFile(null);
    setEditing(false);
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
            {(imagePreview || dream.imageUrl) && (
              <img 
                src={imagePreview || dream.imageUrl || ''} 
                alt="Traumvisualisierung" 
                className="w-full h-56 object-cover rounded-lg"
              />
            )}
            
            {editing && (
              <div className="absolute bottom-4 right-4 flex gap-2">
                <label className="bg-white p-2 rounded-full shadow-md hover:bg-gray-50 transition-colors cursor-pointer">
                  <CameraIcon className="h-5 w-5 text-gray-600" />
                  <input 
                    type="file" 
                    className="hidden" 
                    accept="image/*"
                    onChange={handleImageChange}
                  />
                </label>
              </div>
            )}
          </div>
          
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
              
              {/* Interpretation */}
              <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100">
                <h4 className="text-sm font-medium text-gray-700 mb-2">Zusammenfassende Deutung</h4>
                <p className="text-sm text-gray-600">
                  {analysis.interpretation}
                </p>
              </div>
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
