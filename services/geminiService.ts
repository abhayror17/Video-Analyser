import { GoogleGenAI, Type } from "@google/genai";
import type { AnalysisResult } from '../types';

const API_KEY = process.env.API_KEY;

if (!API_KEY) {
  console.warn("API_KEY environment variable not set. Using a placeholder.");
}

const ai = new GoogleGenAI({ apiKey: API_KEY || "YOUR_API_KEY_HERE" });

interface VideoFile {
  data: string; // base64 encoded string
  mimeType: string;
}

const responseSchema = {
  type: Type.OBJECT,
  properties: {
    summary: { type: Type.STRING, description: "A concise summary of the entire video content." },
    sentiment: { type: Type.STRING, description: "The overall sentiment of the video (e.g., Positive, Negative, Neutral)." },
    typeOfDiscussion: { type: Type.STRING, description: "The category of the video (e.g., Corporate Promotional Video, News Report, Tutorial)." },
    primaryTopic: { type: Type.STRING, description: "The main subject matter of the video." },
    subtopics: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: "A list of more specific topics discussed in the video."
    },
    toneOfDelivery: { type: Type.STRING, description: "The mood or style of the presentation (e.g., Informative, Professional, Humorous)." },
    keyPeopleEntities: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: "A list of important people, companies, or entities mentioned."
    },
    regionCountryFocus: { type: Type.STRING, description: "The primary geographical region or country that is the focus of the video." },
    additionalInfo: { type: Type.STRING, description: "A more detailed, paragraph-form summary including specific facts, figures, or key takeaways." },
    segments: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          title: { type: Type.STRING, description: "A descriptive title for this segment of the video." },
          timestamp: { type: Type.STRING, description: "The start and end time of the segment (e.g., 00:15 - 00:45)." },
          duration: { type: Type.STRING, description: "The total duration of the segment (e.g., 00:30)." },
        },
        required: ["title", "timestamp", "duration"],
      },
      description: "A chronological breakdown of the video into distinct segments or scenes."
    },
  },
  required: ["summary", "sentiment", "typeOfDiscussion", "primaryTopic", "subtopics", "toneOfDelivery", "keyPeopleEntities", "regionCountryFocus", "additionalInfo", "segments"],
};


export const analyzeVideoWithGemini = async (
  videoFile: VideoFile,
  prompt: string
): Promise<AnalysisResult> => {
  try {
    const videoPart = {
      inlineData: {
        mimeType: videoFile.mimeType,
        data: videoFile.data,
      },
    };

    // The user's prompt is combined with a more specific instruction.
    const instructionPrompt = `Based on the user's request, please analyze this video and provide a comprehensive breakdown. User request: "${prompt}"`;

    const textPart = {
      text: instructionPrompt,
    };

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-pro',
      contents: { parts: [videoPart, textPart] },
      config: {
        responseMimeType: "application/json",
        responseSchema: responseSchema,
      },
    });

    const jsonText = response.text;
    
    // Basic cleanup in case the model wraps the JSON in markdown
    const cleanedJsonText = jsonText.replace(/^```json\s*|```\s*$/g, '').trim();

    const result: AnalysisResult = JSON.parse(cleanedJsonText);
    return result;

  } catch (error) {
    console.error("Error analyzing video with Gemini:", error);
    if (error instanceof Error) {
      // Provide a more descriptive error message to the user.
      throw new Error(`Error from Gemini API: ${error.message}. The model may have returned an invalid format. Please try again.`);
    }
    throw new Error("An unknown error occurred during analysis.");
  }
};