import type { TimeControl } from "./types";

export const FILES = ["a", "b", "c", "d", "e", "f", "g", "h"] as const;
export const RANKS = ["1", "2", "3", "4", "5", "6", "7", "8"] as const;

export const PIECE_UNICODE: Record<string, string> = {
  wp: "♙",
  wn: "♘",
  wb: "♗",
  wr: "♖",
  wq: "♕",
  wk: "♔",
  bp: "♟",
  bn: "♞",
  bb: "♝",
  br: "♜",
  bq: "♛",
  bk: "♚",
};

/** Cleaner filled-style for both colors on board */
export const PIECE_DISPLAY: Record<string, string> = {
  wp: "♙",
  wn: "♘",
  wb: "♗",
  wr: "♖",
  wq: "♕",
  wk: "♔",
  bp: "♟",
  bn: "♞",
  bb: "♝",
  br: "♜",
  bq: "♛",
  bk: "♚",
};

export const TIME_CONTROLS: TimeControl[] = [
  { id: "1+0", label: "1+0", category: "bullet", baseMs: 60_000, incrementMs: 0 },
  { id: "3+0", label: "3+0", category: "blitz", baseMs: 180_000, incrementMs: 0 },
  { id: "3+2", label: "3+2", category: "blitz", baseMs: 180_000, incrementMs: 2_000 },
  { id: "5+0", label: "5+0", category: "blitz", baseMs: 300_000, incrementMs: 0 },
  { id: "10+0", label: "10+0", category: "rapid", baseMs: 600_000, incrementMs: 0 },
  { id: "15+10", label: "15+10", category: "rapid", baseMs: 900_000, incrementMs: 10_000 },
  { id: "30+0", label: "30+0", category: "classical", baseMs: 1_800_000, incrementMs: 0 },
];

export const START_FEN = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";
