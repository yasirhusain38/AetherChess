"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BookOpen,
  Compass,
  Crosshair,
  Eye,
  Gamepad2,
  GraduationCap,
  Home,
  Medal,
  Settings,
  Sparkles,
  Swords,
  Trophy,
  Users,
} from "lucide-react";
import { UserMenu } from "@/components/auth/UserMenu";
import { cn } from "@/lib/utils";

const NAV = [
  { href: "/", label: "Home", icon: Home },
  { href: "/play", label: "Play", icon: Swords },
  { href: "/scout", label: "Scout", icon: Crosshair },
  { href: "/train", label: "Train", icon: GraduationCap },
  { href: "/analyze", label: "Analyze", icon: Sparkles },
  { href: "/tournaments", label: "Events", icon: Trophy },
  { href: "/explore", label: "Explore", icon: Compass },
];

const MORE_LINKS = [
  { href: "/watch", label: "Watch", icon: Eye },
  { href: "/clubs", label: "Clubs", icon: Users },
  { href: "/leaderboard", label: "Ladder", icon: Medal },
  { href: "/studies", label: "Studies", icon: BookOpen },
  { href: "/settings", label: "Settings", icon: Settings },
];

export function Shell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="aether-bg min-h-dvh flex flex-col">
      <header className="sticky top-0 z-40 border-b border-white/5 bg-[#0b0d12]/80 backdrop-blur-xl">
        <div className="mx-auto flex h-14 max-w-7xl items-center justify-between gap-3 px-4">
          <Link href="/" className="flex items-center gap-2.5 shrink-0">
            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-300 to-violet-400 text-[#061018] font-bold text-sm shadow-[0_0_24px_rgba(110,231,255,0.35)]">
              Æ
            </span>
            <div className="leading-tight">
              <div className="text-sm font-semibold tracking-wide">AETHER</div>
              <div className="text-[10px] text-[var(--text-dim)] hidden sm:block">
                Play free · Scout deeper
              </div>
            </div>
          </Link>

          <nav className="hidden xl:flex items-center gap-0.5">
            {NAV.map((item) => {
              const active =
                item.href === "/"
                  ? pathname === "/"
                  : pathname.startsWith(item.href);
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-1.5 rounded-xl px-2.5 py-2 text-sm font-medium transition-colors",
                    active
                      ? "bg-white/10 text-white"
                      : "text-[var(--text-muted)] hover:text-white hover:bg-white/5",
                  )}
                >
                  <Icon size={15} />
                  {item.label}
                </Link>
              );
            })}
          </nav>

          <div className="flex items-center gap-1.5">
            <div className="hidden md:flex items-center gap-0.5">
              {MORE_LINKS.slice(0, 3).map((item) => {
                const active = pathname.startsWith(item.href);
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      "btn btn-ghost !p-2",
                      active && "bg-white/10 text-white",
                    )}
                    title={item.label}
                    aria-label={item.label}
                  >
                    <Icon size={17} />
                  </Link>
                );
              })}
            </div>
            <Link
              href="/settings"
              className={cn(
                "btn btn-ghost !p-2",
                pathname.startsWith("/settings") && "bg-white/10 text-white",
              )}
              aria-label="Settings"
            >
              <Settings size={18} />
            </Link>
            <UserMenu />
            <Link href="/play" className="btn btn-primary !py-2 !px-3 !text-xs sm:!text-sm">
              <Gamepad2 size={16} />
              <span className="hidden sm:inline">Play</span>
            </Link>
          </div>
        </div>
      </header>

      <main className="flex-1 mx-auto w-full max-w-7xl px-4 py-6 pb-24 md:pb-8">
        {children}
      </main>

      <nav className="xl:hidden fixed bottom-0 inset-x-0 z-40 border-t border-white/5 bg-[#0b0d12]/92 backdrop-blur-xl">
        <div className="mx-auto flex max-w-lg items-stretch justify-between px-1 py-1.5 overflow-x-auto">
          {[
            NAV[0],
            NAV[1],
            NAV[2],
            NAV[3],
            NAV[5],
            { href: "/settings", label: "More", icon: Settings },
          ].map((item) => {
            const active =
              item.href === "/"
                ? pathname === "/"
                : pathname.startsWith(item.href);
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex flex-1 flex-col items-center gap-0.5 rounded-xl px-1 py-2 text-[10px] font-medium min-w-[3.2rem]",
                  active ? "text-cyan-300" : "text-[var(--text-dim)]",
                )}
              >
                <Icon size={18} />
                {item.label}
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
