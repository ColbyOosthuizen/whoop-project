# CAB230 Session Log — 2026-04-30

## What we shipped today

### Phase 1 — Synced Codex build, ran locally
- Cloned the Codex-built cab230-rentals app from GitHub and confirmed it ran on localhost
- Reviewed the assessment spec: static SPA submitted as a ZIP to Gradescope, `npx serve -s dist/` for testing
- Confirmed the API is hosted externally at `http://4.237.58.241:3000/` (always-on, not student-hosted)

### Phase 2 — Fixed bugs in the Codex build
- **RatedRentalsPage blank rows**: API returns `{rentalId, rating, dateTime}` but code tried to display `title`, `suburb`, `state`. Fixed by fetching `/rentals/:id` for each rating and explicitly setting `id: r.rentalId` on the merged object (the endpoint doesn't return its own ID)
- **Same-postcode suggestions always empty**: Was fetching by state and filtering client-side, only checking 10 results. Fixed by using the `?postcode=` API query param on `/rentals/search` directly
- **`isAuthenticated` trusted empty string token**: `token !== null` is true for `''`. Fixed to `!!token`
- **No 401 handling**: Expired token kept user in authenticated state indefinitely. Fixed via custom browser event pattern — `apiUtils` dispatches `auth:expired` on any 401, `AuthProvider` listens and calls `logout()`
- **NavBar and RatedRentalsPage**: Replaced raw `<a href>` tags with React Router `<Link>` to prevent full-page reloads

### Phase 3 — Upgraded to Grade 7 (AG Grid Infinite Scroll + server-side sort)
- **RentalTable**: Full rewrite from client-side `rowData` array to **AG Grid Infinite Row Model**
  - `rowModelType="infinite"`, `cacheBlockSize=10` (matches API `perPage`)
  - `createDatasource(filters)` factory: maps `params.startRow` to API `page`, reads `params.sortModel` for server-side sort
  - Filter changes replace the datasource via `setGridOption('datasource', ...)` — purges cache, re-fetches from page 1
  - `useRef` used to hold current filters for the `onGridReady` callback (avoids stale closure)
- **RentalSearchPage**: Added postcode input, `activeFilters` state pattern (grid only mounts after first Search click), Enter key handler on postcode field, removed manual Paginator
- **rentalsApi**: Refactored `searchRentals` to object params, added `sortBy`, `sortOrder`, `postcode`

### Phase 4 — Built submission package
- `npm run build` → `dist/`
- Tested with `npx serve -s` — all routes return 200, all features working end-to-end
- Created `cab230-submission/` folder with: `dist/`, `src/`, `public/`, config files
- Note: still needs `report.pdf` before zipping and submitting to Gradescope

### Phase 5 — Generated Word report
- Inspected `CAB230ClientSideReportTemplate (1).docx` via Word COM automation to map exact heading names and document structure
- Wrote `fill-report.ps1` — opens the template, finds each heading pair, replaces placeholder body text with actual report content using `Selection.TypeText()` (not `Range.Delete()` — that fails on ranges spanning table content)
- Generated `report.docx` in `cab230-submission/` — covers all sections: Introduction, Use of Endpoints, Modules Used, Application Design (Nav, Usability, Accessibility), Technical Description (Architecture, Test Plan, Difficulties), Extensions, User Guide, References
- Report still needs: student name/number on cover page, screenshots at every `[INSERT: ...]` placeholder, export as PDF

## What still needs to be done before submission

1. Add your name and student number to the cover page of `report.docx`
2. Replace every `[INSERT: screenshot...]` with actual screenshots
3. Export `report.docx` as `report.pdf` and drop it in `cab230-submission/`
4. ZIP the contents of `cab230-submission/` (not `node_modules`, not `.git`)
5. Submit ZIP to Gradescope

## Key technical decisions

| Decision | Why |
|---|---|
| AG Grid Infinite Row Model (not Server-Side) | Server-Side is Enterprise-only; Community edition supports Infinite |
| `createDatasource` as factory function | Ensures filter values are captured in closure correctly; `useRef` handles the `onGridReady` race |
| `auth:expired` browser event | Decouples API layer from AuthContext — any service can trigger logout without importing context |
| `id: r.rentalId` explicit merge | `/rentals/:id` endpoint does not return the rental's own ID field |
| `Selection.TypeText()` for Word COM | `Range.Delete()` throws COM exception when range spans table content in the template |
