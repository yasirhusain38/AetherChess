"use client";

import { cn } from "@/lib/utils";

/** Interactive SVG evaluation graph (-1..1 or cp scaled) */
export function EvalGraph({
  points,
  className,
  height = 140,
}: {
  points: number[]; // white POV cp, can be large
  className?: string;
  height?: number;
}) {
  if (!points.length) {
    return (
      <div className={cn("panel p-4 text-xs text-[var(--text-dim)]", className)}>
        No evaluation series yet — load a game.
      </div>
    );
  }
  const w = 600;
  const h = height;
  const mid = h / 2;
  const scale = (cp: number) => {
    const c = Math.max(-600, Math.min(600, cp));
    return mid - (c / 600) * (h * 0.42);
  };
  const step = w / Math.max(1, points.length - 1);
  const path = points
    .map((p, i) => `${i === 0 ? "M" : "L"} ${i * step},${scale(p)}`)
    .join(" ");
  const area = `${path} L ${(points.length - 1) * step},${h} L 0,${h} Z`;

  return (
    <div className={cn("panel p-3 overflow-hidden", className)}>
      <div className="section-title mb-2">Engine evaluation</div>
      <svg viewBox={`0 0 ${w} ${h}`} className="w-full h-auto" role="img" aria-label="Evaluation graph">
        <defs>
          <linearGradient id="evalFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="rgba(110,231,255,0.35)" />
            <stop offset="100%" stopColor="rgba(110,231,255,0.02)" />
          </linearGradient>
        </defs>
        <line x1="0" y1={mid} x2={w} y2={mid} stroke="rgba(255,255,255,0.12)" strokeWidth="1" />
        <path d={area} fill="url(#evalFill)" className="chart-draw" />
        <path
          d={path}
          fill="none"
          stroke="var(--accent)"
          strokeWidth="2.5"
          strokeLinejoin="round"
          className="chart-draw"
        />
        {points.map((p, i) => (
          <circle
            key={i}
            cx={i * step}
            cy={scale(p)}
            r="3"
            fill="var(--accent)"
            className="opacity-0 hover:opacity-100 transition-opacity"
          >
            <title>
              Move {i + 1}: {(p / 100).toFixed(2)}
            </title>
          </circle>
        ))}
      </svg>
      <div className="flex justify-between text-[10px] text-[var(--text-dim)] mt-1 font-mono">
        <span>Start</span>
        <span>0.00</span>
        <span>End</span>
      </div>
    </div>
  );
}

export function QualityBars({
  counts,
  className,
}: {
  counts: Record<string, number>;
  className?: string;
}) {
  const order = [
    "brilliant",
    "great",
    "best",
    "excellent",
    "good",
    "book",
    "inaccuracy",
    "mistake",
    "blunder",
  ];
  const colors: Record<string, string> = {
    brilliant: "var(--brilliant)",
    great: "var(--accent)",
    best: "var(--accent)",
    excellent: "var(--success)",
    good: "var(--success)",
    book: "#94a3b8",
    inaccuracy: "var(--warning)",
    mistake: "#ff9f43",
    blunder: "var(--danger)",
  };
  const max = Math.max(1, ...Object.values(counts));

  return (
    <div className={cn("panel p-4 space-y-2", className)}>
      <div className="section-title">Move quality breakdown</div>
      {order
        .filter((k) => (counts[k] ?? 0) > 0)
        .map((k) => (
          <div key={k} className="flex items-center gap-2 text-xs">
            <span className="w-20 capitalize text-[var(--text-muted)]">{k}</span>
            <div className="flex-1 h-2 rounded-full bg-white/5 overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-700 ease-out"
                style={{
                  width: `${((counts[k] ?? 0) / max) * 100}%`,
                  background: colors[k] ?? "var(--accent)",
                }}
              />
            </div>
            <span className="font-mono w-6 text-right">{counts[k] ?? 0}</span>
          </div>
        ))}
    </div>
  );
}

export function AccuracyRing({
  white,
  black,
  className,
}: {
  white: number;
  black: number;
  className?: string;
}) {
  const Ring = ({ value, label, color }: { value: number; label: string; color: string }) => (
    <div className="flex flex-col items-center gap-2">
      <div
        className="relative h-24 w-24 rounded-full grid place-items-center"
        style={{
          background: `conic-gradient(${color} ${value * 3.6}deg, rgba(255,255,255,0.08) 0)`,
        }}
      >
        <div className="h-16 w-16 rounded-full bg-[var(--bg-panel)] grid place-items-center">
          <span className="font-mono text-lg font-semibold">{value}%</span>
        </div>
      </div>
      <span className="text-xs text-[var(--text-muted)]">{label}</span>
    </div>
  );
  return (
    <div className={cn("panel p-4", className)}>
      <div className="section-title mb-4">Accuracy score</div>
      <div className="flex justify-around">
        <Ring value={white} label="White" color="var(--accent)" />
        <Ring value={black} label="Black" color="var(--accent-2)" />
      </div>
    </div>
  );
}

export function MistakeTimeline({
  events,
  className,
}: {
  events: { ply: number; label: string; kind: "blunder" | "mistake" | "brilliant" | "critical" }[];
  className?: string;
}) {
  return (
    <div className={cn("panel p-4 space-y-3", className)}>
      <div className="section-title">Mistake & critical timeline</div>
      {events.length === 0 && (
        <p className="text-xs text-[var(--text-dim)]">No critical markers in this game.</p>
      )}
      <div className="relative pl-4 space-y-3">
        <div className="absolute left-1 top-1 bottom-1 w-px bg-white/10" />
        {events.map((e, i) => (
          <div key={i} className="relative flex gap-3 text-sm">
            <span
              className={cn(
                "absolute -left-[0.55rem] top-1.5 h-2.5 w-2.5 rounded-full",
                e.kind === "blunder" && "bg-[var(--danger)]",
                e.kind === "mistake" && "bg-[#ff9f43]",
                e.kind === "brilliant" && "bg-[var(--brilliant)]",
                e.kind === "critical" && "bg-cyan-300",
              )}
            />
            <span className="font-mono text-[var(--text-dim)] w-12 shrink-0">#{e.ply}</span>
            <span className="text-[var(--text-muted)]">{e.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export function RadarChart({
  labels,
  values,
  className,
}: {
  labels: string[];
  values: number[];
  className?: string;
}) {
  const n = labels.length;
  const cx = 100;
  const cy = 100;
  const r = 70;
  const pts = values.map((v, i) => {
    const a = (Math.PI * 2 * i) / n - Math.PI / 2;
    const rr = (Math.max(0, Math.min(100, v)) / 100) * r;
    return [cx + rr * Math.cos(a), cy + rr * Math.sin(a)];
  });
  const poly = pts.map((p) => p.join(",")).join(" ");
  const grid = [0.25, 0.5, 0.75, 1].map((s) =>
    labels
      .map((_, i) => {
        const a = (Math.PI * 2 * i) / n - Math.PI / 2;
        return `${cx + r * s * Math.cos(a)},${cy + r * s * Math.sin(a)}`;
      })
      .join(" "),
  );

  return (
    <div className={cn("panel p-4", className)}>
      <div className="section-title mb-2">Style radar</div>
      <svg viewBox="0 0 200 200" className="w-full max-w-[280px] mx-auto">
        {grid.map((g, i) => (
          <polygon key={i} points={g} fill="none" stroke="rgba(255,255,255,0.08)" />
        ))}
        {labels.map((lab, i) => {
          const a = (Math.PI * 2 * i) / n - Math.PI / 2;
          const x = cx + (r + 16) * Math.cos(a);
          const y = cy + (r + 16) * Math.sin(a);
          return (
            <text
              key={lab}
              x={x}
              y={y}
              textAnchor="middle"
              dominantBaseline="middle"
              className="fill-[var(--text-dim)]"
              fontSize="7"
            >
              {lab}
            </text>
          );
        })}
        <polygon
          points={poly}
          fill="rgba(110,231,255,0.2)"
          stroke="var(--accent)"
          strokeWidth="1.5"
          className="chart-draw"
        />
      </svg>
    </div>
  );
}
