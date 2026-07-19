"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Users, Plus, MessageSquare } from "lucide-react";
import { cn } from "@/lib/utils";

interface Club {
  id: string;
  name: string;
  tag: string;
  members: number;
  description: string;
  joined?: boolean;
  activity: string;
}

const SEED: Club[] = [
  {
    id: "aether-open",
    name: "Aether Open",
    tag: "ÆOPN",
    members: 12840,
    description: "Global free-for-all. Daily arenas, beginner-friendly mentorship threads.",
    activity: "12 live now",
  },
  {
    id: "twin-hunters",
    name: "Twin Hunters",
    tag: "TWIN",
    members: 4201,
    description: "Scout → Twin → conquer. Prep culture for tournament grinders.",
    activity: "Gauntlet night Fri",
  },
  {
    id: "endgame-lab",
    name: "Endgame Laboratory",
    tag: "ENDG",
    members: 3102,
    description: "Tablebase trainers, rook endings, weekly study drops.",
    activity: "3 new studies",
  },
  {
    id: "desi-knights",
    name: "Desi Knights",
    tag: "DESI",
    members: 8900,
    description: "Hindi/English community, IST events, school clubs welcome.",
    activity: "Swiss in 2h",
  },
];

const KEY = "aether.clubs.joined.v1";

function readJoined(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as string[]) : [];
  } catch {
    return [];
  }
}

export default function ClubsPage() {
  const [joinedIds, setJoinedIds] = useState<string[]>(() => readJoined());
  const [active, setActive] = useState<string>(() => readJoined()[0] ?? SEED[0].id);

  const clubs = useMemo(
    () =>
      SEED.map((c) => ({
        ...c,
        joined: joinedIds.includes(c.id),
        members: c.members + (joinedIds.includes(c.id) ? 1 : 0),
      })),
    [joinedIds],
  );

  const toggleJoin = (id: string) => {
    setJoinedIds((prev) => {
      const next = prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id];
      try {
        localStorage.setItem(KEY, JSON.stringify(next));
      } catch {
        /* ignore */
      }
      return next;
    });
  };

  const club = clubs.find((c) => c.id === active) ?? clubs[0];

  return (
    <div className="fade-up space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
        <div>
          <div className="section-title">Social</div>
          <h1 className="text-2xl sm:text-3xl font-semibold mt-1 flex items-center gap-2">
            <Users className="text-amber-400" size={28} />
            Clubs
          </h1>
          <p className="text-sm text-[var(--text-muted)] mt-1">
            Local club shell — join, browse feed mock, launch team events.
          </p>
        </div>
        <button type="button" className="btn btn-secondary" disabled title="Coming soon">
          <Plus size={16} />
          Create club
        </button>
      </div>

      <div className="grid lg:grid-cols-[280px_minmax(0,1fr)] gap-4">
        <div className="panel p-3 space-y-1">
          {clubs.map((c) => (
            <button
              key={c.id}
              type="button"
              onClick={() => setActive(c.id)}
              className={cn(
                "w-full text-left rounded-xl px-3 py-2.5 transition-colors",
                active === c.id ? "bg-white/10" : "hover:bg-white/5",
              )}
            >
              <div className="flex items-center justify-between gap-2">
                <span className="font-medium text-sm">{c.name}</span>
                <span className="text-[10px] font-mono text-[var(--text-dim)]">{c.tag}</span>
              </div>
              <div className="text-[11px] text-[var(--text-dim)]">
                {c.members.toLocaleString()} members
                {c.joined ? " · joined" : ""}
              </div>
            </button>
          ))}
        </div>

        {club && (
          <div className="space-y-4">
            <div className="panel p-5 space-y-3">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h2 className="text-xl font-semibold">{club.name}</h2>
                  <p className="text-sm text-[var(--text-muted)] mt-1">{club.description}</p>
                  <div className="text-xs text-[var(--text-dim)] mt-2">{club.activity}</div>
                </div>
                <button
                  type="button"
                  className={cn("btn", club.joined ? "btn-secondary" : "btn-primary")}
                  onClick={() => toggleJoin(club.id)}
                >
                  {club.joined ? "Leave" : "Join club"}
                </button>
              </div>
              <div className="flex flex-wrap gap-2">
                <Link href="/tournaments" className="btn btn-secondary !py-2 !text-xs">
                  Club gauntlet
                </Link>
                <Link href="/studies" className="btn btn-secondary !py-2 !text-xs">
                  Shared studies
                </Link>
                <Link href="/watch" className="btn btn-secondary !py-2 !text-xs">
                  Watch party
                </Link>
              </div>
            </div>

            <div className="panel p-5 space-y-3">
              <div className="section-title flex items-center gap-2">
                <MessageSquare size={12} /> Club feed
              </div>
              {[
                {
                  u: "CoachMaya",
                  t: "New study dropped: Italian traps for blitz. Pin it before Friday arena.",
                },
                {
                  u: "RookieKing",
                  t: "Just beat Nova’s Twin after Scout prep. Prep Score actually works.",
                },
                {
                  u: club.tag + "_mod",
                  t: "Reminder: be kind in chat. Report cheaters with game links.",
                },
              ].map((p, i) => (
                <div key={i} className="rounded-xl border border-white/8 bg-white/[0.03] p-3">
                  <div className="text-xs text-amber-400 font-medium">{p.u}</div>
                  <p className="text-sm text-[var(--text-muted)] mt-1">{p.t}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
