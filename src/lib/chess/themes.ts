export interface BoardTheme {
  id: string;
  name: string;
  light: string;
  dark: string;
  hlFrom: string;
  hlTo: string;
}

export const BOARD_THEMES: BoardTheme[] = [
  {
    id: "aether",
    name: "Aether Slate",
    light: "#e8edf7",
    dark: "#4a5d7a",
    hlFrom: "rgba(110, 231, 255, 0.45)",
    hlTo: "rgba(167, 139, 250, 0.35)",
  },
  {
    id: "midnight",
    name: "Midnight",
    light: "#c7d2e8",
    dark: "#2a3348",
    hlFrom: "rgba(125, 211, 252, 0.4)",
    hlTo: "rgba(167, 139, 250, 0.35)",
  },
  {
    id: "walnut",
    name: "Walnut",
    light: "#f0d9b5",
    dark: "#b58863",
    hlFrom: "rgba(255, 255, 100, 0.45)",
    hlTo: "rgba(255, 220, 80, 0.35)",
  },
  {
    id: "emerald",
    name: "Emerald",
    light: "#eeeed2",
    dark: "#769656",
    hlFrom: "rgba(246, 246, 105, 0.55)",
    hlTo: "rgba(246, 246, 105, 0.35)",
  },
  {
    id: "coral",
    name: "Coral",
    light: "#f4d5c8",
    dark: "#d36c5c",
    hlFrom: "rgba(255, 220, 180, 0.5)",
    hlTo: "rgba(255, 160, 120, 0.35)",
  },
  {
    id: "ice",
    name: "Ice",
    light: "#eef6ff",
    dark: "#6b8cae",
    hlFrom: "rgba(56, 189, 248, 0.45)",
    hlTo: "rgba(165, 243, 252, 0.3)",
  },
];

export function getBoardTheme(id: string) {
  return BOARD_THEMES.find((t) => t.id === id) ?? BOARD_THEMES[0];
}
