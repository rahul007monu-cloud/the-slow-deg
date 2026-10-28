# The Slow Deg

Website and installable app for **The Slow Deg**, a private non-veg chef for corporate events and parties.

Built with Next.js 16, React Three Fiber, Tailwind CSS v4, Motion, the AI SDK and Upstash Redis.

## What's inside

- **Greeting intro** with a time-of-day welcome. Add `?for=Company%20Name` to a link to greet a lead by name.
- **3D hero**: a dum-sealed copper deg on live coals, with real dish photos floating around it. Scrolling lifts the lid.
- **Menu with real photos** shown as 3D tilt cards with steam. Photos are credited on `/credits`.
- **Per-guest pricing** (default ₹500, minimum 20 guests) with a live calculator.
- **Booking form**: checks whether the date is free, shows a live quote, and creates a *pending* request that the chef confirms.
- **AI assistant** ("Ask AI"): answers questions, checks dates, quotes prices, creates booking requests and hands off to WhatsApp.
- **Installable app**: an "Install App" button (Android/desktop), a guide for iPhone, and offline support.
- **Admin panel** at `/admin`.

## Admin panel (`/admin`)

Only the owner can log in. From the admin panel the chef can:
- see every booking request, confirm or decline it, and WhatsApp the customer in one tap
- change the per-guest price, minimum guests, GST, advance %, WhatsApp number and alert email
- edit the menu: add or remove dishes, upload photos, reorder, hide
- block dates on a calendar so nobody can book them

## One-time setup on Vercel

1. **Database** (needed to save bookings, price and menu): Vercel project → **Storage** → Create Database → **Upstash for Redis** (free plan) → connect it to this project.
2. **Photo uploads** (optional): Storage → Create → **Blob** → connect.
3. **Admin login**: Settings → Environment Variables → add `ADMIN_EMAIL` and `ADMIN_PASSWORD` (use a long password).
4. **AI assistant**: open **AI Gateway** in the Vercel dashboard once to enable it (free monthly credits). On Vercel no API key is needed. Optionally set `AI_MODEL` to override the default `google/gemini-3.5-flash`.
5. Optional booking emails: `RESEND_API_KEY` and `BOOKING_EMAIL_FROM`. The alert address is set in the admin panel.
6. **Redeploy** (Deployments → ⋯ → Redeploy) so the new variables take effect.

## Brand content

The chef story, reviews, stats and FAQ text live in `src/config/business.ts`. Everything marked `PLACEHOLDER` must be replaced before going live. The default dish photos are Creative Commons images from Wikimedia Commons. Replace them with the chef's own photos from the admin panel.

## Run locally

```bash
npm install
npm run dev     # http://localhost:3000, data is saved to .data/store.json
```

Put `ADMIN_EMAIL`, `ADMIN_PASSWORD` and (for the AI) `AI_GATEWAY_API_KEY` in `.env.local`.
