"use client";

import { useRef } from "react";
import { motion, useScroll, useTransform } from "motion/react";
import { Eyebrow, Reveal, SectionTitle, Spark } from "../ui";

const timeline = [
  { time: "T – 48 hrs", title: "The marinade begins", text: "Raan goes into its 24-hour marinade. Masalas are hand-roasted and ground fresh for your event, never from a packet." },
  { time: "4:00 PM", title: "The crew arrives", text: "We set up the degs, grills and live coal counters at your venue. You don't lift a finger." },
  { time: "7:00 PM", title: "Fire meets meat", text: "Guests walk in to the smell of seekh and tikka hitting live coals. The counters become the centre of the party." },
  { time: "9:00 PM", title: "The Unveiling", text: "The dough seal on the biryani deg is broken in front of everyone. Steam, saffron, applause. Phones come out." },
  { time: "Until late", title: "No clock on the dum", text: "We stay as long as your party runs. Hours beyond the package are billed on actuals at a rate you agreed upfront." },
  { time: "After", title: "Spotless exit", text: "Your venue is left cleaner than we found it. Event photos of the food land in your inbox the next morning." },
];

export function Experience() {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start 70%", "end 60%"] });
  const h = useTransform(scrollYProgress, [0, 1], ["0%", "100%"]);

  return (
    <section id="experience" className="relative mx-auto max-w-7xl px-5 py-28 sm:px-8">
      <div className="grid gap-16 lg:grid-cols-[1fr_1.2fr]">
        <div className="lg:sticky lg:top-32 lg:self-start">
          <Reveal>
            <Eyebrow>The Experience</Eyebrow>
            <SectionTitle>
              One evening.
              <br />
              <span className="italic text-gradient-ember">A chef who stays.</span>
            </SectionTitle>
            <p className="mt-6 max-w-md text-lg text-cream/65">
              Caterers drop off trays. We bring a live kitchen to your event and cook through the night. Your guests watch the craft, smell the coals, and eat it seconds off the fire.
            </p>
            <div className="mt-10 grid max-w-md grid-cols-2 gap-4 text-sm">
              {["Live coal counters", "Dum biryani unveiling", "Raan carving show", "Chef meets your guests"].map((t) => (
                <div key={t} className="flex items-center gap-3 rounded-2xl glass px-4 py-3 text-cream/80">
                  <Spark />
                  {t}
                </div>
              ))}
            </div>
          </Reveal>
        </div>

        <div ref={ref} className="relative pl-10">
          <div className="absolute top-0 bottom-0 left-[7px] w-px bg-cream/10" />
          <motion.div style={{ height: h }} className="absolute top-0 left-[7px] w-px bg-gradient-to-b from-saffron via-ember to-chili shadow-[0_0_12px_rgba(255,90,31,0.8)]" />
          <ol className="space-y-14">
            {timeline.map((s, i) => (
              <li key={s.time} className="relative">
                <span className="absolute top-2 -left-10 h-4 w-4 rounded-full border-2 border-ember bg-coal shadow-[0_0_14px_rgba(255,90,31,0.8)]" />
                <Reveal delay={i * 0.03}>
                  <div className="text-xs font-semibold tracking-[0.3em] text-saffron uppercase">{s.time}</div>
                  <h3 className="mt-2 font-display text-3xl text-cream">{s.title}</h3>
                  <p className="mt-2 max-w-lg text-cream/60">{s.text}</p>
                </Reveal>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </section>
  );
}
