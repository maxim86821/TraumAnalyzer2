import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Dream } from "@shared/schema";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import DreamCard from "@/components/DreamCard";
import { PlusIcon, SearchIcon, CalendarIcon } from "lucide-react";
import { useMobile } from "@/hooks/use-mobile";

export default function Home() {
  const [_, setLocation] = useLocation();
  const isMobile = useMobile();
  const [searchQuery, setSearchQuery] = useState("");

  // Fetch dreams from the API
  const { data: dreams, isLoading, error } = useQuery<Dream[]>({
    queryKey: ['/api/dreams'],
  });
  
  // Filter dreams based on search query
  const filteredDreams = dreams?.filter(dream => {
    if (!searchQuery.trim()) return true;
    
    const query = searchQuery.toLowerCase();
    return (
      dream.title.toLowerCase().includes(query) ||
      dream.content.toLowerCase().includes(query) ||
      (dream.analysis && JSON.parse(dream.analysis).themes?.some((theme: string) => 
        theme.toLowerCase().includes(query)
      ))
    );
  });

  return (
    <div>
      {/* Page Title Section */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-8">
        <div>
          <h1 className="text-2xl lg:text-3xl font-serif font-bold text-gray-800">Meine Traumsammlung</h1>
          <p className="text-gray-600 mt-1">Entdecke und analysiere deine nächtlichen Abenteuer</p>
        </div>
        
        {/* Only show button on desktop, mobile has bottom nav */}
        {!isMobile && (
          <Button 
            onClick={() => setLocation("/new")}
            className="mt-4 lg:mt-0 px-5 py-2 bg-dream-primary hover:bg-dream-dark text-white rounded-lg font-medium flex items-center transition-colors shadow-sm"
          >
            <PlusIcon className="h-5 w-5 mr-2" />
            Neuer Traum
          </Button>
        )}
      </div>

      {/* Search Bar and Calendar Button - Only show if there are dreams */}
      {!isLoading && !error && dreams && dreams.length > 0 && (
        <div className="flex gap-3 mb-6">
          <div className="relative flex-grow">
            <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
              <SearchIcon className="h-5 w-5 text-gray-400" />
            </div>
            <Input
              type="text"
              placeholder="Suche nach Titeln, Inhalten oder Themen..."
              className="pl-10 pr-4 py-2 bg-white"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          
          <Button 
            variant="outline" 
            className="flex items-center gap-2 border-dream-primary text-dream-primary hover:bg-dream-light"
            onClick={() => setLocation("/calendar")}
          >
            <CalendarIcon className="h-4 w-4" />
            <span className="hidden sm:inline">Kalender</span>
          </Button>
        </div>
      )}
      
      {/* Recent Dreams Section */}
      <section className="mb-10">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-serif font-semibold text-gray-800">
            {dreams && dreams.length > 0 
              ? searchQuery.trim() 
                ? `Suchergebnisse (${filteredDreams?.length || 0})` 
                : "Letzte Träume"
              : "Deine Traumsammlung"
            }
          </h2>
          {searchQuery.trim() && filteredDreams?.length ? (
            <div className="text-sm text-gray-500">
              {filteredDreams.length} von {dreams?.length} Träumen
            </div>
          ) : null}
        </div>
        
        {isLoading ? (
          // Loading state
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-white rounded-xl shadow-md overflow-hidden">
                <div className="h-40 bg-gray-200 animate-pulse"></div>
                <div className="p-4">
                  <div className="h-4 bg-gray-200 rounded w-3/4 mb-2 animate-pulse"></div>
                  <div className="h-3 bg-gray-100 rounded w-full mb-2 animate-pulse"></div>
                  <div className="h-3 bg-gray-100 rounded w-full mb-2 animate-pulse"></div>
                  <div className="h-3 bg-gray-100 rounded w-1/2 animate-pulse"></div>
                </div>
              </div>
            ))}
          </div>
        ) : error ? (
          // Error state
          <div className="bg-red-50 border-l-4 border-red-500 p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-500" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-red-700">
                  Fehler beim Laden der Träume. Bitte versuche es später erneut.
                </p>
              </div>
            </div>
          </div>
        ) : dreams && dreams.length > 0 ? (
          // Dreams list
          <>
            {filteredDreams && filteredDreams.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredDreams.map((dream) => (
                  <DreamCard key={dream.id} dream={dream} />
                ))}
              </div>
            ) : (
              // No results from search
              <div className="bg-white rounded-xl shadow-md p-8 text-center">
                <div className="mx-auto w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                  <SearchIcon className="h-8 w-8 text-gray-400" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">Keine Treffer gefunden</h3>
                <p className="text-gray-500 mb-4">
                  Es wurden keine Träume gefunden, die "{searchQuery}" enthalten.
                </p>
                <Button 
                  onClick={() => setSearchQuery("")}
                  variant="outline"
                  className="border-dream-primary text-dream-primary"
                >
                  Suche zurücksetzen
                </Button>
              </div>
            )}
          </>
        ) : (
          // Empty state
          <div className="bg-white rounded-xl shadow-md p-8 text-center">
            <div className="mx-auto w-16 h-16 bg-dream-light rounded-full flex items-center justify-center mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-dream-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M2.25 15a4.5 4.5 0 004.5 4.5H18a3.75 3.75 0 001.332-7.257 3 3 0 00-3.758-3.848 5.25 5.25 0 00-10.233 2.33A4.502 4.502 0 002.25 15z" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">Keine Träume gefunden</h3>
            <p className="text-gray-500 mb-4">
              Du hast noch keine Träume in deinem Tagebuch. Beginne damit, deinen ersten Traum zu erfassen.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button 
                onClick={() => setLocation("/new")}
                className="bg-dream-primary hover:bg-dream-dark text-white"
              >
                <PlusIcon className="h-5 w-5 mr-2" />
                Ersten Traum erfassen
              </Button>
              
              <Button 
                variant="outline"
                onClick={() => setLocation("/calendar")}
                className="border-dream-primary text-dream-primary hover:bg-dream-light mt-2 sm:mt-0"
              >
                <CalendarIcon className="h-5 w-5 mr-2" />
                Zum Kalender
              </Button>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
