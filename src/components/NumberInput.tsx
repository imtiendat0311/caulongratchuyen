"use client";

import React from "react";
import { Minus, Plus } from "lucide-react";

interface NumberInputProps {
  id: string;
  label: string;
  value: number;
  onChange: (val: number) => void;
  min?: number;
  step?: number;
  unit?: string;
  hint?: string;
}

export function NumberInput({
  id,
  label,
  value,
  onChange,
  min = 0,
  step = 1,
  unit,
  hint,
}: NumberInputProps) {
  const handleDecrement = () => {
    const next = Math.max(min, Number((value - step).toFixed(2)));
    onChange(next);
  };

  const handleIncrement = () => {
    const next = Number((value + step).toFixed(2));
    onChange(next);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    if (isNaN(val)) {
      onChange(0);
    } else {
      onChange(Math.max(min, val));
    }
  };

  return (
    <div className="flex-1 min-w-[120px]">
      <div className="flex items-center justify-between mb-1.5">
        <label
          htmlFor={id}
          className="text-[0.82rem] font-medium text-[var(--muted)]"
        >
          {label}
        </label>
        {hint && (
          <span className="text-[11px] text-[var(--muted)] opacity-80">
            {hint}
          </span>
        )}
      </div>

      <div className="relative flex items-center rounded-[10px] bg-[var(--bg)] border border-[var(--border)] transition-colors focus-within:border-[var(--accent)]">
        <button
          type="button"
          onClick={handleDecrement}
          className="h-10 px-2.5 text-[var(--muted)] hover:text-[var(--text)] active:scale-95 transition-all cursor-pointer rounded-l-[10px] flex items-center justify-center"
          aria-label={`Giảm ${label}`}
        >
          <Minus className="w-3.5 h-3.5" />
        </button>

        <input
          id={id}
          type="number"
          min={min}
          step={step}
          value={value === 0 ? "" : value}
          placeholder="0"
          onChange={handleChange}
          className="w-full text-center py-2 px-1 bg-transparent text-[var(--text)] font-semibold text-base outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
        />

        {unit && (
          <span className="text-xs font-medium text-[var(--muted)] pr-2 select-none pointer-events-none">
            {unit}
          </span>
        )}

        <button
          type="button"
          onClick={handleIncrement}
          className="h-10 px-2.5 text-[var(--muted)] hover:text-[var(--text)] active:scale-95 transition-all cursor-pointer rounded-r-[10px] flex items-center justify-center"
          aria-label={`Tăng ${label}`}
        >
          <Plus className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}
