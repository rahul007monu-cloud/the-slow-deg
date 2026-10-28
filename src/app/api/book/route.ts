import { bookingSchema } from "@/lib/booking-schema";
import { createBookingRequest } from "@/lib/bookings";
import { clientIp } from "@/lib/auth";
import { rateLimited } from "@/lib/store";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  if (!body) return Response.json({ error: "Invalid request" }, { status: 400 });
  const parsed = bookingSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json({ error: "Please check the form", issues: parsed.error.issues.map((i) => ({ path: i.path.join("."), message: i.message })) }, { status: 422 });
  }
  const b = parsed.data;
  // Honeypot filled: pretend success so bots learn nothing.
  if (b.website) return Response.json({ ref: `TSD-${b.date.replaceAll("-", "").slice(2)}-0000` });
  if (await rateLimited(`book:${clientIp(req)}`, 10, 3600)) return Response.json({ error: "Too many requests. Please message us on WhatsApp." }, { status: 429 });

  try {
    const r = await createBookingRequest(b, "website");
    if (!r.ok) return Response.json({ error: r.error }, { status: 422 });
    return Response.json({ ref: r.booking.ref, total: r.booking.quote.total, whatsapp: r.whatsappToChef });
  } catch (e) {
    console.error("Booking failed", e instanceof Error ? e.message : e);
    return Response.json({ error: "We couldn't send your request. Please message us on WhatsApp." }, { status: 502 });
  }
}
