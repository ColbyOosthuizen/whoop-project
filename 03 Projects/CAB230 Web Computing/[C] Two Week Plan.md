# CAB230 — Two Week Build Plan

> Beginner-friendly. Every step is one clear task.
> Tech stack decisions are already made — no choices needed.

---

## Tech Stack (decided — don't change these)

| Tool | What it does |
|---|---|
| **Vite + React** | The foundation — creates and runs your app |
| **React Router v6** | Handles navigation between pages (required for grade 7) |
| **React-Bootstrap** | Makes things look good without writing much CSS |
| **AG Grid (Community)** | The table on the search page — handles pagination for grade 7 |
| **Pigeon Maps** | Free map component for the rental detail page |
| **Axios** | Sends requests to the API |
| **React Context** | Keeps track of whether the user is logged in |

---

## Week 1 — Build the visible app

### Day 1–2: Scaffold + structure
- Install Node.js
- Create the project with Vite
- Install all libraries
- Set up folder structure
- Set up React Router with placeholder pages
- Build the navbar (updates when logged in/out)

### Day 3–4: Rental Search page
- Connect to `/rentals/states` and `/rentals/property-types`
- Build the search form (state, postcode, property type)
- Connect to `/rentals/search` — show results in AG Grid table
- Add basic pagination (Next / Previous)

### Day 5–6: Individual Rental page
- Connect to `/rentals/{id}`
- Display all property details
- Add Pigeon Maps with a pin on the rental's location
- Make sure URL is bookmarkable (`/rentals/123`)

### Day 7: Home page + cleanup
- Build the landing page (hero image, nav links, welcome text)
- Make sure all pages link to each other correctly
- Test everything works

---

## Week 2 — Auth, polish, and report

### Day 8–9: Auth (Register + Login)
- Build Register page — form → POST `/user/register` → handle errors
- Build Login page — form → POST `/user/login` → store JWT token
- Add Logout button to navbar
- Protect the Rated Rentals route (redirect to login if not logged in)

### Day 10: Ratings
- On Individual Rental page: show star rating widget if logged in
- GET existing rating, POST new rating → `/ratings/rentals/{id}`

### Day 11: Rated Rentals page
- GET `/ratings` (list of rental IDs this user rated)
- For each ID, GET `/rentals/{id}` to get full details
- Display in a table

### Day 12: Grade 7 polish
- Add remaining search fields: min/max bedrooms, bathrooms, rent, suburb
- Add "Advanced Search" section to hide extra fields
- Add column sorting on the search table
- Handle errors: API down, invalid login, rate limits

### Day 13: Report
- Fill in the report template (docx → export as PDF)
- Take screenshots of every page/feature as you write
- Key sections: endpoints used, design choices, accessibility reflection

### Day 14: Buffer + submission
- Fix any last bugs
- Run `npm run build` — test the static build
- ZIP and submit to Gradescope

---

## Folder structure (we'll set this up on Day 1)

```
src/
  pages/          ← one file per page (Home, Search, Rental, Login, Register, Rated)
  components/     ← reusable pieces (Navbar, StarRating, RentalTable, MapView)
  services/       ← all API calls live here (rentals.js, ratings.js, auth.js)
  context/        ← AuthContext.js — tracks login state + JWT token
  App.jsx         ← router lives here
  main.jsx        ← entry point
```

---

## The rule for working together

Every session: tell me what day/phase you're on and what the current problem is. I'll write the code, explain what it does, and tell you exactly where to put it. You run it, tell me what happens, and we fix it together.

When something breaks (it will), paste the error message and I'll tell you what it means and how to fix it.
