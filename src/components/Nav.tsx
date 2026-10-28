"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { brand } from "@/config/business";
import { FireSound } from "./FireSound";
import { useWhatsApp } from "./SiteData";
import { InstallApp } from "./InstallApp";

const links = [
  { href: "#experience", label: "The Experience" },
  { href: "#menu", label: "Menu" },
  { href: "#pricing", label: "Pricing" },
  { href: "#reviews", label: "Reviews" },
  { href: "#faq", label: "FAQ" },
];

export function Logo({ className = "" }: { className?: string }) {
  return (
    <a href="#top" className={`group flex items-center gap-3 ${className}`} aria-label={brand.name}>
      <svg viewBox="0 0 64 64" className="h-9 w-9" aria-hidden>
        <path d="M18 14c0-4 3-6 3-10M32 12c0-4 3-6 3-10M46 14c0-4 3-6 3-10" stroke="#f3e7d3" strokeOpacity=".5" strokeWidth="2.5" fill="none" strokeLinecap="round" className="origin-bottom transition group-hover:-translate-y-0.5" />
        <ellipse cx="32" cy="24" rx="20" ry="4" fill="#f0a93b" />
        <path d="M13 25c-1.5 17 7 28 19 28s20.5-11 19-28c-5 2.5-12 3.5-19 3.5S18 27.5 13 25z" fill="#c27a45" />
        <path d="M10 57h44" stroke="#ff5a1f" strokeWidth="3" strokeLinecap="round" />
      </svg>
      <span className="leading-none">
        <span className="block font-display text-xl font-semibold tracking-wide text-cream">The Slow Deg</span>
        <span className="block text-[10px] tracking-[0.35em] text-saffron/80 uppercase">Dum · Coal · Craft</span>
      </span>
    </a>
  );
}

export function Nav() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const whatsappLink = useWhatsApp();
  useEffect(() => {
    const on = () => setScrolled(window.scrollY > 40);
    on();
    window.addEventListener("scroll", on, { passive: true });
    return () => window.removeEventListener("scroll", on);
  }, []);

  return (
    <header className={`fixed inset-x-0 top-0 z-50 transition-all duration-500 ${scrolled ? "bg-coal/70 py-3 backdrop-blur-xl" : "py-6"}`}>
      <nav className="mx-auto flex max-w-7xl items-center justify-between px-5 sm:px-8">
        <Logo />
        <ul className="hidden items-center gap-8 lg:flex">
          {links.map((l) => (
            <li key={l.href}>
              <a href={l.href} className="text-sm text-cream/70 transition hover:text-saffron">
                {l.label}
              </a>
            </li>
          ))}
        </ul>
        <div className="flex items-center gap-3">
          <InstallApp />
          <FireSound />
          <a href="#book" className="hidden rounded-full bg-gradient-to-r from-saffron to-ember px-5 py-2.5 text-sm font-semibold text-coal shadow-[0_8px_30px_-6px_rgba(255,90,31,0.6)] transition hover:scale-105 sm:inline-block">
            Book the Chef
          </a>
          <button onClick={() => setOpen(!open)} className="flex h-10 w-10 flex-col items-center justify-center gap-1.5 lg:hidden" aria-label="Menu" aria-expanded={open}>
            <span className={`h-px w-6 bg-cream transition ${open ? "translate-y-[3.5px] rotate-45" : ""}`} />
            <span className={`h-px w-6 bg-cream transition ${open ? "-translate-y-[3.5px] -rotate-45" : ""}`} />
          </button>
        </div>
      </nav>
      <AnimatePresence>
        {open && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="mx-4 mt-3 rounded-3xl glass p-6 lg:hidden">
            <ul className="space-y-4">
              {[...links, { href: "#book", label: "Book the Chef" }].map((l) => (
                <li key={l.href}>
                  <a href={l.href} onClick={() => setOpen(false)} className="font-display text-2xl text-cream">
                    {l.label}
                  </a>
                </li>
              ))}
              <li>
                <a href={whatsappLink("Hi! I'd like to book The Slow Deg for an event.")} target="_blank" rel="noopener" className="text-saffron">
                  WhatsApp the chef
                </a>
              </li>
            </ul>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
