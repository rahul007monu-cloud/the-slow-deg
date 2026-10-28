"use client";

import { useRef } from "react";

/**
 * A real photo presented in 3D: the card tilts towards the pointer, the photo moves
 * on its own depth layer (parallax), a glare follows the light, and steam drifts up.
 * On touch devices it sways gently by itself.
 */
export function TiltPhoto({ src, alt, credit, children, className = "" }: { src: string; alt: string; credit?: string; children?: React.ReactNode; className?: string }) {
  const card = useRef<HTMLDivElement>(null);
  const raf = useRef(0);

  function onMove(e: React.PointerEvent) {
    if (e.pointerType !== "mouse") return;
    const el = card.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const x = (e.clientX - r.left) / r.width - 0.5;
    const y = (e.clientY - r.top) / r.height - 0.5;
    cancelAnimationFrame(raf.current);
    raf.current = requestAnimationFrame(() => {
      el.style.setProperty("--rx", `${(-y * 14).toFixed(2)}deg`);
      el.style.setProperty("--ry", `${(x * 18).toFixed(2)}deg`);
      el.style.setProperty("--gx", `${(x + 0.5) * 100}%`);
      el.style.setProperty("--gy", `${(y + 0.5) * 100}%`);
      el.style.setProperty("--px", `${(-x * 22).toFixed(1)}px`);
      el.style.setProperty("--py", `${(-y * 22).toFixed(1)}px`);
    });
  }
  function onLeave() {
    const el = card.current;
    if (!el) return;
    for (const k of ["--rx", "--ry", "--px", "--py"]) el.style.setProperty(k, "0");
  }

  return (
    <div className={`[perspective:1100px] ${className}`}>
      <div
        ref={card}
        onPointerMove={onMove}
        onPointerLeave={onLeave}
        className="tilt-card relative h-full w-full overflow-hidden rounded-[2.5rem] border border-cream/10 bg-soot shadow-[0_40px_120px_-30px_rgba(255,90,31,0.45)] transition-transform duration-300 ease-out [transform-style:preserve-3d]"
        style={{ transform: "rotateX(var(--rx,0)) rotateY(var(--ry,0))" }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={src}
          alt={alt}
          loading="lazy"
          decoding="async"
          className="kenburns absolute inset-[-6%] h-[112%] w-[112%] object-cover transition-transform duration-300 ease-out"
          style={{ translate: "var(--px,0) var(--py,0)" }}
        />
        {/* warm grade + depth */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_120%,rgba(255,90,31,0.25),transparent_55%),linear-gradient(to_top,rgba(11,8,7,0.92),rgba(11,8,7,0.05)_55%,rgba(11,8,7,0.25))]" />
        {/* glare */}
        <div className="pointer-events-none absolute inset-0 opacity-60 mix-blend-soft-light" style={{ background: "radial-gradient(circle at var(--gx,30%) var(--gy,20%), rgba(255,240,220,0.55), transparent 45%)" }} />
        <Steam />
        <div className="absolute inset-x-0 bottom-0 p-6 sm:p-8" style={{ transform: "translateZ(60px)" }}>
          {children}
        </div>
        {credit && <div className="absolute top-3 right-4 max-w-[70%] truncate text-right text-[9px] text-cream/35">Photo: {credit}</div>}
      </div>
    </div>
  );
}

function Steam() {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
      {[0, 1, 2, 3, 4].map((i) => (
        <span
          key={i}
          className="steam absolute bottom-[30%] h-40 w-24 rounded-full bg-cream/25 blur-2xl"
          style={{ left: `${18 + i * 15}%`, animationDelay: `${i * 1.3}s`, animationDuration: `${6 + (i % 3)}s` }}
        />
      ))}
    </div>
  );
}
