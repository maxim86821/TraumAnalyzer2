import React, { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { useQuery } from '@tanstack/react-query';
import { Loader2, Bookmark, BookmarkCheck, Search, Info, ArrowLeft } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';

interface Culture {
  id: number;
  name: string;
  description: string;
  region: string;
  historicalContext?: string;
}

interface DreamSymbol {
  id: number;
  name: string;
  generalMeaning: string;
  category: string;
  tags: string[];
  popularity: number;
}

interface CulturalInterpretation {
  id: number;
  symbolId: number;
  cultureId: number;
  interpretation: string;
  examples?: string;
  literaryReferences?: string;
}

interface SymbolComparison {
  id: number;
  symbolId: number;
  comparedSymbolId: number;
  similarities: string;
  differences: string;
  culturalContext?: string;
}

interface UserSymbolFavorite {
  id: number;
  userId: number;
  symbolId: number;
  notes?: string;
  createdAt: string;
}

const DreamSymbolLibrary: React.FC = () => {
  const { toast } = useToast();
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [selectedSymbol, setSelectedSymbol] = useState<DreamSymbol | null>(null);
  const [selectedCulture, setSelectedCulture] = useState<number | null>(null);
  const [userNotes, setUserNotes] = useState('');
  const [activeView, setActiveView] = useState<'list' | 'detail'>('list');

  // Kulturen abrufen
  const { 
    data: cultures, 
    isLoading: culturesLoading 
  } = useQuery<Culture[]>({ 
    queryKey: ['/api/cultures'],
  });

  // Symbols abrufen
  const { 
    data: symbols, 
    isLoading: symbolsLoading,
    refetch: refetchSymbols
  } = useQuery<DreamSymbol[]>({ 
    queryKey: ['/api/dream-symbols', { category: selectedCategory, query: searchQuery }],
    enabled: true,
  });

  // Benutzer-Favoriten abrufen
  const {
    data: favorites,
    isLoading: favoritesLoading,
    refetch: refetchFavorites
  } = useQuery<UserSymbolFavorite[]>({
    queryKey: ['/api/user/symbol-favorites'],
    enabled: !!user,
  });

  // Interpretationen für ein Symbol abrufen, wenn ein Symbol ausgewählt ist
  const {
    data: interpretations,
    isLoading: interpretationsLoading
  } = useQuery<CulturalInterpretation[]>({
    queryKey: ['/api/cultural-interpretations', { symbolId: selectedSymbol?.id }],
    enabled: !!selectedSymbol,
  });

  // Symbol-Vergleiche abrufen, wenn ein Symbol ausgewählt ist
  const {
    data: comparisons,
    isLoading: comparisonsLoading
  } = useQuery<SymbolComparison[]>({
    queryKey: ['/api/symbol-comparisons', { symbolId: selectedSymbol?.id }],
    enabled: !!selectedSymbol,
  });

  // Prüft, ob ein Symbol als Favorit markiert ist
  const isSymbolFavorite = (symbolId: number) => {
    return favorites?.some(fav => fav.symbolId === symbolId) || false;
  };

  // Fügt ein Symbol zu den Favoriten hinzu oder entfernt es
  const toggleFavorite = async (symbolId: number) => {
    if (!user) {
      toast({
        title: 'Nicht angemeldet',
        description: 'Bitte melden Sie sich an, um Favoriten zu speichern.',
        variant: 'destructive'
      });
      return;
    }

    try {
      if (isSymbolFavorite(symbolId)) {
        // Favorit finden und entfernen
        const favorite = favorites?.find(fav => fav.symbolId === symbolId);
        if (favorite) {
          await fetch(`/api/user/symbol-favorites/${favorite.id}`, {
            method: 'DELETE',
          });
          toast({
            title: 'Favorit entfernt',
            description: 'Das Symbol wurde aus Ihren Favoriten entfernt.',
          });
        }
      } else {
        // Favorit hinzufügen
        await fetch('/api/user/symbol-favorites', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            symbolId,
            notes: userNotes,
          }),
        });
        toast({
          title: 'Favorit hinzugefügt',
          description: 'Das Symbol wurde zu Ihren Favoriten hinzugefügt.',
        });
      }
      // Favoriten neu laden
      refetchFavorites();
    } catch (error) {
      console.error('Error toggling favorite:', error);
      toast({
        title: 'Fehler',
        description: 'Es gab ein Problem beim Aktualisieren der Favoriten.',
        variant: 'destructive'
      });
    }
  };

  // Kategorie-Auswahl ändern
  const handleCategoryChange = (category: string) => {
    setSelectedCategory(category);
    setSearchQuery('');
  };

  // Suchbegriff ändern
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  };

  // Symbol für Detailansicht auswählen
  const handleSelectSymbol = (symbol: DreamSymbol) => {
    setSelectedSymbol(symbol);
    setActiveView('detail');
  };

  // Zurück zur Listenansicht
  const handleBackToList = () => {
    setActiveView('list');
    setSelectedSymbol(null);
  };

  // Favoriten-Filter
  const getFavoritesOnly = () => {
    if (!favorites || favorites.length === 0) return [];
    return symbols?.filter(symbol => isSymbolFavorite(symbol.id)) || [];
  };

  // Kulturspezifische Interpretation eines Symbols finden
  const getInterpretationForCulture = (cultureId: number) => {
    return interpretations?.find(interp => interp.cultureId === cultureId);
  };

  // Verwendete Kategorien extrahieren (für Filter)
  const getUniqueCategories = () => {
    const categories = symbols?.map(symbol => symbol.category) || [];
    return Array.from(new Set(categories));
  };

  // Symbol mit der angegebenen ID finden
  const getSymbolById = (id: number) => {
    return symbols?.find(symbol => symbol.id === id);
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold mb-6">Kulturelle Traumsymbol-Bibliothek</h1>
      
      {activeView === 'list' ? (
        <>
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder="Nach Traumsymbolen suchen..."
                  value={searchQuery}
                  onChange={handleSearchChange}
                  className="pl-8"
                />
              </div>
            </div>
            <Select value={selectedCategory} onValueChange={handleCategoryChange}>
              <SelectTrigger className="w-full md:w-[200px]">
                <SelectValue placeholder="Kategorie" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Alle Kategorien</SelectItem>
                {getUniqueCategories().map((category) => (
                  <SelectItem key={category} value={category}>
                    {category}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Tabs defaultValue="all">
            <TabsList className="mb-4">
              <TabsTrigger value="all">Alle Symbole</TabsTrigger>
              <TabsTrigger value="favorites" disabled={!user}>
                Meine Favoriten
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="all">
              {symbolsLoading ? (
                <div className="flex justify-center p-8">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : symbols && symbols.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {symbols.map((symbol) => (
                    <Card key={symbol.id} className="h-full">
                      <CardHeader className="pb-2">
                        <div className="flex justify-between items-start">
                          <CardTitle className="text-xl">{symbol.name}</CardTitle>
                          {user && (
                            <Button 
                              variant="ghost" 
                              size="icon"
                              onClick={() => toggleFavorite(symbol.id)}
                            >
                              {isSymbolFavorite(symbol.id) ? (
                                <BookmarkCheck className="h-5 w-5 text-primary" />
                              ) : (
                                <Bookmark className="h-5 w-5" />
                              )}
                            </Button>
                          )}
                        </div>
                        <CardDescription>
                          {symbol.category} • Popularität: {symbol.popularity}%
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="pb-2">
                        <p className="line-clamp-3">{symbol.generalMeaning}</p>
                        <div className="flex flex-wrap gap-1 mt-2">
                          {symbol.tags.map((tag) => (
                            <Badge key={tag} variant="outline" className="text-xs">
                              {tag}
                            </Badge>
                          ))}
                        </div>
                      </CardContent>
                      <CardFooter>
                        <Button 
                          variant="outline" 
                          className="w-full" 
                          onClick={() => handleSelectSymbol(symbol)}
                        >
                          Details anzeigen
                        </Button>
                      </CardFooter>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="text-center p-8 bg-muted rounded-lg">
                  <p>Keine Traumsymbole gefunden.</p>
                </div>
              )}
            </TabsContent>
            
            <TabsContent value="favorites">
              {favoritesLoading ? (
                <div className="flex justify-center p-8">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : user ? (
                favorites && favorites.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {getFavoritesOnly().map((symbol) => (
                      <Card key={symbol.id} className="h-full">
                        <CardHeader className="pb-2">
                          <div className="flex justify-between items-start">
                            <CardTitle className="text-xl">{symbol.name}</CardTitle>
                            <Button 
                              variant="ghost" 
                              size="icon"
                              onClick={() => toggleFavorite(symbol.id)}
                            >
                              <BookmarkCheck className="h-5 w-5 text-primary" />
                            </Button>
                          </div>
                          <CardDescription>
                            {symbol.category} • Popularität: {symbol.popularity}%
                          </CardDescription>
                        </CardHeader>
                        <CardContent className="pb-2">
                          <p className="line-clamp-3">{symbol.generalMeaning}</p>
                          <div className="flex flex-wrap gap-1 mt-2">
                            {symbol.tags.map((tag) => (
                              <Badge key={tag} variant="outline" className="text-xs">
                                {tag}
                              </Badge>
                            ))}
                          </div>
                        </CardContent>
                        <CardFooter>
                          <Button 
                            variant="outline" 
                            className="w-full" 
                            onClick={() => handleSelectSymbol(symbol)}
                          >
                            Details anzeigen
                          </Button>
                        </CardFooter>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <div className="text-center p-8 bg-muted rounded-lg">
                    <p>Sie haben noch keine Traumsymbole als Favoriten gespeichert.</p>
                  </div>
                )
              ) : (
                <div className="text-center p-8 bg-muted rounded-lg">
                  <p>Bitte melden Sie sich an, um Favoriten zu speichern.</p>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </>
      ) : selectedSymbol ? (
        <div>
          <Button 
            variant="ghost" 
            className="mb-4 pl-0"
            onClick={handleBackToList}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Zurück zur Übersicht
          </Button>
          
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-1">
              <Card>
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-2xl">{selectedSymbol.name}</CardTitle>
                      <CardDescription>
                        {selectedSymbol.category} • Popularität: {selectedSymbol.popularity}%
                      </CardDescription>
                    </div>
                    {user && (
                      <Button 
                        variant="ghost" 
                        size="icon"
                        onClick={() => toggleFavorite(selectedSymbol.id)}
                      >
                        {isSymbolFavorite(selectedSymbol.id) ? (
                          <BookmarkCheck className="h-5 w-5 text-primary" />
                        ) : (
                          <Bookmark className="h-5 w-5" />
                        )}
                      </Button>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  <h3 className="font-medium mb-2">Allgemeine Bedeutung</h3>
                  <p className="mb-4">{selectedSymbol.generalMeaning}</p>
                  
                  <h3 className="font-medium mb-2">Tags</h3>
                  <div className="flex flex-wrap gap-1 mb-4">
                    {selectedSymbol.tags.map((tag) => (
                      <Badge key={tag} className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                  
                  {user && (
                    <div>
                      <h3 className="font-medium mb-2">Persönliche Notizen</h3>
                      <div className="flex flex-col gap-2">
                        <Input
                          value={userNotes}
                          onChange={(e) => setUserNotes(e.target.value)}
                          placeholder="Eigene Notizen zu diesem Symbol..."
                          className="mb-2"
                        />
                        <Button 
                          onClick={() => toggleFavorite(selectedSymbol.id)}
                          className="w-full"
                        >
                          {isSymbolFavorite(selectedSymbol.id) 
                            ? "Aus Favoriten entfernen" 
                            : "Zu Favoriten hinzufügen"}
                        </Button>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
            
            <div className="lg:col-span-2">
              <Card className="mb-6">
                <CardHeader>
                  <CardTitle>Kulturelle Interpretationen</CardTitle>
                  <CardDescription>
                    Wie dieses Symbol in verschiedenen Kulturen interpretiert wird
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {interpretationsLoading ? (
                    <div className="flex justify-center p-4">
                      <Loader2 className="h-6 w-6 animate-spin text-primary" />
                    </div>
                  ) : interpretations && interpretations.length > 0 ? (
                    <Tabs defaultValue={interpretations[0].cultureId.toString()}>
                      <TabsList className="mb-4">
                        {cultures && cultures.map((culture) => (
                          interpretations.some(i => i.cultureId === culture.id) && (
                            <TabsTrigger 
                              key={culture.id} 
                              value={culture.id.toString()}
                              onClick={() => setSelectedCulture(culture.id)}
                            >
                              {culture.name}
                            </TabsTrigger>
                          )
                        ))}
                      </TabsList>
                      
                      {cultures && cultures.map((culture) => {
                        const interpretation = getInterpretationForCulture(culture.id);
                        return interpretation && (
                          <TabsContent key={culture.id} value={culture.id.toString()}>
                            <div>
                              <h3 className="font-medium mb-2">Interpretation</h3>
                              <p className="mb-4">{interpretation.interpretation}</p>
                              
                              {interpretation.examples && (
                                <>
                                  <h3 className="font-medium mb-2">Beispiele</h3>
                                  <p className="mb-4">{interpretation.examples}</p>
                                </>
                              )}
                              
                              {interpretation.literaryReferences && (
                                <>
                                  <h3 className="font-medium mb-2">Literarische Referenzen</h3>
                                  <p>{interpretation.literaryReferences}</p>
                                </>
                              )}
                              
                              <div className="mt-4 p-3 bg-muted rounded-md flex items-start">
                                <Info className="h-5 w-5 mr-2 flex-shrink-0 mt-0.5" />
                                <div>
                                  <h4 className="font-medium">Über diese Kultur</h4>
                                  <p className="text-sm">{culture.description}</p>
                                  {culture.historicalContext && (
                                    <p className="text-sm mt-2">{culture.historicalContext}</p>
                                  )}
                                </div>
                              </div>
                            </div>
                          </TabsContent>
                        );
                      })}
                    </Tabs>
                  ) : (
                    <div className="text-center p-4 bg-muted rounded-lg">
                      <p>Keine kulturellen Interpretationen verfügbar.</p>
                    </div>
                  )}
                </CardContent>
              </Card>
              
              {comparisons && comparisons.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle>Vergleiche mit anderen Symbolen</CardTitle>
                    <CardDescription>
                      Wie sich dieses Symbol zu anderen verhält
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Accordion type="single" collapsible className="w-full">
                      {comparisons.map((comparison, index) => {
                        const comparedSymbol = getSymbolById(comparison.comparedSymbolId);
                        return comparedSymbol && (
                          <AccordionItem key={index} value={index.toString()}>
                            <AccordionTrigger>
                              Vergleich mit "{comparedSymbol.name}"
                            </AccordionTrigger>
                            <AccordionContent>
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                                <div>
                                  <h4 className="font-medium mb-2">Gemeinsamkeiten</h4>
                                  <p>{comparison.similarities}</p>
                                </div>
                                <div>
                                  <h4 className="font-medium mb-2">Unterschiede</h4>
                                  <p>{comparison.differences}</p>
                                </div>
                              </div>
                              
                              {comparison.culturalContext && (
                                <div className="mt-4">
                                  <h4 className="font-medium mb-2">Kultureller Kontext</h4>
                                  <p>{comparison.culturalContext}</p>
                                </div>
                              )}
                              
                              <Button 
                                variant="outline" 
                                className="mt-4"
                                onClick={() => handleSelectSymbol(comparedSymbol)}
                              >
                                {comparedSymbol.name} anzeigen
                              </Button>
                            </AccordionContent>
                          </AccordionItem>
                        );
                      })}
                    </Accordion>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
};

export default DreamSymbolLibrary;