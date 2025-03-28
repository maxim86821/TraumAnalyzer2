import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { BarChart, LineChart, PieChart } from "lucide-react";
import { Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { 
  DeepPatternResponse,
  PatternSymbol,
  PatternTheme,
  PatternEmotion,
  LifeAreaInsight
} from "@shared/schema";

// Farben für die Grafiken und Elemente
const colors = {
  primary: "bg-dream-primary text-white",
  secondary: "bg-dream-accent text-white",
  info: "bg-blue-500 text-white",
  success: "bg-green-500 text-white",
  warning: "bg-amber-500 text-white",
  danger: "bg-red-500 text-white",
  neutral: "bg-gray-500 text-white",
  light: "bg-gray-100 text-gray-800",
  dark: "bg-gray-800 text-white",
};

export default function DreamPatternAnalysis() {
  const [isLoading, setIsLoading] = useState(false);
  const [timeRange, setTimeRange] = useState("30 Tage");
  const [analysis, setAnalysis] = useState<DeepPatternResponse | null>(null);
  const { toast } = useToast();

  // Musteranalyse anfordern
  const fetchPatternAnalysis = async () => {
    setIsLoading(true);
    try {
      const response = await apiRequest('GET', `/api/dreams/patterns/analyze?timeRange=${encodeURIComponent(timeRange)}`);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.details || errorData.message || "Fehler bei der Anfrage");
      }
      
      const data = await response.json();
      setAnalysis(data);
    } catch (error) {
      toast({
        title: "Fehler bei der Musteranalyse",
        description: (error as Error).message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Zeitbereich ändern
  const handleTimeRangeChange = (value: string) => {
    setTimeRange(value);
  };

  // Farbwahl für Symbolfrequenz
  const getFrequencyColor = (frequency: number) => {
    if (frequency >= 75) return "bg-red-500";
    if (frequency >= 50) return "bg-amber-500";
    if (frequency >= 25) return "bg-blue-500";
    return "bg-green-500";
  };

  // Farbwahl für emotionalen Ton
  const getEmotionalToneColor = (tone: string) => {
    if (tone.includes("positiv")) return "bg-green-500";
    if (tone.includes("negativ")) return "bg-red-500";
    if (tone.includes("gemischt")) return "bg-amber-500";
    return "bg-blue-500";
  };

  // Farbwahl für Trend
  const getTrendColor = (trend: string) => {
    if (trend === "rising") return "text-green-500";
    if (trend === "falling") return "text-red-500";
    return "text-blue-500";
  };

  // Trend-Icon
  const getTrendIcon = (trend: string) => {
    if (trend === "rising") return "↗";
    if (trend === "falling") return "↘";
    return "→";
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px]">
        <Loader2 className="h-12 w-12 animate-spin text-dream-primary mb-4" />
        <p className="text-lg text-gray-600">Analysiere Traummuster...</p>
        <p className="text-sm text-gray-500 mt-2">Dieser Vorgang kann einige Momente dauern, da komplexe AI-Analysen durchgeführt werden.</p>
      </div>
    );
  }

  if (!analysis) {
    return (
      <div className="space-y-8">
        <div className="bg-white rounded-xl shadow-md p-6">
          <h2 className="text-2xl font-bold text-dream-dark mb-4">Traummuster-Analyse</h2>
          <p className="text-gray-600 mb-6">
            Entdecke tiefere Muster in deinen Traumaufzeichnungen mit dieser erweiterten KI-Analyse. 
            Die Analyse identifiziert wiederkehrende Symbole, emotionale Muster und thematische Verbindungen 
            über einen bestimmten Zeitraum.
          </p>
          
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="flex-1">
              <h3 className="text-lg font-medium text-gray-800 mb-2">Zeitraum wählen</h3>
              <div className="flex flex-wrap gap-2">
                {["7 Tage", "30 Tage", "3 Monate", "6 Monate", "Alle Zeit"].map((range) => (
                  <Badge
                    key={range}
                    variant={timeRange === range ? "default" : "outline"}
                    className={`px-4 py-2 cursor-pointer ${timeRange === range ? "bg-dream-primary" : ""}`}
                    onClick={() => handleTimeRangeChange(range)}
                  >
                    {range}
                  </Badge>
                ))}
              </div>
            </div>
          </div>
          
          <Button 
            onClick={fetchPatternAnalysis} 
            className="bg-dream-primary hover:bg-dream-dark text-white"
          >
            Musteranalyse starten
          </Button>
        </div>
      </div>
    );
  }

  // Rendere die Analyseergebnisse
  return (
    <div className="space-y-8 pb-12">
      {/* Übersicht-Banner */}
      <div className="bg-gradient-to-r from-dream-primary to-dream-accent text-white rounded-xl shadow-lg p-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h2 className="text-2xl font-bold mb-2">Traummuster-Analyse</h2>
            <p className="text-white/80">
              Zeitraum: {analysis.overview.timespan} • {analysis.overview.dreamCount} Träume analysiert
            </p>
          </div>
          <Button 
            variant="outline" 
            className="border-white text-white hover:bg-white/20 hover:text-white"
            onClick={() => setAnalysis(null)}
          >
            Neue Analyse
          </Button>
        </div>
      </div>

      {/* Hauptinhalt */}
      <Tabs defaultValue="uebersicht" className="w-full">
        <TabsList className="grid grid-cols-5 mb-6">
          <TabsTrigger value="uebersicht">Übersicht</TabsTrigger>
          <TabsTrigger value="symbole">Symbole</TabsTrigger>
          <TabsTrigger value="themen">Themen</TabsTrigger>
          <TabsTrigger value="emotionen">Emotionen</TabsTrigger>
          <TabsTrigger value="einsichten">Einsichten</TabsTrigger>
        </TabsList>

        {/* Übersichts-Tab */}
        <TabsContent value="uebersicht" className="space-y-6">
          <Card className="p-6">
            <h3 className="text-xl font-bold text-dream-dark mb-4">Überblick</h3>
            <p className="text-gray-700 whitespace-pre-line mb-6">
              {analysis.overview.summary}
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="text-sm font-medium text-gray-700 mb-2">Vorherrschende Stimmung</h4>
                <p className="text-lg font-semibold text-dream-primary">{analysis.overview.dominantMood}</p>
              </div>
              
              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="text-sm font-medium text-gray-700 mb-2">Zeitraum</h4>
                <p className="text-lg font-semibold text-dream-primary">{analysis.overview.timespan}</p>
              </div>
            </div>
          </Card>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Symbole */}
            <Card className="p-6">
              <div className="flex items-center mb-4">
                <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center mr-3">
                  <BarChart className="h-6 w-6 text-blue-600" />
                </div>
                <h3 className="text-lg font-bold text-gray-800">Top Symbole</h3>
              </div>
              
              <ul className="space-y-3">
                {analysis.recurringSymbols.slice(0, 3).map((symbol, index) => (
                  <li key={index} className="flex items-center justify-between">
                    <span className="text-gray-700 font-medium">{symbol.symbol}</span>
                    <div className="flex items-center">
                      <span className="text-sm text-gray-500 mr-2">{symbol.frequency}%</span>
                      <div className={`w-2 h-2 rounded-full ${getFrequencyColor(symbol.frequency)}`}></div>
                    </div>
                  </li>
                ))}
              </ul>
            </Card>
            
            {/* Themen */}
            <Card className="p-6">
              <div className="flex items-center mb-4">
                <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center mr-3">
                  <PieChart className="h-6 w-6 text-purple-600" />
                </div>
                <h3 className="text-lg font-bold text-gray-800">Top Themen</h3>
              </div>
              
              <ul className="space-y-3">
                {analysis.dominantThemes.slice(0, 3).map((theme, index) => (
                  <li key={index} className="flex items-center justify-between">
                    <span className="text-gray-700 font-medium">{theme.theme}</span>
                    <div className="flex items-center">
                      <span className="text-sm text-gray-500 mr-2">{theme.frequency}%</span>
                      <div className={`w-2 h-2 rounded-full ${getEmotionalToneColor(theme.emotionalTone)}`}></div>
                    </div>
                  </li>
                ))}
              </ul>
            </Card>
            
            {/* Emotionen */}
            <Card className="p-6">
              <div className="flex items-center mb-4">
                <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center mr-3">
                  <LineChart className="h-6 w-6 text-amber-600" />
                </div>
                <h3 className="text-lg font-bold text-gray-800">Top Emotionen</h3>
              </div>
              
              <ul className="space-y-3">
                {analysis.emotionalPatterns.slice(0, 3).map((emotion, index) => (
                  <li key={index} className="flex items-center justify-between">
                    <span className="text-gray-700 font-medium">{emotion.emotion}</span>
                    <div className="flex items-center">
                      <span className={`text-sm ${getTrendColor(emotion.trend)} mr-1`}>
                        {getTrendIcon(emotion.trend)}
                      </span>
                      <span className="text-sm text-gray-500">
                        {Math.round(emotion.averageIntensity * 100)}%
                      </span>
                    </div>
                  </li>
                ))}
              </ul>
            </Card>
          </div>
          
          {/* Wortfrequenz */}
          <Card className="p-6">
            <h3 className="text-xl font-bold text-dream-dark mb-4">Häufige Wörter</h3>
            <div className="flex flex-wrap gap-2">
              {analysis.wordFrequency.map((word, index) => (
                <Badge 
                  key={index} 
                  variant="secondary" 
                  className="px-4 py-2 text-lg font-semibold"
                  style={{ 
                    fontSize: `${Math.min(1.5 + (word.count / 10), 2.5)}rem`,
                    opacity: 0.6 + (word.count / 30)
                  }}
                >
                  {word.word}
                </Badge>
              ))}
            </div>
          </Card>
          
          {/* Empfehlungen */}
          <Card className="p-6">
            <h3 className="text-xl font-bold text-dream-dark mb-4">Empfehlungen</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="text-lg font-semibold text-gray-700 mb-3">
                  Allgemeine Einsichten
                </h4>
                <ul className="space-y-2">
                  {analysis.recommendations.general.map((recommendation, index) => (
                    <li key={index} className="flex items-start">
                      <span className="text-dream-primary mr-2">•</span>
                      <span className="text-gray-700">{recommendation}</span>
                    </li>
                  ))}
                </ul>
              </div>
              
              <div>
                <h4 className="text-lg font-semibold text-gray-700 mb-3">
                  Handlungsvorschläge
                </h4>
                <ul className="space-y-2">
                  {analysis.recommendations.actionable.map((action, index) => (
                    <li key={index} className="flex items-start">
                      <span className="text-dream-accent mr-2">→</span>
                      <span className="text-gray-700">{action}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </Card>
        </TabsContent>

        {/* Symbole-Tab */}
        <TabsContent value="symbole" className="space-y-6">
          <Card className="p-6">
            <h3 className="text-xl font-bold text-dream-dark mb-6">Wiederkehrende Symbole</h3>
            
            <div className="space-y-8">
              {analysis.recurringSymbols.map((symbol, index) => (
                <div key={index} className="border-b border-gray-200 pb-6 last:border-none last:pb-0">
                  <div className="flex flex-col md:flex-row md:items-center justify-between mb-4">
                    <h4 className="text-lg font-semibold text-dream-primary">
                      {symbol.symbol}
                    </h4>
                    <Badge className={`${getFrequencyColor(symbol.frequency)} px-3 py-1 self-start md:self-auto mt-1 md:mt-0`}>
                      Häufigkeit: {symbol.frequency}%
                    </Badge>
                  </div>
                  
                  <p className="text-gray-700 mb-3">{symbol.description}</p>
                  
                  <div className="bg-gray-50 p-4 rounded-lg mb-4">
                    <h5 className="font-medium text-gray-700 mb-2">Mögliche Bedeutung</h5>
                    <p className="text-gray-600">{symbol.possibleMeaning}</p>
                  </div>
                  
                  <div>
                    <h5 className="font-medium text-gray-700 mb-2">Erscheint in Kontexten:</h5>
                    <div className="flex flex-wrap gap-2">
                      {symbol.contexts.map((context, cIdx) => (
                        <Badge key={cIdx} variant="outline" className="bg-gray-50">
                          {context}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </TabsContent>

        {/* Themen-Tab */}
        <TabsContent value="themen" className="space-y-6">
          <Card className="p-6">
            <h3 className="text-xl font-bold text-dream-dark mb-6">Dominante Themen</h3>
            
            <div className="space-y-8">
              {analysis.dominantThemes.map((theme, index) => (
                <div key={index} className="border-b border-gray-200 pb-6 last:border-none last:pb-0">
                  <div className="flex flex-col md:flex-row md:items-center justify-between mb-4">
                    <h4 className="text-lg font-semibold text-dream-primary">
                      {theme.theme}
                    </h4>
                    <div className="flex items-center gap-2 self-start md:self-auto mt-1 md:mt-0">
                      <Badge variant="outline" className={`${getEmotionalToneColor(theme.emotionalTone)} border-0 text-white`}>
                        {theme.emotionalTone}
                      </Badge>
                      <Badge variant="secondary">
                        Häufigkeit: {theme.frequency}%
                      </Badge>
                    </div>
                  </div>
                  
                  <p className="text-gray-700 mb-3">{theme.description}</p>
                  
                  <div>
                    <h5 className="font-medium text-gray-700 mb-2">Verbundene Symbole:</h5>
                    <div className="flex flex-wrap gap-2">
                      {theme.relatedSymbols.map((symbol, sIdx) => (
                        <Badge key={sIdx} variant="outline" className="bg-gray-50">
                          {symbol}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </TabsContent>

        {/* Emotionen-Tab */}
        <TabsContent value="emotionen" className="space-y-6">
          <Card className="p-6">
            <h3 className="text-xl font-bold text-dream-dark mb-6">Emotionale Muster</h3>
            
            <div className="space-y-8">
              {analysis.emotionalPatterns.map((emotion, index) => (
                <div key={index} className="border-b border-gray-200 pb-6 last:border-none last:pb-0">
                  <div className="flex flex-col md:flex-row md:items-center justify-between mb-4">
                    <h4 className="text-lg font-semibold text-dream-primary">
                      {emotion.emotion}
                    </h4>
                    <div className="flex items-center gap-2 self-start md:self-auto mt-1 md:mt-0">
                      <Badge className={`${getTrendColor(emotion.trend)} bg-opacity-10 border-0`}>
                        {emotion.trend === "rising" ? "Steigend" : emotion.trend === "falling" ? "Fallend" : "Stabil"}
                        {" "}
                        {getTrendIcon(emotion.trend)}
                      </Badge>
                      <Badge variant="secondary">
                        Häufigkeit: {emotion.frequency}%
                      </Badge>
                    </div>
                  </div>
                  
                  <div className="mb-4">
                    <h5 className="font-medium text-gray-700 mb-2">Durchschnittliche Intensität:</h5>
                    <div className="w-full bg-gray-200 rounded-full h-2.5">
                      <div 
                        className="bg-dream-accent h-2.5 rounded-full" 
                        style={{ width: `${emotion.averageIntensity * 100}%` }}
                      ></div>
                    </div>
                    <div className="flex justify-between mt-1">
                      <span className="text-xs text-gray-500">Niedrig</span>
                      <span className="text-xs text-gray-500">
                        {Math.round(emotion.averageIntensity * 100)}%
                      </span>
                      <span className="text-xs text-gray-500">Hoch</span>
                    </div>
                  </div>
                  
                  <div>
                    <h5 className="font-medium text-gray-700 mb-2">Verbunden mit Themen:</h5>
                    <div className="flex flex-wrap gap-2">
                      {emotion.associatedThemes.map((theme, tIdx) => (
                        <Badge key={tIdx} variant="outline" className="bg-gray-50">
                          {theme}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </TabsContent>

        {/* Einsichten-Tab */}
        <TabsContent value="einsichten" className="space-y-6">
          <Card className="p-6">
            <h3 className="text-xl font-bold text-dream-dark mb-6">Lebensbereiche</h3>
            
            <div className="space-y-8">
              {analysis.lifeAreaInsights.map((insight, index) => (
                <div key={index} className="border-b border-gray-200 pb-6 last:border-none last:pb-0">
                  <h4 className="text-lg font-semibold text-dream-primary mb-4">
                    {insight.area}
                  </h4>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-4">
                    <div>
                      <h5 className="font-medium text-gray-700 mb-2">Stärken:</h5>
                      <ul className="space-y-1">
                        {insight.strengths.map((strength, sIdx) => (
                          <li key={sIdx} className="flex items-start">
                            <span className="text-green-500 mr-2">✓</span>
                            <span className="text-gray-700">{strength}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                    
                    <div>
                      <h5 className="font-medium text-gray-700 mb-2">Herausforderungen:</h5>
                      <ul className="space-y-1">
                        {insight.challenges.map((challenge, cIdx) => (
                          <li key={cIdx} className="flex items-start">
                            <span className="text-amber-500 mr-2">!</span>
                            <span className="text-gray-700">{challenge}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                  
                  <div className="mb-4">
                    <h5 className="font-medium text-gray-700 mb-2">Zugehörige Symbole:</h5>
                    <div className="flex flex-wrap gap-2">
                      {insight.relatedSymbols.map((symbol, rIdx) => (
                        <Badge key={rIdx} variant="outline" className="bg-gray-50">
                          {symbol}
                        </Badge>
                      ))}
                    </div>
                  </div>
                  
                  <div>
                    <h5 className="font-medium text-gray-700 mb-2">Vorschläge:</h5>
                    <ul className="space-y-1">
                      {insight.suggestions.map((suggestion, sgIdx) => (
                        <li key={sgIdx} className="flex items-start">
                          <span className="text-dream-primary mr-2">→</span>
                          <span className="text-gray-700">{suggestion}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              ))}
            </div>
          </Card>
          
          <Card className="p-6">
            <h3 className="text-xl font-bold text-dream-dark mb-4">Persönliches Wachstum</h3>
            
            <div className="mb-6">
              <h4 className="text-lg font-semibold text-gray-700 mb-3">
                Potentielle Wachstumsbereiche
              </h4>
              <div className="flex flex-wrap gap-2">
                {analysis.personalGrowth.potentialAreas.map((area, index) => (
                  <Badge 
                    key={index} 
                    className="px-4 py-2 bg-dream-primary/10 text-dream-primary"
                  >
                    {area}
                  </Badge>
                ))}
              </div>
            </div>
            
            <div>
              <h4 className="text-lg font-semibold text-gray-700 mb-3">
                Vorschläge für persönliches Wachstum
              </h4>
              <ul className="space-y-2">
                {analysis.personalGrowth.suggestions.map((suggestion, index) => (
                  <li key={index} className="flex items-start">
                    <span className="text-dream-accent mr-2">•</span>
                    <span className="text-gray-700">{suggestion}</span>
                  </li>
                ))}
              </ul>
            </div>
          </Card>
          
          <Card className="p-6">
            <h3 className="text-xl font-bold text-dream-dark mb-4">Zeitliche Entwicklung</h3>
            
            <div className="space-y-6">
              {analysis.timeline.periods.map((period, index) => (
                <div key={index} className="border-l-4 border-dream-primary pl-4 py-2">
                  <h4 className="text-lg font-semibold text-gray-800 mb-2">
                    {period.timeframe}
                  </h4>
                  
                  <p className="text-gray-700 mb-3">{period.summary}</p>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <h5 className="text-sm font-medium text-gray-600 mb-1">Dominante Themen:</h5>
                      <div className="flex flex-wrap gap-1">
                        {period.dominantThemes.map((theme, tIdx) => (
                          <Badge key={tIdx} variant="outline" className="bg-gray-50 text-xs">
                            {theme}
                          </Badge>
                        ))}
                      </div>
                    </div>
                    
                    <div>
                      <h5 className="text-sm font-medium text-gray-600 mb-1">Dominante Emotionen:</h5>
                      <div className="flex flex-wrap gap-1">
                        {period.dominantEmotions.map((emotion, eIdx) => (
                          <Badge key={eIdx} variant="outline" className="bg-gray-50 text-xs">
                            {emotion}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}