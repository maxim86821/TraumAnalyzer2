import OpenAI from "openai";
import { AnalysisResponse, DeepPatternResponse } from "@shared/schema";

// the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

/**
 * Generate an image based on dream content, analysis and other factors
 * @param dreamContent The text content of the dream
 * @param analysis The analysis results if available
 * @param tags Array of tags if available
 * @param mood Mood information if available
 * @returns URL to the generated image
 */
export async function generateDreamImage(
  dreamContent: string, 
  analysis?: AnalysisResponse | null,
  tags?: string[] | null,
  mood?: { beforeSleep?: number | null, afterWakeup?: number | null, notes?: string | null } | null
): Promise<string> {
  try {
    // Create a detailed prompt based on the dream content and analysis
    let promptBase = "Eine traumhafte Illustration basierend auf folgendem Traum:\n\n";
    
    // Add a short version of the dream content
    promptBase += dreamContent.substring(0, 300);
    
    // Add analysis information if available
    if (analysis) {
      promptBase += "\n\nHauptthemen: " + analysis.themes.join(", ");
      
      // Add key emotions
      if (analysis.emotions && analysis.emotions.length > 0) {
        const topEmotions = analysis.emotions
          .sort((a, b) => b.intensity - a.intensity)
          .slice(0, 3)
          .map(e => e.name);
        promptBase += "\nEmotionen: " + topEmotions.join(", ");
      }
      
      // Add key symbols
      if (analysis.symbols && analysis.symbols.length > 0) {
        const topSymbols = analysis.symbols.slice(0, 3).map(s => s.symbol);
        promptBase += "\nSymbole: " + topSymbols.join(", ");
      }
    }
    
    // Add tags if available
    if (tags && tags.length > 0) {
      promptBase += "\n\nTags: " + tags.join(", ");
    }
    
    // Add mood information if available to adjust the tone
    if (mood) {
      if (mood.beforeSleep && mood.beforeSleep <= 3) {
        promptBase += "\n\nDer Traum begann mit einer sehr negativen Stimmung.";
      } else if (mood.beforeSleep && mood.beforeSleep >= 8) {
        promptBase += "\n\nDer Traum begann mit einer sehr positiven Stimmung.";
      }
      
      if (mood.afterWakeup && mood.afterWakeup <= 3) {
        promptBase += "\n\nDer Traum hinterließ ein negatives Gefühl.";
      } else if (mood.afterWakeup && mood.afterWakeup >= 8) {
        promptBase += "\n\nDer Traum hinterließ ein positives Gefühl.";
      }
    }
    
    // Add style directions
    promptBase += "\n\nStil: Traumartig, surreal, mit fließenden Übergängen und symbolischer Bedeutung. Eine Mischung aus realistischen und fantastischen Elementen.";
    
    console.log("Generating image with prompt:", promptBase);
    
    // Call the OpenAI DALL-E API to generate the image
    const response = await openai.images.generate({
      model: "dall-e-3",
      prompt: promptBase,
      n: 1,
      size: "1024x1024",
      quality: "standard",
    });
    
    const imageUrl = response.data[0].url;
    if (!imageUrl) {
      throw new Error("No image URL in response");
    }
    
    return imageUrl;
  } catch (error) {
    console.error("Error generating dream image:", error);
    throw new Error("Failed to generate dream image: " + (error as Error).message);
  }
}

/**
 * Analyze dream content using OpenAI
 * @param dreamContent The text content of the dream
 * @returns Analysis response with themes, emotions, symbols, and interpretation
 */
export async function analyzeDream(dreamContent: string, previousDreams?: Array<{ content: string; date: Date; analysis?: string | null }>): Promise<AnalysisResponse> {
  try {
    if (!dreamContent || dreamContent.trim().length < 10) {
      // Fallback für leere oder zu kurze Trauminhalte
      return {
        themes: ["Undefinierter Traum"],
        emotions: [{ name: "Neutral", intensity: 0.5 }],
        symbols: [{ symbol: "Leerer Raum", meaning: "Stille oder Unklarheit im Traum" }],
        interpretation: "Der Trauminhalt ist zu kurz oder unklar für eine vollständige Analyse. Versuche, mehr Details über deinen Traum hinzuzufügen, um eine tiefere Interpretation zu erhalten.",
        keywords: ["undefiniert"]
      };
    }
    
    // Erstelle einen Kontext aus früheren Träumen, falls vorhanden
    let previousDreamsContext = "";
    if (previousDreams && previousDreams.length > 0) {
      previousDreamsContext = `\n\nHier sind die letzten ${previousDreams.length} Träume des Benutzers (vom neuesten zum ältesten):\n`;
      
      previousDreams.forEach((dream, index) => {
        const formattedDate = dream.date.toISOString().split('T')[0];
        previousDreamsContext += `\nTraum vom ${formattedDate}:\n${dream.content.substring(0, 150)}${dream.content.length > 150 ? '...' : ''}`;
        
        // Wenn verfügbar, füge die vorherige Analyse hinzu
        if (dream.analysis) {
          try {
            const parsedAnalysis = JSON.parse(dream.analysis);
            if (parsedAnalysis.themes) {
              previousDreamsContext += `\nHauptthemen: ${parsedAnalysis.themes.join(', ')}`;
            }
          } catch (e) {
            // Ignoriere Parsing-Fehler für frühere Analysen
          }
        }
      });
    }

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: `Du bist ein erfahrener Traumanalyst und Psychologe, der Träume basierend auf Jungianischer Psychologie, Freudschen Theorien und kulturübergreifender Symbolik interpretiert.
          
          Analysiere den folgenden Trauminhalt und gib eine umfassende, einfühlsame Interpretation in deutscher Sprache zurück.
          
          Bei negativen Träumen sei besonders einfühlsam und zeige dem Träumenden auf, wie er aus dem Traum lernen kann.
          Bei wiederkehrenden Themen oder Mustern in den vorherigen Träumen hebe diese hervor.
          
          Deine Antwort sollte genau diesem JSON-Format entsprechen:
          {
            "themes": ["Thema1", "Thema2", ...], // 3-5 Hauptthemen des Traums
            "emotions": [
              {"name": "Emotion1", "intensity": 0.8}, // Intensität als Wert zwischen 0 und 1
              {"name": "Emotion2", "intensity": 0.6},
              ...
            ], // 3-5 zentrale Emotionen im Traum mit ihrer relativen Intensität
            "symbols": [
              {"symbol": "Symbol1", "meaning": "Bedeutung des Symbols im Kontext des Traums"},
              {"symbol": "Symbol2", "meaning": "Bedeutung des Symbols"},
              ...
            ], // 3-5 wichtige Symbole im Traum und ihre mögliche Bedeutung
            "interpretation": "Eine detaillierte Gesamtinterpretation des Traums in 2-3 Sätzen.",
            "keywords": ["Schlüsselwort1", "Schlüsselwort2", "Schlüsselwort3"], // 3 wichtigste Schlüsselwörter im Traum
            "keywordReferences": [
              {
                "word": "Schlüsselwort1",
                "meaning": "Allgemeine Bedeutung dieses Symbols oder Konzepts in Träumen",
                "culturalReferences": [
                  {"culture": "Westlich", "interpretation": "Bedeutung in westlicher Psychologie"},
                  {"culture": "Östlich", "interpretation": "Bedeutung in östlicher Tradition"},
                  {"culture": "Archetypisch", "interpretation": "Jungianische archetypische Bedeutung"}
                ]
              },
              ...
            ], // Detaillierte Information zu den Schlüsselwörtern (bis zu 3)
            "quote": {
              "text": "Ein passendes Zitat zum Trauminhalt oder seiner Bedeutung",
              "source": "Autor oder Quelle des Zitats"
            },
            "motivationalInsight": "Ein kurzer motivierender oder informativer Gedanke zum Thema Träume, der zum Trauminhalt passt"
          }
          
          Falls frühere Träume vorhanden sind und es genügend Muster gibt, füge dieses zusätzliche Feld hinzu:
          "weeklyInsight": {
            "summary": "Eine Zusammenfassung der Muster und Themen in den jüngsten Träumen",
            "patterns": ["Muster1", "Muster2", ...], // Erkannte wiederkehrende Muster
            "recommendations": ["Empfehlung1", "Empfehlung2", ...] // Praktische Empfehlungen basierend auf den Traummustern
          }`
        },
        {
          role: "user",
          content: dreamContent + previousDreamsContext
        }
      ],
      response_format: { type: "json_object" }
    });

    // Parse and validate the response
    console.log("OpenAI response received, parsing...");
    const content = response.choices[0].message.content || "{}";
    
    try {
      const result = JSON.parse(content);
      
      // Perform basic validation of the response structure with fallbacks
      const validatedResult: AnalysisResponse = {
        themes: Array.isArray(result.themes) ? result.themes : ["Unklares Thema"],
        emotions: Array.isArray(result.emotions) ? result.emotions : [{ name: "Neutral", intensity: 0.5 }],
        symbols: Array.isArray(result.symbols) ? result.symbols : [{ symbol: "Unklar", meaning: "Konnte nicht erkannt werden" }],
        interpretation: result.interpretation || "Keine Interpretation verfügbar.",
        keywords: Array.isArray(result.keywords) ? result.keywords : ["unbekannt"],
        keywordReferences: result.keywordReferences,
        quote: result.quote,
        motivationalInsight: result.motivationalInsight,
        weeklyInsight: result.weeklyInsight
      };
      
      console.log("Validation complete, returning analysis");
      return validatedResult;
    } catch (parseError) {
      console.error("Error parsing OpenAI response:", parseError);
      console.log("OpenAI raw response content:", content.substring(0, 200) + "...");
      
      // Fallback für JSON-Parsing-Fehler
      return {
        themes: ["Analyse-Fehler"],
        emotions: [{ name: "Neutral", intensity: 0.5 }],
        symbols: [{ symbol: "Technischer Fehler", meaning: "Die AI-Analyse konnte nicht verarbeitet werden" }],
        interpretation: "Es gab einen technischen Fehler bei der Analyse deines Traums. Bitte versuche es später noch einmal.",
        keywords: ["fehler"]
      };
    }
  } catch (error) {
    console.error("Error analyzing dream:", error);
    throw new Error("Failed to analyze dream: " + (error as Error).message);
  }
}

/**
 * Analyze an image using OpenAI vision
 * @param base64Image The base64-encoded image
 * @returns Text analysis of the image
 */
export async function analyzeImage(base64Image: string): Promise<string> {
  try {
    const visionResponse = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: "Du bist ein Traumsymbolik-Experte, der traumartige Bilder analysiert. Gib tiefere psychologische Einsichten zu den Symbolen und möglichen Bedeutungen im Traum. Beachte kulturelle und archetypische Symbolik."
        },
        {
          role: "user",
          content: [
            {
              type: "text",
              text: "Beschreibe dieses Bild im Kontext eines Traums. Was könnte es symbolisieren? Erwähne mögliche emotionale Bedeutungen und wie diese Symbole in Träumen interpretiert werden können. Antworte auf Deutsch mit etwa 150-200 Wörtern."
            },
            {
              type: "image_url",
              image_url: {
                url: `data:image/jpeg;base64,${base64Image}`
              }
            }
          ],
        },
      ],
      max_tokens: 800,
    });

    return visionResponse.choices[0].message.content || "Keine Analyse verfügbar";
  } catch (error) {
    console.error("Error analyzing image:", error);
    throw new Error("Failed to analyze image: " + (error as Error).message);
  }
}

/**
 * Führt eine tiefe Musteranalyse über mehrere Träume hinweg durch
 * @param dreams Array von Traum-Objekten mit Inhalt, Datum und vorhandenen Analysen
 * @param timeRange Zeitraum der Analyse (z.B. "30 Tage", "3 Monate")
 * @param userId ID des Benutzers, dessen Träume analysiert werden
 * @returns Detaillierte Musteranalyse
 */
export async function analyzePatterns(
  dreams: Array<{
    id: number;
    content: string;
    title: string;
    date: Date;
    analysis?: string | null;
    tags?: string[];
    moodBeforeSleep?: number;
    moodAfterWakeup?: number;
    moodNotes?: string;
  }>,
  timeRange: string = "30 Tage",
  userId: number
): Promise<DeepPatternResponse> {
  try {
    if (!dreams || dreams.length < 3) {
      throw new Error("Mindestens 3 Träume werden für eine Musteranalyse benötigt");
    }

    // Träume nach Datum sortieren (neueste zuerst)
    const sortedDreams = [...dreams].sort((a, b) => 
      new Date(b.date).getTime() - new Date(a.date).getTime()
    );

    // Vorbereiten der Trauminformationen für die Analyse
    const dreamSummaries = sortedDreams.map(dream => {
      let analysis = null;
      if (dream.analysis) {
        try {
          analysis = JSON.parse(dream.analysis);
        } catch (e) {
          // Ignoriere fehlerhafte JSON-Analysen
        }
      }

      return {
        title: dream.title,
        date: dream.date.toISOString().split('T')[0],
        content: dream.content.substring(0, 300) + (dream.content.length > 300 ? '...' : ''),
        themes: analysis?.themes || [],
        emotions: analysis?.emotions || [],
        symbols: analysis?.symbols || [],
        tags: dream.tags || [],
        moodBeforeSleep: dream.moodBeforeSleep,
        moodAfterWakeup: dream.moodAfterWakeup,
        moodNotes: dream.moodNotes
      };
    });
    
    // Zeitraumsdefinition
    const oldestDreamDate = new Date(sortedDreams[sortedDreams.length - 1].date).toISOString().split('T')[0];
    const newestDreamDate = new Date(sortedDreams[0].date).toISOString().split('T')[0];

    // GPT-4-Anfrage für die Musteranalyse
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: `Du bist ein fortgeschrittener Traumanalyst und Psychologe mit Expertise in der Erkennung von Mustern in Träumen über Zeit.
          
          Analysiere die folgenden Traumaufzeichnungen eines Benutzers über ${timeRange} (von ${oldestDreamDate} bis ${newestDreamDate}) und identifiziere tiefere Muster, Themen, Symbole und emotionale Trends.
          
          Deine Analyse sollte detailliert, tiefgründig und hilfreich sein und zur persönlichen Reflexion und zum Wachstum anregen.
          
          Deine Antwort muss exakt im folgenden JSON-Format zurückgegeben werden:
          
          {
            "overview": {
              "summary": "Umfassende Zusammenfassung der Traumanalyse",
              "timespan": "${timeRange}",
              "dreamCount": ${dreams.length},
              "dominantMood": "Vorherrschende Stimmung basierend auf Stimmungswerten und Trauminhalt"
            },
            "recurringSymbols": [
              {
                "symbol": "Symbolname",
                "frequency": 60, // Prozentsatz (wie oft das Symbol auftaucht)
                "description": "Beschreibung des wiederkehrenden Symbols",
                "possibleMeaning": "Mögliche psychologische Bedeutung im Kontext der Träume des Benutzers",
                "contexts": ["Kontext 1", "Kontext 2"] // In welchen Zusammenhängen das Symbol erschien
              },
              // Weitere Symbole...
            ],
            "dominantThemes": [
              {
                "theme": "Themenname",
                "frequency": 70, // Prozentsatz 
                "description": "Beschreibung des Themas",
                "relatedSymbols": ["Symbol 1", "Symbol 2"],
                "emotionalTone": "Emotional positive/negativ/gemischt"
              },
              // Weitere Themen...
            ],
            "emotionalPatterns": [
              {
                "emotion": "Emotionsname",
                "averageIntensity": 0.7, // Durchschnittliche Intensität (0-1)
                "frequency": 50, // Prozentsatz
                "trend": "rising", // "rising", "falling" oder "stable"
                "associatedThemes": ["Thema 1", "Thema 2"]
              },
              // Weitere Emotionen...
            ],
            "lifeAreaInsights": [
              {
                "area": "Beziehungen", // z.B. Beziehungen, Arbeit, etc.
                "relatedSymbols": ["Symbol 1", "Symbol 2"],
                "challenges": ["Herausforderung 1", "Herausforderung 2"],
                "strengths": ["Stärke 1", "Stärke 2"],
                "suggestions": ["Vorschlag 1", "Vorschlag 2"]
              },
              // Weitere Lebensbereiche...
            ],
            "personalGrowth": {
              "potentialAreas": ["Bereich 1", "Bereich 2"],
              "suggestions": ["Vorschlag 1", "Vorschlag 2"]
            },
            "wordFrequency": [
              {"word": "Wort1", "count": 15},
              {"word": "Wort2", "count": 12},
              // Weitere Wörter...
            ],
            "timeline": {
              "periods": [
                {
                  "timeframe": "Erster Zeitabschnitt",
                  "dominantThemes": ["Thema 1", "Thema 2"],
                  "dominantEmotions": ["Emotion 1", "Emotion 2"],
                  "summary": "Zusammenfassung des Zeitabschnitts"
                },
                // Weitere Zeitabschnitte...
              ]
            },
            "recommendations": {
              "general": ["Allgemeine Empfehlung 1", "Allgemeine Empfehlung 2"],
              "actionable": ["Konkrete Handlung 1", "Konkrete Handlung 2"]
            }
          }`
        },
        {
          role: "user",
          content: JSON.stringify(dreamSummaries)
        }
      ],
      response_format: { type: "json_object" },
      max_tokens: 4096
    });

    // Parse and validate the response
    const content = response.choices[0].message.content || "{}";
    const result = JSON.parse(content);
    
    // Basic validation
    if (!result.overview || !result.recurringSymbols || !result.dominantThemes || 
        !result.emotionalPatterns || !result.recommendations) {
      throw new Error("Ungültiges Antwortformat von OpenAI");
    }
    
    return result as DeepPatternResponse;
  } catch (error) {
    console.error("Error analyzing dream patterns:", error);
    throw new Error("Fehler bei der Musteranalyse: " + (error as Error).message);
  }
}
