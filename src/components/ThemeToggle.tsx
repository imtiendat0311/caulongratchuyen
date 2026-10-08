"use client";

import React, { useSyncExternalStore } from "react";
import { Sun, Moon, Laptop } from "lucide-react";

type ThemeMode = "light" | "dark" | "system";

function subscribe(callback: () => void) {
  window.addEventListener("storage", callback);
  const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
  mediaQuery.addEventListener("change", callback);
  return () => {
    window.removeEventListener("storage", callback);
    mediaQuery.removeEventListener("change", callback);
  };
}

function getSnapshot(): ThemeMode {
  return (localStorage.getItem("theme") as ThemeMode) || "system";
}

function getServerSnapshot(): ThemeMode {
  return "system";
}

function updateDomTheme(mode: ThemeMode) {
  const isDark =
    mode === "dark" ||
    (mode === "system" &&
      window.matchMedia("(prefers-color-scheme: dark)").matches);

  if (isDark) {
    document.documentElement.classList.add("dark");
    document.documentElement.setAttribute("data-theme", "dark");
  } else {
    document.documentElement.classList.remove("dark");
    document.documentElement.setAttribute("data-theme", "light");
  }
}

export function ThemeToggle() {
  const theme = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  const cycleTheme = () => {
    const next: ThemeMode =
      theme === "system" ? "light" : theme === "light" ? "dark" : "system";

    if (next === "system") {
      localStorage.removeItem("theme");
    } else {
      localStorage.setItem("theme", next);
    }

    updateDomTheme(next);
    window.dispatchEvent(new Event("storage"));
  };

  return (
    <button
      onClick={cycleTheme}
      className="flex items-center justify-center w-9 h-9 rounded-xl border border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-800/80 text-slate-700 dark:text-slate-200 shadow-xs hover:scale-105 active:scale-95 transition-all cursor-pointer backdrop-blur-xs"
      title={`Chế độ giao diện: ${
        theme === "system" ? "Hệ thống" : theme === "light" ? "Sáng" : "Tối"
      }`}
      aria-label="Đổi giao diện sáng/tối"
    >
      {theme === "light" && <Sun className="w-4 h-4 text-amber-500" />}
      {theme === "dark" && <Moon className="w-4 h-4 text-indigo-400" />}
      {theme === "system" && <Laptop className="w-4 h-4 text-blue-500" />}
    </button>
  );
}
