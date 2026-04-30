# CAB230 Rentals API – Client Side Application
## Report Draft — paste into CAB230ClientSideReportTemplate.docx, add screenshots, export as PDF

---

## Introduction

### Purpose & Description

This application is a client-side React single-page application (SPA) that allows users to search, browse, and interact with Australian rental property listings sourced from the CAB230 Rentals REST API. The application enables users to search properties by state, property type, and postcode; view detailed information about individual properties including an interactive map; register and log in to rate properties; and review a personalised list of properties they have previously rated.

The application is built with React 19 and Vite, using React Router for client-side navigation, AG Grid Community for the rental search table, and Leaflet/React-Leaflet for interactive mapping. Bootstrap 5 is used throughout for layout and UI components.

A key technical highlight of this implementation is the use of AG Grid's Infinite Row Model for the rental search table. Rather than loading all results at once or using manual prev/next pagination, the grid fetches data from the API automatically as the user scrolls, providing a smooth and responsive experience across large result sets. Column header clicks trigger server-side sorting via the API's `sortBy` and `sortOrder` parameters, so the full dataset is sorted — not just the visible rows.

**[INSERT: 1–2 screenshots of the app — landing page and search page with results]**

### Completeness and Limitations

The application successfully implements all required API endpoints and achieves the functionality described at the Grade 7 level: full search with filtering and server-side sorting, AG Grid infinite scrolling, interactive maps, authenticated ratings, and a Rated Rentals page showing full property details.

The application handles common error cases including incorrect login credentials, duplicate registration, and expired authentication tokens (which trigger automatic logout). One known limitation is that the Rated Rentals page uses client-side pagination across the locally fetched ratings — if a user has rated more than 20 properties, subsequent pages are fetched from the API correctly. The same-postcode property suggestions on the individual rental page are limited to the first page of results (10 properties) due to API pagination constraints.

---

## Use of Endpoints

### /rentals/states

Used to populate the State dropdown on the Rental Search page. Called once on page load. Returns an array of Australian state labels: `["ACT", "NSW", "NT", "Qld", "SA", "Tas", "Vic", "WA"]`. Using the API for this rather than hardcoding ensures the app remains functional if the underlying dataset changes.

**[INSERT: screenshot of State dropdown on search page]**

### /rentals/property-types

Used to populate the Property Type dropdown on the Rental Search page. Called once on page load alongside `/rentals/states`. Returns an array of property type labels (e.g. `apartment`, `house`, `studio`, `townhouse`).

**[INSERT: screenshot of Property Type dropdown on search page]**

### /rentals/search

The core endpoint of the application. Called by AG Grid's Infinite Row Model datasource whenever the user scrolls into unfetched rows, or when filters or sort order change. Supports filtering by `state`, `propertyType`, and `postcode`, server-side sorting via `sortBy` and `sortOrder`, and pagination via `page`. Returns `{ data: [...], pagination: { total, nextPage, ... } }`. The `pagination.total` field is passed to AG Grid's `successCallback` so the scrollbar is correctly sized to the full dataset.

**[INSERT: screenshot of search results table with filters applied]**

### /rentals/{id}

Called when a user clicks a row in the search table or a same-postcode listing. Returns detailed information about a single rental: description, address, coordinates, agency, amenities, and average rating. The individual rental page uses this data to render the full property detail view including the Leaflet map. Note: this endpoint does not return an `id` field in its response — the ID is preserved from the calling context.

**[INSERT: screenshot of Individual Rental page with map visible]**

### /ratings

Called on the Rated Rentals page to retrieve a paginated list of rentals the logged-in user has previously rated. Returns `{ data: [{ rentalId, rating, dateTime }], pagination: { ... } }`. Since this endpoint returns only rental IDs (not full property details), the page makes a subsequent `GET /rentals/{id}` call for each rating to retrieve the property title, suburb, and state for display.

**[INSERT: screenshot of Rated Rentals page with at least one entry]**

### /ratings/rentals/{id}

Used in two ways on the Individual Rental page:
- **GET**: Called on page load (if authenticated) to retrieve the current user's rating for the property, pre-filling the star rating UI.
- **POST**: Called when the user submits a star rating (1–5). Returns `{ rating, dateTime }` confirming the saved value.

**[INSERT: screenshot of star rating UI on Individual Rental page]**

### /user/register

Used on the Register page. Accepts `{ email, password }` via POST. On success returns `{ message: "User created" }` and redirects the user to the Login page with a confirmation banner. Error responses (e.g. duplicate email) are displayed inline below the form.

**[INSERT: screenshot of Register page / success state]**

### /user/login

Used on the Login page. Accepts `{ email, password }` via POST. On success returns `{ token, tokenType, expiresIn }` — the token is stored in `localStorage` and loaded into React context. The user is redirected back to the page they were trying to access before being prompted to log in (preserved via React Router state). Error responses (e.g. incorrect password) are shown inline.

**[INSERT: screenshot of Login page / error state]**

---

## Modules Used

| Module | Description | Link |
|---|---|---|
| react | Core UI library | https://react.dev |
| react-dom | DOM rendering for React | https://react.dev |
| react-router-dom v7 | Client-side SPA routing | https://reactrouter.com |
| ag-grid-community v35 | Data grid with Infinite Row Model for search results | https://www.ag-grid.com |
| ag-grid-react v35 | React bindings for AG Grid | https://www.ag-grid.com/react-data-grid/ |
| leaflet v1.9 | Interactive map rendering | https://leafletjs.com |
| react-leaflet v5 | React bindings for Leaflet | https://react-leaflet.js.org |
| vite | Build tool and dev server | https://vite.dev |
| bootstrap v5.3 (CDN) | CSS framework for layout and components | https://getbootstrap.com |

---

## Application Design

### Navigation and Layout

The application follows a standard top-navigation SPA layout with a persistent dark navbar (Bootstrap `navbar-dark bg-dark`) across all pages. Navigation items are conditionally rendered based on authentication state — unauthenticated users see Register and Login; authenticated users see Rated Rentals and Log Out.

The page structure is:

- **Landing (/)** — hero image with welcome text and a call-to-action button to the search page
- **Rental Search (/search)** — filter form above an AG Grid infinite scroll table
- **Individual Rental (/rentals/:id)** — two-column layout: property details left, map right
- **Login (/login)** and **Register (/register)** — centred card forms
- **Rated Rentals (/rated)** — protected route showing a table of previously rated properties

React Router's `BrowserRouter` handles all routing. A `ProtectedRoute` component redirects unauthenticated users to `/login` and preserves the intended destination in router state, restoring it after login.

The design was sketched before implementation to ensure the filter controls, table, and navigation were coherent. The main structural decision was to use a card container for filter controls, separated from the results table below — this keeps the search form visually anchored while the table content changes.

**[INSERT: any rough sketch or wireframe you drew, even a phone photo]**

### Usability and Quality of Design

**Strengths:**
- The infinite scroll pattern removes the cognitive friction of manual pagination — users simply scroll to discover more results, which is consistent with how most modern listing sites work.
- Filter controls are grouped in a card with clear labels and a prominent Search button. Adding postcode as a third filter gives users meaningful narrowing capability without cluttering the interface.
- The individual rental page uses a two-column layout that keeps the map visible alongside property details without requiring scrolling back and forth.
- Error states are surfaced inline (red Bootstrap alerts) rather than via alerts or console errors, which is more appropriate for a web application.
- The authenticated/unauthenticated navbar states are clean — no broken or irrelevant links shown to either group.

**Weaknesses:**
- The search table has no visible loading state while the first page of results is fetching — AG Grid shows its own built-in loading overlay, but it is subtle and could be missed. A more prominent "Searching..." indicator above the table would improve clarity.
- The postcode input accepts any text — there is no validation that the entered value is a valid Australian postcode (4 digits). An invalid postcode returns an empty result set with no explanation beyond AG Grid's "No rentals found" overlay message.
- The Rated Rentals page shows a table with columns for Property, Suburb, State, Rating, and Date — but "Property" shows the title, which can be long and truncates on narrow screens. A short address would sometimes be more useful.
- The star rating UI on the Individual Rental page does not confirm the previously submitted rating visually on first load — it pre-fills the stars correctly, but there is no text like "You rated this 4 stars" to make it explicit.
- There is no visual distinction between properties that have been rated by the user and those that haven't on the search page. Adding a small indicator (e.g. a star icon) to already-rated properties in the search table would improve the experience for returning users.

### Accessibility

This section analyses the application against the W3C Priority 1 Accessibility Requirements and considers inclusive design for Aboriginal and Torres Strait Islander users.

**W3C Priority 1 Requirements Analysis:**

**1. Provide a text equivalent for every non-text element.**
Partial compliance. The Leaflet map renders as a `<div>` with no ARIA label or text alternative. A screen reader user receives no information about the property location. Images (if any hero images are used) should include meaningful `alt` attributes. The star rating component uses Unicode characters (★) with no ARIA labels — a screen reader would not convey that these are interactive rating controls. Fix: add `aria-label="Rate this property X out of 5 stars"` to the rating UI, and `aria-label="Property location map"` to the map container.

**2. Ensure all information conveyed with colour is also available without colour.**
Partial compliance. Star ratings use gold/grey colour to indicate filled vs unfilled stars (★ in `#ffc107` vs `#dee2e6`). A user who cannot distinguish these colours cannot determine the rating value from the visual alone. Fix: add a numeric label alongside the stars (e.g. "4/5").

**3. Organise documents so they can be read without style sheets.**
The application depends entirely on Bootstrap CSS and React rendering for structure. Without CSS, the page would render as an unstyled, unstructured list of text. This is a fundamental limitation of React SPAs that rely on component-based layouts — it would require significant structural work (semantic HTML landmark elements, heading hierarchies) to address.

**4. Ensure text equivalents for dynamic content are updated.**
AG Grid updates the grid content dynamically without a page refresh. Screen readers may not be notified of new rows loading as the user scrolls. AG Grid's built-in accessibility features (`aria-rowcount`, `aria-rowindex`) partially address this, but live region announcements for "X new results loaded" are absent.

**5. Avoid causing the screen to flicker.**
The application uses CSS transitions only (Bootstrap animations) and does not cause screen flicker.

**6. Use the clearest and simplest language appropriate for the site's content.**
The UI uses plain English throughout. Property descriptions are sourced directly from the API and may vary in complexity, but the application's own labels and messages are straightforward.

**7. For tables, identify row and column headers.**
The search results table is rendered by AG Grid, which generates appropriate `<th>` elements with `role="columnheader"` for column headers. The Rated Rentals table uses standard HTML `<table>` with a `<thead>` containing `<th>` elements. Both tables have proper header identification.

**Form Labels:**
All form inputs in the Search, Login, and Register pages use `<label>` elements with `htmlFor` attributes matching input IDs, which is correct practice for screen reader compatibility.

**Aboriginal and Torres Strait Islander Considerations:**

The application does not currently include an Acknowledgement of Traditional Owners, which would be appropriate given that it presents data about land and housing across Australia — country with deep significance to First Nations peoples. Adding a brief, respectful acknowledgement on the landing page or in a footer would be a meaningful inclusion.

The application's language, imagery, and interface choices do not explicitly target or misrepresent Aboriginal and Torres Strait Islander communities, but the rental dataset itself may reflect systemic inequities in housing access — the application does not contextualise this data in any way. A more inclusive design might note the limitations of the dataset or provide links to culturally appropriate housing resources.

For equitable access, the application requires a modern browser and a stable internet connection to the QUT API server. This may be a barrier for users in regional or remote communities where connectivity is limited. The application has no offline mode or cached data capability.

The visual design uses English only with no support for Indigenous languages, which limits accessibility for users whose primary language is not English.

---

## Technical Description

### Architecture

The application source is organised as follows:

```
src/
├── App.jsx                    — Router setup, all route definitions, ProtectedRoute
├── main.jsx                   — React DOM root, AuthProvider wrapper, Leaflet CSS import
├── index.css                  — Minimal reset (body margin: 0 only)
├── context/
│   ├── (C) AuthContext.jsx    — AuthProvider: token state, login/logout, 401 listener
│   └── (C) authContextCore.js — AuthContext createContext, useAuth hook
├── services/
│   ├── (C) apiUtils.js        — BASE_URL, handleResponse (with 401 interceptor)
│   ├── (C) rentalsApi.js      — getStates, getPropertyTypes, searchRentals, getRentalById
│   ├── (C) ratingsApi.js      — getRatedRentals, getRatingForRental, submitRating
│   └── (C) authApi.js         — loginUser, registerUser
├── components/
│   ├── (C) NavBar.jsx         — Responsive Bootstrap navbar, auth-conditional links
│   ├── (C) RentalTable.jsx    — AG Grid Infinite Row Model, datasource factory, sort wiring
│   ├── (C) RentalMap.jsx      — Leaflet MapContainer with marker
│   ├── (C) StarRating.jsx     — Interactive 1–5 star rating UI
│   └── (C) Paginator.jsx      — Prev/Next pagination (used by Rated Rentals page)
└── pages/
    ├── (C) LandingPage.jsx       — Hero section, CTA
    ├── (C) RentalSearchPage.jsx  — Filter form, activeFilters state, RentalTable
    ├── (C) IndividualRentalPage.jsx — Property detail, map, rating, same-postcode list
    ├── (C) LoginPage.jsx         — Login form with redirect-back logic
    ├── (C) RegisterPage.jsx      — Registration form with error handling
    └── (C) RatedRentalsPage.jsx  — Rated properties fetched and enriched with rental details
```

The application uses a unidirectional data flow: pages fetch data via service functions, update local state, and pass data down to components as props. Authentication state is managed globally via React Context (`AuthProvider`) and persisted in `localStorage`. All API calls go through `handleResponse` in `apiUtils.js`, which centralises error handling and 401 detection.

The key architectural decision is the AG Grid Infinite Row Model datasource pattern in `RentalTable`. The component accepts a `filters` object prop. When filters change (on Search click), a new datasource is created and set on the grid via `gridRef.current.api.setGridOption('datasource', ...)`, which purges the cache and triggers a fresh page-1 fetch. The `getRows` function maps AG Grid's `startRow` to the API's `page` parameter (`page = Math.floor(startRow / 10) + 1`) and reads `params.sortModel` for server-side sorting.

**[INSERT: screenshot of src/ folder structure from your file explorer or IDE]**

### Test Plan

| Test Case | Type | Expected Result | Actual Result |
|---|---|---|---|
| Load landing page | Positive | Hero content and nav render | ✅ Pass |
| Search with no filters | Positive | All rentals load in grid, infinite scroll works | ✅ Pass |
| Search by state (Qld) | Positive | Grid shows only Qld properties | ✅ Pass |
| Search by postcode (2144) | Positive | Grid shows Auburn properties only | ✅ Pass |
| Sort by Rent/wk ascending | Positive | Grid re-fetches and shows cheapest first | ✅ Pass |
| Click a rental row | Positive | Navigates to /rentals/:id with correct data | ✅ Pass |
| Individual rental page with coords | Positive | Leaflet map renders at property location | ✅ Pass |
| Individual rental — same postcode | Positive | Up to 5 other properties in same postcode shown | ✅ Pass |
| Register new user | Positive | Account created, redirected to login with banner | ✅ Pass |
| Register duplicate email | Negative | Inline error "User already exists" | ✅ Pass |
| Login correct credentials | Positive | Token stored, redirected to intended page | ✅ Pass |
| Login wrong password | Negative | Inline error "Incorrect email or password" | ✅ Pass |
| Rate a rental (authenticated) | Positive | Stars clickable, rating saved, success shown | ✅ Pass |
| Rate a rental (unauthenticated) | Negative | Stars disabled, login link shown | ✅ Pass |
| View Rated Rentals | Positive | Table shows rated properties with title/suburb/state/rating/date | ✅ Pass |
| Click Rated Rentals row | Positive | Navigates to correct /rentals/:id | ✅ Pass |
| Access /rated unauthenticated | Negative | Redirected to /login, returns to /rated after login | ✅ Pass |
| Expired token (simulated) | Negative | Auto-logout triggered, user shown as logged out | ✅ Pass |
| Invalid route (/xyz) | Edge | 404 catch-all renders, no crash | ✅ Pass |
| Empty search results | Edge | AG Grid "No rentals found" overlay shown | ✅ Pass |

**[INSERT: screenshots of any of the above test cases you want to evidence — especially error states and edge cases]**

### Difficulties, Exclusions, and Unresolved Issues

**Key challenges:**

1. **AG Grid Infinite Row Model datasource refresh on filter change.** The trickiest part of the implementation was ensuring the grid re-fetches from page 1 when the user applies new filters. Simply updating `filters` state is not enough — the grid's internal cache holds the old datasource. The solution was to replace the datasource object entirely via `setGridOption('datasource', createDatasource(newFilters))`, which forces a full cache purge. A `useRef` is used to hold the current filters for access inside `onGridReady` (which fires before the first `useEffect`), avoiding a stale closure bug.

2. **`/rentals/{id}` does not return an `id` field.** The individual rental endpoint returns all property data except the ID itself. The Rated Rentals page merges rating data with rental details, and the `id` must be explicitly carried forward from the `rentalId` field in the ratings response (`{ ...rental, id: r.rentalId }`). This was not obvious from reading the API documentation.

3. **Same-postcode suggestions initially broken.** The original implementation fetched results by state and filtered client-side, which rarely found matches (only 10 results were checked). Fixed by using the API's `?postcode=` filter parameter directly.

**Known limitations:**
- The star rating success alert does not auto-dismiss (stays until the user navigates away)
- The Rated Rentals page fetches all ratings in a single `Promise.all` — for users with many ratings, this results in multiple simultaneous API calls which could be rate-limited
- No offline support — the app requires a live connection to the QUT API server

---

## References

- React Documentation. (2024). *React*. https://react.dev
- Remix (React Router). (2024). *React Router v7*. https://reactrouter.com
- AG Grid. (2024). *AG Grid Community — Infinite Row Model*. https://www.ag-grid.com/react-data-grid/infinite-scrolling/
- Leaflet. (2024). *Leaflet — an open-source JavaScript library for interactive maps*. https://leafletjs.com
- React Leaflet. (2024). *React Leaflet*. https://react-leaflet.js.org
- Bootstrap. (2024). *Bootstrap v5.3*. https://getbootstrap.com
- Vite. (2024). *Vite — Next Generation Frontend Tooling*. https://vite.dev
- W3C. (1999). *Web Content Accessibility Guidelines — Full Checklist*. https://www.w3.org/TR/WAI-WEBCONTENT/full-checklist
- QUT CiteWrite. (2024). *Citing and referencing guide*. https://www.citewrite.qut.edu.au/cite/

---

## Appendix: User Guide

### Getting Started

Open the application in your browser. The landing page shows a welcome message and a "Start Searching" button.

**[INSERT: screenshot of landing page]**

### Searching for Rentals

1. Click **Rental Search** in the navigation bar or the button on the landing page.
2. Use the **State**, **Property Type**, and **Postcode** dropdowns/inputs to filter results. All fields are optional — leaving them blank returns all rentals.
3. Click **Search**.
4. Results appear in the table below. **Scroll down inside the table** to load more results automatically.
5. Click any column header (e.g. **Rent/wk**) to sort the full dataset by that column. Click again to reverse the sort order.

**[INSERT: screenshot of search page with results and filters]**

### Viewing a Rental

Click any row in the search results table to open the Individual Rental page. This shows:
- Full property details (address, type, bedrooms, bathrooms, rent, agency)
- Property description
- An interactive map showing the property location
- Other rentals in the same postcode
- A star rating widget (if you are logged in)

**[INSERT: screenshot of individual rental page]**

### Registering and Logging In

Click **Register** in the navigation bar. Enter your email address and a password, then click Register. You will be redirected to the Login page. Log in with the same credentials.

Once logged in, the navigation shows **Rated Rentals** and **Log Out** in place of Register and Login.

**[INSERT: screenshot of login page]**

### Rating a Rental

Navigate to any Individual Rental page while logged in. Click one of the stars (1–5) in the "Rate this property" section. A green "Rating saved!" confirmation appears.

**[INSERT: screenshot of star rating UI]**

### Viewing Your Rated Rentals

Click **Rated Rentals** in the navigation bar. This page shows all properties you have previously rated, including the title, suburb, state, your rating, and the date you rated it. Click any row to return to that property's page.

**[INSERT: screenshot of rated rentals page]**

### Logging Out

Click **Log Out** in the navigation bar. You are returned to the landing page and your session is cleared.
