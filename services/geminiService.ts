
import { GoogleGenAI, ThinkingLevel } from "@google/genai";

// The Gemini API key is automatically managed by the AI Studio platform.
// For free models, it is pre-configured in the environment.
// For paid models, the platform provides a secure key selection dialog.
const getAI = () => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY_MISSING");
  }
  return new GoogleGenAI({ apiKey });
};

export async function getForensicInsight(module: string, dataSummary: string) {
  try {
    const ai = getAI();
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `You are the Brahan Forensic Architect, a veteran offshore data specialist. 
      Analyze this ${module} data snapshot: ${dataSummary}.
      
      Provide a detailed forensic diagnosis including:
      1.  **Forensic Summary**: A concise overview of the data integrity.
      2.  **Statistical Analysis**: Comment on the average deviation, standard deviation, and total points analyzed.
      3.  **Integrity Score Interpretation**: Explain the forensic integrity score in the context of offshore standards.
      4.  **Data Ghosts & Trauma**: Identify specific anomalies, potential mechanical trauma, or "ghost" signals.
      5.  **Actionable Recommendations**: Provide clear, prioritized steps for remediation or further audit.
      
      Format the output as a professional, terminal-style forensic report. Use bold headings and clear bullet points.`,
      config: {
        temperature: 0.2,
        topP: 0.9,
        topK: 40,
        maxOutputTokens: 1024,
        thinkingConfig: { thinkingLevel: ThinkingLevel.LOW }
      }
    });
    
    return response.text;
  } catch (error: any) {
    if (error.message === "GEMINI_API_KEY_MISSING") {
      return "CRITICAL ERROR: GEMINI_API_KEY NOT DETECTED. PLEASE ENSURE THE PLATFORM HAS PROVIDED THE NECESSARY CREDENTIALS.";
    }
    console.error("Forensic analysis failed:", error);
    return "ANALYSIS ERROR: UNABLE TO PENETRATE DATA ABYSS. CHECK CONNECTION TO BRAHAN_CORE.";
  }
}
