import { brand } from "@/config/business";
import { Eyebrow, Reveal } from "../ui";

// PLACEHOLDER story. Replace with the chef's real journey, training and highlights.
const highlights = [
  "Trained under Awadhi khansamas in Lucknow",
  "Spice blends roasted and ground by hand, recipes never written down",
  "Cooked for founders, CXOs and 300-guest offsites",
  "Signature 8-hour Raan and 12-hour Nalli Nihari",
];

export function Chef() {
  return (
    <section className="relative overflow-hidden border-y border-cream/10 bg-soot py-28">
      <div className="mx-auto grid max-w-7xl items-center gap-16 px-5 sm:px-8 lg:grid-cols-2">
        <Reveal>
          {/* PLACEHOLDER: replace with a real portrait, e.g. <Image src="/chef.jpg" ... /> */}
          <div className="relative mx-auto aspect-[4/5] max-w-md overflow-hidden rounded-[2.5rem] border border-cream/10 bg-[radial-gradient(circle_at_50%_100%,rgba(255,90,31,0.45),transparent_60%),linear-gradient(180deg,#1d140f,#0b0807)]">
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
              <span className="font-deva text-[10rem] leading-none text-gradient-ember">उस्ताद</span>
              <span className="mt-4 text-xs tracking-[0.4em] text-cream/40 uppercase">Chef portrait goes here</span>
            </div>
            <div className="absolute inset-x-6 bottom-6 rounded-2xl glass p-4">
              <div className="font-display text-2xl text-cream">{brand.chefName}</div>
              <div className="text-xs tracking-widest text-saffron uppercase">{brand.chefTitle}</div>
            </div>
          </div>
        </Reveal>
        <Reveal delay={0.1}>
          <Eyebrow>Meet the Chef</Eyebrow>
          <blockquote className="font-display text-4xl leading-tight text-cream italic sm:text-5xl">
            “Good meat can’t be rushed. I give it the hours it asks for, and I give your guests the night they deserve.”
          </blockquote>
          <ul className="mt-10 space-y-4">
            {highlights.map((h) => (
              <li key={h} className="flex gap-4 text-cream/70">
                <span className="mt-2 h-2 w-2 shrink-0 rounded-full bg-ember shadow-[0_0_10px_rgba(255,90,31,0.9)]" />
                {h}
              </li>
            ))}
          </ul>
        </Reveal>
      </div>
    </section>
  );
}
