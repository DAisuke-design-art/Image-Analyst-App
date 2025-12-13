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
  Expression: string;
}

export interface HairStyle {
  Color: string;
  Style: string;
  Bangs: string;
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
  EMOTIONAL_PROFILE: EmotionalProfile;
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
}

export interface FacePromptData {
  CORE_IDENTITY: FaceCoreIdentity;
  EMOTIONAL_PROFILE: EmotionalProfile;
  FACE_FEATURES: FaceFeatures;
  HAIR_STYLE: HairStyle;
  fullPrompt: string;
}

export enum AppState {
  IDLE = 'IDLE',
  ANALYZING = 'ANALYZING',
  REVIEW = 'REVIEW',
}