import "server-only";
import { createHash, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { SignJWT, jwtVerify } from "jose";

/**
 * Single-owner admin login. Credentials come from Vercel environment variables:
 *   ADMIN_EMAIL, ADMIN_PASSWORD   (required)
 *   ADMIN_SECRET                  (optional; signs the session cookie)
 * Changing the password logs out every existing session.
 */

export const COOKIE = "tsd_admin";
const MAX_AGE = 60 * 60 * 24 * 7; // 7 days

export const adminConfigured = Boolean(process.env.ADMIN_EMAIL && process.env.ADMIN_PASSWORD);

function secret() {
  const base = process.env.ADMIN_SECRET || `${process.env.ADMIN_EMAIL}:${process.env.ADMIN_PASSWORD}:the-slow-deg`;
  return createHash("sha256").update(base).digest();
}

function sameText(a: string, b: string) {
  const ha = createHash("sha256").update(a).digest();
  const hb = createHash("sha256").update(b).digest();
  return timingSafeEqual(ha, hb);
}

export function checkCredentials(email: string, password: string) {
  if (!adminConfigured) return false;
  const okEmail = sameText(email.trim().toLowerCase(), process.env.ADMIN_EMAIL!.trim().toLowerCase());
  const okPass = sameText(password, process.env.ADMIN_PASSWORD!);
  return okEmail && okPass;
}

export async function startSession() {
  const token = await new SignJWT({ role: "owner" })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${MAX_AGE}s`)
    .sign(secret());
  (await cookies()).set(COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/",
    maxAge: MAX_AGE,
  });
}

export async function endSession() {
  (await cookies()).delete(COOKIE);
}

export async function isAdmin() {
  if (!adminConfigured) return false;
  const token = (await cookies()).get(COOKIE)?.value;
  if (!token) return false;
  try {
    const { payload } = await jwtVerify(token, secret(), { algorithms: ["HS256"] });
    return payload.role === "owner";
  } catch {
    return false;
  }
}

/** Use at the top of every admin API route. */
export async function requireAdmin() {
  if (!(await isAdmin())) {
    return Response.json({ error: "Not logged in" }, { status: 401 });
  }
  return null;
}

export function clientIp(req: Request) {
  return req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || req.headers.get("x-real-ip") || "unknown";
}
