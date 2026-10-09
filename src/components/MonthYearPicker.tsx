"use client";

import React, { useState, useRef, useEffect, useMemo } from "react";
import {
  Calendar,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Sparkles,
  Check,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface MonthYearPickerProps {
  value: string; // "YYYY-MM", e.g. "2026-10"
  onChange: (monthStr: string) => void;
  className?: string;
  disabled?: boolean;
}

export function MonthYearPicker({
  value,
  onChange,
  className = "",
  disabled = false,
}: MonthYearPickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [showYearGrid, setShowYearGrid] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const today = useMemo(() => new Date(), []);
  const currentYearNum = today.getFullYear();
  const currentMonthNum = today.getMonth() + 1;
  const currentMonthStr = `${currentYearNum}-${String(currentMonthNum).padStart(2, "0")}`;

  // Parse "YYYY-MM"
  const [selectedYear, selectedMonth] = useMemo(() => {
    if (value && value.includes("-")) {
      const parts = value.split("-");
      const y = parseInt(parts[0], 10) || currentYearNum;
      const m = parseInt(parts[1], 10) || currentMonthNum;
      return [y, m];
    }
    return [currentYearNum, currentMonthNum];
  }, [value, currentYearNum, currentMonthNum]);

  // View year in popover navigation
  const [viewYear, setViewYear] = useState<number>(selectedYear);

  // Sync viewYear when selectedYear changes
  useEffect(() => {
    setViewYear(selectedYear);
  }, [selectedYear]);

  // Close on outside click or Escape
  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
        setShowYearGrid(false);
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setIsOpen(false);
        setShowYearGrid(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  // Stepper handlers for previous / next month
  const handlePrevMonth = (e: React.MouseEvent) => {
    e.stopPropagation();
    let y = selectedYear;
    let m = selectedMonth - 1;
    if (m < 1) {
      m = 12;
      y -= 1;
    }
    onChange(`${y}-${String(m).padStart(2, "0")}`);
  };

  const handleNextMonth = (e: React.MouseEvent) => {
    e.stopPropagation();
    let y = selectedYear;
    let m = selectedMonth + 1;
    if (m > 12) {
      m = 1;
      y += 1;
    }
    onChange(`${y}-${String(m).padStart(2, "0")}`);
  };

  const isCurrentMonth = value === currentMonthStr;

  // Year options around viewYear for the year-selector grid
  const yearGridOptions = useMemo(() => {
    const start = viewYear - 5;
    const years: number[] = [];
    for (let i = 0; i < 12; i++) {
      years.push(start + i);
    }
    return years;
  }, [viewYear]);

  return (
    <div ref={containerRef} className={`relative w-full min-w-0 ${className}`}>
      {/* Trigger Input Control with integrated Quick Month Steppers */}
      <div className="flex items-center w-full min-w-0 h-9 rounded-[8px] border border-amber-500/40 bg-[var(--card)] shadow-2xs hover:border-amber-500 transition-colors focus-within:border-amber-500">
        {/* Quick Prev Month Step Button */}
        <button
          type="button"
          disabled={disabled}
          onClick={handlePrevMonth}
          className="h-full px-1.5 flex items-center justify-center text-[var(--muted)] hover:text-amber-500 hover:bg-amber-500/10 rounded-l-[7px] transition-colors cursor-pointer shrink-0 disabled:opacity-40"
          title="Tháng trước"
        >
          <ChevronLeft className="w-3.5 h-3.5" />
        </button>

        {/* Main Month-Year Trigger Button */}
        <button
          type="button"
          disabled={disabled}
          onClick={() => {
            if (!disabled) {
              setIsOpen(!isOpen);
              setShowYearGrid(false);
              setViewYear(selectedYear);
            }
          }}
          className="flex-1 min-w-0 h-full flex items-center justify-center gap-1.5 px-1 text-xs font-semibold text-[var(--text)] outline-none cursor-pointer truncate"
          title="Chọn tháng và năm"
        >
          <Calendar className="w-3.5 h-3.5 text-amber-500 shrink-0" />
          <span className="truncate">
            Tháng {String(selectedMonth).padStart(2, "0")}/{selectedYear}
          </span>
          {isCurrentMonth && (
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" title="Tháng hiện tại" />
          )}
          <ChevronDown
            className={`w-3.5 h-3.5 text-amber-500/80 shrink-0 transition-transform duration-200 ${
              isOpen ? "rotate-180" : ""
            }`}
          />
        </button>

        {/* Quick Next Month Step Button */}
        <button
          type="button"
          disabled={disabled}
          onClick={handleNextMonth}
          className="h-full px-1.5 flex items-center justify-center text-[var(--muted)] hover:text-amber-500 hover:bg-amber-500/10 rounded-r-[7px] transition-colors cursor-pointer shrink-0 disabled:opacity-40"
          title="Tháng sau"
        >
          <ChevronRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Popover Month & Year Selector Grid */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 6 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 4 }}
            transition={{ type: "spring", stiffness: 450, damping: 32 }}
            className="absolute left-0 sm:left-auto sm:right-0 md:left-0 top-full mt-1.5 z-50 w-[270px] max-w-[calc(100vw-2rem)] rounded-[14px] bg-[var(--card)] border border-amber-500/40 shadow-xl p-3 text-[var(--text)] box-border backdrop-blur-md"
          >
            {/* Header: Year navigation & toggle */}
            <div className="flex items-center justify-between mb-2.5 pb-2 border-b border-[var(--border)]">
              <button
                type="button"
                onClick={() => setViewYear((y) => (showYearGrid ? y - 12 : y - 1))}
                className="p-1 rounded-md text-[var(--muted)] hover:text-[var(--text)] hover:bg-[var(--bg)] cursor-pointer transition-colors"
                title={showYearGrid ? "12 năm trước" : "Năm trước"}
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              <button
                type="button"
                onClick={() => setShowYearGrid(!showYearGrid)}
                className="px-2.5 py-1 rounded-[8px] font-bold text-xs text-[var(--text)] hover:bg-amber-500/15 hover:text-amber-500 transition-colors cursor-pointer flex items-center gap-1.5 border border-transparent hover:border-amber-500/30"
              >
                <span>Năm {viewYear}</span>
                <ChevronDown
                  className={`w-3 h-3 text-amber-500 transition-transform ${
                    showYearGrid ? "rotate-180" : ""
                  }`}
                />
              </button>

              <button
                type="button"
                onClick={() => setViewYear((y) => (showYearGrid ? y + 12 : y + 1))}
                className="p-1 rounded-md text-[var(--muted)] hover:text-[var(--text)] hover:bg-[var(--bg)] cursor-pointer transition-colors"
                title={showYearGrid ? "12 năm sau" : "Năm sau"}
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            {/* Mode 1: 12-Year Selection Grid */}
            {showYearGrid ? (
              <div className="grid grid-cols-3 gap-1.5 py-1">
                {yearGridOptions.map((y) => {
                  const isCurYear = y === currentYearNum;
                  const isSelYear = y === selectedYear;
                  return (
                    <motion.button
                      key={y}
                      whileTap={{ scale: 0.94 }}
                      type="button"
                      onClick={() => {
                        setViewYear(y);
                        setShowYearGrid(false);
                      }}
                      className={`py-2 px-1 rounded-[8px] text-xs font-semibold transition-all cursor-pointer text-center ${
                        isSelYear
                          ? "bg-amber-500 text-white font-bold shadow-xs"
                          : isCurYear
                          ? "border border-amber-500/50 text-amber-600 dark:text-amber-400 bg-amber-500/10 font-bold"
                          : "text-[var(--text)] hover:bg-[var(--bg)] hover:text-amber-500"
                      }`}
                    >
                      {y}
                    </motion.button>
                  );
                })}
              </div>
            ) : (
              /* Mode 2: 12-Month Selection Grid */
              <div className="grid grid-cols-3 gap-1.5 py-1">
                {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => {
                  const isSelected = viewYear === selectedYear && m === selectedMonth;
                  const isCurrent = viewYear === currentYearNum && m === currentMonthNum;

                  return (
                    <motion.button
                      key={m}
                      whileTap={{ scale: 0.94 }}
                      type="button"
                      onClick={() => {
                        const formatted = `${viewYear}-${String(m).padStart(2, "0")}`;
                        onChange(formatted);
                        setIsOpen(false);
                      }}
                      className={`py-2 px-1.5 rounded-[9px] text-xs font-semibold transition-all cursor-pointer flex flex-col items-center justify-center relative ${
                        isSelected
                          ? "bg-amber-500 text-white font-bold shadow-xs scale-[1.02]"
                          : isCurrent
                          ? "border border-amber-500/60 text-amber-600 dark:text-amber-400 bg-amber-500/10 font-bold hover:bg-amber-500/20"
                          : "text-[var(--text)] hover:bg-[var(--bg)] hover:text-amber-500 border border-transparent"
                      }`}
                    >
                      <span>Tháng {m}</span>
                      {isSelected ? (
                        <Check className="w-2.5 h-2.5 stroke-[3] text-white mt-0.5" />
                      ) : isCurrent ? (
                        <span className="text-[8.5px] font-normal opacity-85 -mt-0.5 text-amber-600 dark:text-amber-400">
                          Hiện tại
                        </span>
                      ) : null}
                    </motion.button>
                  );
                })}
              </div>
            )}

            {/* Footer Quick Shortcuts */}
            <div className="flex items-center justify-between pt-2.5 mt-2 border-t border-[var(--border)] text-[11px]">
              <button
                type="button"
                onClick={() => {
                  onChange(currentMonthStr);
                  setViewYear(currentYearNum);
                  setShowYearGrid(false);
                  setIsOpen(false);
                }}
                className="text-amber-600 dark:text-amber-400 hover:underline font-semibold flex items-center gap-1 cursor-pointer transition-colors"
              >
                <Sparkles className="w-3 h-3 text-amber-500" />
                <span>Tháng hiện tại</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setIsOpen(false);
                  setShowYearGrid(false);
                }}
                className="text-xs font-medium text-[var(--muted)] hover:text-[var(--text)] cursor-pointer px-1.5 py-0.5 rounded hover:bg-[var(--bg)]"
              >
                Đóng
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
