"use client";

import { formatEval } from "@/lib/chess/engine";
import { cn } from "@/lib/utils";

export function EvalBar({
  scoreCp,
  className,
  vertical = true,
}: {
  scoreCp: number;
  className?: string;
  vertical?: boolean;
}) {
  // Map cp to 0-100 white share
  const clamped = Math.max(-800, Math.min(800, scoreCp));
  const whitePct = 50 + (clamped / 800) * 50;

  if (vertical) {
    return (
      <div
        className={cn(
          "relative w-3 sm:w-4 rounded-full overflow-hidden border border-white/10 bg-neutral-900",
          className,
        )}
        title={formatEval(scoreCp)}
      >
        <div
          className="absolute bottom-0 inset-x-0 bg-[#f4f6fa] transition-[height] duration-300"
          style={{ height: `${whitePct}%` }}
        />
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-[9px] font-mono font-bold text-cyan-200/90 mix-blend-difference rotate-180 writing-vertical">
            {formatEval(scoreCp)}
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className={cn("h-2 rounded-full overflow-hidden bg-neutral-800 border border-white/10", className)}>
      <div
        className="h-full bg-[#f4f6fa] transition-[width] duration-300"
        style={{ width: `${whitePct}%` }}
      />
    </div>
  );
}
