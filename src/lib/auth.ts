import { cookies } from "next/headers";
import { createHash } from "crypto";

const COOKIE_NAME = "admin_session";

function hashPassword(password: string): string {
  return createHash("sha256").update(password).digest("hex");
}

export function verifyPassword(password: string): boolean {
  const expected = process.env.ADMIN_PASSWORD;
  if (!expected) return false;
  return password === expected;
}

export async function setSessionCookie(): Promise<void> {
  const store = await cookies();
  const token = hashPassword(process.env.ADMIN_PASSWORD + Date.now());
  store.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24, // 24 hours
  });
}

export async function isAuthenticated(): Promise<boolean> {
  const store = await cookies();
  const session = store.get(COOKIE_NAME);
  return !!session?.value;
}
