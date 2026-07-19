"use client";

import Link from "next/link";
import { Flame, Sparkles, Crosshair } from "lucide-react";

/** Peak-end rule: end games with clear emotion + next action */
export function PostGameEmotion({
  won,
  draw,
  xpGain,
  streak,
  reviewHref,
}: {
  won: boolean;
  draw?: boolean;
  xpGain?: number;
  streak?: number;
  reviewHref?: string;
}) {
  const title = draw ? "Hard-fought draw" : won ? "Victory" : "Tough loss — fuel for growth";
  const sub = draw
    ? "Equal endgames build masters. Review one critical moment."
    : won
      ? "Celebrate briefly, then lock the pattern in Analyze."
      : "Losses stick less when you extract one lesson in under 2 minutes.";

  return (
    <div
      className={
        won
          ? "rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3 space-y-2"
          : draw
            ? "rounded-xl border border-amber-500/30 bg-amber-500/10 p-3 space-y-2"
            : "rounded-xl border border-rose-400/25 bg-rose-500/10 p-3 space-y-2"
      }
    >
      <div className="font-semibold text-sm flex items-center gap-2">
        {won ? <Sparkles size={16} className="text-emerald-300" /> : <Flame size={16} className="text-amber-300" />}
        {title}
      </div>
      <p className="text-xs text-[var(--text-muted)] leading-relaxed">{sub}</p>
      {(xpGain != null || streak != null) && (
        <p className="text-xs font-mono text-amber-300">
          {xpGain != null && `+${xpGain} XP`}
          {xpGain != null && streak != null && " · "}
          {streak != null && `${streak}-day streak`}
        </p>
      )}
      <div className="flex flex-wrap gap-2 pt-1">
        {reviewHref && (
          <Link href={reviewHref} className="btn btn-primary !py-1.5 !text-xs">
            Review now
          </Link>
        )}
        <Link href="/scout" className="btn btn-secondary !py-1.5 !text-xs">
          <Crosshair size={12} />
          Prep next opponent
        </Link>
      </div>
    </div>
  );
}
