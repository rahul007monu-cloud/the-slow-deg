"use client";

import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { bookingPromises, brand } from "@/config/business";
import { bookingSchema } from "@/lib/booking-schema";
import { calculateQuote, inr } from "@/lib/pricing";
import { useSite, useWhatsApp } from "../SiteData";
import { Check, Eyebrow, Reveal, SectionTitle } from "../ui";

const occasions = ["Annual party", "Offsite", "Client dinner", "Diwali / Festive", "Product launch", "Team celebration", "Private party", "Wedding function", "Other"];
const stepNames = ["Event", "Menu", "Your details"];

type Form = {
  date: string;
  startTime: string;
  guests: number;
  occasion: string;
  city: string;
  venue: string;
  dishIds: string[];
  notes: string;
  name: string;
  company: string;
  email: string;
  phone: string;
  gstin: string;
  website: string;
};

function isoDate(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

const stepFields: (keyof Form)[][] = [
  ["date", "startTime", "guests", "occasion", "city", "venue"],
  ["dishIds", "notes"],
  ["name", "company", "email", "phone", "gstin"],
];

export function Booking() {
  const { settings, menu } = useSite();
  const wa = useWhatsApp();
  const dishes = menu.filter((d) => d.visible);
  const [f, setF] = useState<Form>({
    date: "",
    startTime: "18:00",
    guests: Math.max(settings.minGuests, 50),
    occasion: occasions[0],
    city: brand.cities[0],
    venue: "",
    dishIds: [],
    notes: "",
    name: "",
    company: "",
    email: "",
    phone: "",
    gstin: "",
    website: "",
  });
  const [step, setStep] = useState(0);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [status, setStatus] = useState<"idle" | "sending">("idle");
  const [serverError, setServerError] = useState("");
  const [done, setDone] = useState<{ ref: string; whatsapp?: string } | null>(null);
  const [avail, setAvail] = useState<{ date: string; available: boolean; reason?: string } | null>(null);

  const minDate = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() + settings.minNoticeDays);
    return isoDate(d);
  }, [settings.minNoticeDays]);

  useEffect(() => {
    const on = (e: Event) => {
      const d = (e as CustomEvent).detail as Partial<Form>;
      setF((prev) => ({ ...prev, ...d }));
      setStep(0);
    };
    window.addEventListener("prefill-booking", on);
    return () => window.removeEventListener("prefill-booking", on);
  }, []);

  // live availability check as soon as a date is picked
  useEffect(() => {
    if (!f.date) return setAvail(null);
    const ctrl = new AbortController();
    fetch(`/api/availability?date=${f.date}`, { signal: ctrl.signal })
      .then((r) => r.json())
      .then((r) => setAvail({ date: f.date, ...r }))
      .catch(() => {});
    return () => ctrl.abort();
  }, [f.date]);

  const set = <K extends keyof Form>(k: K, v: Form[K]) => {
    setF((p) => ({ ...p, [k]: v }));
    setErrors((e) => ({ ...e, [k]: "" }));
  };
  const toggleDish = (id: string) => set("dishIds", f.dishIds.includes(id) ? f.dishIds.filter((x) => x !== id) : [...f.dishIds, id]);

  const quote = calculateQuote(f.guests, settings);
  const tooMany = f.guests > settings.maxGuests;

  function validate(upTo: number) {
    const res = bookingSchema.safeParse(f);
    const errs: Record<string, string> = {};
    if (!res.success) {
      const fields = stepFields.slice(0, upTo + 1).flat() as string[];
      for (const i of res.error.issues) {
        const k = String(i.path[0]);
        if (fields.includes(k) && !errs[k]) errs[k] = i.message;
      }
    }
    if (upTo >= 0) {
      if (f.date && f.date < minDate) errs.date = `Please book at least ${settings.minNoticeDays} days ahead`;
      else if (avail && avail.date === f.date && !avail.available) errs.date = avail.reason ?? "Date not available";
      if (tooMany) errs.guests = `For more than ${settings.maxGuests} guests please WhatsApp the chef`;
    }
    if (upTo >= 2 && !f.email) errs.email = errs.email || "Enter your email so we can send the confirmation";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  async function submit() {
    if (!validate(2)) return;
    setStatus("sending");
    setServerError("");
    try {
      const res = await fetch("/api/book", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(f) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Something went wrong");
      setDone({ ref: data.ref, whatsapp: data.whatsapp });
    } catch (e) {
      setServerError(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setStatus("idle");
    }
  }

  const askText = `Hi ${brand.name}! I'm planning ${f.occasion.toLowerCase()} for ${f.guests} guests${f.date ? ` on ${f.date}` : ""} in ${f.city}. Can you help?`;

  return (
    <section id="book" className="relative overflow-hidden border-y border-cream/10 bg-soot py-28">
      <div className="pointer-events-none absolute -top-40 left-1/2 h-96 w-[60rem] -translate-x-1/2 rounded-full bg-ember/10 blur-3xl" />
      <div className="relative mx-auto max-w-7xl px-5 sm:px-8">
        <Reveal className="text-center">
          <Eyebrow>Book the Chef</Eyebrow>
          <SectionTitle>
            Reserve your evening <span className="italic text-gradient-ember">in 2 minutes.</span>
          </SectionTitle>
          <p className="mx-auto mt-4 max-w-xl text-cream/60">
            Send a request with your date. The chef reviews it and calls you, usually within 24 hours. A {settings.advancePercent}% advance locks the date.
          </p>
        </Reveal>

        {done ? (
          <Success refId={done.ref} f={f} total={quote.total} whatsapp={done.whatsapp ?? wa(askText)} />
        ) : (
          <div className="mt-14 grid gap-8 lg:grid-cols-[1.5fr_1fr]">
            <div className="rounded-[2rem] glass p-6 sm:p-10">
              <ol className="mb-10 flex gap-2">
                {stepNames.map((n, i) => (
                  <li key={n} className="flex-1">
                    <button onClick={() => (i <= step || validate(i - 1) ? setStep(i) : null)} className="w-full text-left">
                      <div className={`h-1 rounded-full transition-colors ${i <= step ? "bg-gradient-to-r from-saffron to-ember" : "bg-cream/10"}`} />
                      <div className={`mt-2 hidden text-xs tracking-wider uppercase sm:block ${i === step ? "text-saffron" : "text-cream/40"}`}>
                        {i + 1}. {n}
                      </div>
                    </button>
                  </li>
                ))}
              </ol>

              <AnimatePresence mode="wait">
                <motion.div key={step} initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }} transition={{ duration: 0.3 }}>
                  {step === 0 && (
                    <div className="grid gap-6 sm:grid-cols-2">
                      <Field label="Event date" error={errors.date} hint={avail && avail.date === f.date ? (avail.available ? "Good news: the chef is free on this date" : undefined) : undefined}>
                        <input type="date" min={minDate} value={f.date} onChange={(e) => set("date", e.target.value)} className={input} />
                        {avail && avail.date === f.date && !avail.available && !errors.date && <p className="mt-1.5 text-xs text-ember">{avail.reason}</p>}
                      </Field>
                      <Field label="Chef starts at" error={errors.startTime} hint="He arrives about 2 hours earlier to light the coals">
                        <input type="time" value={f.startTime} onChange={(e) => set("startTime", e.target.value)} className={input} />
                      </Field>
                      <Field label="Number of guests" error={errors.guests} className="sm:col-span-2">
                        <div className="flex items-center gap-4">
                          <input type="range" min={settings.minGuests} max={Math.max(settings.maxGuests, settings.minGuests + 10)} step={5} value={Math.min(Math.max(f.guests, settings.minGuests), settings.maxGuests)} onChange={(e) => set("guests", Number(e.target.value))} className="flex-1" />
                          <input type="number" inputMode="numeric" min={1} max={10000} value={f.guests || ""} onChange={(e) => set("guests", Math.max(0, Math.min(10000, Number(e.target.value))))} className={`${input} w-28 text-center font-display text-2xl`} aria-label="Number of guests" />
                        </div>
                      </Field>
                      <Field label="Occasion" className="sm:col-span-2">
                        <div className="flex flex-wrap gap-2">
                          {occasions.map((o) => (
                            <Chip key={o} active={f.occasion === o} onClick={() => set("occasion", o)}>
                              {o}
                            </Chip>
                          ))}
                        </div>
                      </Field>
                      <Field label="City" error={errors.city}>
                        <input list="cities" value={f.city} onChange={(e) => set("city", e.target.value)} className={input} />
                        <datalist id="cities">
                          {brand.cities.map((c) => (
                            <option key={c} value={c} />
                          ))}
                        </datalist>
                      </Field>
                      <Field label="Venue (optional)">
                        <input value={f.venue} onChange={(e) => set("venue", e.target.value)} placeholder="Office terrace, farmhouse, home…" className={input} />
                      </Field>
                    </div>
                  )}

                  {step === 1 && (
                    <div className="space-y-8">
                      <Field label="Dishes you’d love (optional, finalised on the call)">
                        <div className="grid gap-3 sm:grid-cols-2">
                          {dishes.map((d) => {
                            const on = f.dishIds.includes(d.id);
                            return (
                              <button key={d.id} type="button" onClick={() => toggleDish(d.id)} aria-pressed={on} className={`flex items-center gap-3 rounded-2xl border p-2 pr-4 text-left transition ${on ? "border-saffron bg-saffron/10" : "border-cream/10 hover:border-cream/30"}`}>
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img src={d.photo} alt="" loading="lazy" className="h-12 w-12 rounded-xl object-cover" />
                                <span className="flex-1 text-sm text-cream">{d.name}</span>
                                {on && <Check />}
                              </button>
                            );
                          })}
                        </div>
                      </Field>
                      <Field label="Anything else? (optional)">
                        <textarea value={f.notes} onChange={(e) => set("notes", e.target.value)} rows={3} placeholder="Veg guests, allergies, halal, venue access, theme…" className={input} />
                      </Field>
                    </div>
                  )}

                  {step === 2 && (
                    <div className="grid gap-6 sm:grid-cols-2">
                      <Field label="Your name" error={errors.name}>
                        <input value={f.name} onChange={(e) => set("name", e.target.value)} autoComplete="name" className={input} />
                      </Field>
                      <Field label="Company (optional)" error={errors.company}>
                        <input value={f.company} onChange={(e) => set("company", e.target.value)} autoComplete="organization" className={input} />
                      </Field>
                      <Field label="Email" error={errors.email}>
                        <input type="email" value={f.email} onChange={(e) => set("email", e.target.value)} autoComplete="email" className={input} />
                      </Field>
                      <Field label="Phone / WhatsApp" error={errors.phone}>
                        <input type="tel" value={f.phone} onChange={(e) => set("phone", e.target.value)} autoComplete="tel" placeholder="+91" className={input} />
                      </Field>
                      <Field label="GSTIN (for invoice, optional)" error={errors.gstin} className="sm:col-span-2">
                        <input value={f.gstin} onChange={(e) => set("gstin", e.target.value.toUpperCase())} maxLength={15} className={input} />
                      </Field>
                      <input tabIndex={-1} autoComplete="off" aria-hidden value={f.website} onChange={(e) => set("website", e.target.value)} className="absolute -left-[9999px] h-0 w-0 opacity-0" name="website" />
                    </div>
                  )}
                </motion.div>
              </AnimatePresence>

              {serverError && <p className="mt-6 rounded-xl border border-chili/50 bg-chili/10 p-3 text-sm text-cream">{serverError}</p>}

              <div className="mt-10 flex items-center justify-between">
                <button onClick={() => setStep((s) => Math.max(0, s - 1))} className={`text-sm text-cream/60 transition hover:text-cream ${step === 0 ? "invisible" : ""}`}>
                  Back
                </button>
                {step < 2 ? (
                  <button onClick={() => validate(step) && setStep(step + 1)} className="rounded-full bg-gradient-to-r from-saffron to-ember px-8 py-3.5 font-semibold text-coal transition hover:scale-105">
                    Continue
                  </button>
                ) : (
                  <button onClick={submit} disabled={status === "sending"} className="rounded-full bg-gradient-to-r from-saffron to-ember px-8 py-3.5 font-semibold text-coal transition hover:scale-105 disabled:opacity-60">
                    {status === "sending" ? "Sealing the deg…" : "Send booking request"}
                  </button>
                )}
              </div>
            </div>

            <aside className="lg:sticky lg:top-28 lg:self-start">
              <div className="rounded-[2rem] border border-saffron/25 bg-gradient-to-b from-ash to-coal p-8">
                <div className="text-xs tracking-[0.3em] text-saffron uppercase">Your live quote</div>
                <motion.div key={quote.total} initial={{ opacity: 0.4, y: -6 }} animate={{ opacity: 1, y: 0 }} className="mt-3 font-display text-5xl font-semibold text-cream">
                  {inr(quote.total)}
                </motion.div>
                <div className="text-sm text-cream/50">
                  {inr(settings.pricePerPerson)} per guest{settings.gstPercent ? " + GST" : ""} · full evening
                </div>
                <ul className="mt-6 space-y-2 border-t border-cream/10 pt-5 text-sm">
                  <li className="flex justify-between gap-4 text-cream/70">
                    <span>
                      {quote.billedGuests} guests × {inr(quote.pricePerPerson)}
                    </span>
                    <span>{inr(quote.subtotal)}</span>
                  </li>
                  {quote.billedGuests > quote.guests && <li className="text-xs text-ember">Minimum {settings.minGuests} guests is charged</li>}
                  {settings.gstPercent > 0 && (
                    <li className="flex justify-between gap-4 text-cream/50">
                      <span>GST ({settings.gstPercent}%)</span>
                      <span>{inr(quote.gst)}</span>
                    </li>
                  )}
                </ul>
                <div className="mt-5 flex justify-between rounded-2xl bg-saffron/10 p-4 text-sm">
                  <span className="text-cream/80">Advance after confirmation ({settings.advancePercent}%)</span>
                  <span className="font-semibold text-saffron">{inr(quote.advance)}</span>
                </div>
                <p className="mt-4 text-xs text-cream/45">{settings.priceNote}</p>
                <a href={wa(askText)} target="_blank" rel="noopener" className="mt-6 flex items-center justify-center gap-2 rounded-full border border-cream/15 py-3 text-sm text-cream/80 transition hover:border-[#25D366] hover:text-[#25D366]">
                  Questions? Ask on WhatsApp
                </a>
              </div>
              <ul className="mt-5 grid grid-cols-2 gap-3 text-xs text-cream/50">
                {bookingPromises.map((p) => (
                  <li key={p} className="flex items-center gap-2 rounded-xl glass p-3">
                    <Check /> {p}
                  </li>
                ))}
              </ul>
            </aside>
          </div>
        )}
      </div>
    </section>
  );
}

const input =
  "w-full rounded-xl border border-cream/15 bg-coal/60 px-4 py-3 text-cream placeholder:text-cream/30 outline-none transition focus:border-saffron focus:ring-2 focus:ring-saffron/20 [color-scheme:dark]";

function Field({ label, error, hint, className = "", children }: { label: string; error?: string; hint?: string; className?: string; children: React.ReactNode }) {
  return (
    <div className={className}>
      <div className="mb-2 text-sm text-cream/70">{label}</div>
      {children}
      {error ? <p className="mt-1.5 text-xs text-ember">{error}</p> : hint ? <p className="mt-1.5 text-xs text-cream/40">{hint}</p> : null}
    </div>
  );
}

function Chip({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button type="button" onClick={onClick} aria-pressed={active} className={`rounded-full border px-4 py-2 text-sm transition ${active ? "border-saffron bg-saffron/15 text-saffron" : "border-cream/15 text-cream/70 hover:border-cream/40"}`}>
      {children}
    </button>
  );
}

function Success({ refId, f, total, whatsapp }: { refId: string; f: Form; total: number; whatsapp: string }) {
  function downloadIcs() {
    const [y, m, d] = f.date.split("-").map(Number);
    const [hh, mm] = f.startTime.split(":").map(Number);
    const start = new Date(y, m - 1, d, hh, mm);
    const end = new Date(start.getTime() + 6 * 3600_000);
    const fmt = (x: Date) => x.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
    const esc = (s: string) => s.replace(/[\\,;]/g, (c) => `\\${c}`).replace(/\n/g, "\\n");
    const ics = [
      "BEGIN:VCALENDAR",
      "VERSION:2.0",
      "PRODID:-//The Slow Deg//Booking//EN",
      "BEGIN:VEVENT",
      `UID:${refId}@theslowdeg`,
      `DTSTAMP:${fmt(new Date())}`,
      `DTSTART:${fmt(start)}`,
      `DTEND:${fmt(end)}`,
      `SUMMARY:${esc(`${brand.name} · ${f.occasion} (${refId})`)}`,
      `LOCATION:${esc(`${f.venue} ${f.city}`.trim())}`,
      `DESCRIPTION:${esc(`Booking request ${refId} for ${f.guests} guests. Awaiting the chef's confirmation.`)}`,
      "END:VEVENT",
      "END:VCALENDAR",
    ].join("\r\n");
    const url = URL.createObjectURL(new Blob([ics], { type: "text/calendar" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = `the-slow-deg-${refId}.ics`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <motion.div initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} className="mx-auto mt-14 max-w-2xl rounded-[2rem] ember-ring bg-gradient-to-b from-ash to-coal p-10 text-center">
      <div className="font-deva text-6xl text-gradient-ember">शुक्रिया</div>
      <h3 className="mt-4 font-display text-4xl text-cream">Request sent, {f.name.split(" ")[0]}.</h3>
      <p className="mt-3 text-cream/65">
        Reference <span className="font-mono text-saffron">{refId}</span>. The chef will review your date and call you to confirm your {inr(total)} booking.
      </p>
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <a href={whatsapp} target="_blank" rel="noopener" className="rounded-full bg-[#25D366] px-6 py-3 font-semibold text-coal transition hover:scale-105">
          Send to chef on WhatsApp
        </a>
        <button onClick={downloadIcs} className="rounded-full border border-cream/20 px-6 py-3 font-semibold text-cream transition hover:border-saffron hover:text-saffron">
          Add to calendar
        </button>
      </div>
    </motion.div>
  );
}
