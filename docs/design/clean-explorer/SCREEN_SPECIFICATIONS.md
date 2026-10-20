# Screen-by-screen specification

Status: **review draft**. Reference IDs match `export-manifest.json`. [C/E/R/P] meanings are in README. All source markup is retained unmodified.

## Shared navigation and data rules

**[C/R]** General nearby discovery around the real user remains a first-class experience. The featured tourism flow adds to it; it does not restrict discovery to nine destinations or Ormoc. Camera orientation and user distances always come from the physical user's device, even while browsing a remote destination.

**[R]** At `87db710`, the root navigator is a protected Stack, not the four-tab mockup. `MapScreen` handles both map POI details and walking-route rendering. AR hands the selected ID/summary to the map without requesting a route on mount. Settings has an explicit Save action. There is no reason to discard this working behavior to reproduce static markup.

**[P]** Initial bottom destinations: Explore / AR View / Profile. Hide the bar inside immersive AR and on auth, standalone details and route views; retain an obvious Back/Map action. Featured destinations get an entry only with their actual catalog flow. Saved remains out of scope unless separately requested. Confirm this navigation adaptation before implementation; all focus/permission/query lifecycle tests must continue to pass.

**[P]** All screens below use real data or an explicit absence state. Example photographs, names, ratings, times, emails and version labels are not runtime defaults. Native Google map attribution and off-map Google/third-party credits must remain accessible.

---

## H01 — Home / Map Exploration

**Reference:** `argala_home_map_exploration_refined/` [E]. Map-first composition, pill controls, green POI emphasis, white selected-place sheet, rounded primary/secondary buttons [C].

**Existing base:** `src/features/map/map-screen.tsx` [R].

**Layout [P]:** retain a large live native map. Place the compact search/action row and restrained controls inside safe bounds. Position Recenter above the sheet. Dock the sheet above navigation/insets, starting compact. Present a selected POI without turning the screen into a long details page. Preserve real native POI taps and dynamically returned markers.

**Actions and data:** the initial visible Search is an explicit nearby search centered on the current device fix. A pill-shaped control must say what it actually does; do not present a functioning free-text field when it is only a Search button. Selecting a POI may invoke the existing details action. View Details and Open AR are screen actions. Walk/Get Directions requests a route only through explicit intent.

**Do not carry forward:** microphone/voice search, 3D/layers controls without functions, Saved/bookmarks, sample rating/open status/UNESCO badges, broad category filters lacking provider category data, or the artwork's Lisbon geography and black heading wedge. These are not authorized solely by their presence in H01.

**Required states [P]:** before first Search; acquiring/denied/disabled location; ready with no request; fetching; zero results; provider failure/retry; returned results; selected POI; selection unavailable after memory eviction; route loading/no route; insufficient location accuracy. Retain the returned-place limit explanation without describing results as every named place in the area.

**Acceptance:** panning/recentering/navigation/language changes alone create no paid requests; current position is not confused with the last search center; the map remains visible; details and attribution are not hidden behind navigation.

## A01 — AR Discovery / Selected POI

**Reference:** `argala_ar_exploration_selected_poi/` [E]. This is the selected-state reference; the default AR screenshot is not in the ZIP. The earlier default design containing stock camera controls was not approved for implementation [C].

**Existing base:** `src/features/ar/ar-screen.tsx`, `ar-discovery.tsx`, `projection.ts`, `use-ar-places.ts` [R]. Full behavior already exists; this slice is presentation plus explicitly tested layout integration.

**Layout [P]:** full-screen rear camera behind a small header, approximately directional place labels and a docked nearby/selection surface. Use a compact collapsed nearby state; show meaningful expanded content for an eligible/selected POI. Keep one manual selection visually stable. Provide a separate explicit Scan/Refresh action. Back or Map leaves the immersive camera; do not keep the generic tab bar over it.

**Non-negotiable behavior [R]:** preserve one-shot/watcher distinction, watcher freshness, heading freshness/quality/reference checks, current accuracy gates, selection priority, bounded labels, explicit provider actions and query cleanup. Camera permission failure must retain the useful list/data fallback. A UI redesign must not relax tracking gates to make labels look busier indoors.

**Selection and routing [R/P]:** selecting an already loaded label is not an object-recognition request. More Details uses the current explicit details action. Existing AR-to-map handoff passes the place summary/ID without a paid mount request; keep this first. A future one-tap cross-screen Directions behavior must carry explicit intent and prove exactly one route request; it must not be implemented as an unconditional route-screen effect.

**Layout integration:** current labels use width/lane calculations and fixed vertical offsets in the view. If compact pills replace them, make rendered dimensions, hit areas and collision calculations agree. Reserve actual measured header/sheet space. Do not pretend the vertical location of a label identifies a real building or altitude.

**Exclude:** selected-object target square, ground anchor/stem, camera app controls, sample 5-minute walking label, unverified GPS locked/calibrated indicators and scan animations suggesting visual recognition. Display approximate geographic distance, not an invented walking duration.

**Required states [P]:** unscanned; scanning; results with none inside activation; nearest eligible; manual selection including outside FOV; crowded labels; no results; camera denied; current position unreliable/stale; heading unavailable; provider error; background/resume. All returned places remain reachable in a list even when only a few directional labels fit.

**Acceptance:** no body/card styling change leaks camera/watchers, starts paid calls on focus or hides Google Maps attribution. Empty/not-in-range is not a permission error. Label taps and list taps select the same stable place ID.

## P01 / P02 — Place Details, rich and minimal data variants

**References:** `argala_place_details_rich/` and `argala_place_details_minimal/` [E]. Preserve the final rounded primary Directions action with subordinate Map/AR actions [C]. Use one presentation model with optional sections, not two disconnected implementations [P].

**Existing base [R]:** details are currently rendered in MapScreen/ArDiscovery; the shared Place contract has name, identifiers, coordinates, optional address/description/Maps URI and attributions. It does **not** currently expose photographs, category, ratings or opening hours. The design of a richer page does not enable those data fields.

**Layout [P]:** use one back/header pattern, not the two Back controls present in P01. With approved media: a hero image, place name, concise context and actions. Without media: a restrained neutral/category fallback and the same information/action hierarchy. Sparse data should make a shorter page, not force an oversized empty hero or fabricated explanatory cards. Details scroll; the content surface fills the viewport.

**Sections:** title; supported category only; user-relative straight-line distance when valid; address when supplied; approved overview when present; available factual rows; provider credit/Maps link. A route duration is shown only when there is a valid returned route for the relevant origin/destination, labeled as an estimate.

**Exclude or gate:** weather and Ideal for AR, transit/getting-here recommendations, OpenStreetMap verification, GPS telemetry badges, WGS84 as decorative authority, contribution/+50 XP, bookmarks/share/profile controls not requested, sample ratings/hours. Hide unavailable rows rather than fill them with static values. An additional native/static map on the details page is optional design scope; preserve a View on Map action without adding unnecessary requests.

**Required states [P]:** summary available/details loading; details error with summary retained; rich content; no media; no description/address; no usable location; long proper names; selection absent after cold launch/memory cleanup. Recover explicitly rather than invent a place.

**Acceptance:** both variants look intentional with only name/address/coordinates; Back returns to the source journey; provider ID is preserved; no persistent provider-content database is introduced.

## R01 — Walking Directions / Route Overview

**Reference:** `argala_walking_directions_route_overview/` [E/C]. `argala_walking_directions_expanded_info/` is retained as alternate R02, not the target [C].

**Existing base [R]:** walking request, distance/duration, polyline decoding, map fitting, warnings and error handling already exist in MapScreen and the directions service. They may remain a mode of the same map rather than a second native map instance [P].

**Layout [P]:** route dominates the live map. Blue route, blue origin/current-user distinction as needed, green destination. Minimal header; Recenter and Fit Route; compact docked summary with returned walking duration/distance, destination and Back to Map / Place Details. Fit the complete route above the **measured** sheet/header, not a screenshot's hardcoded shape.

**Behavior:** route is a preview snapshot from the submitted origin; updating the user marker does not make that route continuously rerouted. A refresh must be explicit. Do not suggest a walking duration exists before a route succeeds. Retain provider warnings and honest missing-route state.

**Exclude:** Flat Terrain even in preferred R01; accessibility/step-free/elevation/optimal path from R02; simulated arrival clock; audio guide; Start Navigation; voice guidance; automated rerouting; alternative travel modes; sample black route triangles and impossible screenshot map geometry.

**Required states [P]:** requesting; route success; no route; timeout/failure; no location; overview/expanded actual warnings; return to selected place. A clear unavailable result must never be replaced with a straight-line path that looks like a road route.

## D01 — Featured Destination / Daytime Preview

**Reference:** `argala_lake_danao_natural_park_daytime_preview/` [E/C]. An approved **visual target for additional product work**, not a restyle of an existing completed catalog.

**Layout [P]:** scenic hero with one Back action and honest Daytime Preview/photo count, destination heading, approved overview, horizontal gallery, compact highlights, Directions/Map actions and nearby-establishment entry. Use actual asset count rather than the mockup's six-photo label. Full-page export scrolls natively.

**Data boundary [C/R]:** approved project destination content is distinct from Google discovery data. Neither the nine destinations nor their coordinates/imagery should be fabricated from this export. Current provider DTOs and inspected screens do not implement the curated manifest, gallery or catalog selector.

**Nearby semantics [C/P]:** preserve both general user-centered discovery and the additional destination-centered experience. Label the search center and which point a shown distance is measured from. For the draft destination-centered 500 m rule, the displayed 4.2 km/7.8 km example rows are not valid boundary examples. No automatic paid request occurs just because a user opens this page; expose See Nearby Places as an explicit action.

**Exclude:** Available within 500m as an AR-launch gate; remote-camera illusion; current weather; scenic-drive duration/route mode; Paved Access/altitude as unverified facts; Places API in consumer labels; spatial waypoints along boardwalks. Keep user-facing nearby wording simple while retaining actual provider attribution.

**Required states [P]:** approved complete destination; missing/unapproved media; translated-text fallback; unknown user distance; no nearby request; zero nearby results; provider error; gallery opening/closing. Content approval and a catalog entry point are tracked separately; no blank Saved tab is repurposed silently.

## W01 — Welcome / Language Selection

**Reference:** `argala_welcome_language_selection/code.html` [E]. Its PNG is invalid; the final corrected visual has not been image-verified from this export. The previous screenshot in the conversation is a pre-fix view and must not be labeled the corrected output.

**Supported design [E/C]:** scenic hero; ARgala; “Discover places around you.”; white language selector; English/한국어/日本語; Continue; change-in-settings note. The extra AR-explanation card is gone from HTML. No form or fake UI belongs inside the photograph.

**Layout [P]:** full-height page, not floating sheet. Remove decorative drag handle on this non-draggable page. Native system bars, no imitation clock/battery. All three languages have clear selected states. It must remain scrollable on a small/enlarged-text device.

**Integration [R]:** first-launch language flow is implemented with protected `/welcome` routing, existing settings persistence and a dedicated completion marker. See [Welcome implementation](WELCOME.md) for partial-write recovery and legacy migration. Do not reset a signed-in returning user or force onboarding at every auth event. Selecting a language does not require GPS, camera or a paid provider call. Confirm persistence before completing Continue; show failure/retry if saving fails.

**Acceptance:** request replacement PNG before claiming exact visual parity, but do not block Home/AR restyling while waiting. Assets must be approved, not assumed genuine Lake Danao photography because the HTML alt text says so.

## AU01 / AU02 — Sign In / Create Account

**References:** refined sign-in and create-account folders [E/C]. Both corrected exports have a scenic top and continuous white lower surface.

**Existing base:** `src/features/auth/sign-in-screen.tsx` and auth provider [R]. Preserve email/password-only sign-in, registration confirmation, session restoration, generic/localized failures and protected routes. Do not add social login, profile fields, password recovery or guest behavior simply to fill whitespace.

**Layout [P]:** modest photograph, coherent heading/supporting text, identical white rounded inputs, password visibility, primary action and inline switch. Account-switch link stays naturally reachable with keyboard and font scaling. No fake bottom gap, unnecessary drag handle, nested outer card or fixed screen-height assumption.

**Required states:** empty; focused; invalid email; registration minimum-password helper; submitting/disabled; rejected credentials; network failure; registration succeeds without session → visible email-confirmation message and sign-in path; session restoration. A missing exported confirmation screen does not justify removing that current flow.

**Acceptance:** changing the visual form cannot change credential normalization or auth/session cleanup. Mock email/password from HTML must not ship as field defaults.

## S01 — Profile & Settings

**Reference:** `argala_profile_settings/` [E/C]. Compact account summary; language rows; AR radius; device settings; About/version/legal area; restrained sign-out.

**Existing base [R]:** local preferences keyed by `argala.preferences.v1`; default radius 100 m, allowed 10–1000; separate discovery radius; explicit async Save; real session/sign-out. The approved screenshot is appearance, not authorization to change those semantics.

**Proposed first-pass persistence [P]:** selection/presets/slider edit a draft; show a consistent Save action and unsaved-state treatment. Keep saving disabled while busy; confirm success only after persistence resolves; retain failures. An autosave alternative needs a separately approved behavior change and rollback/concurrency tests. Do not copy Stitch's timeout-based “Preferences updated” toast.

**Radius:** display value, thumb and presets must agree; support keyboard/screen-reader adjustment or an equivalent numeric entry. The 100 m activation radius is global to POIs on this device, not remotely global across all accounts. It changes proximity presentation, not physical GPS sensitivity and not the separate discovery distance.

**Account/About:** actual email and initial, actual app version/build. No fictional verified-user meaning. About and legal rows require real destinations/content supplied by owner; omit unconfigured actions rather than make them dead links. Keep sign-out behavior and surfaced errors.

**Exclude:** search in settings, Saved, editable profile/verification tier, sample v1.4.2/Build 240, “Control spatial sensor triggers and sensitivity.” as a description of the radius. Use plain explanatory copy instead [P].

**Required states:** loaded preferences; draft dirty; saving; saved; load/save failure; language switch; invalid radius; permission return; sign-out loading/error. A session change must not leave protected provider data visible.

## Export coverage gaps

There is no exported all-destinations catalog, photo viewer, email-confirmation screen, permissions/error screen, initial unsearched Home, default/no-heading AR, or keyboard-open auth state. Required behavior for these is specified above, but they are **not approved screenshots**. Extend the chosen components for necessary states; do not claim pixel-perfect comparison against nonexistent references.
