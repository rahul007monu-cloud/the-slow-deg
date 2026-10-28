import { Eyebrow, Reveal, SectionTitle } from "../ui";

// PLACEHOLDER: only claim certifications the business actually holds (e.g. FSSAI licence number).
const items = [
  { icon: "🧾", title: "GST invoice, PO-friendly", text: "Proper invoicing, vendor onboarding documents and purchase-order support for your finance team." },
  { icon: "🛡️", title: "FSSAI-registered kitchen", text: "Licensed, insured, and audited for hygiene. Crew in uniform, gloves and hair nets at every counter." },
  { icon: "🥩", title: "Meat bought that morning", text: "Sourced fresh from licensed butchers on the day of your event. Halal on request." },
  { icon: "🧑‍🍳", title: "Backup chef guarantee", text: "If the chef is ever unwell, a trained senior from his kitchen takes over. Your date is never at risk." },
  { icon: "📸", title: "Content-ready moments", text: "Raan carving and dum unveiling are timed for your event photographer. Food photos shared the next day." },
  { icon: "🧽", title: "Spotless exit", text: "We clean the cooking area and take every bit of waste with us. Your venue is left as we found it." },
];

export function Trust() {
  return (
    <section className="border-y border-cream/10 bg-soot py-28">
      <div className="mx-auto max-w-7xl px-5 sm:px-8">
        <Reveal className="max-w-2xl">
          <Eyebrow>Why companies book us</Eyebrow>
          <SectionTitle>
            Built for <span className="italic text-gradient-ember">corporate</span> events.
          </SectionTitle>
        </Reveal>
        <div className="mt-14 grid gap-px overflow-hidden rounded-[2rem] border border-cream/10 bg-cream/10 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((it, i) => (
            <Reveal key={it.title} delay={i * 0.05} className="bg-soot">
              <div className="h-full p-8 transition hover:bg-ash/60">
                <div className="text-3xl">{it.icon}</div>
                <h3 className="mt-4 font-display text-2xl text-cream">{it.title}</h3>
                <p className="mt-2 text-sm text-cream/55">{it.text}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
