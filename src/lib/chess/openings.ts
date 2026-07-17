export interface OpeningNode {
  san: string;
  name?: string;
  eco?: string;
  games: number;
  white: number; // win %
  draw: number;
  black: number;
  children?: OpeningNode[];
}

/** Compact masters-style opening book for the explorer MVP */
export const OPENING_TREE: OpeningNode[] = [
  {
    san: "e4",
    name: "King's Pawn",
    eco: "B00",
    games: 420000,
    white: 36,
    draw: 32,
    black: 32,
    children: [
      {
        san: "e5",
        name: "Open Game",
        eco: "C20",
        games: 180000,
        white: 35,
        draw: 34,
        black: 31,
        children: [
          {
            san: "Nf3",
            games: 160000,
            white: 36,
            draw: 34,
            black: 30,
            children: [
              {
                san: "Nc6",
                games: 120000,
                white: 36,
                draw: 34,
                black: 30,
                children: [
                  {
                    san: "Bb5",
                    name: "Ruy Lopez",
                    eco: "C60",
                    games: 55000,
                    white: 37,
                    draw: 36,
                    black: 27,
                  },
                  {
                    san: "Bc4",
                    name: "Italian Game",
                    eco: "C50",
                    games: 40000,
                    white: 36,
                    draw: 33,
                    black: 31,
                  },
                  {
                    san: "d4",
                    name: "Scotch Game",
                    eco: "C44",
                    games: 18000,
                    white: 38,
                    draw: 30,
                    black: 32,
                  },
                ],
              },
              {
                san: "Nf6",
                name: "Petrov",
                eco: "C42",
                games: 25000,
                white: 33,
                draw: 42,
                black: 25,
              },
            ],
          },
        ],
      },
      {
        san: "c5",
        name: "Sicilian Defense",
        eco: "B20",
        games: 150000,
        white: 37,
        draw: 28,
        black: 35,
        children: [
          {
            san: "Nf3",
            games: 120000,
            white: 37,
            draw: 29,
            black: 34,
            children: [
              {
                san: "d6",
                name: "Sicilian · Open prep",
                eco: "B50",
                games: 70000,
                white: 38,
                draw: 28,
                black: 34,
              },
              {
                san: "Nc6",
                games: 35000,
                white: 36,
                draw: 29,
                black: 35,
              },
              {
                san: "e6",
                name: "Sicilian · French-style",
                eco: "B40",
                games: 28000,
                white: 37,
                draw: 30,
                black: 33,
              },
            ],
          },
          {
            san: "c3",
            name: "Alapin",
            eco: "B22",
            games: 15000,
            white: 36,
            draw: 32,
            black: 32,
          },
        ],
      },
      {
        san: "e6",
        name: "French Defense",
        eco: "C00",
        games: 45000,
        white: 38,
        draw: 33,
        black: 29,
      },
      {
        san: "c6",
        name: "Caro-Kann",
        eco: "B10",
        games: 40000,
        white: 36,
        draw: 38,
        black: 26,
      },
    ],
  },
  {
    san: "d4",
    name: "Queen's Pawn",
    eco: "A40",
    games: 380000,
    white: 37,
    draw: 35,
    black: 28,
    children: [
      {
        san: "d5",
        name: "Closed Game",
        eco: "D00",
        games: 160000,
        white: 37,
        draw: 36,
        black: 27,
        children: [
          {
            san: "c4",
            name: "Queen's Gambit",
            eco: "D06",
            games: 110000,
            white: 38,
            draw: 36,
            black: 26,
            children: [
              {
                san: "e6",
                name: "QGD",
                eco: "D30",
                games: 60000,
                white: 37,
                draw: 38,
                black: 25,
              },
              {
                san: "c6",
                name: "Slav",
                eco: "D10",
                games: 35000,
                white: 36,
                draw: 40,
                black: 24,
              },
              {
                san: "dxc4",
                name: "QGA",
                eco: "D20",
                games: 18000,
                white: 39,
                draw: 34,
                black: 27,
              },
            ],
          },
          {
            san: "Nf3",
            name: "London / systems",
            eco: "D02",
            games: 30000,
            white: 36,
            draw: 35,
            black: 29,
          },
        ],
      },
      {
        san: "Nf6",
        name: "Indian Defenses",
        eco: "A45",
        games: 170000,
        white: 36,
        draw: 36,
        black: 28,
        children: [
          {
            san: "c4",
            games: 130000,
            white: 37,
            draw: 36,
            black: 27,
            children: [
              {
                san: "e6",
                name: "Nimzo/Queen's Indian path",
                eco: "E00",
                games: 50000,
                white: 36,
                draw: 38,
                black: 26,
              },
              {
                san: "g6",
                name: "King's Indian / Grünfeld",
                eco: "E60",
                games: 55000,
                white: 38,
                draw: 32,
                black: 30,
              },
            ],
          },
        ],
      },
    ],
  },
  {
    san: "c4",
    name: "English Opening",
    eco: "A10",
    games: 70000,
    white: 36,
    draw: 37,
    black: 27,
  },
  {
    san: "Nf3",
    name: "Réti / flexible",
    eco: "A04",
    games: 55000,
    white: 35,
    draw: 38,
    black: 27,
  },
];

export function walkOpening(moves: string[]): {
  path: OpeningNode[];
  next: OpeningNode[];
  current?: OpeningNode;
} {
  let nodes = OPENING_TREE;
  const path: OpeningNode[] = [];
  for (const san of moves) {
    const hit = nodes.find((n) => n.san === san);
    if (!hit) return { path, next: [], current: path[path.length - 1] };
    path.push(hit);
    nodes = hit.children ?? [];
  }
  return { path, next: nodes, current: path[path.length - 1] };
}
