# Ginko Sobe — ginko-sobe.com

Next.js 16 web app for Ginko Sobe private accommodation (Zadar, Croatia).

## Tech stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16.2 (App Router, Turbopack) |
| Language | TypeScript 5 strict |
| i18n | next-intl 4 — Croatian (default), English, German |
| Styling | Tailwind CSS 4 + CSS custom properties |
| Icons | lucide-react |
| Deployment | Vercel |

## Quick start

```bash
# Install dependencies
npm install

# Copy env file and fill in values
cp .env.local.example .env.local

# Run dev server
npm run dev          # http://localhost:3000

# Production build
npm run build

# Lint
npm run lint
```

## Environment variables

| Variable | Required | Description |
|---|---|---|
| `NEXT_PUBLIC_SITE_URL` | Yes | Canonical site URL (e.g. `https://ginko-sobe.com`) |
| Public contact email | — | Fixed as `info@ginko-sobe.com` in `booking.config.ts` |
| `CONTACT_PHONE` | No | Contact phone for structured data |

## Project structure

```
src/
├── app/                      # Next.js App Router pages + API routes
│   ├── (public)/             # Public-facing routes (layout: Navbar + Footer)
│   │   ├── page.tsx          # Home
│   │   ├── rooms/            # Room listing + detail
│   │   ├── booking/          # Booking widget
│   │   ├── gallery/          # Photo gallery
│   │   ├── guides/           # SEO guides hub + articles
│   │   ├── privacy/          # Privacy policy
│   │   └── cookies/          # Cookies policy
│   ├── [locale]/             # Locale re-exports (en, de)
│   └── api/bookings/         # Mock booking API
├── components/hotel/         # Domain UI components
├── i18n/                     # next-intl routing, metadata helpers
├── lib/                      # Utilities (siteUrl, consent)
├── modules/
│   ├── rooms/                # Room data, types, service
│   ├── booking/              # Booking types, dates, pricing, mock repo
│   ├── seo/                  # Guides, landing types, seo-nav-links
│   ├── gallery/              # Gallery types, categories, mock repo, service
│   └── analytics/            # Typed event definitions, consent-gated tracker
└── messages/                 # Translation files: hr.json, en.json, de.json
```

## Phases completed

| Phase | Description | Status |
|---|---|---|
| 1 | Project foundation (Next.js, i18n, layout, navigation) | ✅ |
| 2 | Rooms domain (listing, detail, gallery, filters) | ✅ |
| 3 | Booking flow baseline (widget, calendar, mock API) | ✅ |
| 4 | SEO architecture (metadata, sitemap, InternalLinks, guides) | ✅ |
| 5 | Gallery/media architecture (GalleryGrid, lightbox, room images) | ✅ |
| 6 | Production hardening (error states, analytics, consent, privacy) | ✅ |
| 7 | Backend integration (Supabase bookings) | 🔜 |
| 8 | Payments (Saferpay) | ✅ |

## Key routes

| URL | Description |
|---|---|
| `/` | Home page |
| `/rooms` | Room listing with filters |
| `/rooms/zelena` | Room detail with gallery + booking CTA |
| `/booking` | Booking widget |
| `/gallery` | Full property gallery |
| `/guides` | SEO guides hub |
| `/guides/sto-posjetiti-u-zadru` | Sample guide article |
| `/privacy` | Privacy policy |
| `/cookies` | Cookies policy |
| `/sitemap.xml` | Sitemap |
| `/robots.txt` | Robots |

## Mock data

Room images use Unsplash URLs. The booking API (`/api/bookings`) returns a mock booking ID.
Replace both in Phase 7 with real Supabase data.

## Analytics

Events are dispatched via `track()` in `src/modules/analytics/analytics.service.ts`.
Events are silently dropped unless the user accepts analytics cookies via `CookieBanner`.
Swap the console.log in `track()` for your analytics provider (GA4, Plausible, PostHog, etc.).
