"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { faqs } from "@/config/business";
import { Eyebrow, Reveal, SectionTitle } from "../ui";

export function Faq() {
  const [open, setOpen] = useState<number | null>(0);
  return (
    <section id="faq" className="mx-auto max-w-4xl px-5 py-28 sm:px-8">
      <Reveal className="text-center">
        <Eyebrow>FAQ</Eyebrow>
        <SectionTitle>Good questions.</SectionTitle>
      </Reveal>
      <div className="mt-14 divide-y divide-cream/10 border-y border-cream/10">
        {faqs.map((f, i) => (
          <div key={f.q}>
            <button onClick={() => setOpen(open === i ? null : i)} aria-expanded={open === i} className="flex w-full items-center justify-between gap-6 py-6 text-left">
              <span className="font-display text-2xl text-cream">{f.q}</span>
              <span className={`text-2xl text-saffron transition-transform ${open === i ? "rotate-45" : ""}`}>+</span>
            </button>
            <AnimatePresence initial={false}>
              {open === i && (
                <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                  <p className="pb-6 text-cream/60">{f.a}</p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        ))}
      </div>
    </section>
  );
}
