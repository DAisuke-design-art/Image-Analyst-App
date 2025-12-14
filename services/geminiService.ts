
import { GoogleGenAI, Type, Schema } from "@google/genai";
import { PromptData, FacePromptData, DualLanguagePromptData } from "../types";

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

// Reusable Schema Definitions
const coreIdentitySchema: Schema = {
  type: Type.OBJECT,
  properties: {
    Age_Gender: { type: Type.STRING },
    Beauty_Characteristics: { type: Type.STRING },
    Ethnicity: { type: Type.STRING },
    Body_Type: { type: Type.STRING },
  },
  required: ["Age_Gender", "Beauty_Characteristics", "Ethnicity", "Body_Type"]
};

const visualStyleSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    Archetype: { type: Type.STRING },
    Vibe: { type: Type.STRING },
    Artistic_Style: { type: Type.STRING },
  },
  required: ["Archetype", "Vibe", "Artistic_Style"]
};

const emotionalProfileSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    Emotion: { type: Type.STRING, description: "Basic emotion (e.g., Playful, Confident)" },
    Mood: { type: Type.STRING, description: "Specific atmosphere/psychological state" },
    Expression: { type: Type.STRING, description: "Direction of expression and nuance" },
    Avoid: { type: Type.STRING, description: "Elements to avoid to maintain this mood" },
  },
  required: ["Emotion", "Mood", "Expression", "Avoid"]
};

const faceFeaturesSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    Face_Shape: { type: Type.STRING },
    Eyes: { type: Type.STRING },
    Eyebrows: { type: Type.STRING },
    Nose: { type: Type.STRING },
    Lips: { type: Type.STRING },
    Makeup: { type: Type.STRING },
    Expression: { type: Type.STRING }
  },
  required: ["Face_Shape", "Eyes", "Eyebrows", "Nose", "Lips", "Makeup", "Expression"]
};

const hairStyleSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    Color: { type: Type.STRING },
    Style: { type: Type.STRING },
    Bangs: { type: Type.STRING },
  },
  required: ["Color", "Style", "Bangs"]
};

const bodyFeaturesSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    Skin: { type: Type.STRING },
    Chest: { type: Type.STRING },
    Hands_Limbs: { type: Type.STRING },
  },
  required: ["Skin", "Chest", "Hands_Limbs"]
};

const fashionSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    Clothing: { type: Type.STRING },
    Accessories: { type: Type.STRING }
  },
  required: ["Clothing", "Accessories"]
};

const sceneSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    Environment: { type: Type.STRING },
    Lighting: { type: Type.STRING },
    Camera: { type: Type.STRING },
    Orientation: { type: Type.STRING },
    Aspect_Ratio: { type: Type.STRING }
  },
  required: ["Environment", "Lighting", "Camera", "Orientation", "Aspect_Ratio"]
};

const singleLanguagePromptSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    CORE_IDENTITY: coreIdentitySchema,
    VISUAL_STYLE: visualStyleSchema,
    EMOTIONAL_PROFILE: emotionalProfileSchema,
    FACE_FEATURES: faceFeaturesSchema,
    HAIR_STYLE: hairStyleSchema,
    BODY_FEATURES: bodyFeaturesSchema,
    FASHION: fashionSchema,
    SCENE: sceneSchema,
    fullPrompt: { type: Type.STRING, description: "A descriptive narrative paragraph of the image." }
  },
  required: [
    "CORE_IDENTITY", "VISUAL_STYLE", "EMOTIONAL_PROFILE", "FACE_FEATURES", "HAIR_STYLE", 
    "BODY_FEATURES", "FASHION", "SCENE", "fullPrompt"
  ]
};

/**
 * Analyzes an image to generate a structured JSON prompt in both Japanese and English.
 * Uses gemini-2.5-flash for speed and vision capabilities.
 */
export const analyzeImageToJSON = async (base64Image: string, instructions: string = ""): Promise<DualLanguagePromptData> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  const responseSchema = {
    type: Type.OBJECT,
    properties: {
      japanese: singleLanguagePromptSchema,
      english: singleLanguagePromptSchema
    },
    required: ["japanese", "english"]
  };

  const imagePart = {
    inlineData: {
      mimeType: getMimeType(base64Image),
      data: stripBase64Header(base64Image),
    },
  };

  const promptText = `
    Analyze this image and output a structured JSON response in TWO languages: **Japanese** and **English**.

    **IMPORTANT: USER OVERRIDES**
    The user has provided the following specific instructions/modifications:
    "${instructions}"
    *Ensure these instructions are reflected in the analysis (e.g., if user says 'make hair red', describe the hair as red).*

    **GUIDELINE 1: SUBJECT AESTHETICS (THE "BEAUTY FILTER")**
    - **Target**: The person/character in the image.
    - **Action**: Apply **Japanese Beauty Standards** to the description of the person. Even for older subjects, emphasize "Elegance", "Refinement", "Translucency", and "Beauty" rather than aging signs.
    - **Keywords for 'Beauty_Characteristics' (Japanese)**: 清純な, 清楚な, 上品な, 儚げな, 透明感のある, 爽やかな, 愛らしい, 洗練された.

    **GUIDELINE 2: SCENE & DETAILS (THE "REALITY FILTER")**
    - **Target**: Background, Props, Accessories, Logos, Text.
    - **Action**: Be **EXTREMELY SPECIFIC** and **FACTUAL**. Do NOT apply the beauty filter here.
    - **Requirement**: If you see specific objects (e.g., a Starbucks cup, a smartphone model, specific car brand), logos, text on signs, or recognizable locations, **YOU MUST DESCRIBE THEM**.

    **GUIDELINE 3: EMOTIONAL DEPTH (EMOTIONAL_PROFILE)**
    Analyze the nuance of the expression and mood. Use the following references as a guide for the "EMOTIONAL_PROFILE" fields:

    *   **Playful / Innocent (無邪気・楽しい)**
        *   Emotion: Playful - "So fun! Want to share!"
        *   Mood: Genuinely happy, carefree, childlike joy
        *   Expression: Bright sparkling eyes, sweet playful smile
        *   Avoid: Fake smile, serious expression

    *   **Seeking Attention / Cute (甘え・構ってほしい)**
        *   Emotion: Seeking attention - "Pay attention to me"
        *   Mood: Wanting validation, a bit shy but showing off
        *   Expression: Soft pleading eyes, cute pouty lips
        *   Avoid: Overly confident, cold expressions

    *   **Confident / Self-assured (自信・見てほしい)**
        *   Emotion: Confident - "Don't I look cute?"
        *   Mood: Satisfied with today's look, self-assured
        *   Expression: Confident smile, relaxed posture
        *   Avoid: Insecure, anxious expressions

    *   **Vulnerable / Fragile (儚さ・守りたくなる)**
        *   Emotion: Vulnerable - "Feeling a bit lonely..."
        *   Mood: Slightly melancholy, fragile beauty
        *   Expression: Soft downcast eyes, delicate expression
        *   Avoid: Energetic, strong, confident looks

    *   **Intimate / Secret (秘密・特別感)**
        *   Emotion: Intimate - "This is just for you"
        *   Mood: Sharing a secret, special closeness
        *   Expression: Soft shy smile, slightly blushing
        *   Avoid: Public-facing smile, distant expression

    **INSTRUCTION PRIORITY:**
    1. User instructions (highest).
    2. Specific Scene Details (brands, logos, locations).
    3. Subject Beauty Enhancement & Emotional Depth.

    **OUTPUT REQUIREMENTS:**
    1. **japanese**: Output all values in natural, high-quality Japanese suitable for prompts.
    2. **english**: Output all values in English.
       - **Translation Style**: Use terminology common in Image Generation prompts (e.g., "masterpiece, best quality, detailed").
       - The 'fullPrompt' in English should be a robust paragraph suitable for Stable Diffusion or Midjourney.

    Structure both the 'japanese' and 'english' objects with these keys:
    1. CORE_IDENTITY
    2. VISUAL_STYLE
    3. EMOTIONAL_PROFILE (Emotion, Mood, Expression, Avoid)
    4. FACE_FEATURES
    5. HAIR_STYLE
    6. BODY_FEATURES
    7. FASHION
    8. SCENE
    9. fullPrompt
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
  
  return JSON.parse(text) as DualLanguagePromptData;
};

/**
 * Analyzes the face in the image to generate a structured JSON prompt specifically for Frontal Face generation.
 */
export const analyzeFaceToJSON = async (base64Image: string): Promise<FacePromptData> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  const responseSchema = {
    type: Type.OBJECT,
    properties: {
      CORE_IDENTITY: {
        type: Type.OBJECT,
        properties: {
          Age_Gender: { type: Type.STRING },
          Ethnicity: { type: Type.STRING },
        },
        required: ["Age_Gender", "Ethnicity"]
      },
      EMOTIONAL_PROFILE: emotionalProfileSchema, // Now using the shared emotional schema
      FACE_FEATURES: faceFeaturesSchema,
      HAIR_STYLE: hairStyleSchema,
      fullPrompt: { type: Type.STRING, description: "A highly detailed narrative description of the face for a frontal portrait." }
    },
    required: ["CORE_IDENTITY", "EMOTIONAL_PROFILE", "FACE_FEATURES", "HAIR_STYLE", "fullPrompt"]
  };

  const imagePart = {
    inlineData: {
      mimeType: getMimeType(base64Image),
      data: stripBase64Header(base64Image),
    },
  };

  const promptText = `
    Analyze the FACE in this image and create a structured JSON for generating a **High-Quality Frontal Portrait**.
    
    Output ALL string values in **JAPANESE**.
    
    Even if the image is side-view, describe the features as they would appear in a Frontal View (Passport style / ID photo style but artistic).

    Focus intensely on:
    1. **EMOTIONAL_PROFILE**: Decode the subtle emotion. Is it "Playful", "Confident", "Vulnerable", or "Intimate"? Define the Mood and what to Avoid.
    2. **FACE_FEATURES**: Precise shape of eyes, nose, lips.
    3. **HAIR_STYLE**: Exact hair texture, color, and framing of the face.
    4. **EXPRESSION**: Describe the gaze as looking straight at the viewer.

    Finally, generate 'fullPrompt': A detailed paragraph describing JUST the face and hair for a portrait generation.
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
  
  return JSON.parse(text) as FacePromptData;
};

/**
 * Generates a simple line art drawing of the pose from the input image.
 * Uses gemini-2.5-flash-image for image-to-image generation.
 */
export const generatePoseImage = async (base64Image: string, aspectRatio: string = "1:1", style: 'detailed' | 'abstract' = 'detailed', instructions: string = "", faceImage?: string | null): Promise<string> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  // Main pose image part (Source 1)
  const poseImagePart = {
    inlineData: {
      mimeType: getMimeType(base64Image),
      data: stripBase64Header(base64Image),
    },
  };

  const parts: any[] = [];
  
  // Logic for Detailed (Likeness) vs Abstract (Structure)
  if (style === 'detailed') {
    // --- DETAILED MODE: Face Swap & High Likeness ---
    if (faceImage) {
      // Face reference part (Source 2)
      const faceImagePart = {
        inlineData: {
          mimeType: getMimeType(faceImage),
          data: stripBase64Header(faceImage),
        },
      };
      
      // Order of operations for the Model: Image 1 (Pose) -> Image 2 (Face) -> Instructions
      parts.push(poseImagePart);
      parts.push(faceImagePart);
      
      const detailedPrompt = `
      **TASK: NEUTRAL LINE ART (FACE SWAP)**
      
      **INPUTS (In order):**
      1. **FIRST IMAGE (POSE Source)**: Use the body, pose, gesture, clothing, composition, and angle from this image.
      2. **SECOND IMAGE (FACE Source)**: Use the facial identity, eyes, nose, mouth, and hairstyle from this image.
      
      **USER INSTRUCTIONS (HIGHEST PRIORITY):**
      "${instructions}"
      (IMPORTANT: If the user asks for a specific hair color, expression, or accessory, apply it EVEN IF it contradicts the source images.)

      **EXECUTION GUIDE:**
      - **BASE**: Draw the subject from Image 1.
      - **SWAP**: REPLACE the head/face of Image 1 with the head/face of Image 2.
      - **ADJUST**: Rotate the face from Image 2 to match the neck angle of Image 1.
      
      **STYLE GUIDELINES:**
      - **Style**: Clean, Neutral Line Art. **Do NOT use Anime/Manga style.**
      - **Concept**: A simple but descriptive drawing, slightly more detailed than a structural mannequin.
      - **Detail Level**: 
         - **Body/Clothes**: Clearly trace the outlines and main folds of the clothing.
         - **Face**: Draw the eyes, nose, and mouth clearly to show the expression.
      - **Visuals**: Black lines, White background. No shading. No filling.
      `;
      parts.push({ text: detailedPrompt });

    } else {
      // Single Image Detailed Mode
      parts.push(poseImagePart);
      
      const detailedPrompt = `
      **TASK: NEUTRAL LINE ART**
      
      **INPUT:**
      - Use the provided image as the reference for Pose, Identity, and Composition.
      
      **USER INSTRUCTIONS (HIGHEST PRIORITY):**
      "${instructions}"
      (IMPORTANT: Modify the result based on these instructions. e.g., "Change hair to short", "Add glasses".)

      **STYLE GUIDELINES:**
      - **Style**: Clean, Neutral Line Art. **Do NOT use Anime/Manga style.**
      - **Concept**: A simple but descriptive drawing, slightly more detailed than a structural mannequin.
      - **Detail Level**: 
         - **Body/Clothes**: Clearly trace the outlines and main folds of the clothing.
         - **Face**: Draw the eyes, nose, and mouth clearly to show the expression.
      - **Visuals**: Black lines, White background. No shading. No filling.
      `;
      parts.push({ text: detailedPrompt });
    }

  } else {
    // --- ABSTRACT MODE: Structure / Mannequin ---
    // In abstract mode, we generally focus on the Pose Source structure.
    parts.push(poseImagePart);

    const abstractPrompt = `
      Create a structural 'mannequin-style' line drawing of the subject in this image.

      **USER INSTRUCTION OVERRIDE:** "${instructions}"

      STYLE GUIDELINES (ABSTRACT / STRUCTURE):
      - **NO SHADING**. Pure line art.
      - **SIMPLIFIED FACE**: Do NOT draw detailed realistic features. Draw a "drawing doll" or "mannequin" face.
      - **ESSENTIALS ONLY**: 
        - Draw the **Eye Line** and **Center Line** of the face to show head direction.
        - Draw clear outlines of the body and limbs.
        - Simplify clothing into major shapes.
      - **GOAL**: This image is for AI Pose Estimation (ControlNet). Clean geometry is more important than beauty.
      
      If the user requested a specific hairstyle (e.g. "Short hair"), represent the *volume* of that hair simply.
    `;
    parts.push({ text: abstractPrompt });
  }

  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash-image',
    contents: {
      parts: parts
    },
    config: {
      imageConfig: {
        aspectRatio: aspectRatio as any
      }
    }
  });

  if (response.candidates && response.candidates[0].content && response.candidates[0].content.parts) {
    for (const part of response.candidates[0].content.parts) {
      if (part.inlineData) {
        return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
      }
    }
  }

  throw new Error("No image was generated by the model.");
};

export const generateFrontalFaceImage = async (base64Image: string): Promise<string> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  const imagePart = {
    inlineData: {
      mimeType: getMimeType(base64Image),
      data: stripBase64Header(base64Image),
    },
  };

  const promptText = `
    Create a Close-up Frontal Face Line Art from this image.

    TRANSFORMATION REQUIRED:
    - Re-imagine the subject's face as if they are looking STRAIGHT at the camera (Front View).
    - Even if the original image is from the side, **ROTATE the face to be a perfect front view**.
    
    STYLE GUIDELINES:
    - Black lines on a pure white background.
    - Minimalist, clean sketch style.
    - Thick, confident lines.
    - High contrast (Black & White only).
    
    CONTENT REQUIREMENTS:
    - **CLOSE-UP**: Crop to focus strictly on the head, hair, and neck.
    - **FRONTAL VIEW**: The eyes must look straight ahead. The face must be symmetrical.
    - **DETAILS**: Capture the specific hairstyle, eye shape, and facial features of the subject.
    - No background.
  `;

  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash-image',
    contents: {
      parts: [
        imagePart,
        { text: promptText }
      ]
    },
    config: {
      imageConfig: {
        aspectRatio: "1:1" // Always square for portraits
      }
    }
  });

  if (response.candidates && response.candidates[0].content && response.candidates[0].content.parts) {
    for (const part of response.candidates[0].content.parts) {
      if (part.inlineData) {
        return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
      }
    }
  }

  throw new Error("No face image was generated by the model.");
};
