"use client";

import React from "react";

interface PixelSvgProps {
  rows: string[];
  colorMap: Record<string, string>;
  viewBox: string;
  className?: string;
  title?: string;
}

export function PixelSvg({
  rows,
  colorMap,
  viewBox,
  className,
  title,
}: PixelSvgProps) {
  const rects: { x: number; y: number; fill: string; key: string }[] = [];

  rows.forEach((row, y) => {
    row.split("").forEach((ch, x) => {
      if (ch === ".") return;
      const color = colorMap[ch];
      if (!color) return;
      rects.push({ x, y, fill: color, key: `${x}-${y}` });
    });
  });

  return (
    <svg
      viewBox={viewBox}
      className={className}
      shapeRendering="crispEdges"
      role="img"
      aria-label={title}
    >
      {title && <title>{title}</title>}
      {rects.map((r) => (
        <rect
          key={r.key}
          x={r.x}
          y={r.y}
          width={1}
          height={1}
          fill={r.fill}
        />
      ))}
    </svg>
  );
}

export function PixelCat({ className = "w-8 h-8" }: { className?: string }) {
  const rows = [
    ".##..##.",
    "##@@@@##",
    "#@O@@O@#",
    "#@@##@@#",
    "#@@NN@@#",
    "##@@@@##",
    ".######.",
    "..#..#..",
  ];
  const colorMap: Record<string, string> = {
    "#": "#334155",
    "@": "#7dd3fc",
    O: "#ffffff",
    N: "#fb7185",
  };

  return (
    <PixelSvg
      rows={rows}
      colorMap={colorMap}
      viewBox="0 0 8 8"
      className={className}
      title="Mascot Mèo Cầu Lông"
    />
  );
}

export function PixelRacket({ className = "w-7 h-10" }: { className?: string }) {
  const rows = [
    ".RRRRR.",
    "R.....R",
    "R.R.R.R",
    "R.....R",
    "R.R.R.R",
    "R.....R",
    ".RRRRR.",
    "..H.H..",
    "..H.H..",
    "..HHH..",
  ];
  const colorMap: Record<string, string> = {
    R: "#64748b",
    H: "#92400e",
  };

  return (
    <PixelSvg
      rows={rows}
      colorMap={colorMap}
      viewBox="0 0 7 10"
      className={className}
      title="Vợt Cầu Lông"
    />
  );
}
