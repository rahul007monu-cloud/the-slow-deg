"use client";

import { useEffect, useRef } from "react";

/** Glowing ember trail behind the cursor. Desktop pointers only. */
export function EmberCursor() {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!window.matchMedia("(pointer: fine)").matches || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const c = ref.current!;
    const g = c.getContext("2d")!;
    let w = 0, h = 0, raf = 0;
    const dpr = Math.min(2, window.devicePixelRatio);
    const resize = () => {
      w = window.innerWidth;
      h = window.innerHeight;
      c.width = w * dpr;
      c.height = h * dpr;
      g.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    type P = { x: number; y: number; vx: number; vy: number; life: number; size: number };
    const ps: P[] = [];
    let mx = -100, my = -100;
    const onMove = (e: PointerEvent) => {
      mx = e.clientX;
      my = e.clientY;
      for (let i = 0; i < 2; i++) ps.push({ x: mx, y: my, vx: (Math.random() - 0.5) * 0.8, vy: -Math.random() * 1.2 - 0.2, life: 1, size: 1 + Math.random() * 2.2 });
      if (ps.length > 160) ps.splice(0, ps.length - 160);
    };
    const tick = () => {
      g.clearRect(0, 0, w, h);
      g.globalCompositeOperation = "lighter";
      for (const p of ps) {
        p.x += p.vx;
        p.y += p.vy;
        p.life -= 0.022;
        if (p.life <= 0) continue;
        const r = p.size * (1 + (1 - p.life) * 1.5);
        const grd = g.createRadialGradient(p.x, p.y, 0, p.x, p.y, r * 3);
        grd.addColorStop(0, `rgba(255,200,120,${p.life})`);
        grd.addColorStop(0.4, `rgba(255,90,31,${p.life * 0.6})`);
        grd.addColorStop(1, "rgba(255,90,31,0)");
        g.fillStyle = grd;
        g.beginPath();
        g.arc(p.x, p.y, r * 3, 0, Math.PI * 2);
        g.fill();
      }
      for (let i = ps.length - 1; i >= 0; i--) if (ps[i].life <= 0) ps.splice(i, 1);
      raf = requestAnimationFrame(tick);
    };
    tick();
    window.addEventListener("pointermove", onMove);
    window.addEventListener("resize", resize);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return <canvas ref={ref} aria-hidden className="pointer-events-none fixed inset-0 z-[70] h-full w-full" />;
}
