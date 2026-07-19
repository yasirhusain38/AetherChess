"use client";

import { useEffect, useState } from "react";
import { Chess } from "chess.js";
import { ChessBoard } from "@/components/chess/ChessBoard";
import { cn } from "@/lib/utils";

const STEPS = [
  { label: "Search opponent", detail: "hikaru · Chess.com" },
  { label: "Oracle builds dossier", detail: "Prep 78 · Collapse 41%" },
  { label: "Train Twin Bot", detail: "Clone style · force sideline" },
];

export function HeroDemo() {
  const [step, setStep] = useState(0);
  const fen = new Chess().fen();

  useEffect(() => {
    const t = window.setInterval(() => setStep((s) => (s + 1) % STEPS.length), 2800);
    return () => window.clearInterval(t);
  }, []);

  return (
    <div className="relative">
      <div className="absolute -inset-4 rounded-3xl bg-gradient-to-br from-emerald-500/10 via-amber-600/10 to-transparent blur-2xl pointer-events-none" />
      <div className="relative panel p-3 sm:p-4 space-y-3 glow-ring">
        <div className="flex items-center justify-between px-1">
          <div className="text-xs font-medium text-amber-300">Live product preview</div>
          <div className="flex gap-1">
            {STEPS.map((_, i) => (
              <span
                key={i}
                className={cn(
                  "h-1.5 w-1.5 rounded-full transition-all",
                  i === step ? "bg-cyan-300 w-4" : "bg-white/20",
                )}
              />
            ))}
          </div>
        </div>

        <div className="rounded-2xl border border-white/10 bg-black/20 p-3 space-y-2">
          <div className="flex items-center gap-2 text-xs">
            <span className="chip !cursor-default !py-0.5 pulse-ring border-emerald-500/30 text-amber-300">
              Scout
            </span>
            <span className="text-[var(--text-muted)] animate-pulse-soft">
              {STEPS[step].label}
            </span>
          </div>
          <div className="font-mono text-sm text-white">{STEPS[step].detail}</div>
          <div className="grid grid-cols-3 gap-2 text-[10px]">
            <div className="glass rounded-lg p-2">
              <div className="text-[var(--text-dim)]">Oracle</div>
              <div className="text-base font-semibold text-amber-400">78</div>
            </div>
            <div className="glass rounded-lg p-2">
              <div className="text-[var(--text-dim)]">Collapse</div>
              <div className="text-base font-semibold text-rose-300">41%</div>
            </div>
            <div className="glass rounded-lg p-2">
              <div className="text-[var(--text-dim)]">Twin</div>
              <div className="text-base font-semibold text-amber-400">Ready</div>
            </div>
          </div>
        </div>

        <div className="relative max-w-[280px] mx-auto hero-demo-piece">
          <ChessBoard fen={fen} interactive={false} boardThemeId="aether" showCoordinates />
        </div>

        <p className="text-[11px] text-center text-[var(--text-dim)]">
          Unique loop: Scout → Oracle report → Twin Bot practice — free, unlimited.
        </p>
      </div>
    </div>
  );
}
