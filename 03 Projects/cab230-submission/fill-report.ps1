
$template = 'C:\Users\colby\OneDrive\Desktop\Second brain\Uni\CAB230ClientSideReportTemplate (1).docx'
$output   = 'C:\Users\colby\OneDrive\Desktop\Second brain\KJ OS Template\03 Projects\cab230-submission\report.docx'

$word = New-Object -ComObject Word.Application
$word.Visible = $false
$doc  = $word.Documents.Open($template)

$wdCollapseEnd = 0
$wdParagraph   = 4
$wdStory       = 6

# Find heading h1, select everything up to heading h2, type replacement content.
# TypeText on a non-empty selection replaces it — avoids the Range.Delete() COM error.
function Set-Section($h1, $h2, [string[]]$lines) {
    $sel = $word.Selection
    $sel.HomeKey($wdStory) | Out-Null

    $sel.Find.ClearFormatting()
    $sel.Find.Text      = $h1
    $sel.Find.MatchCase = $false
    $sel.Find.Forward   = $true
    if (-not $sel.Find.Execute()) { Write-Host "NOT FOUND: $h1"; return }

    $sel.MoveEnd($wdParagraph, 1) | Out-Null
    $sel.Collapse($wdCollapseEnd) | Out-Null
    $bodyStart = $sel.Start

    $sel.Find.ClearFormatting()
    $sel.Find.Text      = $h2
    $sel.Find.MatchCase = $false
    $sel.Find.Forward   = $true
    if ($sel.Find.Execute()) {
        $bodyEnd = $sel.Start
    } else {
        $sel.EndKey($wdStory) | Out-Null
        $bodyEnd = $sel.Start
    }

    # Select the body range; first TypeText call replaces the selection
    $sel.SetRange($bodyStart, $bodyEnd)

    $first = $true
    foreach ($line in $lines) {
        if ($first) {
            $sel.TypeText($line)
            $first = $false
        } else {
            $sel.TypeParagraph()
            $sel.TypeText($line)
        }
    }
    $sel.TypeParagraph()
}

# INTRODUCTION

Set-Section 'Purpose & description' 'Completeness and Limitations' @(
    'This application is a client-side React single-page application (SPA) that allows users to search, browse, and interact with Australian rental property listings sourced from the CAB230 Rentals REST API. The application enables users to search properties by state, property type, and postcode; view detailed information about individual properties including an interactive map; register and log in to rate properties with a 1-5 star system; and review a personalised list of properties they have previously rated.',
    'The application is built with React 19 and Vite, using React Router v7 for client-side SPA navigation, AG Grid Community v35 for the rental search table, and Leaflet/React-Leaflet for interactive mapping. Bootstrap 5 provides the layout and component styling throughout.',
    'The key technical highlight is the use of AG Grid Infinite Row Model for the rental search table. Rather than loading all results at once or requiring manual pagination, the grid automatically fetches data from the API as the user scrolls, providing a smooth experience across large result sets. Column header clicks trigger server-side sorting via the API sortBy and sortOrder query parameters, so the full dataset is sorted rather than just the visible rows.',
    '[INSERT: 1-2 screenshots of the app - landing page and search page with results loaded]'
)

Set-Section 'Completeness and Limitations' 'Use of End Points' @(
    'The application successfully implements all required API endpoints and achieves the functionality described at Grade 7 level: full search with state, property type, and postcode filtering; server-side column sorting; AG Grid infinite scrolling; interactive Leaflet maps on individual rental pages; authenticated star ratings with read-back; and a Rated Rentals page showing full property details fetched from the API.',
    'Authentication is robust - incorrect login credentials and duplicate registration attempts are handled with inline error messages, and expired tokens trigger automatic logout via a custom browser event. One known limitation is that same-postcode property suggestions on the individual rental page are limited to the first 10 results due to API pagination. The star rating success alert does not auto-dismiss.'
)

# USE OF ENDPOINTS — heading names match the template exactly (no leading space)

Set-Section '/rentals/states' '/rentals/property-types' @(
    'Used to populate the State dropdown on the Rental Search page. Called once on page load. Returns an array of Australian state labels: ACT, NSW, NT, Qld, SA, Tas, Vic, WA. Using the API for this rather than hardcoding ensures the application remains functional if the underlying dataset changes.',
    '[INSERT: screenshot of the State dropdown on the Rental Search page]'
)

Set-Section '/rentals/property-types' '/rentals/search' @(
    'Used to populate the Property Type dropdown on the Rental Search page, called once on page load alongside /rentals/states. Returns an array of property type labels such as apartment, house, studio, and townhouse. These are displayed as dropdown options without modification.',
    '[INSERT: screenshot of the Property Type dropdown on the Rental Search page]'
)

Set-Section '/rentals/search' '/rentals/{id}' @(
    'This is the core endpoint of the application. It is called by the AG Grid Infinite Row Model datasource whenever the user scrolls into un-fetched rows, and whenever the active filters or sort order change. Supports filtering by state, propertyType, and postcode, as well as server-side sorting via sortBy and sortOrder query parameters, and pagination via the page parameter.',
    'The API response includes data (an array of rental objects) and pagination metadata containing total, nextPage, and related fields. The pagination.total field is passed to AG Grid successCallback as the lastRowIndex, allowing the scrollbar to be correctly sized to the full dataset from the first fetch.',
    '[INSERT: screenshot of search results table with filters applied and rows loading]'
)

Set-Section '/rentals/{id}' '/ratings' @(
    'Called when a user clicks a row in the search results table or a same-postcode listing. Returns full detail for a single rental property including description, full address, latitude and longitude coordinates, agency name, amenity details, and aggregate rating data. The individual rental page uses this data to render the complete property detail view, the Leaflet map, and the same-postcode suggestions list.',
    'Note: this endpoint does not include the rental own ID in its response body. The ID must be carried forward from the calling context. In the Rated Rentals page this required explicitly setting id: r.rentalId on the merged object to fix navigation from the table.',
    '[INSERT: screenshot of the Individual Rental page with property details and map visible]'
)

Set-Section '/ratings' '/ratings/rentals/{id}' @(
    'Called on the Rated Rentals page to retrieve the list of properties the logged-in user has previously rated. Returns an object with data (array of rentalId, rating, and dateTime objects) and pagination metadata. Because this endpoint returns only rental IDs and not full property details, the page makes a subsequent GET /rentals/:id call for each rating to retrieve the title, suburb, and state for display in the table.',
    '[INSERT: screenshot of the Rated Rentals page with at least one rated property showing]'
)

Set-Section '/ratings/rentals/{id}' '/user/register' @(
    'Used in two ways on the Individual Rental page. First, a GET request is made on page load (when the user is authenticated) to retrieve the current user rating for that property, which pre-fills the star rating UI. Second, a POST request is made when the user submits a new rating (1-5 stars). Both return an object with rating and dateTime confirming the saved or retrieved value.',
    '[INSERT: screenshot of the star rating widget on the Individual Rental page, showing a filled rating]'
)

Set-Section '/user/register' '/user/login' @(
    'Used on the Register page. Accepts email and password via POST. On success, returns a confirmation message and the application redirects the user to the Login page with a success banner. Error responses such as duplicate email (User already exists) and missing password are displayed inline below the form.',
    '[INSERT: screenshot of the Register page, or the success banner on the Login page after registering]'
)

Set-Section '/user/login' 'Modules Used' @(
    'Used on the Login page. Accepts email and password via POST. On success returns a token, tokenType, and expiresIn value. The token is stored in localStorage and loaded into React Context via AuthProvider. The user is then redirected back to the page they were originally trying to access, which was preserved in React Router location state by ProtectedRoute before the redirect to login.',
    'Error responses such as incorrect password are displayed as inline alerts below the form. Expired tokens are handled globally: the API layer dispatches a custom browser event (auth:expired) on any 401 response, which the AuthProvider listens for and responds to by clearing the token and logging the user out automatically.',
    '[INSERT: screenshot of Login page showing an error state, or the redirect-back behaviour]'
)

# MODULES USED

Set-Section 'Modules Used' 'Application Design' @(
    'react - Core UI library. https://react.dev',
    'react-dom - DOM rendering for React. https://react.dev',
    'react-router-dom v7 - Client-side SPA routing with BrowserRouter, Route, Link, useNavigate, useParams, and useLocation. https://reactrouter.com',
    'ag-grid-community v35 - Data grid component used with the Infinite Row Model for the rental search table. Handles row fetching, scrolling, and column sorting. https://www.ag-grid.com',
    'ag-grid-react v35 - React bindings for AG Grid. https://www.ag-grid.com/react-data-grid/',
    'leaflet v1.9 - Open-source JavaScript library for interactive maps. https://leafletjs.com',
    'react-leaflet v5 - React component wrappers for Leaflet: MapContainer, TileLayer, Marker, Popup. https://react-leaflet.js.org',
    'vite - Build tool and development server. https://vite.dev',
    'bootstrap v5.3 (via CDN) - CSS framework for responsive layout, navbar, cards, buttons, forms, and alerts. https://getbootstrap.com'
)

# APPLICATION DESIGN

Set-Section 'Navigation and Layout' 'Usability and Quality of Design' @(
    'The application follows a standard top-navigation SPA layout with a persistent dark navbar rendered on every page. Navigation items are conditionally rendered based on authentication state - unauthenticated users see Register and Login, while authenticated users see Rated Rentals and Log Out instead.',
    'The page structure is: Landing (/) with a hero section and call-to-action; Rental Search (/search) with a filter card above an AG Grid infinite scroll table; Individual Rental (/rentals/:id) with a two-column layout showing property details and a Leaflet map; Login (/login) and Register (/register) as centred single-column card forms; and Rated Rentals (/rated) as a protected route showing a table of previously rated properties.',
    'All routing is handled by React Router v7 BrowserRouter. A ProtectedRoute component wraps the Rated Rentals page - unauthenticated users are redirected to /login with the intended destination saved in router state, then returned to that destination after login.',
    '[INSERT: any rough sketch or wireframe you made, even a photo of a paper sketch]'
)

Set-Section 'Usability and Quality of Design' 'Accessibility' @(
    'Strengths of the design:',
    'The infinite scroll pattern removes the friction of manual pagination - users scroll naturally to discover more results, consistent with modern listing websites. Filter controls are grouped in a card with clear labels and a prominent Search button. The postcode filter gives users precise narrowing capability. The two-column layout on the individual rental page keeps the map visible alongside property details without excessive scrolling. Error states are surfaced inline via Bootstrap alert components rather than browser alerts.',
    'Weaknesses and areas for improvement:',
    'The search table has no prominent loading indicator while the first page of results fetches. The postcode input accepts any text with no validation, so an invalid postcode returns an empty result set with no explanation beyond the AG Grid no-rows overlay. The star rating success alert does not auto-dismiss. The Rated Rentals table shows full property titles which can truncate on narrow screens.',
    '[INSERT: screenshots illustrating the search page, individual rental page, and rated rentals page]'
)

Set-Section 'Accessibility' 'Technical Description' @(
    'This section analyses the application against the W3C Priority 1 Accessibility Requirements and considers inclusive design for Aboriginal and Torres Strait Islander users.',
    '1. Provide a text equivalent for every non-text element. Partial compliance. The Leaflet map renders as a div with no ARIA label - a screen reader user receives no information about the property location. The star rating component uses Unicode star characters with no ARIA labels. Fix: add aria-label to the map container and star rating component.',
    '2. Ensure all information conveyed with colour is also available without colour. Partial compliance. Star ratings use gold and grey colours to indicate filled versus unfilled stars. A user with colour vision deficiency cannot determine the rating value from colour alone. Fix: display a numeric label alongside the stars, e.g. 4/5.',
    '3. Organise documents so they can be read without style sheets. Not compliant. The application depends entirely on Bootstrap CSS and React rendering for its structure, which is a fundamental limitation of component-based React SPAs.',
    '4. Ensure text equivalents for dynamic content are updated. Partial compliance. AG Grid includes built-in ARIA attributes (aria-rowcount, aria-rowindex) but there are no live region announcements when new rows load during scrolling.',
    '5. Avoid causing the screen to flicker. Compliant. The application uses only CSS transitions from Bootstrap and does not cause screen flicker.',
    '6. Use the clearest and simplest language appropriate for the site content. Compliant. The application uses plain English throughout.',
    '7. For tables, identify row and column headers. Compliant. AG Grid generates role=columnheader elements. The Rated Rentals page uses a standard HTML table with thead and th elements.',
    'All form inputs use label elements with htmlFor attributes matching input IDs, which is correct practice for screen reader compatibility.',
    'Aboriginal and Torres Strait Islander Considerations:',
    'The application does not include an Acknowledgement of Traditional Owners. Given that the application presents data about land and housing across Australia - country with deep significance to First Nations peoples - adding a brief acknowledgement on the landing page or in a footer would be appropriate.',
    'The application requires a modern browser and a stable internet connection. This may present a barrier for users in regional or remote communities where connectivity is limited. The application has no offline capability.',
    'The visual design uses English only, with no support for Indigenous languages, limiting accessibility for users whose primary language is not English.'
)

# TECHNICAL DESCRIPTION

Set-Section 'Architecture' 'Test plan' @(
    'The application source is organised as follows:',
    'src/App.jsx - Router setup, all route definitions, ProtectedRoute wrapper',
    'src/main.jsx - React DOM root, AuthProvider wrapper, Leaflet CSS import',
    'src/context/(C) AuthContext.jsx - AuthProvider: token state, login/logout functions, 401 event listener',
    'src/context/(C) authContextCore.js - AuthContext createContext and useAuth hook',
    'src/services/(C) apiUtils.js - BASE_URL config, handleResponse with 401 interceptor',
    'src/services/(C) rentalsApi.js - getStates, getPropertyTypes, searchRentals (with sort/filter/postcode/page), getRentalById',
    'src/services/(C) ratingsApi.js - getRatedRentals, getRatingForRental, submitRating',
    'src/services/(C) authApi.js - loginUser, registerUser',
    'src/components/(C) NavBar.jsx - Responsive Bootstrap navbar with auth-conditional links',
    'src/components/(C) RentalTable.jsx - AG Grid Infinite Row Model, createDatasource factory, sort wiring via params.sortModel',
    'src/components/(C) RentalMap.jsx - Leaflet MapContainer with property marker',
    'src/components/(C) StarRating.jsx - Interactive 1-5 star rating UI',
    'src/components/(C) Paginator.jsx - Prev/Next pagination with page X of Y display',
    'src/pages/(C) LandingPage.jsx - Hero section and call-to-action',
    'src/pages/(C) RentalSearchPage.jsx - Filter form with activeFilters state pattern, RentalTable',
    'src/pages/(C) IndividualRentalPage.jsx - Property detail, map, star rating, same-postcode list',
    'src/pages/(C) LoginPage.jsx - Login form with redirect-back logic',
    'src/pages/(C) RegisterPage.jsx - Registration form with inline error handling',
    'src/pages/(C) RatedRentalsPage.jsx - Rated properties fetched and enriched with full rental details',
    'The application uses unidirectional data flow: pages fetch data via service functions, update local state, and pass data down to components as props. Authentication state is managed globally via React Context and persisted in localStorage.',
    'The key architectural decision is the AG Grid Infinite Row Model datasource pattern. When filters change on Search click, a new datasource is created and set on the grid via gridRef.current.api.setGridOption, which purges the cache and triggers a fresh page-1 fetch. The getRows function maps AG Grid startRow to the API page parameter and reads params.sortModel for server-side sorting.',
    '[INSERT: screenshot of the src/ folder structure from File Explorer or your IDE]'
)

Set-Section 'Test plan' 'Difficulties / Exclusions / unresolved & persistent errors' @(
    'Manual testing was performed across all major user flows.',
    'Test: Load landing page | Expected: Hero content and nav render correctly | Result: Pass',
    'Test: Search with no filters | Expected: All rentals load, infinite scroll fetches more on scroll | Result: Pass',
    'Test: Search by state Qld | Expected: Grid shows only Queensland properties | Result: Pass',
    'Test: Search by postcode 2144 | Expected: Grid shows Auburn properties only | Result: Pass',
    'Test: Sort by Rent/wk ascending | Expected: Grid re-fetches and shows cheapest properties first | Result: Pass',
    'Test: Click a rental row | Expected: Navigates to /rentals/:id with correct property data | Result: Pass',
    'Test: Individual rental page with coordinates | Expected: Leaflet map renders at correct location | Result: Pass',
    'Test: Same-postcode suggestions | Expected: Up to 5 other properties in same postcode shown | Result: Pass',
    'Test: Register new user | Expected: Account created, redirected to login with confirmation banner | Result: Pass',
    'Test: Register duplicate email | Expected: Inline error User already exists | Result: Pass',
    'Test: Login correct credentials | Expected: Token stored, redirected to intended page | Result: Pass',
    'Test: Login wrong password | Expected: Inline error Incorrect email or password | Result: Pass',
    'Test: Rate a rental authenticated | Expected: Stars clickable, rating saved, success message shown | Result: Pass',
    'Test: Rate a rental unauthenticated | Expected: Stars disabled, login link shown | Result: Pass',
    'Test: View Rated Rentals | Expected: Table shows rated properties with title, suburb, state, rating, date | Result: Pass',
    'Test: Click Rated Rentals row | Expected: Navigates to correct /rentals/:id | Result: Pass',
    'Test: Access /rated unauthenticated | Expected: Redirected to /login, returns to /rated after login | Result: Pass',
    'Test: Expired token | Expected: Automatic logout, nav updates to show Login/Register | Result: Pass',
    'Test: Invalid route /xyz | Expected: 404 catch-all renders, no crash | Result: Pass',
    'Test: Empty search results | Expected: AG Grid No rentals found overlay shown | Result: Pass',
    '[INSERT: screenshots of key test cases, especially error states and edge cases]'
)

Set-Section 'Difficulties / Exclusions / unresolved & persistent errors' 'Extensions (Optional)' @(
    'Key challenges encountered during development:',
    '1. AG Grid Infinite Row Model datasource refresh on filter change. The most technically challenging part was ensuring the grid re-fetches from page 1 when the user applies new search filters. Simply updating React state is not sufficient - the grid internal cache retains the old datasource. The solution was to replace the datasource object entirely via setGridOption, which forces a full cache purge and a fresh page-1 getRows call. A useRef is used to hold the current filters for access inside the onGridReady callback, avoiding a stale closure.',
    '2. The /rentals/:id endpoint does not return an id field. The individual rental endpoint returns all property data except the rental own ID. When the Rated Rentals page merges rating data with rental details, the ID must be explicitly preserved from the rentalId field in the ratings response. This caused a navigation bug (going to /rentals/undefined) when clicking rows in the Rated Rentals table.',
    '3. Same-postcode suggestions were initially always empty. The original implementation fetched the first page of state-level results and filtered client-side by postcode, which only checked 10 properties. Fixed by using the API postcode query parameter directly on the /rentals/search endpoint.',
    'Known outstanding issues: The star rating success alert does not auto-dismiss. The Rated Rentals page makes parallel API calls to enrich all ratings - for users with many ratings this could exceed rate limits, though this was not observed during testing.'
)

Set-Section 'Extensions (Optional)' 'User guide' @(
    'Potential future improvements include: auto-dismissing the star rating success alert; adding a loading skeleton in the search table while the first page loads; displaying a numeric rating label alongside the star icons for accessibility; adding an Acknowledgement of Traditional Owners on the landing page; and implementing a map view on the search page to show the geographic distribution of search results.'
)

Set-Section 'User guide' 'References' @(
    'Getting Started: Open the application in your browser. The landing page displays a welcome message and a Search Rentals button.',
    'Searching for Rentals: Click Rental Search in the navigation bar or the button on the landing page. Select a State, Property Type, and/or enter a Postcode - all fields are optional. Click Search. Results appear in the table. Scroll down inside the table to automatically load more results. Click any column header such as Rent/wk to sort the full dataset by that column. Click again to reverse the sort.',
    '[INSERT: screenshot of the search page with results loaded]',
    'Viewing a Property: Click any row in the results table to open the Individual Rental page. This shows the full property description, address, weekly rent, bedrooms, bathrooms, parking, and agency. An interactive map shows the property location. Other rentals in the same postcode are listed below the map.',
    '[INSERT: screenshot of the Individual Rental page]',
    'Registering and Logging In: Click Register in the navigation bar. Enter your email and a password, then click Register. You will be redirected to the Login page. Log in with the same credentials. Once logged in the navbar shows Rated Rentals and Log Out.',
    'Rating a Property: Navigate to any Individual Rental page while logged in. Click one of the five stars in the Rate this property section to submit your rating. A green confirmation message appears.',
    '[INSERT: screenshot of the star rating UI]',
    'Viewing Your Rated Rentals: Click Rated Rentals in the navigation bar. This page lists all properties you have previously rated with the title, suburb, state, your star rating, and the date. Click any row to return to that property page.',
    '[INSERT: screenshot of the Rated Rentals page]',
    'Logging Out: Click Log Out in the navigation bar. You are returned to the landing page and your session is cleared.'
)

Set-Section 'References' 'Appendices as you require them' @(
    'React Documentation. (2024). React. Retrieved from https://react.dev',
    'Remix (React Router). (2024). React Router v7. Retrieved from https://reactrouter.com',
    'AG Grid. (2024). AG Grid Community Infinite Row Model. Retrieved from https://www.ag-grid.com/react-data-grid/infinite-scrolling/',
    'Leaflet. (2024). Leaflet an open-source JavaScript library for interactive maps. Retrieved from https://leafletjs.com',
    'React Leaflet. (2024). React Leaflet. Retrieved from https://react-leaflet.js.org',
    'Bootstrap. (2024). Bootstrap v5.3 the most popular HTML, CSS, and JS library. Retrieved from https://getbootstrap.com',
    'Vite. (2024). Vite Next Generation Frontend Tooling. Retrieved from https://vite.dev',
    'W3C. (1999). Web Content Accessibility Guidelines Full Checklist. Retrieved from https://www.w3.org/TR/WAI-WEBCONTENT/full-checklist',
    'QUT CiteWrite. (2024). Citing and referencing guide. Retrieved from https://www.citewrite.qut.edu.au/cite/'
)

# SAVE

$doc.SaveAs([ref]$output)
$doc.Close()
$word.Quit()
[System.Runtime.InteropServices.Marshal]::ReleaseComObject($word) | Out-Null

Write-Host "Done. Report saved to: $output"
