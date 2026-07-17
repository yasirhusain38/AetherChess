import { NextResponse } from "next/server";
import { createUser } from "@/lib/auth/users";

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as {
      email?: string;
      password?: string;
      name?: string;
    };

    const user = await createUser({
      email: body.email ?? "",
      password: body.password ?? "",
      name: body.name ?? "",
    });

    return NextResponse.json({ ok: true, user });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Registration failed";
    return NextResponse.json({ ok: false, error: message }, { status: 400 });
  }
}
