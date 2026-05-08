import { cookies } from "next/headers";
import { randomBytes, timingSafeEqual } from "crypto";

const COOKIE_NAME = "admin_session";

export function verifyPassword(password: string): boolean {
  const expected = process.env.ADMIN_PASSWORD;
  if (!expected) return false;
  if (password.length !== expected.length) return false;
  return timingSafeEqual(Buffer.from(password), Buffer.from(expected));
}

export async function setSessionCookie(): Promise<void> {
  const store = await cookies();
  const token = randomBytes(32).toString("hex");
  store.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 2, // 2 hours
  });
}

export async function isAuthenticated(): Promise<boolean> {
  const store = await cookies();
  const session = store.get(COOKIE_NAME);
  return !!session?.value;
}
