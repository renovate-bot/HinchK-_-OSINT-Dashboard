import { GoogleGenAI, Type } from "@google/genai";
import { InvestigationState } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

const investigationSchema = {
  type: Type.OBJECT,
  properties: {
    targetName: { type: Type.STRING },
    intelPoints: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          id: { type: Type.STRING },
          category: { type: Type.STRING },
          label: { type: Type.STRING },
          value: { type: Type.STRING },
          confidence: { type: Type.NUMBER },
          source: { type: Type.STRING },
          timestamp: { type: Type.STRING }
        },
        required: ["id", "category", "label", "value", "confidence", "timestamp"]
      }
    },
    pathways: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          id: { type: Type.STRING },
          name: { type: Type.STRING },
          description: { type: Type.STRING },
          status: { type: Type.STRING, enum: ["PENDING", "ACTIVE", "COMPLETED", "FAILED"] },
          findingsCount: { type: Type.NUMBER }
        },
        required: ["id", "name", "description", "status", "findingsCount"]
      }
    },
    completionPercent: { type: Type.NUMBER },
    judgmentReasoning: { type: Type.STRING },
    isComplete: { type: Type.BOOLEAN },
    suggestedQuestions: {
      type: Type.ARRAY,
      items: { type: Type.STRING }
    },
    chatResponse: { type: Type.STRING, description: "The agent's response to the user in the chat." }
  },
  required: ["targetName", "intelPoints", "pathways", "completionPercent", "judgmentReasoning", "isComplete", "suggestedQuestions", "chatResponse"]
};

export async function processInvestigationUpdate(
  currentState: InvestigationState,
  chatHistory: { role: string; content: string }[],
  userInput: string
): Promise<{ state: InvestigationState; chatResponse: string }> {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: [
        {
          role: "user",
          parts: [{
            text: `You are an OSINT Intelligence Agent (Sentinel). Your task is to conduct a simulated investigation into a target based on user input.
            
            Current Investigation State:
            ${JSON.stringify(currentState, null, 2)}
            
            User Input: "${userInput}"
            
            Guidelines:
            1. Analyze the user input to find new information or directions.
            2. Update "intelPoints" if new data is confirmed. Add at least 3-4 interesting intel points if this is the start.
            3. Update "pathways" (e.g., Social Media, Domain records, Public archives, Leaks).
            4. Act as the "Judging Matrix": Determine if we have enough info. Set "isComplete" to true only if high-confidence data covers basic identity, residency, and primary digital footprint.
            5. Provide "suggestedQuestions" to help the investigator (the user) move forward.
            6. Provide a "chatResponse" that is professional, slightly clinical, and investigative.
            
            If this is the start (targetName is empty), set the targetName from the input and initialize pathways with realistic categories for that person/entity.`
          }]
        }
      ],
      config: {
        responseMimeType: "application/json",
        responseSchema: investigationSchema,
      },
    });

    if (!response.text) {
      throw new Error("No response from Sentinel_OS");
    }

    let result;
    try {
      // Clean up the text in case Gemini wrapped it in markdown
      const cleanedText = response.text.replace(/```json/g, '').replace(/```/g, '').trim();
      result = JSON.parse(cleanedText);
    } catch (e) {
      console.error("JSON Parse Error. Raw text:", response.text);
      throw new Error("Intelligence data corruption detected. Logic matrix unstable.");
    }

    const { chatResponse, ...newState } = result;
    
    return {
      state: newState as InvestigationState,
      chatResponse
    };
  } catch (error) {
    console.error("Gemini Error:", error);
    throw error;
  }
}
