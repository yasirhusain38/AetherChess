"use client";

export interface SavedGame {
  id: string;
  createdAt: number;
  pgn: string;
  result: string;
  white: string;
  black: string;
  timeControl: string;
  mode: "bot" | "twin" | "pass" | "import";
  accuracyWhite?: number;
  accuracyBlack?: number;
}

export interface StudyChapter {
  id: string;
  title: string;
  pgn: string;
  notes: string;
}

export interface Study {
  id: string;
  title: string;
  description: string;
  updatedAt: number;
  chapters: StudyChapter[];
}

export interface UserSettings {
  boardTheme: string;
  pieceTheme: string;
  sound: boolean;
  animations: boolean;
  showLegalMoves: boolean;
  autoQueen: boolean;
  highlightLastMove: boolean;
  coord: boolean;
  displayName: string;
}

const GAMES_KEY = "aether.games.v1";
const STUDIES_KEY = "aether.studies.v1";
const SETTINGS_KEY = "aether.settings.v1";
const STATS_KEY = "aether.stats.v1";

let storageEpoch = 0;
const storageListeners = new Set<() => void>();

export function getStorageEpoch() {
  return storageEpoch;
}

export function subscribeStorage(cb: () => void) {
  storageListeners.add(cb);
  return () => storageListeners.delete(cb);
}

export function bumpStorageEpoch() {
  storageEpoch += 1;
  storageListeners.forEach((l) => l());
}

export interface UserStats {
  gamesPlayed: number;
  wins: number;
  losses: number;
  draws: number;
  puzzlesSolved: number;
  stormBest: number;
  scoutReports: number;
  twinSessions: number;
}

const DEFAULT_SETTINGS: UserSettings = {
  boardTheme: "aether",
  pieceTheme: "classic",
  sound: true,
  animations: true,
  showLegalMoves: true,
  autoQueen: true,
  highlightLastMove: true,
  coord: true,
  displayName: "You",
};

const DEFAULT_STATS: UserStats = {
  gamesPlayed: 0,
  wins: 0,
  losses: 0,
  draws: 0,
  puzzlesSolved: 0,
  stormBest: 0,
  scoutReports: 0,
  twinSessions: 0,
};

function readJSON<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return { ...fallback, ...JSON.parse(raw) } as T;
  } catch {
    return fallback;
  }
}

function writeJSON(key: string, value: unknown) {
  if (typeof window === "undefined") return;
  localStorage.setItem(key, JSON.stringify(value));
  try {
    bumpStorageEpoch();
  } catch {
    /* ignore during SSR/module init */
  }
}

export function getSettings(): UserSettings {
  return readJSON(SETTINGS_KEY, DEFAULT_SETTINGS);
}

export function saveSettings(partial: Partial<UserSettings>) {
  const next = { ...getSettings(), ...partial };
  writeJSON(SETTINGS_KEY, next);
  return next;
}

export function getStats(): UserStats {
  return readJSON(STATS_KEY, DEFAULT_STATS);
}

export function bumpStats(partial: Partial<UserStats>) {
  const cur = getStats();
  const next = { ...cur };
  for (const [k, v] of Object.entries(partial) as [keyof UserStats, number][]) {
    if (typeof v === "number") {
      if (k === "stormBest") next.stormBest = Math.max(cur.stormBest, v);
      else next[k] = (cur[k] as number) + v;
    }
  }
  writeJSON(STATS_KEY, next);
  return next;
}

export function listGames(): SavedGame[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(GAMES_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as SavedGame[];
  } catch {
    return [];
  }
}

export function saveGame(game: Omit<SavedGame, "id" | "createdAt"> & { id?: string }) {
  const games = listGames();
  const entry: SavedGame = {
    ...game,
    id: game.id ?? `g_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    createdAt: Date.now(),
  };
  games.unshift(entry);
  writeJSON(GAMES_KEY, games.slice(0, 50));
  return entry;
}

export function getGame(id: string) {
  return listGames().find((g) => g.id === id) ?? null;
}

export function listStudies(): Study[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STUDIES_KEY);
    if (!raw) return seedStudies();
    const parsed = JSON.parse(raw) as Study[];
    return parsed.length ? parsed : seedStudies();
  } catch {
    return seedStudies();
  }
}

function seedStudies(): Study[] {
  const seed: Study[] = [
    {
      id: "study_italian",
      title: "Italian Game Laboratory",
      description: "Main ideas, traps, and model games for 1.e4 e5 2.Nf3 Nc6 3.Bc4",
      updatedAt: Date.now(),
      chapters: [
        {
          id: "ch1",
          title: "Giuoco Piano basics",
          pgn: "1. e4 e5 2. Nf3 Nc6 3. Bc4 Bc5 4. c3 Nf6 5. d4",
          notes: "Claim the center with c3-d4. Watch the ...Nxe4 tactics.",
        },
        {
          id: "ch2",
          title: "Fried Liver motifs",
          pgn: "1. e4 e5 2. Nf3 Nc6 3. Bc4 Nf6 4. Ng5 d5 5. exd5 Nxd5 6. Nxf7",
          notes: "Only for blitz fun unless you know the theory — dangerous for both sides.",
        },
      ],
    },
  ];
  writeJSON(STUDIES_KEY, seed);
  return seed;
}

export function saveStudy(study: Study) {
  const all = listStudies().filter((s) => s.id !== study.id);
  all.unshift({ ...study, updatedAt: Date.now() });
  writeJSON(STUDIES_KEY, all);
  return study;
}

export function createStudy(title: string, description = "") {
  const study: Study = {
    id: `study_${Date.now()}`,
    title,
    description,
    updatedAt: Date.now(),
    chapters: [
      {
        id: `ch_${Date.now()}`,
        title: "Chapter 1",
        pgn: "",
        notes: "",
      },
    ],
  };
  return saveStudy(study);
}

export function deleteStudy(id: string) {
  writeJSON(
    STUDIES_KEY,
    listStudies().filter((s) => s.id !== id),
  );
}
