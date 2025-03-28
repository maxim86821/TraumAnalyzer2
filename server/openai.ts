import OpenAI from "openai";
import { AnalysisResponse } from "@shared/schema";

// the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

/**
 * Analyze dream content using OpenAI
 * @param dreamContent The text content of the dream
 * @returns Analysis response with themes, emotions, symbols, and interpretation
 */
export async function analyzeDream(dreamContent: string): Promise<AnalysisResponse> {
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: `Du bist ein Traumanalyst, der Träume basierend auf psychologischen Prinzipien und Symbolik interpretiert.
          Analysiere den folgenden Trauminhalt und gib eine strukturierte Interpretation in deutscher Sprache zurück.
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
            "interpretation": "Eine detaillierte Gesamtinterpretation des Traums in 2-3 Sätzen."
          }`
        },
        {
          role: "user",
          content: dreamContent
        }
      ],
      response_format: { type: "json_object" }
    });

    // Parse and validate the response
    const result = JSON.parse(response.choices[0].message.content);
    
    // Perform some basic validation of the response structure
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
          role: "user",
          content: [
            {
              type: "text",
              text: "Beschreibe dieses Bild im Kontext eines Traums. Was könnte es symbolisieren? Antworte auf Deutsch."
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
      max_tokens: 500,
    });

    return visionResponse.choices[0].message.content || "Keine Analyse verfügbar";
  } catch (error) {
    console.error("Error analyzing image:", error);
    throw new Error("Failed to analyze image: " + (error as Error).message);
  }
}
