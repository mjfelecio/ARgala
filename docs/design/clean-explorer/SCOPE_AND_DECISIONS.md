# Scope and decision register

## Approved scope versus artwork

The owner approved the visual direction and specific variants. Approval of a design is not approval of every content sample or feature the generator added. Both the direct client conversation and the draft SRS remain requirements; the direct conversation wins on conflicts. General discovery is not replaced by a nine-item catalog.

| Item | Source/status | Integration treatment |
| --- | --- | --- |
| Green/white, map-first, rounded buttons | [C] Approved | Preserve. |
| Refined Home, selected AR, rich/minimal details, route overview, destination, welcome, auth, settings | [C/E] Approved references, with discussed exclusions | Use manifest IDs; do not select an older variant by filename alone. |
| Camera POI labels and radius behavior | [R] Already implemented at baseline | Restyle without changing sensor/query authority. |
| Featured nine-destination workflow | [C] Real additional scope; not implemented in inspected core screens | Dedicated content/flow work after core UI; approved media and coordinates required. |
| Free-text/voice search and category filters | [E] Depicted; not supported by inspected nearby contract | Preserve actual Search action; separate capability decision before enabling. |
| Saved/bookmarks, contribution XP, audio guide | [E] Generated additions, not confirmed requirements | No placeholder controls, storage, routes or backend work. |
| Photos, ratings, opening hours, category metadata | [E] Rich mockups; missing from current Place DTO | Optional future data contract; do not make API/cost changes inside a visual PR. |
| Weather, accessibility/terrain assurance, transit/scenic-drive guidance | [E] Invented claims/capabilities | Exclude from first implementation. |
| AR only within 500 m | [E] Contradicts earlier explicit correction | No AR-launch gate. Keep activation/discovery/destination filters separate. |
| Static Lisbon/Lake Danao metadata | [E] Illustration | Not verified content or app defaults. |
| Terms/privacy and app version | [E] Appearance approved | Real configured links/version only; no fabricated legal documents/builds. |

## Proposed integration choices — review required

### P1 — Palette

Normalize common actions to the approved green `#247A53`; stronger state `#174D38`; white content; mint accents `#E7F4EC`; allow exported `#EEFDF3` page tint. Preserve the source's `#00603D` primary token as an observed conflict rather than pretending it never existed. A different selected mapping can be applied centrally after review.

### P2 — Navigation

Use Explore, AR View and Profile as the initial implemented destinations. This avoids inventing Saved while keeping the approved bar style. AR itself is immersive and has Back/Map, not a persistent tab bar. Do not restructure the current protected stack until this decision and the focus lifecycle tests are addressed. Add featured-destination access with its real flow; the absence of a catalog list design is not evidence that the requirement disappeared.

### P3 — Settings save model

Keep explicit Save for the first UI pass. The screenshot's lack of Save and its simulated preference toast do not prove autosave works. True autosave is a viable later choice, but needs failure recovery, persistence consistency and rapid-change handling. Display no success before the real operation completes.

### P4 — Primary home action

Use the search-pill appearance for the existing explicit Search Nearby action. No microphone, free-text promise or inert category rail. Adding text search or categories requires a deliberately scoped service/UI feature and a request-cost policy. Do not reinterpret panning or refocusing as authorization to call Places.

### P5 — Handoff and route intent

Preserve the existing AR place handoff and explicit map Walk action first. Unifying it into a single cross-screen Directions tap is not inherently prohibited, but must be separately expressed as a user-intent change and tested for exactly one request. It cannot be hidden in a route-screen mount effect.

## Not blockers for the first Home/AR restyle

The invalid welcome PNG, unapproved tourism photographs, absent catalog selector design, optional rich metadata and unconfigured About/legal links can be tracked without stalling shared UI and map/camera presentation. Do not call the entire design implementation complete while these are unresolved.

## Choices deliberately not made here

No new bottom-sheet library, icon dependency, font package, navigation rewrite, database schema, provider field mask, translation service or permanent caching system is selected solely from this export. The detailed implementation plan must inspect what is already installed and justify any minimal addition. No existing security/request restrictions are weakened for aesthetics.
