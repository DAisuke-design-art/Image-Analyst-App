
export interface CoreIdentity {
  Age_Gender: string;
  Ethnicity: string;
  Body_Type: string;
}

export interface VisualStyle {
  Archetype: string;
  Vibe: string;
  Artistic_Style: string;
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

// QualitySettings removed

export interface PromptData {
  CORE_IDENTITY: CoreIdentity;
  VISUAL_STYLE: VisualStyle;
  FACE_FEATURES: FaceFeatures;
  HAIR_STYLE: HairStyle;
  BODY_FEATURES: BodyFeatures;
  FASHION: Fashion;
  SCENE: Scene;
  // QUALITY_SETTINGS removed

  fullPrompt: string;
}

export interface FaceCoreIdentity {
  Age_Gender: string;
  Ethnicity: string;
}

export interface ExpressionVibe {
  Mood: string;
  Gaze: string;
}

export interface FacePromptData {
  CORE_IDENTITY: FaceCoreIdentity;
  FACE_FEATURES: FaceFeatures;
  HAIR_STYLE: HairStyle;
  EXPRESSION_VIBE: ExpressionVibe;
  fullPrompt: string;
}

export enum AppState {
  IDLE = 'IDLE',
  ANALYZING = 'ANALYZING',
  REVIEW = 'REVIEW',
}