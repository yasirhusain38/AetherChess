"use client";

import { useEffect, useState } from "react";
import { socialProofStats } from "@/lib/engagement";

const EVENTS = [
  "just finished a Scout report on a 2100",
  "solved a mate-in-2 in Storm",
  "beat Summit’s opening with Twin prep",
  "claimed daily quest XP",
  "reviewed a blunder on Analyze",
  "joined the free gauntlet",
  "saved a study chapter",
];

export function SocialProofTicker() {
  const [stats, setStats] = useState(socialProofStats());
  const [msg, setMsg] = useState(EVENTS[0]);
  const [who, setWho] = useState("Player");

  useEffect(() => {
    setStats(socialProofStats());
    const names = ["Aarav", "Mia", "Kenji", "Sofia", "Omar", "Elena", "Priya", "Leo", "Noah", "Zara"];
    const tick = () => {
      setStats(socialProofStats());
      setWho(names[Math.floor(Math.random() * names.length)]);
      setMsg(EVENTS[Math.floor(Math.random() * EVENTS.length)]);
    };
    const id = window.setInterval(tick, 4200);
    return () => window.clearInterval(id);
  }, []);

  return (
    <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/5 px-4 py-3 flex flex-col sm:flex-row sm:items-center gap-3 text-xs sm:text-sm">
      <div className="flex flex-wrap gap-3 font-mono text-[var(--text-muted)]">
        <span>
          <strong className="text-emerald-400">{stats.online.toLocaleString()}</strong> online
        </span>
        <span className="text-white/20">|</span>
        <span>
          <strong className="text-amber-400">{stats.scoutsLastHour}</strong> scouts / hr
        </span>
        <span className="text-white/20">|</span>
        <span>
          <strong className="text-white">{stats.gamesLastHour}</strong> games / hr
        </span>
      </div>
      <div className="flex-1 text-[var(--text-muted)] min-w-0 truncate">
        <span className="text-amber-300 font-medium">{who}</span> {msg}
      </div>
    </div>
  );
}
