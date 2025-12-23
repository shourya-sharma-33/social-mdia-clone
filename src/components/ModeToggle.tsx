"use client";

import * as React from "react";
import { MoonIcon, SunIcon, HeartIcon } from "lucide-react";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";

const themes = ["light", "dark", "pink"] as const;

export default function ModeToggle() {
  const { theme, setTheme } = useTheme();

  const toggleTheme = () => {
    const currentIndex = themes.indexOf(theme as any);
    const nextTheme = themes[(currentIndex + 1) % themes.length];
    setTheme(nextTheme);
  };

  return (
    <Button
      variant="outline"
      size="icon"
      onClick={toggleTheme}
      className="relative"
    >
      {/* Light */}
      <SunIcon
        className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all
        dark:-rotate-90 dark:scale-0
        pink:-rotate-90 pink:scale-0"
      />

      {/* Dark */}
      <MoonIcon
        className="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all
        dark:rotate-0 dark:scale-100
        pink:-rotate-90 pink:scale-0"
      />

      {/* Pink */}
      <HeartIcon
        className="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all text-pink-500
        pink:rotate-0 pink:scale-100"
      />

      <span className="sr-only">Toggle theme</span>
    </Button>
  );
}
