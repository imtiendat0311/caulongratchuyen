"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Sparkles, Sliders, Eye } from "lucide-react";
import Iridescence from "./Iridescence";

interface IridescenceModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const PRESETS = [
  {
    name: "Cầu Vồng Xà Cừ (Prism Opal)",
    icon: "🌈",
    color: [1, 1, 1] as [number, number, number],
  },
  {
    name: "Sân Cầu Lông Emerald",
    icon: "🏸",
    color: [0.2, 0.9, 0.5] as [number, number, number],
  },
  {
    name: "Cyber Neon Cyan",
    icon: "🌌",
    color: [0.3, 0.7, 1.0] as [number, number, number],
  },
  {
    name: "Hoàng Hôn Sunset",
    icon: "🌅",
    color: [1.0, 0.5, 0.2] as [number, number, number],
  },
  {
    name: "Thạch Anh Hồng (Rose Opal)",
    icon: "🌸",
    color: [1.0, 0.4, 0.7] as [number, number, number],
  },
];

export function IridescenceModal({ isOpen, onClose }: IridescenceModalProps) {
  const [selectedPreset, setSelectedPreset] = useState(0);
  const [speed, setSpeed] = useState(1.0);
  const [amplitude, setAmplitude] = useState(0.12);
  const [mouseReact, setMouseReact] = useState(true);

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
              <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-cyan-400 via-pink-400 to-amber-300 flex items-center justify-center text-white shadow-xs">
                <Sparkles className="w-4 h-4 text-slate-900" />
              </div>
              <div>
                <h3 className="text-base font-bold text-[var(--text)] flex items-center gap-2">
                  <span>Iridescence Background</span>
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border border-cyan-500/20">
                    React Bits
                  </span>
                </h3>
                <p className="text-xs text-[var(--muted)]">
                  Shader sóng ánh xà cừ chuyển sắc quang học tương tác theo chuột
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
            <Iridescence
              key={`${currentPreset.name}-${speed}-${amplitude}`}
              color={currentPreset.color}
              speed={speed}
              amplitude={amplitude}
              mouseReact={mouseReact}
            />

            {/* Subtle Overlay Hint */}
            <div className="absolute bottom-3 left-4 pointer-events-none text-[11px] text-white/80 font-medium px-2.5 py-1 rounded-full bg-black/40 backdrop-blur-md border border-white/10 flex items-center gap-1.5 shadow-sm">
              <Sparkles className="w-3 h-3 text-cyan-300" />
              <span>Di chuột trên bề mặt để biến dạng sóng xà cừ</span>
            </div>
          </div>

          {/* Controls & Preset Selector */}
          <div className="p-4 sm:p-5 bg-[var(--card)] border-t border-[var(--border)] overflow-y-auto space-y-4">
            {/* Presets */}
            <div>
              <label className="text-xs font-semibold text-[var(--muted)] uppercase tracking-wider block mb-2">
                Bảng tông màu sắc (Color Presets)
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2">
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
                  </button>
                ))}
              </div>
            </div>

            {/* Quick Sliders */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
              <div className="p-2.5 rounded-xl bg-[var(--bg)] border border-[var(--border)]">
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-[var(--muted)] font-medium">Tốc độ (Speed)</span>
                  <span className="font-semibold text-[var(--text)]">{speed.toFixed(1)}x</span>
                </div>
                <input
                  type="range"
                  min="0.2"
                  max="2.5"
                  step="0.1"
                  value={speed}
                  onChange={(e) => setSpeed(parseFloat(e.target.value))}
                  className="w-full accent-[var(--accent)] cursor-pointer"
                />
              </div>

              <div className="p-2.5 rounded-xl bg-[var(--bg)] border border-[var(--border)]">
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-[var(--muted)] font-medium">Biên độ chuột (Amplitude)</span>
                  <span className="font-semibold text-[var(--text)]">{amplitude.toFixed(2)}</span>
                </div>
                <input
                  type="range"
                  min="0.02"
                  max="0.4"
                  step="0.02"
                  value={amplitude}
                  onChange={(e) => setAmplitude(parseFloat(e.target.value))}
                  className="w-full accent-[var(--accent)] cursor-pointer"
                />
              </div>

              <div className="p-2.5 rounded-xl bg-[var(--bg)] border border-[var(--border)] flex items-center justify-between">
                <div>
                  <div className="text-xs font-medium text-[var(--text)]">Tương tác chuột</div>
                  <div className="text-[10px] text-[var(--muted)]">Mouse reactive</div>
                </div>
                <button
                  type="button"
                  onClick={() => setMouseReact(!mouseReact)}
                  className={`px-3 py-1 rounded-lg text-xs font-semibold cursor-pointer transition-colors ${
                    mouseReact
                      ? "bg-[var(--accent)] text-white"
                      : "bg-[var(--border)] text-[var(--muted)]"
                  }`}
                >
                  {mouseReact ? "Bật" : "Tắt"}
                </button>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}

export default IridescenceModal;
