import type { Settings } from "./types";

export type Quote = {
  guests: number;
  billedGuests: number; // never below the minimum
  pricePerPerson: number;
  subtotal: number;
  gst: number;
  total: number;
  advance: number;
};

type PriceSettings = Pick<Settings, "pricePerPerson" | "minGuests" | "gstPercent" | "advancePercent">;

export function calculateQuote(guests: number, s: PriceSettings): Quote {
  const g = Math.max(0, Math.round(guests || 0));
  const billedGuests = Math.max(g, s.minGuests);
  const subtotal = billedGuests * s.pricePerPerson;
  const gst = Math.round((subtotal * s.gstPercent) / 100);
  const total = subtotal + gst;
  return { guests: g, billedGuests, pricePerPerson: s.pricePerPerson, subtotal, gst, total, advance: Math.round((total * s.advancePercent) / 100) };
}

const formatter = new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 });
export function inr(n: number) {
  return formatter.format(n);
}
