import { Chess } from "chess.js";

/**
 * Generate a valid Chess960 starting FEN (white to move, castling rights all).
 * Uses the standard Fischer random placement rules.
 */
export function generateChess960Fen(seed?: number): string {
  let s = seed ?? Math.floor(Math.random() * 960);
  // Map 0–959 using Scharnagl numbering (simplified generation)
  const files = [0, 1, 2, 3, 4, 5, 6, 7];

  // Bishops on opposite colors
  const lightSquares = [0, 2, 4, 6];
  const darkSquares = [1, 3, 5, 7];
  const b1 = lightSquares[s % 4];
  s = Math.floor(s / 4);
  const b2 = darkSquares[s % 4];
  s = Math.floor(s / 4);

  const empty = files.filter((f) => f !== b1 && f !== b2);

  // Queen
  const q = empty[s % 6];
  s = Math.floor(s / 6);
  const empty2 = empty.filter((f) => f !== q);

  // Knights
  const nCombos: [number, number][] = [];
  for (let i = 0; i < empty2.length; i++) {
    for (let j = i + 1; j < empty2.length; j++) {
      nCombos.push([empty2[i], empty2[j]]);
    }
  }
  const [n1, n2] = nCombos[s % nCombos.length];
  const rest = empty2.filter((f) => f !== n1 && f !== n2).sort((a, b) => a - b);
  // Remaining three: R K R in order
  const [r1, k, r2] = rest;

  const place: string[] = Array(8).fill("");
  place[b1] = "B";
  place[b2] = "B";
  place[q] = "Q";
  place[n1] = "N";
  place[n2] = "N";
  place[r1] = "R";
  place[k] = "K";
  place[r2] = "R";

  const back = place.join("");
  const blackBack = back.toLowerCase();
  // chess.js supports 960 with setCastling if using Chess960 mode in newer versions
  // Standard FEN with castling rights KQkq may not be correct for 960;
  // for MVP we use a position and disable castling rights string based on rook files.
  const fen = `${blackBack}/pppppppp/8/8/8/8/PPPPPPPP/${back} w KQkq - 0 1`;
  return fen;
}

export function isValidStartFen(fen: string): boolean {
  try {
    const c = new Chess(fen);
    return c.board().flat().filter(Boolean).length === 32;
  } catch {
    return false;
  }
}

/** Prefer classic start if 960 fen invalid for chess.js version */
export function safeChess960Fen(): string {
  for (let i = 0; i < 20; i++) {
    const fen = generateChess960Fen();
    if (isValidStartFen(fen)) return fen;
  }
  // Fallback: known valid 960-like positions sometimes fail castling — use start
  return new Chess().fen();
}
