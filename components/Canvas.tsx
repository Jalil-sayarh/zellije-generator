'use client';

import React, { useRef, useEffect, useState, useMemo, useImperativeHandle, forwardRef } from 'react';
import { useZellijeStore } from '@/lib/hooks/useZellijeStore';
import { generateZellij, RenderedShape } from '@/lib/zellij/zellij';

export interface CanvasHandle {
  getSvgElement: () => SVGSVGElement | null;
}

const Canvas = forwardRef<CanvasHandle>(function Canvas(_, ref) {
  const containerRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const [dimensions, setDimensions] = useState({ width: 800, height: 600 });
  const [mounted, setMounted] = useState(false);

  const { palette, shimmer, seed } = useZellijeStore();

  // Expose getSvgElement to parent
  useImperativeHandle(ref, () => ({
    getSvgElement: () => svgRef.current,
  }));

  // Mark as mounted on client
  useEffect(() => {
    setMounted(true);
  }, []);

  // Handle resize
  useEffect(() => {
    const updateDimensions = () => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        setDimensions({
          width: rect.width || 800,
          height: rect.height || 600,
        });
      }
    };

    updateDimensions();
    window.addEventListener('resize', updateDimensions);
    return () => window.removeEventListener('resize', updateDimensions);
  }, []);

  // Generate pattern only on client
  const shapes = useMemo<RenderedShape[]>(() => {
    if (!mounted) return [];
    if (dimensions.width < 100 || dimensions.height < 100) return [];

    try {
      return generateZellij({
        seed,
        width: dimensions.width,
        height: dimensions.height,
        palette: palette.colors,
        shimmer,
      });
    } catch (error) {
      console.error('Error generating Zellij:', error);
      return [];
    }
  }, [mounted, seed, dimensions.width, dimensions.height, palette.colors, shimmer]);

  // Convert path to SVG path string
  const pathToSvg = (points: { x: number; y: number }[]): string => {
    if (points.length === 0) return '';
    let d = `M ${points[0].x} ${points[0].y}`;
    for (let i = 1; i < points.length; i++) {
      d += ` L ${points[i].x} ${points[i].y}`;
    }
    d += ' Z';
    return d;
  };

  const bgColor = palette.colors[0];

  return (
    <div
      ref={containerRef}
      className="w-full h-full"
      style={{ background: bgColor }}
    >
      <svg
        ref={svgRef}
        width={dimensions.width}
        height={dimensions.height}
        viewBox={`0 0 ${dimensions.width} ${dimensions.height}`}
        style={{ display: 'block' }}
        xmlns="http://www.w3.org/2000/svg"
      >
        <rect x="0" y="0" width={dimensions.width} height={dimensions.height} fill={bgColor} />
        {shapes.map((shape, index) => (
          <path
            key={index}
            d={pathToSvg(shape.path)}
            fill={shape.color}
            stroke="none"
          />
        ))}
      </svg>
    </div>
  );
});

export default Canvas;
