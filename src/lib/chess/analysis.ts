import { Chess, type Move } from "chess.js";
import type { ClassifiedMove, GameSummary, MoveClass } from "./types";

const PIECE_VALUE: Record<string, number> = {
  p: 1,
  n: 3,
  b: 3,
  r: 5,
  q: 9,
  k: 0,
};

function material(chess: Chess, color: "w" | "b") {
  return chess
    .board()
    .flat()
    .filter((p) => p && p.color === color)
    .reduce((s, p) => s + PIECE_VALUE[p!.type], 0);
}

function roughEval(chess: Chess): number {
  // Centipawn-ish from white POV
  const w = material(chess, "w");
  const b = material(chess, "b");
  let cp = (w - b) * 100;

  // Mobility
  const turn = chess.turn();
  const moves = chess.moves().length;
  cp += turn === "w" ? moves * 2 : -moves * 2;

  if (chess.isCheckmate()) {
    return turn === "w" ? -10000 : 10000;
  }
  if (chess.isDraw()) return 0;
  if (chess.isCheck()) {
    cp += turn === "w" ? -25 : 25;
  }
  return cp;
}

function classifyDelta(delta: number, isCapture: boolean, isCheck: boolean, ply: number): MoveClass {
  // delta = evalAfter - evalBefore from mover perspective (positive = improved)
  if (ply < 8 && !isCapture) return "book";
  if (delta >= 180) return "brilliant";
  if (delta >= 90) return "great";
  if (delta >= 35) return "best";
  if (delta >= 10) return "excellent";
  if (delta >= -25) return "good";
  if (delta >= -80) return "inaccuracy";
  if (delta >= -180) return "mistake";
  if (isCheck && delta < -100) return "miss";
  return "blunder";
}

const COMMENTS: Record<MoveClass, string[]> = {
  brilliant: [
    "A dazzling resource — hard for most humans to find.",
    "Brilliant. This flips the evaluation with style.",
  ],
  great: ["Great move. You found the strong idea.", "Excellent calculation — pressure increases."],
  best: ["Best move. Engine-approved.", "Precise. Keeps maximum advantage."],
  excellent: ["Excellent. Clean and purposeful.", "Strong continuation."],
  good: ["Solid. Nothing wrong here.", "Good practical choice."],
  book: ["Opening book move — on well-known ground.", "Theory. Keep developing with a plan."],
  inaccuracy: [
    "Slight inaccuracy. A cleaner move was available.",
    "A bit imprecise — small edge slips away.",
  ],
  mistake: [
    "Mistake. Opponent can punish this.",
    "This hands over a real chance — recalculate tactics.",
  ],
  blunder: [
    "Blunder. Material or mate threats appear.",
    "Heavy error — check hanging pieces and forced lines.",
  ],
  miss: ["Missed a stronger shot — look for checks, captures, threats.", "A bigger idea was hiding."],
};

function commentFor(c: MoveClass) {
  const list = COMMENTS[c];
  return list[Math.floor(Math.random() * list.length)];
}

export function classifyGame(pgnOrHistory: string[] | string): GameSummary {
  const chess = new Chess();
  const movesVerbose: Move[] = [];

  if (Array.isArray(pgnOrHistory)) {
    for (const san of pgnOrHistory) {
      try {
        const m = chess.move(san);
        if (!m) break;
        movesVerbose.push(m);
      } catch {
        break;
      }
    }
  } else {
    try {
      chess.loadPgn(pgnOrHistory);
    } catch {
      /* try partial */
    }
    const sans = chess.history();
    chess.reset();
    for (const san of sans) {
      try {
        const m = chess.move(san);
        if (m) movesVerbose.push(m);
      } catch {
        break;
      }
    }
  }

  chess.reset();
  const classified: ClassifiedMove[] = [];
  let prevEval = roughEval(chess);
  const whiteScores: number[] = [];
  const blackScores: number[] = [];
  const critical: number[] = [];

  movesVerbose.forEach((m, i) => {
    chess.move(m);
    const after = roughEval(chess);
    const moverIsWhite = m.color === "w";
    // eval from white POV; convert to mover perspective delta
    const delta = moverIsWhite ? after - prevEval : prevEval - after;
    const classification = classifyDelta(delta, Boolean(m.captured), m.san.includes("+"), i);
    if (classification === "blunder" || classification === "mistake" || classification === "brilliant") {
      critical.push(i);
    }
    const quality =
      classification === "brilliant" || classification === "great" || classification === "best"
        ? 100
        : classification === "excellent"
          ? 95
          : classification === "good" || classification === "book"
            ? 85
            : classification === "inaccuracy"
              ? 60
              : classification === "mistake"
                ? 35
                : 10;
    if (moverIsWhite) whiteScores.push(quality);
    else blackScores.push(quality);

    classified.push({
      san: m.san,
      from: m.from,
      to: m.to,
      color: m.color,
      classification,
      comment: commentFor(classification),
      evalBefore: prevEval,
      evalAfter: after,
    });
    prevEval = after;
  });

  const avg = (arr: number[]) => (arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : 90);

  let result: GameSummary["result"] = "*";
  let reason = "Game in progress";
  if (chess.isCheckmate()) {
    result = chess.turn() === "w" ? "0-1" : "1-0";
    reason = "Checkmate";
  } else if (chess.isStalemate()) {
    result = "1/2-1/2";
    reason = "Stalemate";
  } else if (chess.isThreefoldRepetition()) {
    result = "1/2-1/2";
    reason = "Threefold repetition";
  } else if (chess.isInsufficientMaterial()) {
    result = "1/2-1/2";
    reason = "Insufficient material";
  } else if (chess.isDraw()) {
    result = "1/2-1/2";
    reason = "Draw";
  }

  return {
    result,
    reason,
    accuracyWhite: Math.round(avg(whiteScores) * 10) / 10,
    accuracyBlack: Math.round(avg(blackScores) * 10) / 10,
    moves: classified,
    criticalMoments: critical,
  };
}

export function classColor(c: MoveClass): string {
  switch (c) {
    case "brilliant":
      return "var(--brilliant)";
    case "great":
    case "best":
      return "var(--accent)";
    case "excellent":
    case "good":
    case "book":
      return "var(--success)";
    case "inaccuracy":
      return "var(--warning)";
    case "mistake":
      return "#ff9f43";
    case "blunder":
    case "miss":
      return "var(--danger)";
  }
}

export function classLabel(c: MoveClass): string {
  return c.charAt(0).toUpperCase() + c.slice(1);
}
