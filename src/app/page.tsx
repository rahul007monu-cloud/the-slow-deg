import { Intro } from "@/components/Intro";
import { Nav } from "@/components/Nav";
import { Hero } from "@/components/Hero";
import { SmoothScroll } from "@/components/SmoothScroll";
import { EmberCursor } from "@/components/EmberCursor";
import { Marquee, Stats } from "@/components/sections/Marquee";
import { Experience } from "@/components/sections/Experience";
import { Menu } from "@/components/sections/Menu";
import { Chef } from "@/components/sections/Chef";
import { Packages } from "@/components/sections/Packages";
import { Booking } from "@/components/sections/Booking";
import { Reviews } from "@/components/sections/Reviews";
import { Trust } from "@/components/sections/Trust";
import { Faq } from "@/components/sections/Faq";
import { FinalCta, Footer, WhatsAppFab } from "@/components/sections/Footer";
import { brand, faqs } from "@/config/business";

export default function Home() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "FoodEstablishment",
        name: brand.name,
        description: brand.tagline,
        servesCuisine: ["Awadhi", "Mughlai", "North Indian", "Barbecue"],
        areaServed: brand.cities,
        email: brand.email,
      },
      {
        "@type": "FAQPage",
        mainEntity: faqs.map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })),
      },
    ],
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }} />
      <SmoothScroll />
      <Intro />
      <EmberCursor />
      <Nav />
      <main>
        <Hero />
        <Marquee />
        <Stats />
        <Experience />
        <Menu />
        <Chef />
        <Packages />
        <Booking />
        <Reviews />
        <Trust />
        <Faq />
        <FinalCta />
      </main>
      <Footer />
      <WhatsAppFab />
    </>
  );
}
