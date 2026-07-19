import { Chess, type Move } from "chess.js";
import { depthForRating, engineMove } from "./engine";

export type BotStyle =
  | "balanced"
  | "aggressive"
  | "solid"
  | "tactical"
  | "beginner"
  | "positional"
  | "worldchamp"
  | "twin";

export interface BotConfig {
  name: string;
  rating: number;
  style: BotStyle;
  /** 0–1: chance to pick a weaker move */
  errorRate: number;
  aggression: number;
  solidity: number;
  repertoire?: string[];
  /** Prefer deep engine (tournament technique) */
  useDeepEngine?: boolean;
  blurb?: string;
}

/**
 * Opening book from world championship / classical tournament mainlines.
 * SAN tokens without move numbers.
 */
const TOURNAMENT_BOOK: string[][] = [
  // Ruy Lopez — World Championship staple
  ["e4", "e5", "Nf3", "Nc6", "Bb5", "a6", "Ba4", "Nf6", "O-O", "Be7", "Re1", "b5", "Bb3", "d6", "c3", "O-O"],
  ["e4", "e5", "Nf3", "Nc6", "Bb5", "Nf6", "O-O", "Nxe4", "d4", "Nd6", "Bxc6", "dxc6"],
  // Italian / Giuoco
  ["e4", "e5", "Nf3", "Nc6", "Bc4", "Bc5", "c3", "Nf6", "d4", "exd4", "cxd4", "Bb4+"],
  ["e4", "e5", "Nf3", "Nc6", "Bc4", "Nf6", "d3", "Bc5", "c3", "d6", "O-O", "a6"],
  // Sicilian Najdorf / Open
  ["e4", "c5", "Nf3", "d6", "d4", "cxd4", "Nxd4", "Nf6", "Nc3", "a6", "Be3", "e5", "Nb3", "Be6"],
  ["e4", "c5", "Nf3", "Nc6", "d4", "cxd4", "Nxd4", "Nf6", "Nc3", "e5", "Ndb5", "d6"],
  ["e4", "c5", "Nf3", "e6", "d4", "cxd4", "Nxd4", "Nc6", "Nc3", "Qc7"],
  // French
  ["e4", "e6", "d4", "d5", "Nc3", "Bb4", "e5", "c5", "a3", "Bxc3+", "bxc3", "Ne7"],
  ["e4", "e6", "d4", "d5", "Nd2", "c5", "exd5", "Qxd5", "Ngf3", "cxd4"],
  // Caro-Kann
  ["e4", "c6", "d4", "d5", "Nc3", "dxe4", "Nxe4", "Bf5", "Ng3", "Bg6", "h4", "h6"],
  ["e4", "c6", "d4", "d5", "e5", "Bf5", "Nf3", "e6", "Be2", "c5"],
  // Queen's Gambit / Slav
  ["d4", "d5", "c4", "e6", "Nc3", "Nf6", "Bg5", "Be7", "e3", "O-O", "Nf3", "h6"],
  ["d4", "d5", "c4", "c6", "Nf3", "Nf6", "Nc3", "dxc4", "a4", "Bf5"],
  ["d4", "d5", "c4", "e6", "Nc3", "Nf6", "cxd5", "exd5", "Bg5", "c6"],
  // Nimzo / QID / KID
  ["d4", "Nf6", "c4", "e6", "Nc3", "Bb4", "e3", "O-O", "Bd3", "d5", "Nf3", "c5"],
  ["d4", "Nf6", "c4", "g6", "Nc3", "Bg7", "e4", "d6", "Nf3", "O-O", "Be2", "e5"],
  ["d4", "Nf6", "c4", "g6", "Nc3", "d5", "cxd5", "Nxd5", "e4", "Nxc3", "bxc3", "Bg7"],
  // English / Catalan flavours
  ["c4", "e5", "Nc3", "Nf6", "Nf3", "Nc6", "g3", "d5", "cxd5", "Nxd5"],
  ["d4", "Nf6", "c4", "e6", "g3", "d5", "Bg2", "Be7", "Nf3", "O-O", "O-O", "dxc4"],
  // London / solid systems
  ["d4", "d5", "Nf3", "Nf6", "Bf4", "c5", "e3", "Nc6", "c3", "Qb6"],
  ["d4", "Nf6", "Nf3", "g6", "Bf4", "Bg7", "e3", "O-O", "Be2", "d6"],
  // Petroff
  ["e4", "e5", "Nf3", "Nf6", "Nxe5", "d6", "Nf3", "Nxe4", "d4", "d5", "Bd3", "Bd6"],
  // Scandinavian
  ["e4", "d5", "exd5", "Qxd5", "Nc3", "Qa5", "d4", "Nf6", "Nf3", "c6"],
];

function bookMove(fen: string, extraLines: string[] = []): Move | null {
  const chess = new Chess(fen);
  const history = chess.history();
  const lines = [
    ...TOURNAMENT_BOOK,
    ...extraLines.map((l) =>
      l
        .replace(/\d+\./g, " ")
        .trim()
        .split(/\s+/)
        .filter(Boolean),
    ),
  ];

  const candidates: string[] = [];
  for (const line of lines) {
    if (history.length >= line.length) continue;
    let match = true;
    for (let i = 0; i < history.length; i++) {
      if (history[i] !== line[i]) {
        match = false;
        break;
      }
    }
    if (match && line[history.length]) candidates.push(line[history.length]);
  }
  if (!candidates.length) return null;

  // Prefer most common book continuation
  const freq = new Map<string, number>();
  for (const c of candidates) freq.set(c, (freq.get(c) ?? 0) + 1);
  const bestSan = [...freq.entries()].sort((a, b) => b[1] - a[1])[0][0];
  try {
    const m = chess.move(bestSan);
    return m;
  } catch {
    return null;
  }
}

const PIECE_VALUE: Record<string, number> = {
  p: 100,
  n: 320,
  b: 330,
  r: 500,
  q: 900,
  k: 20000,
};

function materialEval(chess: Chess, color: "w" | "b"): number {
  let s = 0;
  for (const row of chess.board()) {
    for (const p of row) {
      if (!p) continue;
      const v = PIECE_VALUE[p.type];
      s += p.color === color ? v : -v;
    }
  }
  return s;
}

/** Avoid hanging pieces with a 1-ply safety filter */
function isSafeEnough(fen: string, move: Move, rating: number): boolean {
  if (rating < 900) return true;
  const c = new Chess(fen);
  c.move(move);
  if (c.isCheckmate()) return true;
  const before = materialEval(new Chess(fen), move.color);
  const after = materialEval(c, move.color);
  // lost a queen for nothing?
  if (before - after >= 500 && rating >= 1200) {
    // allow if we also capture big
    if (!move.captured || PIECE_VALUE[move.captured] < 500) {
      // check if opponent can recapture free
      const replies = c.moves({ verbose: true });
      for (const r of replies) {
        if (r.to === move.to && r.captured) return false;
      }
    }
  }
  // hanging our piece on destination?
  if (rating >= 1400) {
    const replies = c.moves({ verbose: true });
    for (const r of replies) {
      if (r.captured === move.piece && r.to === move.to) {
        // unprotected or bad trade
        if (!move.captured || PIECE_VALUE[move.captured] < PIECE_VALUE[move.piece] - 50) {
          return false;
        }
      }
    }
  }
  return true;
}

/**
 * Main bot move picker — tournament openings + deep engine for high Elo.
 */
export function pickBotMove(fen: string, config: BotConfig): Move | null {
  const chess = new Chess(fen);
  const moves = chess.moves({ verbose: true });
  if (!moves.length) return null;

  // 1) Opening book (classical / WC theory)
  if (chess.history().length < 16) {
    const book = bookMove(fen, config.repertoire);
    if (book && isSafeEnough(fen, book, config.rating)) {
      // low-rated bots sometimes skip book
      if (config.rating >= 1000 || Math.random() > 0.35) return book;
    }
  }

  // 2) Deep engine search depth by rating
  const depth = config.useDeepEngine
    ? Math.max(depthForRating(config.rating), 3)
    : depthForRating(config.rating);

  let best: Move | null = null;
  try {
    best = engineMove(fen, depth);
  } catch {
    best = null;
  }

  // 3) Intentional errors only for weaker bots
  if (config.errorRate > 0 && Math.random() < config.errorRate) {
    // pick 2nd–5th engine line-ish by random weaker legal move that isn't free hang for mid+
    const shuffled = [...moves].sort(() => Math.random() - 0.5);
    for (const m of shuffled.slice(0, 8)) {
      if (m.san === best?.san) continue;
      if (config.rating >= 1600 && !isSafeEnough(fen, m, config.rating)) continue;
      // weaker: allow more trash; stronger: only slight inaccuracies
      if (config.rating >= 2000 && Math.random() > 0.15) continue;
      return m;
    }
  }

  if (best && isSafeEnough(fen, best, config.rating)) return best;
  if (best) return best;

  // Fallback: capture > check > center
  const scored = moves.map((m) => {
    let s = Math.random() * 5;
    if (m.captured) s += PIECE_VALUE[m.captured];
    if (m.san.includes("#")) s += 100000;
    if (m.san.includes("+")) s += 30;
    if (["e4", "d4", "e5", "d5"].includes(m.to)) s += 15;
    return { m, s };
  });
  scored.sort((a, b) => b.s - a.s);
  return scored[0].m;
}

export function botDelayMs(config: BotConfig, timeLeftMs: number): number {
  if (timeLeftMs < 8_000) return 80 + Math.random() * 180;
  // Stronger bots "think" a bit more on critical positions
  if (config.rating >= 2400) return 450 + Math.random() * 700;
  if (config.rating >= 1800) return 350 + Math.random() * 550;
  if (config.rating >= 1200) return 280 + Math.random() * 400;
  return 200 + Math.random() * 350;
}

/**
 * Honest rating ladder — error rates calibrated so ~300 Elo beats Spark,
 * struggles vs Ember, and loses to Nova+. Quasar+ should crush club players.
 */
export const BOT_PRESETS: Record<string, BotConfig> = {
  spark: {
    name: "Spark",
    rating: 400,
    style: "beginner",
    errorRate: 0.78,
    aggression: 0.25,
    solidity: 0.15,
    blurb: "Hangs pieces. Good for absolute beginners (~300–500).",
  },
  ember: {
    name: "Ember",
    rating: 800,
    style: "balanced",
    errorRate: 0.42,
    aggression: 0.4,
    solidity: 0.35,
    blurb: "Knows basics, still blunders. (~700–900)",
  },
  nova: {
    name: "Nova",
    rating: 1200,
    style: "tactical",
    errorRate: 0.18,
    aggression: 0.65,
    solidity: 0.45,
    useDeepEngine: true,
    blurb: "Club tactics + book. (~1100–1300)",
  },
  aurora: {
    name: "Aurora",
    rating: 1600,
    style: "solid",
    errorRate: 0.08,
    aggression: 0.4,
    solidity: 0.85,
    useDeepEngine: true,
    blurb: "Positional, rare free pieces. (~1500–1700)",
  },
  quasar: {
    name: "Quasar",
    rating: 2000,
    style: "aggressive",
    errorRate: 0.03,
    aggression: 0.75,
    solidity: 0.75,
    useDeepEngine: true,
    blurb: "Tournament openings + deep search. (~1900–2100)",
  },
  magnus: {
    name: "Summit",
    rating: 2400,
    style: "positional",
    errorRate: 0.012,
    aggression: 0.55,
    solidity: 0.9,
    useDeepEngine: true,
    blurb: "Master technique. Very hard. (~2300–2500)",
  },
  oracle: {
    name: "Oracle",
    rating: 2800,
    style: "worldchamp",
    errorRate: 0.004,
    aggression: 0.6,
    solidity: 0.95,
    useDeepEngine: true,
    blurb: "World-championship book + max depth. Near engine.",
  },
};

export function createTwinBot(name: string, repertoire: string[], rating = 1600): BotConfig {
  return {
    name: `Twin · ${name}`,
    rating,
    style: "twin",
    errorRate: clampError(rating),
    aggression: 0.55,
    solidity: 0.55,
    repertoire,
    useDeepEngine: rating >= 1200,
    blurb: "Clones openings from scouted games + engine middlegame.",
  };
}

function clampError(rating: number) {
  if (rating >= 2400) return 0.01;
  if (rating >= 2000) return 0.03;
  if (rating >= 1600) return 0.08;
  if (rating >= 1200) return 0.18;
  if (rating >= 800) return 0.4;
  return 0.7;
}
