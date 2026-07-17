import Link from "next/link";
import {
  Crosshair,
  GraduationCap,
  Sparkles,
  Swords,
  Bot,
  Infinity,
  Zap,
  Shield,
} from "lucide-react";

const FEATURES = [
  {
    icon: Infinity,
    title: "Unlimited everything free",
    body: "Analysis, puzzles, studies depth, explorer — no daily caps. Ever.",
  },
  {
    icon: Crosshair,
    title: "World-class scouting",
    body: "Instant reports for Chess.com, Lichess & FIDE players with prep scores.",
  },
  {
    icon: Bot,
    title: "Twin Bot",
    body: "Practice against an AI that clones openings, style, and typical mistakes.",
  },
  {
    icon: Sparkles,
    title: "Story-mode review",
    body: "Friendly explanations + engine power. Critical moments, not noise.",
  },
  {
    icon: GraduationCap,
    title: "Living AI coach",
    body: "Daily quests built from your real games and weaknesses.",
  },
  {
    icon: Zap,
    title: "Lightning board",
    body: "Dark-first UI, glass panels, buttery piece feel — built for 2026.",
  },
];

export default function HomePage() {
  return (
    <div className="space-y-12 fade-up">
      {/* Hero */}
      <section className="relative overflow-hidden rounded-3xl panel glow-ring px-6 py-10 sm:px-10 sm:py-14">
        <div className="pointer-events-none absolute -right-20 -top-20 h-72 w-72 rounded-full bg-cyan-400/10 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-24 -left-10 h-72 w-72 rounded-full bg-violet-500/10 blur-3xl" />

        <div className="relative max-w-2xl space-y-5">
          <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-[var(--text-muted)]">
            <Shield size={12} className="text-cyan-300" />
            Free-first · Fair Premium · Mobile-ready
          </div>
          <h1 className="text-4xl sm:text-5xl font-semibold tracking-tight leading-[1.1]">
            The chess OS that makes{" "}
            <span className="text-gradient">every opponent</span> understandable.
          </h1>
          <p className="text-[var(--text-muted)] text-base sm:text-lg max-w-xl leading-relaxed">
            Aether combines Chess.com polish, Lichess freedom, and Chess Stalker-level
            scouting — with Twin Bots, unlimited tools, and a coach that actually reads
            your games.
          </p>
          <div className="flex flex-wrap gap-3 pt-1">
            <Link href="/play" className="btn btn-primary">
              <Swords size={18} />
              Play now
            </Link>
            <Link href="/scout" className="btn btn-secondary">
              <Crosshair size={18} />
              Scout a player
            </Link>
            <Link href="/train" className="btn btn-ghost">
              Daily training
            </Link>
          </div>
        </div>

        <div className="relative mt-10 grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { k: "Prep Score", v: "Live" },
            { k: "Analysis", v: "Unlimited" },
            { k: "Twin Bot", v: "Style DNA" },
            { k: "Coach", v: "Living plan" },
          ].map((s) => (
            <div key={s.k} className="glass rounded-2xl px-4 py-3">
              <div className="text-[10px] uppercase tracking-wider text-[var(--text-dim)]">
                {s.k}
              </div>
              <div className="text-lg font-semibold text-white mt-0.5">{s.v}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Quick actions */}
      <section className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <Link
          href="/play"
          className="panel p-5 hover:border-cyan-400/30 transition-colors group"
        >
          <Swords className="text-cyan-300 mb-3" size={22} />
          <h2 className="font-semibold text-lg">Play</h2>
          <p className="text-sm text-[var(--text-muted)] mt-1">
            Bots, Twin Bot, Pass & Play — clocks, saved games, stronger engine option.
          </p>
          <span className="text-xs text-cyan-300 mt-4 inline-block group-hover:underline">
            Start a game →
          </span>
        </Link>
        <Link
          href="/scout"
          className="panel p-5 hover:border-violet-400/30 transition-colors group"
        >
          <Crosshair className="text-violet-300 mb-3" size={22} />
          <h2 className="font-semibold text-lg">Scout + Twin</h2>
          <p className="text-sm text-[var(--text-muted)] mt-1">
            Search any username. Get heatmaps, tilt signals, and spar their Twin Bot.
          </p>
          <span className="text-xs text-violet-300 mt-4 inline-block group-hover:underline">
            Open Scout →
          </span>
        </Link>
        <Link
          href="/train"
          className="panel p-5 hover:border-emerald-400/30 transition-colors group"
        >
          <GraduationCap className="text-emerald-300 mb-3" size={22} />
          <h2 className="font-semibold text-lg">Train</h2>
          <p className="text-sm text-[var(--text-muted)] mt-1">
            Coach plan, unlimited puzzles, and 3-minute Puzzle Storm.
          </p>
          <span className="text-xs text-emerald-300 mt-4 inline-block group-hover:underline">
            Today&apos;s quests →
          </span>
        </Link>
        <Link
          href="/analyze"
          className="panel p-5 hover:border-cyan-400/30 transition-colors group"
        >
          <Sparkles className="text-cyan-300 mb-3" size={22} />
          <h2 className="font-semibold text-lg">Analyze</h2>
          <p className="text-sm text-[var(--text-muted)] mt-1">
            Story review, eval bar, multi-PV engine lines — unlimited and free.
          </p>
          <span className="text-xs text-cyan-300 mt-4 inline-block group-hover:underline">
            Open review →
          </span>
        </Link>
        <Link
          href="/explore"
          className="panel p-5 hover:border-sky-400/30 transition-colors group"
        >
          <Zap className="text-sky-300 mb-3" size={22} />
          <h2 className="font-semibold text-lg">Opening explorer</h2>
          <p className="text-sm text-[var(--text-muted)] mt-1">
            Walk masters-style trees with win/draw/loss heat bars.
          </p>
          <span className="text-xs text-sky-300 mt-4 inline-block group-hover:underline">
            Explore →
          </span>
        </Link>
        <Link
          href="/studies"
          className="panel p-5 hover:border-violet-400/30 transition-colors group"
        >
          <Shield className="text-violet-300 mb-3" size={22} />
          <h2 className="font-semibold text-lg">Studies</h2>
          <p className="text-sm text-[var(--text-muted)] mt-1">
            Notebook chapters, notes, and boards saved in your browser.
          </p>
          <span className="text-xs text-violet-300 mt-4 inline-block group-hover:underline">
            Open studies →
          </span>
        </Link>
      </section>

      {/* Features */}
      <section className="space-y-4">
        <div className="flex items-end justify-between gap-4">
          <div>
            <div className="section-title">Why Aether</div>
            <h2 className="text-2xl font-semibold mt-1">Non-negotiable differentiators</h2>
          </div>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {FEATURES.map((f) => (
            <div key={f.title} className="panel p-5 space-y-2">
              <f.icon size={20} className="text-cyan-300" />
              <h3 className="font-semibold">{f.title}</h3>
              <p className="text-sm text-[var(--text-muted)] leading-relaxed">{f.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="panel p-6 sm:p-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold">Ready to feel the board?</h2>
          <p className="text-sm text-[var(--text-muted)] mt-1">
            No account required for this local MVP — just play, scout, and train.
          </p>
        </div>
        <Link href="/play" className="btn btn-primary shrink-0">
          Enter Aether
        </Link>
      </section>
    </div>
  );
}
