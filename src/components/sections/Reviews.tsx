"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { reviews } from "@/config/business";
import { Eyebrow, Reveal, SectionTitle, Stars } from "../ui";

export function Reviews() {
  const [i, setI] = useState(0);
  const [paused, setPaused] = useState(false);
  useEffect(() => {
    if (paused) return;
    const t = setInterval(() => setI((x) => (x + 1) % reviews.length), 6000);
    return () => clearInterval(t);
  }, [paused]);
  const r = reviews[i];
  const avg = reviews.reduce((s, x) => s + x.rating, 0) / reviews.length;

  return (
    <section id="reviews" className="relative mx-auto max-w-7xl px-5 py-28 sm:px-8">
      <div className="grid gap-14 lg:grid-cols-[1fr_1.6fr]">
        <Reveal>
          <Eyebrow>Reviews</Eyebrow>
          <SectionTitle>
            The night they
            <br />
            <span className="italic text-gradient-ember">still talk about.</span>
          </SectionTitle>
          <div className="mt-10 flex items-center gap-5">
            <div className="font-display text-7xl font-semibold text-cream">{avg.toFixed(1)}</div>
            <div>
              <div>
                <Stars n={Math.round(avg)} className="h-6 w-6" />
              </div>
              <div className="text-sm text-cream/50">from corporate hosts</div>
            </div>
          </div>
          <div className="mt-8 flex gap-2">
            {reviews.map((_, k) => (
              <button key={k} onClick={() => setI(k)} aria-label={`Review ${k + 1}`} className={`h-1.5 rounded-full transition-all ${k === i ? "w-10 bg-saffron" : "w-4 bg-cream/20"}`} />
            ))}
          </div>
        </Reveal>

        <div className="relative min-h-[22rem]" onMouseEnter={() => setPaused(true)} onMouseLeave={() => setPaused(false)}>
          <span className="pointer-events-none absolute -top-16 -left-4 font-display text-[16rem] leading-none text-ember/15">“</span>
          <AnimatePresence mode="wait">
            <motion.figure
              key={i}
              initial={{ opacity: 0, y: 30, filter: "blur(8px)" }}
              animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
              exit={{ opacity: 0, y: -30, filter: "blur(8px)" }}
              transition={{ duration: 0.6 }}
              className="relative rounded-[2rem] glass p-8 sm:p-12"
            >
              <Stars n={r.rating} />
              <blockquote className="mt-4 font-display text-3xl leading-snug text-cream sm:text-4xl">{r.quote}</blockquote>
              <figcaption className="mt-8 flex flex-wrap items-center justify-between gap-4 border-t border-cream/10 pt-6">
                <div>
                  <div className="font-semibold text-cream">{r.name}</div>
                  <div className="text-sm text-cream/50">{r.company}</div>
                </div>
                <span className="rounded-full border border-saffron/30 px-3 py-1 text-xs text-saffron">{r.event}</span>
              </figcaption>
            </motion.figure>
          </AnimatePresence>
        </div>
      </div>
    </section>
  );
}
