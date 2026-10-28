/**
 * ONE FILE TO EDIT THE WHOLE BUSINESS.
 * Prices, menu, packages, reviews, FAQ and contact details all live here.
 * Everything marked PLACEHOLDER must be replaced with real data before going live.
 */

export type PieceKind = "drumstick" | "seekh" | "tikka" | "chop" | "raan" | "fish";

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
  // Digits only, international format. Set NEXT_PUBLIC_WHATSAPP_NUMBER on Vercel.
  whatsapp: process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || "910000000000",
  currency: "INR",
  gstRate: 0.18, // confirm the applicable rate with your CA
  advancePercent: 30,
  minNoticeDays: 3,
};

export type Dish = {
  id: string;
  name: string;
  hindi: string;
  description: string;
  hours: string; // how long it slow-cooks
  piece: PieceKind;
  heat: 1 | 2 | 3;
  signature?: boolean;
};

export const dishes: Dish[] = [
  {
    id: "raan",
    name: "Raan-e-Sikandari",
    hindi: "रान",
    description: "Whole leg of goat marinated for 24 hours, slow-roasted until it falls off the bone. Carved live in front of your guests.",
    hours: "8 hrs",
    piece: "raan",
    heat: 2,
    signature: true,
  },
  {
    id: "seekh",
    name: "Coal-fired Seekh Kebab",
    hindi: "सीख़",
    description: "Hand-minced mutton with fresh herbs and the chef's own garam masala, grilled over live coals at your venue.",
    hours: "Live",
    piece: "seekh",
    heat: 2,
    signature: true,
  },
  {
    id: "tangdi",
    name: "Tandoori Tangdi",
    hindi: "टंगड़ी",
    description: "Chicken drumsticks in a hung-curd and Kashmiri chilli marinade, charred in the tandoor and finished with smoked butter.",
    hours: "Live",
    piece: "drumstick",
    heat: 3,
  },
  {
    id: "tikka",
    name: "Murgh Malai Tikka",
    hindi: "टिक्का",
    description: "Boneless chicken in cream, cheese and green cardamom, threaded with onion and peppers. Gentle heat, rich flavour.",
    hours: "Live",
    piece: "tikka",
    heat: 1,
  },
  {
    id: "chops",
    name: "Burrah Chops",
    hindi: "चॉप्स",
    description: "Lamb chops in a double marinade of raw papaya and spices, seared hard and rested for a juicy pink centre.",
    hours: "6 hrs",
    piece: "chop",
    heat: 2,
    signature: true,
  },
  {
    id: "fish",
    name: "Amritsari Fish Tikka",
    hindi: "मछली",
    description: "Ajwain-spiced fish in a carom and gram flour coat, cooked over coal and finished with lemon and chaat masala.",
    hours: "Live",
    piece: "fish",
    heat: 2,
  },
];

/** Biryani / curries shown in the menu list (no 3D piece, cooked in the deg itself). */
export const degDishes = [
  { name: "Lucknowi Dum Biryani", note: "Sealed with dough, cooked on dum for 4 hours" },
  { name: "Nalli Nihari", note: "Bone marrow stew, simmered overnight" },
  { name: "Mutton Korma", note: "Cashew, saffron, kewra" },
  { name: "Butter Chicken", note: "Tandoor chicken, smoked tomato makhani" },
  { name: "Galouti Kebab", note: "Melt-in-the-mouth, 160 spice legend" },
  { name: "Shahi Tukda & Phirni", note: "Dessert to close the night" },
];

/* ----------------------------- PRICING ----------------------------- */
// PLACEHOLDER prices. Change them here and the whole site updates.

export type Package = {
  id: string;
  name: string;
  guests: [number, number];
  basePrice: number; // includes `includedHours`
  includedHours: number;
  extraHourPrice: number;
  hourlyRate: number; // used by the pure "per hour" pricing model
  team: string;
  perks: string[];
  featured?: boolean;
};

export const packages: Package[] = [
  {
    id: "dum",
    name: "The Dum Experience",
    guests: [10, 40],
    basePrice: 30000,
    includedHours: 5,
    extraHourPrice: 4000,
    hourlyRate: 6500,
    team: "Chef + 1 assistant",
    perks: ["Choose 4 dishes", "1 live coal counter", "Deg & equipment included", "Kitchen left spotless"],
  },
  {
    id: "royal",
    name: "The Royal Deg",
    guests: [41, 120],
    basePrice: 55000,
    includedHours: 5,
    extraHourPrice: 6000,
    hourlyRate: 11000,
    team: "Chef + 3 crew",
    perks: ["Choose 6 dishes", "2 live counters", "Live Raan carving", "Pre-event tasting call", "Kitchen left spotless"],
    featured: true,
  },
  {
    id: "nawabi",
    name: "The Nawabi Banquet",
    guests: [121, 300],
    basePrice: 95000,
    includedHours: 5,
    extraHourPrice: 9000,
    hourlyRate: 18000,
    team: "Chef + 6 crew",
    perks: ["Choose 8 dishes", "3 live counters", "Raan + Dum Biryani unveiling", "In-person tasting", "Dedicated event manager"],
  },
];

export const hourlyMinHours = 4;

export type PlateTier = { id: string; name: string; pricePerPlate: number; dishes: number; minGuests: number };

export const plateTiers: PlateTier[] = [
  { id: "classic", name: "Classic", pricePerPlate: 1100, dishes: 4, minGuests: 30 },
  { id: "signature", name: "Signature", pricePerPlate: 1600, dishes: 6, minGuests: 30 },
  { id: "royal", name: "Royal", pricePerPlate: 2400, dishes: 8, minGuests: 30 },
];

export type AddOn = { id: string; name: string; price: number; per: "event" | "guest" };

export const addOns: AddOn[] = [
  { id: "raan", name: "Extra live Raan carving", price: 8500, per: "event" },
  { id: "tandoor", name: "Live tandoor counter", price: 12000, per: "event" },
  { id: "dessert", name: "Dessert course (Shahi Tukda, Phirni)", price: 150, per: "guest" },
  { id: "staff", name: "Serving staff & crockery", price: 120, per: "guest" },
  { id: "bar", name: "Mocktail & sherbet bar", price: 180, per: "guest" },
];

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

export const faqs = [
  {
    q: "How long will the chef stay at our event?",
    a: "As long as your party runs. Every package includes 5 hours on site. After that, extra hours are billed at the package's hourly rate, on actuals. We never pack up while guests are still eating.",
  },
  {
    q: "Do you charge per event, per hour or per plate?",
    a: "All three. A package includes 5 hours on site with a fixed extra-hour rate. Per hour suits short, focused events. Per plate suits large corporate events where headcount drives cost, and the chef stays until service ends. The booking form compares all three instantly.",
  },
  {
    q: "What do we need to provide at the venue?",
    a: "A covered space of about 10×10 ft with ventilation for the coal counters, and access to water. We bring the degs, coals, grills, raw ingredients and our crew. Serving staff and crockery are optional add-ons.",
  },
  {
    q: "Do you provide a GST invoice?",
    a: "Yes. Every corporate booking gets a proper GST invoice. Add your company name and GSTIN in the booking form.",
  },
  {
    q: "How do we confirm a booking?",
    a: `Send the request, and the chef calls you within 24 hours to finalise the menu. A ${brand.advancePercent}% advance confirms the date. The balance is due on the event day.`,
  },
  {
    q: "Can you do vegetarian dishes for some guests?",
    a: "Non-veg is our craft, but we always cook a few vegetarian dishes for mixed groups, such as paneer tikka, dal makhani and subz biryani, in separate degs and on separate grills.",
  },
  {
    q: "Is the meat halal? Where is it sourced?",
    a: "All meat is sourced fresh on the morning of the event from trusted, licensed butchers. Halal is available on request.",
  },
];
