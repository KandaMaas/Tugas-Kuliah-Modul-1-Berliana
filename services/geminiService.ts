import { GoogleGenAI, GenerateContentResponse, Type } from '@google/genai';
import { TravelPreferences, GeneratedItinerary, ItineraryResult } from '../types';

/**
 * Generates a travel itinerary using the Gemini API with Google Search and Google Maps grounding.
 * @param preferences User's travel preferences.
 * @returns A promise that resolves to an ItineraryResult containing the structured itinerary data and source URLs.
 * @throws Error if the API call fails, no API key is provided, or JSON parsing fails.
 */
export const generateItinerary = async (
  preferences: TravelPreferences,
): Promise<ItineraryResult> => {
  if (!process.env.API_KEY) {
    throw new Error('API_KEY is not set. Please provide your Gemini API key.');
  }

  // Create a new GoogleGenAI instance for each request to ensure it uses the most up-to-date API key.
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const { destination, durationDays, interests, latitude, longitude } = preferences;

  // Calculate a hypothetical start date to help the model generate dates for each day
  const today = new Date();
  const startDate = today.toISOString().split('T')[0]; // YYYY-MM-DD

  let prompt = `You are a professional, helpful, and creative Travel Planner AI. Your goal is to create detailed, day-by-day travel itineraries based on the user's input. Always use real-time, current information when suggesting activities, attractions, and estimated costs.

Plan a detailed, day-by-day travel itinerary in ${destination} for ${durationDays} days, starting from ${startDate}. My interests are ${interests}. For each activity, include:
    1. Nama Tempat/Aktivitas (Name of Place/Activity)
    2. Jam Buka/Tutup (Opening/Closing Hours)
    3. Estimasi Biaya (Estimated Cost in local currency, e.g., "IDR 50,000" for Indonesia)
    4. Link Cek Harga (Placeholder text for a price check link, always "Check Price").

Your entire response MUST be a JSON object, formatted as a string within markdown code fences (e.g., \`\`\`json { "itinerary": [...] } \`\`\`). The JSON structure should strictly adhere to the following format, where 'summary' is optional:

\`\`\`json
{
  "itinerary": [
    {
      "day": 1,
      "date": "YYYY-MM-DD",
      "activities": [
        {
          "name": "Nama Tempat/Aktivitas",
          "description": "Deskripsi singkat (opsional)",
          "openingHours": "Jam Buka/Tutup",
          "estimatedCost": "Estimasi Biaya",
          "priceCheckLinkPlaceholder": "Check Price"
        }
      ]
    }
  ],
  "summary": "Ringkasan perjalanan secara keseluruhan (opsional)"
}
\`\`\`
Ensure all text content, including descriptions and names, is in Bahasa Indonesia.`;

  const tools: Array<any> = [{ googleSearch: {} }];
  let toolConfig = {};

  if (latitude && longitude) {
    tools.push({ googleMaps: {} });
    toolConfig = {
      retrievalConfig: {
        latLng: {
          latitude: latitude,
          longitude: longitude,
        },
      },
    };
    prompt += ` Consider my current location (${latitude}, ${longitude}) for relevant nearby suggestions.`;
  }

  try {
    const response: GenerateContentResponse = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        // Removed responseMimeType and responseSchema due to API limitations when using tools.
        // The prompt now guides the model to output JSON as text.
        tools: tools,
        toolConfig: toolConfig,
        temperature: 0.7,
        topP: 0.95,
        topK: 64,
      },
    });

    const rawResponseText = response.text?.trim();
    if (!rawResponseText) {
      throw new Error("No response received from the model.");
    }

    // Attempt to extract JSON string from markdown code block
    const jsonMatch = rawResponseText.match(/```json\s*([\s\S]*?)\s*```/);
    let jsonStr: string;

    if (jsonMatch && jsonMatch[1]) {
      jsonStr = jsonMatch[1].trim();
    } else {
      // If no markdown block is found, assume the entire response is the JSON string
      // or try to find a direct JSON object (less reliable)
      jsonStr = rawResponseText;
      console.warn("No '```json' markdown block found. Attempting to parse raw response as JSON.");
    }


    let itineraryData: GeneratedItinerary;
    try {
      itineraryData = JSON.parse(jsonStr);
    } catch (parseError) {
      console.error("Failed to parse JSON response:", jsonStr, parseError);
      throw new Error("Received malformed JSON string from the model. Please try again or refine your prompt.");
    }

    const sourceUrls: string[] = [];
    response.candidates?.[0]?.groundingMetadata?.groundingChunks?.forEach(
      (chunk: any) => {
        if (chunk.web?.uri) {
          sourceUrls.push(chunk.web.uri);
        }
        if (chunk.maps?.uri) {
          sourceUrls.push(chunk.maps.uri);
        }
      }
    );

    return { itineraryData, sourceUrls: [...new Set(sourceUrls)] }; // Deduplicate URLs
  } catch (error: any) {
    console.error('Error generating itinerary from Gemini API:', error);
    if (error.message && error.message.includes("Requested entity was not found.")) {
      throw new Error("API Key might be invalid or has insufficient permissions. Please check your API key and billing details.");
    }
    throw new Error(`Failed to generate itinerary: ${error.message || 'Unknown API error'}`);
  }
};