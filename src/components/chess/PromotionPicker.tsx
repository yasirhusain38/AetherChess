"use client";

export function PromotionPicker({
  color,
  onPick,
}: {
  color: "w" | "b";
  onPick: (piece: "q" | "r" | "b" | "n") => void;
}) {
  const pieces =
    color === "w"
      ? [
          { p: "q" as const, g: "♕" },
          { p: "r" as const, g: "♖" },
          { p: "b" as const, g: "♗" },
          { p: "n" as const, g: "♘" },
        ]
      : [
          { p: "q" as const, g: "♛" },
          { p: "r" as const, g: "♜" },
          { p: "b" as const, g: "♝" },
          { p: "n" as const, g: "♞" },
        ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 backdrop-blur-sm p-4">
      <div className="panel p-4 space-y-3 glow-ring max-w-sm w-full">
        <div className="font-semibold text-center">Promote pawn</div>
        <div className="grid grid-cols-4 gap-2">
          {pieces.map((x) => (
            <button
              key={x.p}
              type="button"
              className="aspect-square rounded-2xl border border-white/10 bg-white/5 text-4xl hover:border-emerald-500/50 hover:bg-emerald-500/10 transition-colors"
              onClick={() => onPick(x.p)}
              aria-label={`Promote to ${x.p}`}
            >
              {x.g}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
