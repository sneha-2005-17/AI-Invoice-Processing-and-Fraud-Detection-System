"use client";

import * as React from "react";
import { Moon, Sun, Laptop } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { ThemeMode } from "./theme-provider";
import { useTheme } from "./theme-provider";

function IconForMode({ mode }: { mode: ThemeMode }) {
  if (mode === "light") return <Sun size={16} />;
  if (mode === "dark") return <Moon size={16} />;
  return <Laptop size={16} />;
}

export function ThemeToggle() {
  const { mode, setMode, hydrated } = useTheme();
  const [open, setOpen] = React.useState(false);

  // Avoid UI flicker until the theme is hydrated
  if (!hydrated) return <Button variant="secondary" aria-label="Theme" disabled>
    <IconForMode mode={mode} />
  </Button>;

  return (
    <div className="relative">
      <Button
        variant="secondary"
        aria-label="Theme toggle"
        onClick={() => setOpen((v) => !v)}
        className="min-w-[44px] justify-center"
      >
        <IconForMode mode={mode} />
      </Button>

      {open ? (
        <div className="absolute right-0 z-50 mt-2 w-44 overflow-hidden rounded-lg border bg-card shadow-lg">
          <button
            className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-muted/60"
            onClick={() => {
              setMode("light");
              setOpen(false);
            }}
          >
            <Sun size={16} /> Light
          </button>
          <button
            className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-muted/60"
            onClick={() => {
              setMode("dark");
              setOpen(false);
            }}
          >
            <Moon size={16} /> Dark
          </button>
          <button
            className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-muted/60"
            onClick={() => {
              setMode("system");
              setOpen(false);
            }}
          >
            <Laptop size={16} /> System
          </button>
        </div>
      ) : null}
    </div>
  );
}

