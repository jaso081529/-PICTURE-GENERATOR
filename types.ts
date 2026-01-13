
export enum BrandId {
  RED_DEVILS = 'RED_DEVILS',
  HOODPLAKA = 'HOODPLAKA',
  JJ674 = 'JJ674',
  PALZFLOW = 'PALZFLOW',
  CUSTOM = 'CUSTOM'
}

export interface BrandProfile {
  id: BrandId;
  name: string;
  description: string;
  colors: string[];
  keywords: string[];
  icon: string;
}

export interface StickerStyle {
  id: string;
  name: string;
  promptModifier: string;
}

export interface StickerTemplate {
  id: string;
  label: string;
  category: 'Ultras' | 'Street' | 'Art' | 'Basic';
  promptAddition: string;
  icon: string;
}

export interface StickerShape {
  id: string;
  name: string;
  promptInstruction: string;
  icon: string;
}

export type AspectRatio = '1:1' | '9:16' | '16:9' | '4:3' | '3:4';

export interface LibraryAsset {
  id: string;
  brandId: BrandId;
  name: string;
  imageBase64: string;
  timestamp: number;
}

export interface GeneratedSticker {
  id: string;
  imageUrl: string;
  prompt: string;
  timestamp: number;
  brandId: BrandId;
  styleId: string;
  shapeId?: string;
  enhancedPrompt?: string;
  aspectRatio?: AspectRatio;
  sizeLabel?: string; // Added to store the physical format selection (e.g. "Quadrat")
}
