import { ExtractedData } from "../types";

const API_BASE_URL = 'http://localhost:3001/api';

/**
 * Sends a document to the backend server for analysis with the Gemini API.
 * @param imageFile The file (PDF, PNG, JPG) to be analyzed.
 * @returns A promise that resolves with the extracted data from the document.
 */
export const analyzeDocument = async (imageFile: File): Promise<ExtractedData> => {
  const formData = new FormData();
  formData.append('document', imageFile);

  try {
    const response = await fetch(`${API_BASE_URL}/analyze-document`, {
      method: 'POST',
      body: formData,
      // Note: Do not set 'Content-Type' header when using FormData with fetch,
      // the browser will automatically set it with the correct boundary.
    });

    if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'An unknown error occurred.' }));
        throw new Error(errorData.error || `Server responded with status: ${response.status}`);
    }
    
    const extractedData: ExtractedData = await response.json();
    return extractedData;

  } catch (error) {
    console.error("Error sending document to backend for analysis:", error);
     if (error instanceof TypeError && error.message === 'Failed to fetch') {
        throw new Error('Could not connect to the backend. Is the server running?');
    }
    if (error instanceof Error) {
        throw new Error(`Failed to analyze document: ${error.message}`);
    }
    throw new Error("An unknown network error occurred while analyzing the document.");
  }
};