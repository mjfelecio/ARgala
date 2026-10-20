# ARgala — Featured Destinations MVP Design Specification

**Status:** Approved visual direction and existing SRS requirements reconciled for the **next proposed implementation milestone**. Product code is not authorized by this document alone; the agent handoff is a reviewable proposal.

**Sources of authority (descending when conflicting):** the owner's direct client conversation; approved Stitch destination design and previous scope decisions; `ARgala_SRS_and_Diagrams.docx` Draft 1.0 (S=source, D=derived/unapproved by default); current app contracts. Never re-introduce the SRS's exclusion of general nearby discovery.

## Goal

Add a protected, navigable **Featured Destinations** catalog for exactly nine study destinations; a genuine Lake-Danao-style destination details/daytime preview page; destination-centered nearby establishment discovery; and Directions/Map integration where verified coordinates exist. **Preserve** user-centered discovery, the AR camera, authentication, and paid API safety. This is a scuffed-but-functional first implementation, not content-complete UAT.

## Visual target and permitted deviation

Use `reference/destination-daytime-preview.png` and matching Stitch HTML only as layout/visual references. Approved hierarchy: scenic hero when media approved, destination name/location, daytime gallery, overview, short highlights, Get Directions, View on Map, Explore Nearby. Rounded green primary/mint secondary buttons, UniWind/HeroUI, centralized `global.css`; small screen scrolls rather than shrinking everything.

Stitch's apparent real photos, Lake Danao facts, six photos, altitude, temperature, access rules, weather, travel times, 'AR available within 500m', placeholder attractions outside 500m, and trail assertions are **not** approved data. Do not ship them, generate them, or silently replace them with guesses.

## Content model and approval boundaries

- Nine stable IDs D01–D09 come from Draft 1.0, §3. Their names are **provisional SRS labels**, not verified official names. Variant spellings (Janagdan/Hanagdan, Alto/Alta) are awaiting client review.
- Catalog data is **locally bundled, typed and audited** under `src/features/destinations/` for fast MVP iteration. No admin CMS/Supabase catalog schema and no Google business directory caching. An upgrade path can be documented without implementing it.
- Differentiate a **verified destination center** (for explicit 500m nearby search) from a **verified accessible route entry** (for Google walking route). Both nullable, neither fabricated.
- Store optional client-approved overview/highlights translations for `en`, `ko`, `ja`; missing locale content shows a visible English fallback marker **only if approved English text exists**. Do not invent translations or show empty filler text.
- Daytime preview media entries must have an approved bundled asset, credit/rights reference, and translated caption when available. Zero approved photos yields a designed 'Preview not yet available' state; no unrelated stock or Stitch imagery in the product.
- The bundled manifest may show all nine names and clickable detail pages without geographic data. Google-powered actions are disabled with explanatory states until verified required coordinates are supplied. This is preferable to a route to the wrong mountain or resort.

## Navigation and user experiences

- Entry: a visible **Featured Destinations** action within Explore/Home, including its no-GPS/no-Maps-key fallback branch. Do not add an extra tab, replace the Google Maps map, or require sensor permissions for catalog browsing.
- `/destinations` renders the nine cards, with basic verified category/place labels where available. Each opens `/destinations/[destinationId]` (protected parent-stack routes, not tabs).
- Detail page works with bare/deep links, absent photos/description, and offline bundled catalog. Gallery offers scrollable thumbnails and full-screen photo viewing where approved photos exist. The label **Daytime Preview — not live camera imagery** is always clear.
- Nearby: an explicit **Explore Nearby** button when the verified center exists, calling the existing authenticated `placesService.nearby({center: verifiedCenter, radiusMeters:500, language})`. No request on screen mount, refocus, locale change, camera motion or list expansion. Filter returned results with `distanceMeters(destinationCenter, poi) <= 500` using unrounded distance (accept 499/500, reject 501). Google Places' 20-result cap is not exhaustive.
- Nearby rows show **distance from destination** prominently, not incorrectly distance from current user. If a usable user GPS fix exists via **explicit location request**, optionally also show separately labeled **distance from you**. Catalog/gallery remains accessible when location denied.
- Nearby POI selection opens the real `/place/[providerId]` flow with the existing in-memory selection handoff; do not auto-fetch details in addition to what the current flow permits. Provider ID and attribution survive.
- Route: explicit Get Directions for a catalog destination uses **only the verified accessible route entry**. Construct a curated `Place` adapter (`provider:'curated'`, `source:'curated'`, stable internal ID, verified entrance coordinate), then invoke current single-use `createRoutePreviewIntent(...)` and open `/directions`. This must *not* call Google Place Details with catalog IDs. From Route Preview, the 'View Place Details' action should return to the curated destination page for curated subjects, not to Google provider details.
- View on Map: open the native Home Map centered on a verified coordinate, using a namespaced/local curated handoff that cannot cause a Google Place Details request. If safe cross-screen map support would disproportionately expand this PR, document it as a separately scoped implementation gate rather than shipping an inert button.
- Open AR, if present: launches generic live camera discovery **at the user's actual current position**. It does not simulate remote AR at the tourist destination and is **never gated by the destination-centered 500m rule**.

## Distance/permission/error semantics

Separate three values: existing *user-centered discovery radius* 1,000m; device-local *AR activation radius* initially 100m; this new *destination-centered establishment radius* 500m. They are not the same setting. Distances are straight-line unless the Google Routes service returns a walking estimate. Invalid center, missing entry, missing media, no results, denied GPS, failed provider request, and unavailable walking route require distinct user-readable states.

## Acceptance for PR #13

- Nine stable catalog cards and details pages navigate without location/camera access.
- Approved media displays and zero-media state is honest; no invented content/rights.
- Explicit 500m nearby call works on verified centers, filters 499/500/501 correctly, with attribution, correct distance labels and known 20-result limitation.
- Explicit Directions uses verified entry via current paid-call authority, with no auto/duplicate requests. Missing entry blocks routing meaningfully.
- Generic user-centered Explore and AR discovery work unchanged. Deep links, back, sign out, EN/KO/JA and Android font scale are covered.
- Agent records actual Android build/device evidence separately from mocks. Missing approved content remains a documented UAT blocker, **not** a claim of finished nine-site tourism content.
