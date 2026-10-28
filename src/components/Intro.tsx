"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { brand } from "@/config/business";

const steps = ["Marinating for 24 hours", "Sealing the deg with dough", "Lighting the coals", "Your table is ready"];

function greeting() {
  const h = new Date().getHours();
  if (h < 5) return "Late night cravings?";
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}

/** `?for=Acme%20Corp` personalises the welcome. Send these links to corporate leads. */
function guestName() {
  const raw = new URLSearchParams(window.location.search).get("for") ?? "";
  return raw.replace(/[^\p{L}\p{N} &.'-]/gu, "").trim().slice(0, 40);
}

export function useIntroDone() {
  const [done, setDone] = useState(false);
  useEffect(() => {
    if (document.documentElement.dataset.intro === "done") return setDone(true);
    const on = () => setDone(true);
    window.addEventListener("intro-done", on);
    return () => window.removeEventListener("intro-done", on);
  }, []);
  return done;
}

export function Intro() {
  const [visible, setVisible] = useState(true);
  const [step, setStep] = useState(0);
  const [hello, setHello] = useState({ greet: "", name: "" });

  useEffect(() => {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const seen = sessionStorage.getItem("tsd-intro") === "1";
    setHello({ greet: greeting(), name: guestName() });
    if (seen || reduced) return finish();
    document.documentElement.style.overflow = "hidden";
    const timers = steps.map((_, i) => setTimeout(() => setStep(i), 450 + i * 750));
    const end = setTimeout(() => finish(), 450 + steps.length * 750 + 300);
    return () => {
      timers.forEach(clearTimeout);
      clearTimeout(end);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function finish() {
    sessionStorage.setItem("tsd-intro", "1");
    document.documentElement.style.overflow = "";
    setVisible(false);
    document.documentElement.dataset.intro = "done";
    window.dispatchEvent(new Event("intro-done"));
  }

  return (
    <AnimatePresence>
      {visible && (
        <motion.div key="intro" className="fixed inset-0 z-[100] flex items-center justify-center" exit={{ pointerEvents: "none" }}>
          {/* two halves that part like a lid lifting */}
          <motion.div className="absolute inset-x-0 top-0 h-1/2 bg-coal" exit={{ y: "-100%" }} transition={{ duration: 1.1, ease: [0.7, 0, 0.2, 1] }} />
          <motion.div className="absolute inset-x-0 bottom-0 h-1/2 bg-coal" exit={{ y: "100%" }} transition={{ duration: 1.1, ease: [0.7, 0, 0.2, 1] }} />
          <motion.div
            className="pointer-events-none absolute bottom-0 left-1/2 h-[60vh] w-[120vw] -translate-x-1/2 rounded-[50%] bg-[radial-gradient(closest-side,rgba(255,90,31,0.35),transparent)] blur-2xl"
            initial={{ opacity: 0 }}
            animate={{ opacity: [0.4, 0.8, 0.5, 0.9] }}
            exit={{ opacity: 0, transition: { duration: 0.4 } }}
            transition={{ duration: 3, repeat: Infinity, repeatType: "mirror" }}
          />

          <motion.div className="relative z-10 px-6 text-center" exit={{ opacity: 0, scale: 1.08, filter: "blur(10px)" }} transition={{ duration: 0.6 }}>
            <motion.p className="mb-3 text-xs tracking-[0.5em] text-saffron/80 uppercase" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
              {hello.greet}
            </motion.p>
            <motion.h1
              className="font-deva text-7xl text-gradient-ember sm:text-9xl"
              initial={{ opacity: 0, y: 30, filter: "blur(12px)" }}
              animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
              transition={{ duration: 1.1, ease: [0.2, 0.7, 0.2, 1] }}
            >
              आदाब
            </motion.h1>
            <motion.p className="mt-4 font-display text-2xl text-cream italic sm:text-3xl" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}>
              {hello.name ? `Welcome, ${hello.name}.` : `Welcome to ${brand.name}.`}
            </motion.p>

            <div className="mx-auto mt-10 h-px w-64 overflow-hidden bg-cream/10">
              <motion.div className="h-full bg-gradient-to-r from-saffron to-ember" initial={{ width: "0%" }} animate={{ width: `${((step + 1) / steps.length) * 100}%` }} transition={{ duration: 0.7 }} />
            </div>
            <div className="mt-4 h-5 text-xs tracking-[0.25em] text-cream/60 uppercase">
              <AnimatePresence mode="wait">
                <motion.span key={step} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.3 }}>
                  {steps[step]}…
                </motion.span>
              </AnimatePresence>
            </div>
          </motion.div>

          <button onClick={() => finish()} className="absolute bottom-6 left-6 z-10 text-xs tracking-[0.3em] text-cream/50 uppercase transition hover:text-saffron">
            Skip
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
