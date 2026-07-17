import { NextResponse } from "next/server";

interface ArchiveGame {
  url?: string;
  pgn?: string;
  time_class?: string;
  end_time?: number;
  eco?: string;
  white?: { username?: string; rating?: number; result?: string };
  black?: { username?: string; rating?: number; result?: string };
}

const UA = "AetherChess/1.0 (scout; contact: local-dev)";

export async function GET(
  req: Request,
  ctx: { params: Promise<{ username: string }> },
) {
  const { username } = await ctx.params;
  const name = username.trim().toLowerCase();
  const { searchParams } = new URL(req.url);
  const max = Math.min(300, Math.max(1, Number(searchParams.get("max") ?? 150)));
  const months = Math.min(12, Math.max(1, Number(searchParams.get("months") ?? 8)));

  if (!name) {
    return NextResponse.json({ error: "Username required" }, { status: 400 });
  }

  try {
    const archivesRes = await fetch(
      `https://api.chess.com/pub/player/${encodeURIComponent(name)}/games/archives`,
      {
        headers: { "User-Agent": UA, Accept: "application/json" },
        cache: "no-store",
      },
    );

    if (!archivesRes.ok) {
      const body = await archivesRes.text().catch(() => "");
      return NextResponse.json(
        {
          error:
            archivesRes.status === 404
              ? "Chess.com user not found"
              : `Chess.com archives error (${archivesRes.status})`,
          detail: body.slice(0, 200),
        },
        { status: archivesRes.status },
      );
    }

    const { archives } = (await archivesRes.json()) as { archives?: string[] };
    if (!archives?.length) {
      return NextResponse.json({
        games: [],
        source: "chesscom",
        username: name,
        message: "No game archives for this user",
      });
    }

    const latest = [...archives].reverse().slice(0, months);
    const batches = await Promise.all(
      latest.map(async (url) => {
        try {
          const r = await fetch(url, {
            headers: { "User-Agent": UA, Accept: "application/json" },
            cache: "no-store",
          });
          if (!r.ok) return [] as ArchiveGame[];
          const data = (await r.json()) as { games?: ArchiveGame[] };
          return data.games ?? [];
        } catch {
          return [] as ArchiveGame[];
        }
      }),
    );

    const games = batches
      .flat()
      .filter((g) => g.pgn || g.url)
      .sort((a, b) => (b.end_time ?? 0) - (a.end_time ?? 0))
      .slice(0, max);

    return NextResponse.json({
      games,
      source: "chesscom",
      username: name,
      archivesUsed: latest.length,
      totalFetched: batches.flat().length,
    });
  } catch (e) {
    return NextResponse.json(
      {
        error: "Failed to fetch Chess.com games",
        detail: e instanceof Error ? e.message : "unknown",
      },
      { status: 502 },
    );
  }
}
