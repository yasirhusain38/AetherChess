"use client";

import { useEffect, useRef, useState } from "react";
import { Chess } from "chess.js";
import { Eye, MessageCircle } from "lucide-react";
import { ChessBoard } from "@/components/chess/ChessBoard";
import { BOT_PRESETS, pickBotMove } from "@/lib/chess/bot";
import { engineMove } from "@/lib/chess/engine";
import { useSettings } from "@/lib/hooks/useSettings";
import { cn } from "@/lib/utils";

interface ChatMsg {
  id: string;
  user: string;
  text: string;
}

const CHAT_POOL = [
  "gg that knight sac",
  "eval bar is lying",
  "Twin energy",
  "take the free pawn!!",
  "Aether board so clean",
  "prep score on white?",
  "L + ratio + blunder",
  "nova always overpushes",
  "this opening is cursed",
  "let's go endgame",
];

export default function WatchPage() {
  const { settings } = useSettings();
  const [fen, setFen] = useState(() => new Chess().fen());
  const [lastMove, setLastMove] = useState<{ from: string; to: string } | null>(null);
  const [status, setStatus] = useState("Featured: Aurora vs Quasar");
  const [chat, setChat] = useState<ChatMsg[]>([
    { id: "1", user: "mod_aether", text: "Welcome to the watch party 👋" },
    { id: "2", user: "tactics_fan", text: "Quasar about to cook" },
  ]);
  const [input, setInput] = useState("");
  const [engineOn, setEngineOn] = useState(true);
  const [paused, setPaused] = useState(false);
  const white = BOT_PRESETS.aurora;
  const black = BOT_PRESETS.quasar;
  const busy = useRef(false);

  useEffect(() => {
    if (paused) return;
    const id = window.setInterval(() => {
      if (busy.current) return;
      const c = new Chess(fen);
      if (c.isGameOver()) {
        const n = new Chess();
        setFen(n.fen());
        setLastMove(null);
        setStatus("Featured: rematch · Aurora vs Quasar");
        return;
      }
      busy.current = true;
      const bot = c.turn() === "w" ? white : black;
      const move = engineMove(fen, 2) ?? pickBotMove(fen, bot);
      if (move) {
        c.move(move);
        setFen(c.fen());
        setLastMove({ from: move.from, to: move.to });
        setStatus(`${c.turn() === "b" ? white.name : black.name} played ${move.san}`);
      }
      busy.current = false;
    }, 1400);
    return () => window.clearInterval(id);
  }, [fen, paused, white, black]);

  useEffect(() => {
    const id = window.setInterval(() => {
      if (Math.random() > 0.55) return;
      const user = ["viewer" + Math.floor(Math.random() * 90), "blitz_only", "endgame_owl"][
        Math.floor(Math.random() * 3)
      ];
      const text = CHAT_POOL[Math.floor(Math.random() * CHAT_POOL.length)];
      setChat((c) =>
        [...c, { id: String(Date.now()), user, text }].slice(-40),
      );
    }, 3200);
    return () => window.clearInterval(id);
  }, []);

  const send = () => {
    if (!input.trim()) return;
    setChat((c) => [
      ...c,
      { id: String(Date.now()), user: settings.displayName || "You", text: input.trim() },
    ]);
    setInput("");
  };

  return (
    <div className="fade-up space-y-6">
      <div>
        <div className="section-title">Broadcast</div>
        <h1 className="text-2xl sm:text-3xl font-semibold mt-1 flex items-center gap-2">
          <Eye className="text-amber-400" size={28} />
          Watch
        </h1>
        <p className="text-sm text-[var(--text-muted)] mt-1">
          Featured bot board + chat party. Streamer RTMP & multi-board lobby next.
        </p>
      </div>

      <div className="grid lg:grid-cols-[minmax(0,1fr)_320px] gap-6 items-start">
        <div className="space-y-3 max-w-[min(100%,560px)]">
          <div className="flex items-center justify-between text-sm">
            <span>
              <span className="text-white font-medium">{white.name}</span>
              <span className="text-[var(--text-dim)]"> vs </span>
              <span className="text-white font-medium">{black.name}</span>
            </span>
            <span className="text-xs text-[var(--text-muted)]">{status}</span>
          </div>
          <ChessBoard
            fen={fen}
            interactive={false}
            lastMove={lastMove}
            boardThemeId={settings.boardTheme}
            showCoordinates={settings.coord}
          />
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              className={cn("chip", paused && "chip-active")}
              onClick={() => setPaused((p) => !p)}
            >
              {paused ? "Resume" : "Pause"}
            </button>
            <button
              type="button"
              className={cn("chip", engineOn && "chip-active")}
              onClick={() => setEngineOn((e) => !e)}
            >
              Live engine {engineOn ? "on" : "off"}
            </button>
            <button
              type="button"
              className="chip"
              onClick={() => {
                setFen(new Chess().fen());
                setLastMove(null);
              }}
            >
              New featured game
            </button>
          </div>
          {engineOn && (
            <p className="text-xs text-[var(--text-dim)]">
              Spectator engine uses the same free local minimax — never paywalls eval on Aether.
            </p>
          )}
        </div>

        <div className="panel flex flex-col h-[480px]">
          <div className="px-4 py-3 border-b border-white/5 section-title flex items-center gap-2">
            <MessageCircle size={12} /> Watch party chat
          </div>
          <div className="flex-1 overflow-y-auto p-3 space-y-2">
            {chat.map((m) => (
              <div key={m.id} className="text-sm">
                <span className="text-amber-400 font-medium">{m.user}</span>
                <span className="text-[var(--text-muted)]">: {m.text}</span>
              </div>
            ))}
          </div>
          <div className="p-3 border-t border-white/5 flex gap-2">
            <input
              className="input !py-2"
              placeholder="Say something…"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && send()}
            />
            <button type="button" className="btn btn-primary !py-2" onClick={send}>
              Send
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
