"use client";

import { cn } from "@/lib/utils";

export function Skeleton({ className }: { className?: string }) {
  return <div className={cn("skeleton-shimmer rounded-xl", className)} />;
}

export function SkeletonBoard({ className }: { className?: string }) {
  return (
    <div className={cn("chess-board overflow-hidden", className)}>
      <div className="chess-board-grid">
        {Array.from({ length: 64 }).map((_, i) => {
          const light = Math.floor(i / 8) % 2 === i % 2;
          return (
            <div
              key={i}
              className={cn(
                "animate-pulse",
                light ? "bg-[var(--board-light)]/40" : "bg-[var(--board-dark)]/50",
              )}
            />
          );
        })}
      </div>
    </div>
  );
}

export function SkeletonCard({ lines = 3 }: { lines?: number }) {
  return (
    <div className="panel p-4 space-y-3">
      <Skeleton className="h-4 w-1/3" />
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton key={i} className={cn("h-3", i === lines - 1 ? "w-2/3" : "w-full")} />
      ))}
    </div>
  );
}

export function SkeletonChart({ className }: { className?: string }) {
  return (
    <div className={cn("panel p-4 space-y-3", className)}>
      <Skeleton className="h-4 w-40" />
      <div className="flex items-end gap-1 h-32">
        {Array.from({ length: 16 }).map((_, i) => (
          <div
            key={i}
            className="flex-1 rounded-t skeleton-shimmer"
            style={{ height: `${30 + ((i * 17) % 70)}%` }}
          />
        ))}
      </div>
    </div>
  );
}

export function SkeletonProfile() {
  return (
    <div className="panel p-5 flex gap-4">
      <Skeleton className="h-16 w-16 rounded-2xl shrink-0" />
      <div className="flex-1 space-y-2">
        <Skeleton className="h-5 w-40" />
        <Skeleton className="h-3 w-full" />
        <Skeleton className="h-3 w-2/3" />
      </div>
    </div>
  );
}

export function PageLoading({ variant = "default" }: { variant?: "default" | "board" | "scout" | "analyze" }) {
  if (variant === "board") {
    return (
      <div className="grid lg:grid-cols-[1fr_320px] gap-6 fade-up">
        <SkeletonBoard className="max-w-[560px]" />
        <div className="space-y-3">
          <SkeletonCard />
          <SkeletonCard lines={5} />
        </div>
      </div>
    );
  }
  if (variant === "analyze") {
    return (
      <div className="space-y-4 fade-up">
        <Skeleton className="h-8 w-64" />
        <div className="grid lg:grid-cols-[1fr_360px] gap-6">
          <div className="space-y-3">
            <SkeletonBoard className="max-w-[560px]" />
            <SkeletonChart />
          </div>
          <div className="space-y-3">
            <SkeletonCard lines={4} />
            <SkeletonCard lines={8} />
          </div>
        </div>
      </div>
    );
  }
  if (variant === "scout") {
    return (
      <div className="space-y-4 fade-up">
        <SkeletonProfile />
        <div className="grid sm:grid-cols-4 gap-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-20 rounded-2xl" />
          ))}
        </div>
        <div className="grid lg:grid-cols-2 gap-4">
          <SkeletonChart />
          <SkeletonCard lines={6} />
        </div>
      </div>
    );
  }
  return (
    <div className="space-y-4 fade-up max-w-3xl">
      <Skeleton className="h-8 w-48" />
      <Skeleton className="h-4 w-full" />
      <SkeletonCard lines={5} />
    </div>
  );
}
