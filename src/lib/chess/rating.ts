import { bumpStorageEpoch, getSettings } from "@/lib/storage";

const RATINGS_KEY = "aether.ratings.v1";

export type TcCategory = "bullet" | "blitz" | "rapid" | "classical";

export interface RatingState {
  rating: number;
  rd: number;
  games: number;
  peak: number;
}

export interface RatingsBag {
  bullet: RatingState;
  blitz: RatingState;
  rapid: RatingState;
  classical: RatingState;
  history: { at: number; category: TcCategory; rating: number; delta: number; opp: string }[];
}

const DEFAULT_STATE: RatingState = { rating: 1200, rd: 350, games: 0, peak: 1200 };

function defaultBag(): RatingsBag {
  return {
    bullet: { ...DEFAULT_STATE },
    blitz: { ...DEFAULT_STATE },
    rapid: { ...DEFAULT_STATE },
    classical: { ...DEFAULT_STATE },
    history: [],
  };
}

export function getRatings(): RatingsBag {
  if (typeof window === "undefined") return defaultBag();
  try {
    const raw = localStorage.getItem(RATINGS_KEY);
    if (!raw) return defaultBag();
    return { ...defaultBag(), ...JSON.parse(raw) };
  } catch {
    return defaultBag();
  }
}

function saveRatings(bag: RatingsBag) {
  if (typeof window === "undefined") return;
  localStorage.setItem(RATINGS_KEY, JSON.stringify(bag));
  bumpStorageEpoch();
}

/** Simplified Elo update (Glicko-lite) */
export function applyGameResult(opts: {
  category: TcCategory;
  oppRating: number;
  score: 0 | 0.5 | 1; // 1 win, 0 loss, 0.5 draw
  oppName: string;
}) {
  const bag = getRatings();
  const cur = { ...bag[opts.category] };
  const K = cur.games < 20 ? 32 : cur.games < 50 ? 24 : 16;
  const expected =
    1 / (1 + Math.pow(10, (opts.oppRating - cur.rating) / 400));
  const delta = Math.round(K * (opts.score - expected));
  cur.rating = Math.max(100, cur.rating + delta);
  cur.rd = Math.max(45, cur.rd * 0.98);
  cur.games += 1;
  cur.peak = Math.max(cur.peak, cur.rating);
  bag[opts.category] = cur;
  bag.history.unshift({
    at: Date.now(),
    category: opts.category,
    rating: cur.rating,
    delta,
    opp: opts.oppName,
  });
  bag.history = bag.history.slice(0, 40);
  saveRatings(bag);
  return { rating: cur.rating, delta, category: opts.category };
}

export function categoryFromTimeControl(id: string): TcCategory {
  if (id.startsWith("1")) return "bullet";
  if (id.startsWith("3") || id.startsWith("5")) return "blitz";
  if (id.startsWith("10") || id.startsWith("15")) return "rapid";
  return "classical";
}

export interface LeaderboardRow {
  name: string;
  rating: number;
  games: number;
  you?: boolean;
}

/** Fake global ladder + inject local player */
export function getLeaderboard(category: TcCategory = "blitz"): LeaderboardRow[] {
  const seed = [
    { name: "NovaPrime", rating: 2380, games: 842 },
    { name: "QuietMove", rating: 2210, games: 1204 },
    { name: "EndgameOwl", rating: 2144, games: 610 },
    { name: "TacticsStorm", rating: 2088, games: 990 },
    { name: "ItalianMaster", rating: 2012, games: 455 },
    { name: "ClockWizard", rating: 1960, games: 1300 },
    { name: "BerlinWall", rating: 1895, games: 720 },
    { name: "PawnStormer", rating: 1820, games: 880 },
    { name: "CastleEarly", rating: 1740, games: 500 },
    { name: "BookLine", rating: 1688, games: 340 },
  ];
  const you = getRatings()[category];
  const name =
    typeof window !== "undefined" ? getSettings().displayName || "You" : "You";
  const rows: LeaderboardRow[] = [
    ...seed,
    { name, rating: you.rating, games: you.games, you: true },
  ];
  return rows.sort((a, b) => b.rating - a.rating).map((r, i) => ({ ...r, rank: i + 1 } as LeaderboardRow));
}
