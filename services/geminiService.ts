
import { GoogleGenAI, Type } from "@google/genai";
import { PromptData, FacePromptData } from "../types";

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
export const analyzeImageToJSON = async (base64Image: string, instructions: string = ""): Promise<PromptData> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  const responseSchema = {
    type: Type.OBJECT,
    properties: {
      CORE_IDENTITY: {
        type: Type.OBJECT,
        properties: {
          Age_Gender: { type: Type.STRING },
          Beauty_Characteristics: { type: Type.STRING, description: "Adjectives describing beauty/atmosphere (e.g. Seiso, Elegant, Translucent)" },
          Ethnicity: { type: Type.STRING },
          Body_Type: { type: Type.STRING },
        },
        required: ["Age_Gender", "Beauty_Characteristics", "Ethnicity", "Body_Type"]
      },
      VISUAL_STYLE: {
        type: Type.OBJECT,
        properties: {
          Archetype: { type: Type.STRING },
          Vibe: { type: Type.STRING },
          Artistic_Style: { type: Type.STRING },
        },
        required: ["Archetype", "Vibe", "Artistic_Style"]
      },
      FACE_FEATURES: {
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
      },
      HAIR_STYLE: {
        type: Type.OBJECT,
        properties: {
          Color: { type: Type.STRING },
          Style: { type: Type.STRING },
          Bangs: { type: Type.STRING },
        },
        required: ["Color", "Style", "Bangs"]
      },
      BODY_FEATURES: {
        type: Type.OBJECT,
        properties: {
          Skin: { type: Type.STRING },
          Chest: { type: Type.STRING },
          Hands_Limbs: { type: Type.STRING },
        },
        required: ["Skin", "Chest", "Hands_Limbs"]
      },
      FASHION: {
        type: Type.OBJECT,
        properties: {
          Clothing: { type: Type.STRING },
          Accessories: { type: Type.STRING }
        },
        required: ["Clothing", "Accessories"]
      },
      SCENE: {
        type: Type.OBJECT,
        properties: {
          Environment: { type: Type.STRING },
          Lighting: { type: Type.STRING },
          Camera: { type: Type.STRING },
          Orientation: { type: Type.STRING },
          Aspect_Ratio: { type: Type.STRING }
        },
        required: ["Environment", "Lighting", "Camera", "Orientation", "Aspect_Ratio"]
      },
      // QUALITY_SETTINGS removed
      fullPrompt: { type: Type.STRING, description: "A descriptive narrative paragraph of the image." }
    },
    required: [
      "CORE_IDENTITY", "VISUAL_STYLE", "FACE_FEATURES", "HAIR_STYLE", 
      "BODY_FEATURES", "FASHION", "SCENE", "fullPrompt"
    ]
  };

  const imagePart = {
    inlineData: {
      mimeType: getMimeType(base64Image),
      data: stripBase64Header(base64Image),
    },
  };

  const promptText = `
    Analyze this image and output a structured JSON response suitable for generating high-quality images.
    
    Output ALL string values in **JAPANESE**.

    **IMPORTANT: USER OVERRIDES**
    The user has provided the following specific instructions/modifications:
    "${instructions}"

    **GUIDELINE 1: SUBJECT AESTHETICS (THE "BEAUTY FILTER")**
    - **Target**: The person/character in the image.
    - **Action**: Apply **Japanese Beauty Standards** to the description of the person. Even for older subjects, emphasize "Elegance", "Refinement", "Translucency", and "Beauty" rather than aging signs.
    - **Keywords for 'Beauty_Characteristics'**: 清純な, 清楚な, 上品な, 儚げな, 透明感のある, 爽やかな, 愛らしい, 洗練された.

    **GUIDELINE 2: SCENE & DETAILS (THE "REALITY FILTER")**
    - **Target**: Background, Props, Accessories, Logos, Text.
    - **Action**: Be **EXTREMELY SPECIFIC** and **FACTUAL**. Do NOT apply the beauty filter here.
    - **Requirement**: If you see specific objects (e.g., a Starbucks cup, a smartphone model, specific car brand), logos, text on signs, or recognizable locations, **YOU MUST DESCRIBE THEM**.
    - **Example**: Instead of "a cafe", say "a Starbucks-style cafe with a visible green logo cup". Instead of "a city", say "a busy Shibuya crossing street".

    **INSTRUCTION PRIORITY:**
    1. User instructions (highest).
    2. Specific Scene Details (brands, logos, locations).
    3. Subject Beauty Enhancement.

    Please structure the analysis into these categories:

    1. **CORE_IDENTITY**:
       - Age_Gender (e.g., 20代前半の日本人女性, 40代の日本人女性)
       - Beauty_Characteristics (Select appropriate beauty adjectives from the list above)
       - Ethnicity
       - Body_Type

    2. **VISUAL_STYLE**:
       - Archetype
       - Vibe
       - Artistic_Style (e.g., フォトリアル)

    3. **FACE_FEATURES**:
       - Face_Shape
       - Eyes (Detail iris color, shape, eyelashes)
       - Eyebrows
       - Nose
       - Lips
       - Makeup
       - Expression

    4. **HAIR_STYLE**:
       - Color
       - Style
       - Bangs

    5. **BODY_FEATURES**:
       - Skin (Texture quality - Emphasize 'smooth', 'radiant', 'clear')
       - Chest (Clothing fit/shape)
       - Hands_Limbs

    6. **FASHION**:
       - Clothing
       - Accessories

    7. **SCENE**:
       - Environment (**Be specific about location, logos, brands if visible**)
       - Lighting
       - Camera (Angle/Shot)
       - Orientation
       - Aspect_Ratio

    Finally, generate 'fullPrompt': A coherent narrative merging the **Beautiful Subject** with the **Detailed/Specific Environment**.
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
      FACE_FEATURES: {
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
      },
      HAIR_STYLE: {
        type: Type.OBJECT,
        properties: {
          Color: { type: Type.STRING },
          Style: { type: Type.STRING },
          Bangs: { type: Type.STRING },
        },
        required: ["Color", "Style", "Bangs"]
      },
      EXPRESSION_VIBE: {
        type: Type.OBJECT,
        properties: {
            Mood: { type: Type.STRING },
            Gaze: { type: Type.STRING },
        },
        required: ["Mood", "Gaze"]
      },
      fullPrompt: { type: Type.STRING, description: "A highly detailed narrative description of the face for a frontal portrait." }
    },
    required: ["CORE_IDENTITY", "FACE_FEATURES", "HAIR_STYLE", "EXPRESSION_VIBE", "fullPrompt"]
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
    1. **FACE_FEATURES**: Precise shape of eyes, nose, lips.
    2. **HAIR_STYLE**: Exact hair texture, color, and framing of the face.
    3. **EXPRESSION**: Describe the gaze as looking straight at the viewer.

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

  // Main pose image
  const poseImagePart = {
    inlineData: {
      mimeType: getMimeType(base64Image),
      data: stripBase64Header(base64Image),
    },
  };

  const parts: any[] = [];
  
  let faceSwapInstruction = "";
  
  if (faceImage) {
    // Face Reference image
    const faceImagePart = {
      inlineData: {
        mimeType: getMimeType(faceImage),
        data: stripBase64Header(faceImage),
      },
    };
    
    // IMPORTANT: Providing both images to the model
    parts.push(poseImagePart);
    parts.push({ text: "The FIRST image (above) is the POSE REFERENCE." });
    parts.push(faceImagePart);
    parts.push({ text: "The SECOND image (above) is the FACE REFERENCE (IDENTITY)." });
    
    faceSwapInstruction = `
    **CRITICAL FACIAL IDENTITY REPLACEMENT:**
    - You MUST replace the face of the subject in the Pose Reference with the face of the person in the Face Reference.
    - **Maintain the POSE from Image 1.**
    - **Use the FACIAL FEATURES (Eyes, Nose, Mouth, Likeness) from Image 2.**
    - The face should look realistically like the person in Image 2, even within the line art style.
    `;
  } else {
    parts.push(poseImagePart);
    parts.push({ text: "Use this image as the reference." });
  }

  let specificRequirements = "";
  if (style === 'detailed') {
    specificRequirements = `
    - **IMPORTANT: DRAW THE FACE.** Clearly include eyes, eyebrows, nose, and mouth.
    - **REALISM LEVEL**: High. Create a detailed sketch that captures the likeness of the character.
    - Do not be hyper-realistic shading-wise, but the features must be distinct and recognizable.
    `;
  } else {
    specificRequirements = `
    - **IMPORTANT: DETAILED MANNEQUIN FACE.**
    - Do NOT make the face blank. Do NOT make it hyper-realistic.
    - **MANDATORY**: You MUST draw clear **eyes with pupils** (to show gaze direction), a **nose line** (to show head angle), and a **mouth line**.
    - The face should look like a high-quality drawing doll or a structural sketch.
    - **GOAL**: Ensure the **direction of the eyes** and **tilt of the head** are perfectly readable by AI pose estimation tools.
    - Use clean, geometric lines. No shading, no skin texture, no makeup details. Just the structural features.
    `;
  }

  const promptText = `
    Create a simple line drawing/sketch representing the subject.

    **USER MODIFICATIONS (MANDATORY):**
    The user wants to modify the subject as follows: "${instructions}".
    
    ${faceSwapInstruction}

    STYLE GUIDELINES:
    - Black lines on a pure white background.
    - Minimalist, clean sketch style.
    - Thick, confident lines.
    - High contrast (Black & White only).
    
    CONTENT REQUIREMENTS:
    - Faithfully reproduce the pose, angle, and body proportions of the POSE REFERENCE.
    - Do not include complex clothing patterns or background details unless requested. Focus on the character's form.
    ${specificRequirements}
  `;

  parts.push({ text: promptText });

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

/**
 * Generates a front-facing close-up line art of the face.
 */
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
