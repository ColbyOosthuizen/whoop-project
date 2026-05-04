# CAB230 Web Computing — Task Map

> Target grade: **7**
> API base: `http://4.237.58.241:3000`
> Swagger docs (source of truth): `http://4.237.58.241:3000`

---

## What We're Building

A React Single-Page Application (SPA) that lets users browse Australian rental property data via a REST API. Users can search/filter rentals, view individual listings (with a map), register/login, and rate properties. Must use React Router. Must be submitted as a static build (`npm run build`) + `report.pdf` zipped to Gradescope.

---

## Pages (Routes)

| Page | Route | Auth required? | Key endpoints |
|---|---|---|---|
| Home / Landing | `/` | No | — |
| Rental Search | `/search` | No | `/rentals/search`, `/rentals/states`, `/rentals/property-types` |
| Individual Rental | `/rentals/:id` | No (rating requires auth) | `/rentals/{id}`, `/ratings/rentals/{id}` |
| Login | `/login` | No | `/user/login` |
| Register | `/register` | No | `/user/register` |
| Rated Rentals | `/rated` | Yes | `/ratings`, `/rentals/{id}` (per item) |
| About | `/about` | No | — (optional but recommended) |

---

## API Endpoints — Full Map

### Public (Rentals)

| Endpoint | Used on | Purpose |
|---|---|---|
| `GET /rentals/states` | Search page | Populate state filter dropdown/radio |
| `GET /rentals/property-types` | Search page | Populate property type dropdown |
| `GET /rentals/search` | Search page | Main search — filterable, paginated, sortable |
| `GET /rentals/{id}` | Individual page + Rated page | Full property detail |

**`/rentals/search` parameters to expose for grade 7** (all must work in any combination):
- `state` — filter by state
- `postcode` — filter by postcode
- `propertyType` — filter by type
- `minBedrooms` / `maxBedrooms`
- `minBathrooms` / `maxBathrooms`
- `minRent` / `maxRent`
- `suburb` — text search
- `sort` / `order` — column + direction
- `page` / `perPage` — pagination (API returns 10 per page by default)

### Authenticated (Ratings)

| Endpoint | Used on | Purpose |
|---|---|---|
| `GET /ratings` | Rated Rentals page | List of rentals this user has rated (IDs only, paginated) |
| `GET /ratings/rentals/{id}` | Individual Rental page | Get this user's rating for a specific rental |
| `POST /ratings/rentals/{id}` | Individual Rental page | Submit a 1–5 star rating |

### Authentication

| Endpoint | Used on | Purpose |
|---|---|---|
| `POST /user/register` | Register page | Create account (email + password) |
| `POST /user/login` | Login page | Returns JWT bearer token |

JWT token: store in state (or localStorage), attach as `Authorization: Bearer <token>` header on authenticated requests.

---

## Tech Stack Decisions

These need to be locked in before coding starts:

| Decision | Recommendation | Why |
|---|---|---|
| Bundler/scaffold | Vite + React | Assessment says `npm run dev` / `npm run build` — Vite is standard |
| Routing | React Router v6 | Required for grade ≥ 5; required for SPA |
| Component library | Material UI (MUI) or React-Bootstrap | MUI pairs well with MUI X Data Grid |
| Table component | **AG Grid React** (community) or **MUI X Data Grid** | Required for grade 7 (server-side pagination / infinite scroll) |
| Map component | **Pigeon Maps** | Free, React-native, recommended in spec |
| Auth storage | localStorage (or React context + localStorage) | JWT must persist across navigation |
| HTTP client | `fetch` or `axios` | Either fine — axios has nicer error handling |
| Star rating input | `react-rating-stars-component` or MUI Rating | Simple, no cost |

---

## Build Order (what to build first → last)

### Phase 1 — Scaffold & core structure
1. `npm create vite@latest` — React template
2. Install: react-router-dom, axios (or use fetch), chosen component library
3. Set up folder structure: `src/pages/`, `src/components/`, `src/services/` (API calls), `src/context/` (auth)
4. Set up React Router — define all routes, placeholder pages
5. Build navbar (updates based on auth state: shows Login/Register when logged out, Rated Rentals/Logout when logged in)

### Phase 2 — Public pages (no auth needed)
6. **Home page** — hero section, nav links, brief description
7. **`/rentals/states` + `/rentals/property-types`** — fetch these on search page load, populate controls
8. **Rental Search page** — basic version first: state + postcode + property type filters, table of results
9. **Individual Rental page** — fetch `/rentals/{id}`, display all fields, Pigeon Maps location
10. Route `/rentals/:id` properly so URLs are bookmarkable

### Phase 3 — Auth
11. **Register page** — form, POST `/user/register`, handle errors (duplicate email, missing fields)
12. **Login page** — form, POST `/user/login`, store JWT, redirect to home
13. Auth context — `useContext` hook so any component can check if logged in + get token
14. Logout — clear token, update nav

### Phase 4 — Authenticated features
15. **Star rating on Individual Rental page** — GET then POST `/ratings/rentals/{id}`, only show if logged in
16. **Rated Rentals page** — GET `/ratings` (paginated), then GET `/rentals/{id}` per result for full details; be careful of rate limits (don't fire all requests simultaneously — batch or sequence them)

### Phase 5 — Grade 7 polish
17. Full search: expose ALL `/rentals/search` params — min/max bedrooms, bathrooms, rent, suburb text search
18. Advanced search UI — hide extra fields behind "Advanced Search" toggle to keep basic search clean
19. Server-side pagination / AG Grid infinite scroll — don't load all 10 and stop; support Next/Prev or infinite scroll
20. Sorting — clicking column headers triggers re-fetch with `sort` + `order` params
21. Map on search results — optionally show pins for returned properties
22. Error handling throughout — API failures, network errors, rate limiting (retry/backoff)
23. Loading states, empty states, 404 handling

---

## Report — Sections to Write

| Section | When to write | Notes |
|---|---|---|
| Introduction | Last | Write after app is done; needs screenshots |
| Completeness & Limitations | Last | Honest summary of what works/doesn't |
| Use of Endpoints | Last | One screenshot + 2 sentences per endpoint (9 endpoints) |
| Modules Used | As you add them | Running list — add each library as you install it |
| Application Design — Navigation & Layout | After Phase 1-2 | Describe page flow, include sketches/mockups |
| Application Design — Usability | After app is done | Self-critical; assess against web design principles |
| Accessibility | After app is done | W3C Priority 1 checklist, ATSI considerations |
| Technical Description — Architecture | After app is done | Folder structure screenshot, brief explanation |
| Test Plan | During Phase 4-5 | Positive, negative, edge cases; use screenshots |
| Difficulties / Bugs | During & after | Note blockers as they happen |
| User Guide | Last | Walk-through with screenshots |
| References | Last | QUT cite format |

Report target: ~20 pages including screenshots. Template `.docx` is provided — fill it in, export as `report.pdf`.

---

## Submission Checklist

- [ ] `npm run build` completed → `dist/` directory exists and works
- [ ] Test static build: `cd dist && npx serve -s`
- [ ] `report.pdf` in root directory
- [ ] `extension.pdf` if applicable
- [ ] Confirm directory has: `package.json`, `package-lock.json`, `report.pdf`, `dist/`, `src/`, `public/`
- [ ] ZIP everything **except** `node_modules/` and `.git/`
- [ ] Submit ZIP to Gradescope
- [ ] Gradescope auto-check passes (checks file presence only)

---

## Open Questions (resolve before / during Phase 1)

1. Do you have a preference for component library? (MUI vs React-Bootstrap vs other)
2. AG Grid or MUI X Data Grid for the table? (AG Grid has better infinite scroll support)
3. Any existing React experience to factor in? (affects how much scaffolding we need to explain)
4. Due date?
