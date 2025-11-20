
import { ExtractedData } from "../types";
import { API_BASE_URL } from "./db";

/**
 * Sends a document to the backend API for analysis.
 * This replaces the client-side Gemini call to ensure the API key is kept secure on the server.
 * @param imageFile The file (PDF, PNG, JPG) to be analyzed.
 * @returns A promise that resolves with the extracted data from the document.
 */
export const analyzeDocument = async (imageFile: File): Promise<ExtractedData> => {
  try {
    const formData = new FormData();
    formData.append('document', imageFile);

    const response = await fetch(`${API_BASE_URL}/analyze-document`, {
        method: 'POST',
        body: formData,
    });

    if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Server Error: ${response.status} - ${errorText}`);
    }
    
    const data = await response.json();
    return data as ExtractedData;

  } catch (error) {
    console.error("Error analyzing document via backend:", error);
    if (error instanceof Error) {
      throw new Error(`Failed to analyze document: ${error.message}`);
    }
    throw new Error("An unknown error occurred while communicating with the analysis server.");
  }
};
