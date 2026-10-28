import { convertToModelMessages, isStepCount, streamText, type UIMessage } from "ai";
import { z } from "zod";
import { brand } from "@/config/business";
import { clientIp } from "@/lib/auth";
import { bookingSchema } from "@/lib/booking-schema";
import { createBookingRequest, prettyDate, waLink } from "@/lib/bookings";
import { calculateQuote, inr } from "@/lib/pricing";
import { dateStatus, earliestDate, getMenu, getSettings, rateLimited } from "@/lib/store";

export const runtime = "nodejs";
export const maxDuration = 30;

// Any AI Gateway model id works here, e.g. "openai/gpt-5.4-mini". Override with AI_MODEL.
const MODEL = process.env.AI_MODEL || "google/gemini-3.5-flash";

export async function POST(req: Request) {
  if (!process.env.VERCEL && !process.env.AI_GATEWAY_API_KEY) {
    return Response.json({ error: "AI is not configured locally. Set AI_GATEWAY_API_KEY in .env.local." }, { status: 503 });
  }
  if (await rateLimited(`chat:${clientIp(req)}`, 40, 3600)) {
    return Response.json({ error: "Too many messages. Please message the chef on WhatsApp." }, { status: 429 });
  }

  const body = (await req.json().catch(() => null)) as { messages?: UIMessage[] } | null;
  if (!body?.messages || !Array.isArray(body.messages)) return Response.json({ error: "Invalid request" }, { status: 400 });
  const messages = body.messages.slice(-20);
  if (JSON.stringify(messages).length > 40_000) return Response.json({ error: "Conversation too long. Please start a new chat." }, { status: 413 });

  const [settings, menu] = await Promise.all([getSettings(), getMenu()]);
  const dishes = menu.filter((d) => d.visible);
  const today = earliestDate(0);

  const instructions = `You are the booking assistant for ${brand.name}, a private non-veg chef (${brand.chefName}) who cooks live at corporate events and private parties.
Today is ${prettyDate(today)} (${today}), India time.

Facts (always use tools for prices and dates, never guess):
- Price: ${inr(settings.pricePerPerson)} per guest${settings.gstPercent ? ` + ${settings.gstPercent}% GST` : ""}, minimum ${settings.minGuests} guests, maximum ${settings.maxGuests} for online booking. This is the chef's charge for the full evening.
- ${settings.priceNote}
- The chef arrives about 2 hours before guests to light the coals, and stays until the last plate. No hourly limit.
- Bookings need ${settings.minNoticeDays} days notice. A ${settings.advancePercent}% advance confirms the date after the chef approves.
- Cities: ${brand.cities.join(", ")}. Other cities: ask the chef on WhatsApp.
- Venue needs a ventilated covered area of about 10x10 ft and water access.
- Menu: ${dishes.map((d) => `${d.name} (${d.tag})`).join("; ")}.

How to behave:
- Reply in the user's language and script (Hindi, Hinglish or English). Keep replies short and warm, 1-4 sentences, no markdown tables.
- To book: collect date, start time, number of guests, occasion, city, name and phone (company, email, venue, dishes and notes are optional). Check the date with checkDate first.
- Before calling createBookingRequest, read the details back in one short summary with the estimated total and ask the user to confirm. Only call it after a clear yes.
- A booking is a request. Tell the user the chef will review and confirm it, usually within 24 hours.
- When the user wants to message the chef, or after a booking, use whatsappChef so they get a one-tap WhatsApp button.
- If you do not know something, offer the WhatsApp button instead of inventing an answer.
- Only discuss topics related to ${brand.name}, its food and bookings.`;

  const result = streamText({
    model: MODEL,
    instructions,
    messages: await convertToModelMessages(messages),
    maxOutputTokens: 600,
    stopWhen: isStepCount(5),
    tools: {
      checkDate: {
        description: "Check whether the chef is free on a date (YYYY-MM-DD).",
        inputSchema: z.object({ date: z.string().describe("YYYY-MM-DD") }),
        execute: async ({ date }: { date: string }) => ({ date, pretty: /^\d{4}-\d{2}-\d{2}$/.test(date) ? prettyDate(date) : date, ...(await dateStatus(date, settings)) }),
      },
      getQuote: {
        description: "Calculate the price for a number of guests.",
        inputSchema: z.object({ guests: z.number().int().min(1).max(10000) }),
        execute: async ({ guests }: { guests: number }) => {
          const q = calculateQuote(guests, settings);
          return { ...q, totalText: inr(q.total), advanceText: inr(q.advance), note: q.billedGuests > guests ? `Minimum ${settings.minGuests} guests is charged` : undefined };
        },
      },
      createBookingRequest: {
        description: "Create a booking request after the user has confirmed the summary. The chef approves it later.",
        inputSchema: bookingSchema.pick({ date: true, startTime: true, guests: true, occasion: true, city: true, venue: true, dishIds: true, notes: true, name: true, company: true, email: true, phone: true }).extend({
          dishIds: z.array(z.string()).optional().default([]).describe(`Optional dish ids: ${dishes.map((d) => d.id).join(", ")}`),
        }),
        execute: async (input: z.input<typeof bookingSchema>) => {
          const parsed = bookingSchema.safeParse(input);
          if (!parsed.success) return { ok: false, error: parsed.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join("; ") };
          const r = await createBookingRequest(parsed.data, "ai");
          if (!r.ok) return { ok: false, error: r.error };
          return { ok: true, ref: r.booking.ref, date: prettyDate(r.booking.date), guests: r.booking.guests, total: inr(r.booking.quote.total), whatsapp: r.whatsappToChef };
        },
      },
      whatsappChef: {
        description: "Give the user a one-tap button that opens WhatsApp to the chef with a prepared message.",
        inputSchema: z.object({ message: z.string().max(800).describe("The message the user will send to the chef") }),
        execute: async ({ message }: { message: string }) => ({ url: waLink(settings.whatsappNumber, message), message }),
      },
    },
    onError: ({ error }) => console.error("Chat error", error instanceof Error ? error.message : error),
  });

  return result.toUIMessageStreamResponse();
}
