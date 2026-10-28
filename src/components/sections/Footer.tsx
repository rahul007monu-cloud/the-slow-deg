import { brand } from "@/config/business";
import { whatsappLink } from "@/lib/links";
import { Logo } from "../Nav";

export function FinalCta() {
  return (
    <section className="relative overflow-hidden py-32 text-center">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_100%,rgba(255,90,31,0.35),transparent_60%)]" />
      <div className="relative mx-auto max-w-4xl px-5">
        <p className="font-deva text-4xl text-saffron">दावत तैयार है</p>
        <h2 className="mt-4 font-display text-5xl leading-tight font-semibold text-cream sm:text-7xl">
          The feast is ready.
          <br />
          <span className="italic text-gradient-ember">Is your date?</span>
        </h2>
        <p className="mx-auto mt-6 max-w-lg text-cream/60">Weekends in the festive season fill up 6–8 weeks ahead. Lock yours today.</p>
        <div className="mt-10 flex flex-wrap justify-center gap-4">
          <a href="#book" className="rounded-full bg-gradient-to-r from-saffron to-ember px-10 py-4 font-semibold text-coal shadow-[0_10px_40px_-8px_rgba(255,90,31,0.7)] transition hover:scale-105">
            Book the Chef
          </a>
          <a href={whatsappLink("Hi! I'd like to book The Slow Deg for an event.")} target="_blank" rel="noopener" className="rounded-full border border-cream/20 px-10 py-4 font-semibold text-cream transition hover:border-[#25D366] hover:text-[#25D366]">
            WhatsApp the chef
          </a>
        </div>
      </div>
    </section>
  );
}

export function Footer() {
  return (
    <footer className="border-t border-cream/10 bg-coal">
      <div className="mx-auto grid max-w-7xl gap-10 px-5 py-16 sm:px-8 md:grid-cols-3">
        <div>
          <Logo />
          <p className="mt-4 max-w-xs text-sm text-cream/50">{brand.tagline}</p>
        </div>
        <div className="text-sm text-cream/60">
          <div className="mb-3 text-xs tracking-[0.3em] text-saffron uppercase">We cook in</div>
          {brand.cities.join(" · ")}
        </div>
        <div className="space-y-2 text-sm text-cream/60">
          <div className="mb-3 text-xs tracking-[0.3em] text-saffron uppercase">Talk to us</div>
          <a href={`mailto:${brand.email}`} className="block hover:text-saffron">
            {brand.email}
          </a>
          <a href={whatsappLink("Hi!")} target="_blank" rel="noopener" className="block hover:text-saffron">
            WhatsApp
          </a>
          <a href={brand.instagram} target="_blank" rel="noopener" className="block hover:text-saffron">
            Instagram
          </a>
        </div>
      </div>
      <div className="border-t border-cream/5 py-6 text-center text-xs text-cream/30">© {new Date().getFullYear()} {brand.name}. Cooked slow, served with love.</div>
    </footer>
  );
}

export function WhatsAppFab() {
  return (
    <a
      href={whatsappLink("Hi! I'd like to book The Slow Deg for an event.")}
      target="_blank"
      rel="noopener"
      aria-label="Chat on WhatsApp"
      className="fixed right-5 bottom-5 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-[#25D366] shadow-[0_10px_30px_-5px_rgba(37,211,102,0.6)] transition hover:scale-110"
    >
      <svg viewBox="0 0 24 24" className="h-7 w-7 fill-coal" aria-hidden>
        <path d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2Zm0 18.2a8.2 8.2 0 0 1-4.2-1.2l-.3-.2-3 .8.8-2.9-.2-.3A8.2 8.2 0 1 1 12 20.2Zm4.5-6.1c-.2-.1-1.5-.7-1.7-.8s-.4-.1-.6.1-.7.8-.8 1-.3.2-.5.1a6.7 6.7 0 0 1-3.3-2.9c-.3-.4.3-.4.7-1.3.1-.2 0-.3 0-.4l-.8-1.8c-.2-.5-.4-.4-.6-.4h-.5a1 1 0 0 0-.7.3 3 3 0 0 0-.9 2.2 5.2 5.2 0 0 0 1.1 2.7 11.8 11.8 0 0 0 4.5 4c1.7.7 2.3.8 3.2.6a2.7 2.7 0 0 0 1.8-1.2 2.2 2.2 0 0 0 .1-1.3c0-.1-.2-.2-.4-.3Z" />
      </svg>
    </a>
  );
}
