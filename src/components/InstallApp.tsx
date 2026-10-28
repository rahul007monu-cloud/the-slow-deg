"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "motion/react";

type BIPEvent = Event & { prompt: () => Promise<void>; userChoice: Promise<{ outcome: "accepted" | "dismissed" }> };

/**
 * "Install App" button.
 * - Android / desktop Chrome & Edge: opens the native install prompt.
 * - iPhone / iPad Safari: shows the 2-step "Share → Add to Home Screen" guide (Apple has no install prompt).
 * Hidden when the app is already installed.
 */
export function InstallApp({ variant = "nav" }: { variant?: "nav" | "block" }) {
  const [deferred, setDeferred] = useState<BIPEvent | null>(null);
  const [installed, setInstalled] = useState(false);
  const [ios, setIos] = useState(false);
  const [showGuide, setShowGuide] = useState(false);

  useEffect(() => {
    if ("serviceWorker" in navigator && process.env.NODE_ENV === "production") {
      navigator.serviceWorker.register("/sw.js").catch(() => {});
    }
    const standalone = window.matchMedia("(display-mode: standalone)").matches || (navigator as Navigator & { standalone?: boolean }).standalone === true;
    setInstalled(standalone);
    setIos(/iphone|ipad|ipod/i.test(navigator.userAgent) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1));
    const onPrompt = (e: Event) => {
      e.preventDefault();
      setDeferred(e as BIPEvent);
    };
    const onInstalled = () => {
      setInstalled(true);
      setDeferred(null);
    };
    window.addEventListener("beforeinstallprompt", onPrompt);
    window.addEventListener("appinstalled", onInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", onPrompt);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  if (installed || (!deferred && !ios)) return null;

  async function install() {
    if (deferred) {
      await deferred.prompt();
      const { outcome } = await deferred.userChoice;
      if (outcome === "accepted") setInstalled(true);
      setDeferred(null);
    } else {
      setShowGuide(true);
    }
  }

  return (
    <>
      <button
        onClick={install}
        className={
          variant === "nav"
            ? "flex items-center gap-2 rounded-full border border-saffron/50 px-3 py-2 text-xs font-semibold text-saffron transition hover:bg-saffron hover:text-coal sm:px-4 sm:text-sm"
            : "flex w-full items-center justify-center gap-2 rounded-full border border-saffron/50 py-3 font-semibold text-saffron transition hover:bg-saffron hover:text-coal"
        }
      >
        <svg viewBox="0 0 20 20" className="h-4 w-4 fill-none stroke-current" strokeWidth="2" aria-hidden>
          <path d="M10 3v10m0 0l-4-4m4 4l4-4M4 16h12" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        Install App
      </button>
      <AnimatePresence>
        {showGuide && (
          <motion.div className="fixed inset-0 z-[90] flex items-end justify-center bg-coal/70 p-4 backdrop-blur-sm sm:items-center" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowGuide(false)}>
            <motion.div initial={{ y: 40 }} animate={{ y: 0 }} exit={{ y: 40 }} onClick={(e) => e.stopPropagation()} className="w-full max-w-sm rounded-3xl border border-cream/10 bg-soot p-6 text-cream">
              <div className="font-display text-2xl">Install The Slow Deg</div>
              <ol className="mt-4 space-y-3 text-sm text-cream/75">
                <li className="flex items-center gap-3">
                  <span className="flex h-7 w-7 items-center justify-center rounded-full bg-saffron/15 text-saffron">1</span>
                  <span className="flex items-center gap-1">
                    Tap the Share button
                    <svg viewBox="0 0 20 20" className="h-5 w-5 fill-none stroke-saffron" strokeWidth="1.8" aria-label="Share icon">
                      <path d="M10 13V3m0 0L6.5 6.5M10 3l3.5 3.5M5 10v6h10v-6" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                    in Safari
                  </span>
                </li>
                <li className="flex items-center gap-3">
                  <span className="flex h-7 w-7 items-center justify-center rounded-full bg-saffron/15 text-saffron">2</span>
                  Choose “Add to Home Screen”
                </li>
              </ol>
              <button onClick={() => setShowGuide(false)} className="mt-6 w-full rounded-full bg-gradient-to-r from-saffron to-ember py-3 font-semibold text-coal">
                Got it
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
