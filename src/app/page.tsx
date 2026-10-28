import { Intro } from "@/components/Intro";
import { Nav } from "@/components/Nav";
import { Hero } from "@/components/Hero";
import { SmoothScroll } from "@/components/SmoothScroll";
import { EmberCursor } from "@/components/EmberCursor";
import { SiteDataProvider } from "@/components/SiteData";
import { ChatWidget } from "@/components/ChatWidget";
import { Marquee, Stats } from "@/components/sections/Marquee";
import { Experience } from "@/components/sections/Experience";
import { Menu } from "@/components/sections/Menu";
import { Chef } from "@/components/sections/Chef";
import { Pricing } from "@/components/sections/Pricing";
import { Booking } from "@/components/sections/Booking";
import { Reviews } from "@/components/sections/Reviews";
import { Trust } from "@/components/sections/Trust";
import { Faq } from "@/components/sections/Faq";
import { FinalCta, Footer, WhatsAppFab } from "@/components/sections/Footer";
import { brand, faqs } from "@/config/business";
import { getMenu, getSettings } from "@/lib/store";

// Re-rendered whenever the chef saves changes in the admin panel (revalidatePath), and hourly as a fallback.
export const revalidate = 3600;

export default async function Home() {
  const [settings, menu] = await Promise.all([getSettings(), getMenu()]);
  const { notifyEmail: _private, ...publicSettings } = settings;
  void _private;

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
        priceRange: `₹${settings.pricePerPerson} per guest`,
      },
      {
        "@type": "FAQPage",
        mainEntity: faqs(settings).map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })),
      },
    ],
  };

  return (
    <SiteDataProvider value={{ settings: publicSettings, menu }}>
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
        <Pricing />
        <Booking />
        <Reviews />
        <Trust />
        <Faq />
        <FinalCta />
      </main>
      <Footer />
      <WhatsAppFab />
      <ChatWidget />
    </SiteDataProvider>
  );
}
