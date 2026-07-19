"use client";

import { useEffect, useState } from "react";
import { Sparkles } from "lucide-react";

export type ToastPayload = { gain: number; bonus?: boolean; reason?: string };

export function emitRewardToast(p: ToastPayload) {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent("aether-toast", { detail: p }));
}

export function ToastRewardHost() {
  const [toast, setToast] = useState<ToastPayload | null>(null);

  useEffect(() => {
    const on = (e: Event) => {
      const d = (e as CustomEvent<ToastPayload>).detail;
      setToast(d);
      window.setTimeout(() => setToast(null), 2800);
    };
    window.addEventListener("aether-toast", on);
    return () => window.removeEventListener("aether-toast", on);
  }, []);

  if (!toast) return null;

  return (
    <div className="fixed bottom-20 md:bottom-8 left-1/2 -translate-x-1/2 z-[110] cmdk-panel">
      <div className="panel px-4 py-3 flex items-center gap-3 shadow-2xl border-amber-500/30 glow-ring">
        <Sparkles className="text-amber-400" size={18} />
        <div>
          <div className="font-semibold text-sm">
            +{toast.gain} XP{toast.bonus ? " · Lucky bonus!" : ""}
          </div>
          {toast.reason && (
            <div className="text-[11px] text-[var(--text-dim)]">{toast.reason}</div>
          )}
        </div>
      </div>
    </div>
  );
}
