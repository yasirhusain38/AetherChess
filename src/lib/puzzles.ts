export interface Puzzle {
  id: string;
  fen: string;
  /** Solution in UCI-ish from-to pairs or SAN sequence */
  solutionSan: string[];
  theme: string;
  rating: number;
  sideToMove: "w" | "b";
}

export const PUZZLES: Puzzle[] = [
  {
    id: "p1",
    fen: "r1bqkb1r/pppp1ppp/2n2n2/4p2Q/2B1P3/8/PPPP1PPP/RNB1K1NR w KQkq - 4 4",
    solutionSan: ["Qxf7#"],
    theme: "Mate in 1",
    rating: 600,
    sideToMove: "w",
  },
  {
    id: "p2",
    fen: "r1bqk2r/pppp1ppp/2n2n2/2b1p3/2B1P3/3P1N2/PPP2PPP/RNBQK2R w KQkq - 1 5",
    solutionSan: ["Bxf7+", "Kxf7", "Nxe5+"],
    theme: "Fork",
    rating: 900,
    sideToMove: "w",
  },
  {
    id: "p3",
    fen: "2r3k1/pp3ppp/8/8/8/8/PPP2PPP/2KR4 w - - 0 1",
    solutionSan: ["Rd8+", "Rxd8", "Kxd8"],
    theme: "Back rank",
    rating: 700,
    sideToMove: "w",
  },
  {
    id: "p4",
    fen: "r4rk1/ppp2ppp/2n5/3p4/3P4/2PB1Q2/P1P2PPP/R3R1K1 w - - 0 1",
    solutionSan: ["Qxh7+", "Kxh7", "Rh3+", "Kg8", "Rh8#"],
    theme: "Greek gift ideas",
    rating: 1400,
    sideToMove: "w",
  },
  {
    id: "p5",
    fen: "6k1/5ppp/8/8/8/5Q2/5PPP/6K1 w - - 0 1",
    solutionSan: ["Qa8#"],
    theme: "Mate in 1",
    rating: 500,
    sideToMove: "w",
  },
  {
    id: "p6",
    fen: "r2q1rk1/ppp2ppp/2n1bn2/3p4/3P4/2NBPN2/PPP2PPP/R2QK2R w KQ - 0 1",
    solutionSan: ["Bxh7+", "Kxh7", "Ng5+", "Kg8", "Qh5"],
    theme: "Attack",
    rating: 1200,
    sideToMove: "w",
  },
];
