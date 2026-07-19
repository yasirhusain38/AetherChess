"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { Chess } from "chess.js";
import { Trophy, Swords, Bot } from "lucide-react";
import { ChessBoard } from "@/components/chess/ChessBoard";
import { BOT_PRESETS, pickBotMove, type BotConfig } from "@/lib/chess/bot";
import { engineMove } from "@/lib/chess/engine";
import { soundFromSan } from "@/lib/chess/sound";
import { useSettings } from "@/lib/hooks/useSettings";
import { applyGameResult, categoryFromTimeControl, getRatings } from "@/lib/chess/rating";
import { cn, formatRating } from "@/lib/utils";

type Phase = "lobby" | "playing" | "between" | "done";

interface Standing {
  id: string;
  name: string;
  rating: number;
  score: number;
  games: number;
  isYou?: boolean;
  botKey?: string;
}

const EVENT = {
  id: "gauntlet-blitz",
  name: "Aether Gauntlet · Blitz",
  timeControl: "3+2",
  rounds: 5,
  description: "Arena-style bot gauntlet. Beat a ladder of personalities. Ratings update locally.",
};

export default function TournamentsPage() {
  const { settings } = useSettings();
  const [phase, setPhase] = useState<Phase>("lobby");
  const [round, setRound] = useState(0);
  const [standings, setStandings] = useState<Standing[]>([]);
  const [fen, setFen] = useState(() => new Chess().fen());
  const [history, setHistory] = useState<string[]>([]);
  const [lastMove, setLastMove] = useState<{ from: string; to: string } | null>(null);
  const [status, setStatus] = useState("Join the gauntlet when ready.");
  const [opp, setOpp] = useState<Standing | null>(null);
  const [playerColor, setPlayerColor] = useState<"w" | "b">("w");
  const [whiteMs, setWhiteMs] = useState(180_000);
  const [blackMs, setBlackMs] = useState(180_000);
  const tickRef = useRef<number | null>(null);
  const historyRef = useRef<string[]>([]);

  const bots = useMemo(() => Object.entries(BOT_PRESETS), []);

  const join = () => {
    const youRating = getRatings().blitz.rating;
    const field: Standing[] = [
      {
        id: "you",
        name: settings.displayName || "You",
        rating: youRating,
        score: 0,
        games: 0,
        isYou: true,
      },
      ...bots.map(([key, b]) => ({
        id: key,
        name: b.name,
        rating: b.rating,
        score: 0,
        games: 0,
        botKey: key,
      })),
    ];
    setStandings(field);
    setRound(0);
    setPhase("between");
    setStatus("Paired. Start round 1 when ready.");
    setOpp(null);
  };

  const pairNext = useCallback(() => {
    const nextRound = round + 1;
    if (nextRound > EVENT.rounds) {
      setPhase("done");
      setStatus("Gauntlet complete.");
      return;
    }
    // Pair you vs bot by standings proximity
    const you = standings.find((s) => s.isYou)!;
    const opponents = standings
      .filter((s) => !s.isYou)
      .sort(
        (a, b) =>
          Math.abs(a.score - you.score) - Math.abs(b.score - you.score) ||
          Math.abs(a.rating - you.rating) - Math.abs(b.rating - you.rating),
      );
    const foe = opponents[(nextRound - 1) % opponents.length];
    setOpp(foe);
    setRound(nextRound);
    setPlayerColor(nextRound % 2 === 1 ? "w" : "b");
    const c = new Chess();
    setFen(c.fen());
    setHistory([]);
    historyRef.current = [];
    setLastMove(null);
    setWhiteMs(180_000 + 2_000);
    setBlackMs(180_000);
    setPhase("playing");
    setStatus(
      nextRound % 2 === 1
        ? `Round ${nextRound}: You (White) vs ${foe.name}`
        : `Round ${nextRound}: ${foe.name} (White) vs You`,
    );
  }, [round, standings]);

  const botConfig: BotConfig = opp?.botKey
    ? BOT_PRESETS[opp.botKey]
    : BOT_PRESETS.nova;

  const finishRound = useCallback(
    (result: "1-0" | "0-1" | "1/2-1/2", reason: string) => {
      if (tickRef.current) window.clearInterval(tickRef.current);
      setPhase("between");
      setStatus(reason);

      const youAreWhite = playerColor === "w";
      const youScore =
        result === "1/2-1/2" ? 0.5 : (result === "1-0" && youAreWhite) || (result === "0-1" && !youAreWhite) ? 1 : 0;

      setStandings((prev) =>
        prev.map((s) => {
          if (s.isYou) {
            return { ...s, score: s.score + youScore, games: s.games + 1 };
          }
          if (opp && s.id === opp.id) {
            return {
              ...s,
              score: s.score + (1 - youScore),
              games: s.games + 1,
            };
          }
          return s;
        }),
      );

      applyGameResult({
        category: categoryFromTimeControl(EVENT.timeControl),
        oppRating: opp?.rating ?? 1500,
        score: youScore as 0 | 0.5 | 1,
        oppName: opp?.name ?? "Bot",
      });
    },
    [playerColor, opp],
  );

  const fenRef = useRef(fen);
  const phaseRef = useRef(phase);
  useEffect(() => {
    fenRef.current = fen;
  }, [fen]);
  useEffect(() => {
    phaseRef.current = phase;
  }, [phase]);

  // clocks — do not depend on fen (avoids thrashing bot timers)
  useEffect(() => {
    if (phase !== "playing") {
      if (tickRef.current) window.clearInterval(tickRef.current);
      return;
    }
    if (tickRef.current) window.clearInterval(tickRef.current);
    tickRef.current = window.setInterval(() => {
      if (phaseRef.current !== "playing") return;
      let turn: "w" | "b" = "w";
      try {
        turn = new Chess(fenRef.current).turn();
      } catch {
        return;
      }
      if (turn === "w") {
        setWhiteMs((ms) => {
          if (ms <= 100) {
            finishRound("0-1", "Black wins on time.");
            return 0;
          }
          return ms - 100;
        });
      } else {
        setBlackMs((ms) => {
          if (ms <= 100) {
            finishRound("1-0", "White wins on time.");
            return 0;
          }
          return ms - 100;
        });
      }
    }, 100);
    return () => {
      if (tickRef.current) window.clearInterval(tickRef.current);
    };
  }, [phase, finishRound]);

  // bot moves
  useEffect(() => {
    if (phase !== "playing" || !opp) return;
    let pos: Chess;
    try {
      pos = new Chess(fen);
    } catch {
      return;
    }
    if (pos.isGameOver() || pos.turn() === playerColor) return;

    let cancelled = false;
    const botTurn = pos.turn();
    const t = window.setTimeout(() => {
      if (cancelled || phaseRef.current !== "playing") return;
      let current: Chess;
      try {
        current = new Chess(fenRef.current);
      } catch {
        return;
      }
      if (current.isGameOver() || current.turn() === playerColor) return;
      const currentFen = current.fen();
      let move = pickBotMove(currentFen, botConfig);
      try {
        move = engineMove(currentFen, 1) ?? move;
      } catch {
        /* keep style bot */
      }
      if (!move || cancelled) return;
      const next = new Chess(currentFen);
      try {
        next.move(move);
      } catch {
        const legal = next.moves({ verbose: true });
        if (!legal[0]) return;
        next.move(legal[0]);
        move = legal[0];
      }
      setFen(next.fen());
      setHistory((h) => {
        const nh = [...h, move!.san];
        historyRef.current = nh;
        return nh;
      });
      setLastMove({ from: move.from, to: move.to });
      soundFromSan(move.san, settings.sound);
      if (botTurn === "w") setWhiteMs((ms) => ms + 2000);
      else setBlackMs((ms) => ms + 2000);

      if (next.isCheckmate()) {
        finishRound(next.turn() === "w" ? "0-1" : "1-0", "Checkmate.");
      } else if (next.isDraw()) {
        finishRound("1/2-1/2", "Draw.");
      }
    }, 400 + Math.random() * 500);

    return () => {
      cancelled = true;
      window.clearTimeout(t);
    };
  }, [fen, phase, opp, playerColor, botConfig, settings.sound, finishRound]);

  const onMove = (m: { from: string; to: string; promotion?: "q" | "r" | "b" | "n" }) => {
    if (phase !== "playing") return false;
    const c = new Chess(fen);
    if (c.turn() !== playerColor) return false;
    try {
      const moved = c.move({ from: m.from, to: m.to, promotion: m.promotion ?? "q" });
      if (!moved) return false;
      setFen(c.fen());
      setHistory((h) => {
        const nh = [...h, moved.san];
        historyRef.current = nh;
        return nh;
      });
      setLastMove({ from: moved.from, to: moved.to });
      soundFromSan(moved.san, settings.sound);
      if (playerColor === "w") setWhiteMs((ms) => ms + 2000);
      else setBlackMs((ms) => ms + 2000);

      if (c.isCheckmate()) {
        finishRound(c.turn() === "w" ? "0-1" : "1-0", "Checkmate!");
      } else if (c.isDraw()) {
        finishRound("1/2-1/2", "Draw.");
      }
      return true;
    } catch {
      return false;
    }
  };

  const sorted = [...standings].sort((a, b) => b.score - a.score || b.rating - a.rating);
  const orientation = playerColor === "w" ? "white" : "black";

  const fmt = (ms: number) => {
    const s = Math.max(0, Math.ceil(ms / 1000));
    return `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, "0")}`;
  };

  return (
    <div className="fade-up space-y-6">
      <div>
        <div className="section-title">Events</div>
        <h1 className="text-2xl sm:text-3xl font-semibold mt-1 flex items-center gap-2">
          <Trophy className="text-amber-300" size={28} />
          Tournaments
        </h1>
        <p className="text-sm text-[var(--text-muted)] mt-1">
          Local gauntlet MVP — full Swiss/arena multiplayer lands with the game server.
        </p>
      </div>

      {phase === "lobby" && (
        <div className="grid lg:grid-cols-2 gap-4">
          <div className="panel p-6 space-y-4 glow-ring">
            <div className="text-xs uppercase tracking-wide text-amber-300/90">Featured</div>
            <h2 className="text-xl font-semibold">{EVENT.name}</h2>
            <p className="text-sm text-[var(--text-muted)]">{EVENT.description}</p>
            <div className="flex flex-wrap gap-2 text-xs">
              <span className="chip !cursor-default">{EVENT.timeControl}</span>
              <span className="chip !cursor-default">{EVENT.rounds} rounds</span>
              <span className="chip !cursor-default">Rated (local)</span>
            </div>
            <button type="button" className="btn btn-primary" onClick={join}>
              <Swords size={16} />
              Join gauntlet
            </button>
          </div>
          <div className="panel p-5 space-y-3">
            <div className="section-title">Coming online</div>
            <ul className="text-sm text-[var(--text-muted)] space-y-2">
              <li>▸ Arena & Swiss with human liquidity</li>
              <li>▸ Team battles & club leagues</li>
              <li>▸ Between-round Scout of next opponent</li>
              <li>▸ Prize tiers + fair-play levels</li>
            </ul>
            <Link href="/leaderboard" className="btn btn-secondary w-full">
              View leaderboard
            </Link>
          </div>
        </div>
      )}

      {phase !== "lobby" && (
        <div className="grid lg:grid-cols-[minmax(0,1fr)_300px] gap-6 items-start">
          <div className="space-y-3 max-w-[min(100%,560px)]">
            {(phase === "playing" || phase === "between" || phase === "done") && (
              <>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-[var(--text-muted)]">{status}</span>
                  {phase === "playing" && (
                    <span className="font-mono">
                      {fmt(playerColor === "w" ? blackMs : whiteMs)} · you{" "}
                      {fmt(playerColor === "w" ? whiteMs : blackMs)}
                    </span>
                  )}
                </div>
                {phase === "playing" && (
                  <ChessBoard
                    fen={fen}
                    orientation={orientation}
                    lastMove={lastMove}
                    onMove={onMove}
                    boardThemeId={settings.boardTheme}
                    showLegalMoves={settings.showLegalMoves}
                    showCoordinates={settings.coord}
                  />
                )}
                {phase === "between" && (
                  <div className="panel p-6 space-y-3 text-center">
                    <Bot className="mx-auto text-amber-400" />
                    <div className="font-semibold">
                      Round {Math.min(round + 1, EVENT.rounds)} of {EVENT.rounds}
                    </div>
                    <p className="text-sm text-[var(--text-muted)]">{status}</p>
                    <button type="button" className="btn btn-primary" onClick={pairNext}>
                      {round === 0 ? "Start round 1" : round >= EVENT.rounds ? "Finish" : "Next round"}
                    </button>
                    {round > 0 && round < EVENT.rounds && (
                      <button
                        type="button"
                        className="btn btn-ghost"
                        onClick={() => {
                          setPhase("done");
                          setStatus("Withdrew from gauntlet.");
                        }}
                      >
                        Withdraw
                      </button>
                    )}
                  </div>
                )}
                {phase === "done" && (
                  <div className="panel p-6 space-y-3 text-center">
                    <Trophy className="mx-auto text-amber-300" size={32} />
                    <div className="font-semibold text-lg">Final standings</div>
                    <p className="text-sm text-[var(--text-muted)]">{status}</p>
                    <button type="button" className="btn btn-primary" onClick={() => setPhase("lobby")}>
                      Back to events
                    </button>
                  </div>
                )}
              </>
            )}
          </div>

          <div className="panel p-4 space-y-2">
            <div className="section-title">Standings</div>
            {sorted.map((s, i) => (
              <div
                key={s.id}
                className={cn(
                  "flex items-center justify-between rounded-xl px-2 py-1.5 text-sm",
                  s.isYou && "bg-emerald-500/10 border border-emerald-500/25",
                )}
              >
                <div className="flex items-center gap-2 min-w-0">
                  <span className="text-[var(--text-dim)] w-5 font-mono text-xs">{i + 1}</span>
                  <span className="truncate font-medium">{s.name}</span>
                </div>
                <div className="font-mono text-xs text-[var(--text-muted)]">
                  {s.score} · {formatRating(s.rating)}
                </div>
              </div>
            ))}
            <div className="text-[10px] text-[var(--text-dim)] pt-2">
              Moves: {history.join(" ") || "—"}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
