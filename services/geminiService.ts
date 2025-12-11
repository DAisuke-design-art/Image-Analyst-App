
import { GoogleGenAI, Type } from "@google/genai";
import { PromptData } from "../types";

export const selectApiKey = async (): Promise<void> => {
  if (typeof window !== 'undefined' && (window as any).aistudio) {
    await (window as any).aistudio.openSelectKey();
  }
};

// Helper to remove data URL prefix
const stripBase64Header = (base64: string) => {
  return base64.split(',')[1] || base64;
};

// Helper to extract mime type from data URL
const getMimeType = (base64: string) => {
  const match = base64.match(/^data:(.*);base64,/);
  return match ? match[1] : 'image/jpeg';
};

/**
 * Analyzes an image to generate a structured JSON prompt.
 * Uses gemini-2.5-flash for speed and vision capabilities.
 */
export const analyzeImageToJSON = async (base64Image: string): Promise<PromptData> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  const responseSchema = {
    type: Type.OBJECT,
    properties: {
      subject: { type: Type.STRING, description: "Main subject. Must include '日本人女性' if a woman." },
      clothing: { type: Type.STRING, description: "Clothing details." },
      hair: { type: Type.STRING, description: "Hairstyle and color." },
      face: { type: Type.STRING, description: "Facial features and expression." },
      accessories: { type: Type.STRING, description: "Accessories like glasses, jewelry, etc." },
      environment: { type: Type.STRING, description: "Background and surroundings." },
      lighting: { type: Type.STRING, description: "Lighting conditions." },
      camera: { type: Type.STRING, description: "Camera angle, shot type, and settings." },
      style: { type: Type.STRING, description: "Artistic style." },
      aspect_ratio: { type: Type.STRING, description: "Aspect ratio, strictly '9:16'." },
      orientation: { type: Type.STRING, description: "Orientation, strictly 'vertical'." },
      fullPrompt: { type: Type.STRING, description: "A comprehensive, high-quality detailed description combining all extracted details." }
    },
    required: ["subject", "clothing", "hair", "face", "accessories", "environment", "lighting", "camera", "style", "aspect_ratio", "orientation", "fullPrompt"]
  };

  const imagePart = {
    inlineData: {
      mimeType: getMimeType(base64Image),
      data: stripBase64Header(base64Image),
    },
  };

  const promptText = `
    Analyze this image and output a JSON response.
    
    Base your extraction on the following instructions:
    "Extract all visual details from this image and convert them into a clean, well-structured JSON prompt.
    Include the sections: “subject”, “clothing”, “hair”, “face”, “accessories”, “environment”, “lighting”, “camera”, “style”.
    Add the output information: “aspect_ratio”: “9:16”, “orientation”: “vertical”.
    Do not invent or assume anything that is not clearly visible in the image.
    In the “subject” field, always include: “日本人女性” (Japanese woman)."

    ADDITIONAL RULES:
    1. Output all string values in JAPANESE.
    2. Include specific age estimates (e.g., 20代) and era settings if applicable.
    3. Ensure 'fullPrompt' is a cohesive paragraph describing the image in detail, also in Japanese.
  `;

  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: {
      parts: [
        imagePart,
        { text: promptText }
      ]
    },
    config: {
      responseMimeType: "application/json",
      responseSchema: responseSchema,
    },
  });

  const text = response.text;
  if (!text) throw new Error("No response from model");
  
  return JSON.parse(text) as PromptData;
};

/**
 * Generates a simple line art drawing of the pose from the input image.
 * Uses gemini-2.5-flash-image for image-to-image generation.
 */
export const generatePoseImage = async (base64Image: string): Promise<string> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  const imagePart = {
    inlineData: {
      mimeType: getMimeType(base64Image),
      data: stripBase64Header(base64Image),
    },
  };

  const promptText = "Create a simple black and white line drawing that represents the pose of the subject in this image. Use thick, clean black lines on a pure white background. The style should be minimalist, like a mannequin or stick figure used for drawing reference. Do not include facial details, hair, or clothing patterns. Just the body structure and pose. High contrast.";

  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash-image',
    contents: {
      parts: [
        imagePart,
        { text: promptText }
      ]
    },
    // No responseSchema or responseMimeType for image generation
  });

  // Extract the generated image from the response parts
  if (response.candidates && response.candidates[0].content && response.candidates[0].content.parts) {
    for (const part of response.candidates[0].content.parts) {
      if (part.inlineData) {
        return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
      }
    }
  }

  throw new Error("No image was generated by the model.");
};
