"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  BookOpen,
  Compass,
  Crosshair,
  Eye,
  GraduationCap,
  Home,
  Medal,
  Search,
  Settings,
  Sparkles,
  Swords,
  Trophy,
  Users,
  LogIn,
} from "lucide-react";
import { cn } from "@/lib/utils";

const COMMANDS = [
  { href: "/", label: "Home", icon: Home, group: "Navigate", keywords: "landing" },
  { href: "/play", label: "Play chess", icon: Swords, group: "Navigate", keywords: "game bot twin" },
  { href: "/scout", label: "Scout opponent", icon: Crosshair, group: "Navigate", keywords: "stalker prep" },
  { href: "/analyze", label: "Analyze game", icon: Sparkles, group: "Navigate", keywords: "engine review pgn" },
  { href: "/train", label: "Train & puzzles", icon: GraduationCap, group: "Navigate", keywords: "coach storm" },
  { href: "/explore", label: "Opening explorer", icon: Compass, group: "Navigate", keywords: "theory eco" },
  { href: "/studies", label: "Studies", icon: BookOpen, group: "Navigate", keywords: "notebook" },
  { href: "/tournaments", label: "Tournaments", icon: Trophy, group: "Navigate", keywords: "events gauntlet" },
  { href: "/watch", label: "Watch party", icon: Eye, group: "Navigate", keywords: "stream" },
  { href: "/clubs", label: "Clubs", icon: Users, group: "Navigate", keywords: "community" },
  { href: "/leaderboard", label: "Leaderboard", icon: Medal, group: "Navigate", keywords: "rating ladder" },
  { href: "/settings", label: "Settings", icon: Settings, group: "Account", keywords: "preferences theme" },
  { href: "/login", label: "Log in", icon: LogIn, group: "Account", keywords: "sign in auth" },
  { href: "/signup", label: "Sign up", icon: LogIn, group: "Account", keywords: "register free" },
];

const RECENTS_KEY = "aether.recent.pages.v1";
const FAV_KEY = "aether.fav.tools.v1";

function readList(key: string): string[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem(key) || "[]") as string[];
  } catch {
    return [];
  }
}

export function CommandPalette() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const [active, setActive] = useState(0);
  const [recents, setRecents] = useState<string[]>([]);
  const [favs, setFavs] = useState<string[]>([]);

  useEffect(() => {
    setRecents(readList(RECENTS_KEY));
    setFavs(readList(FAV_KEY));
  }, [open]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen((v) => !v);
        setQ("");
        setActive(0);
      }
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return COMMANDS;
    return COMMANDS.filter(
      (c) =>
        c.label.toLowerCase().includes(s) ||
        c.keywords.includes(s) ||
        c.href.includes(s),
    );
  }, [q]);

  const go = useCallback(
    (href: string) => {
      const next = [href, ...readList(RECENTS_KEY).filter((x) => x !== href)].slice(0, 8);
      localStorage.setItem(RECENTS_KEY, JSON.stringify(next));
      setOpen(false);
      router.push(href);
    },
    [router],
  );

  const toggleFav = (href: string) => {
    const cur = readList(FAV_KEY);
    const next = cur.includes(href) ? cur.filter((x) => x !== href) : [...cur, href].slice(0, 10);
    localStorage.setItem(FAV_KEY, JSON.stringify(next));
    setFavs(next);
  };

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setActive((a) => Math.min(filtered.length - 1, a + 1));
      }
      if (e.key === "ArrowUp") {
        e.preventDefault();
        setActive((a) => Math.max(0, a - 1));
      }
      if (e.key === "Enter" && filtered[active]) {
        e.preventDefault();
        go(filtered[active].href);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, filtered, active, go]);

  return (
    <>
      <button
        type="button"
        className="hidden sm:flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-[var(--text-muted)] hover:bg-white/10 hover:text-white transition-colors min-w-[10rem]"
        onClick={() => setOpen(true)}
      >
        <Search size={14} />
        <span className="flex-1 text-left">Search tools…</span>
        <kbd className="rounded-md border border-white/10 px-1.5 py-0.5 text-[10px] text-[var(--text-dim)]">
          ⌘K
        </kbd>
      </button>

      {open && (
        <div className="fixed inset-0 z-[100] flex items-start justify-center pt-[12vh] px-4 cmdk-overlay">
          <button
            type="button"
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            aria-label="Close"
            onClick={() => setOpen(false)}
          />
          <div className="relative z-10 w-full max-w-lg panel cmdk-panel overflow-hidden shadow-2xl">
            <div className="flex items-center gap-2 border-b border-white/8 px-3">
              <Search size={16} className="text-[var(--text-dim)]" />
              <input
                autoFocus
                className="flex-1 bg-transparent py-3.5 text-sm outline-none placeholder:text-[var(--text-dim)]"
                placeholder="Jump to play, scout, analyze…"
                value={q}
                onChange={(e) => {
                  setQ(e.target.value);
                  setActive(0);
                }}
              />
            </div>

            {!q && (favs.length > 0 || recents.length > 0) && (
              <div className="px-3 py-2 border-b border-white/5 space-y-2">
                {favs.length > 0 && (
                  <div>
                    <div className="section-title mb-1">Favorites</div>
                    <div className="flex flex-wrap gap-1.5">
                      {favs.map((h) => {
                        const c = COMMANDS.find((x) => x.href === h);
                        return (
                          <button
                            key={h}
                            type="button"
                            className="chip !py-1"
                            onClick={() => go(h)}
                          >
                            {c?.label ?? h}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
                {recents.length > 0 && (
                  <div>
                    <div className="section-title mb-1">Recent</div>
                    <div className="flex flex-wrap gap-1.5">
                      {recents.map((h) => {
                        const c = COMMANDS.find((x) => x.href === h);
                        return (
                          <button
                            key={h}
                            type="button"
                            className="chip !py-1"
                            onClick={() => go(h)}
                          >
                            {c?.label ?? h}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            )}

            <div className="max-h-72 overflow-y-auto py-1">
              {filtered.map((c, i) => {
                const Icon = c.icon;
                const isFav = favs.includes(c.href);
                return (
                  <div
                    key={c.href}
                    className={cn(
                      "flex items-center gap-2 px-2 mx-1 rounded-lg",
                      i === active && "bg-white/10",
                    )}
                  >
                    <button
                      type="button"
                      className="flex flex-1 items-center gap-3 px-2 py-2.5 text-left text-sm"
                      onClick={() => go(c.href)}
                      onMouseEnter={() => setActive(i)}
                    >
                      <Icon size={16} className="text-amber-400 shrink-0" />
                      <span className="flex-1">{c.label}</span>
                      <span className="text-[10px] text-[var(--text-dim)]">{c.group}</span>
                    </button>
                    <button
                      type="button"
                      className={cn(
                        "text-[10px] px-2 py-1 rounded-md",
                        isFav ? "text-amber-300" : "text-[var(--text-dim)] hover:text-white",
                      )}
                      onClick={() => toggleFav(c.href)}
                      title="Toggle favorite"
                    >
                      {isFav ? "★" : "☆"}
                    </button>
                  </div>
                );
              })}
              {filtered.length === 0 && (
                <p className="px-4 py-6 text-sm text-[var(--text-dim)] text-center">No matches</p>
              )}
            </div>
            <div className="border-t border-white/5 px-3 py-2 text-[10px] text-[var(--text-dim)] flex gap-3">
              <span>↑↓ navigate</span>
              <span>↵ open</span>
              <span>esc close</span>
              <span className="ml-auto">Ctrl/⌘ K</span>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
