export type Platform = "chesscom" | "lichess" | "fide" | "aether";

export interface OpeningLine {
  name: string;
  moves: string;
  games: number;
  score: number; // 0-100 from player's POV
  as: "white" | "black";
}

export interface Weakness {
  title: string;
  detail: string;
  severity: "low" | "medium" | "high";
  exploit: string;
}

export interface ScoutReport {
  username: string;
  platforms: Platform[];
  ratings: { bullet: number; blitz: number; rapid: number; classical: number };
  gamesAnalyzed: number;
  prepScore: number; // 0-100 exploitability / prep value
  stalkerScore: number;
  style: {
    aggression: number;
    tactics: number;
    endgame: number;
    time: number;
    bookLoyalty: number;
    consistency?: number;
  };
  openings: OpeningLine[];
  weaknesses: Weakness[];
  psyche: {
    tiltAfterLoss: number;
    timePressureBlunders: number;
    conversionWhenWinning: number;
    gritWhenLosing: number;
    bestHours: string;
    worstHours: string;
  };
  nemesisNote: string;
  prepTips: string[];
  twinRepertoire: string[];
  summary: string;
}

const SAMPLE_POOL = [
  "MagnusCarlsen",
  "Hikaru",
  "GothamChess",
  "DanielNaroditsky",
  "Firouzja2003",
  "Anna_Cramling",
  "ChessWarrior7197",
  "nihalsarin",
  "lachesisQ",
  "penguingm1",
];

function hash(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function rng(seed: number) {
  let s = seed || 1;
  return () => {
    s = (Math.imul(s, 1664525) + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

function pick<T>(rand: () => number, arr: T[]): T {
  return arr[Math.floor(rand() * arr.length)];
}

const OPENING_BANK: Omit<OpeningLine, "games" | "score">[] = [
  { name: "Italian Game", moves: "1.e4 e5 2.Nf3 Nc6 3.Bc4", as: "white" },
  { name: "Ruy Lopez", moves: "1.e4 e5 2.Nf3 Nc6 3.Bb5", as: "white" },
  { name: "Queen's Gambit", moves: "1.d4 d5 2.c4", as: "white" },
  { name: "London System", moves: "1.d4 d5 2.Nf3 Nf6 3.Bf4", as: "white" },
  { name: "English Opening", moves: "1.c4 e5 2.Nc3", as: "white" },
  { name: "Sicilian Defense", moves: "1.e4 c5 2.Nf3 d6", as: "black" },
  { name: "French Defense", moves: "1.e4 e6 2.d4 d5", as: "black" },
  { name: "Caro-Kann", moves: "1.e4 c6 2.d4 d5", as: "black" },
  { name: "King's Indian", moves: "1.d4 Nf6 2.c4 g6", as: "black" },
  { name: "Berlin Defense", moves: "1.e4 e5 2.Nf3 Nc6 3.Bb5 Nf6", as: "black" },
  { name: "Scandinavian", moves: "1.e4 d5 2.exd5 Qxd5", as: "black" },
  { name: "Nimzo-Indian", moves: "1.d4 Nf6 2.c4 e6 3.Nc3 Bb4", as: "black" },
];

const WEAKNESS_BANK: Weakness[] = [
  {
    title: "Time-pressure tactics",
    detail: "Error rate spikes under 15 seconds on the clock, especially in messy middlegames.",
    severity: "high",
    exploit: "Keep tension; avoid early mass exchanges. Complex positions punish their clock.",
  },
  {
    title: "Light-square bishop neglect",
    detail: "Often leaves the unopposed light-square bishop passive after castling short.",
    severity: "medium",
    exploit: "Target f7/h7 complexes and provoke ...g6 weaknesses.",
  },
  {
    title: "Endgame conversion leaks",
    detail: "When +1.5 to +3, conversion rate drops — especially R+P endings.",
    severity: "high",
    exploit: "Steer into simplified endings if you can hold; they self-destruct progress.",
  },
  {
    title: "Sideline allergic",
    detail: "Scores poorly when taken out of main pet lines before move 8.",
    severity: "medium",
    exploit: "Use early deviations (e.g. 2…Nc6 vs London or delayed c5 Sicilians).",
  },
  {
    title: "King-side overextension",
    detail: "Pushes f/g/h pawns when slightly worse, creating permanent holes.",
    severity: "medium",
    exploit: "Invite the pawn storm, then counter-strike in the center.",
  },
  {
    title: "Tilt cascade",
    detail: "After a loss, next 2 games show +40% blunder frequency.",
    severity: "high",
    exploit: "If this is a rematch streak, expect recklessness — play solid and wait.",
  },
  {
    title: "Back-rank soft spots",
    detail: "Underuses luft; tactical shots on the back rank appear often in rapid.",
    severity: "low",
    exploit: "Keep a rook on the open file and delay trades that free their king.",
  },
];

export function generateScoutReport(rawUsername: string): ScoutReport {
  const username = rawUsername.trim().replace(/^@/, "") || "MysteryPlayer";
  const rand = rng(hash(username.toLowerCase()));

  const base = 800 + Math.floor(rand() * 1600);
  const ratings = {
    bullet: clampRating(base + Math.floor((rand() - 0.5) * 200)),
    blitz: clampRating(base + Math.floor((rand() - 0.5) * 160)),
    rapid: clampRating(base + Math.floor((rand() - 0.5) * 140)),
    classical: clampRating(base + Math.floor((rand() - 0.4) * 120)),
  };

  const style = {
    aggression: pct(rand),
    tactics: pct(rand),
    endgame: pct(rand),
    time: pct(rand),
    bookLoyalty: pct(rand),
  };

  const openings = shuffle(rand, [...OPENING_BANK])
    .slice(0, 6)
    .map((o) => ({
      ...o,
      games: 20 + Math.floor(rand() * 180),
      score: 35 + Math.floor(rand() * 40),
    }));

  const weaknesses = shuffle(rand, [...WEAKNESS_BANK]).slice(0, 4);

  const prepScore = Math.round(
    35 +
      style.aggression * 0.15 +
      (100 - style.endgame) * 0.2 +
      (100 - style.time) * 0.25 +
      rand() * 15,
  );
  const stalkerScore = Math.min(99, Math.max(12, prepScore + Math.floor((rand() - 0.5) * 20)));

  const platforms: Platform[] = ["aether"];
  if (rand() > 0.3) platforms.unshift("chesscom");
  if (rand() > 0.35) platforms.unshift("lichess");
  if (rand() > 0.7) platforms.push("fide");

  const twinRepertoire = openings.slice(0, 4).map((o) =>
    o.moves
      .replace(/\d+\./g, "")
      .trim()
      .split(/\s+/)
      .filter(Boolean)
      .join(" "),
  );

  const prepTips = [
    `Against their ${openings[0]?.name ?? "main line"}, prepare an early sideline before move 7.`,
    weaknesses[0]
      ? `Primary exploit: ${weaknesses[0].exploit}`
      : "Keep positions practical and force decisions.",
    style.time < 45
      ? "They mismanage the clock — play moves that require calculation."
      : "They are stable on the clock; don’t rely on flagging alone.",
    style.aggression > 60
      ? "They over-press — meet aggression with accurate defense and counterpunches."
      : "They play solid; create imbalances early (opposite castling / imbalanced pawns).",
  ];

  const summary = `${username} is a ${descriptor(style)} player (~${ratings.blitz} blitz). Prep Score ${prepScore}/100 — ${
    prepScore > 70 ? "highly preparable" : prepScore > 45 ? "moderately exploitable patterns" : "resilient profile"
  }. Strongest phase: ${style.tactics > style.endgame ? "tactics/middlegame" : "endgames"}.`;

  return {
    username,
    platforms: [...new Set(platforms)],
    ratings,
    gamesAnalyzed: 120 + Math.floor(rand() * 900),
    prepScore,
    stalkerScore,
    style,
    openings,
    weaknesses,
    psyche: {
      tiltAfterLoss: pct(rand),
      timePressureBlunders: pct(rand),
      conversionWhenWinning: pct(rand),
      gritWhenLosing: pct(rand),
      bestHours: pick(rand, ["09–11 local", "14–16 local", "20–23 local", "00–02 local"]),
      worstHours: pick(rand, ["Late night tilt window", "Just after work rush", "Weekend mornings"]),
    },
    nemesisNote:
      style.aggression > 55
        ? "You tend to score well against aggressive over-pushers — keep calm."
        : "Positional grinders score vs you; seek early tactical tension.",
    prepTips,
    twinRepertoire,
    summary,
  };
}

function pct(rand: () => number) {
  return Math.round(18 + rand() * 72);
}

function clampRating(n: number) {
  return Math.max(400, Math.min(3200, Math.round(n)));
}

function shuffle<T>(rand: () => number, arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function descriptor(style: ScoutReport["style"]) {
  if (style.aggression > 65 && style.tactics > 60) return "sharp, aggressive";
  if (style.bookLoyalty > 65) return "theoretical";
  if (style.endgame > 65) return "technical, endgame-oriented";
  if (style.aggression < 40) return "solid, risk-averse";
  return "practical, balanced";
}

export const DEMO_USERNAMES = SAMPLE_POOL;

export function platformLabel(p: Platform) {
  switch (p) {
    case "chesscom":
      return "Chess.com";
    case "lichess":
      return "Lichess";
    case "fide":
      return "FIDE";
    case "aether":
      return "Aether";
  }
}
