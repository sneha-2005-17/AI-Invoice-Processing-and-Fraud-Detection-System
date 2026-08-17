"use client";

import * as React from "react";

export function ThemeTransition() {
  React.useEffect(() => {
    const el = document.documentElement;
    el.classList.add("theme-transition");
    return () => {
      el.classList.remove("theme-transition");
    };
  }, []);

  return null;
}

