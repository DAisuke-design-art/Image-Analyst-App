export interface CoreIdentity {
  Age_Gender: string;
  Beauty_Characteristics: string;
  Ethnicity: string;
  Body_Type: string;
}

export interface VisualStyle {
  Archetype: string;
  Vibe: string;
  Artistic_Style: string;
}

export interface EmotionalProfile {
  Emotion: string;
  Mood: string;
  Expression: string;
  Avoid: string;
}

export interface FaceFeatures {
  Face_Shape: string;
  Eyes: string;
  Eyebrows: string;
  Nose: string;
  Lips: string;
  Makeup: string;
  Expression: string; // Keeps physical description
}

export interface HairStyle {
  Color: string;
  Style: string;
  Bangs: string;
  // Made optional in case AI omits it in one language, though schema requires it
}

export interface BodyFeatures {
  Skin: string;
  Chest: string;
  Hands_Limbs: string;
}

export interface Fashion {
  Clothing: string;
  Accessories: string;
}

export interface Scene {
  Environment: string;
  Lighting: string;
  Camera: string;
  Orientation: string;
  Aspect_Ratio: string;
}

export interface PromptData {
  CORE_IDENTITY: CoreIdentity;
  VISUAL_STYLE: VisualStyle;
  EMOTIONAL_PROFILE: EmotionalProfile; // New field
  FACE_FEATURES: FaceFeatures;
  HAIR_STYLE: HairStyle;
  BODY_FEATURES: BodyFeatures;
  FASHION: Fashion;
  SCENE: Scene;
  fullPrompt: string;
}

export interface DualLanguagePromptData {
  japanese: PromptData;
  english: PromptData;
}

export interface FaceCoreIdentity {
  Age_Gender: string;
  Ethnicity: string;
  // ...
}

export interface FacePromptData {
  CORE_IDENTITY: FaceCoreIdentity;
  EMOTIONAL_PROFILE: EmotionalProfile; // Replaces simple expression vibe
  FACE_FEATURES: FaceFeatures;
  HAIR_STYLE: HairStyle;
  // EXPRESSION_VIBE removed/merged into EMOTIONAL_PROFILE
  fullPrompt: string;
}

export enum AppState {
  IDLE = 'IDLE',
  ANALYZING = 'ANALYZING',
  REVIEW = 'REVIEW',
}
