"use client";

import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Chess } from "chess.js";
import { CheckCircle2, Flame, GraduationCap, Timer, Zap } from "lucide-react";
import { ChessBoard } from "@/components/chess/ChessBoard";
import { getCoachPlan } from "@/lib/coach";
import { playSound, soundFromSan } from "@/lib/chess/sound";
import { useSettings } from "@/lib/hooks/useSettings";
import { PUZZLES } from "@/lib/puzzles";
import { bumpStats } from "@/lib/storage";
import { cn } from "@/lib/utils";

function tabFromMode(mode: string | null): "plan" | "puzzles" | "storm" {
  if (mode === "storm") return "storm";
  if (mode === "puzzles" || mode === "endgame") return "puzzles";
  return "plan";
}

function TrainInner() {
  const search = useSearchParams();
  const mode = search.get("mode");
  const { settings } = useSettings();
  const plan = useMemo(() => getCoachPlan(), []);
  const [done, setDone] = useState<Record<string, boolean>>({});
  // Remount via key when mode changes (see TrainLoader)
  const [tab, setTab] = useState<"plan" | "puzzles" | "storm">(() => tabFromMode(mode));

  // Puzzles
  const [puzzleIndex, setPuzzleIndex] = useState(0);
  const [puzzleFen, setPuzzleFen] = useState(PUZZLES[0].fen);
  const [solutionIdx, setSolutionIdx] = useState(0);
  const [msg, setMsg] = useState("Find the best move.");
  const [solved, setSolved] = useState(0);
  const [failed, setFailed] = useState(0);

  // Storm
  const [stormActive, setStormActive] = useState(false);
  const [stormLeft, setStormLeft] = useState(180);
  const [stormScore, setStormScore] = useState(0);
  const [stormIndex, setStormIndex] = useState(0);
  const [stormFen, setStormFen] = useState(PUZZLES[0].fen);
  const [stormSolIdx, setStormSolIdx] = useState(0);
  const [stormBest, setStormBest] = useState(0);
  const stormScoreRef = useRef(0);
  const stormEndedRef = useRef(false);

  const puzzle = PUZZLES[puzzleIndex % PUZZLES.length];
  const weeklyPct = Math.round((plan.weeklyDoneMinutes / plan.weeklyGoalMinutes) * 100);

  const loadPuzzle = (idx: number) => {
    const p = PUZZLES[idx % PUZZLES.length];
    setPuzzleIndex(idx);
    setPuzzleFen(p.fen);
    setSolutionIdx(0);
    setMsg(`${p.theme} · ${p.rating} · Your move`);
  };

  const loadStormPuzzle = (idx: number) => {
    const p = PUZZLES[idx % PUZZLES.length];
    setStormIndex(idx);
    setStormFen(p.fen);
    setStormSolIdx(0);
  };

  useEffect(() => {
    if (!stormActive) return;
    stormEndedRef.current = false;
    const started = Date.now();
    const total = 180_000;
    const id = window.setInterval(() => {
      const left = Math.max(0, Math.ceil((total - (Date.now() - started)) / 1000));
      setStormLeft(left);
      if (left <= 0 && !stormEndedRef.current) {
        stormEndedRef.current = true;
        window.clearInterval(id);
        setStormActive(false);
        const score = stormScoreRef.current;
        bumpStats({ stormBest: score });
        setStormBest((b) => Math.max(b, score));
        playSound("gameEnd", settings.sound);
      }
    }, 250);
    return () => window.clearInterval(id);
  }, [stormActive, settings.sound]);

  const startStorm = () => {
    stormScoreRef.current = 0;
    stormEndedRef.current = false;
    setStormActive(true);
    setStormLeft(180);
    setStormScore(0);
    loadStormPuzzle(Math.floor(Math.random() * PUZZLES.length));
  };

  const onPuzzleMove = (m: { from: string; to: string; promotion?: "q" | "r" | "b" | "n" }) => {
    const c = new Chess(puzzleFen);
    let moved;
    try {
      moved = c.move({ from: m.from, to: m.to, promotion: m.promotion ?? "q" });
    } catch {
      return false;
    }
    if (!moved) return false;
    soundFromSan(moved.san, settings.sound);

    const expected = puzzle.solutionSan[solutionIdx];
    if (moved.san === expected || moved.san.replace("=", "") === expected.replace("=", "")) {
      let nextIdx = solutionIdx + 1;
      setPuzzleFen(c.fen());
      if (nextIdx >= puzzle.solutionSan.length) {
        setMsg("Solved!");
        setSolved((s) => s + 1);
        bumpStats({ puzzlesSolved: 1 });
        playSound("success", settings.sound);
        window.setTimeout(() => loadPuzzle(puzzleIndex + 1), 550);
        return true;
      }
      const reply = puzzle.solutionSan[nextIdx];
      try {
        const replyMove = c.move(reply);
        if (replyMove) {
          setPuzzleFen(c.fen());
          nextIdx += 1;
          setSolutionIdx(nextIdx);
          if (nextIdx >= puzzle.solutionSan.length) {
            setMsg("Solved!");
            setSolved((s) => s + 1);
            bumpStats({ puzzlesSolved: 1 });
            playSound("success", settings.sound);
            window.setTimeout(() => loadPuzzle(puzzleIndex + 1), 550);
          } else setMsg("Good — keep going.");
          return true;
        }
      } catch {
        /* continue */
      }
      setSolutionIdx(nextIdx);
      setMsg("Good — keep going.");
      return true;
    }

    setMsg(`Not it. Idea starts with ${expected}.`);
    setFailed((f) => f + 1);
    playSound("error", settings.sound);
    setPuzzleFen(puzzle.fen);
    setSolutionIdx(0);
    return false;
  };

  const onStormMove = (m: { from: string; to: string; promotion?: "q" | "r" | "b" | "n" }) => {
    if (!stormActive) return false;
    const p = PUZZLES[stormIndex % PUZZLES.length];
    const c = new Chess(stormFen);
    let moved;
    try {
      moved = c.move({ from: m.from, to: m.to, promotion: m.promotion ?? "q" });
    } catch {
      return false;
    }
    if (!moved) return false;
    const expected = p.solutionSan[stormSolIdx];
    if (moved.san === expected || moved.san.replace("=", "") === expected.replace("=", "")) {
      let next = stormSolIdx + 1;
      setStormFen(c.fen());
      if (next < p.solutionSan.length) {
        try {
          const r = c.move(p.solutionSan[next]);
          if (r) {
            setStormFen(c.fen());
            next += 1;
          }
        } catch {
          /* */
        }
      }
      if (next >= p.solutionSan.length) {
        setStormScore((s) => {
          const ns = s + 1;
          stormScoreRef.current = ns;
          return ns;
        });
        playSound("success", settings.sound);
        loadStormPuzzle(stormIndex + 1 + Math.floor(Math.random() * 2));
      } else setStormSolIdx(next);
      return true;
    }
    playSound("error", settings.sound);
    loadStormPuzzle(stormIndex + 1);
    return false;
  };

  return (
    <div className="fade-up space-y-6">
      <div>
        <div className="section-title">Learn & Improve</div>
        <h1 className="text-2xl sm:text-3xl font-semibold mt-1 flex items-center gap-2">
          <GraduationCap className="text-emerald-300" size={28} />
          Train
        </h1>
        <p className="text-sm text-[var(--text-muted)] mt-1">{plan.greeting}</p>
      </div>

      <div className="flex flex-wrap gap-2">
        {(
          [
            ["plan", "Coach plan"],
            ["puzzles", "Puzzles"],
            ["storm", "Puzzle Storm"],
          ] as const
        ).map(([id, label]) => (
          <button
            key={id}
            type="button"
            className={cn("chip", tab === id && "chip-active")}
            onClick={() => setTab(id)}
          >
            {label}
          </button>
        ))}
      </div>

      {tab === "plan" && (
        <div className="panel p-5 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="section-title">Today&apos;s living plan</div>
              <div className="font-semibold mt-1">Focus: {plan.focus}</div>
            </div>
            <span className="chip !cursor-default">
              <Flame size={14} className="text-orange-300" />
              {plan.streak} day streak
            </span>
          </div>
          <div className="progress-bar">
            <span style={{ width: `${weeklyPct}%` }} />
          </div>
          <div className="text-xs text-[var(--text-muted)]">
            {plan.weeklyDoneMinutes}/{plan.weeklyGoalMinutes} min this week
          </div>

          <div className="grid sm:grid-cols-2 gap-3">
            {plan.quests.map((q) => (
              <div
                key={q.id}
                className={cn(
                  "rounded-2xl border p-4 space-y-2",
                  done[q.id]
                    ? "border-emerald-400/30 bg-emerald-400/10"
                    : "border-white/10 bg-white/[0.02]",
                )}
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="text-[10px] uppercase tracking-wide text-[var(--text-dim)]">
                      {q.tag} · {q.minutes}m · {q.xp} XP
                    </div>
                    <div className="font-medium mt-0.5">{q.title}</div>
                    <p className="text-xs text-[var(--text-muted)] mt-1">{q.detail}</p>
                  </div>
                  {done[q.id] && <CheckCircle2 className="text-emerald-300 shrink-0" size={18} />}
                </div>
                <div className="flex gap-2">
                  <Link href={q.href} className="btn btn-secondary !py-1.5 !text-xs">
                    Open
                  </Link>
                  <button
                    type="button"
                    className="btn btn-ghost !py-1.5 !text-xs"
                    onClick={() => setDone((d) => ({ ...d, [q.id]: !d[q.id] }))}
                  >
                    {done[q.id] ? "Undo" : "Mark done"}
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div className="flex flex-wrap gap-2">
            {plan.weaknesses.map((w) => (
              <span key={w} className="chip !cursor-default">
                {w}
              </span>
            ))}
          </div>
        </div>
      )}

      {tab === "puzzles" && (
        <div className="grid lg:grid-cols-[minmax(0,1fr)_300px] gap-6 items-start">
          <div className="space-y-3 max-w-[min(100%,560px)]">
            <div className="flex items-center justify-between">
              <div className="font-semibold">Unlimited puzzles</div>
              <div className="text-xs text-[var(--text-muted)]">
                Solved {solved} · Misses {failed}
              </div>
            </div>
            <ChessBoard
              fen={puzzleFen}
              onMove={onPuzzleMove}
              boardThemeId={settings.boardTheme}
              showLegalMoves={settings.showLegalMoves}
              showCoordinates={settings.coord}
            />
            <p className="text-sm text-[var(--text-muted)]">{msg}</p>
            <div className="flex gap-2">
              <button
                type="button"
                className="btn btn-secondary !py-2"
                onClick={() => loadPuzzle(puzzleIndex + 1)}
              >
                Skip
              </button>
              <button
                type="button"
                className="btn btn-ghost !py-2"
                onClick={() => loadPuzzle(puzzleIndex)}
              >
                Reset
              </button>
            </div>
          </div>
          <div className="panel p-4 space-y-2 text-sm text-[var(--text-muted)]">
            <div>
              Theme: <span className="text-white">{puzzle.theme}</span>
            </div>
            <div>
              Rating: <span className="font-mono text-white">{puzzle.rating}</span>
            </div>
            <button type="button" className="btn btn-primary w-full mt-2" onClick={() => setTab("storm")}>
              <Zap size={16} /> Try Puzzle Storm
            </button>
          </div>
        </div>
      )}

      {tab === "storm" && (
        <div className="grid lg:grid-cols-[minmax(0,1fr)_300px] gap-6 items-start">
          <div className="space-y-3 max-w-[min(100%,560px)]">
            <div className="flex items-center justify-between">
              <div className="font-semibold flex items-center gap-2">
                <Timer size={18} className="text-orange-300" />
                Puzzle Storm · 3:00
              </div>
              <div className="font-mono text-lg">
                {Math.floor(stormLeft / 60)}:{(stormLeft % 60).toString().padStart(2, "0")}
              </div>
            </div>
            <ChessBoard
              fen={stormFen}
              onMove={onStormMove}
              interactive={stormActive}
              boardThemeId={settings.boardTheme}
              showLegalMoves={settings.showLegalMoves}
              showCoordinates={settings.coord}
            />
            {!stormActive && stormLeft === 0 && (
              <p className="text-sm text-cyan-200">
                Time! Score {stormScore}. Best this session {Math.max(stormBest, stormScore)}.
              </p>
            )}
          </div>
          <div className="panel p-4 space-y-3">
            <div className="text-3xl font-semibold font-mono">{stormScore}</div>
            <div className="text-xs text-[var(--text-dim)]">puzzles solved</div>
            <button
              type="button"
              className="btn btn-primary w-full"
              onClick={startStorm}
              disabled={stormActive}
            >
              {stormActive ? "Storm running…" : "Start Storm"}
            </button>
            <p className="text-xs text-[var(--text-muted)]">
              Solve as many as you can in 3 minutes. Wrong move skips to the next puzzle. Unlimited
              & free.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

function TrainLoader() {
  const search = useSearchParams();
  const mode = search.get("mode") ?? "plan";
  return <TrainInner key={mode} />;
}

export default function TrainPage() {
  return (
    <Suspense fallback={<div className="text-[var(--text-muted)]">Loading train…</div>}>
      <TrainLoader />
    </Suspense>
  );
}
