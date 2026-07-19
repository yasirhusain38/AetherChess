"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Medal } from "lucide-react";
import {
  getLeaderboard,
  getRatings,
  type TcCategory,
} from "@/lib/chess/rating";
import { useStorageEpoch } from "@/lib/hooks/useClientStorage";
import { cn } from "@/lib/utils";

export default function LeaderboardPage() {
  const [category, setCategory] = useState<TcCategory>("blitz");
  const epoch = useStorageEpoch();

  const ratings = useMemo(() => {
    void epoch;
    if (typeof window === "undefined") return null;
    return getRatings();
  }, [epoch]);

  const rows = useMemo(() => {
    void epoch;
    if (typeof window === "undefined") return [];
    return getLeaderboard(category);
  }, [category, epoch]);

  return (
    <div className="fade-up space-y-6 max-w-3xl">
      <div>
        <div className="section-title">Community</div>
        <h1 className="text-2xl sm:text-3xl font-semibold mt-1 flex items-center gap-2">
          <Medal className="text-amber-300" size={28} />
          Leaderboard
        </h1>
        <p className="text-sm text-[var(--text-muted)] mt-1">
          Local ratings (Elo-style) mixed with a showcase ladder. Play bots & gauntlets to climb.
        </p>
      </div>

      {ratings && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {(
            [
              ["bullet", ratings.bullet.rating],
              ["blitz", ratings.blitz.rating],
              ["rapid", ratings.rapid.rating],
              ["classical", ratings.classical.rating],
            ] as const
          ).map(([k, v]) => (
            <button
              key={k}
              type="button"
              onClick={() => setCategory(k)}
              className={cn(
                "glass rounded-2xl p-3 text-left capitalize",
                category === k && "ring-1 ring-emerald-500/40",
              )}
            >
              <div className="text-[10px] uppercase text-[var(--text-dim)]">{k}</div>
              <div className="text-xl font-mono font-semibold">{v}</div>
              <div className="text-[10px] text-[var(--text-dim)]">
                peak {ratings[k].peak} · {ratings[k].games}g
              </div>
            </button>
          ))}
        </div>
      )}

      <div className="panel overflow-hidden">
        <div className="px-4 py-3 border-b border-white/5 section-title">{category} ladder</div>
        <div className="divide-y divide-white/5">
          {rows.map((r, i) => (
            <div
              key={r.name + i}
              className={cn("flex items-center gap-3 px-4 py-3", r.you && "bg-emerald-500/10")}
            >
              <span className="w-8 font-mono text-sm text-[var(--text-dim)]">{i + 1}</span>
              <div className="flex-1 min-w-0">
                <div className="font-medium truncate">
                  {r.name}
                  {r.you && (
                    <span className="ml-2 text-[10px] uppercase text-amber-400">you</span>
                  )}
                </div>
                <div className="text-[11px] text-[var(--text-dim)]">{r.games} games</div>
              </div>
              <div className="font-mono font-semibold">{r.rating}</div>
            </div>
          ))}
        </div>
      </div>

      {ratings && ratings.history.length > 0 && (
        <div className="panel p-4 space-y-2">
          <div className="section-title">Recent rating changes</div>
          {ratings.history.slice(0, 10).map((h, i) => (
            <div key={i} className="flex justify-between text-sm">
              <span className="text-[var(--text-muted)]">
                vs {h.opp} · {h.category}
              </span>
              <span
                className={cn(
                  "font-mono",
                  h.delta >= 0 ? "text-[var(--success)]" : "text-[var(--danger)]",
                )}
              >
                {h.delta >= 0 ? "+" : ""}
                {h.delta} → {h.rating}
              </span>
            </div>
          ))}
        </div>
      )}

      <div className="flex gap-2">
        <Link href="/play" className="btn btn-primary">
          Play rated bot
        </Link>
        <Link href="/tournaments" className="btn btn-secondary">
          Join gauntlet
        </Link>
      </div>
    </div>
  );
}
