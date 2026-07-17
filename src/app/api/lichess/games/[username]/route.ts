import { NextResponse } from "next/server";

export async function GET(
  req: Request,
  ctx: { params: Promise<{ username: string }> },
) {
  const { username } = await ctx.params;
  const name = encodeURIComponent(username.trim());
  const { searchParams } = new URL(req.url);
  const max = Math.min(100, Math.max(1, Number(searchParams.get("max") ?? 40)));

  if (!name) {
    return NextResponse.json({ error: "Username required" }, { status: 400 });
  }

  try {
    const res = await fetch(
      `https://lichess.org/api/games/user/${name}?max=${max}&pgnInJson=true&clocks=false&evals=false&opening=true`,
      {
        headers: { Accept: "application/x-ndjson" },
        next: { revalidate: 60 },
      },
    );
    if (!res.ok) {
      return NextResponse.json(
        { error: res.status === 404 ? "User not found" : "Lichess games error" },
        { status: res.status },
      );
    }
    const text = await res.text();
    const games = text
      .split("\n")
      .map((l) => l.trim())
      .filter(Boolean)
      .map((l) => JSON.parse(l) as Record<string, unknown>);
    return NextResponse.json({ games, source: "lichess", username });
  } catch {
    return NextResponse.json({ error: "Failed to fetch Lichess games" }, { status: 502 });
  }
}
