'use client';

import { create } from 'zustand';

export interface Palette {
  name: string;
  colors: string[];  // [background, accent, fill1, fill2, fill3]
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

interface ZellijeState {
  palette: Palette;
  shimmer: number;  // -1 = off, 2-4 = shimmer amount
  seed: number;
  
  setPalette: (palette: Palette) => void;
  setShimmer: (shimmer: number) => void;
  regenerate: () => void;
}

export const useZellijeStore = create<ZellijeState>((set) => ({
  palette: PALETTES[0],
  shimmer: -1,
  seed: Date.now(),
  
  setPalette: (palette) => set({ palette }),
  setShimmer: (shimmer) => set({ shimmer }),
  regenerate: () => set({ seed: Date.now() }),
}));
