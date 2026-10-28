"use client";

import dynamic from "next/dynamic";
import { useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { useSite } from "../SiteData";
import { Eyebrow, Heat, Reveal, SectionTitle, WhenVisible } from "../ui";

const DishViewer = dynamic(() => import("../three/DishViewer"), { ssr: false });

export function Menu() {
  const { menu } = useSite();
  const visible = menu.filter((d) => d.visible);
  const dishes = visible.filter((d) => d.piece !== "none");
  const degDishes = visible.filter((d) => d.piece === "none").map((d) => ({ name: d.name, note: d.tag ? `${d.tag}. ${d.description}` : d.description }));
  const [active, setActive] = useState(dishes[0]?.id);
  const dish = dishes.find((d) => d.id === active) ?? dishes[0];
  if (!dish) return null;

  return (
    <section id="menu" className="relative overflow-hidden py-28">
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_70%_50%,rgba(194,122,69,0.12),transparent_60%)]" />
      <div className="mx-auto max-w-7xl px-5 sm:px-8">
        <Reveal>
          <Eyebrow>Signature Menu</Eyebrow>
          <SectionTitle>
            Off the coals, <span className="italic text-gradient-ember">in 3D.</span>
          </SectionTitle>
          <p className="mt-4 max-w-xl text-cream/60">Tap a dish, then drag to turn it around. Every piece is cooked live in front of your guests.</p>
        </Reveal>

        <div className="mt-14 grid items-center gap-10 lg:grid-cols-[1fr_1.3fr]">
          <ul className="space-y-2">
            {dishes.map((d, i) => (
              <li key={d.id}>
                <button
                  onClick={() => setActive(d.id)}
                  className={`group flex w-full items-center gap-5 rounded-2xl px-5 py-4 text-left transition ${active === d.id ? "glass ember-ring" : "hover:bg-cream/5"}`}
                >
                  <span className={`font-display text-sm ${active === d.id ? "text-saffron" : "text-cream/30"}`}>{String(i + 1).padStart(2, "0")}</span>
                  <span className="flex-1">
                    <span className={`block font-display text-2xl transition ${active === d.id ? "text-cream" : "text-cream/60 group-hover:text-cream"}`}>{d.name}</span>
                    <span className="text-xs tracking-wider text-cream/40 uppercase">
                      {d.tag} {d.heat > 0 && <>· <Heat level={d.heat} /></>}
                    </span>
                  </span>
                  {d.signature && <span className="rounded-full border border-saffron/40 px-2 py-0.5 text-[10px] tracking-widest text-saffron uppercase">Signature</span>}
                </button>
              </li>
            ))}
          </ul>

          <div className="relative">
            <div className="relative aspect-square overflow-hidden rounded-[2.5rem] border border-cream/10 bg-[radial-gradient(circle_at_50%_70%,#2a1810,#0b0807_70%)] sm:aspect-[4/3]">
              <span className="pointer-events-none absolute top-6 left-1/2 -translate-x-1/2 font-deva text-[9rem] leading-none text-cream/[0.04] sm:text-[12rem]">{dish.hindi}</span>
              <WhenVisible className="absolute inset-0">
                <DishViewer kind={dish.piece} />
              </WhenVisible>
              <div className="pointer-events-none absolute right-5 bottom-5 rounded-full glass px-3 py-1.5 text-[10px] tracking-widest text-cream/60 uppercase">Drag to rotate</div>
            </div>
            <AnimatePresence mode="wait">
              <motion.div key={dish.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }} transition={{ duration: 0.35 }} className="mt-6">
                <h3 className="font-display text-4xl text-cream">{dish.name}</h3>
                <p className="mt-2 max-w-xl text-cream/65">{dish.description}</p>
              </motion.div>
            </AnimatePresence>
          </div>
        </div>

        <Reveal className="mt-24">
          <h3 className="font-display text-3xl text-cream">
            From the deg <span className="font-deva text-2xl text-saffron">देग से</span>
          </h3>
          <div className="mt-8 grid gap-px overflow-hidden rounded-3xl border border-cream/10 bg-cream/10 sm:grid-cols-2 lg:grid-cols-3">
            {degDishes.map((d) => (
              <div key={d.name} className="bg-coal p-7 transition hover:bg-soot">
                <div className="font-display text-2xl text-cream">{d.name}</div>
                <div className="mt-1 text-sm text-cream/50">{d.note}</div>
              </div>
            ))}
          </div>
          <p className="mt-6 text-sm text-cream/45">Vegetarian dishes are cooked in separate degs on request. The full menu is designed with you on the tasting call.</p>
        </Reveal>
      </div>
    </section>
  );
}
