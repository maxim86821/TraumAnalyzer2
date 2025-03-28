import { useQuery } from "@tanstack/react-query";
import { Dream } from "@shared/schema";
import { useState } from "react";
import { useLocation } from "wouter";
import { format, parseISO, isValid, isSameDay } from "date-fns";
import { de } from "date-fns/locale";
import { DayPicker } from "react-day-picker";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CalendarIcon, ArrowLeftIcon, MoonIcon } from "lucide-react";

export default function CalendarView() {
  const [_, setLocation] = useLocation();
  const [selectedDay, setSelectedDay] = useState<Date | undefined>(undefined);
  
  // Fetch dreams from the API
  const { data: dreams, isLoading } = useQuery<Dream[]>({
    queryKey: ['/api/dreams'],
  });

  // Holen wir uns die Tage, an denen Träume aufgetreten sind
  const getOccurredDates = () => {
    if (!dreams || dreams.length === 0) return [];
    
    // Datenobjekte aus den Traumdaten extrahieren
    return dreams.map(dream => {
      // Sicherstellen, dass wir gültige Datumsobjekte haben (verarbeitet sowohl Date als auch ISO-String)
      const dreamDate = typeof dream.date === 'string' 
        ? parseISO(dream.date) 
        : new Date(dream.date);
        
      return isValid(dreamDate) ? dreamDate : null;
    }).filter(Boolean) as Date[];
  };
  
  // Träume für den ausgewählten Tag filtern
  const getSelectedDayDreams = () => {
    if (!selectedDay || !dreams) return [];
    
    return dreams.filter(dream => {
      const dreamDate = typeof dream.date === 'string' 
        ? parseISO(dream.date) 
        : new Date(dream.date);
        
      return isValid(dreamDate) && isSameDay(dreamDate, selectedDay);
    });
  };
  
  // Traum-Termine für den Kalender
  const dreamDates = getOccurredDates();
  const selectedDayDreams = getSelectedDayDreams();
  
  // Anpassung für den Kalender - Tage mit Träumen markieren
  const modifiers = {
    dreamDay: dreamDates,
  };
  
  // Styling für den Kalender
  const modifiersStyles = {
    dreamDay: {
      backgroundColor: 'rgba(139, 92, 246, 0.15)',
      borderRadius: '100%',
      color: '#8B5CF6'
    }
  };

  // Funktion zum Formatieren des Datums in deutschem Format
  const formatDate = (date: Date) => {
    return format(date, 'd. MMMM yyyy', { locale: de });
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-dream-primary"></div>
        <p className="mt-4 text-gray-600">Träume werden geladen...</p>
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800 flex items-center">
          <CalendarIcon className="mr-2 h-6 w-6 text-dream-primary" />
          Traumkalender
        </h1>
        <Button 
          variant="outline" 
          size="sm"
          onClick={() => setLocation("/")}
          className="flex items-center"
        >
          <ArrowLeftIcon className="h-4 w-4 mr-2" />
          Zurück zur Übersicht
        </Button>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Kalender */}
        <div className="lg:col-span-2">
          <Card className="overflow-hidden bg-white shadow-md">
            <CardContent className="p-6">
              <DayPicker
                mode="single"
                selected={selectedDay}
                onSelect={setSelectedDay}
                modifiers={modifiers}
                modifiersStyles={modifiersStyles}
                locale={de}
                weekStartsOn={1}
                className="border-0"
                footer={
                  <div className="mt-4 text-sm text-gray-500 flex items-center">
                    <span className="inline-block w-4 h-4 bg-purple-100 rounded-full mr-2"></span>
                    <span>Tage mit Traumeinträgen</span>
                  </div>
                }
              />
            </CardContent>
          </Card>
        </div>
        
        {/* Träume des ausgewählten Tages */}
        <div>
          <Card className="overflow-hidden bg-white shadow-md h-full">
            <CardContent className="p-6">
              {selectedDay ? (
                <>
                  <h2 className="text-lg font-semibold mb-4">
                    Träume am {formatDate(selectedDay)}
                  </h2>
                  
                  {selectedDayDreams.length > 0 ? (
                    <div className="space-y-4">
                      {selectedDayDreams.map((dream) => (
                        <div 
                          key={dream.id} 
                          className="p-4 border border-gray-100 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer"
                          onClick={() => setLocation(`/dreams/${dream.id}`)}
                        >
                          <div className="flex items-start justify-between">
                            <h3 className="font-medium text-gray-800">{dream.title}</h3>
                            <Badge variant="outline" className="bg-dream-light text-dream-primary">
                              <MoonIcon className="h-3 w-3 mr-1" />
                              {dream.moodAfterWakeup ? `${dream.moodAfterWakeup}/10` : 'Keine Stimmung'}
                            </Badge>
                          </div>
                          <p className="text-sm text-gray-600 mt-2 line-clamp-2">{dream.content}</p>
                          
                          {dream.tags && dream.tags.length > 0 && (
                            <div className="mt-3 flex flex-wrap gap-1">
                              {dream.tags.map((tag, idx) => (
                                <Badge key={idx} variant="secondary" className="text-xs">
                                  {tag}
                                </Badge>
                              ))}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-10 text-gray-500">
                      <MoonIcon className="h-12 w-12 mx-auto text-gray-300 mb-3" />
                      <p>Keine Traumeinträge für dieses Datum</p>
                    </div>
                  )}
                </>
              ) : (
                <div className="text-center py-20 text-gray-500">
                  <CalendarIcon className="h-12 w-12 mx-auto text-gray-300 mb-3" />
                  <p>Wähle ein Datum im Kalender aus, um die Traumeinträge zu sehen</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
      
      {/* Statistik */}
      <div className="mt-6">
        <Card className="overflow-hidden bg-white shadow-md">
          <CardContent className="p-6">
            <h2 className="text-lg font-semibold mb-4">Traumstatistik</h2>
            
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="p-4 bg-dream-light rounded-lg">
                <h3 className="text-sm font-medium text-dream-primary mb-1">Gesamtzahl der Träume</h3>
                <p className="text-2xl font-bold text-dream-dark">{dreams?.length || 0}</p>
              </div>
              
              <div className="p-4 bg-blue-50 rounded-lg">
                <h3 className="text-sm font-medium text-blue-600 mb-1">Tage mit Träumen</h3>
                <p className="text-2xl font-bold text-blue-700">{dreamDates.length}</p>
              </div>
              
              <div className="p-4 bg-emerald-50 rounded-lg">
                <h3 className="text-sm font-medium text-emerald-600 mb-1">Aktueller Monat</h3>
                <p className="text-2xl font-bold text-emerald-700">
                  {dreams?.filter(dream => {
                    const dreamDate = typeof dream.date === 'string' 
                      ? parseISO(dream.date) 
                      : new Date(dream.date);
                      
                    return isValid(dreamDate) && 
                      dreamDate.getMonth() === new Date().getMonth() && 
                      dreamDate.getFullYear() === new Date().getFullYear();
                  }).length || 0}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}