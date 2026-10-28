# The Slow Deg

Website and installable web app for **The Slow Deg**, a private non-veg chef for corporate events and parties.

Built with Next.js 16 (App Router), React Three Fiber for the 3D scenes, Tailwind CSS v4, Motion and Lenis.

## What's inside

- **Greeting intro**: time-of-day welcome ("आदाब"), with a curtain that opens like a lid. Add `?for=Company%20Name` to any link to greet a corporate lead by name.
- **3D hero**: a copper deg sealed with dough, sitting on glowing coals with steam and embers. Seekh, tangdi, tikka, chops, fish tikka and raan float around it. Scrolling lifts the lid and breaks the seal.
- **3D menu viewer**: tap a dish, drag to rotate it. All meat pieces are procedural geometry, so there are no model files to load.
- **Evening timeline**: what happens from the marinade to the spotless exit.
- **Packages**: package (5 hrs + extra hours), per hour, and per plate pricing.
- **Booking wizard**: 4 steps with a live quote (GST and advance included). It compares all 3 pricing models side by side, and the success screen offers WhatsApp confirmation and an "Add to calendar" (.ics) download.
- Reviews, corporate trust section, FAQ (with FAQ structured data for Google), a WhatsApp button, optional coal-crackle sound, an ember cursor trail, and a PWA manifest so it can be installed on a phone.

## Edit the business details

Everything lives in **`src/config/business.ts`**: prices, packages, add-ons, dishes, reviews, stats, FAQ, cities and contact details. Every value marked `PLACEHOLDER` must be replaced before going live, especially the reviews, stats, chef story and certifications.

## Run locally

```bash
npm install
npm run dev     # http://localhost:3000
npm run build   # production build
```

## Deploy on Vercel

1. Import this repo on [vercel.com/new](https://vercel.com/new). The framework is auto-detected as Next.js.
2. Add the environment variables from `.env.example`:
   - `NEXT_PUBLIC_WHATSAPP_NUMBER`: the chef's number, digits only, e.g. `919812345678`
   - `RESEND_API_KEY`, `BOOKING_EMAIL_TO`, `BOOKING_EMAIL_FROM` (optional): email every booking request via [Resend](https://resend.com). Without them, bookings are accepted and only logged on Vercel.
3. Deploy.

## Booking API

`POST /api/book` validates the request with Zod, rejects dates closer than `minNoticeDays`, recalculates the price on the server (the client's price is never trusted), and emails the request if Resend is configured. A hidden honeypot field filters basic spam bots.
