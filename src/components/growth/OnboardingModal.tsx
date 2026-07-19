"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Crosshair, Swords, GraduationCap, X } from "lucide-react";
import { completeOnboarding, loadEngagement } from "@/lib/engagement";

export function OnboardingModal() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const e = loadEngagement();
    if (!e.onboardingDone) setOpen(true);
  }, []);

  if (!open) return null;

  const finish = (href?: string) => {
    completeOnboarding();
    setOpen(false);
    if (href) window.location.href = href;
  };

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 cmdk-overlay">
      <button
        type="button"
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        aria-label="Close"
        onClick={() => finish()}
      />
      <div className="relative z-10 w-full max-w-md panel p-6 space-y-4 glow-ring cmdk-panel">
        <button
          type="button"
          className="absolute top-3 right-3 text-[var(--text-dim)] hover:text-white"
          onClick={() => finish()}
        >
          <X size={18} />
        </button>
        <div className="text-center space-y-2">
          <div className="brand-mark mx-auto h-12 w-12 rounded-2xl grid place-items-center text-lg">
            Æ
          </div>
          <h2 className="text-xl font-semibold">Welcome — you&apos;re already Level 1</h2>
          <p className="text-sm text-[var(--text-muted)] leading-relaxed">
            Most sites start you at zero. You already have{" "}
            <strong className="text-amber-300">40 XP</strong> and a{" "}
            <strong className="text-amber-300">1-day streak</strong>. Pick one path — 2 minutes.
          </p>
        </div>

        <div className="space-y-2">
          <button
            type="button"
            className="w-full btn btn-primary justify-start"
            onClick={() => finish("/play")}
          >
            <Swords size={18} />
            I want to play now
          </button>
          <button
            type="button"
            className="w-full btn btn-secondary justify-start"
            onClick={() => finish("/scout")}
          >
            <Crosshair size={18} />
            Scout my next opponent
          </button>
          <button
            type="button"
            className="w-full btn btn-ghost justify-start border border-white/10"
            onClick={() => finish("/train")}
          >
            <GraduationCap size={18} />
            Train with puzzles
          </button>
        </div>

        <p className="text-[11px] text-center text-[var(--text-dim)]">
          Tip: <kbd className="px-1 border border-white/15 rounded">Ctrl+K</kbd> jumps anywhere.
          Come back tomorrow — streak psychology keeps masters sharp.
        </p>
        <Link
          href="/signup"
          className="block text-center text-xs text-amber-400 hover:underline"
          onClick={() => finish()}
        >
          Create free account to sync progress →
        </Link>
      </div>
    </div>
  );
}
