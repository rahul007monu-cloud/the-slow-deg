"use client";

import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { addOns, bookingPromises, brand, dishes, hourlyMinHours, plateTiers } from "@/config/business";
import { bookingSchema } from "@/lib/booking-schema";
import { calculateQuote, inr, MAX_STANDARD_GUESTS, type PricingModel } from "@/lib/pricing";
import { whatsappLink } from "@/lib/links";
import { Check, Eyebrow, Reveal, SectionTitle } from "../ui";

const occasions = ["Annual party", "Offsite", "Client dinner", "Diwali / Festive", "Product launch", "Team celebration", "Private party", "Other"];
const stepNames = ["Event", "Time & price", "Menu", "Your details"];

type Form = {
  date: string;
  startTime: string;
  hours: number;
  openEnded: boolean;
  guests: number;
  occasion: string;
  city: string;
  venue: string;
  model: PricingModel;
  plateTierId: string;
  addOnIds: string[];
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

const initial: Form = {
  date: "",
  startTime: "18:00",
  hours: 6,
  openEnded: true,
  guests: 60,
  occasion: occasions[0],
  city: brand.cities[0],
  venue: "",
  model: "package",
  plateTierId: plateTiers[1].id,
  addOnIds: [],
  dishIds: ["raan", "seekh"],
  notes: "",
  name: "",
  company: "",
  email: "",
  phone: "",
  gstin: "",
  website: "",
};

const modelInfo: Record<PricingModel, { title: string; sub: string }> = {
  package: { title: "Package", sub: "5 hrs included + extra hrs" },
  hourly: { title: "Per hour", sub: `Min ${hourlyMinHours} hrs` },
  plate: { title: "Per plate", sub: "Chef stays till service ends" },
};

export function Booking() {
  const [f, setF] = useState<Form>(initial);
  const [step, setStep] = useState(0);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [status, setStatus] = useState<"idle" | "sending" | "error">("idle");
  const [serverError, setServerError] = useState("");
  const [done, setDone] = useState<{ ref: string } | null>(null);

  const minDate = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() + brand.minNoticeDays);
    return isoDate(d);
  }, []);

  useEffect(() => {
    const on = (e: Event) => {
      const d = (e as CustomEvent).detail as Partial<Form>;
      setF((prev) => ({ ...prev, ...d }));
      setStep(d.model ? 1 : 0);
    };
    window.addEventListener("prefill-booking", on);
    return () => window.removeEventListener("prefill-booking", on);
  }, []);

  const set = <K extends keyof Form>(k: K, v: Form[K]) => {
    setF((p) => ({ ...p, [k]: v }));
    setErrors((e) => ({ ...e, [k]: "" }));
  };
  const toggle = (k: "addOnIds" | "dishIds", id: string) => set(k, f[k].includes(id) ? f[k].filter((x) => x !== id) : [...f[k], id]);

  const quote = useMemo(() => calculateQuote(f), [f]);
  const allQuotes = useMemo(
    () => (["package", "hourly", "plate"] as PricingModel[]).map((m) => ({ m, q: calculateQuote({ ...f, model: m }) })),
    [f],
  );
  const cheapest = allQuotes.reduce((a, b) => (b.q.total < a.q.total ? b : a)).m;

  const stepFields: (keyof Form)[][] = [
    ["date", "startTime", "guests", "occasion", "city", "venue"],
    ["hours", "model", "plateTierId"],
    ["dishIds", "addOnIds", "notes"],
    ["name", "company", "email", "phone", "gstin"],
  ];

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
    if (f.date && f.date < minDate) errs.date = `Please book at least ${brand.minNoticeDays} days ahead`;
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  function next() {
    if (validate(step)) setStep((s) => Math.min(3, s + 1));
  }

  async function submit() {
    if (!validate(3)) return;
    setStatus("sending");
    setServerError("");
    try {
      const res = await fetch("/api/book", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(f) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Something went wrong");
      setDone({ ref: data.ref });
      setStatus("idle");
    } catch (e) {
      setStatus("error");
      setServerError(e instanceof Error ? e.message : "Something went wrong");
    }
  }

  const summaryText = `Hi ${brand.name}! Booking request${done ? ` ${done.ref}` : ""}:
• ${f.occasion} for ${f.guests} guests
• ${f.date} from ${f.startTime}, ~${f.hours} hrs${f.openEnded ? " (open-ended)" : ""}
• ${f.city}${f.venue ? `, ${f.venue}` : ""}
• ${modelInfo[f.model].title} pricing, estimate ${quote.custom ? "custom" : inr(quote.total)}
• ${f.company} · ${f.name}`;

  return (
    <section id="book" className="relative overflow-hidden border-y border-cream/10 bg-soot py-28">
      <div className="pointer-events-none absolute -top-40 left-1/2 h-96 w-[60rem] -translate-x-1/2 rounded-full bg-ember/10 blur-3xl" />
      <div className="relative mx-auto max-w-7xl px-5 sm:px-8">
        <Reveal className="text-center">
          <Eyebrow>Book the Chef</Eyebrow>
          <SectionTitle>
            Reserve your evening <span className="italic text-gradient-ember">in 2 minutes.</span>
          </SectionTitle>
          <p className="mx-auto mt-4 max-w-xl text-cream/60">See your price instantly. The chef calls you within 24 hours to design the menu. A {brand.advancePercent}% advance locks the date.</p>
        </Reveal>

        {done ? (
          <Success refId={done.ref} f={f} summary={summaryText} total={quote.custom ? null : quote.total} />
        ) : (
          <div className="mt-14 grid gap-8 lg:grid-cols-[1.5fr_1fr]">
            <div className="rounded-[2rem] glass p-6 sm:p-10">
              {/* progress */}
              <ol className="mb-10 flex gap-2">
                {stepNames.map((n, i) => (
                  <li key={n} className="flex-1">
                    <button onClick={() => (i < step || validate(i - 1) ? setStep(i) : null)} className="w-full text-left">
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
                      <Field label="Event date" error={errors.date}>
                        <input type="date" min={minDate} value={f.date} onChange={(e) => set("date", e.target.value)} className={input} />
                      </Field>
                      <Field label="Chef starts at" error={errors.startTime} hint="Most evening events start 5–7 PM">
                        <input type="time" value={f.startTime} onChange={(e) => set("startTime", e.target.value)} className={input} />
                      </Field>
                      <Field label={`Guests: ${f.guests}`} error={errors.guests} className="sm:col-span-2">
                        <div className="flex items-center gap-4">
                          <input type="range" min={10} max={400} step={5} value={f.guests} onChange={(e) => set("guests", Number(e.target.value))} className="flex-1" />
                          <input type="number" min={10} max={5000} value={f.guests} onChange={(e) => set("guests", Math.max(0, Number(e.target.value)))} className={`${input} w-24`} />
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
                        <input value={f.venue} onChange={(e) => set("venue", e.target.value)} placeholder="Office terrace, farmhouse, hotel…" className={input} />
                      </Field>
                    </div>
                  )}

                  {step === 1 && (
                    <div className="space-y-8">
                      <Field label={`Expected duration: ${f.hours} hours`} hint="Just an estimate. We never leave while guests are still eating.">
                        <input type="range" min={3} max={14} value={f.hours} onChange={(e) => set("hours", Number(e.target.value))} className="w-full" />
                        <div className="mt-1 flex justify-between text-xs text-cream/40">
                          <span>3 hrs</span>
                          <span>14 hrs</span>
                        </div>
                      </Field>
                      <label className="flex cursor-pointer items-start gap-3 rounded-2xl border border-cream/10 p-4">
                        <input type="checkbox" checked={f.openEnded} onChange={(e) => set("openEnded", e.target.checked)} className="mt-1 h-4 w-4 accent-[#f0a93b]" />
                        <span>
                          <span className="block font-semibold text-cream">Until the last plate</span>
                          <span className="text-sm text-cream/55">Keep it open-ended. Extra hours are billed on actuals at your package’s hourly rate.</span>
                        </span>
                      </label>
                      <div>
                        <div className="mb-3 text-sm text-cream/70">How would you like to pay?</div>
                        <div className="grid gap-3 sm:grid-cols-3">
                          {allQuotes.map(({ m, q }) => (
                            <button key={m} onClick={() => set("model", m)} className={`relative rounded-2xl border p-5 text-left transition ${f.model === m ? "border-saffron bg-saffron/10" : "border-cream/10 hover:border-cream/30"}`}>
                              {!q.custom && m === cheapest && <span className="absolute -top-2.5 right-3 rounded-full bg-ember px-2 py-0.5 text-[10px] font-bold text-coal uppercase">Best value</span>}
                              <div className="font-semibold text-cream">{modelInfo[m].title}</div>
                              <div className="text-xs text-cream/45">{modelInfo[m].sub}</div>
                              <div className="mt-3 font-display text-2xl text-cream">{q.custom ? "Custom" : inr(q.total)}</div>
                              {!q.custom && <div className="text-xs text-cream/40">about {inr(q.perGuest)}/guest incl. GST</div>}
                            </button>
                          ))}
                        </div>
                      </div>
                      {f.model === "plate" && (
                        <div className="flex flex-wrap gap-2">
                          {plateTiers.map((t) => (
                            <Chip key={t.id} active={f.plateTierId === t.id} onClick={() => set("plateTierId", t.id)}>
                              {t.name} · {inr(t.pricePerPlate)}/plate · {t.dishes} dishes
                            </Chip>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {step === 2 && (
                    <div className="space-y-8">
                      <Field label="Dishes you’d love (we’ll finalise on the call)">
                        <div className="flex flex-wrap gap-2">
                          {dishes.map((d) => (
                            <Chip key={d.id} active={f.dishIds.includes(d.id)} onClick={() => toggle("dishIds", d.id)}>
                              {d.name}
                            </Chip>
                          ))}
                        </div>
                      </Field>
                      <Field label="Add-ons">
                        <div className="grid gap-2 sm:grid-cols-2">
                          {addOns.map((a) => (
                            <label key={a.id} className={`flex cursor-pointer items-center justify-between gap-3 rounded-2xl border p-4 transition ${f.addOnIds.includes(a.id) ? "border-saffron bg-saffron/10" : "border-cream/10"}`}>
                              <span className="flex items-center gap-3">
                                <input type="checkbox" checked={f.addOnIds.includes(a.id)} onChange={() => toggle("addOnIds", a.id)} className="h-4 w-4 accent-[#f0a93b]" />
                                <span className="text-sm text-cream">{a.name}</span>
                              </span>
                              <span className="text-xs whitespace-nowrap text-cream/50">
                                {inr(a.price)}
                                {a.per === "guest" ? "/guest" : ""}
                              </span>
                            </label>
                          ))}
                        </div>
                      </Field>
                      <Field label="Anything else? (optional)">
                        <textarea value={f.notes} onChange={(e) => set("notes", e.target.value)} rows={3} placeholder="Veg guests, allergies, halal, venue access, theme…" className={input} />
                      </Field>
                    </div>
                  )}

                  {step === 3 && (
                    <div className="grid gap-6 sm:grid-cols-2">
                      <Field label="Your name" error={errors.name}>
                        <input value={f.name} onChange={(e) => set("name", e.target.value)} autoComplete="name" className={input} />
                      </Field>
                      <Field label="Company" error={errors.company}>
                        <input value={f.company} onChange={(e) => set("company", e.target.value)} autoComplete="organization" className={input} />
                      </Field>
                      <Field label="Work email" error={errors.email}>
                        <input type="email" value={f.email} onChange={(e) => set("email", e.target.value)} autoComplete="email" className={input} />
                      </Field>
                      <Field label="Phone / WhatsApp" error={errors.phone}>
                        <input type="tel" value={f.phone} onChange={(e) => set("phone", e.target.value)} autoComplete="tel" placeholder="+91" className={input} />
                      </Field>
                      <Field label="GSTIN (for invoice, optional)" error={errors.gstin} className="sm:col-span-2">
                        <input value={f.gstin} onChange={(e) => set("gstin", e.target.value.toUpperCase())} maxLength={15} className={input} />
                      </Field>
                      {/* honeypot */}
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
                {step < 3 ? (
                  <button onClick={next} className="rounded-full bg-gradient-to-r from-saffron to-ember px-8 py-3.5 font-semibold text-coal transition hover:scale-105">
                    Continue
                  </button>
                ) : (
                  <button onClick={submit} disabled={status === "sending"} className="rounded-full bg-gradient-to-r from-saffron to-ember px-8 py-3.5 font-semibold text-coal transition hover:scale-105 disabled:opacity-60">
                    {status === "sending" ? "Sealing the deg…" : "Send booking request"}
                  </button>
                )}
              </div>
            </div>

            {/* live quote */}
            <aside className="lg:sticky lg:top-28 lg:self-start">
              <div className="rounded-[2rem] border border-saffron/25 bg-gradient-to-b from-ash to-coal p-8">
                <div className="text-xs tracking-[0.3em] text-saffron uppercase">Your live quote</div>
                {quote.custom ? (
                  <div className="mt-4">
                    <div className="font-display text-4xl text-cream">Custom</div>
                    <p className="mt-2 text-sm text-cream/60">Above {MAX_STANDARD_GUESTS} guests we plan extra crew and counters. Send the request and we’ll build a tailored quote within 24 hours.</p>
                  </div>
                ) : (
                  <>
                    <motion.div key={quote.total} initial={{ opacity: 0.4, y: -6 }} animate={{ opacity: 1, y: 0 }} className="mt-3 font-display text-5xl font-semibold text-cream">
                      {inr(quote.total)}
                    </motion.div>
                    <div className="text-sm text-cream/50">
                      about {inr(quote.perGuest)} per guest · incl. GST
                    </div>
                    <ul className="mt-6 space-y-2 border-t border-cream/10 pt-5 text-sm">
                      {quote.lines.map((l) => (
                        <li key={l.label} className="flex justify-between gap-4 text-cream/70">
                          <span>{l.label}</span>
                          <span className="whitespace-nowrap">{inr(l.amount)}</span>
                        </li>
                      ))}
                      <li className="flex justify-between gap-4 text-cream/50">
                        <span>GST ({Math.round(brand.gstRate * 100)}%)</span>
                        <span>{inr(quote.gst)}</span>
                      </li>
                    </ul>
                    <div className="mt-5 flex justify-between rounded-2xl bg-saffron/10 p-4 text-sm">
                      <span className="text-cream/80">Advance to confirm ({brand.advancePercent}%)</span>
                      <span className="font-semibold text-saffron">{inr(quote.advance)}</span>
                    </div>
                    {f.openEnded && f.model !== "plate" && quote.pkg && (
                      <p className="mt-4 text-xs text-cream/45">Open-ended: each hour beyond your estimate is {inr(f.model === "hourly" ? quote.pkg.hourlyRate : quote.pkg.extraHourPrice)} + GST, billed on actuals.</p>
                    )}
                  </>
                )}
                <a href={whatsappLink(summaryText)} target="_blank" rel="noopener" className="mt-6 flex items-center justify-center gap-2 rounded-full border border-cream/15 py-3 text-sm text-cream/80 transition hover:border-[#25D366] hover:text-[#25D366]">
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

function Success({ refId, f, summary, total }: { refId: string; f: Form; summary: string; total: number | null }) {
  function downloadIcs() {
    const [y, m, d] = f.date.split("-").map(Number);
    const [hh, mm] = f.startTime.split(":").map(Number);
    const start = new Date(y, m - 1, d, hh, mm);
    const end = new Date(start.getTime() + f.hours * 3600_000);
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
      `DESCRIPTION:${esc(`Booking request ${refId} for ${f.guests} guests. Awaiting confirmation call.`)}`,
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
      <h3 className="mt-4 font-display text-4xl text-cream">Your deg is reserved, {f.name.split(" ")[0]}.</h3>
      <p className="mt-3 text-cream/65">
        Reference <span className="font-mono text-saffron">{refId}</span>. The chef will call you within 24 hours to design your menu{total ? ` and confirm your ${inr(total)} quote` : " and share a custom quote"}.
      </p>
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <a href={whatsappLink(summary)} target="_blank" rel="noopener" className="rounded-full bg-[#25D366] px-6 py-3 font-semibold text-coal transition hover:scale-105">
          Confirm on WhatsApp
        </a>
        <button onClick={downloadIcs} className="rounded-full border border-cream/20 px-6 py-3 font-semibold text-cream transition hover:border-saffron hover:text-saffron">
          Add to calendar
        </button>
      </div>
    </motion.div>
  );
}
