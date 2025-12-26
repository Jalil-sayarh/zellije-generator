'use client';

import { create } from 'zustand';
import { ZELLIJ_PRESETS, ZellijPreset } from '../zellij/zellijCustom';

export interface Palette {
  name: string;
  colors: string[];  // [background, accent, fill1, fill2, fill3]
  isCustom?: boolean;
}

export const PALETTES: Palette[] = [
  {
    name: 'Fes Blue',
    colors: ['#1a1a2e', '#f0f0f0', '#0047AB', '#1e90ff', '#87ceeb']
  },
  {
    name: 'Marrakech',
    colors: ['#2d1f0f', '#f5f0e1', '#c84c09', '#e67e22', '#f4a460']
  },
  {
    name: 'Chefchaouen',
    colors: ['#1a3a4a', '#e8f4f8', '#4169e1', '#5dade2', '#aed6f1']
  },
  {
    name: 'Sahara',
    colors: ['#3d2914', '#faf0e6', '#d2691e', '#daa520', '#f0e68c']
  },
  {
    name: 'Emerald',
    colors: ['#0d2818', '#e8f5e9', '#006400', '#228b22', '#32cd32']
  },
  {
    name: 'Royal',
    colors: ['#1a0a2e', '#f5f0ff', '#4b0082', '#8b008b', '#da70d6']
  },
  {
    name: 'Terracotta',
    colors: ['#2b1810', '#faf5f0', '#8b4513', '#cd853f', '#deb887']
  },
  {
    name: 'Ocean',
    colors: ['#0a1628', '#e6f3f5', '#006994', '#20b2aa', '#48d1cc']
  }
];

// Default custom palette (user can modify)
const DEFAULT_CUSTOM_PALETTE: Palette = {
  name: 'Custom',
  colors: ['#1a1a2e', '#f0f0f0', '#3b82f6', '#60a5fa', '#93c5fd'],
  isCustom: true
};

export type GeneratorMode = 'random' | 'custom';
export type FocusType = 'None' | 'Eight' | 'Sixteen';

// Color role labels for UI
export const COLOR_ROLES = ['Background', 'Accent', 'Fill 1', 'Fill 2', 'Fill 3'] as const;

interface ZellijeState {
  // Common settings
  palette: Palette;
  shimmer: number;  // -1 = off, 2-4 = shimmer amount
  seed: number;
  
  // Custom palette
  customPalette: Palette;
  isEditingCustomPalette: boolean;
  
  // Generator mode
  mode: GeneratorMode;
  
  // Custom mode settings
  lineDensity: number;    // 4-25
  lineCount: number;      // 5-50
  focus: FocusType;       // None, Eight, Sixteen
  showOutlines: boolean;
  outlineColor: string;
  outlineWidth: number;
  padding: number;        // 20-100
  
  // Actions - Common
  setPalette: (palette: Palette) => void;
  setShimmer: (shimmer: number) => void;
  setSeed: (seed: number) => void;
  regenerate: () => void;
  
  // Actions - Custom Palette
  setCustomPaletteColor: (index: number, color: string) => void;
  useCustomPalette: () => void;
  setIsEditingCustomPalette: (editing: boolean) => void;
  
  // Actions - Mode
  setMode: (mode: GeneratorMode) => void;
  
  // Actions - Custom settings
  setLineDensity: (density: number) => void;
  setLineCount: (count: number) => void;
  setFocus: (focus: FocusType) => void;
  setShowOutlines: (show: boolean) => void;
  setOutlineColor: (color: string) => void;
  setOutlineWidth: (width: number) => void;
  setPadding: (padding: number) => void;
  applyPreset: (preset: ZellijPreset) => void;
}

export const useZellijeStore = create<ZellijeState>((set, get) => ({
  // Common settings
  palette: PALETTES[0],
  shimmer: -1,
  seed: Date.now(),
  
  // Custom palette
  customPalette: DEFAULT_CUSTOM_PALETTE,
  isEditingCustomPalette: false,
  
  // Generator mode
  mode: 'random',
  
  // Custom mode settings (defaults to Classic preset)
  lineDensity: 10,
  lineCount: 25,
  focus: 'None',
  showOutlines: false,
  outlineColor: '#000000',
  outlineWidth: 1,
  padding: 60,
  
  // Actions - Common
  setPalette: (palette) => set({ palette }),
  setShimmer: (shimmer) => set({ shimmer }),
  setSeed: (seed) => set({ seed }),
  regenerate: () => set({ seed: Date.now() }),
  
  // Actions - Custom Palette
  setCustomPaletteColor: (index, color) => set((state) => {
    const newColors = [...state.customPalette.colors];
    newColors[index] = color;
    const newCustomPalette = { ...state.customPalette, colors: newColors };
    // If custom palette is currently active, update the active palette too
    if (state.palette.isCustom) {
      return { customPalette: newCustomPalette, palette: newCustomPalette };
    }
    return { customPalette: newCustomPalette };
  }),
  useCustomPalette: () => set((state) => ({ 
    palette: state.customPalette,
    isEditingCustomPalette: false 
  })),
  setIsEditingCustomPalette: (isEditingCustomPalette) => set({ isEditingCustomPalette }),
  
  // Actions - Mode
  setMode: (mode) => set({ mode }),
  
  // Actions - Custom settings
  setLineDensity: (lineDensity) => set({ lineDensity: Math.max(4, Math.min(25, lineDensity)) }),
  setLineCount: (lineCount) => set({ lineCount: Math.max(5, Math.min(50, lineCount)) }),
  setFocus: (focus) => set({ focus }),
  setShowOutlines: (showOutlines) => set({ showOutlines }),
  setOutlineColor: (outlineColor) => set({ outlineColor }),
  setOutlineWidth: (outlineWidth) => set({ outlineWidth: Math.max(0.5, Math.min(5, outlineWidth)) }),
  setPadding: (padding) => set({ padding: Math.max(20, Math.min(100, padding)) }),
  applyPreset: (preset) => set({
    lineDensity: preset.lineDensity,
    lineCount: preset.lineCount,
    focus: preset.focus
  }),
}));

// Re-export presets for use in UI
export { ZELLIJ_PRESETS } from '../zellij/zellijCustom';
export type { ZellijPreset } from '../zellij/zellijCustom';
