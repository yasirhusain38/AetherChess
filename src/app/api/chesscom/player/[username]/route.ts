import { NextResponse } from "next/server";

const UA = "AetherChess/1.0 (scout; contact: local-dev)";

export async function GET(
  _req: Request,
  ctx: { params: Promise<{ username: string }> },
) {
  const { username } = await ctx.params;
  const name = encodeURIComponent(username.trim().toLowerCase());
  if (!name) {
    return NextResponse.json({ error: "Username required" }, { status: 400 });
  }

  try {
    const [profileRes, statsRes] = await Promise.all([
      fetch(`https://api.chess.com/pub/player/${name}`, {
        headers: { "User-Agent": UA, Accept: "application/json" },
        cache: "no-store",
      }),
      fetch(`https://api.chess.com/pub/player/${name}/stats`, {
        headers: { "User-Agent": UA, Accept: "application/json" },
        cache: "no-store",
      }),
    ]);

    if (!profileRes.ok) {
      return NextResponse.json(
        {
          error:
            profileRes.status === 404
              ? "Chess.com user not found. Check spelling."
              : `Chess.com profile error (${profileRes.status})`,
        },
        { status: profileRes.status },
      );
    }

    const profile = await profileRes.json();
    const stats = statsRes.ok ? await statsRes.json() : null;
    return NextResponse.json({
      profile,
      stats,
      source: "chesscom",
      username: profile.username ?? username,
    });
  } catch (e) {
    return NextResponse.json(
      {
        error: "Failed to reach Chess.com",
        detail: e instanceof Error ? e.message : "unknown",
      },
      { status: 502 },
    );
  }
}
