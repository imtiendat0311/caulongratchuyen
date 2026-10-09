"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Sparkles, Sun, Compass } from "lucide-react";
import SideRays, { SideRaysOrigin } from "./SideRays";

interface SideRaysModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const PRESETS = [
  {
    name: "Golden Sun & Sky",
    icon: "☀️",
    color1: "#EAB308",
    color2: "#96c8ff",
  },
  {
    name: "Sân Cầu Lông Emerald",
    icon: "🏸",
    color1: "#10b981",
    color2: "#a3e635",
  },
  {
    name: "Hoàng Hôn Sunset",
    icon: "🌅",
    color1: "#f43f5e",
    color2: "#fb923c",
  },
  {
    name: "Cyber Violet & Cyan",
    icon: "🌌",
    color1: "#a855f7",
    color2: "#38bdf8",
  },
  {
    name: "Moonlight Silver",
    icon: "🌙",
    color1: "#f8fafc",
    color2: "#94a3b8",
  },
];

const ORIGINS: { id: SideRaysOrigin; label: string }[] = [
  { id: "top-right", label: "Trên phải" },
  { id: "top-left", label: "Trên trái" },
  { id: "bottom-right", label: "Dưới phải" },
  { id: "bottom-left", label: "Dưới trái" },
];

export function SideRaysModal({ isOpen, onClose }: SideRaysModalProps) {
  const [selectedPreset, setSelectedPreset] = useState(0);
  const [origin, setOrigin] = useState<SideRaysOrigin>("top-right");
  const [speed, setSpeed] = useState(2.5);
  const [intensity, setIntensity] = useState(3.0);
  const [spread, setSpread] = useState(3.0);
  const [tilt, setTilt] = useState(0);

  if (!isOpen) return null;

  const currentPreset = PRESETS[selectedPreset];

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-black/75 backdrop-blur-md"
        />

        {/* Modal Window */}
        <motion.div
          initial={{ opacity: 0, scale: 0.94, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.94, y: 15 }}
          transition={{ type: "spring", damping: 26, stiffness: 320 }}
          className="relative w-full max-w-4xl bg-[var(--card)] border border-[var(--border)] rounded-3xl shadow-2xl overflow-hidden z-10 flex flex-col max-h-[92vh]"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--border)] bg-[var(--card)]/90 backdrop-blur-sm">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-amber-500 to-sky-400 flex items-center justify-center text-white shadow-xs">
                <Sun className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-base font-bold text-[var(--text)] flex items-center gap-2">
                  <span>Side Rays Background</span>
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                    React Bits
                  </span>
                </h3>
                <p className="text-xs text-[var(--muted)]">
                  Shader luồng tia sáng thể tích (Volumetric Light Rays) lan tỏa từ cạnh viền
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-2 rounded-xl text-[var(--muted)] hover:text-[var(--text)] hover:bg-[var(--bg)] transition-colors cursor-pointer"
              title="Đóng"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Interactive Canvas Viewport */}
          <div className="relative w-full h-[380px] sm:h-[460px] md:h-[500px] bg-slate-950 overflow-hidden flex-shrink-0">
            <SideRays
              key={`${currentPreset.name}-${origin}`}
              origin={origin}
              rayColor1={currentPreset.color1}
              rayColor2={currentPreset.color2}
              speed={speed}
              intensity={intensity}
              spread={spread}
              tilt={tilt}
              saturation={1.5}
              blend={0.75}
              falloff={1.6}
              opacity={1.0}
            />

            {/* Subtle Overlay Hint */}
            <div className="absolute bottom-3 left-4 pointer-events-none text-[11px] text-white/80 font-medium px-2.5 py-1 rounded-full bg-black/40 backdrop-blur-md border border-white/10 flex items-center gap-1.5 shadow-sm">
              <Sparkles className="w-3 h-3 text-amber-300" />
              <span>Góc chiếu: {ORIGINS.find((o) => o.id === origin)?.label}</span>
            </div>
          </div>

          {/* Controls & Preset Selector */}
          <div className="p-4 sm:p-5 bg-[var(--card)] border-t border-[var(--border)] overflow-y-auto space-y-4">
            {/* Origin & Presets row */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold text-[var(--muted)] uppercase tracking-wider block mb-2 flex items-center gap-1.5">
                  <Compass className="w-3.5 h-3.5 text-amber-500" />
                  <span>Hướng phát tia sáng (Origin)</span>
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {ORIGINS.map((orig) => (
                    <button
                      key={orig.id}
                      type="button"
                      onClick={() => setOrigin(orig.id)}
                      className={`px-3 py-2 rounded-xl text-xs font-medium border transition-all cursor-pointer ${
                        origin === orig.id
                          ? "border-[var(--accent)] bg-[var(--accent)]/10 text-[var(--text)] font-semibold shadow-xs"
                          : "border-[var(--border)] hover:bg-[var(--bg)] text-[var(--muted)]"
                      }`}
                    >
                      {orig.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-[var(--muted)] uppercase tracking-wider block mb-2">
                  Bảng phối màu tia sáng (Color Presets)
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {PRESETS.map((preset, idx) => (
                    <button
                      key={preset.name}
                      type="button"
                      onClick={() => setSelectedPreset(idx)}
                      className={`flex items-center gap-2 px-2.5 py-2 rounded-xl text-xs font-medium border transition-all cursor-pointer ${
                        selectedPreset === idx
                          ? "border-[var(--accent)] bg-[var(--accent)]/10 text-[var(--text)] font-semibold shadow-xs"
                          : "border-[var(--border)] hover:bg-[var(--bg)] text-[var(--muted)]"
                      }`}
                    >
                      <span>{preset.icon}</span>
                      <span className="truncate">{preset.name}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Sliders */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
              <div className="p-2.5 rounded-xl bg-[var(--bg)] border border-[var(--border)]">
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-[var(--muted)] font-medium">Tốc độ tia</span>
                  <span className="font-semibold text-[var(--text)]">{speed.toFixed(1)}x</span>
                </div>
                <input
                  type="range"
                  min="0.5"
                  max="5.0"
                  step="0.2"
                  value={speed}
                  onChange={(e) => setSpeed(parseFloat(e.target.value))}
                  className="w-full accent-[var(--accent)] cursor-pointer"
                />
              </div>

              <div className="p-2.5 rounded-xl bg-[var(--bg)] border border-[var(--border)]">
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-[var(--muted)] font-medium">Cường độ sáng</span>
                  <span className="font-semibold text-[var(--text)]">{intensity.toFixed(1)}</span>
                </div>
                <input
                  type="range"
                  min="0.5"
                  max="4.0"
                  step="0.2"
                  value={intensity}
                  onChange={(e) => setIntensity(parseFloat(e.target.value))}
                  className="w-full accent-[var(--accent)] cursor-pointer"
                />
              </div>

              <div className="p-2.5 rounded-xl bg-[var(--bg)] border border-[var(--border)]">
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-[var(--muted)] font-medium">Độ tản tia</span>
                  <span className="font-semibold text-[var(--text)]">{spread.toFixed(1)}</span>
                </div>
                <input
                  type="range"
                  min="0.5"
                  max="3.5"
                  step="0.1"
                  value={spread}
                  onChange={(e) => setSpread(parseFloat(e.target.value))}
                  className="w-full accent-[var(--accent)] cursor-pointer"
                />
              </div>

              <div className="p-2.5 rounded-xl bg-[var(--bg)] border border-[var(--border)]">
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-[var(--muted)] font-medium">Góc nghiêng</span>
                  <span className="font-semibold text-[var(--text)]">{tilt}°</span>
                </div>
                <input
                  type="range"
                  min="-30"
                  max="30"
                  step="2"
                  value={tilt}
                  onChange={(e) => setTilt(parseFloat(e.target.value))}
                  className="w-full accent-[var(--accent)] cursor-pointer"
                />
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}

export default SideRaysModal;
