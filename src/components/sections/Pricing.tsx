"use client";

import { useState } from "react";
import { motion } from "motion/react";
import { calculateQuote, inr } from "@/lib/pricing";
import { useSite } from "../SiteData";
import { Eyebrow, Reveal, SectionTitle, Spark } from "../ui";

export function prefillBooking(detail: { guests?: number }) {
  window.dispatchEvent(new CustomEvent("prefill-booking", { detail }));
  document.getElementById("book")?.scrollIntoView({ behavior: "smooth" });
}

const included = ["The chef for your full evening, no hourly meter", "Live coal counters and the dum unveiling", "Degs, grills and coals brought by us", "Menu designed with you on a call", "Venue cooking area left spotless"];

export function Pricing() {
  const { settings } = useSite();
  const [guests, setGuests] = useState(Math.max(settings.minGuests, 50));
  const q = calculateQuote(guests, settings);
  const sliderMax = Math.max(settings.maxGuests, settings.minGuests + 10);

  return (
    <section id="pricing" className="relative mx-auto max-w-7xl px-5 py-28 sm:px-8">
      <Reveal className="text-center">
        <Eyebrow>Pricing</Eyebrow>
        <SectionTitle>
          One simple price. <span className="italic text-gradient-ember">Per guest.</span>
        </SectionTitle>
      </Reveal>

      <div className="mt-16 grid gap-6 lg:grid-cols-[1fr_1.2fr]">
        <Reveal>
          <div className="flex h-full flex-col justify-between rounded-[2rem] ember-ring bg-gradient-to-b from-ash to-soot p-8 sm:p-10">
            <div>
              <div className="text-xs tracking-[0.3em] text-saffron uppercase">Chef for the evening</div>
              <div className="mt-4 flex items-end gap-3">
                <span className="font-display text-7xl font-semibold text-cream sm:text-8xl">{inr(settings.pricePerPerson)}</span>
                <span className="pb-3 text-cream/50">/ guest</span>
              </div>
              <p className="mt-2 text-sm text-cream/55">
                {settings.gstPercent ? `+ ${settings.gstPercent}% GST · ` : ""}Minimum {settings.minGuests} guests
              </p>
              <p className="mt-4 text-sm text-cream/60">{settings.priceNote}</p>
            </div>
            <ul className="mt-8 space-y-3 text-cream/80">
              {included.map((t) => (
                <li key={t} className="flex items-center gap-3">
                  <Spark />
                  {t}
                </li>
              ))}
            </ul>
          </div>
        </Reveal>

        <Reveal delay={0.08}>
          <div className="h-full rounded-[2rem] glass p-8 sm:p-10">
            <div className="text-xs tracking-[0.3em] text-saffron uppercase">Live calculator</div>
            <label className="mt-6 block">
              <span className="flex items-end justify-between">
                <span className="text-cream/70">How many guests?</span>
                <input
                  type="number"
                  inputMode="numeric"
                  min={1}
                  max={10000}
                  value={guests || ""}
                  onChange={(e) => setGuests(Math.min(10000, Math.max(0, Number(e.target.value))))}
                  className="w-28 rounded-xl border border-cream/15 bg-coal/60 px-3 py-2 text-right font-display text-3xl text-cream outline-none focus:border-saffron"
                  aria-label="Number of guests"
                />
              </span>
              <input type="range" min={settings.minGuests} max={sliderMax} step={5} value={Math.min(Math.max(guests, settings.minGuests), sliderMax)} onChange={(e) => setGuests(Number(e.target.value))} className="mt-6 w-full" />
              <span className="mt-1 flex justify-between text-xs text-cream/40">
                <span>{settings.minGuests}</span>
                <span>{sliderMax}+</span>
              </span>
            </label>

            <div className="mt-8 space-y-2 border-t border-cream/10 pt-6 text-sm">
              <Row label={`${q.billedGuests} guests × ${inr(q.pricePerPerson)}`} value={inr(q.subtotal)} />
              {q.billedGuests > q.guests && <p className="text-xs text-ember">Minimum {settings.minGuests} guests is charged.</p>}
              {settings.gstPercent > 0 && <Row label={`GST (${settings.gstPercent}%)`} value={inr(q.gst)} muted />}
            </div>
            <div className="mt-6 flex items-end justify-between">
              <span className="text-cream/60">Total</span>
              <motion.span key={q.total} initial={{ opacity: 0.3, y: -8 }} animate={{ opacity: 1, y: 0 }} className="font-display text-6xl font-semibold text-gradient-ember">
                {inr(q.total)}
              </motion.span>
            </div>
            <div className="mt-2 text-right text-xs text-cream/45">Advance to confirm ({settings.advancePercent}%): {inr(q.advance)}</div>
            <button onClick={() => prefillBooking({ guests: q.guests })} className="mt-8 w-full rounded-full bg-gradient-to-r from-saffron to-ember py-4 font-semibold text-coal transition hover:scale-[1.02]">
              Book for {q.guests || settings.minGuests} guests
            </button>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

function Row({ label, value, muted = false }: { label: string; value: string; muted?: boolean }) {
  return (
    <div className={`flex justify-between gap-4 ${muted ? "text-cream/50" : "text-cream/75"}`}>
      <span>{label}</span>
      <span>{value}</span>
    </div>
  );
}
