"use client";

import { stats } from "@/config/business";
import { useSite } from "../SiteData";
import { Counter, Spark } from "../ui";

export function Marquee() {
  const { menu } = useSite();
  const items = menu.filter((d) => d.visible).map((d) => d.name);
  return (
    <section aria-label="Signature dishes" className="relative border-y border-cream/10 bg-soot py-6">
      <div className="flex overflow-hidden">
        <div className="marquee flex shrink-0 gap-12 pr-12 whitespace-nowrap">
          {[...items, ...items].map((n, i) => (
            <span key={i} className="flex items-center gap-12 font-display text-3xl text-cream/80 italic sm:text-4xl">
              {n}
              <Spark className="h-2 w-2" />
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}

export function Stats() {
  return (
    <section className="mx-auto grid max-w-7xl grid-cols-2 gap-px overflow-hidden px-5 py-20 sm:px-8 lg:grid-cols-4">
      {stats.map((s) => (
        <div key={s.label} className="p-6 text-center">
          <div className="font-display text-5xl font-semibold text-gradient-ember sm:text-6xl">
            <Counter to={s.value} decimals={s.decimals ?? 0} suffix={s.suffix} />
          </div>
          <div className="mt-2 text-xs tracking-[0.3em] text-cream/50 uppercase">{s.label}</div>
        </div>
      ))}
    </section>
  );
}
