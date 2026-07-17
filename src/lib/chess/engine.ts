import { Chess, type Move, type Square } from "chess.js";

const PIECE_VALUE: Record<string, number> = {
  p: 100,
  n: 320,
  b: 330,
  r: 500,
  q: 900,
  k: 20000,
};

// Simplified piece-square tables (middlegame-ish)
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
  const chess = new Chess(fen);
  return evaluate(chess);
}

function evaluate(chess: Chess): number {
  if (chess.isCheckmate()) return chess.turn() === "w" ? -100000 : 100000;
  if (chess.isDraw()) return 0;

  let score = 0;
  const board = chess.board();
  for (const row of board) {
    for (const p of row) {
      if (!p) continue;
      const base = PIECE_VALUE[p.type] + (PST[p.type]?.[idx(p.square, p.color)] ?? 0);
      score += p.color === "w" ? base : -base;
    }
  }

  // Mobility (cheap)
  const turn = chess.turn();
  const moves = chess.moves().length;
  score += turn === "w" ? moves * 2 : -moves * 2;
  if (chess.inCheck()) score += turn === "w" ? -40 : 40;
  return score;
}

function orderMoves(moves: Move[]): Move[] {
  return moves.sort((a, b) => {
    const cap = (m: Move) => (m.captured ? PIECE_VALUE[m.captured] * 10 - PIECE_VALUE[m.piece] : 0);
    const check = (m: Move) => (m.san.includes("#") ? 10000 : m.san.includes("+") ? 50 : 0);
    return cap(b) + check(b) - (cap(a) + check(a));
  });
}

function negamax(chess: Chess, depth: number, alpha: number, beta: number): number {
  if (depth === 0 || chess.isGameOver()) {
    return chess.turn() === "w" ? evaluate(chess) : -evaluate(chess);
  }

  let best = -Infinity;
  const moves = orderMoves(chess.moves({ verbose: true }));
  for (const m of moves) {
    chess.move(m);
    const score = -negamax(chess, depth - 1, -beta, -alpha);
    chess.undo();
    if (score > best) best = score;
    if (score > alpha) alpha = score;
    if (alpha >= beta) break;
  }
  return best;
}

export interface EngineLine {
  move: Move;
  scoreCp: number; // from side-to-move POV, then converted to white POV in analyzePosition
  san: string;
}

export interface EngineResult {
  bestMove: Move | null;
  scoreCp: number; // white POV centipawns
  depth: number;
  lines: { san: string; scoreCp: number; pv: string[] }[];
  nodes: number;
}

export function analyzePosition(fen: string, depth = 3, multiPv = 3): EngineResult {
  const chess = new Chess(fen);
  const turn = chess.turn();
  const moves = orderMoves(chess.moves({ verbose: true }));
  let nodes = moves.length;

  if (!moves.length) {
    const score = evaluate(chess);
    return { bestMove: null, scoreCp: score, depth, lines: [], nodes: 0 };
  }

  const scored: { move: Move; scoreWhite: number; pv: string[] }[] = [];

  for (const m of moves) {
    chess.move(m);
    let scoreToMove: number;
    if (depth <= 1 || chess.isGameOver()) {
      scoreToMove = turn === "w" ? -evaluate(chess) : evaluate(chess);
      // After we moved, evaluate from opponent view in negamax style
      // Simpler: evaluate board white POV after move, so score for mover is inverted if black
      const whiteEval = evaluate(chess);
      scoreToMove = turn === "w" ? whiteEval : -whiteEval;
    } else {
      // negamax returns score from side-to-move (opponent) perspective after move
      const nm = -negamax(chess, depth - 1, -Infinity, Infinity);
      scoreToMove = nm;
      nodes += 40 * depth;
    }
    const whiteScore = turn === "w" ? scoreToMove : -scoreToMove;
    const pv = [m.san];
    // one-ply PV extension
    const replies = orderMoves(chess.moves({ verbose: true })).slice(0, 1);
    if (replies[0]) pv.push(replies[0].san);
    chess.undo();
    scored.push({ move: m, scoreWhite: whiteScore, pv });
  }

  scored.sort((a, b) => (turn === "w" ? b.scoreWhite - a.scoreWhite : a.scoreWhite - b.scoreWhite));
  const top = scored.slice(0, multiPv);

  return {
    bestMove: top[0]?.move ?? null,
    scoreCp: top[0]?.scoreWhite ?? 0,
    depth,
    lines: top.map((t) => ({
      san: t.move.san,
      scoreCp: t.scoreWhite,
      pv: t.pv,
    })),
    nodes,
  };
}

export function formatEval(cp: number): string {
  if (cp > 9000) return "M#";
  if (cp < -9000) return "-M#";
  const p = (cp / 100).toFixed(1);
  return cp >= 0 ? `+${p}` : p;
}

/** Pick a strong move for bots / puzzles verification */
export function engineMove(fen: string, depth = 2): Move | null {
  return analyzePosition(fen, depth, 1).bestMove;
}
