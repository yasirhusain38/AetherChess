export type Square =
  | "a1"
  | "b1"
  | "c1"
  | "d1"
  | "e1"
  | "f1"
  | "g1"
  | "h1"
  | "a2"
  | "b2"
  | "c2"
  | "d2"
  | "e2"
  | "f2"
  | "g2"
  | "h2"
  | "a3"
  | "b3"
  | "c3"
  | "d3"
  | "e3"
  | "f3"
  | "g3"
  | "h3"
  | "a4"
  | "b4"
  | "c4"
  | "d4"
  | "e4"
  | "f4"
  | "g4"
  | "h4"
  | "a5"
  | "b5"
  | "c5"
  | "d5"
  | "e5"
  | "f5"
  | "g5"
  | "h5"
  | "a6"
  | "b6"
  | "c6"
  | "d6"
  | "e6"
  | "f6"
  | "g6"
  | "h6"
  | "a7"
  | "b7"
  | "c7"
  | "d7"
  | "e7"
  | "f7"
  | "g7"
  | "h7"
  | "a8"
  | "b8"
  | "c8"
  | "d8"
  | "e8"
  | "f8"
  | "g8"
  | "h8";

export type PieceColor = "w" | "b";
export type PieceType = "p" | "n" | "b" | "r" | "q" | "k";

export type TimeControlId =
  | "1+0"
  | "3+0"
  | "3+2"
  | "5+0"
  | "10+0"
  | "15+10"
  | "30+0";

export interface TimeControl {
  id: TimeControlId;
  label: string;
  category: "bullet" | "blitz" | "rapid" | "classical";
  baseMs: number;
  incrementMs: number;
}

export type MoveClass =
  | "brilliant"
  | "great"
  | "best"
  | "excellent"
  | "good"
  | "book"
  | "inaccuracy"
  | "mistake"
  | "blunder"
  | "miss";

export interface ClassifiedMove {
  san: string;
  from: string;
  to: string;
  color: PieceColor;
  classification: MoveClass;
  comment: string;
  evalBefore?: number;
  evalAfter?: number;
}

export interface GameSummary {
  result: "1-0" | "0-1" | "1/2-1/2" | "*";
  reason: string;
  accuracyWhite: number;
  accuracyBlack: number;
  moves: ClassifiedMove[];
  criticalMoments: number[];
}
