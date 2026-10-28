import { addOns, brand, hourlyMinHours, packages, plateTiers, type Package } from "@/config/business";

export type PricingModel = "package" | "hourly" | "plate";

export type QuoteInput = {
  model: PricingModel;
  guests: number;
  hours: number;
  plateTierId: string;
  addOnIds: string[];
};

export type QuoteLine = { label: string; amount: number };

export type Quote = {
  custom: boolean; // true when the event is too large for a standard quote
  pkg?: Package;
  lines: QuoteLine[];
  subtotal: number;
  gst: number;
  total: number;
  advance: number;
  perGuest: number;
};

export const MAX_STANDARD_GUESTS = packages[packages.length - 1].guests[1];

export function packageForGuests(guests: number): Package | undefined {
  return packages.find((p) => guests >= p.guests[0] && guests <= p.guests[1]) ?? (guests < packages[0].guests[0] ? packages[0] : undefined);
}

export function calculateQuote(input: QuoteInput): Quote {
  const guests = Math.max(1, Math.round(input.guests));
  const hours = Math.max(1, Math.round(input.hours));
  const pkg = packageForGuests(guests);
  const lines: QuoteLine[] = [];

  if (!pkg) {
    return { custom: true, lines: [], subtotal: 0, gst: 0, total: 0, advance: 0, perGuest: 0 };
  }

  if (input.model === "package") {
    lines.push({ label: `${pkg.name} (${pkg.includedHours} hrs included)`, amount: pkg.basePrice });
    const extra = Math.max(0, hours - pkg.includedHours);
    if (extra > 0) lines.push({ label: `${extra} extra hr × ${inr(pkg.extraHourPrice)}`, amount: extra * pkg.extraHourPrice });
  } else if (input.model === "hourly") {
    const billed = Math.max(hourlyMinHours, hours);
    lines.push({ label: `${billed} hrs × ${inr(pkg.hourlyRate)} (${pkg.team})`, amount: billed * pkg.hourlyRate });
  } else {
    const tier = plateTiers.find((t) => t.id === input.plateTierId) ?? plateTiers[0];
    const plates = Math.max(tier.minGuests, guests);
    lines.push({ label: `${tier.name} menu · ${plates} plates × ${inr(tier.pricePerPlate)}`, amount: plates * tier.pricePerPlate });
  }

  for (const id of input.addOnIds) {
    const a = addOns.find((x) => x.id === id);
    if (!a) continue;
    const amount = a.per === "guest" ? a.price * guests : a.price;
    lines.push({ label: a.per === "guest" ? `${a.name} · ${guests} × ${inr(a.price)}` : a.name, amount });
  }

  const subtotal = lines.reduce((s, l) => s + l.amount, 0);
  const gst = Math.round(subtotal * brand.gstRate);
  const total = subtotal + gst;
  return {
    custom: false,
    pkg,
    lines,
    subtotal,
    gst,
    total,
    advance: Math.round((total * brand.advancePercent) / 100),
    perGuest: Math.round(total / guests),
  };
}

const formatter = new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 });
export function inr(n: number) {
  return formatter.format(n);
}
