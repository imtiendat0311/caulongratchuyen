"use client";

import React, { useEffect, useRef, useState } from "react";

interface RollingNumberProps {
  value: number;
  suffix?: string;
  prefix?: string;
  className?: string;
  duration?: number;
  formatter?: (val: number) => string;
  highlightOnChange?: boolean;
  isExporting?: boolean;
}

/**
 * High-performance, physics-based rolling number animation component.
 * Uses requestAnimationFrame with exponential deceleration (easeOutExpo)
 * to smoothly roll through intermediate numeric values when the target changes.
 *
 * Designed with tabular-nums to prevent layout jitter, and outputs a clean text node
 * that is 100% compatible with Canvas / html-to-image exports on iOS and Desktop.
 */
export function RollingNumber({
  value,
  suffix = " đ",
  prefix = "",
  className = "",
  duration = 550,
  formatter,
  highlightOnChange = true,
  isExporting = false,
}: RollingNumberProps) {
  // Current display value
  const [displayValue, setDisplayValue] = useState<number>(value);
  const [isRolling, setIsRolling] = useState(false);
  const [direction, setDirection] = useState<"up" | "down" | null>(null);

  // Keep track of animation state in refs
  const currentValRef = useRef<number>(value);
  const targetValRef = useRef<number>(value);
  const rafIdRef = useRef<number | null>(null);
  const isFirstMountRef = useRef<boolean>(true);
  const timeoutIdRef = useRef<NodeJS.Timeout | null>(null);

  // Update targetValRef
  targetValRef.current = value;

  // If isExporting is true, immediately snap to target value and clear any ongoing animation
  useEffect(() => {
    if (isExporting) {
      if (rafIdRef.current) {
        cancelAnimationFrame(rafIdRef.current);
        rafIdRef.current = null;
      }
      if (timeoutIdRef.current) {
        clearTimeout(timeoutIdRef.current);
        timeoutIdRef.current = null;
      }
      currentValRef.current = value;
      setDisplayValue(value);
      setIsRolling(false);
      setDirection(null);
    }
  }, [isExporting, value]);

  useEffect(() => {
    // On first mount, initialize immediately without rolling from 0
    if (isFirstMountRef.current) {
      isFirstMountRef.current = false;
      currentValRef.current = value;
      setDisplayValue(value);
      return;
    }

    const startVal = currentValRef.current;
    const endVal = value;

    if (startVal === endVal) {
      return;
    }

    // Determine direction of roll
    setDirection(endVal > startVal ? "up" : "down");
    setIsRolling(true);

    if (timeoutIdRef.current) {
      clearTimeout(timeoutIdRef.current);
      timeoutIdRef.current = null;
    }

    if (rafIdRef.current) {
      cancelAnimationFrame(rafIdRef.current);
    }

    const startTime = performance.now();
    // Dynamic duration based on delta (min 400ms, max 700ms)
    const delta = Math.abs(endVal - startVal);
    const dynamicDuration = Math.min(700, Math.max(400, Math.round(duration * (delta > 100000 ? 1.15 : 1))));

    const step = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(1, elapsed / dynamicDuration);

      // easeOutExpo curve: fast initial acceleration, then smooth deceleration into target
      const eased = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress);
      const nextVal = Math.round(startVal + (endVal - startVal) * eased);

      currentValRef.current = nextVal;
      setDisplayValue(nextVal);

      if (progress < 1) {
        rafIdRef.current = requestAnimationFrame(step);
      } else {
        currentValRef.current = endVal;
        setDisplayValue(endVal);
        rafIdRef.current = null;

        // Keep brief highlight for 250ms after settle then fade out smoothly
        timeoutIdRef.current = setTimeout(() => {
          setIsRolling(false);
          setDirection(null);
        }, 250);
      }
    };

    rafIdRef.current = requestAnimationFrame(step);

    return () => {
      if (rafIdRef.current) {
        cancelAnimationFrame(rafIdRef.current);
      }
      if (timeoutIdRef.current) {
        clearTimeout(timeoutIdRef.current);
      }
    };
  }, [value, duration]);

  const defaultFormatter = (val: number) => val.toLocaleString("vi-VN");
  const formatFn = formatter || defaultFormatter;
  const formattedText = `${prefix}${formatFn(displayValue)}${suffix}`;
  const finalText = `${prefix}${formatFn(value)}${suffix}`;

  const highlightClass =
    !isExporting && highlightOnChange && isRolling
      ? direction === "up"
        ? "text-amber-500 dark:text-amber-400 drop-shadow-[0_0_8px_rgba(245,158,11,0.35)] scale-[1.03] transition-transform duration-150"
        : "text-amber-600 dark:text-amber-300 drop-shadow-[0_0_8px_rgba(217,119,6,0.35)] scale-[0.98] transition-transform duration-150"
      : "transition-all duration-300";

  const baseClass = `inline-block tabular-nums font-mono select-none ${className}`;

  return (
    <span
      data-rolling-number="true"
      data-base-class={baseClass}
      data-final-text={finalText}
      className={`${baseClass} ${highlightClass}`}
      aria-label={finalText}
      title={finalText}
    >
      {formattedText}
    </span>
  );
}
