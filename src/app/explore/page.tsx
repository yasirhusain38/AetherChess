"use client";

import { useMemo, useState } from "react";
import { Chess } from "chess.js";
import { Compass, RotateCcw } from "lucide-react";
import { ChessBoard } from "@/components/chess/ChessBoard";
import { walkOpening } from "@/lib/chess/openings";
import { useSettings } from "@/lib/hooks/useSettings";
import { cn } from "@/lib/utils";

export default function ExplorePage() {
  const { settings } = useSettings();
  const [moves, setMoves] = useState<string[]>([]);

  const fen = useMemo(() => {
    const c = new Chess();
    for (const san of moves) {
      try {
        c.move(san);
      } catch {
        break;
      }
    }
    return c.fen();
  }, [moves]);

  const lastMove = useMemo(() => {
    if (!moves.length) return null;
    const c = new Chess();
    let lm: { from: string; to: string } | null = null;
    for (const san of moves) {
      const m = c.move(san);
      if (m) lm = { from: m.from, to: m.to };
    }
    return lm;
  }, [moves]);

  const { path, next, current } = walkOpening(moves);

  const playSan = (san: string) => {
    const c = new Chess(fen);
    try {
      const m = c.move(san);
      if (m) setMoves((prev) => [...prev, m.san]);
    } catch {
      // ignore
    }
  };

  const onBoardMove = (m: { from: string; to: string; promotion?: "q" | "r" | "b" | "n" }) => {
    const c = new Chess(fen);
    try {
      const moved = c.move({ from: m.from, to: m.to, promotion: m.promotion ?? "q" });
      if (!moved) return false;
      setMoves((prev) => [...prev, moved.san]);
      return true;
    } catch {
      return false;
    }
  };

  return (
    <div className="fade-up space-y-6">
      <div>
        <div className="section-title">Opening Explorer</div>
        <h1 className="text-2xl sm:text-3xl font-semibold mt-1 flex items-center gap-2">
          <Compass className="text-cyan-300" size={28} />
          Explore
        </h1>
        <p className="text-sm text-[var(--text-muted)] mt-1 max-w-2xl">
          Masters-style opening book (embedded sample database). Click moves in the table or play
          them on the board. Full live DB comes with the backend pipeline.
        </p>
      </div>

      <div className="grid lg:grid-cols-[minmax(0,1fr)_380px] gap-6 items-start">
        <div className="space-y-3 max-w-[min(100%,560px)]">
          <ChessBoard
            fen={fen}
            lastMove={lastMove}
            onMove={onBoardMove}
            boardThemeId={settings.boardTheme}
            showLegalMoves={settings.showLegalMoves}
            showCoordinates={settings.coord}
          />
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              className="btn btn-secondary !py-2"
              onClick={() => setMoves([])}
            >
              <RotateCcw size={14} />
              Reset
            </button>
            <button
              type="button"
              className="btn btn-ghost !py-2"
              onClick={() => setMoves((m) => m.slice(0, -1))}
              disabled={!moves.length}
            >
              Back
            </button>
            <div className="text-xs font-mono text-[var(--text-muted)]">
              {moves.length ? moves.join(" ") : "Starting position"}
            </div>
          </div>
          {current && (
            <div className="panel p-4">
              <div className="font-semibold">
                {current.name ?? "Variation"}{" "}
                {current.eco && (
                  <span className="text-xs text-cyan-300 font-mono ml-1">{current.eco}</span>
                )}
              </div>
              <div className="text-xs text-[var(--text-muted)] mt-1">
                {current.games.toLocaleString()} games · W {current.white}% · D {current.draw}% · B{" "}
                {current.black}%
              </div>
            </div>
          )}
        </div>

        <div className="panel p-4 space-y-3">
          <div className="section-title">Moves from here</div>
          {next.length === 0 && (
            <p className="text-sm text-[var(--text-dim)]">
              End of sample book. Play free moves on the board or go back.
            </p>
          )}
          <div className="space-y-1.5">
            {next.map((n) => (
              <button
                key={n.san}
                type="button"
                onClick={() => playSan(n.san)}
                className="w-full rounded-xl border border-white/8 bg-white/[0.03] px-3 py-2.5 text-left hover:border-cyan-400/30 transition-colors"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="font-mono font-semibold">{n.san}</span>
                  <span className="text-[11px] text-[var(--text-dim)]">
                    {n.games.toLocaleString()}
                  </span>
                </div>
                {n.name && (
                  <div className="text-xs text-[var(--text-muted)] mt-0.5">
                    {n.name}
                    {n.eco ? ` · ${n.eco}` : ""}
                  </div>
                )}
                <div className="mt-2 h-1.5 rounded-full overflow-hidden flex bg-white/5">
                  <div className="bg-white" style={{ width: `${n.white}%` }} />
                  <div className="bg-[var(--text-dim)]" style={{ width: `${n.draw}%` }} />
                  <div className="bg-neutral-800" style={{ width: `${n.black}%` }} />
                </div>
                <div className="flex justify-between text-[10px] text-[var(--text-dim)] mt-1 font-mono">
                  <span>{n.white}%</span>
                  <span>{n.draw}%</span>
                  <span>{n.black}%</span>
                </div>
              </button>
            ))}
          </div>

          {path.length > 0 && (
            <div className="pt-2 border-t border-white/5">
              <div className="section-title mb-2">Path</div>
              <div className="flex flex-wrap gap-1.5">
                {path.map((p, i) => (
                  <button
                    key={i}
                    type="button"
                    className={cn("chip !py-1")}
                    onClick={() => setMoves(moves.slice(0, i + 1))}
                  >
                    {p.san}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
