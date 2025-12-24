'use client';

import React, { useRef, useCallback } from 'react';
import { Shuffle, Sparkles, Palette, Download, Image, FileCode } from 'lucide-react';
import Canvas from './Canvas';
import { useZellijeStore, PALETTES } from '@/lib/hooks/useZellijeStore';

export function Layout() {
  const { palette, shimmer, setPalette, setShimmer, regenerate } = useZellijeStore();
  const canvasRef = useRef<{ getSvgElement: () => SVGSVGElement | null }>(null);

  const exportSVG = useCallback(() => {
    const svg = canvasRef.current?.getSvgElement();
    if (!svg) return;

    const serializer = new XMLSerializer();
    const svgString = serializer.serializeToString(svg);
    const blob = new Blob([svgString], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = `zellij-${Date.now()}.svg`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, []);

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
        a.download = `zellij-${Date.now()}.png`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(pngUrl);
      }, 'image/png');
      
      URL.revokeObjectURL(url);
    };
    img.src = url;
  }, []);

  return (
    <div className="flex h-screen bg-zinc-950">
      {/* Sidebar */}
      <aside className="w-80 bg-zinc-900 border-r border-zinc-800 flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-zinc-800">
          <h1 className="text-xl font-bold text-white">Zellij Generator</h1>
          <p className="text-sm text-zinc-400 mt-1">
            Based on Craig Kaplan's research
          </p>
        </div>

        {/* Controls */}
        <div className="flex-1 overflow-y-auto p-6 space-y-8">
          {/* Generate Button */}
          <button
            onClick={regenerate}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
          >
            <Shuffle size={18} />
            Generate New Pattern
          </button>

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
                    palette.name === p.name
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

          {/* Export */}
          <div>
            <div className="flex items-center gap-2 text-sm font-medium text-zinc-300 mb-4">
              <Download size={16} />
              Export
            </div>
            <div className="flex gap-2">
              <button
                onClick={exportSVG}
                className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-lg text-sm transition-colors"
              >
                <FileCode size={16} />
                SVG
              </button>
              <button
                onClick={exportPNG}
                className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-lg text-sm transition-colors"
              >
                <Image size={16} />
                PNG
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-zinc-800 text-center">
          <p className="text-xs text-zinc-500">
            Press Space or click Generate for new pattern
          </p>
        </div>
      </aside>

      {/* Main Canvas */}
      <main className="flex-1 overflow-hidden">
        <Canvas ref={canvasRef} />
      </main>
    </div>
  );
}
