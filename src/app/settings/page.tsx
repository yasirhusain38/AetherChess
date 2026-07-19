"use client";

import Link from "next/link";
import { useSession } from "next-auth/react";
import { BookOpen, Compass, Settings, Volume2, LogIn } from "lucide-react";
import { Chess } from "chess.js";
import { ChessBoard } from "@/components/chess/ChessBoard";
import { BOARD_THEMES } from "@/lib/chess/themes";
import { playSound } from "@/lib/chess/sound";
import { useStorageEpoch } from "@/lib/hooks/useClientStorage";
import { useSettings } from "@/lib/hooks/useSettings";
import { getStats } from "@/lib/storage";
import { cn } from "@/lib/utils";
import { useMemo } from "react";

export default function SettingsPage() {
  const { settings, update } = useSettings();
  const { data: session } = useSession();
  const epoch = useStorageEpoch();
  const stats = useMemo(() => {
    void epoch;
    if (typeof window === "undefined") {
      return {
        gamesPlayed: 0,
        wins: 0,
        losses: 0,
        draws: 0,
        puzzlesSolved: 0,
        stormBest: 0,
        scoutReports: 0,
        twinSessions: 0,
      };
    }
    return getStats();
  }, [epoch]);

  return (
    <div className="fade-up space-y-6 max-w-3xl">
      <div>
        <div className="section-title">Platform</div>
        <h1 className="text-2xl sm:text-3xl font-semibold mt-1 flex items-center gap-2">
          <Settings className="text-amber-400" size={28} />
          Settings
        </h1>
      </div>

      <div className="panel p-5 space-y-4">
        <div className="section-title">Account</div>
        {session?.user ? (
          <div className="flex items-center gap-3">
            {session.user.image ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={session.user.image}
                alt=""
                className="h-12 w-12 rounded-2xl object-cover border border-white/10"
              />
            ) : (
              <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-400 to-amber-500 text-[#061018] font-bold">
                {(session.user.name || session.user.email || "A").charAt(0).toUpperCase()}
              </span>
            )}
            <div className="min-w-0">
              <div className="font-semibold truncate">{session.user.name}</div>
              <div className="text-sm text-[var(--text-muted)] truncate">
                {session.user.email}
              </div>
              {session.user.provider && (
                <div className="text-[11px] text-[var(--text-dim)] capitalize mt-0.5">
                  Signed in with {session.user.provider}
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-sm text-[var(--text-muted)] flex-1">
              Sign in to keep your identity across devices (OAuth + email).
            </p>
            <Link href="/login" className="btn btn-secondary !py-2">
              <LogIn size={15} />
              Log in
            </Link>
            <Link href="/signup" className="btn btn-primary !py-2">
              Sign up
            </Link>
          </div>
        )}
      </div>

      <div className="panel p-5 space-y-4">
        <div className="section-title">Profile</div>
        <label className="block space-y-1.5">
          <span className="text-sm text-[var(--text-muted)]">Display name (local)</span>
          <input
            className="input"
            value={settings.displayName}
            onChange={(e) => update({ displayName: e.target.value })}
            maxLength={24}
          />
        </label>
      </div>

      <div className="panel p-5 space-y-4">
        <div className="section-title">Board theme</div>
        <div className="grid sm:grid-cols-3 gap-2">
          {BOARD_THEMES.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => update({ boardTheme: t.id })}
              className={cn(
                "rounded-2xl border p-3 text-left transition-colors",
                settings.boardTheme === t.id
                  ? "border-emerald-500/40 bg-emerald-500/10"
                  : "border-white/10 hover:border-white/20",
              )}
            >
              <div className="flex h-8 rounded-lg overflow-hidden mb-2">
                <div className="flex-1" style={{ background: t.light }} />
                <div className="flex-1" style={{ background: t.dark }} />
              </div>
              <div className="text-sm font-medium">{t.name}</div>
            </button>
          ))}
        </div>
        <div className="max-w-xs">
          <ChessBoard
            fen={new Chess().fen()}
            interactive={false}
            boardThemeId={settings.boardTheme}
            showCoordinates={settings.coord}
          />
        </div>
      </div>

      <div className="panel p-5 space-y-3">
        <div className="section-title">Preferences</div>
        {(
          [
            ["sound", "Sound effects", settings.sound],
            ["showLegalMoves", "Show legal moves", settings.showLegalMoves],
            ["highlightLastMove", "Highlight last move", settings.highlightLastMove],
            ["coord", "Coordinates", settings.coord],
            ["autoQueen", "Auto-queen promotions", settings.autoQueen],
            ["animations", "Animations", settings.animations],
          ] as const
        ).map(([key, label, value]) => (
          <label
            key={key}
            className="flex items-center justify-between gap-3 rounded-xl border border-white/8 px-3 py-2.5 cursor-pointer hover:bg-white/[0.03]"
          >
            <span className="text-sm">{label}</span>
            <input
              type="checkbox"
              checked={value}
              className="accent-emerald-500 h-4 w-4"
              onChange={(e) => {
                update({ [key]: e.target.checked });
                if (key === "sound" && e.target.checked) playSound("success", true);
              }}
            />
          </label>
        ))}
        <button
          type="button"
          className="btn btn-secondary !py-2"
          onClick={() => playSound("move", true)}
        >
          <Volume2 size={16} />
          Test sound
        </button>
      </div>

      <div className="panel p-5 space-y-3">
        <div className="section-title">Your stats (local)</div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {(
            [
              ["Games", stats.gamesPlayed],
              ["Wins", stats.wins],
              ["Puzzles", stats.puzzlesSolved],
              ["Storm best", stats.stormBest],
              ["Scouts", stats.scoutReports],
              ["Twin", stats.twinSessions],
            ] as const
          ).map(([k, v]) => (
            <div key={k} className="glass rounded-xl p-3">
              <div className="text-[10px] uppercase text-[var(--text-dim)]">{k}</div>
              <div className="text-xl font-semibold font-mono">{v}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="panel p-5 space-y-3">
        <div className="section-title">More</div>
        <div className="grid sm:grid-cols-2 gap-2">
          <Link href="/explore" className="btn btn-secondary justify-start">
            <Compass size={16} /> Opening explorer
          </Link>
          <Link href="/studies" className="btn btn-secondary justify-start">
            <BookOpen size={16} /> Studies
          </Link>
          <Link href="/train?mode=storm" className="btn btn-secondary justify-start">
            Puzzle Storm
          </Link>
          <Link href="/analyze" className="btn btn-secondary justify-start">
            Analyze games
          </Link>
          <Link href="/tournaments" className="btn btn-secondary justify-start">
            Tournaments
          </Link>
          <Link href="/leaderboard" className="btn btn-secondary justify-start">
            Leaderboard
          </Link>
          <Link href="/clubs" className="btn btn-secondary justify-start">
            Clubs
          </Link>
          <Link href="/watch" className="btn btn-secondary justify-start">
            Watch party
          </Link>
        </div>
      </div>
    </div>
  );
}
