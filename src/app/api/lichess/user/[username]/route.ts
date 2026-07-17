import { NextResponse } from "next/server";

export async function GET(
  _req: Request,
  ctx: { params: Promise<{ username: string }> },
) {
  const { username } = await ctx.params;
  const name = encodeURIComponent(username.trim());
  if (!name) {
    return NextResponse.json({ error: "Username required" }, { status: 400 });
  }

  try {
    const res = await fetch(`https://lichess.org/api/user/${name}`, {
      headers: { Accept: "application/json" },
      next: { revalidate: 120 },
    });
    if (!res.ok) {
      return NextResponse.json(
        { error: res.status === 404 ? "User not found" : "Lichess error" },
        { status: res.status },
      );
    }
    const data = await res.json();
    return NextResponse.json(data);
  } catch {
    return NextResponse.json({ error: "Failed to reach Lichess" }, { status: 502 });
  }
}
