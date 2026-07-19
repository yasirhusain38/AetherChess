import { Chess, type Move, type Square } from "chess.js";

const PIECE_VALUE: Record<string, number> = {
  p: 100,
  n: 320,
  b: 330,
  r: 500,
  q: 900,
  k: 20000,
};

const PST: Record<string, number[]> = {
  p: [
    0, 0, 0, 0, 0, 0, 0, 0, 50, 50, 50, 50, 50, 50, 50, 50, 10, 10, 20, 30, 30, 20, 10, 10, 5, 5, 10,
    25, 25, 10, 5, 5, 0, 0, 0, 20, 20, 0, 0, 0, 5, -5, -10, 0, 0, -10, -5, 5, 5, 10, 10, -20, -20, 10,
    10, 5, 0, 0, 0, 0, 0, 0, 0, 0,
  ],
  n: [
    -50, -40, -30, -30, -30, -30, -40, -50, -40, -20, 0, 0, 0, 0, -20, -40, -30, 0, 10, 15, 15, 10, 0,
    -30, -30, 5, 15, 20, 20, 15, 5, -30, -30, 0, 15, 20, 20, 15, 0, -30, -30, 5, 10, 15, 15, 10, 5,
    -30, -40, -20, 0, 5, 5, 0, -20, -40, -50, -40, -30, -30, -30, -30, -40, -50,
  ],
  b: [
    -20, -10, -10, -10, -10, -10, -10, -20, -10, 0, 0, 0, 0, 0, 0, -10, -10, 0, 5, 10, 10, 5, 0, -10,
    -10, 5, 5, 10, 10, 5, 5, -10, -10, 0, 10, 10, 10, 10, 0, -10, -10, 10, 10, 10, 10, 10, 10, -10,
    -10, 5, 0, 0, 0, 0, 5, -10, -20, -10, -10, -10, -10, -10, -10, -20,
  ],
  r: [
    0, 0, 0, 0, 0, 0, 0, 0, 5, 10, 10, 10, 10, 10, 10, 5, -5, 0, 0, 0, 0, 0, 0, -5, -5, 0, 0, 0, 0, 0,
    0, -5, -5, 0, 0, 0, 0, 0, 0, -5, -5, 0, 0, 0, 0, 0, 0, -5, -5, 0, 0, 0, 0, 0, 0, -5, 0, 0, 0, 5, 5,
    0, 0, 0,
  ],
  q: [
    -20, -10, -10, -5, -5, -10, -10, -20, -10, 0, 0, 0, 0, 0, 0, -10, -10, 0, 5, 5, 5, 5, 0, -10, -5,
    0, 5, 5, 5, 5, 0, -5, 0, 0, 5, 5, 5, 5, 0, -5, -10, 5, 5, 5, 5, 5, 0, -10, -10, 0, 5, 0, 0, 0, 0,
    -10, -20, -10, -10, -5, -5, -10, -10, -20,
  ],
  k: [
    -30, -40, -40, -50, -50, -40, -40, -30, -30, -40, -40, -50, -50, -40, -40, -30, -30, -40, -40,
    -50, -50, -40, -40, -30, -30, -40, -40, -50, -50, -40, -40, -30, -20, -30, -30, -40, -40, -30,
    -30, -20, -10, -20, -20, -20, -20, -20, -20, -10, 20, 20, 0, 0, 0, 0, 20, 20, 20, 30, 10, 0, 0,
    10, 30, 20,
  ],
};

function idx(square: Square, color: "w" | "b") {
  const file = square.charCodeAt(0) - 97;
  const rank = Number(square[1]) - 1;
  const r = color === "w" ? 7 - rank : rank;
  return r * 8 + file;
}

export function evaluateFen(fen: string): number {
  return evaluate(new Chess(fen));
}

function evaluate(chess: Chess): number {
  if (chess.isCheckmate()) return chess.turn() === "w" ? -100000 : 100000;
  if (chess.isDraw()) return 0;

  let score = 0;
  let wb = 0;
  let bb = 0;
  for (const row of chess.board()) {
    for (const p of row) {
      if (!p) continue;
      if (p.type === "b") {
        if (p.color === "w") wb++;
        else bb++;
      }
      const base = PIECE_VALUE[p.type] + (PST[p.type]?.[idx(p.square, p.color)] ?? 0);
      score += p.color === "w" ? base : -base;
    }
  }
  if (wb >= 2) score += 40;
  if (bb >= 2) score -= 40;

  const turn = chess.turn();
  const mobility = chess.moves().length;
  score += turn === "w" ? mobility * 4 : -mobility * 4;
  if (chess.inCheck()) score += turn === "w" ? -60 : 60;
  return score;
}

function orderMoves(moves: Move[]): Move[] {
  return [...moves].sort((a, b) => {
    const score = (m: Move) => {
      let s = 0;
      if (m.san.includes("#")) s += 1_000_000;
      if (m.captured) s += 10 * PIECE_VALUE[m.captured] - PIECE_VALUE[m.piece];
      if (m.promotion) s += 850;
      if (m.san.includes("+")) s += 55;
      if (m.flags.includes("k") || m.flags.includes("q")) s += 45;
      return s;
    };
    return score(b) - score(a);
  });
}

function quiesce(chess: Chess, alpha: number, beta: number, qDepth: number): number {
  const stand =
    chess.turn() === "w" ? evaluate(chess) : -evaluate(chess);
  if (qDepth <= 0 || chess.isGameOver()) return stand;
  if (stand >= beta) return beta;
  if (stand > alpha) alpha = stand;

  const noisy = orderMoves(
    chess
      .moves({ verbose: true })
      .filter((m) => m.captured || m.promotion || m.san.includes("+") || m.san.includes("#")),
  ).slice(0, 16);

  for (const m of noisy) {
    chess.move(m);
    const s = -quiesce(chess, -beta, -alpha, qDepth - 1);
    chess.undo();
    if (s >= beta) return beta;
    if (s > alpha) alpha = s;
  }
  return alpha;
}

function negamax(chess: Chess, depth: number, alpha: number, beta: number, ply: number): number {
  if (chess.isCheckmate()) return -100000 + ply;
  if (chess.isDraw()) return 0;
  if (depth <= 0) return quiesce(chess, alpha, beta, 4);

  const moves = orderMoves(chess.moves({ verbose: true }));
  if (!moves.length) return chess.inCheck() ? -100000 + ply : 0;

  // Late move reduction: full search first 10, shallower for rest at depth>=3
  let i = 0;
  for (const m of moves) {
    chess.move(m);
    let score: number;
    if (i >= 12 && depth >= 3 && !m.captured && !m.san.includes("+")) {
      score = -negamax(chess, depth - 2, -beta, -alpha, ply + 1);
      if (score > alpha) score = -negamax(chess, depth - 1, -beta, -alpha, ply + 1);
    } else {
      score = -negamax(chess, depth - 1, -beta, -alpha, ply + 1);
    }
    chess.undo();
    i++;
    if (score >= beta) return beta;
    if (score > alpha) alpha = score;
  }
  return alpha;
}

export interface EngineResult {
  bestMove: Move | null;
  scoreCp: number;
  depth: number;
  lines: { san: string; scoreCp: number; pv: string[] }[];
  nodes: number;
}

export function analyzePosition(fen: string, depth = 3, multiPv = 3): EngineResult {
  const chess = new Chess(fen);
  const turn = chess.turn();
  const moves = orderMoves(chess.moves({ verbose: true }));
  if (!moves.length) {
    return { bestMove: null, scoreCp: evaluate(chess), depth, lines: [], nodes: 0 };
  }

  const rootDepth = Math.max(1, Math.min(4, depth));
  const scored: { move: Move; scoreWhite: number; pv: string[] }[] = [];

  let alpha = -Infinity;
  for (const m of moves) {
    chess.move(m);
    const scoreSTM = -negamax(chess, rootDepth - 1, -Infinity, Infinity, 1);
    const whiteScore = turn === "w" ? scoreSTM : -scoreSTM;
    const pv = [m.san];
    const reply = orderMoves(chess.moves({ verbose: true }))[0];
    if (reply) pv.push(reply.san);
    chess.undo();
    scored.push({ move: m, scoreWhite: whiteScore, pv });
    if (turn === "w" && whiteScore > alpha) alpha = whiteScore;
    if (turn === "b" && -whiteScore > alpha) alpha = -whiteScore;
  }

  scored.sort((a, b) =>
    turn === "w" ? b.scoreWhite - a.scoreWhite : a.scoreWhite - b.scoreWhite,
  );
  const top = scored.slice(0, multiPv);

  return {
    bestMove: top[0]?.move ?? null,
    scoreCp: top[0]?.scoreWhite ?? 0,
    depth: rootDepth,
    lines: top.map((t) => ({ san: t.move.san, scoreCp: t.scoreWhite, pv: t.pv })),
    nodes: moves.length * rootDepth * 40,
  };
}

export function formatEval(cp: number): string {
  if (cp > 9000) return "M#";
  if (cp < -9000) return "-M#";
  const p = (cp / 100).toFixed(1);
  return cp >= 0 ? `+${p}` : p;
}

/** Fast best-move search with alpha-beta (for bots) */
export function engineMove(fen: string, depth = 2): Move | null {
  const chess = new Chess(fen);
  const rootDepth = Math.max(1, Math.min(4, depth));
  const moves = orderMoves(chess.moves({ verbose: true }));
  if (!moves.length) return null;

  let best: Move | null = null;
  let bestScore = -Infinity;
  let alpha = -Infinity;
  const beta = Infinity;

  for (const m of moves) {
    chess.move(m);
    const score = -negamax(chess, rootDepth - 1, -beta, -alpha, 1);
    chess.undo();
    if (score > bestScore) {
      bestScore = score;
      best = m;
    }
    if (score > alpha) alpha = score;
  }
  return best;
}

export function depthForRating(rating: number): number {
  if (rating >= 2600) return 4;
  if (rating >= 2000) return 3;
  if (rating >= 1400) return 3;
  if (rating >= 1000) return 2;
  if (rating >= 700) return 2;
  return 1;
}
