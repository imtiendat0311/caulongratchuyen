"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Sparkles, Sliders, Waves } from "lucide-react";
import GradientWaves from "./GradientWaves";

interface GradientWavesModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const PRESETS = [
  {
    name: "Signature React Bits",
    icon: "✨",
    horizon: "#5227FF",
    wave: "#FF9FFC",
    crest: "#FFFFFF",
  },
  {
    name: "Sân Cầu Lông Emerald",
    icon: "🏸",
    horizon: "#064e3b",
    wave: "#10b981",
    crest: "#ecfdf5",
  },
  {
    name: "Hoàng Hôn Sunset",
    icon: "🌅",
    horizon: "#4c0519",
    wave: "#f43f5e",
    crest: "#fef08a",
  },
  {
    name: "Cyber Ocean",
    icon: "🌊",
    horizon: "#0f172a",
    wave: "#06b6d4",
    crest: "#e0f2fe",
  },
];

export function GradientWavesModal({ isOpen, onClose }: GradientWavesModalProps) {
  const [selectedPreset, setSelectedPreset] = useState(0);
  const [speed, setSpeed] = useState(0.4);
  const [amplitude, setAmplitude] = useState(2.5);
  const [grain, setGrain] = useState(true);

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
              <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-indigo-500 to-pink-500 flex items-center justify-center text-white shadow-xs">
                <Waves className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-base font-bold text-[var(--text)] flex items-center gap-2">
                  <span>GradientWaves</span>
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-500 border border-indigo-500/20">
                    React Bits
                  </span>
                </h3>
                <p className="text-xs text-[var(--muted)]">
                  Shader 3D Raymarching Plasma Wave tương tác chuyển động theo con trỏ chuột
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
          <div className="relative w-full h-[380px] sm:h-[460px] md:h-[520px] bg-black overflow-hidden flex-shrink-0">
            <GradientWaves
              key={`${currentPreset.name}-${grain}`}
              horizonColor={currentPreset.horizon}
              waveColor={currentPreset.wave}
              crestColor={currentPreset.crest}
              speed={speed}
              amplitude={amplitude}
              waveScale={0.6}
              waveRatio={0.9}
              swell={35}
              turbulence={20}
              tilt={1.11}
              zoom={1.0}
              height={5.5}
              fogDepth={15}
              detail="medium"
              brightness={1.0}
              opacity={1.0}
              mouseInteraction={true}
              parallaxStrength={0.5}
              grain={grain}
              grainIntensity={0.05}
            />

            {/* Subtle Overlay Hint */}
            <div className="absolute bottom-3 left-4 pointer-events-none text-[11px] text-white/70 font-medium px-2.5 py-1 rounded-full bg-black/40 backdrop-blur-md border border-white/10 flex items-center gap-1.5">
              <Sparkles className="w-3 h-3 text-pink-300" />
              <span>Di chuột trên bề mặt để xoay góc nhìn 3D</span>
            </div>
          </div>

          {/* Controls & Preset Selector */}
          <div className="p-4 sm:p-5 bg-[var(--card)] border-t border-[var(--border)] overflow-y-auto space-y-4">
            {/* Presets */}
            <div>
              <label className="text-xs font-semibold text-[var(--muted)] uppercase tracking-wider block mb-2">
                Bảng màu sắc phối (Color Presets)
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {PRESETS.map((preset, idx) => (
                  <button
                    key={preset.name}
                    type="button"
                    onClick={() => setSelectedPreset(idx)}
                    className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium border transition-all cursor-pointer ${
                      selectedPreset === idx
                        ? "border-[var(--accent)] bg-[var(--accent)]/10 text-[var(--text)] font-semibold shadow-xs"
                        : "border-[var(--border)] hover:bg-[var(--bg)] text-[var(--muted)]"
                    }`}
                  >
                    <span>{preset.icon}</span>
                    <span className="truncate">{preset.name}</span>
                    <div
                      className="w-3 h-3 rounded-full ml-auto border border-white/20 shrink-0"
                      style={{
                        background: `linear-gradient(135deg, ${preset.horizon}, ${preset.wave})`,
                      }}
                    />
                  </button>
                ))}
              </div>
            </div>

            {/* Quick Sliders */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
              <div className="p-2.5 rounded-xl bg-[var(--bg)] border border-[var(--border)]">
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-[var(--muted)] font-medium">Tốc độ sóng (Speed)</span>
                  <span className="font-semibold text-[var(--text)]">{speed.toFixed(2)}x</span>
                </div>
                <input
                  type="range"
                  min="0.1"
                  max="1.2"
                  step="0.05"
                  value={speed}
                  onChange={(e) => setSpeed(parseFloat(e.target.value))}
                  className="w-full accent-[var(--accent)] cursor-pointer"
                />
              </div>

              <div className="p-2.5 rounded-xl bg-[var(--bg)] border border-[var(--border)]">
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-[var(--muted)] font-medium">Độ cao sóng (Amplitude)</span>
                  <span className="font-semibold text-[var(--text)]">{amplitude.toFixed(1)}</span>
                </div>
                <input
                  type="range"
                  min="1.0"
                  max="5.0"
                  step="0.2"
                  value={amplitude}
                  onChange={(e) => setAmplitude(parseFloat(e.target.value))}
                  className="w-full accent-[var(--accent)] cursor-pointer"
                />
              </div>

              <div className="p-2.5 rounded-xl bg-[var(--bg)] border border-[var(--border)] flex items-center justify-between">
                <div>
                  <div className="text-xs font-medium text-[var(--text)]">Hạt nhiễu phim (Grain)</div>
                  <div className="text-[10px] text-[var(--muted)]">Film grain texture</div>
                </div>
                <button
                  type="button"
                  onClick={() => setGrain(!grain)}
                  className={`px-3 py-1 rounded-lg text-xs font-semibold cursor-pointer transition-colors ${
                    grain
                      ? "bg-[var(--accent)] text-white"
                      : "bg-[var(--border)] text-[var(--muted)]"
                  }`}
                >
                  {grain ? "Bật" : "Tắt"}
                </button>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}

export default GradientWavesModal;
