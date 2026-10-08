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
  icon?: React.ReactNode;
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
  icon,
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
    <div className="flex-1 min-w-[130px]">
      <div className="flex items-center justify-between mb-1.5">
        <label
          htmlFor={id}
          className="text-xs font-medium text-slate-500 dark:text-slate-400 flex items-center gap-1.5"
        >
          {icon}
          {label}
        </label>
        {hint && (
          <span className="text-[10px] text-slate-400 dark:text-slate-500 font-normal">
            {hint}
          </span>
        )}
      </div>

      <div className="relative flex items-center rounded-xl bg-slate-50/80 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 transition-all focus-within:border-blue-500 dark:focus-within:border-blue-400 focus-within:ring-2 focus-within:ring-blue-500/20 shadow-xs">
        <button
          type="button"
          onClick={handleDecrement}
          className="p-2 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 active:scale-95 transition-all cursor-pointer rounded-l-xl"
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
          className="w-full text-center py-2 px-1 bg-transparent text-slate-800 dark:text-slate-100 font-semibold text-base outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
        />

        {unit && (
          <span className="text-xs font-medium text-slate-400 dark:text-slate-500 pr-1 select-none pointer-events-none">
            {unit}
          </span>
        )}

        <button
          type="button"
          onClick={handleIncrement}
          className="p-2 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 active:scale-95 transition-all cursor-pointer rounded-r-xl"
          aria-label={`Tăng ${label}`}
        >
          <Plus className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}
