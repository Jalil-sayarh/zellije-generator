'use client';

import { create } from 'zustand';
import { ZELLIJ_PRESETS, ZellijPreset, FillerStrategy } from '../zellij/zellijCustom';

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

// Filler strategy options for UI
export const FILLER_STRATEGIES: { value: FillerStrategy; label: string; description: string }[] = [
  { value: 'random', label: 'Random', description: 'Organic variety' },
  { value: 'first', label: 'First', description: 'Consistent look' },
  { value: 'complex', label: 'Complex', description: 'Maximum detail' },
  { value: 'simple', label: 'Simple', description: 'Minimalist' },
];

// Shadow presets for quick styling
export interface ShadowPreset {
  name: string;
  offsetX: number;
  offsetY: number;
  blur: number;
  opacity: number;
  color: string;
  useAccentColor?: boolean;  // If true, use palette accent color instead of fixed color
}

export const SHADOW_PRESETS: ShadowPreset[] = [
  { name: 'Subtle', offsetX: 1, offsetY: 1, blur: 2, opacity: 0.15, color: '#000000' },
  { name: 'Soft', offsetX: 2, offsetY: 2, blur: 4, opacity: 0.25, color: '#000000' },
  { name: 'Sharp', offsetX: 2, offsetY: 2, blur: 0, opacity: 0.4, color: '#000000' },
  { name: 'Dramatic', offsetX: 4, offsetY: 4, blur: 8, opacity: 0.35, color: '#000000' },
  { name: 'Inset', offsetX: -2, offsetY: -2, blur: 3, opacity: 0.25, color: '#000000' },
  { name: 'Glow', offsetX: 0, offsetY: 0, blur: 6, opacity: 0.4, color: '#3b82f6', useAccentColor: true },
];

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
  
  // New advanced options
  fillerStrategy: FillerStrategy;
  
  // Shadow effects
  showShadow: boolean;
  shadowOffsetX: number;
  shadowOffsetY: number;
  shadowBlur: number;
  shadowOpacity: number;
  shadowColor: string;
  activeShadowPreset: string | null;  // null means custom settings
  
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
  
  // Actions - Advanced options
  setFillerStrategy: (strategy: FillerStrategy) => void;
  
  // Actions - Shadow effects
  setShowShadow: (show: boolean) => void;
  setShadowOffsetX: (offset: number) => void;
  setShadowOffsetY: (offset: number) => void;
  setShadowBlur: (blur: number) => void;
  setShadowOpacity: (opacity: number) => void;
  setShadowColor: (color: string) => void;
  applyShadowPreset: (preset: ShadowPreset) => void;
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
  
  // Advanced options defaults
  fillerStrategy: 'random',
  
  // Shadow effects defaults (Soft preset)
  showShadow: false,
  shadowOffsetX: 2,
  shadowOffsetY: 2,
  shadowBlur: 4,
  shadowOpacity: 0.25,
  shadowColor: '#000000',
  activeShadowPreset: 'Soft',
  
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
  
  // Actions - Advanced options
  setFillerStrategy: (fillerStrategy) => set({ fillerStrategy }),
  
  // Actions - Shadow effects
  setShowShadow: (showShadow) => set({ showShadow }),
  setShadowOffsetX: (shadowOffsetX) => set({ 
    shadowOffsetX: Math.max(-10, Math.min(10, shadowOffsetX)),
    activeShadowPreset: null  // Mark as custom when manually adjusted
  }),
  setShadowOffsetY: (shadowOffsetY) => set({ 
    shadowOffsetY: Math.max(-10, Math.min(10, shadowOffsetY)),
    activeShadowPreset: null
  }),
  setShadowBlur: (shadowBlur) => set({ 
    shadowBlur: Math.max(0, Math.min(15, shadowBlur)),
    activeShadowPreset: null
  }),
  setShadowOpacity: (shadowOpacity) => set({ 
    shadowOpacity: Math.max(0, Math.min(1, shadowOpacity)),
    activeShadowPreset: null
  }),
  setShadowColor: (shadowColor) => set({ 
    shadowColor,
    activeShadowPreset: null
  }),
  applyShadowPreset: (preset) => set((state) => ({
    shadowOffsetX: preset.offsetX,
    shadowOffsetY: preset.offsetY,
    shadowBlur: preset.blur,
    shadowOpacity: preset.opacity,
    shadowColor: preset.useAccentColor ? state.palette.colors[1] : preset.color,
    activeShadowPreset: preset.name,
    showShadow: true,  // Automatically enable shadow when applying preset
  })),
}));

// Re-export presets and types for use in UI
export { ZELLIJ_PRESETS } from '../zellij/zellijCustom';
export type { ZellijPreset, FillerStrategy } from '../zellij/zellijCustom';
