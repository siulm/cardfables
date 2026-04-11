import { NextResponse } from "next/server";
import { verifyPassword, setSessionCookie } from "@/lib/auth";

export async function POST(request: Request) {
  const body = await request.json();
  const { password } = body;

  if (!password || !verifyPassword(password)) {
    return NextResponse.json({ error: "Invalid password" }, { status: 401 });
  }

  await setSessionCookie();
  return NextResponse.json({ ok: true });
}
