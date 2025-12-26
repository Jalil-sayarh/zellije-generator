'use client';

import React, { useRef, useCallback, useEffect, useState } from 'react';
import { Shuffle, Sparkles, Palette, Download, Image, FileCode, Copy, Check, Sliders, Grid, Target, Hexagon, Plus, ChevronDown, ChevronUp, Layers, Sun, Menu, X } from 'lucide-react';
import Canvas from './Canvas';
import { useZellijeStore, PALETTES, ZELLIJ_PRESETS, COLOR_ROLES, FILLER_STRATEGIES, SHADOW_PRESETS, type FocusType } from '@/lib/hooks/useZellijeStore';

export function Layout() {
  const { 
    palette, shimmer, seed, mode,
    lineDensity, lineCount, focus, showOutlines, outlineColor, outlineWidth, padding,
    fillerStrategy,
    showShadow, shadowOffsetX, shadowOffsetY, shadowBlur, shadowOpacity, shadowColor, activeShadowPreset,
    customPalette, isEditingCustomPalette,
    setPalette, setShimmer, setSeed, regenerate, setMode,
    setLineDensity, setLineCount, setFocus, setShowOutlines, setOutlineColor, setOutlineWidth, setPadding, applyPreset,
    setFillerStrategy,
    setShowShadow, setShadowOffsetX, setShadowOffsetY, setShadowBlur, setShadowOpacity, setShadowColor, applyShadowPreset,
    setCustomPaletteColor, useCustomPalette, setIsEditingCustomPalette
  } = useZellijeStore();
  
  const canvasRef = useRef<{ getSvgElement: () => SVGSVGElement | null }>(null);
  const [copied, setCopied] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [seedInput, setSeedInput] = useState('');
  const [isEditingSeed, setIsEditingSeed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Mark as mounted to avoid hydration mismatch with seed
  useEffect(() => {
    setMounted(true);
  }, []);

  // Sync seed input with store seed
  useEffect(() => {
    setSeedInput(seed.toString());
  }, [seed]);

  // Keyboard shortcut: Space to regenerate
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger if user is typing in an input
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }
      if (e.code === 'Space') {
        e.preventDefault();
        regenerate();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [regenerate]);

  const exportSVG = useCallback(() => {
    const svg = canvasRef.current?.getSvgElement();
    if (!svg) return;

    const serializer = new XMLSerializer();
    const svgString = serializer.serializeToString(svg);
    const blob = new Blob([svgString], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = `zellij-${seed}.svg`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, [seed]);

  const exportPNG = useCallback(() => {
    const svg = canvasRef.current?.getSvgElement();
    if (!svg) return;

    const serializer = new XMLSerializer();
    const svgString = serializer.serializeToString(svg);
    const svgBlob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(svgBlob);

    const img = new window.Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = svg.clientWidth * 2;  // 2x for high DPI
      canvas.height = svg.clientHeight * 2;
      
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      
      ctx.scale(2, 2);
      ctx.drawImage(img, 0, 0);
      
      canvas.toBlob((blob) => {
        if (!blob) return;
        const pngUrl = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = pngUrl;
        a.download = `zellij-${seed}.png`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(pngUrl);
      }, 'image/png');
      
      URL.revokeObjectURL(url);
    };
    img.src = url;
  }, [seed]);

  const copySVGToClipboard = useCallback(async () => {
    const svg = canvasRef.current?.getSvgElement();
    if (!svg) return;

    const serializer = new XMLSerializer();
    const svgString = serializer.serializeToString(svg);
    
    try {
      await navigator.clipboard.writeText(svgString);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy SVG:', err);
    }
  }, []);

  // Render controls content (used in both sidebar and drawer)
  const renderControlsContent = () => (
    <div className="flex-1 overflow-y-auto p-6 space-y-6">
      {/* Mode Toggle */}
      <div>
        <div className="flex items-center gap-2 text-sm font-medium text-zinc-300 mb-3">
          <Sliders size={16} />
          Generator Mode
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setMode('random')}
            className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
              mode === 'random'
                ? 'bg-blue-600 text-white'
                : 'bg-zinc-800 text-zinc-400 hover:text-zinc-300'
            }`}
          >
            Random
          </button>
          <button
            onClick={() => setMode('custom')}
            className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
              mode === 'custom'
                ? 'bg-blue-600 text-white'
                : 'bg-zinc-800 text-zinc-400 hover:text-zinc-300'
            }`}
          >
            Custom
          </button>
        </div>
      </div>

      {/* Seed Input */}
      {mounted && (
        <div>
          <div className="flex items-center gap-2">
            <label className="text-xs text-zinc-500 whitespace-nowrap">Seed:</label>
            <input
              type="text"
              value={seedInput}
              onChange={(e) => {
                setSeedInput(e.target.value);
                setIsEditingSeed(e.target.value !== seed.toString());
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  const parsed = parseInt(seedInput, 10);
                  if (!isNaN(parsed) && parsed > 0) {
                    setSeed(parsed);
                    setIsEditingSeed(false);
                  }
                }
              }}
              onBlur={() => {
                const parsed = parseInt(seedInput, 10);
                if (!isNaN(parsed) && parsed > 0) {
                  setSeed(parsed);
                } else {
                  setSeedInput(seed.toString());
                }
                setIsEditingSeed(false);
              }}
              className="flex-1 px-2 py-1 bg-zinc-800 border border-zinc-700 rounded text-xs text-zinc-300 font-mono focus:outline-none focus:border-blue-500"
            />
          </div>
          {isEditingSeed && (
            <p className="text-xs text-blue-400 mt-1">
              Press <kbd className="px-1 py-0.5 bg-zinc-800 rounded text-zinc-300">Enter</kbd> to generate
            </p>
          )}
        </div>
      )}

      {/* Custom Mode Controls */}
      {mode === 'custom' && (
        <div className="space-y-5 pt-2 border-t border-zinc-800">
          {/* Presets */}
          <div>
            <div className="flex items-center gap-2 text-sm font-medium text-zinc-300 mb-3">
              <Hexagon size={16} />
              Presets
            </div>
            <div className="grid grid-cols-3 gap-2">
              {ZELLIJ_PRESETS.map((preset) => (
                <button
                  key={preset.name}
                  onClick={() => applyPreset(preset)}
                  className={`px-2 py-1.5 rounded text-xs transition-colors ${
                    lineDensity === preset.lineDensity && 
                    lineCount === preset.lineCount && 
                    focus === preset.focus
                      ? 'bg-blue-600 text-white'
                      : 'bg-zinc-800 text-zinc-400 hover:text-zinc-300 hover:bg-zinc-700'
                  }`}
                >
                  {preset.name}
                </button>
              ))}
            </div>
          </div>

          {/* Line Density */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs text-zinc-400 flex items-center gap-1.5">
                <Grid size={12} />
                Grid Density
              </label>
              <span className="text-xs text-zinc-500 font-mono">{lineDensity}</span>
            </div>
            <input
              type="range"
              min="4"
              max="25"
              value={lineDensity}
              onChange={(e) => setLineDensity(parseInt(e.target.value))}
              className="w-full h-1.5 bg-zinc-700 rounded-lg appearance-none cursor-pointer accent-blue-500"
            />
            <p className="text-xs text-zinc-600 mt-1">Controls tile complexity</p>
          </div>

          {/* Line Count */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs text-zinc-400">Line Count</label>
              <span className="text-xs text-zinc-500 font-mono">{lineCount}</span>
            </div>
            <input
              type="range"
              min="5"
              max="50"
              value={lineCount}
              onChange={(e) => setLineCount(parseInt(e.target.value))}
              className="w-full h-1.5 bg-zinc-700 rounded-lg appearance-none cursor-pointer accent-blue-500"
            />
            <p className="text-xs text-zinc-600 mt-1">Number of pattern lines</p>
          </div>

          {/* Focus Pattern */}
          <div>
            <div className="flex items-center gap-2 text-xs text-zinc-400 mb-2">
              <Target size={12} />
              Focus Pattern
            </div>
            <div className="flex gap-2">
              {(['None', 'Eight', 'Sixteen'] as FocusType[]).map((f) => (
                <button
                  key={f}
                  onClick={() => setFocus(f)}
                  className={`flex-1 px-2 py-1.5 rounded text-xs transition-colors ${
                    focus === f
                      ? 'bg-blue-600 text-white'
                      : 'bg-zinc-800 text-zinc-400 hover:text-zinc-300'
                  }`}
                >
                  {f === 'None' ? 'None' : f === 'Eight' ? '8-Star' : '16-Star'}
                </button>
              ))}
            </div>
          </div>

          {/* Filler Strategy */}
          <div>
            <div className="flex items-center gap-2 text-xs text-zinc-400 mb-2">
              <Layers size={12} />
              Filler Strategy
            </div>
            <div className="grid grid-cols-2 gap-2">
              {FILLER_STRATEGIES.map((s) => (
                <button
                  key={s.value}
                  onClick={() => setFillerStrategy(s.value)}
                  className={`px-2 py-1.5 rounded text-xs transition-colors ${
                    fillerStrategy === s.value
                      ? 'bg-blue-600 text-white'
                      : 'bg-zinc-800 text-zinc-400 hover:text-zinc-300'
                  }`}
                  title={s.description}
                >
                  {s.label}
                </button>
              ))}
            </div>
            <p className="text-xs text-zinc-600 mt-1">
              {FILLER_STRATEGIES.find(s => s.value === fillerStrategy)?.description}
            </p>
          </div>

          {/* Padding */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs text-zinc-400">Padding</label>
              <span className="text-xs text-zinc-500 font-mono">{padding}px</span>
            </div>
            <input
              type="range"
              min="20"
              max="100"
              value={padding}
              onChange={(e) => setPadding(parseInt(e.target.value))}
              className="w-full h-1.5 bg-zinc-700 rounded-lg appearance-none cursor-pointer accent-blue-500"
            />
          </div>

          {/* Show Outlines */}
          <div className="flex items-center justify-between">
            <label className="text-xs text-zinc-400">Show Outlines</label>
            <button
              onClick={() => setShowOutlines(!showOutlines)}
              className={`w-10 h-5 rounded-full transition-colors ${
                showOutlines ? 'bg-blue-600' : 'bg-zinc-700'
              }`}
            >
              <div className={`w-4 h-4 rounded-full bg-white transition-transform ${
                showOutlines ? 'translate-x-5' : 'translate-x-0.5'
              }`} />
            </button>
          </div>

          {/* Outline Settings (show when outlines enabled) */}
          {showOutlines && (
            <div className="pl-4 space-y-3 border-l-2 border-zinc-800">
              {/* Outline Color */}
              <div className="flex items-center justify-between">
                <label className="text-xs text-zinc-400">Color</label>
                <input
                  type="color"
                  value={outlineColor}
                  onChange={(e) => setOutlineColor(e.target.value)}
                  className="w-8 h-6 rounded cursor-pointer bg-transparent"
                />
              </div>

              {/* Outline Width */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs text-zinc-400">Width</label>
                  <span className="text-xs text-zinc-500 font-mono">{outlineWidth}px</span>
                </div>
                <input
                  type="range"
                  min="0.5"
                  max="5"
                  step="0.5"
                  value={outlineWidth}
                  onChange={(e) => setOutlineWidth(parseFloat(e.target.value))}
                  className="w-full h-1.5 bg-zinc-700 rounded-lg appearance-none cursor-pointer accent-blue-500"
                />
              </div>
            </div>
          )}

          {/* Shadow Effects */}
          <div className="flex items-center justify-between">
            <label className="text-xs text-zinc-400 flex items-center gap-1.5">
              <Sun size={12} />
              Shadow Effects
            </label>
            <button
              onClick={() => setShowShadow(!showShadow)}
              className={`w-10 h-5 rounded-full transition-colors ${
                showShadow ? 'bg-blue-600' : 'bg-zinc-700'
              }`}
            >
              <div className={`w-4 h-4 rounded-full bg-white transition-transform ${
                showShadow ? 'translate-x-5' : 'translate-x-0.5'
              }`} />
            </button>
          </div>

          {/* Shadow Settings (show when shadow enabled) */}
          {showShadow && (
            <div className="pl-4 space-y-3 border-l-2 border-zinc-800">
              {/* Shadow Presets */}
              <div>
                <label className="text-xs text-zinc-500 mb-2 block">Presets</label>
                <div className="grid grid-cols-3 gap-1.5">
                  {SHADOW_PRESETS.map((preset) => (
                    <button
                      key={preset.name}
                      onClick={() => applyShadowPreset(preset)}
                      className={`px-2 py-1 rounded text-xs transition-colors ${
                        activeShadowPreset === preset.name
                          ? 'bg-blue-600 text-white'
                          : 'bg-zinc-800 text-zinc-400 hover:text-zinc-300 hover:bg-zinc-700'
                      }`}
                    >
                      {preset.name}
                    </button>
                  ))}
                </div>
                {activeShadowPreset === null && (
                  <p className="text-xs text-zinc-600 mt-1.5 italic">Custom settings</p>
                )}
              </div>

              {/* Manual Adjustments */}
              <div className="pt-2 border-t border-zinc-800/50">
                <label className="text-xs text-zinc-500 mb-2 block">Manual Adjustments</label>
                
                {/* Shadow Color */}
                <div className="flex items-center justify-between mb-3">
                  <label className="text-xs text-zinc-400">Color</label>
                  <input
                    type="color"
                    value={shadowColor}
                    onChange={(e) => setShadowColor(e.target.value)}
                    className="w-8 h-6 rounded cursor-pointer bg-transparent"
                  />
                </div>

                {/* Shadow Offset X */}
                <div className="mb-3">
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs text-zinc-400">Offset X</label>
                    <span className="text-xs text-zinc-500 font-mono">{shadowOffsetX}px</span>
                  </div>
                  <input
                    type="range"
                    min="-10"
                    max="10"
                    step="1"
                    value={shadowOffsetX}
                    onChange={(e) => setShadowOffsetX(parseFloat(e.target.value))}
                    className="w-full h-1.5 bg-zinc-700 rounded-lg appearance-none cursor-pointer accent-blue-500"
                  />
                </div>

                {/* Shadow Offset Y */}
                <div className="mb-3">
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs text-zinc-400">Offset Y</label>
                    <span className="text-xs text-zinc-500 font-mono">{shadowOffsetY}px</span>
                  </div>
                  <input
                    type="range"
                    min="-10"
                    max="10"
                    step="1"
                    value={shadowOffsetY}
                    onChange={(e) => setShadowOffsetY(parseFloat(e.target.value))}
                    className="w-full h-1.5 bg-zinc-700 rounded-lg appearance-none cursor-pointer accent-blue-500"
                  />
                </div>

                {/* Shadow Blur */}
                <div className="mb-3">
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs text-zinc-400">Blur</label>
                    <span className="text-xs text-zinc-500 font-mono">{shadowBlur}px</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="15"
                    step="1"
                    value={shadowBlur}
                    onChange={(e) => setShadowBlur(parseFloat(e.target.value))}
                    className="w-full h-1.5 bg-zinc-700 rounded-lg appearance-none cursor-pointer accent-blue-500"
                  />
                </div>

                {/* Shadow Opacity */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs text-zinc-400">Opacity</label>
                    <span className="text-xs text-zinc-500 font-mono">{Math.round(shadowOpacity * 100)}%</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.05"
                    value={shadowOpacity}
                    onChange={(e) => setShadowOpacity(parseFloat(e.target.value))}
                    className="w-full h-1.5 bg-zinc-700 rounded-lg appearance-none cursor-pointer accent-blue-500"
                  />
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Color Palette */}
      <div>
        <div className="flex items-center gap-2 text-sm font-medium text-zinc-300 mb-4">
          <Palette size={16} />
          Color Palette
        </div>
        <div className="grid grid-cols-2 gap-2">
          {PALETTES.map((p) => (
            <button
              key={p.name}
              onClick={() => setPalette(p)}
              className={`p-3 rounded-lg border-2 transition-all ${
                palette.name === p.name && !palette.isCustom
                  ? 'border-blue-500 bg-zinc-800'
                  : 'border-zinc-700 hover:border-zinc-600 bg-zinc-800/50'
              }`}
            >
              <div className="flex gap-1 mb-2">
                {p.colors.slice(2).map((color, i) => (
                  <div
                    key={i}
                    className="w-5 h-5 rounded"
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>
              <div className="text-xs text-zinc-400">{p.name}</div>
            </button>
          ))}
        </div>

        {/* Custom Palette */}
        <div className="mt-4">
          <button
            onClick={() => setIsEditingCustomPalette(!isEditingCustomPalette)}
            className={`w-full p-3 rounded-lg border-2 transition-all flex items-center justify-between ${
              palette.isCustom
                ? 'border-blue-500 bg-zinc-800'
                : 'border-zinc-700 hover:border-zinc-600 bg-zinc-800/50'
            }`}
          >
            <div className="flex items-center gap-3">
              <div className="flex gap-1">
                {customPalette.colors.slice(2).map((color, i) => (
                  <div
                    key={i}
                    className="w-5 h-5 rounded"
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>
              <div className="flex items-center gap-1.5">
                <Plus size={12} className="text-zinc-500" />
                <span className="text-xs text-zinc-400">Custom</span>
              </div>
            </div>
            {isEditingCustomPalette ? (
              <ChevronUp size={14} className="text-zinc-500" />
            ) : (
              <ChevronDown size={14} className="text-zinc-500" />
            )}
          </button>

          {/* Custom Palette Editor */}
          {isEditingCustomPalette && (
            <div className="mt-3 p-4 bg-zinc-800/50 rounded-lg border border-zinc-700 space-y-3">
              <p className="text-xs text-zinc-500 mb-3">
                Click a color to customize it
              </p>
              {customPalette.colors.map((color, index) => (
                <div key={index} className="flex items-center justify-between">
                  <label className="text-xs text-zinc-400">{COLOR_ROLES[index]}</label>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-zinc-600 font-mono uppercase">{color}</span>
                    <input
                      type="color"
                      value={color}
                      onChange={(e) => setCustomPaletteColor(index, e.target.value)}
                      className="w-8 h-6 rounded cursor-pointer bg-transparent border border-zinc-600"
                    />
                  </div>
                </div>
              ))}
              <button
                onClick={useCustomPalette}
                className="w-full mt-3 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors"
              >
                Apply Custom Palette
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Color Shimmer */}
      <div>
        <div className="flex items-center gap-2 text-sm font-medium text-zinc-300 mb-4">
          <Sparkles size={16} />
          Color Shimmer
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setShimmer(-1)}
            className={`flex-1 px-3 py-2 rounded-lg text-sm transition-colors ${
              shimmer < 0
                ? 'bg-blue-600 text-white'
                : 'bg-zinc-800 text-zinc-400 hover:text-zinc-300'
            }`}
          >
            Off
          </button>
          {[2, 3, 4].map((level) => (
            <button
              key={level}
              onClick={() => setShimmer(level)}
              className={`flex-1 px-3 py-2 rounded-lg text-sm transition-colors ${
                shimmer === level
                  ? 'bg-blue-600 text-white'
                  : 'bg-zinc-800 text-zinc-400 hover:text-zinc-300'
              }`}
            >
              {level}
            </button>
          ))}
        </div>
        <p className="text-xs text-zinc-500 mt-2">
          Adds color variation like kiln-fired tiles
        </p>
      </div>
    </div>
  );

  return (
    <div className="flex h-screen bg-zinc-950">
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex w-80 bg-zinc-900 border-r border-zinc-800 flex-col">
        {/* Header */}
        <div className="p-6 border-b border-zinc-800">
          <h1 className="text-xl font-bold text-white">Zellij Generator</h1>
          <p className="text-sm text-zinc-400 mt-1">
            Based on Craig Kaplan&apos;s research
          </p>
        </div>

        {/* Controls */}
        {renderControlsContent()}

        {/* Footer */}
        <div className="p-4 border-t border-zinc-800 text-center">
          <p className="text-xs text-zinc-500">
            Press <kbd className="px-1.5 py-0.5 bg-zinc-800 rounded text-zinc-400">Space</kbd> to generate new pattern
          </p>
        </div>
      </aside>

      {/* Mobile Layout */}
      <div className="flex flex-col md:hidden w-full h-screen">
        {/* Mobile Header with Menu Button */}
        <div className="flex items-center justify-between p-4 bg-zinc-900 border-b border-zinc-800">
          <div>
            <h1 className="text-lg font-bold text-white">Zellij Generator</h1>
            <p className="text-xs text-zinc-400">
              Based on Craig Kaplan&apos;s research
            </p>
          </div>
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 transition-colors"
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>

        {/* Mobile Canvas - Takes most of the screen */}
        <main className="flex-1 overflow-hidden relative">
          <Canvas ref={canvasRef} />
        </main>

        {/* Mobile Bottom Bar - Generate and Export */}
        <div className="bg-zinc-900 border-t border-zinc-800 p-4 space-y-3">
          {/* Generate Button */}
          <button
            onClick={regenerate}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
          >
            <Shuffle size={18} />
            {mode === 'random' ? 'Generate New Pattern' : 'Regenerate'}
          </button>

          {/* Export Buttons */}
          <div className="grid grid-cols-3 gap-2">
            <button
              onClick={exportSVG}
              className="flex items-center justify-center gap-1 px-3 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-lg text-sm transition-colors"
            >
              <FileCode size={14} />
              SVG
            </button>
            <button
              onClick={exportPNG}
              className="flex items-center justify-center gap-1 px-3 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-lg text-sm transition-colors"
            >
              <Image size={14} />
              PNG
            </button>
            <button
              onClick={copySVGToClipboard}
              className="flex items-center justify-center gap-1 px-3 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-lg text-sm transition-colors"
            >
              {copied ? <Check size={14} className="text-green-400" /> : <Copy size={14} />}
              {copied ? 'Copied' : 'Copy'}
            </button>
          </div>
        </div>

        {/* Mobile Sliding Drawer */}
        <div
          className={`fixed inset-y-0 right-0 w-80 bg-zinc-900 border-l border-zinc-800 z-50 transform transition-transform duration-300 ease-in-out overflow-hidden flex flex-col ${
            mobileMenuOpen ? 'translate-x-0' : 'translate-x-full'
          }`}
        >
          {/* Drawer Header */}
          <div className="flex items-center justify-between p-4 border-b border-zinc-800">
            <h2 className="text-lg font-bold text-white">Settings</h2>
            <button
              onClick={() => setMobileMenuOpen(false)}
              className="p-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 transition-colors"
              aria-label="Close menu"
            >
              <X size={20} />
            </button>
          </div>

          {/* Drawer Content */}
          {renderControlsContent()}

          {/* Drawer Footer */}
          <div className="p-4 border-t border-zinc-800 text-center">
            <p className="text-xs text-zinc-500">
              Press <kbd className="px-1.5 py-0.5 bg-zinc-800 rounded text-zinc-400">Space</kbd> to generate
            </p>
          </div>
        </div>

        {/* Mobile Drawer Overlay */}
        {mobileMenuOpen && (
          <div
            className="fixed inset-0 bg-black/50 z-40 md:hidden"
            onClick={() => setMobileMenuOpen(false)}
          />
        )}
      </div>

      {/* Desktop Main Canvas */}
      <main className="hidden md:flex flex-1 overflow-hidden">
        <Canvas ref={canvasRef} />
      </main>
    </div>
  );
}
