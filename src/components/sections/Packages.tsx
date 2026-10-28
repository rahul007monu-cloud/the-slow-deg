"use client";

import { addOns, hourlyMinHours, packages, plateTiers } from "@/config/business";
import { inr } from "@/lib/pricing";
import { Eyebrow, Reveal, SectionTitle, Spark } from "../ui";

export function prefillBooking(detail: { guests?: number; model?: "package" | "hourly" | "plate"; plateTierId?: string }) {
  window.dispatchEvent(new CustomEvent("prefill-booking", { detail }));
  document.getElementById("book")?.scrollIntoView({ behavior: "smooth" });
}

export function Packages() {
  return (
    <section id="packages" className="relative mx-auto max-w-7xl px-5 py-28 sm:px-8">
      <Reveal className="text-center">
        <Eyebrow>Packages</Eyebrow>
        <SectionTitle>
          Clear prices. <span className="italic text-gradient-ember">No surprises.</span>
        </SectionTitle>
        <p className="mx-auto mt-4 max-w-2xl text-cream/60">
          Every package includes 5 hours on site, ingredients, degs, coals, equipment and crew. Party running late? We stay, and extra hours are billed at the rate shown.
        </p>
      </Reveal>

      <div className="mt-16 grid gap-6 lg:grid-cols-3">
        {packages.map((p, i) => (
          <Reveal key={p.id} delay={i * 0.08}>
            <div className={`relative flex h-full flex-col rounded-[2rem] p-8 transition duration-500 hover:-translate-y-2 ${p.featured ? "ember-ring bg-gradient-to-b from-ash to-soot" : "glass"}`}>
              {p.featured && <span className="absolute -top-3 left-8 rounded-full bg-gradient-to-r from-saffron to-ember px-3 py-1 text-[10px] font-bold tracking-widest text-coal uppercase">Most booked</span>}
              <div className="text-xs tracking-[0.3em] text-saffron uppercase">
                {p.guests[0]}–{p.guests[1]} guests
              </div>
              <h3 className="mt-3 font-display text-3xl text-cream">{p.name}</h3>
              <div className="mt-6 flex items-end gap-2">
                <span className="font-display text-5xl font-semibold text-cream">{inr(p.basePrice)}</span>
              </div>
              <div className="mt-1 text-sm text-cream/50">
                {p.includedHours} hrs included · then {inr(p.extraHourPrice)}/hr
              </div>
              <div className="mt-1 text-sm text-cream/40">{p.team}</div>
              <ul className="mt-8 flex-1 space-y-3 text-cream/75">
                {p.perks.map((perk) => (
                  <li key={perk} className="flex items-center gap-3">
                    <Spark />
                    {perk}
                  </li>
                ))}
              </ul>
              <button
                onClick={() => prefillBooking({ guests: Math.round((p.guests[0] + p.guests[1]) / 2), model: "package" })}
                className={`mt-8 rounded-full py-3.5 font-semibold transition hover:scale-[1.02] ${p.featured ? "bg-gradient-to-r from-saffron to-ember text-coal" : "border border-cream/20 text-cream hover:border-saffron hover:text-saffron"}`}
              >
                Get my quote
              </button>
            </div>
          </Reveal>
        ))}
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <Reveal>
          <div className="h-full rounded-[2rem] glass p-8">
            <div className="text-xs tracking-[0.3em] text-saffron uppercase">Prefer per plate?</div>
            <h3 className="mt-2 font-display text-3xl text-cream">Per-plate pricing</h3>
            <p className="mt-2 text-sm text-cream/55">Best for large corporate headcounts. The chef stays until service ends, no hourly meter.</p>
            <div className="mt-6 grid grid-cols-3 gap-3">
              {plateTiers.map((t) => (
                <button key={t.id} onClick={() => prefillBooking({ model: "plate", plateTierId: t.id })} className="rounded-2xl border border-cream/10 p-4 text-left transition hover:border-saffron">
                  <div className="text-sm text-cream/60">{t.name}</div>
                  <div className="font-display text-2xl text-cream">{inr(t.pricePerPlate)}</div>
                  <div className="text-xs text-cream/40">{t.dishes} dishes · min {t.minGuests}</div>
                </button>
              ))}
            </div>
          </div>
        </Reveal>
        <Reveal delay={0.08}>
          <div className="h-full rounded-[2rem] glass p-8">
            <div className="text-xs tracking-[0.3em] text-saffron uppercase">Or by the hour</div>
            <h3 className="mt-2 font-display text-3xl text-cream">Hourly chef hire</h3>
            <p className="mt-2 text-sm text-cream/55">From {inr(packages[0].hourlyRate)}/hr with crew, minimum {hourlyMinHours} hours. Ingredients included.</p>
            <div className="mt-6 flex flex-wrap gap-2">
              {addOns.map((a) => (
                <span key={a.id} className="rounded-full border border-cream/10 px-3 py-1.5 text-xs text-cream/60">
                  + {a.name} · {inr(a.price)}
                  {a.per === "guest" ? "/guest" : ""}
                </span>
              ))}
            </div>
          </div>
        </Reveal>
      </div>
      <p className="mt-6 text-center text-xs text-cream/40">Prices exclude GST. Venues outside city limits may include a travel charge. Above 300 guests? We’ll build a custom quote.</p>
    </section>
  );
}
