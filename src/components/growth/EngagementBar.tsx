"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Flame, Sparkles, Target } from "lucide-react";
import {
  getDailyQuests,
  levelProgress,
  loadEngagement,
  type EngagementState,
} from "@/lib/engagement";
import { cn } from "@/lib/utils";

export function EngagementBar() {
  const [e, setE] = useState<EngagementState | null>(null);

  useEffect(() => {
    setE(loadEngagement());
    const on = () => setE(loadEngagement());
    window.addEventListener("aether-engagement", on);
    window.addEventListener("storage", on);
    return () => {
      window.removeEventListener("aether-engagement", on);
      window.removeEventListener("storage", on);
    };
  }, []);

  if (!e) return null;

  const quests = getDailyQuests(e);
  const open = quests.filter((q) => !q.done).length;
  const pct = levelProgress(e.xp, e.level);
  const streakAtRisk = e.gamesToday === 0 && e.streak >= 2;

  return (
    <div className="border-b border-white/5 bg-[#0f160f]/95 backdrop-blur-md">
      <div className="mx-auto max-w-7xl px-4 py-1.5 flex flex-wrap items-center gap-3 text-xs">
        <div
          className={cn(
            "inline-flex items-center gap-1.5 font-semibold",
            streakAtRisk ? "text-amber-300 animate-pulse-soft" : "text-amber-400",
          )}
          title="Loss aversion: don't break your streak"
        >
          <Flame size={14} className={streakAtRisk ? "text-rose-400" : ""} />
          {e.streak} day streak
          {streakAtRisk && <span className="font-normal text-rose-300">· play today to keep it</span>}
        </div>

        <div className="hidden sm:flex items-center gap-2 min-w-[8rem] flex-1 max-w-xs">
          <Sparkles size={12} className="text-emerald-400 shrink-0" />
          <div className="flex-1">
            <div className="flex justify-between text-[10px] text-[var(--text-dim)] mb-0.5">
              <span>Lv {e.level}</span>
              <span>{e.xp} XP</span>
            </div>
            <div className="h-1.5 rounded-full bg-white/10 overflow-hidden">
              <div
                className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-amber-400 transition-all duration-500"
                style={{ width: `${pct}%` }}
              />
            </div>
          </div>
        </div>

        <Link
          href="/train"
          className={cn(
            "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 transition-colors",
            open > 0
              ? "border-amber-500/40 bg-amber-500/10 text-amber-200"
              : "border-white/10 text-[var(--text-dim)]",
          )}
        >
          <Target size={12} />
          {open > 0 ? `${open} daily quest${open > 1 ? "s" : ""} open` : "Quests complete ✓"}
        </Link>
      </div>
    </div>
  );
}
