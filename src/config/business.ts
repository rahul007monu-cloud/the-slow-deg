/**
 * Static brand content: name, chef story, reviews, stats and FAQ.
 * Price, menu, WhatsApp number and notification email are edited in the admin panel (/admin).
 * Everything marked PLACEHOLDER must be replaced with real data before going live.
 */
import type { Settings } from "@/lib/types";

export const brand = {
  name: "The Slow Deg",
  tagline: "Slow-cooked. Dum-sealed. Served at your table.",
  // PLACEHOLDER: replace with the chef's real name and story
  chefName: "The Ustaad",
  chefTitle: "Founder & Head Chef",
  // PLACEHOLDER: real service cities
  cities: ["Delhi NCR", "Mumbai", "Bengaluru", "Pune", "Hyderabad"],
  email: "bookings@theslowdeg.com", // PLACEHOLDER
  instagram: "https://instagram.com/theslowdeg", // PLACEHOLDER
};

// PLACEHOLDER: only keep promises the chef can actually honour
export const bookingPromises = ["Free tasting call", "GST invoice", "Free date change up to 7 days", "Backup chef guarantee"];

/* ----------------------------- SOCIAL PROOF ----------------------------- */
// PLACEHOLDER reviews. Do NOT go live with these. Replace with real client reviews
// (with permission) or link to your Google Business reviews.

export const reviews = [
  {
    quote: "Our annual offsite dinner was the talk of the company for weeks. The raan carving had 200 people filming on their phones.",
    name: "Head of People",
    company: "Fintech company, Gurugram",
    event: "Annual offsite · 210 guests",
    rating: 5,
  },
  {
    quote: "He arrived at 5, the coals were glowing by 6, and he was still grilling seekh at 1 AM because nobody wanted to stop.",
    name: "Founder",
    company: "SaaS startup, Bengaluru",
    event: "Series B celebration · 85 guests",
    rating: 5,
  },
  {
    quote: "The biryani unveiling, when the dough seal was broken, got a standing ovation. Our clients still ask for the chef's number.",
    name: "Client Partner",
    company: "Consulting firm, Mumbai",
    event: "Client appreciation night · 60 guests",
    rating: 5,
  },
  {
    quote: "Professional from the first call. GST invoice, clear quote, no surprises. And the nihari was better than Old Delhi.",
    name: "Admin Manager",
    company: "Manufacturing group, Noida",
    event: "Diwali dinner · 140 guests",
    rating: 5,
  },
];

// PLACEHOLDER numbers
export const stats = [
  { value: 350, suffix: "+", label: "Events served" },
  { value: 60000, suffix: "+", label: "Plates plated" },
  { value: 4.9, suffix: " / 5", label: "Average rating", decimals: 1 },
  { value: 12, suffix: " hrs", label: "Longest dum" },
];

export function faqs(s: Pick<Settings, "pricePerPerson" | "minGuests" | "gstPercent" | "advancePercent">) {
  const rate = `₹${s.pricePerPerson.toLocaleString("en-IN")}`;
  return [
    {
      q: "How much does it cost?",
      a: `${rate} per guest${s.gstPercent ? ` + ${s.gstPercent}% GST` : ""}, with a minimum of ${s.minGuests} guests. That covers the chef for your full evening. The price updates live on this page as you change the number of guests.`,
    },
    {
      q: "How long will the chef stay at our event?",
      a: "The whole evening. He arrives before your guests to set up the coals and stays until the last plate is served. There is no hourly meter.",
    },
    {
      q: "Are ingredients included?",
      a: "The per-guest price is the chef's charge. Ingredients are either arranged by you, or bought fresh by us on the morning of the event and billed at actual cost. We agree this on the call.",
    },
    {
      q: "What do we need to provide at the venue?",
      a: "A covered space of about 10×10 ft with ventilation for the coal counters, and access to water. We bring the degs, coals and grills.",
    },
    {
      q: "How do we confirm a booking?",
      a: `Send a request on the website or through the AI assistant. The chef reviews it and calls you, usually within 24 hours. A ${s.advancePercent}% advance confirms the date, and the balance is due on the event day.`,
    },
    {
      q: "Do you provide a GST invoice?",
      a: "Yes. Add your company name and GSTIN in the booking form.",
    },
    {
      q: "Can you do vegetarian dishes for some guests?",
      a: "Non-veg is our craft, but we cook a few vegetarian dishes for mixed groups, in separate degs and on separate grills.",
    },
  ];
}
