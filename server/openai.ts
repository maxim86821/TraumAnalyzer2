import OpenAI from "openai";
import { AnalysisResponse } from "@shared/schema";

// the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

/**
 * Analyze dream content using OpenAI
 * @param dreamContent The text content of the dream
 * @returns Analysis response with themes, emotions, symbols, and interpretation
 */
export async function analyzeDream(dreamContent: string, previousDreams?: Array<{ content: string; date: Date; analysis?: string | null }>): Promise<AnalysisResponse> {
  try {
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
    const content = response.choices[0].message.content || "{}";
    const result = JSON.parse(content);
    
    // Perform basic validation of the response structure
    if (!result.themes || !Array.isArray(result.themes) ||
        !result.emotions || !Array.isArray(result.emotions) ||
        !result.symbols || !Array.isArray(result.symbols) ||
        !result.interpretation) {
      throw new Error("Invalid response format from OpenAI");
    }
    
    return result as AnalysisResponse;
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
