"use client";

import { useEffect, useRef, useState } from "react";

/** Synthesised coal crackle using Web Audio. No audio files, off by default. */
export function FireSound() {
  const [on, setOn] = useState(false);
  const ctxRef = useRef<AudioContext | null>(null);
  const stopRef = useRef<() => void>(() => {});

  useEffect(() => () => stopRef.current(), []);

  function start() {
    const ctx = ctxRef.current ?? new AudioContext();
    ctxRef.current = ctx;
    void ctx.resume();

    // brown noise bed = the low roar of the fire
    const len = ctx.sampleRate * 3;
    const buf = ctx.createBuffer(1, len, ctx.sampleRate);
    const d = buf.getChannelData(0);
    let last = 0;
    for (let i = 0; i < len; i++) {
      last = (last + 0.02 * (Math.random() * 2 - 1)) / 1.02;
      d[i] = last * 3.5;
    }
    const bed = ctx.createBufferSource();
    bed.buffer = buf;
    bed.loop = true;
    const lp = ctx.createBiquadFilter();
    lp.type = "lowpass";
    lp.frequency.value = 500;
    const master = ctx.createGain();
    master.gain.value = 0;
    master.gain.linearRampToValueAtTime(0.5, ctx.currentTime + 1.2);
    bed.connect(lp).connect(master).connect(ctx.destination);
    bed.start();

    // random crackles = tiny filtered noise bursts
    let timer = 0;
    const crackle = () => {
      const n = ctx.createBufferSource();
      const b = ctx.createBuffer(1, 600, ctx.sampleRate);
      const cd = b.getChannelData(0);
      for (let i = 0; i < cd.length; i++) cd[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / cd.length, 4);
      n.buffer = b;
      const hp = ctx.createBiquadFilter();
      hp.type = "highpass";
      hp.frequency.value = 1500 + Math.random() * 3000;
      const g = ctx.createGain();
      g.gain.value = 0.05 + Math.random() * 0.25;
      n.connect(hp).connect(g).connect(master);
      n.start();
      timer = window.setTimeout(crackle, 40 + Math.random() * (Math.random() > 0.8 ? 600 : 180));
    };
    crackle();

    stopRef.current = () => {
      clearTimeout(timer);
      master.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.4);
      setTimeout(() => bed.stop(), 450);
    };
  }

  function toggle() {
    if (on) stopRef.current();
    else start();
    setOn(!on);
  }

  return (
    <button
      onClick={toggle}
      aria-pressed={on}
      aria-label={on ? "Mute fire sound" : "Play fire sound"}
      className="flex h-10 w-10 items-center justify-center rounded-full border border-cream/15 text-cream/70 transition hover:border-saffron hover:text-saffron"
      title="Hear the coals"
    >
      <span className="flex h-4 items-end gap-[3px]">
        {[0, 1, 2, 3].map((i) => (
          <span
            key={i}
            className="w-[3px] rounded-full bg-current"
            style={{ height: on ? undefined : 4, animation: on ? `eq 0.${6 + i}s ease-in-out ${i * 0.1}s infinite alternate` : "none" }}
          />
        ))}
      </span>
      <style>{`@keyframes eq{from{height:3px}to{height:16px}}`}</style>
    </button>
  );
}
