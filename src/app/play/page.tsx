"use client";

import { Suspense, useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Chess } from "chess.js";
import { Bot, Flag, History, RotateCcw, Users, User } from "lucide-react";
import { ChessBoard } from "@/components/chess/ChessBoard";
import { PromotionPicker } from "@/components/chess/PromotionPicker";
import {
  BOT_PRESETS,
  botDelayMs,
  createTwinBot,
  pickBotMove,
  type BotConfig,
} from "@/lib/chess/bot";
import { TIME_CONTROLS } from "@/lib/chess/constants";
import { classifyGame } from "@/lib/chess/analysis";
import { safeChess960Fen } from "@/lib/chess/chess960";
import { engineMove } from "@/lib/chess/engine";
import { buildPgn, resultFromChess } from "@/lib/chess/pgn";
import {
  applyGameResult,
  categoryFromTimeControl,
  getRatings,
} from "@/lib/chess/rating";
import { soundFromSan, playSound } from "@/lib/chess/sound";
import { useStorageEpoch } from "@/lib/hooks/useClientStorage";
import { useSettings } from "@/lib/hooks/useSettings";
import { bumpStats, listGames, saveGame } from "@/lib/storage";
import { cn, formatRating } from "@/lib/utils";

type Phase = "lobby" | "playing" | "ended";
type Mode = "bot" | "twin" | "pass";
type Variant = "standard" | "chess960";

interface PendingPromotion {
  from: string;
  to: string;
  color: "w" | "b";
}

function PlayInner() {
  const search = useSearchParams();
  const twinName = search.get("twin");
  const twinRep = search.get("rep");
  const presetBot = search.get("bot");
  const { settings } = useSettings();

  const [phase, setPhase] = useState<Phase>("lobby");
  const [mode, setMode] = useState<Mode>(twinName ? "twin" : "bot");
  const [timeId, setTimeId] = useState("5+0");
  const [colorChoice, setColorChoice] = useState<"white" | "black" | "random">("white");
  const [botKey, setBotKey] = useState(presetBot && BOT_PRESETS[presetBot] ? presetBot : "nova");
  const [useEngineBot, setUseEngineBot] = useState(false);
  const [variant, setVariant] = useState<Variant>("standard");
  const [playerColor, setPlayerColor] = useState<"w" | "b">("w");
  const [fen, setFen] = useState(() => new Chess().fen());
  const [history, setHistory] = useState<string[]>([]);
  const [lastMove, setLastMove] = useState<{ from: string; to: string } | null>(null);
  const [status, setStatus] = useState("Pick a mode and start.");
  const [whiteMs, setWhiteMs] = useState(300_000);
  const [blackMs, setBlackMs] = useState(300_000);
  const [bot, setBot] = useState<BotConfig>(BOT_PRESETS.nova);
  const [reviewNote, setReviewNote] = useState<string | null>(null);
  const [ratingNote, setRatingNote] = useState<string | null>(null);
  const [savedId, setSavedId] = useState<string | null>(null);
  const [pendingPromo, setPendingPromo] = useState<PendingPromotion | null>(null);
  const tickRef = useRef<number | null>(null);
  const historyRef = useRef<string[]>([]);
  const fenRef = useRef(fen);
  const whiteMsRef = useRef(whiteMs);
  const blackMsRef = useRef(blackMs);
  const phaseRef = useRef(phase);
  const endedRef = useRef(false);
  const whiteName = settings.displayName || "You";
  const ratingCat = categoryFromTimeControl(timeId);
  const storageEpoch = useStorageEpoch();
  const myRating = useMemo(() => {
    void storageEpoch;
    if (typeof window === "undefined") return 1200;
    return getRatings()[ratingCat]?.rating ?? 1200;
  }, [ratingCat, storageEpoch]);
  const recent = useMemo(() => {
    void storageEpoch;
    if (typeof window === "undefined") return [];
    return listGames().slice(0, 6);
  }, [storageEpoch]);

  const tc = TIME_CONTROLS.find((t) => t.id === timeId) ?? TIME_CONTROLS[3];
  const game = useMemo(() => {
    try {
      return new Chess(fen);
    } catch {
      return new Chess();
    }
  }, [fen]);

  useEffect(() => {
    historyRef.current = history;
  }, [history]);
  useEffect(() => {
    fenRef.current = fen;
  }, [fen]);
  useEffect(() => {
    whiteMsRef.current = whiteMs;
  }, [whiteMs]);
  useEffect(() => {
    blackMsRef.current = blackMs;
  }, [blackMs]);
  useEffect(() => {
    phaseRef.current = phase;
  }, [phase]);

  const orientation =
    mode === "pass" ? (game.turn() === "w" ? "white" : "black") : playerColor === "w" ? "white" : "black";

  const persistGame = useCallback(
    (result: string, reason: string, moves: string[]) => {
      const blackName =
        mode === "pass" ? "Player 2" : mode === "twin" ? bot.name : bot.name;
      const pgn = buildPgn({
        moves,
        white: mode === "pass" ? "Player 1" : playerColor === "w" ? whiteName : blackName,
        black: mode === "pass" ? "Player 2" : playerColor === "b" ? whiteName : blackName,
        result,
        event: mode === "pass" ? "Aether Pass & Play" : "Aether Bot Match",
        timeControl: tc.id,
      });

      let accuracyWhite: number | undefined;
      let accuracyBlack: number | undefined;
      try {
        const summary = classifyGame(moves);
        accuracyWhite = summary.accuracyWhite;
        accuracyBlack = summary.accuracyBlack;
        setReviewNote(
          `Accuracy · White ${summary.accuracyWhite}% · Black ${summary.accuracyBlack}% · ${summary.criticalMoments.length} critical moments · ${reason}`,
        );
      } catch {
        setReviewNote(reason);
      }

      const saved = saveGame({
        pgn,
        result,
        white: mode === "pass" ? "Player 1" : playerColor === "w" ? whiteName : blackName,
        black: mode === "pass" ? "Player 2" : playerColor === "b" ? whiteName : blackName,
        timeControl: tc.id,
        mode: mode === "twin" ? "twin" : mode === "pass" ? "pass" : "bot",
        accuracyWhite,
        accuracyBlack,
      });
      setSavedId(saved.id);

      const youWon =
        mode === "pass"
          ? false
          : (result === "1-0" && playerColor === "w") || (result === "0-1" && playerColor === "b");
      const youLost =
        mode === "pass"
          ? false
          : (result === "0-1" && playerColor === "w") || (result === "1-0" && playerColor === "b");
      bumpStats({
        gamesPlayed: 1,
        wins: youWon ? 1 : 0,
        losses: youLost ? 1 : 0,
        draws: result === "1/2-1/2" ? 1 : 0,
        twinSessions: mode === "twin" ? 1 : 0,
      });

      if (mode !== "pass" && (result === "1-0" || result === "0-1" || result === "1/2-1/2")) {
        const score: 0 | 0.5 | 1 =
          result === "1/2-1/2"
            ? 0.5
            : (result === "1-0" && playerColor === "w") ||
                (result === "0-1" && playerColor === "b")
              ? 1
              : 0;
        const cat = categoryFromTimeControl(tc.id);
        const upd = applyGameResult({
          category: cat,
          oppRating: bot.rating,
          score,
          oppName: bot.name,
        });
        setRatingNote(
          `${cat} ${upd.delta >= 0 ? "+" : ""}${upd.delta} → ${upd.rating}`,
        );
      } else {
        setRatingNote(null);
      }
      playSound("gameEnd", settings.sound);
    },
    [mode, bot.name, bot.rating, playerColor, whiteName, tc.id, settings.sound],
  );

  const endGame = useCallback(
    (message: string, result?: string, resigned?: "w" | "b") => {
      if (endedRef.current) return;
      endedRef.current = true;
      setPhase("ended");
      setStatus(message);
      if (tickRef.current) window.clearInterval(tickRef.current);
      const c = new Chess();
      for (const san of historyRef.current) {
        try {
          c.move(san);
        } catch {
          break;
        }
      }
      const res = result ?? resultFromChess(c, resigned);
      persistGame(res, message, historyRef.current);
    },
    [persistGame],
  );

  const checkTerminal = useCallback(
    (c: Chess) => {
      if (c.isCheckmate()) {
        endGame(c.turn() === "w" ? "Black wins by checkmate." : "White wins by checkmate.");
        return true;
      }
      if (c.isDraw()) {
        endGame(
          c.isStalemate()
            ? "Draw by stalemate."
            : c.isThreefoldRepetition()
              ? "Draw by repetition."
              : c.isInsufficientMaterial()
                ? "Draw — insufficient material."
                : "Draw.",
        );
        return true;
      }
      return false;
    },
    [endGame],
  );

  const startGame = () => {
    const startFen = variant === "chess960" ? safeChess960Fen() : new Chess().fen();
    let c: Chess;
    try {
      c = new Chess(startFen);
    } catch {
      c = new Chess();
    }
    let pc: "w" | "b" = "w";
    if (mode !== "pass") {
      if (colorChoice === "black") pc = "b";
      if (colorChoice === "random") pc = Math.random() > 0.5 ? "w" : "b";
    }

    let config: BotConfig = BOT_PRESETS[botKey] ?? BOT_PRESETS.nova;
    if (mode === "twin" || twinName) {
      const rep = twinRep ? decodeURIComponent(twinRep).split("|").filter(Boolean) : [];
      config = createTwinBot(twinName || "Opponent", rep, 1500);
      setMode("twin");
    }

    setBot(config);
    setPlayerColor(pc);
    setFen(c.fen());
    setHistory([]);
    historyRef.current = [];
    setLastMove(null);
    setWhiteMs(tc.baseMs);
    setBlackMs(tc.baseMs);
    setReviewNote(null);
    setRatingNote(null);
    setSavedId(null);
    setPendingPromo(null);
    endedRef.current = false;
    setPhase("playing");

    if (mode === "pass") {
      setStatus(
        `Pass & Play${variant === "chess960" ? " · Chess960" : ""} — White to move.`,
      );
    } else {
      setStatus(
        pc === "w"
          ? `Your move${variant === "chess960" ? " (960)" : ""}.`
          : `${config.name} is thinking…`,
      );
    }
  };

  const commitMove = (
    from: string,
    to: string,
    promotion?: "q" | "r" | "b" | "n",
  ) => {
    if (phase !== "playing") return false;
    const c = new Chess(fen);
    if (mode !== "pass" && c.turn() !== playerColor) return false;
    try {
      const moved = c.move({
        from,
        to,
        promotion: promotion ?? "q",
      });
      if (!moved) return false;
      setFen(c.fen());
      setHistory((h) => {
        const nh = [...h, moved.san];
        historyRef.current = nh;
        return nh;
      });
      setLastMove({ from: moved.from, to: moved.to });
      soundFromSan(moved.san, settings.sound);
      if (c.turn() === "b") setWhiteMs((ms) => ms + tc.incrementMs);
      else setBlackMs((ms) => ms + tc.incrementMs);

      if (checkTerminal(c)) return true;

      if (mode === "pass") {
        setStatus(`${c.turn() === "w" ? "White" : "Black"} to move.`);
      } else {
        setStatus(`${bot.name} is thinking…`);
      }
      return true;
    } catch {
      playSound("error", settings.sound);
      return false;
    }
  };

  // Clock — only depends on phase so ticks never cancel the bot timer
  useEffect(() => {
    if (phase !== "playing") {
      if (tickRef.current) window.clearInterval(tickRef.current);
      tickRef.current = null;
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
            endGame("Black wins on time.");
            return 0;
          }
          return ms - 100;
        });
      } else {
        setBlackMs((ms) => {
          if (ms <= 100) {
            endGame("White wins on time.");
            return 0;
          }
          return ms - 100;
        });
      }
    }, 100);
    return () => {
      if (tickRef.current) window.clearInterval(tickRef.current);
      tickRef.current = null;
    };
  }, [phase, endGame]);

  // Bot move — must NOT depend on clock ms (that was canceling replies every 100ms)
  useEffect(() => {
    if (phase !== "playing" || mode === "pass") return;

    let pos: Chess;
    try {
      pos = new Chess(fen);
    } catch {
      return;
    }
    if (pos.isGameOver()) return;
    if (pos.turn() === playerColor) return;

    let cancelled = false;
    const botTurn = pos.turn();
    const timeLeft = botTurn === "w" ? whiteMsRef.current : blackMsRef.current;
    const delay = Math.min(1200, Math.max(280, botDelayMs(bot, timeLeft)));

    const t = window.setTimeout(() => {
      if (cancelled || phaseRef.current !== "playing") return;

      // Re-validate position still needs a bot move
      let current: Chess;
      try {
        current = new Chess(fenRef.current);
      } catch {
        return;
      }
      if (current.isGameOver() || current.turn() === playerColor) return;

      const currentFen = current.fen();
      let move = pickBotMove(currentFen, bot);
      if (useEngineBot) {
        try {
          move = engineMove(currentFen, bot.rating >= 2000 ? 2 : 1) ?? move;
        } catch {
          // keep pickBotMove
        }
      }
      if (!move || cancelled) return;

      const next = new Chess(currentFen);
      try {
        next.move(move);
      } catch {
        // fallback any legal move
        const legal = next.moves({ verbose: true });
        if (!legal.length) return;
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
      if (botTurn === "w") setWhiteMs((ms) => ms + tc.incrementMs);
      else setBlackMs((ms) => ms + tc.incrementMs);
      if (!checkTerminal(next)) setStatus("Your move.");
    }, delay);

    return () => {
      cancelled = true;
      window.clearTimeout(t);
    };
  }, [
    fen,
    phase,
    mode,
    playerColor,
    bot,
    tc.incrementMs,
    checkTerminal,
    useEngineBot,
    settings.sound,
  ]);

  const onMove = (m: { from: string; to: string; promotion?: "q" | "r" | "b" | "n" }) => {
    if (phase !== "playing") return false;
    const c = new Chess(fen);
    if (mode !== "pass" && c.turn() !== playerColor) return false;
    const piece = c.get(m.from as import("chess.js").Square);
    const isPromo =
      piece?.type === "p" &&
      ((piece.color === "w" && m.to[1] === "8") || (piece.color === "b" && m.to[1] === "1"));
    if (isPromo && !settings.autoQueen && !m.promotion) {
      setPendingPromo({ from: m.from, to: m.to, color: piece!.color });
      return true;
    }
    return commitMove(m.from, m.to, m.promotion ?? (isPromo ? "q" : undefined));
  };

  const resign = () => {
    if (mode === "pass") {
      const loser = game.turn();
      endGame(
        loser === "w" ? "Black wins — resignation." : "White wins — resignation.",
        undefined,
        loser,
      );
    } else {
      endGame(
        playerColor === "w" ? "Black wins — resignation." : "White wins — resignation.",
        undefined,
        playerColor,
      );
    }
  };

  const movePairs = useMemo(() => {
    const pairs: { n: number; w?: string; b?: string }[] = [];
    for (let i = 0; i < history.length; i += 2) {
      pairs.push({ n: i / 2 + 1, w: history[i], b: history[i + 1] });
    }
    return pairs;
  }, [history]);

  return (
    <div className="fade-up space-y-6">
      {pendingPromo && (
        <PromotionPicker
          color={pendingPromo.color}
          onPick={(p) => {
            const { from, to } = pendingPromo;
            setPendingPromo(null);
            commitMove(from, to, p);
          }}
        />
      )}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
        <div>
          <div className="section-title">Play</div>
          <h1 className="text-2xl sm:text-3xl font-semibold mt-1">
            {phase === "lobby"
              ? "Choose your battlefield"
              : mode === "pass"
                ? "Pass & Play"
                : bot.name}
          </h1>
          <p className="text-sm text-[var(--text-muted)] mt-1">{status}</p>
        </div>
        {phase !== "lobby" && (
          <div className="flex gap-2">
            <button type="button" className="btn btn-secondary !py-2" onClick={() => setPhase("lobby")}>
              <RotateCcw size={16} />
              Lobby
            </button>
            {phase === "playing" && (
              <button type="button" className="btn btn-danger !py-2" onClick={resign}>
                <Flag size={16} />
                Resign
              </button>
            )}
          </div>
        )}
      </div>

      {phase === "lobby" ? (
        <div className="grid lg:grid-cols-[1.15fr_0.85fr] gap-6">
          <div className="panel p-5 space-y-5">
            <div>
              <div className="section-title mb-2">Mode</div>
              <div className="grid sm:grid-cols-3 gap-2">
                {(
                  [
                    { id: "bot" as const, label: "vs Bot", icon: Bot },
                    { id: "twin" as const, label: "Twin Bot", icon: Bot },
                    { id: "pass" as const, label: "Pass & Play", icon: Users },
                  ] as const
                ).map((m) => (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => setMode(m.id)}
                    className={cn(
                      "rounded-2xl border p-3 text-left transition-colors",
                      mode === m.id
                        ? "border-cyan-400/40 bg-cyan-400/10"
                        : "border-white/10 hover:border-white/20",
                    )}
                  >
                    <m.icon size={18} className="text-cyan-300 mb-1" />
                    <div className="font-semibold text-sm">{m.label}</div>
                  </button>
                ))}
              </div>
              {twinName && (
                <p className="text-xs text-violet-300 mt-2">Scout Twin loaded: {twinName}</p>
              )}
            </div>

            <div>
              <div className="section-title mb-2">Time control</div>
              <div className="flex flex-wrap gap-2">
                {TIME_CONTROLS.map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    className={cn("chip", timeId === t.id && "chip-active")}
                    onClick={() => setTimeId(t.id)}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
              <p className="text-xs text-[var(--text-dim)] mt-2">
                Your {categoryFromTimeControl(timeId)} rating:{" "}
                <span className="font-mono text-cyan-300">{myRating}</span>
                {" · "}
                <Link href="/leaderboard" className="text-cyan-300 hover:underline">
                  Ladder
                </Link>
              </p>
            </div>

            <div>
              <div className="section-title mb-2">Variant</div>
              <div className="flex flex-wrap gap-2">
                {(
                  [
                    ["standard", "Standard"],
                    ["chess960", "Chess960"],
                  ] as const
                ).map(([id, label]) => (
                  <button
                    key={id}
                    type="button"
                    className={cn("chip", variant === id && "chip-active")}
                    onClick={() => setVariant(id)}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            {mode !== "pass" && (
              <>
                <div>
                  <div className="section-title mb-2">Your color</div>
                  <div className="flex flex-wrap gap-2">
                    {(["white", "random", "black"] as const).map((c) => (
                      <button
                        key={c}
                        type="button"
                        className={cn("chip capitalize", colorChoice === c && "chip-active")}
                        onClick={() => setColorChoice(c)}
                      >
                        {c}
                      </button>
                    ))}
                  </div>
                </div>

                {mode === "bot" && (
                  <div>
                    <div className="section-title mb-2">Bot</div>
                    <div className="grid sm:grid-cols-2 gap-2">
                      {Object.entries(BOT_PRESETS).map(([key, b]) => (
                        <button
                          key={key}
                          type="button"
                          onClick={() => setBotKey(key)}
                          className={cn(
                            "text-left rounded-2xl border p-3 transition-colors",
                            botKey === key
                              ? "border-cyan-400/40 bg-cyan-400/10"
                              : "border-white/10 bg-white/[0.02] hover:border-white/20",
                          )}
                        >
                          <div className="font-semibold">{b.name}</div>
                          <div className="text-xs text-[var(--text-muted)] mt-0.5">
                            ~{formatRating(b.rating)} · {b.style}
                          </div>
                        </button>
                      ))}
                    </div>
                    <label className="mt-3 flex items-center gap-2 text-sm text-[var(--text-muted)] cursor-pointer">
                      <input
                        type="checkbox"
                        checked={useEngineBot}
                        onChange={(e) => setUseEngineBot(e.target.checked)}
                        className="accent-cyan-300"
                      />
                      Stronger engine moves (minimax) for high bots
                    </label>
                  </div>
                )}

                {mode === "twin" && !twinName && (
                  <div className="rounded-2xl border border-violet-400/25 bg-violet-500/10 p-4 text-sm text-[var(--text-muted)]">
                    Open <Link href="/scout" className="text-violet-300 underline">Scout</Link> and
                    generate a report, then click <strong>Train Twin Bot</strong>. Or start with a
                    generic twin.
                  </div>
                )}
              </>
            )}

            <button type="button" className="btn btn-primary w-full sm:w-auto" onClick={startGame}>
              Start game
            </button>
          </div>

          <div className="space-y-4">
            <div className="panel p-5 space-y-3">
              <div className="section-title flex items-center gap-2">
                <History size={12} /> Recent games
              </div>
              {recent.length === 0 && (
                <p className="text-sm text-[var(--text-dim)]">Games you finish are saved here.</p>
              )}
              <div className="space-y-2">
                {recent.map((g) => (
                  <Link
                    key={g.id}
                    href={`/analyze?game=${g.id}`}
                    className="block rounded-xl border border-white/8 bg-white/[0.03] px-3 py-2 hover:border-cyan-400/30 transition-colors"
                  >
                    <div className="text-sm font-medium truncate">
                      {g.white} vs {g.black}
                    </div>
                    <div className="text-[11px] text-[var(--text-dim)]">
                      {g.result} · {g.timeControl} · {g.mode}
                    </div>
                  </Link>
                ))}
              </div>
            </div>
            <div className="rounded-2xl overflow-hidden opacity-90">
              <ChessBoard
                fen={new Chess().fen()}
                interactive={false}
                boardThemeId={settings.boardTheme}
                showCoordinates={settings.coord}
              />
            </div>
          </div>
        </div>
      ) : (
        <div className="grid lg:grid-cols-[minmax(0,1fr)_320px] gap-6 items-start">
          <div className="space-y-3 max-w-[min(100%,560px)] mx-auto lg:mx-0 w-full">
            {(() => {
              const topColor = orientation === "white" ? "b" : "w";
              const botColor = orientation === "white" ? "w" : "b";
              const labelFor = (color: "w" | "b") => {
                if (mode === "pass") return color === "w" ? "White · P1" : "Black · P2";
                if (color === playerColor) return "You";
                return bot.name;
              };
              const ratingFor = (color: "w" | "b") =>
                mode === "pass" || color === playerColor ? 1500 : bot.rating;
              return (
                <>
                  <ClockRow
                    name={labelFor(topColor)}
                    rating={ratingFor(topColor)}
                    ms={topColor === "w" ? whiteMs : blackMs}
                    active={phase === "playing" && game.turn() === topColor}
                    you={mode !== "pass" && topColor === playerColor}
                  />
                  <ChessBoard
                    fen={fen}
                    orientation={orientation}
                    interactive={phase === "playing"}
                    lastMove={settings.highlightLastMove ? lastMove : null}
                    onMove={onMove}
                    boardThemeId={settings.boardTheme}
                    showLegalMoves={settings.showLegalMoves}
                    showCoordinates={settings.coord}
                    allowBothSides={mode === "pass"}
                  />
                  <ClockRow
                    name={labelFor(botColor)}
                    rating={ratingFor(botColor)}
                    ms={botColor === "w" ? whiteMs : blackMs}
                    active={phase === "playing" && game.turn() === botColor}
                    you={mode !== "pass" && botColor === playerColor}
                  />
                </>
              );
            })()}
          </div>

          <div className="panel p-4 space-y-4">
            <div>
              <div className="section-title">Moves</div>
              <div className="mt-2 max-h-64 overflow-y-auto font-mono text-sm space-y-1">
                {movePairs.length === 0 && (
                  <div className="text-[var(--text-dim)] text-xs">No moves yet.</div>
                )}
                {movePairs.map((p) => (
                  <div key={p.n} className="grid grid-cols-[2rem_1fr_1fr] gap-2">
                    <span className="text-[var(--text-dim)]">{p.n}.</span>
                    <span>{p.w}</span>
                    <span>{p.b}</span>
                  </div>
                ))}
              </div>
            </div>

            {phase === "ended" && (
              <div className="rounded-xl border border-white/10 bg-white/5 p-3 space-y-2">
                <div className="font-semibold text-sm">Game over</div>
                <p className="text-xs text-[var(--text-muted)]">{status}</p>
                {reviewNote && <p className="text-xs text-cyan-200/90">{reviewNote}</p>}
                {ratingNote && (
                  <p className="text-xs text-amber-200/90 font-mono">Rating {ratingNote}</p>
                )}
                <div className="flex flex-wrap gap-2 pt-1">
                  <button type="button" className="btn btn-primary !py-2 !text-xs" onClick={startGame}>
                    Rematch
                  </button>
                  {savedId && (
                    <Link href={`/analyze?game=${savedId}`} className="btn btn-secondary !py-2 !text-xs">
                      Full review
                    </Link>
                  )}
                  <Link href="/tournaments" className="btn btn-ghost !py-2 !text-xs">
                    Gauntlet
                  </Link>
                  <Link href="/scout" className="btn btn-ghost !py-2 !text-xs">
                    Scout
                  </Link>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function ClockRow({
  name,
  rating,
  ms,
  active,
  you,
}: {
  name: string;
  rating: number;
  ms: number;
  active: boolean;
  you?: boolean;
}) {
  const s = Math.max(0, Math.ceil(ms / 1000));
  const m = Math.floor(s / 60);
  const r = s % 60;
  return (
    <div
      className={cn(
        "flex items-center justify-between rounded-2xl border px-3 py-2.5 transition-colors",
        active ? "border-cyan-400/40 bg-cyan-400/10" : "border-white/10 bg-white/[0.03]",
      )}
    >
      <div className="flex items-center gap-2 min-w-0">
        <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-white/5">
          {you ? <User size={16} /> : <Bot size={16} />}
        </span>
        <div className="min-w-0">
          <div className="font-medium text-sm truncate">{name}</div>
          <div className="text-[11px] text-[var(--text-dim)]">{formatRating(rating)}</div>
        </div>
      </div>
      <div
        className={cn(
          "font-mono text-lg tabular-nums",
          ms < 15000 ? "text-[var(--danger)]" : "text-white",
        )}
      >
        {m}:{r.toString().padStart(2, "0")}
      </div>
    </div>
  );
}

export default function PlayPage() {
  return (
    <Suspense fallback={<div className="text-[var(--text-muted)]">Loading play…</div>}>
      <PlayInner />
    </Suspense>
  );
}
