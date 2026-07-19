"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Bell } from "lucide-react";
import { getDailyQuests, loadEngagement, socialProofStats } from "@/lib/engagement";
import { cn } from "@/lib/utils";

export function NotificationBell() {
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<{ title: string; body: string; href: string }[]>([]);

  useEffect(() => {
    const build = () => {
      const e = loadEngagement();
      const quests = getDailyQuests(e);
      const openQ = quests.filter((q) => !q.done);
      const proof = socialProofStats();
      const list: { title: string; body: string; href: string }[] = [];
      if (e.streak >= 2 && e.gamesToday === 0) {
        list.push({
          title: "Streak at risk",
          body: `Your ${e.streak}-day streak ends at midnight if you don’t play.`,
          href: "/play",
        });
      }
      if (openQ[0]) {
        list.push({
          title: "Open loop",
          body: `${openQ[0].title} — unfinished goals stick in memory (and XP).`,
          href: openQ[0].href,
        });
      }
      list.push({
        title: "Others are improving",
        body: `${proof.improvingThisWeek.toLocaleString()} players trained this week. Don’t fall behind.`,
        href: "/train",
      });
      list.push({
        title: "Free edge",
        body: "Scout is free. Walk into your next game prepared.",
        href: "/scout",
      });
      setItems(list);
    };
    build();
    const id = window.setInterval(build, 30000);
    return () => window.clearInterval(id);
  }, [open]);

  const urgent = items.some((i) => i.title.includes("Streak") || i.title.includes("Open"));

  return (
    <div className="relative">
      <button
        type="button"
        className="btn btn-ghost !p-2 relative"
        title="Notifications"
        aria-label="Notifications"
        onClick={() => setOpen((v) => !v)}
      >
        <Bell size={17} />
        {urgent && (
          <span className="absolute top-1.5 right-1.5 h-1.5 w-1.5 rounded-full bg-amber-400 pulse-ring" />
        )}
      </button>
      {open && (
        <>
          <button
            type="button"
            className="fixed inset-0 z-40"
            aria-label="Close"
            onClick={() => setOpen(false)}
          />
          <div className="absolute right-0 top-full mt-2 z-50 w-72 panel p-2 shadow-xl">
            <div className="section-title px-2 py-1">For you</div>
            {items.map((it) => (
              <Link
                key={it.title}
                href={it.href}
                onClick={() => setOpen(false)}
                className={cn(
                  "block rounded-xl px-3 py-2.5 hover:bg-white/5 transition-colors",
                )}
              >
                <div className="text-sm font-medium">{it.title}</div>
                <div className="text-[11px] text-[var(--text-muted)] mt-0.5 leading-snug">
                  {it.body}
                </div>
              </Link>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
