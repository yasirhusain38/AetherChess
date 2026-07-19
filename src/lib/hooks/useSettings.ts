"use client";

import { useCallback, useState } from "react";
import { getSettings, saveSettings, type UserSettings } from "@/lib/storage";

const DEFAULT: UserSettings = {
  boardTheme: "tournament",
  pieceTheme: "classic",
  sound: true,
  animations: true,
  showLegalMoves: true,
  autoQueen: true,
  highlightLastMove: true,
  coord: true,
  displayName: "You",
};

export function useSettings() {
  const [settings, setSettings] = useState<UserSettings>(() => {
    if (typeof window === "undefined") return DEFAULT;
    return getSettings();
  });

  const update = useCallback((partial: Partial<UserSettings>) => {
    const next = saveSettings(partial);
    setSettings(next);
    return next;
  }, []);

  return { settings, update };
}
