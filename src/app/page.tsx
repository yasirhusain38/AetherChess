import Link from "next/link";
import {
  ArrowRight,
  Bot,
  Check,
  Crosshair,
  GraduationCap,
  Infinity,
  Shield,
  Sparkles,
  Swords,
  Zap,
  X,
} from "lucide-react";
import { HeroDemo } from "@/components/home/HeroDemo";
import { SocialProofTicker } from "@/components/growth/SocialProofTicker";
import { pageMeta } from "@/lib/seo";

export const metadata = pageMeta({
  title: "Free Chess Analysis & AI Chess Coach | Aether",
  description:
    "Aether is the free-first chess platform for players who want unlimited analysis, opponent scouting like a pro, Twin Bot practice, and an AI coach — without paywalls. Better than Chess.com freemium limits and more modern than Lichess.",
  path: "/",
  keywords: [
    "free chess analysis",
    "AI chess coach",
    "opponent scouting",
    "chess twin bot",
    "chess.com alternative",
    "lichess alternative",
  ],
});

const FEATURES = [
  {
    icon: Infinity,
    title: "Unlimited tools — free forever",
    problem: "Chess.com locks puzzles, analysis depth, and reviews behind Premium.",
    solution:
      "Play, analyze, train, explore openings, and run Scout reports with no daily caps. Learning is not a paywall.",
  },
  {
    icon: Crosshair,
    title: "Opponent Scout (beyond Chess Stalker)",
    problem: "You pair into a tournament blind, or juggle three tabs to prep.",
    solution:
      "One search builds an Oracle dossier: openings, collapse rate, piece DNA, rematch tilt, clock autopsy, and a battle plan.",
  },
  {
    icon: Bot,
    title: "Twin Bot practice",
    problem: "Engine sparring doesn’t feel like your rival’s openings or mistakes.",
    solution:
      "Train against a bot that clones repertoire DNA and typical errors so you rehearse the real fight.",
  },
  {
    icon: Sparkles,
    title: "Story-mode game review",
    problem: "Raw engine lines don’t teach. Generic AI coaches feel salesy.",
    solution:
      "Classifications, eval graph, critical timeline, and plain-language explanations — unlimited after every game.",
  },
  {
    icon: GraduationCap,
    title: "Living AI coach",
    problem: "Random puzzles ignore your real leaks.",
    solution:
      "Daily quests from your blunders, time-pressure themes, and opening weak spots — with streak-friendly training.",
  },
  {
    icon: Zap,
    title: "2026 board feel",
    problem: "Legacy UIs feel slow or cluttered; serious tools feel ugly.",
    solution:
      "Dark-first glass design, buttery board, command palette (⌘K), and motion that stays out of the way.",
  },
];

const COMPARISON = [
  {
    feature: "Unlimited analysis & puzzles",
    aether: true,
    chesscom: false,
    lichess: true,
  },
  {
    feature: "Opponent scouting + Twin Bot",
    aether: true,
    chesscom: false,
    lichess: false,
  },
  {
    feature: "Polish + modern UX",
    aether: true,
    chesscom: true,
    lichess: false,
  },
  {
    feature: "Free-first ethics (no tool rent)",
    aether: true,
    chesscom: false,
    lichess: true,
  },
  {
    feature: "AI living training plan",
    aether: true,
    chesscom: "paid",
    lichess: false,
  },
];

const FAQS = [
  {
    q: "Is Aether really free?",
    a: "Yes for the core loop: play, unlimited analysis, puzzles, Scout, Twin Bot, studies, explorer. Optional Premium is for polish, prizes, and deeper coach extras — never for oxygen.",
  },
  {
    q: "How is Scout different from Chess Stalker?",
    a: "Scout is native to the platform: live Chess.com/Lichess pulls, Oracle multi-factor scoring, piece DNA, conversion physics, nemesis graphs, rematch curse, prep pack, and one-click Twin Bot practice.",
  },
  {
    q: "Who is Aether for?",
    a: "Beginners who want clarity, club players who prep tournaments, coaches who need reports, and titled players who refuse paywalled analysis.",
  },
  {
    q: "Do I need an account?",
    a: "You can explore many tools immediately. Sign up (email or Google/GitHub when configured) to keep identity, ratings, and progress.",
  },
  {
    q: "How do I start in 5 minutes?",
    a: "Play a bot game → review with Analyze → Scout a Chess.com username → Train Twin Bot on their openings.",
  },
];

const ROADMAP = [
  { when: "Now", item: "Play, Scout Oracle, Analyze dashboard, Train, Explorer, Auth" },
  { when: "Next", item: "Live multiplayer matchmaking + cloud study sync" },
  { when: "Soon", item: "Stockfish WASM workers + federated events" },
  { when: "Later", item: "Variants & abstract strategy (Go, Xiangqi, Shogi)" },
];

const TESTIMONIALS = [
  {
    name: "Ananya, 1840 rapid",
    quote:
      "I stopped paying Chess.com rent for analysis. Scout + Twin before club Swiss is unfair in the best way.",
  },
  {
    name: "Coach Ravi",
    quote:
      "Students finally see *why* they lose — collapse rate and phase heatmaps beat another random puzzle pack.",
  },
  {
    name: "Marcus, streamer",
    quote:
      "The board feels premium, ⌘K is instant, and the free unlimited promise isn’t marketing fluff.",
  },
];

export default function HomePage() {
  return (
    <div className="space-y-16 sm:space-y-20 page-enter">
      {/* 1. Hero */}
      <section className="relative overflow-hidden rounded-3xl panel glow-ring px-5 py-8 sm:px-10 sm:py-12">
        <div className="pointer-events-none absolute inset-0 opacity-60 brand-mesh" />
        <div className="relative grid lg:grid-cols-[1.15fr_0.95fr] gap-10 items-center">
          <div className="space-y-5 stagger-children">
            <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1 text-xs text-amber-200">
              <Shield size={12} />
              Free chess platform · AI coach · Opponent intelligence
            </div>
            <h1 className="text-3xl sm:text-5xl font-semibold tracking-tight leading-[1.08]">
              Aether is the free chess OS that helps you{" "}
              <span className="text-gradient">beat real opponents</span> — not just grind engines.
            </h1>
            <p className="text-[var(--text-muted)] text-base sm:text-lg max-w-xl leading-relaxed">
              Built for beginners, club players, coaches, and titled grinders. Unlimited analysis
              like Lichess. Modern polish like Chess.com. Scout + Twin Bot prep that neither offers.
              No daily limits on learning.
            </p>
            <ul className="space-y-2 text-sm text-[var(--text-muted)]">
              {[
                "Who: anyone improving at chess (club to titled)",
                "What: play · scout · twin · analyze · train — one product",
                "Why Aether: free tools + pro prep + premium feel",
              ].map((t) => (
                <li key={t} className="flex gap-2 items-start">
                  <Check size={16} className="text-emerald-300 shrink-0 mt-0.5" />
                  {t}
                </li>
              ))}
            </ul>
            <div className="flex flex-wrap gap-3 pt-1">
              <Link href="/play" className="btn btn-primary">
                <Swords size={18} />
                Start playing free
              </Link>
              <Link href="/scout" className="btn btn-secondary">
                <Crosshair size={18} />
                Scout any opponent
              </Link>
            </div>
            <p className="text-[11px] text-[var(--text-dim)]">
              Press <kbd className="px-1.5 py-0.5 rounded border border-white/15">Ctrl</kbd>+
              <kbd className="px-1.5 py-0.5 rounded border border-white/15">K</kbd> anytime to jump
              tools.
            </p>
          </div>
          <HeroDemo />
        </div>
      </section>

      {/* Social proof — bandwagon + authority */}
      <section className="space-y-3">
        <SocialProofTicker />
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 stagger-children">
          {[
            { k: "Analysis", v: "Unlimited free" },
            { k: "Scout", v: "Live Chess.com" },
            { k: "Twin Bot", v: "Style clone" },
            { k: "Paywall on learning", v: "Never" },
          ].map((s) => (
            <div key={s.k} className="panel panel-hover px-4 py-3 text-center">
              <div className="text-[10px] uppercase tracking-wider text-[var(--text-dim)]">{s.k}</div>
              <div className="text-lg font-semibold mt-0.5">{s.v}</div>
            </div>
          ))}
        </div>
        <p className="text-center text-xs text-amber-300/90">
          You already start with XP and a streak on day one — most apps make you earn the first
          dopamine hit. We reverse that (endowed progress).
        </p>
      </section>

      {/* Product overview */}
      <section className="space-y-4">
        <div className="section-title">Product overview</div>
        <h2 className="text-2xl sm:text-3xl font-semibold max-w-2xl">
          One workflow: Play → Review → Scout → Twin → Improve
        </h2>
        <p className="text-[var(--text-muted)] max-w-2xl">
          Most platforms force you to choose between free tools and polished product. Aether is the
          chess operating system for preparation and improvement — designed so a complete beginner
          feels smart in five minutes and a coach still finds depth.
        </p>
        <div className="grid sm:grid-cols-5 gap-2 text-center text-xs sm:text-sm">
          {["Play", "Analyze", "Scout", "Twin Bot", "Train"].map((s, i) => (
            <div key={s} className="panel py-4 panel-hover">
              <div className="text-amber-400 font-mono text-xs mb-1">0{i + 1}</div>
              <div className="font-semibold">{s}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section className="space-y-6">
        <div>
          <div className="section-title">Key features</div>
          <h2 className="text-2xl sm:text-3xl font-semibold mt-1">Problems we actually solve</h2>
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4 stagger-children">
          {FEATURES.map((f) => (
            <div key={f.title} className="panel panel-hover p-5 space-y-3">
              <f.icon size={22} className="text-amber-400" />
              <h3 className="font-semibold text-lg">{f.title}</h3>
              <p className="text-xs text-rose-300/90">
                <span className="font-semibold">Problem:</span> {f.problem}
              </p>
              <p className="text-sm text-[var(--text-muted)] leading-relaxed">
                <span className="text-emerald-300 font-semibold">Aether:</span> {f.solution}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Why different */}
      <section className="panel p-6 sm:p-8 space-y-4">
        <div className="section-title">Why Aether is different</div>
        <h2 className="text-2xl font-semibold">Not another board with a paywall</h2>
        <div className="grid sm:grid-cols-3 gap-4 text-sm text-[var(--text-muted)]">
          <div>
            <div className="text-white font-semibold mb-1">vs Chess.com</div>
            Same polish ambition — without charging rent for puzzles and game review.
          </div>
          <div>
            <div className="text-white font-semibold mb-1">vs Lichess</div>
            Same free unlimited tools — with modern UX, Scout, Twin Bot, and coach narrative.
          </div>
          <div>
            <div className="text-white font-semibold mb-1">vs Chess Stalker</div>
            Scout isn’t a side tool — it’s the product loop, deeper forensics, native Twin.
          </div>
        </div>
      </section>

      {/* Comparison table */}
      <section className="space-y-4">
        <div className="section-title">Comparison</div>
        <h2 className="text-2xl font-semibold">Aether vs Chess.com vs Lichess</h2>
        <div className="panel overflow-x-auto">
          <table className="w-full text-sm min-w-[520px]">
            <thead>
              <tr className="text-left text-[var(--text-dim)] border-b border-white/8">
                <th className="p-3 font-medium">Capability</th>
                <th className="p-3 font-medium text-amber-400">Aether</th>
                <th className="p-3 font-medium">Chess.com</th>
                <th className="p-3 font-medium">Lichess</th>
              </tr>
            </thead>
            <tbody>
              {COMPARISON.map((row) => (
                <tr key={row.feature} className="border-b border-white/5">
                  <td className="p-3 text-[var(--text-muted)]">{row.feature}</td>
                  <td className="p-3">{cell(row.aether)}</td>
                  <td className="p-3">{cell(row.chesscom)}</td>
                  <td className="p-3">{cell(row.lichess)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Screenshots / previews */}
      <section className="space-y-4">
        <div className="section-title">Interactive previews</div>
        <h2 className="text-2xl font-semibold">See the product, don’t just read features</h2>
        <div className="grid md:grid-cols-3 gap-4">
          {[
            {
              href: "/scout",
              title: "Scout dashboard",
              body: "Oracle scores, DNA, battle plan",
              cta: "Open Scout",
            },
            {
              href: "/analyze",
              title: "Analysis board",
              body: "Eval graph, accuracy, critical timeline",
              cta: "Open Analyze",
            },
            {
              href: "/play",
              title: "Play + Twin",
              body: "Bots, Chess960, clocks, saved games",
              cta: "Open Play",
            },
          ].map((c) => (
            <Link key={c.href} href={c.href} className="panel panel-hover p-5 block group">
              <div className="h-28 rounded-xl bg-gradient-to-br from-emerald-500/15 to-amber-600/15 border border-white/10 mb-4 flex items-center justify-center text-4xl opacity-80">
                Æ
              </div>
              <h3 className="font-semibold group-hover:text-amber-300 transition-colors">
                {c.title}
              </h3>
              <p className="text-sm text-[var(--text-muted)] mt-1">{c.body}</p>
              <span className="inline-flex items-center gap-1 text-xs text-amber-400 mt-3">
                {c.cta} <ArrowRight size={12} />
              </span>
            </Link>
          ))}
        </div>
      </section>

      {/* Testimonials */}
      <section className="space-y-4">
        <div className="section-title">Testimonials</div>
        <h2 className="text-2xl font-semibold">What players say</h2>
        <div className="grid md:grid-cols-3 gap-4">
          {TESTIMONIALS.map((t) => (
            <blockquote key={t.name} className="panel p-5 space-y-3">
              <p className="text-sm text-[var(--text-muted)] leading-relaxed">“{t.quote}”</p>
              <footer className="text-xs text-amber-300/90 font-medium">{t.name}</footer>
            </blockquote>
          ))}
        </div>
      </section>

      {/* FAQ */}
      <section className="space-y-4 max-w-3xl">
        <div className="section-title">FAQ</div>
        <h2 className="text-2xl font-semibold">Frequently asked questions</h2>
        <div className="space-y-3">
          {FAQS.map((f) => (
            <details key={f.q} className="panel p-4 group">
              <summary className="font-medium cursor-pointer list-none flex justify-between gap-2">
                {f.q}
                <span className="text-[var(--text-dim)] group-open:rotate-45 transition-transform">
                  +
                </span>
              </summary>
              <p className="text-sm text-[var(--text-muted)] mt-3 leading-relaxed">{f.a}</p>
            </details>
          ))}
        </div>
      </section>

      {/* Roadmap */}
      <section className="space-y-4">
        <div className="section-title">Roadmap</div>
        <h2 className="text-2xl font-semibold">Where Aether is going</h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {ROADMAP.map((r) => (
            <div key={r.when} className="panel p-4">
              <div className="text-xs text-amber-400 font-semibold">{r.when}</div>
              <p className="text-sm text-[var(--text-muted)] mt-2">{r.item}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Final CTA */}
      <section className="panel p-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 glow-ring">
        <div>
          <h2 className="text-xl font-semibold">Ready to understand your next opponent?</h2>
          <p className="text-sm text-[var(--text-muted)] mt-1">
            Free forever for the tools that matter. Sign up optional. Scout in seconds.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link href="/signup" className="btn btn-primary">
            Create free account
          </Link>
          <Link href="/play" className="btn btn-secondary">
            Play without signing up
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/8 pt-8 pb-4 grid sm:grid-cols-2 lg:grid-cols-4 gap-6 text-sm">
        <div>
          <div className="flex items-center gap-2 font-semibold mb-2">
            <span className="brand-mark h-7 w-7 rounded-lg grid place-items-center text-xs">Æ</span>
            AETHER
          </div>
          <p className="text-xs text-[var(--text-dim)] leading-relaxed">
            The free-first chess operating system. Play free. Scout deeper.
          </p>
        </div>
        <div>
          <div className="section-title mb-2">Product</div>
          <ul className="space-y-1.5 text-[var(--text-muted)]">
            <li>
              <Link href="/play" className="hover:text-white">
                Play
              </Link>
            </li>
            <li>
              <Link href="/scout" className="hover:text-white">
                Scout
              </Link>
            </li>
            <li>
              <Link href="/analyze" className="hover:text-white">
                Analyze
              </Link>
            </li>
            <li>
              <Link href="/train" className="hover:text-white">
                Train
              </Link>
            </li>
            <li>
              <Link href="/explore" className="hover:text-white">
                Explorer
              </Link>
            </li>
          </ul>
        </div>
        <div>
          <div className="section-title mb-2">Community</div>
          <ul className="space-y-1.5 text-[var(--text-muted)]">
            <li>
              <Link href="/clubs" className="hover:text-white">
                Clubs
              </Link>
            </li>
            <li>
              <Link href="/tournaments" className="hover:text-white">
                Tournaments
              </Link>
            </li>
            <li>
              <Link href="/leaderboard" className="hover:text-white">
                Leaderboard
              </Link>
            </li>
            <li>
              <Link href="/watch" className="hover:text-white">
                Watch
              </Link>
            </li>
          </ul>
        </div>
        <div>
          <div className="section-title mb-2">Account</div>
          <ul className="space-y-1.5 text-[var(--text-muted)]">
            <li>
              <Link href="/signup" className="hover:text-white">
                Sign up
              </Link>
            </li>
            <li>
              <Link href="/login" className="hover:text-white">
                Log in
              </Link>
            </li>
            <li>
              <Link href="/settings" className="hover:text-white">
                Settings
              </Link>
            </li>
            <li>
              <Link href="/studies" className="hover:text-white">
                Studies
              </Link>
            </li>
          </ul>
        </div>
      </footer>
    </div>
  );
}

function cell(v: boolean | string) {
  if (v === true) return <Check size={16} className="text-emerald-300" />;
  if (v === false) return <X size={16} className="text-rose-400/80" />;
  return <span className="text-[var(--text-dim)] text-xs">{v}</span>;
}
