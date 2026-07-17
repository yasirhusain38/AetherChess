"use client";

import { Suspense, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Chess } from "chess.js";
import { Cpu, Sparkles, Upload } from "lucide-react";
import { ChessBoard } from "@/components/chess/ChessBoard";
import { EvalBar } from "@/components/chess/EvalBar";
import { classifyGame, classColor, classLabel } from "@/lib/chess/analysis";
import { analyzePosition, formatEval } from "@/lib/chess/engine";
import { useStorageEpoch } from "@/lib/hooks/useClientStorage";
import { useSettings } from "@/lib/hooks/useSettings";
import { getGame, listGames } from "@/lib/storage";
import { cn } from "@/lib/utils";

const SAMPLE_PGN = `[Event "Aether Demo"]
[Result "1-0"]

1. e4 e5 2. Nf3 Nc6 3. Bc4 Nf6 4. Ng5 d5 5. exd5 Nxd5 6. Nxf7 Kxf7 7. Qf3+ Ke6 8. Nc3 Ncb4 9. a3 Nxc2+ 10. Kd1 Nxa1 11. Nxd5 Kd6 12. d4 Be6 13. Bf4+ Kd7 14. Qe4 c6 15. Nc7+`;

function AnalyzeInner({ initialPgn, initialGameId }: { initialPgn: string; initialGameId: string }) {
  const { settings } = useSettings();
  const epoch = useStorageEpoch();
  const [pgn, setPgn] = useState(initialPgn);
  const [activeGameId, setActiveGameId] = useState(initialGameId);
  const [cursor, setCursor] = useState(0);
  const [engineOn, setEngineOn] = useState(true);
  const [depth, setDepth] = useState(2);

  const gameList = useMemo(() => {
    void epoch;
    if (typeof window === "undefined") return [];
    return listGames().slice(0, 8);
  }, [epoch]);

  const { summary, error } = useMemo(() => {
    try {
      return { summary: classifyGame(pgn), error: null as string | null };
    } catch {
      return { summary: null, error: "Could not parse PGN." };
    }
  }, [pgn]);

  const fenAt = useMemo(() => {
    const c = new Chess();
    if (!summary) return c.fen();
    const n = Math.min(cursor, summary.moves.length);
    for (let i = 0; i < n; i++) {
      try {
        c.move(summary.moves[i].san);
      } catch {
        break;
      }
    }
    return c.fen();
  }, [summary, cursor]);

  const engine = useMemo(() => {
    if (!engineOn) return null;
    try {
      return analyzePosition(fenAt, depth, 3);
    } catch {
      return null;
    }
  }, [fenAt, engineOn, depth]);

  const lastMove =
    summary && cursor > 0
      ? { from: summary.moves[cursor - 1].from, to: summary.moves[cursor - 1].to }
      : null;

  const current = summary && cursor > 0 ? summary.moves[cursor - 1] : null;
  const bestSquares =
    engine?.bestMove ? [engine.bestMove.from, engine.bestMove.to] : [];

  return (
    <div className="fade-up space-y-6">
      <div>
        <div className="section-title">Analyze</div>
        <h1 className="text-2xl sm:text-3xl font-semibold mt-1 flex items-center gap-2">
          <Sparkles className="text-cyan-300" size={28} />
          Story review + engine
        </h1>
        <p className="text-sm text-[var(--text-muted)] mt-1 max-w-2xl">
          Unlimited free review with move classifications and a built-in engine. Import PGN or open a
          saved game.
        </p>
      </div>

      <div className="grid lg:grid-cols-[minmax(0,1fr)_360px] gap-6 items-start">
        <div className="space-y-3">
          <div className="flex gap-3 max-w-[min(100%,600px)]">
            {engineOn && engine && (
              <EvalBar scoreCp={engine.scoreCp} className="h-auto min-h-[280px] self-stretch" />
            )}
            <div className="flex-1 max-w-[min(100%,560px)]">
              <ChessBoard
                fen={fenAt}
                lastMove={settings.highlightLastMove ? lastMove : null}
                interactive={false}
                boardThemeId={settings.boardTheme}
                showCoordinates={settings.coord}
                highlightSquares={engineOn ? bestSquares : []}
              />
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <button type="button" className="btn btn-secondary !py-2" onClick={() => setCursor(0)}>
              Start
            </button>
            <button
              type="button"
              className="btn btn-secondary !py-2"
              onClick={() => setCursor((c) => Math.max(0, c - 1))}
            >
              Prev
            </button>
            <button
              type="button"
              className="btn btn-secondary !py-2"
              onClick={() => setCursor((c) => Math.min(summary?.moves.length ?? 0, c + 1))}
            >
              Next
            </button>
            <button
              type="button"
              className="btn btn-ghost !py-2"
              onClick={() => setCursor(summary?.moves.length ?? 0)}
            >
              End
            </button>
          </div>

          {current && (
            <div className="panel p-4 space-y-1 max-w-[600px]">
              <div className="flex items-center gap-2">
                <span
                  className="text-sm font-semibold"
                  style={{ color: classColor(current.classification) }}
                >
                  {classLabel(current.classification)}
                </span>
                <span className="font-mono text-sm">{current.san}</span>
              </div>
              <p className="text-sm text-[var(--text-muted)]">{current.comment}</p>
            </div>
          )}

          {engineOn && engine && (
            <div className="panel p-4 space-y-2 max-w-[600px]">
              <div className="flex items-center justify-between gap-2">
                <div className="section-title flex items-center gap-2">
                  <Cpu size={12} /> Engine · depth {engine.depth}
                </div>
                <span className="font-mono text-sm text-cyan-300">{formatEval(engine.scoreCp)}</span>
              </div>
              <div className="space-y-1.5">
                {engine.lines.map((line, i) => (
                  <div
                    key={i}
                    className="flex items-center gap-3 text-sm font-mono rounded-lg bg-white/[0.03] px-2 py-1.5"
                  >
                    <span className="text-[var(--text-dim)] w-4">{i + 1}.</span>
                    <span className="text-cyan-200 w-14">{formatEval(line.scoreCp)}</span>
                    <span className="text-[var(--text-muted)] truncate">{line.pv.join(" ")}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="space-y-4">
          <div className="panel p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 section-title">
                <Upload size={12} /> Import PGN
              </div>
              <label className="flex items-center gap-2 text-xs text-[var(--text-muted)] cursor-pointer">
                <input
                  type="checkbox"
                  checked={engineOn}
                  onChange={(e) => setEngineOn(e.target.checked)}
                  className="accent-cyan-300"
                />
                Engine
              </label>
            </div>
            <textarea
              className="input min-h-36 font-mono text-xs leading-relaxed"
              value={pgn}
              onChange={(e) => {
                setPgn(e.target.value);
                setCursor(0);
                setActiveGameId("");
              }}
            />
            {error && <p className="text-xs text-[var(--danger)]">{error}</p>}
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                className="btn btn-secondary !text-xs !py-2"
                onClick={() => {
                  setPgn(SAMPLE_PGN);
                  setCursor(0);
                  setActiveGameId("");
                }}
              >
                Sample game
              </button>
              <select
                className="input !py-2 !text-xs"
                value={depth}
                onChange={(e) => setDepth(Number(e.target.value))}
              >
                <option value={1}>Depth 1 (fast)</option>
                <option value={2}>Depth 2</option>
                <option value={3}>Depth 3 (stronger)</option>
              </select>
            </div>
          </div>

          <div className="panel p-4 space-y-2">
            <div className="section-title">Saved games</div>
            {gameList.length === 0 && (
              <p className="text-xs text-[var(--text-dim)]">Finish a game in Play to review it here.</p>
            )}
            {gameList.map((g) => (
              <button
                key={g.id}
                type="button"
                onClick={() => {
                  setPgn(g.pgn);
                  setCursor(0);
                  setActiveGameId(g.id);
                }}
                className={cn(
                  "w-full text-left rounded-xl border px-3 py-2 text-sm transition-colors",
                  activeGameId === g.id
                    ? "border-cyan-400/40 bg-cyan-400/10"
                    : "border-white/8 hover:border-white/20",
                )}
              >
                <div className="font-medium truncate">
                  {g.white} vs {g.black}
                </div>
                <div className="text-[11px] text-[var(--text-dim)]">
                  {g.result}
                  {g.accuracyWhite != null && ` · ${g.accuracyWhite}% / ${g.accuracyBlack}%`}
                </div>
              </button>
            ))}
          </div>

          {summary && (
            <div className="panel p-4 space-y-3">
              <div className="section-title">Summary</div>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div className="glass rounded-xl p-3">
                  <div className="text-[10px] text-[var(--text-dim)] uppercase">White acc.</div>
                  <div className="text-xl font-semibold font-mono">{summary.accuracyWhite}%</div>
                </div>
                <div className="glass rounded-xl p-3">
                  <div className="text-[10px] text-[var(--text-dim)] uppercase">Black acc.</div>
                  <div className="text-xl font-semibold font-mono">{summary.accuracyBlack}%</div>
                </div>
              </div>
              <div className="text-xs text-[var(--text-muted)]">
                Result: {summary.result} · {summary.reason} · {summary.criticalMoments.length}{" "}
                critical
              </div>

              <div className="max-h-64 overflow-y-auto space-y-1">
                {summary.moves.map((m, i) => (
                  <button
                    key={`${m.san}-${i}`}
                    type="button"
                    onClick={() => setCursor(i + 1)}
                    className={cn(
                      "w-full flex items-center gap-2 rounded-lg px-2 py-1.5 text-left text-sm hover:bg-white/5",
                      cursor === i + 1 && "bg-white/10",
                    )}
                  >
                    <span className="w-8 text-[var(--text-dim)] font-mono text-xs">
                      {Math.floor(i / 2) + 1}
                      {i % 2 === 0 ? "." : "..."}
                    </span>
                    <span className="font-mono">{m.san}</span>
                    <span
                      className="ml-auto text-[10px] font-semibold uppercase"
                      style={{ color: classColor(m.classification) }}
                    >
                      {m.classification}
                    </span>
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

function AnalyzeLoader() {
  const search = useSearchParams();
  const gameId = search.get("game") ?? "";
  let initialPgn = SAMPLE_PGN;
  if (typeof window !== "undefined" && gameId) {
    const g = getGame(gameId);
    if (g?.pgn) initialPgn = g.pgn;
  }
  return (
    <AnalyzeInner key={gameId || "default"} initialPgn={initialPgn} initialGameId={gameId} />
  );
}

export default function AnalyzePage() {
  return (
    <Suspense fallback={<div className="text-[var(--text-muted)]">Loading analysis…</div>}>
      <AnalyzeLoader />
    </Suspense>
  );
}
