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

export function useIsDark(): boolean {
  return useSyncExternalStore(
    (callback) => {
      window.addEventListener("storage", callback);
      const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
      mediaQuery.addEventListener("change", callback);
      let observer: MutationObserver | null = null;
      if (typeof document !== "undefined") {
        observer = new MutationObserver(callback);
        observer.observe(document.documentElement, {
          attributes: true,
          attributeFilter: ["class", "data-theme"],
        });
      }
      return () => {
        window.removeEventListener("storage", callback);
        mediaQuery.removeEventListener("change", callback);
        observer?.disconnect();
      };
    },
    () => {
      if (typeof document === "undefined") return false;
      return (
        document.documentElement.classList.contains("dark") ||
        document.documentElement.getAttribute("data-theme") === "dark"
      );
    },
    () => false
  );
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
      className="flex items-center justify-center w-9 h-9 rounded-xl border border-[var(--border)] bg-[var(--card)] text-[var(--text)] shadow-xs hover:border-[var(--accent)] active:scale-95 transition-all cursor-pointer"
      title={`Chế độ giao diện: ${
        theme === "system" ? "Hệ thống" : theme === "light" ? "Sáng" : "Tối"
      }`}
      aria-label="Đổi giao diện sáng/tối"
    >
      {theme === "light" && <Sun className="w-4 h-4 text-amber-500" />}
      {theme === "dark" && <Moon className="w-4 h-4 text-blue-400" />}
      {theme === "system" && <Laptop className="w-4 h-4 text-[var(--accent)]" />}
    </button>
  );
}
