import { cn } from "@/lib/utils";

export function StatBar({
  label,
  value,
  color = "var(--accent)",
}: {
  label: string;
  value: number;
  color?: string;
}) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between text-xs">
        <span className="text-[var(--text-muted)]">{label}</span>
        <span className="font-mono text-[var(--text-primary)]">{value}</span>
      </div>
      <div className="progress-bar">
        <span style={{ width: `${Math.min(100, Math.max(0, value))}%`, background: color }} />
      </div>
    </div>
  );
}

export function SeverityBadge({ severity }: { severity: "low" | "medium" | "high" }) {
  return (
    <span
      className={cn(
        "rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide",
        severity === "high" && "bg-[rgba(255,92,122,0.15)] text-[var(--danger)]",
        severity === "medium" && "bg-[rgba(245,197,66,0.15)] text-[var(--warning)]",
        severity === "low" && "bg-[rgba(61,220,151,0.12)] text-[var(--success)]",
      )}
    >
      {severity}
    </span>
  );
}
