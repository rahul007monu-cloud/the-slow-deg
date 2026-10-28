"use client";

import dynamic from "next/dynamic";
import { useRef } from "react";
import { motion, useScroll, useTransform } from "motion/react";
import { useIntroDone } from "./Intro";
import { brand } from "@/config/business";
import { Spark } from "./ui";
import { useSite } from "./SiteData";

const HeroScene = dynamic(() => import("./three/HeroScene"), { ssr: false });

const line = {
  hidden: { opacity: 0, y: 60, rotateX: -40 },
  show: (i: number) => ({ opacity: 1, y: 0, rotateX: 0, transition: { delay: 0.15 + i * 0.12, duration: 1, ease: [0.2, 0.7, 0.2, 1] as const } }),
};

export function Hero() {
  const ref = useRef<HTMLElement>(null);
  const ready = useIntroDone();
  const { menu } = useSite();
  const photos = menu.filter((d) => d.visible && d.photo).map((d) => d.photo);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end end"] });
  const introOpacity = useTransform(scrollYProgress, [0, 0.3], [1, 0]);
  const introY = useTransform(scrollYProgress, [0, 0.3], [0, -80]);
  const revealOpacity = useTransform(scrollYProgress, [0.4, 0.6, 0.9, 1], [0, 1, 1, 0]);
  const revealY = useTransform(scrollYProgress, [0.4, 0.6], [60, 0]);
  const hintOpacity = useTransform(scrollYProgress, [0, 0.08], [1, 0]);

  return (
    <section ref={ref} id="top" className="relative h-[240vh]">
      <div className="sticky top-0 h-screen overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_60%_80%,rgba(255,90,31,0.18),transparent_60%),radial-gradient(ellipse_at_20%_10%,rgba(240,169,59,0.08),transparent_50%)]" />
        <div className="absolute inset-0">
          <HeroScene photos={photos} />
        </div>
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-coal to-transparent" />
        {/* keeps the headline readable when pieces float behind it */}
        <motion.div style={{ opacity: introOpacity }} className="pointer-events-none absolute inset-y-0 left-0 w-full bg-gradient-to-r from-coal/90 via-coal/60 to-transparent md:w-[65%]" />

        <motion.div style={{ opacity: introOpacity, y: introY }} className="relative z-10 mx-auto flex h-full max-w-7xl flex-col justify-center px-5 sm:px-8">
          <div className="max-w-2xl [perspective:800px]">
            <motion.p variants={line} custom={0} initial="hidden" animate={ready ? "show" : "hidden"} className="mb-6 text-xs font-semibold tracking-[0.4em] text-saffron uppercase">
              Private non-veg chef · Corporate events
            </motion.p>
            <h1 className="font-display drop-shadow-[0_4px_30px_rgba(0,0,0,0.8)] text-[13vw] leading-[0.92] font-semibold text-cream sm:text-7xl lg:text-8xl">
              {["The coals are lit.", "The deg is sealed."].map((t, i) => (
                <motion.span key={t} variants={line} custom={i + 1} initial="hidden" animate={ready ? "show" : "hidden"} className="block origin-bottom">
                  {t}
                </motion.span>
              ))}
              <motion.span variants={line} custom={3} initial="hidden" animate={ready ? "show" : "hidden"} className="block origin-bottom italic text-gradient-ember">
                Your party awaits.
              </motion.span>
            </h1>
            <motion.p variants={line} custom={4} initial="hidden" animate={ready ? "show" : "hidden"} className="mt-8 max-w-lg text-lg text-cream/70">
              A master of slow-cooked Awadhi and Mughlai non-veg, cooking live at your venue from the first guest to the last plate.
            </motion.p>
            <motion.div variants={line} custom={5} initial="hidden" animate={ready ? "show" : "hidden"} className="pointer-events-auto mt-10 flex flex-wrap gap-4">
              <a href="#book" className="rounded-full bg-gradient-to-r from-saffron to-ember px-8 py-4 font-semibold text-coal shadow-[0_10px_40px_-8px_rgba(255,90,31,0.7)] transition hover:scale-105">
                Book the Chef
              </a>
              <a href="#menu" className="rounded-full border border-cream/20 px-8 py-4 font-semibold text-cream transition hover:border-saffron hover:text-saffron">
                See the menu
              </a>
            </motion.div>
            <motion.ul variants={line} custom={6} initial="hidden" animate={ready ? "show" : "hidden"} className="mt-10 flex flex-wrap items-center gap-x-6 gap-y-2 text-xs tracking-wider text-cream/50 uppercase">
              <li className="flex items-center gap-2"><Spark /> Until the last plate</li>
              <li className="flex items-center gap-2"><Spark /> GST invoice</li>
              <li className="flex items-center gap-2"><Spark /> {brand.cities.slice(0, 3).join(" · ")}</li>
            </motion.ul>
          </div>
        </motion.div>

        <motion.div style={{ opacity: revealOpacity, y: revealY }} className="pointer-events-none absolute inset-x-0 bottom-[12vh] z-10 px-5 text-center">
          <p className="font-deva text-3xl text-saffron sm:text-4xl">दम खुला</p>
          <p className="mt-2 font-display text-4xl text-cream italic sm:text-6xl">The seal breaks. The aroma fills the room.</p>
          <p className="mt-4 text-sm tracking-[0.3em] text-cream/50 uppercase">That moment happens live, at your event</p>
        </motion.div>

        <motion.div style={{ opacity: hintOpacity }} className="absolute bottom-8 left-1/2 z-10 -translate-x-1/2 text-center text-[10px] tracking-[0.4em] text-cream/40 uppercase">
          Scroll to lift the lid
          <motion.div className="mx-auto mt-3 h-10 w-px bg-gradient-to-b from-saffron to-transparent" animate={{ scaleY: [0.3, 1, 0.3] }} transition={{ duration: 2, repeat: Infinity }} />
        </motion.div>
      </div>
    </section>
  );
}
