"use client";

import { Toaster } from "sonner";

export function AppToaster() {
  return (
    <Toaster
      position="top-center"
      toastOptions={{
        style: {
          background: "var(--card)",
          color: "var(--ink)",
          border: "2px solid var(--ink)",
          borderRadius: "1rem",
          boxShadow: "4px 4px 0 0 var(--ink)",
          fontFamily: "var(--font-quicksand), sans-serif",
          fontWeight: 600,
        },
      }}
    />
  );
}
