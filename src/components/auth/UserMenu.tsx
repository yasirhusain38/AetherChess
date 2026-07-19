"use client";

import { useState } from "react";
import Link from "next/link";
import { signOut, useSession } from "next-auth/react";
import { LogIn, LogOut, User, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

export function UserMenu() {
  const { data: session, status } = useSession();
  const [open, setOpen] = useState(false);

  if (status === "loading") {
    return (
      <div className="h-8 w-8 rounded-full bg-white/10 animate-pulse-soft hidden sm:block" />
    );
  }

  if (!session?.user) {
    return (
      <div className="flex items-center gap-1.5">
        <Link href="/login" className="btn btn-ghost !py-2 !px-2.5 !text-xs sm:!text-sm hidden sm:inline-flex">
          <LogIn size={15} />
          Log in
        </Link>
        <Link href="/signup" className="btn btn-secondary !py-2 !px-2.5 !text-xs sm:!text-sm">
          Sign up
        </Link>
      </div>
    );
  }

  const name = session.user.name || session.user.email || "Player";
  const initial = name.charAt(0).toUpperCase();

  return (
    <div className="relative">
      <button
        type="button"
        className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-2 py-1.5 hover:bg-white/10 transition-colors"
        onClick={() => setOpen((v) => !v)}
      >
        {session.user.image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={session.user.image}
            alt=""
            className="h-7 w-7 rounded-lg object-cover"
          />
        ) : (
          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-emerald-400/80 to-amber-500/80 text-[#061018] text-xs font-bold">
            {initial}
          </span>
        )}
        <span className="text-xs font-medium max-w-[7rem] truncate hidden md:block">
          {name}
        </span>
        <ChevronDown size={14} className="text-[var(--text-dim)] hidden sm:block" />
      </button>

      {open && (
        <>
          <button
            type="button"
            className="fixed inset-0 z-40 cursor-default"
            aria-label="Close menu"
            onClick={() => setOpen(false)}
          />
          <div className="absolute right-0 top-full mt-2 z-50 w-56 panel p-2 shadow-xl">
            <div className="px-2 py-2 border-b border-white/5 mb-1">
              <div className="text-sm font-medium truncate">{name}</div>
              <div className="text-[11px] text-[var(--text-dim)] truncate">
                {session.user.email}
              </div>
            </div>
            <Link
              href="/settings"
              className={cn(
                "flex items-center gap-2 rounded-lg px-2 py-2 text-sm text-[var(--text-muted)] hover:bg-white/5 hover:text-white",
              )}
              onClick={() => setOpen(false)}
            >
              <User size={15} />
              Profile & settings
            </Link>
            <button
              type="button"
              className="flex w-full items-center gap-2 rounded-lg px-2 py-2 text-sm text-[var(--danger)] hover:bg-[rgba(255,92,122,0.1)]"
              onClick={() => signOut({ callbackUrl: "/" })}
            >
              <LogOut size={15} />
              Sign out
            </button>
          </div>
        </>
      )}
    </div>
  );
}
