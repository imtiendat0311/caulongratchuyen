'use client';

import React, { useState, useMemo, useRef } from 'react';
import { motion, AnimatePresence, useInView } from 'framer-motion';
import { TrendingUp, TrendingDown } from 'lucide-react';

export interface GraphDataPoint {
  value: number;
  label?: string;
  subLabel?: string;
  formattedValue?: string;
}

export interface SimpleGraphProps {
  data: GraphDataPoint[];
  lineColor?: string;
  dotColor?: string;
  width?: string | number;
  height?: number;
  animationDuration?: number;
  showGrid?: boolean;
  gridStyle?: 'solid' | 'dashed' | 'dotted';
  gridLines?: 'vertical' | 'horizontal' | 'both';
  gridLineThickness?: number;
  showDots?: boolean;
  dotSize?: number;
  dotHoverGlow?: boolean;
  curved?: boolean;
  gradientFade?: boolean;
  graphLineThickness?: number;
  calculatePercentageDifference?: boolean;
  animateOnScroll?: boolean;
  animateOnce?: boolean;
  className?: string;
  valueFormatter?: (val: number) => string;
}

export function SimpleGraph({
  data = [],
  lineColor = '#10B981',
  dotColor,
  width = '100%',
  height = 320,
  animationDuration = 1.5,
  showGrid = true,
  gridStyle = 'dashed',
  gridLines = 'both',
  gridLineThickness = 1,
  showDots = true,
  dotSize = 6,
  dotHoverGlow = true,
  curved = true,
  gradientFade = true,
  graphLineThickness = 3,
  calculatePercentageDifference = false,
  animateOnScroll = false,
  animateOnce = true,
  className = '',
  valueFormatter
}: SimpleGraphProps) {
  const [activePoint, setActivePoint] = useState<number | null>(null);
  const [tooltipX, setTooltipX] = useState(0);
  const [tooltipRotate, setTooltipRotate] = useState(0);

  const containerRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);

  const inView = useInView(containerRef, { once: animateOnce, amount: 0.3 });
  const shouldAnimate = !animateOnScroll || inView;

  const activeDotColor = dotColor || lineColor;

  // Process data points and SVG coordinates (viewBox 0 0 800 400)
  const { points, pathD, areaD, yGridLabels } = useMemo(() => {
    if (!data || data.length === 0) {
      return { points: [], pathD: '', areaD: '', yGridLabels: [] };
    }

    const values = data.map((d) => d.value);
    const minVal = Math.min(...values);
    const maxVal = Math.max(...values);
    const range = maxVal - minVal || 1;
    // Add 12% padding top & bottom so extremes don't clip against boundaries
    const paddedMin = minVal - range * 0.12;
    const paddedRange = (maxVal + range * 0.12) - paddedMin || 1;

    // Generate 5 Y-axis grid label values
    const yGridLabels = [0, 1, 2, 3, 4].map((i) => {
      const yVal = paddedMin + ((4 - i) / 4) * paddedRange;
      const formatted = valueFormatter ? valueFormatter(yVal) : Math.round(yVal).toLocaleString();
      return { y: 40 + (320 * i) / 4, label: formatted };
    });

    const pts = data.map((item, idx) => ({
      x: 48 + (idx / (data.length - 1 || 1)) * 704,
      y: 360 - ((item.value - paddedMin) / paddedRange) * 320,
      value: item.value,
      label: item.label,
      subLabel: item.subLabel,
      formattedValue: item.formattedValue || (valueFormatter ? valueFormatter(item.value) : item.value.toLocaleString())
    }));

    // SVG Line Path
    let lineD = '';
    if (pts.length > 0) {
      if (curved && pts.length > 1) {
        lineD = `M ${pts[0].x},${pts[0].y}`;
        for (let i = 0; i < pts.length - 1; i++) {
          const curr = pts[i];
          const next = pts[i + 1];
          const midX = curr.x + (next.x - curr.x) * 0.5;
          lineD += ` C ${midX},${curr.y} ${midX},${next.y} ${next.x},${next.y}`;
        }
      } else {
        lineD = pts.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x},${p.y}`).join(' ');
      }
    }

    // SVG Gradient Fill Area Path
    let fillD = '';
    if (gradientFade && pts.length > 0) {
      fillD = `M ${pts[0].x},360 L ${pts[0].x},${pts[0].y}`;
      if (curved && pts.length > 1) {
        for (let i = 0; i < pts.length - 1; i++) {
          const curr = pts[i];
          const next = pts[i + 1];
          const midX = curr.x + (next.x - curr.x) * 0.5;
          fillD += ` C ${midX},${curr.y} ${midX},${next.y} ${next.x},${next.y}`;
        }
      } else {
        for (let i = 1; i < pts.length; i++) {
          fillD += ` L ${pts[i].x},${pts[i].y}`;
        }
      }
      fillD += ` L ${pts[pts.length - 1].x},360 Z`;
    }

    return { points: pts, pathD: lineD, areaD: fillD, yGridLabels };
  }, [data, curved, gradientFade, valueFormatter]);

  const handleMouseMove = (e: React.MouseEvent<SVGGElement>, index: number) => {
    if (!svgRef.current) return;
    const svg = svgRef.current;
    const pt = svg.createSVGPoint();
    pt.x = e.clientX;
    pt.y = e.clientY;
    const ctm = svg.getScreenCTM();
    if (!ctm) return;
    const svgP = pt.matrixTransform(ctm.inverse());
    const dotX = points[index].x;
    const deltaX = svgP.x - dotX;
    const tX = Math.max(-15, Math.min(15, deltaX * 0.2));
    const tRot = Math.max(-20, Math.min(20, deltaX * 0.15));
    setTooltipX(tX);
    setTooltipRotate(tRot);
  };

  const getPercentageChange = (idx: number) => {
    if (!calculatePercentageDifference || idx === 0 || !data[idx - 1]) return null;
    const curr = data[idx].value;
    const prev = data[idx - 1].value;
    if (prev === 0) return null;
    const diff = curr - prev;
    return {
      percentage: Math.abs((diff / Math.abs(prev)) * 100),
      isIncrease: diff >= 0
    };
  };

  // Generate unique gradient ID to prevent collisions when multiple graphs render
  const gradientId = useMemo(
    () => `graph-gradient-${Math.random().toString(36).substring(2, 9)}`,
    []
  );

  const containerWidth = typeof width === 'number' ? `${width}px` : width;

  if (!data || data.length === 0) {
    return (
      <div
        className={`relative flex items-center justify-center border border-dashed border-[var(--border)] rounded-2xl bg-[var(--bg)] p-8 text-center text-sm text-[var(--muted)] ${className}`}
        style={{ width: containerWidth, height: `${height}px` }}
      >
        Chưa có dữ liệu lịch sử để hiển thị biểu đồ
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className={`relative select-none ${className}`}
      style={{ width: containerWidth, height: `${height}px` }}
    >
      <svg
        ref={svgRef}
        viewBox="0 0 800 400"
        className="w-full h-full overflow-visible"
      >
        <defs>
          <linearGradient id={gradientId} x1="0" y1="40" x2="0" y2="360" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor={lineColor} stopOpacity="0.35" />
            <stop offset="85%" stopColor={lineColor} stopOpacity="0.05" />
            <stop offset="100%" stopColor={lineColor} stopOpacity="0" />
          </linearGradient>
        </defs>

        {/* Grid lines */}
        {showGrid && (
          <g opacity="0.12" className="text-[var(--text)]">
            {(gridLines === 'horizontal' || gridLines === 'both') &&
              [0, 1, 2, 3, 4].map((i) => (
                <line
                  key={`h-${i}`}
                  x1="48"
                  y1={40 + (320 * i) / 4}
                  x2="752"
                  y2={40 + (320 * i) / 4}
                  stroke="currentColor"
                  strokeWidth={gridLineThickness}
                  strokeDasharray={
                    gridStyle === 'dashed' ? '5,5' : gridStyle === 'dotted' ? '2,4' : undefined
                  }
                />
              ))}

            {(gridLines === 'vertical' || gridLines === 'both') &&
              points.map((p, idx) => (
                <line
                  key={`v-${idx}`}
                  x1={p.x}
                  y1="40"
                  x2={p.x}
                  y2="360"
                  stroke="currentColor"
                  strokeWidth={gridLineThickness}
                  strokeDasharray={
                    gridStyle === 'dashed' ? '5,5' : gridStyle === 'dotted' ? '2,4' : undefined
                  }
                />
              ))}
          </g>
        )}

        {/* X-axis date labels */}
        <g className="text-[var(--muted)] fill-current text-[11px] font-medium pointer-events-none">
          {points.map((p, idx) => (
            <text
              key={`label-${idx}`}
              x={p.x}
              y="386"
              textAnchor="middle"
              className="select-none"
            >
              {p.label || `#${idx + 1}`}
            </text>
          ))}
        </g>

        {/* Gradient fill area */}
        {gradientFade && areaD && (
          <motion.path
            d={areaD}
            fill={`url(#${gradientId})`}
            initial={{ opacity: 0 }}
            animate={{ opacity: shouldAnimate ? 1 : 0 }}
            transition={{ duration: 0.6, delay: animationDuration * 0.4, ease: 'easeInOut' }}
          />
        )}

        {/* Animated main graph line */}
        {pathD && (
          <motion.path
            d={pathD}
            fill="none"
            stroke={lineColor}
            strokeWidth={graphLineThickness}
            strokeLinecap="round"
            strokeLinejoin="round"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: shouldAnimate ? 1 : 0 }}
            transition={{ duration: animationDuration, ease: 'easeInOut' }}
          />
        )}

        {/* Data points */}
        {showDots &&
          points.map((p, idx) => (
            <g
              key={`dot-${idx}`}
              onMouseEnter={() => {
                setActivePoint(idx);
                setTooltipX(0);
                setTooltipRotate(0);
              }}
              onMouseLeave={() => setActivePoint(null)}
              onMouseMove={(e) => handleMouseMove(e, idx)}
              style={{ cursor: 'pointer' }}
            >
              {/* Invisible large tap target for easy desktop & mobile touch */}
              <circle cx={p.x} cy={p.y} r="32" fill="transparent" style={{ pointerEvents: 'all' }} />

              {/* Dot hover glow */}
              {dotHoverGlow && activePoint === idx && (
                <motion.circle
                  cx={p.x}
                  cy={p.y}
                  r={dotSize * 2.5}
                  fill={activeDotColor}
                  initial={{ opacity: 0, scale: 0.5 }}
                  animate={{ opacity: 0.4, scale: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  style={{ filter: 'blur(6px)', pointerEvents: 'none' }}
                />
              )}

              {/* Main dot circle */}
              <motion.circle
                cx={p.x}
                cy={p.y}
                r={dotSize}
                fill={activeDotColor}
                stroke="white"
                strokeWidth="2"
                style={{ pointerEvents: 'none' }}
                initial={{ scale: 0, opacity: 0 }}
                animate={{
                  scale: activePoint === idx ? 1.5 : 1,
                  opacity: shouldAnimate ? 1 : 0
                }}
                transition={{
                  scale: { type: 'spring', stiffness: 400, damping: 25 },
                  opacity: {
                    duration: 0.3,
                    delay: (idx / (points.length - 1 || 1)) * animationDuration
                  }
                }}
              />
            </g>
          ))}

        {/* Interactive Magnetic Spring Tooltip */}
        <AnimatePresence>
          {activePoint !== null && points[activePoint] && (
            <foreignObject
              x={points[activePoint].x - 85}
              y={points[activePoint].y - 92}
              width="170"
              height="92"
              style={{ overflow: 'visible', pointerEvents: 'none' }}
            >
              <motion.div
                initial={{ opacity: 0, scale: 0.8, y: 6 }}
                animate={{
                  opacity: 1,
                  scale: 1,
                  y: 0,
                  x: tooltipX,
                  rotate: tooltipRotate
                }}
                exit={{ opacity: 0, scale: 0.8, y: 6 }}
                transition={{
                  duration: 0.15,
                  x: { type: 'spring', stiffness: 320, damping: 28 },
                  rotate: { type: 'spring', stiffness: 320, damping: 28 }
                }}
                className="flex items-center justify-center w-full h-full pointer-events-none"
              >
                <div className="relative">
                  <div className="bg-[var(--card)] text-[var(--text)] px-3 py-2 rounded-xl shadow-xl border border-[var(--border)] whitespace-nowrap text-center backdrop-blur-md">
                    {calculatePercentageDifference && activePoint > 0 ? (
                      (() => {
                        const change = getPercentageChange(activePoint);
                        if (!change) {
                          return (
                            <div className="text-xs font-bold text-[var(--text)]">
                              {points[activePoint].formattedValue}
                            </div>
                          );
                        }
                        return (
                          <div className="flex items-center justify-center gap-1">
                            {change.isIncrease ? (
                              <TrendingUp className="w-3.5 h-3.5 text-emerald-500" />
                            ) : (
                              <TrendingDown className="w-3.5 h-3.5 text-rose-500" />
                            )}
                            <span
                              className={`text-xs font-bold ${
                                change.isIncrease ? 'text-emerald-500' : 'text-rose-500'
                              }`}
                            >
                              {change.isIncrease ? '+' : '-'}
                              {change.percentage.toFixed(1)}%
                            </span>
                            <span className="text-[10px] text-[var(--muted)]">
                              ({points[activePoint].formattedValue})
                            </span>
                          </div>
                        );
                      })()
                    ) : (
                      <div className="text-xs font-bold text-[var(--text)]">
                        {points[activePoint].formattedValue}
                      </div>
                    )}

                    {points[activePoint].label && (
                      <div className="text-[10px] text-[var(--muted)] mt-0.5">
                        {points[activePoint].label}
                        {points[activePoint].subLabel && (
                          <span className="ml-1 opacity-75">· {points[activePoint].subLabel}</span>
                        )}
                      </div>
                    )}
                  </div>
                  {/* Tooltip triangle arrow */}
                  <div
                    className="absolute left-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-l-transparent border-r-transparent border-t-[var(--card)]"
                    style={{ bottom: '-4px', transform: 'translateX(-50%)' }}
                  />
                </div>
              </motion.div>
            </foreignObject>
          )}
        </AnimatePresence>
      </svg>
    </div>
  );
}

export default SimpleGraph;
