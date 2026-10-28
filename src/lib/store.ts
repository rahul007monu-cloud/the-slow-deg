import "server-only";
import { Redis } from "@upstash/redis";
import { promises as fs } from "node:fs";
import path from "node:path";
import { defaultMenu, defaultSettings } from "./defaults";
import { menuSchema, settingsSchema, type Dish, type Settings, type StoredBooking } from "./types";

/**
 * Storage:
 * - On Vercel: Upstash Redis (add it from Vercel → Storage, which sets KV_REST_API_URL/TOKEN).
 * - Locally without Redis: a JSON file in .data/ so everything works in development.
 * - On Vercel without Redis: reads fall back to defaults and writes throw StoreNotConfigured.
 */

export class StoreNotConfigured extends Error {
  constructor() {
    super("Database not connected. In Vercel open Storage → Create → Upstash for Redis, connect it to this project, then redeploy.");
  }
}

const url = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL;
const token = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;
const redis = url && token ? new Redis({ url, token }) : null;
const useFile = !redis && !process.env.VERCEL;

export const storeReady = Boolean(redis) || useFile;

const K = { settings: "tsd:settings", menu: "tsd:menu", bookings: "tsd:bookings", blocked: "tsd:blocked" };

/* ---------- file backend (dev only) ---------- */
const file = path.join(process.cwd(), ".data", "store.json");
type FileData = Record<string, unknown>;
async function readFile(): Promise<FileData> {
  try {
    return JSON.parse(await fs.readFile(file, "utf8"));
  } catch {
    return {};
  }
}
async function writeFile(data: FileData) {
  await fs.mkdir(path.dirname(file), { recursive: true });
  await fs.writeFile(file, JSON.stringify(data, null, 2));
}

async function getJSON<T>(key: string): Promise<T | null> {
  if (redis) return (await redis.get<T>(key)) ?? null;
  if (useFile) return ((await readFile())[key] as T) ?? null;
  return null;
}
async function setJSON(key: string, value: unknown) {
  if (redis) return void (await redis.set(key, value));
  if (useFile) {
    const d = await readFile();
    d[key] = value;
    return writeFile(d);
  }
  throw new StoreNotConfigured();
}

/* ---------- settings & menu ---------- */
export async function getSettings(): Promise<Settings> {
  const saved = await getJSON<Partial<Settings>>(K.settings).catch(() => null);
  const merged = { ...defaultSettings, ...(saved ?? {}) };
  const parsed = settingsSchema.safeParse(merged);
  return parsed.success ? parsed.data : defaultSettings;
}
export async function saveSettings(s: Settings) {
  await setJSON(K.settings, settingsSchema.parse(s));
}

export async function getMenu(): Promise<Dish[]> {
  const saved = await getJSON<Dish[]>(K.menu).catch(() => null);
  const parsed = menuSchema.safeParse(saved);
  return parsed.success && saved ? parsed.data : defaultMenu;
}
export async function saveMenu(menu: Dish[]) {
  await setJSON(K.menu, menuSchema.parse(menu));
}

/* ---------- bookings ---------- */
export async function listBookings(): Promise<StoredBooking[]> {
  let all: StoredBooking[] = [];
  if (redis) {
    const h = await redis.hgetall<Record<string, StoredBooking>>(K.bookings);
    all = h ? Object.values(h) : [];
  } else if (useFile) {
    all = Object.values(((await readFile())[K.bookings] as Record<string, StoredBooking>) ?? {});
  }
  return all.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}
export async function getBooking(ref: string) {
  if (redis) return (await redis.hget<StoredBooking>(K.bookings, ref)) ?? null;
  if (useFile) return (((await readFile())[K.bookings] as Record<string, StoredBooking>) ?? {})[ref] ?? null;
  return null;
}
export async function saveBooking(b: StoredBooking) {
  if (redis) return void (await redis.hset(K.bookings, { [b.ref]: b }));
  if (useFile) {
    const d = await readFile();
    d[K.bookings] = { ...((d[K.bookings] as object) ?? {}), [b.ref]: b };
    return writeFile(d);
  }
  throw new StoreNotConfigured();
}
export async function deleteBooking(ref: string) {
  if (redis) return void (await redis.hdel(K.bookings, ref));
  if (useFile) {
    const d = await readFile();
    const all = { ...((d[K.bookings] as Record<string, StoredBooking>) ?? {}) };
    delete all[ref];
    d[K.bookings] = all;
    return writeFile(d);
  }
  throw new StoreNotConfigured();
}

/* ---------- blocked dates ---------- */
export async function getBlockedDates(): Promise<string[]> {
  return ((await getJSON<string[]>(K.blocked).catch(() => null)) ?? []).sort();
}
export async function saveBlockedDates(dates: string[]) {
  await setJSON(K.blocked, [...new Set(dates)].filter((d) => /^\d{4}-\d{2}-\d{2}$/.test(d)).sort());
}

/* ---------- availability ---------- */
export async function dateStatus(date: string, settings?: Settings): Promise<{ available: boolean; reason?: string }> {
  const s = settings ?? (await getSettings());
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return { available: false, reason: "Invalid date" };
  if (date < earliestDate(s.minNoticeDays)) return { available: false, reason: `Bookings need at least ${s.minNoticeDays} days notice` };
  if ((await getBlockedDates()).includes(date)) return { available: false, reason: "The chef is not available on this date" };
  if (s.oneEventPerDay) {
    const taken = (await listBookings()).some((b) => b.date === date && b.status === "confirmed");
    if (taken) return { available: false, reason: "This date is already booked" };
  }
  return { available: true };
}

/** Today + notice days, in India time (the business runs on IST). */
export function earliestDate(noticeDays: number) {
  const now = new Date(Date.now() + 5.5 * 3600_000);
  now.setUTCDate(now.getUTCDate() + noticeDays);
  return now.toISOString().slice(0, 10);
}

/* ---------- rate limiting ---------- */
const memoryHits = new Map<string, { n: number; exp: number }>();
/** Returns true when the caller is over the limit. */
export async function rateLimited(key: string, limit: number, windowSec: number): Promise<boolean> {
  const k = `tsd:rl:${key}`;
  if (redis) {
    const n = await redis.incr(k);
    if (n === 1) await redis.expire(k, windowSec);
    return n > limit;
  }
  const now = Date.now();
  const hit = memoryHits.get(k);
  if (!hit || hit.exp < now) {
    memoryHits.set(k, { n: 1, exp: now + windowSec * 1000 });
    return false;
  }
  hit.n++;
  return hit.n > limit;
}
export async function clearRateLimit(key: string) {
  const k = `tsd:rl:${key}`;
  if (redis) await redis.del(k);
  memoryHits.delete(k);
}
