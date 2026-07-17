"use client";

import { useCallback, useMemo, useState } from "react";
import { Chess, type Square as ChessSquare } from "chess.js";
import { FILES, PIECE_DISPLAY, RANKS } from "@/lib/chess/constants";
import { getBoardTheme } from "@/lib/chess/themes";
import { cn } from "@/lib/utils";

export interface BoardMove {
  from: string;
  to: string;
  promotion?: "q" | "r" | "b" | "n";
}

interface ChessBoardProps {
  fen: string;
  orientation?: "white" | "black";
  interactive?: boolean;
  lastMove?: { from: string; to: string } | null;
  onMove?: (move: BoardMove) => boolean | void;
  highlightSquares?: string[];
  className?: string;
  boardThemeId?: string;
  showLegalMoves?: boolean;
  showCoordinates?: boolean;
  allowBothSides?: boolean;
}

export function ChessBoard(props: ChessBoardProps) {
  // Remount selection state whenever the position changes
  return <ChessBoardInner key={props.fen} {...props} />;
}

function ChessBoardInner({
  fen,
  orientation = "white",
  interactive = true,
  lastMove = null,
  onMove,
  highlightSquares = [],
  className,
  boardThemeId = "aether",
  showLegalMoves = true,
  showCoordinates = true,
  allowBothSides = false,
}: ChessBoardProps) {
  const [selected, setSelected] = useState<string | null>(null);
  const [legalTargets, setLegalTargets] = useState<string[]>([]);
  const [dragSq, setDragSq] = useState<string | null>(null);

  const theme = getBoardTheme(boardThemeId);

  const chess = useMemo(() => {
    try {
      return new Chess(fen);
    } catch {
      return new Chess();
    }
  }, [fen]);

  const turn = chess.turn();
  const inCheck = chess.inCheck();
  const kingSquare = useMemo(() => {
    if (!inCheck) return null;
    for (const row of chess.board()) {
      for (const p of row) {
        if (p && p.type === "k" && p.color === turn) return p.square;
      }
    }
    return null;
  }, [chess, inCheck, turn]);

  const ranks = orientation === "white" ? [...RANKS].reverse() : [...RANKS];
  const files = orientation === "white" ? [...FILES] : [...FILES].reverse();

  const pieceMap = useMemo(() => {
    const map = new Map<string, { type: string; color: "w" | "b" }>();
    for (const row of chess.board()) {
      for (const p of row) {
        if (p) map.set(p.square, { type: p.type, color: p.color });
      }
    }
    return map;
  }, [chess]);

  const clearSelection = useCallback(() => {
    setSelected(null);
    setLegalTargets([]);
  }, []);

  const canControl = useCallback(
    (color: "w" | "b") => {
      if (allowBothSides) return color === turn;
      return color === turn;
    },
    [allowBothSides, turn],
  );

  const attemptMove = useCallback(
    (from: string, to: string) => {
      const piece = pieceMap.get(from);
      if (!piece) return false;
      // Validate move is legal before calling parent
      const legal = chess.moves({ square: from as ChessSquare, verbose: true });
      if (!legal.some((m) => m.to === to)) {
        clearSelection();
        return false;
      }
      const needsPromo =
        piece.type === "p" &&
        ((piece.color === "w" && to[1] === "8") || (piece.color === "b" && to[1] === "1"));
      const ok = onMove?.({
        from,
        to,
        promotion: needsPromo ? "q" : undefined,
      });
      clearSelection();
      return ok !== false;
    },
    [pieceMap, onMove, chess, clearSelection],
  );

  const selectSquare = useCallback(
    (sq: string) => {
      if (!interactive) return;
      const piece = pieceMap.get(sq);

      // Select own piece
      if (piece && piece.color === turn && canControl(piece.color)) {
        if (selected === sq) {
          clearSelection();
          return;
        }
        setSelected(sq);
        const moves = chess.moves({ square: sq as ChessSquare, verbose: true });
        setLegalTargets(moves.map((m) => m.to));
        return;
      }

      // Try move to square
      if (selected && legalTargets.includes(sq)) {
        attemptMove(selected, sq);
        return;
      }

      clearSelection();
    },
    [
      interactive,
      pieceMap,
      canControl,
      turn,
      selected,
      legalTargets,
      chess,
      attemptMove,
      clearSelection,
    ],
  );

  const onDragStart = (sq: string, e: React.DragEvent) => {
    if (!interactive) {
      e.preventDefault();
      return;
    }
    const piece = pieceMap.get(sq);
    if (!piece || piece.color !== turn || !canControl(piece.color)) {
      e.preventDefault();
      return;
    }
    setDragSq(sq);
    setSelected(sq);
    const moves = chess.moves({ square: sq as ChessSquare, verbose: true });
    setLegalTargets(moves.map((m) => m.to));
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", sq);
  };

  const onDrop = (to: string, e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const from = e.dataTransfer.getData("text/plain") || dragSq;
    setDragSq(null);
    if (!from) return;
    const moves = chess.moves({ square: from as ChessSquare, verbose: true });
    if (moves.some((m) => m.to === to)) attemptMove(from, to);
    else clearSelection();
  };

  return (
    <div
      className={cn("chess-board", className)}
      role="grid"
      aria-label="Chess board"
      style={
        {
          "--board-light": theme.light,
          "--board-dark": theme.dark,
          "--board-hl-from": theme.hlFrom,
          "--board-hl-to": theme.hlTo,
        } as React.CSSProperties
      }
    >
      <div className="chess-board-grid">
        {ranks.map((rank, ri) =>
          files.map((file, fi) => {
            const sq = `${file}${rank}`;
            const isLight = (ri + fi) % 2 === 1;
            const piece = pieceMap.get(sq);
            const isSelected = selected === sq;
            const isLast = Boolean(lastMove && (lastMove.from === sq || lastMove.to === sq));
            const isLegal = showLegalMoves && legalTargets.includes(sq);
            const isCapture = isLegal && Boolean(piece);
            const isKingCheck = kingSquare === sq;
            const isExtra = highlightSquares.includes(sq);
            const showFile = showCoordinates && ri === 7;
            const showRank = showCoordinates && fi === 0;

            return (
              <button
                key={sq}
                type="button"
                className={cn(
                  "square",
                  isLight ? "square-light" : "square-dark",
                  isSelected && "square-selected",
                  isLast && "square-last",
                  isKingCheck && "square-check",
                )}
                style={
                  isExtra && !isSelected
                    ? { boxShadow: "inset 0 0 0 3px rgba(192, 132, 252, 0.7)" }
                    : undefined
                }
                onClick={() => selectSquare(sq)}
                onDragOver={(e) => {
                  e.preventDefault();
                  e.dataTransfer.dropEffect = "move";
                }}
                onDrop={(e) => onDrop(sq, e)}
                aria-label={
                  piece
                    ? `${sq}, ${piece.color === "w" ? "white" : "black"} ${piece.type}`
                    : sq
                }
              >
                {showRank && (
                  <span
                    className="coord coord-rank"
                    style={{ color: isLight ? theme.dark : theme.light }}
                  >
                    {rank}
                  </span>
                )}
                {showFile && (
                  <span
                    className="coord coord-file"
                    style={{ color: isLight ? theme.dark : theme.light }}
                  >
                    {file}
                  </span>
                )}
                {isLegal && !isCapture && <span className="legal-dot" />}
                {isLegal && isCapture && <span className="legal-ring" />}
                {piece && (
                  <span
                    className={cn(
                      "piece",
                      interactive && piece.color === turn && "piece-draggable",
                    )}
                    draggable={interactive && piece.color === turn}
                    onDragStart={(e) => onDragStart(sq, e)}
                    onDragEnd={() => setDragSq(null)}
                    style={{
                      color: piece.color === "w" ? "#f8fafc" : "#0f172a",
                      textShadow:
                        piece.color === "w"
                          ? "0 1px 0 #94a3b8, 0 2px 4px rgba(0,0,0,0.45)"
                          : "0 1px 0 #334155, 0 2px 3px rgba(0,0,0,0.35)",
                      opacity: dragSq === sq ? 0.35 : 1,
                    }}
                  >
                    {PIECE_DISPLAY[`${piece.color}${piece.type}`]}
                  </span>
                )}
              </button>
            );
          }),
        )}
      </div>
    </div>
  );
}
