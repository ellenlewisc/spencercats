"use client";

import { useCallback, useSyncExternalStore } from "react";

export type Theme = "light" | "dark";

const listeners = new Set<() => void>();

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function readTheme(): Theme {
  return document.documentElement.dataset.theme === "dark" ? "dark" : "light";
}

export function useTheme() {
  const theme = useSyncExternalStore<Theme | null>(subscribe, readTheme, () => null);

  const toggle = useCallback(() => {
    const next: Theme = readTheme() === "dark" ? "light" : "dark";
    document.documentElement.dataset.theme = next;
    try {
      localStorage.setItem("theme", next);
    } catch {}
    listeners.forEach((listener) => listener());
  }, []);

  return { theme, toggle };
}
