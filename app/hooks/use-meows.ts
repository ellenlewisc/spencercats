"use client";

import { useCallback, useState } from "react";

export interface Meow {
  id: number;
  x: number;
  y: number;
}

const MEOW_LIFETIME_MS = 1600;

// Keyboard-triggered clicks report (0, 0), so fall back to the centre of the clicked element.
export function meowPoint(event: React.MouseEvent<HTMLElement>): [number, number] {
  if (event.detail > 0) return [event.clientX, event.clientY];
  const rect = event.currentTarget.getBoundingClientRect();
  return [rect.left + rect.width / 2, rect.top + rect.height / 2];
}
let nextId = 0;

export function useMeows() {
  const [meows, setMeows] = useState<Meow[]>([]);

  const spawnMeow = useCallback((x: number, y: number) => {
    const id = nextId++;
    setMeows((prev) => [...prev, { id, x, y }]);
    window.setTimeout(() => setMeows((prev) => prev.filter((meow) => meow.id !== id)), MEOW_LIFETIME_MS);
  }, []);

  return { meows, spawnMeow };
}
