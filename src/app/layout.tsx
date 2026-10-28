import type { Metadata, Viewport } from "next";
import { Cormorant_Garamond, Manrope, Tiro_Devanagari_Hindi } from "next/font/google";
import "./globals.css";
import { brand } from "@/config/business";

const display = Cormorant_Garamond({ subsets: ["latin"], weight: ["400", "500", "600", "700"], style: ["normal", "italic"], variable: "--nf-display" });
const sans = Manrope({ subsets: ["latin"], variable: "--nf-sans" });
const deva = Tiro_Devanagari_Hindi({ subsets: ["devanagari", "latin"], weight: "400", variable: "--nf-deva" });

export const metadata: Metadata = {
  title: `${brand.name} · Private Chef for Corporate Events & Parties`,
  description:
    "Book a master non-veg chef for your corporate event. Dum biryani, live seekh, raan carving and slow-cooked Awadhi classics, cooked live at your venue for as long as the party runs.",
  applicationName: brand.name,
  manifest: "/manifest.webmanifest",
  openGraph: {
    title: brand.name,
    description: brand.tagline,
    type: "website",
  },
  appleWebApp: { capable: true, title: brand.name, statusBarStyle: "black-translucent" },
};

export const viewport: Viewport = {
  themeColor: "#0b0807",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${display.variable} ${sans.variable} ${deva.variable}`}>
      <body className="grain">{children}</body>
    </html>
  );
}
