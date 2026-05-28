# Ginko Sobe — Smoke Test Checklist

Run `npm run dev` and verify each item manually. All items must pass before deploying to production.

## 1. Core navigation

- [ ] `/` — Home page loads, hero section visible, CTA links work
- [ ] `/rooms` — Room grid renders with at least 1 card; filters (guests, price) work
- [ ] `/rooms/zelena` — Room detail renders with gallery, price table, booking CTA
- [ ] `/rooms/orah` — Renders correctly
- [ ] `/rooms/bijela` — Renders correctly
- [ ] `/booking` — Booking widget loads; date picker is interactive
- [ ] `/gallery` — All gallery sections visible; thumbnail click opens lightbox
- [ ] `/guides` — Guide listing renders
- [ ] `/guides/sto-posjetiti-u-zadru` — Guide article renders with breadcrumb JSON-LD
- [ ] Navbar links navigate correctly (all locales)
- [ ] Footer links navigate correctly

## 2. Room detail fallback

- [ ] `/rooms/nonexistent-slug` — Returns 404, custom not-found page shown
- [ ] `/en/rooms/zelena` — English locale, correct content
- [ ] `/de/rooms/zelena` — German locale, correct content

## 3. Booking error / success path

- [ ] Booking widget loads with room pre-selected when `?room=zelena` is in URL
- [ ] Submitting form with invalid data shows validation errors
- [ ] Submitting form with valid data returns mock success state
- [ ] Mock booking API `GET /api/bookings?room=zelena` returns `[]`
- [ ] Mock booking API `POST /api/bookings` returns `{ bookingId: "mock-..." }`

## 4. Consent / analytics behaviour

- [ ] On first visit (no localStorage key), cookie banner is visible
- [ ] Clicking "Prihvati" hides banner and sets `ginko_cookie_consent=accepted` in localStorage
- [ ] Clicking "Odbij" hides banner and sets `ginko_cookie_consent=declined`
- [ ] On subsequent visits, banner does not reappear
- [ ] In dev mode + accepted consent: `track()` calls log `[analytics]` to console
- [ ] In dev mode + declined consent: no `[analytics]` log output

## 5. Privacy / cookies routes

- [ ] `/privacy` — Privacy policy page loads, breadcrumb JSON-LD present
- [ ] `/cookies` — Cookies policy page loads
- [ ] Footer legal links resolve to `/privacy` and `/cookies`
- [ ] `/en/privacy` and `/de/privacy` locale re-exports work

## 6. SEO checks

- [ ] `/sitemap.xml` — Returns valid XML with all expected routes
- [ ] `/robots.txt` — Returns valid robots rules with sitemap URL
- [ ] Home page `<title>` uses template (`Ginko Sobe`)
- [ ] Rooms page `<title>` is `Naše sobe | Ginko Sobe`
- [ ] Room detail page has `BreadcrumbList` JSON-LD in `<head>`
- [ ] Guide article has `BlogPosting` JSON-LD in `<head>`
- [ ] hreflang alternates present on key pages

## 7. Error states

- [ ] Loading skeleton appears briefly on slow connections (throttle in DevTools)
- [ ] Root `error.tsx` boundary catches thrown errors (test by temporarily throwing in a page)
- [ ] `not-found.tsx` renders for all 404 paths

## 8. Performance baseline

- [ ] No layout shift on room cards (fixed aspect containers)
- [ ] First room image on `/rooms/[slug]` loads with `priority` (eager LCP)
- [ ] Gallery thumbnails load lazy except the first per section
- [ ] No console errors on any core route

---

_Last updated: 2026-05-28_
