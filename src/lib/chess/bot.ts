import { Chess, type Move, type Square } from "chess.js";

export type BotStyle =
  | "balanced"
  | "aggressive"
  | "solid"
  | "tactical"
  | "beginner"
  | "twin";

export interface BotConfig {
  name: string;
  rating: number;
  style: BotStyle;
  /** 0–1: chance to pick a weaker move */
  errorRate: number;
  /** Prefer captures / checks when style is aggressive */
  aggression: number;
  /** Prefer developing / castling / central control */
  solidity: number;
  /** Prefer opponent's known openings if twin */
  repertoire?: string[];
}

const PIECE_VALUE: Record<string, number> = {
  p: 100,
  n: 320,
  b: 330,
  r: 500,
  q: 900,
  k: 20000,
};

function squareBonus(sq: Square, piece: string, color: "w" | "b"): number {
  const file = sq.charCodeAt(0) - 97;
  const rank = Number(sq[1]) - 1;
  const r = color === "w" ? rank : 7 - rank;
  const center = 3.5;
  const dist = Math.abs(file - center) + Math.abs(r - center);
  let bonus = (7 - dist) * 4;
  if (piece === "p") bonus += r * 6;
  if (piece === "n" || piece === "b") bonus += (4 - Math.abs(file - 3.5)) * 3;
  return bonus;
}

function evaluateBoard(chess: Chess, perspective: "w" | "b"): number {
  const board = chess.board();
  let score = 0;
  for (const row of board) {
    for (const cell of row) {
      if (!cell) continue;
      const val = PIECE_VALUE[cell.type] + squareBonus(cell.square, cell.type, cell.color);
      score += cell.color === perspective ? val : -val;
    }
  }
  if (chess.isCheck()) {
    score += chess.turn() === perspective ? -45 : 45;
  }
  return score;
}

function scoreMove(chess: Chess, move: Move, config: BotConfig): number {
  const clone = new Chess(chess.fen());
  clone.move(move);
  let score = evaluateBoard(clone, move.color);

  if (move.captured) {
    score += PIECE_VALUE[move.captured] * (0.6 + config.aggression * 0.8);
  }
  if (move.san.includes("+")) {
    score += 40 * config.aggression;
  }
  if (move.san.includes("#")) {
    score += 100000;
  }
  if (move.flags.includes("k") || move.flags.includes("q")) {
    score += 55 * config.solidity;
  }
  if (move.piece === "n" || move.piece === "b") {
    const fromRank = Number(move.from[1]);
    if ((move.color === "w" && fromRank <= 2) || (move.color === "b" && fromRank >= 7)) {
      score += 20 * config.solidity;
    }
  }
  // Prefer center early
  if (["e4", "d4", "e5", "d5", "c4", "f4", "c5", "f5"].includes(move.to)) {
    score += 18;
  }

  // Twin repertoire bias
  if (config.repertoire?.length) {
    const history = chess.history().concat(move.san).join(" ");
    for (const line of config.repertoire) {
      if (line.startsWith(history) || history.startsWith(line)) {
        score += 120;
      }
      if (line.split(" ").includes(move.san)) {
        score += 35;
      }
    }
  }

  // Soft randomness
  score += (Math.random() - 0.5) * (40 + config.errorRate * 180);
  return score;
}

export function pickBotMove(fen: string, config: BotConfig): Move | null {
  const chess = new Chess(fen);
  const moves = chess.moves({ verbose: true });
  if (!moves.length) return null;

  // Sometimes blunder intentionally
  if (Math.random() < config.errorRate * 0.35) {
    const hanging = moves
      .map((m) => {
        const c = new Chess(fen);
        c.move(m);
        const reply = c.moves({ verbose: true });
        let worst = 0;
        for (const r of reply) {
          if (r.captured === m.piece) worst = Math.max(worst, PIECE_VALUE[m.piece]);
          if (r.captured && PIECE_VALUE[r.captured] >= 300) {
            worst = Math.max(worst, PIECE_VALUE[r.captured] * 0.3);
          }
        }
        return { m, worst };
      })
      .filter((x) => x.worst > 0)
      .sort((a, b) => b.worst - a.worst);
    if (hanging[0] && Math.random() < 0.55) return hanging[0].m;
  }

  const scored = moves
    .map((m) => ({ m, s: scoreMove(chess, m, config) }))
    .sort((a, b) => b.s - a.s);

  // Pick among top N based on skill
  const topN = Math.max(1, Math.round(1 + config.errorRate * 8));
  const pool = scored.slice(0, topN);
  return pool[Math.floor(Math.random() * pool.length)].m;
}

export function botDelayMs(config: BotConfig, timeLeftMs: number): number {
  const base = config.rating > 1800 ? 350 : config.rating > 1200 ? 550 : 800;
  const think = base + Math.random() * 700;
  if (timeLeftMs < 10_000) return 120 + Math.random() * 280;
  return think;
}

export const BOT_PRESETS: Record<string, BotConfig> = {
  spark: {
    name: "Spark",
    rating: 600,
    style: "beginner",
    errorRate: 0.72,
    aggression: 0.3,
    solidity: 0.2,
  },
  ember: {
    name: "Ember",
    rating: 1000,
    style: "balanced",
    errorRate: 0.48,
    aggression: 0.45,
    solidity: 0.4,
  },
  nova: {
    name: "Nova",
    rating: 1400,
    style: "tactical",
    errorRate: 0.28,
    aggression: 0.7,
    solidity: 0.45,
  },
  aurora: {
    name: "Aurora",
    rating: 1800,
    style: "solid",
    errorRate: 0.14,
    aggression: 0.4,
    solidity: 0.85,
  },
  quasar: {
    name: "Quasar",
    rating: 2200,
    style: "aggressive",
    errorRate: 0.06,
    aggression: 0.8,
    solidity: 0.7,
  },
};

export function createTwinBot(name: string, repertoire: string[], rating = 1500): BotConfig {
  return {
    name: `Twin · ${name}`,
    rating,
    style: "twin",
    errorRate: clampError(rating),
    aggression: 0.55 + Math.random() * 0.25,
    solidity: 0.4 + Math.random() * 0.35,
    repertoire,
  };
}

function clampError(rating: number) {
  if (rating >= 2200) return 0.05;
  if (rating >= 1800) return 0.12;
  if (rating >= 1400) return 0.25;
  if (rating >= 1000) return 0.4;
  return 0.6;
}
