import React, { useRef, useState, useEffect } from 'react';
import { DetectedItem } from '../types';

interface BoundingBoxViewerProps {
  imageUrl: string;
  detectedItems: DetectedItem[];
  selectedIndex?: number | null;
  onSelectItem?: (index: number) => void;
}

export const BoundingBoxViewer: React.FC<BoundingBoxViewerProps> = ({
  imageUrl,
  detectedItems,
  selectedIndex,
  onSelectItem,
}) => {
  const imgRef = useRef<HTMLImageElement>(null);
  const [scale, setScale] = useState({ scaleX: 1, scaleY: 1 });

  const updateScale = () => {
    if (imgRef.current) {
      const naturalWidth = imgRef.current.naturalWidth || 640;
      const naturalHeight = imgRef.current.naturalHeight || 640;
      const clientWidth = imgRef.current.clientWidth;
      const clientHeight = imgRef.current.clientHeight;

      setScale({
        scaleX: clientWidth / naturalWidth,
        scaleY: clientHeight / naturalHeight,
      });
    }
  };

  useEffect(() => {
    window.addEventListener('resize', updateScale);
    return () => window.removeEventListener('resize', updateScale);
  }, []);

  return (
    <div className="relative inline-block w-full overflow-hidden rounded-2xl border border-cream-200 bg-black/5 shadow-premium">
      <img
        ref={imgRef}
        src={imageUrl}
        alt="Analyzed food ingredients"
        onLoad={updateScale}
        className="w-full h-auto object-contain block max-h-[500px]"
      />

      {/* SVG overlay for bounding boxes */}
      <svg
        className="absolute inset-0 w-full h-full pointer-events-none"
        style={{ width: '100%', height: '100%' }}
      >
        {detectedItems.map((item, idx) => {
          const [x1, y1, x2, y2] = item.box;
          const left = x1 * scale.scaleX;
          const top = y1 * scale.scaleY;
          const width = (x2 - x1) * scale.scaleX;
          const height = (y2 - y1) * scale.scaleY;

          const isSelected = selectedIndex === idx;

          return (
            <g
              key={idx}
              className="pointer-events-auto cursor-pointer transition-opacity"
              onClick={() => onSelectItem && onSelectItem(idx)}
            >
              {/* Box border */}
              <rect
                x={left}
                y={top}
                width={width}
                height={height}
                fill={isSelected ? 'rgba(45, 129, 88, 0.25)' : 'rgba(45, 129, 88, 0.12)'}
                stroke={isSelected ? '#143627' : '#2D8158'}
                strokeWidth={isSelected ? '3' : '2'}
                rx="6"
                className="transition-all duration-150"
              />

              {/* Tag label */}
              <foreignObject
                x={left}
                y={Math.max(0, top - 26)}
                width="200"
                height="30"
              >
                <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-forest-800 text-white text-[11px] font-semibold shadow-md whitespace-nowrap">
                  <span className="capitalize">{item.name}</span>
                  <span className="text-emerald-300 font-mono text-[10px]">
                    {Math.round(item.confidence * 100)}%
                  </span>
                </div>
              </foreignObject>
            </g>
          );
        })}
      </svg>
    </div>
  );
};
