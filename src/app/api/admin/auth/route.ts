import { NextResponse } from "next/server";
import { verifyPassword, setSessionCookie } from "@/lib/auth";

const attempts = new Map<string, { count: number; resetAt: number }>();
const MAX_ATTEMPTS = 5;
const WINDOW_MS = 15 * 60 * 1000; // 15 minutes

function getClientIp(request: Request): string {
  return request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
}

export async function POST(request: Request) {
  const ip = getClientIp(request);
  const now = Date.now();
  const record = attempts.get(ip);

  if (record && now < record.resetAt && record.count >= MAX_ATTEMPTS) {
    return NextResponse.json(
      { error: "Too many attempts. Try again later." },
      { status: 429 }
    );
  }

  const body = await request.json();
  const { password } = body;

  if (!password || !verifyPassword(password)) {
    const entry = record && now < record.resetAt
      ? { count: record.count + 1, resetAt: record.resetAt }
      : { count: 1, resetAt: now + WINDOW_MS };
    attempts.set(ip, entry);
    return NextResponse.json({ error: "Invalid password" }, { status: 401 });
  }

  attempts.delete(ip);
  await setSessionCookie();
  return NextResponse.json({ ok: true });
}
