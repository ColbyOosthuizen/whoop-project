# cab230-rentals — Attack Plan

Synthesized from a 5-agent audit (Architect, QA, Security, Reviewer, Debug).
Phase 1 and Phase 2 stabilisation work has started. Keep this checklist updated as fixes land.

**KEY FINDING:** AG Grid v35 auto-injects its own CSS at runtime — NOT a bug. No manual CSS import needed.

---

## PHASE 1 — CSS Surgery
*Do this first. Everything looks broken until it's done.*

- [x] Strip `src/index.css` to just `body { margin: 0; }` — boilerplate is fighting Bootstrap (`#root` width/alignment, 18px base font, h1/h2 overrides, `color-scheme: light dark`)
- [x] Delete `src/App.css` entirely — Vite boilerplate, not imported anywhere
- [x] Delete unused scaffold assets: `src/assets/react.svg`, `vite.svg`, `hero.png`
- [x] Move Leaflet CSS from CDN to `import 'leaflet/dist/leaflet.css'` in `main.jsx` — currently CSS from CDN + assets from npm = version mismatch risk

---

## PHASE 2 — Bootstrap + Navigation Fixes
*Broken flows a marker hits in the first 60 seconds.*

- [x] Add Bootstrap JS to `index.html` — `<script src="cdn.../bootstrap@5.3.3/dist/js/bootstrap.bundle.min.js">` before `</body>` — mobile hamburger does nothing without it
- [x] Fix `ProtectedRoute` — add `state={{ from: location.pathname }}` to Navigate redirect
- [x] Fix `LoginPage` — replace `navigate(-1)` with `navigate(location.state?.from ?? '/', { replace: true })` — current code can exit the app or loop back to `/register`
- [x] Add 404 catch-all `<Route path="*">` in `src/App.jsx` — undefined paths show blank page

---

## PHASE 3 — Service Layer Refactor + API Verification
*Can't fix data bugs without knowing what the API actually returns.*

- [x] Extract `BASE_URL` to shared config or `.env` — same IP hardcoded in all 3 service files (clearest DRY violation a marker will see)
- [x] Extract `handleResponse` to `src/services/apiUtils.js` — identical 7-line function copy-pasted in all 3 service files
- [ ] Hit live API and verify ALL response shapes:
  - [x] `GET /rentals/states` — returns array of state labels, including `Qld`
  - [x] `GET /rentals/property-types` — returns array of lowercase property type labels
  - [x] `GET /rentals/search?state=Qld&page=1` — returns `{ data, pagination }`
  - [x] `GET /rentals/:id` — returns a single rental object
  - `POST /user/login`
  - `POST /user/register`
  - `GET /ratings`
  - `GET /ratings/rentals/:id`
- [ ] Fix response fallback chains once real keys are known (replace `data.rentals ?? data.data ?? ...` with the actual key)
- [x] Verify `propertyType` casing matches API query param exactly

---

## PHASE 4 — Broken Feature Fixes

- [x] Fix `hasNext` logic in `RentalSearchPage.jsx:40` — `?? rentals.length === 10` is dead code due to `??` semantics, rewrite as explicit if/else
- [ ] Fix `RatedRentalsPage` blank data — depends on Phase 3 API check:
  - Option A: API returns joined rental+rating data → just fix field names
  - Option B: API returns `{ rental_id, rating, created_at }` only → fetch each rental by ID, or only display what's available
- [ ] Fix same-postcode listings in `IndividualRentalPage` — currently fetches page 1 of entire state and filters client-side (finds nothing in practice). Check if API supports `?postcode=` param; if not, fetch pages 1+2 as best-effort
- [x] Fix `lat && lng` falsy guard → `lat != null && lng != null` in `IndividualRentalPage.jsx:132` (coordinate `0` would hide the map)
- [x] Add null guard inside `RentalMap.jsx` component itself (currently crashes if called with undefined coords)

---

## PHASE 5 — Polish (distinction vs pass)

- [ ] Move `ModuleRegistry.registerModules` from `RentalTable.jsx` to `main.jsx` — module-level side effect in a component is wrong pattern
- [x] Add `useAuth` guard — throw clear error if called outside `AuthProvider`
- [ ] Replace `<a href>` with `<Link>` in NavBar (About link) and RatedRentalsPage (search link) — full-page reloads in a SPA
- [ ] Add `htmlFor` to all form labels in LoginPage, RegisterPage, RentalSearchPage — fails any a11y audit
- [ ] Add auto-dismiss (3s setTimeout) to `ratingSuccess` alert in `IndividualRentalPage`
- [ ] Add 401 interceptor in `apiUtils.js` to auto-logout on expired token — currently expired tokens keep user in authenticated UI state
- [ ] Update `README.md` — currently default Vite boilerplate, easy mark deduction

---

## Bug Reference (from 5-agent audit)

| Severity | Issue | Status |
|----------|-------|--------|
| High | Bootstrap JS missing — mobile nav broken | Phase 2 |
| High | `navigate(-1)` after login — can exit app or infinite loop | Phase 2 |
| High | `index.css` Vite boilerplate fighting Bootstrap everywhere | Phase 1 |
| Medium | `RatedRentalsPage` table showing blank data | Phase 4 |
| Medium | Same-postcode listings always empty | Phase 4 |
| Medium | `hasNext` third fallback is dead code | Phase 4 |
| Medium | Expired token keeps authenticated UI state | Phase 5 |
| Medium | `lat && lng` hides map for coordinate 0 | Phase 4 |
| Low | `handleResponse` and `BASE_URL` duplicated 3x | Phase 3 |
| Low | `<a href>` instead of `<Link>` in two places | Phase 5 |
| Low | Unused Vite scaffold files still in project | Phase 1 |
| N/A | AG Grid CSS not imported | NOT a bug — v35 auto-injects CSS |

---

*Last updated: 2026-04-30*
