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
    id: "tournament",
    name: "Tournament Green",
    light: "#eeeed2",
    dark: "#769656",
    hlFrom: "rgba(246, 246, 105, 0.55)",
    hlTo: "rgba(246, 246, 105, 0.35)",
  },
  {
    id: "aether",
    name: "Championship Gold",
    light: "#f0e6c8",
    dark: "#5a7a42",
    hlFrom: "rgba(232, 197, 71, 0.5)",
    hlTo: "rgba(129, 182, 76, 0.35)",
  },
  {
    id: "walnut",
    name: "Classic Walnut",
    light: "#f0d9b5",
    dark: "#b58863",
    hlFrom: "rgba(255, 255, 100, 0.45)",
    hlTo: "rgba(255, 220, 80, 0.35)",
  },
  {
    id: "midnight",
    name: "Study Black",
    light: "#c8d0c0",
    dark: "#3d4a35",
    hlFrom: "rgba(201, 162, 39, 0.4)",
    hlTo: "rgba(129, 182, 76, 0.3)",
  },
  {
    id: "marble",
    name: "Ivory Arena",
    light: "#f5f0e1",
    dark: "#8a9a6a",
    hlFrom: "rgba(232, 197, 71, 0.45)",
    hlTo: "rgba(180, 140, 40, 0.3)",
  },
  {
    id: "coral",
    name: "Blitz Coral",
    light: "#f4d5c8",
    dark: "#d36c5c",
    hlFrom: "rgba(255, 220, 180, 0.5)",
    hlTo: "rgba(255, 160, 120, 0.35)",
  },
];

export function getBoardTheme(id: string) {
  // migrate old emerald/ice ids
  if (id === "emerald") return BOARD_THEMES[0];
  if (id === "ice") return BOARD_THEMES[3];
  return BOARD_THEMES.find((t) => t.id === id) ?? BOARD_THEMES[0];
}
