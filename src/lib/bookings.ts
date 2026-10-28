import "server-only";
import { randomBytes } from "node:crypto";
import { brand } from "@/config/business";
import type { Booking } from "./booking-schema";
import { calculateQuote, inr } from "./pricing";
import { dateStatus, getMenu, getSettings, saveBooking, StoreNotConfigured } from "./store";
import type { Settings, StoredBooking } from "./types";

export type CreateResult =
  | { ok: true; booking: StoredBooking; saved: boolean; whatsappToChef: string }
  | { ok: false; error: string };

/** Shared by the booking form and the AI assistant. Always creates a *pending* request. */
export async function createBookingRequest(b: Booking, source: StoredBooking["source"]): Promise<CreateResult> {
  const settings = await getSettings();
  if (b.guests > settings.maxGuests) return { ok: false, error: `For more than ${settings.maxGuests} guests please message the chef on WhatsApp for a custom plan.` };
  const avail = await dateStatus(b.date, settings);
  if (!avail.available) return { ok: false, error: avail.reason ?? "Date not available" };

  const quote = calculateQuote(b.guests, settings);
  const booking: StoredBooking = {
    ref: `TSD-${b.date.replaceAll("-", "").slice(2)}-${randomBytes(2).toString("hex").toUpperCase()}`,
    createdAt: new Date().toISOString(),
    source,
    status: "pending",
    date: b.date,
    startTime: b.startTime,
    guests: b.guests,
    occasion: b.occasion,
    city: b.city,
    venue: b.venue,
    dishIds: b.dishIds,
    notes: b.notes,
    name: b.name,
    company: b.company,
    email: b.email,
    phone: b.phone,
    gstin: b.gstin,
    quote: { pricePerPerson: quote.pricePerPerson, subtotal: quote.subtotal, gst: quote.gst, total: quote.total, advance: quote.advance },
  };

  let saved = true;
  try {
    await saveBooking(booking);
  } catch (e) {
    if (!(e instanceof StoreNotConfigured)) throw e;
    saved = false; // still email/WhatsApp the chef so the lead is not lost
  }
  const summary = await bookingSummary(booking);
  await emailChef(settings, booking, summary).catch((e) => console.error("Booking email failed", booking.ref, e instanceof Error ? e.message : e));
  if (!saved) console.warn("Booking not saved, database missing", booking.ref);

  return { ok: true, booking, saved, whatsappToChef: waLink(settings.whatsappNumber, `New booking request\n${summary}`) };
}

export function waLink(number: string, text: string) {
  return `https://wa.me/${number.replace(/\D/g, "")}?text=${encodeURIComponent(text)}`;
}

export async function bookingSummary(b: StoredBooking) {
  const menu = await getMenu();
  const dishes = b.dishIds.map((id) => menu.find((d) => d.id === id)?.name).filter(Boolean).join(", ") || "Chef's choice";
  return [
    `Ref: ${b.ref}`,
    `${b.occasion} · ${b.guests} guests`,
    `${prettyDate(b.date)} from ${b.startTime}`,
    `${b.city}${b.venue ? `, ${b.venue}` : ""}`,
    `Dishes: ${dishes}`,
    `Estimate: ${inr(b.quote.total)} (${inr(b.quote.pricePerPerson)}/person${b.quote.gst ? " + GST" : ""})`,
    `${b.name}${b.company ? ` · ${b.company}` : ""} · ${b.phone}${b.email ? ` · ${b.email}` : ""}`,
    b.notes ? `Notes: ${b.notes}` : "",
  ]
    .filter(Boolean)
    .join("\n");
}

export function prettyDate(iso: string) {
  return new Date(`${iso}T12:00:00`).toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short", year: "numeric" });
}

async function emailChef(s: Settings, b: StoredBooking, summary: string) {
  const key = process.env.RESEND_API_KEY;
  const from = process.env.BOOKING_EMAIL_FROM;
  const to = s.notifyEmail || process.env.BOOKING_EMAIL_TO;
  if (!key || !from || !to) return;
  const html = `<h2>New booking request · ${esc(b.ref)}</h2><pre style="font:14px/1.6 system-ui">${esc(summary)}</pre><p>Open the admin panel to confirm or decline.</p>`;
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify({ from, to: [to], reply_to: b.email || undefined, subject: `${brand.name}: ${b.ref} · ${b.guests} guests · ${b.date}`, html }),
  });
  if (!res.ok) throw new Error(`Resend responded ${res.status}`);
}

function esc(s: string) {
  return s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);
}
