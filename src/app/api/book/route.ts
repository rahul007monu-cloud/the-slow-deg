import { NextResponse } from "next/server";
import { randomBytes } from "node:crypto";
import { bookingSchema, type Booking } from "@/lib/booking-schema";
import { calculateQuote, inr, type Quote } from "@/lib/pricing";
import { addOns, brand, dishes, plateTiers } from "@/config/business";

export const runtime = "nodejs";

export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const parsed = bookingSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Please check the form", issues: parsed.error.issues.map((i) => ({ path: i.path.join("."), message: i.message })) },
      { status: 422 },
    );
  }
  const booking = parsed.data;

  // Honeypot filled: pretend success so bots learn nothing.
  if (booking.website) return NextResponse.json({ ref: makeRef(booking.date) });

  const earliest = new Date();
  earliest.setHours(0, 0, 0, 0);
  earliest.setDate(earliest.getDate() + brand.minNoticeDays);
  if (new Date(`${booking.date}T00:00:00`) < earliest) {
    return NextResponse.json({ error: `Please book at least ${brand.minNoticeDays} days in advance` }, { status: 422 });
  }

  // Never trust a client-side price: recompute on the server.
  const quote = calculateQuote(booking);
  const ref = makeRef(booking.date);

  try {
    await notify(ref, booking, quote);
  } catch (err) {
    console.error("Booking notification failed", ref, err instanceof Error ? err.message : err);
    return NextResponse.json({ error: "We couldn't send your request. Please message us on WhatsApp." }, { status: 502 });
  }

  return NextResponse.json({ ref, total: quote.total, custom: quote.custom });
}

function makeRef(date: string) {
  return `TSD-${date.replaceAll("-", "").slice(2)}-${randomBytes(2).toString("hex").toUpperCase()}`;
}

async function notify(ref: string, b: Booking, q: Quote) {
  const key = process.env.RESEND_API_KEY;
  const to = process.env.BOOKING_EMAIL_TO;
  const from = process.env.BOOKING_EMAIL_FROM;
  if (!key || !to || !from) {
    // Email not configured yet: log a summary without personal contact details.
    console.info("Booking received (email not configured)", { ref, date: b.date, guests: b.guests, city: b.city, model: b.model, total: q.total });
    return;
  }

  const dishNames = b.dishIds.map((id) => dishes.find((d) => d.id === id)?.name).filter(Boolean).join(", ") || "Chef's choice";
  const addOnNames = b.addOnIds.map((id) => addOns.find((a) => a.id === id)?.name).filter(Boolean).join(", ") || "None";
  const tier = plateTiers.find((t) => t.id === b.plateTierId)?.name ?? "";
  const rows: [string, string][] = [
    ["Reference", ref],
    ["Name", b.name],
    ["Company", b.company],
    ["Email", b.email],
    ["Phone", b.phone],
    ["GSTIN", b.gstin || "-"],
    ["Date", `${b.date} from ${b.startTime}`],
    ["Duration", b.openEnded ? `~${b.hours} hrs, open-ended (until the last plate)` : `${b.hours} hrs`],
    ["Guests", String(b.guests)],
    ["Occasion", b.occasion],
    ["City / venue", `${b.city} ${b.venue}`],
    ["Pricing", b.model === "plate" ? `Per plate (${tier})` : b.model === "hourly" ? "Per hour" : "Package"],
    ["Dishes", dishNames],
    ["Add-ons", addOnNames],
    ["Estimate", q.custom ? "Custom quote needed" : `${inr(q.total)} incl. GST`],
    ["Notes", b.notes || "-"],
  ];
  const html = `<h2>New booking request · ${esc(ref)}</h2><table cellpadding="6">${rows
    .map(([k, v]) => `<tr><td><b>${esc(k)}</b></td><td>${esc(v)}</td></tr>`)
    .join("")}</table>`;

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify({ from, to: [to], reply_to: b.email, subject: `Booking ${ref} · ${b.company} · ${b.date} · ${b.guests} guests`, html }),
  });
  if (!res.ok) throw new Error(`Resend responded ${res.status}`);
}

function esc(s: string) {
  return s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);
}
