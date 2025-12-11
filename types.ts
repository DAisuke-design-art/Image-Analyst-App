
export interface PromptData {
  subject: string;
  clothing: string;
  hair: string;
  face: string;
  accessories: string;
  environment: string;
  lighting: string;
  camera: string;
  style: string;
  aspect_ratio: string;
  orientation: string;
  fullPrompt: string; // Keeping for the editable text area
}

export enum AppState {
  IDLE = 'IDLE',
  ANALYZING = 'ANALYZING',
  REVIEW = 'REVIEW',
}
