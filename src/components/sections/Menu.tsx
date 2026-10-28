"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { useSite } from "../SiteData";
import { TiltPhoto } from "../TiltPhoto";
import { Eyebrow, Heat, Reveal, SectionTitle } from "../ui";

export function Menu() {
  const { menu } = useSite();
  const dishes = menu.filter((d) => d.visible);
  const featured = dishes.filter((d) => d.category === "grill");
  const fromDeg = dishes.filter((d) => d.category === "deg");
  const list = featured.length ? featured : dishes;
  const [active, setActive] = useState(list[0]?.id);
  const dish = list.find((d) => d.id === active) ?? list[0];
  if (!dish) return null;

  return (
    <section id="menu" className="relative overflow-hidden py-28">
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_70%_50%,rgba(194,122,69,0.12),transparent_60%)]" />
      <div className="mx-auto max-w-7xl px-5 sm:px-8">
        <Reveal>
          <Eyebrow>Signature Menu</Eyebrow>
          <SectionTitle>
            Off the coals, <span className="italic text-gradient-ember">onto your plate.</span>
          </SectionTitle>
          <p className="mt-4 max-w-xl text-cream/60">Tap a dish to see it up close. Everything is cooked live at your venue.</p>
        </Reveal>

        <div className="mt-14 grid items-start gap-10 lg:grid-cols-[1fr_1.35fr]">
          <ul className="order-2 space-y-2 lg:order-1">
            {list.map((d, i) => (
              <li key={d.id}>
                <button
                  onClick={() => setActive(d.id)}
                  className={`group flex w-full items-center gap-4 rounded-2xl px-4 py-3 text-left transition ${dish.id === d.id ? "glass ember-ring" : "hover:bg-cream/5"}`}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={d.photo} alt="" loading="lazy" className={`h-14 w-14 shrink-0 rounded-xl object-cover transition ${dish.id === d.id ? "" : "opacity-60 grayscale-[40%] group-hover:opacity-100"}`} />
                  <span className="flex-1">
                    <span className={`block font-display text-2xl leading-tight transition ${dish.id === d.id ? "text-cream" : "text-cream/60 group-hover:text-cream"}`}>{d.name}</span>
                    <span className="text-xs tracking-wider text-cream/40 uppercase">
                      {d.tag} {d.heat > 0 && <>· <Heat level={d.heat} /></>}
                    </span>
                  </span>
                  <span className="hidden font-display text-sm text-cream/25 sm:block">{String(i + 1).padStart(2, "0")}</span>
                </button>
              </li>
            ))}
          </ul>

          <div className="order-1 lg:sticky lg:top-28 lg:order-2">
            <AnimatePresence mode="wait">
              <motion.div key={dish.id} initial={{ opacity: 0, scale: 0.96, rotateX: 8 }} animate={{ opacity: 1, scale: 1, rotateX: 0 }} exit={{ opacity: 0, scale: 0.98 }} transition={{ duration: 0.45, ease: [0.2, 0.7, 0.2, 1] }}>
                <TiltPhoto src={dish.photo} alt={dish.name} credit={dish.photoCredit} className="aspect-[4/5] sm:aspect-[4/3]">
                  <div className="flex items-end justify-between gap-4">
                    <div>
                      {dish.signature && <span className="mb-3 inline-block rounded-full bg-gradient-to-r from-saffron to-ember px-3 py-1 text-[10px] font-bold tracking-widest text-coal uppercase">Signature</span>}
                      <h3 className="font-display text-4xl leading-none text-cream drop-shadow-lg sm:text-5xl">{dish.name}</h3>
                      <p className="mt-3 max-w-lg text-sm text-cream/80 sm:text-base">{dish.description}</p>
                    </div>
                    {dish.hindi && <span className="hidden font-deva text-5xl text-saffron/80 drop-shadow-lg sm:block">{dish.hindi}</span>}
                  </div>
                </TiltPhoto>
              </motion.div>
            </AnimatePresence>
          </div>
        </div>

        {fromDeg.length > 0 && featured.length > 0 && (
          <Reveal className="mt-24">
            <h3 className="font-display text-3xl text-cream">
              From the deg <span className="font-deva text-2xl text-saffron">देग से</span>
            </h3>
            <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {fromDeg.map((d) => (
                <TiltPhoto key={d.id} src={d.photo} alt={d.name} credit={d.photoCredit} className="aspect-[3/4]">
                  <div className="text-xs tracking-widest text-saffron uppercase">{d.tag}</div>
                  <div className="mt-1 font-display text-2xl leading-tight text-cream">{d.name}</div>
                  <p className="mt-1 line-clamp-3 text-xs text-cream/70">{d.description}</p>
                </TiltPhoto>
              ))}
            </div>
            <p className="mt-6 text-sm text-cream/45">Vegetarian dishes are cooked in separate degs on request. Your final menu is designed with you on the call.</p>
          </Reveal>
        )}
      </div>
    </section>
  );
}
