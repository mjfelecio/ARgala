# ARgala — Seafoam Forest UI Refresh, Approved Design Specification

> **Later owner scope correction:** AR design is excluded from this task and
> reserved for a separate task. Retain the existing native AR presentation,
> including panel #102724 and edge #71DCD2. This overrides every AR recoloring
> instruction in this archived handoff, including implementation Task 8.


**Owner approval:** 2026-11-02 (Asia/Manila)  
**Direction:** Option B — lively, modern exploration app  
**Status:** Eight visual references approved; no app implementation authorized/performed by this package.  
**Repository:** `mjfelecio/ARgala` (`main`)

## 1. Intent and design authority

Refresh ARgala's current green-heavy presentation so it feels energetic, welcoming, polished and genuinely suited to travel exploration. The client requires green as the primary identity; this change **keeps green** but removes the exhausting full-screen pale-mint wash. The app remains map-first and familiar in interaction, like a polished Google Maps-adjacent travel guide, with distinct identity on featured destinations, the Tourist Passport and curated AR.

**Approved treatment:** warm ivory / white content foundation; rich forest-green actionable controls; deep forest headings; selective bright seafoam accents; mint mist only where context is useful. Preserve the finalized ARgala outlined logo, app icon, splash and Journey artwork. All eight PNGs in `references/approved/` are approved conceptual references for *visual hierarchy and treatment*, not immutable screenshots or new behavior specifications.

### Decision trail and alternatives considered

- **Rejected: retain all-over pale mint and merely raise saturation.** It leaves controls, backgrounds, sheets and category surfaces too similar.
- **Considered: restrained premium/white tourism UI (Option A).** Readable, but less expressive than the owner's desired experience.
- **Approved: lively modern exploration (Option B).** White/ivory anchors the app, deep green gives hierarchy, and seafoam gives ARgala personality without becoming neon or game-like.

### Important supersession

On 2026-11-02, the owner explicitly approved the eight later UI mockups. This **supersedes only** the earlier artwork-only visual scope in current `AGENTS.md`, `DESIGN.md`, `docs/ui-infrastructure.md`, `docs/design/clean-explorer/DESIGN_SYSTEM.md`, `.agents/skills/argala-ui/SKILL.md`, and `docs/brand-kit-rollout.md` where they tell agents to leave screen surfaces, tabs, map presentation and native AR colors entirely unchanged. The earlier Seafoam Forest v2 **asset/logo identity remains locked**; later UI approval permits refinement of UI semantic colors and native AR visual treatment. During implementation reconcile these conflicting passages with this approval, without removing unrelated functional/safety requirements. The repo's real `AGENTS.md` and current working tree remain the operational authority for everything outside this explicit visual update.

## 2. Goals, non-goals and anti-goals

**Goals**

1. One coherent semantic color system across Explore, Featured, Destination Preview, Google Place Details, Profile/Settings, Saved Places, Directions and native Viro experience.
2. Clear page → surface → headline → primary action hierarchy at normal and large Android text sizes.
3. Destination-first content and compact Passport progression without hiding approval, sync or arrival state.
4. Equally polished loading, empty, disabled, partial-data, failure/retry and permission states.
5. Preserve actual source data, provider attribution, signed-in state, costs and native behavior.

**Non-goals**

- A navigation redesign, new tabs, app-wide dark mode, new backend, new data contracts, new photo service, invented destination content, route navigation engine or user profile features.
- Replacing Google Maps with a background image, changing Google place identifiers, making paid searches automatic, or geospatial/world anchors in AR.
- Rebuilding native AR/Viro panel semantics to imitate a static concept image. No 3D models, particles, holographic user notes or unrelated sci-fi cockpit.
- Fixing all prior audit bugs as a side effect of theme work. Track them explicitly and verify separately.

**Anti-goals / failure conditions**

- Another full-screen wash of pale green; saturated seafoam as small text on white; multiple competing filled CTAs; gratuitous decorative gradients on maps or live camera.
- Content/pictures or location precision fabricated from illustrative mockups.
- Loss of translation, keyboard, TalkBack, Android Back, paid-intent, native map attribution, location freshness, admission, Passport eligibility or Viro held-action behavior.
- A beautiful mockup implemented through brittle fixed heights, clipped content or custom theme libraries contrary to existing stack.

## 3. Design token contract

Use **`global.css` as the only token/theme source**. It already contains Seafoam Forest logo tokens and current primary green; extend/rebalance semantic UI roles, never create a parallel TypeScript theme or hardcode new colors per screen.

| Role | Approved reference | Usage and limits |
| --- | --- | --- |
| Signature seafoam | `#42D5A5` | Logo stays unchanged; restrained active indicators, decorative icon disks, progression highlights, approved native AR edges; **not white-surface small text** |
| Primary forest | `#247A53` | Primary filled CTA, selected filters, enabled controls; prefer existing accessible white label |
| Deep forest | `#174D38` | Strong headings, icons, selected/pressed emphasis, Passport dark base, dark AR glass |
| Ivory | `#FCFBF7` | Default ordinary page background and tab/navigation plane; not a replacement for the live map |
| White | `#FFFFFF` | Search, sheet, detail cards, readable form surfaces |
| Mint mist | `#E8F8F0` | Sparing context surfaces, unselected chips, icon circles, soft info states; never an entire page plus its adjacent components |
| Main ink | existing `#1C2923` | Normal content text; keep dark readable body copy |
| Secondary ink | existing `#3F4942` | Labels, support copy and details |
| Route blue | existing `#2A72E5` | User position, route and provider/navigation semantics only; not a replacement brand accent |
| Errors/warnings | existing semantic danger + accessible warning variant | Keep distinct from brand green, with icon and text, not color-only meaning |

**Measured contrast reference (not a complete audit):** deep forest on ivory ~9.41:1; primary green with white ~5.27:1; deep forest on seafoam ~5.24:1; seafoam on white only ~1.86:1. Thus seafoam should be used for decorative surfaces, outlines or with deep forest foreground, not small white-background text or thin action labels. Re-measure translucent AR panels against actual bright/dark camera footage. Keep route/provider colors distinguishable without repainting Google labels.

### Semantic distribution

- Default pages: ivory, with mostly white content surfaces and subtle green focus points. Profile utility screens can remain whiter where that reads better.
- Map screens: genuine Google Maps imagery/map style, white floating controls, white lower sheet, ivory bottom nav. Do not overlay opaque ivory on map or obscure credits.
- Cards: white with restrained borders/shadows, 20dp-ish existing card radius; strong headline and one meaningful next action. Avoid piling 4 full-width pills per list item.
- Native AR: camera remains the visual base. Existing dark/translucent Viro surfaces acquire considered forest/seafoam accents while preserving existing content layout and optical contrast.
- No page-wide gradients, neon cyan flood, fake terrain, excessive blur or generic vector wallpaper. The compact forest Passport card may use a restrained brand treatment distinct from the rest of the page.

### Typography and geometry

Retain bundled **Plus Jakarta Sans** with native Japanese/Korean fallbacks and existing `global.css` roles: hero 28/34, title 24/32, section 20/26, card 16/22, body 16/24 or 14/20, metadata 12/16 only when nonessential. Use the existing 4dp rhythm, default 16dp page gutters (established 20/24 where intentional), 8–12dp intra-group, 16–24dp between groups, ~16dp input, 20dp card, 28dp map sheet, pill actions. Touch targets minimum **48dp**, primary 56dp where appropriate. Prefer normal native text growth, not screenshot-pixel replication. Visible focus, selected, pressed, disabled and busy states must all have semantic treatment.

## 4. Approved screen mapping

Each numbered image is a design reference. **Implementation must render actual code-driven state, not paste these PNGs into the app.**

### `01-explore.png` — Explore

- Preserve existing compact branded query header, pinned Featured shortcut, horizontal category scroll, explicit Search this area, map selection, native MapView, recenter and accessible map sheet.
- Ivory/white floating search and lower dock; better active/inactive chip contrast; rich forest on selected All; forest primary Search this area only if it remains appropriately subordinate to map/task state; subtle seafoam active indication and ivory bottom tabs.
- Original reference has geographically huge green land areas. First inspect **actual native Google style/map regions** versus UI shell before changing anything. Where supported, prefer natural neutral land + distinct green parks, preserving roads, water, routes, labels, provider terms, map readiness, inset and attribution behavior. Rural map coloration may still be naturally green; do not make the map untruthful.
- Never regress unsearched/loading/empty/error/retry or selected sheet geometry. Blank sheet bug is separate issue #39.

### `02-featured-catalog.png` — Featured Destinations and Tourist Passport

- Make Passport a visually distinct **compact deep-forest progress card**: visited/total, clear progress, account sync affordance, tiny seafoam stamp motif. All values come from existing authoritative state; no fake stamps, visits or progress.
- Follow with a strong ‘Explore 9 destinations’ section and denser, readable destination rows: icon/approved badge or simple generic illustration, name first, provisional/pending meta, chevron. Never invent location-specific iconography as a factual claim; keep uniform illustration if editorial confirmation absent.
- Replace page-wide mint with ivory while preserving catalog eligibility, visible pending-content status and navigation.

### `03-destination-preview.png` — Curated destination detail / preview

- Lead with **actual destination name and approval state**, then the purpose (‘Explore this destination’s stories in AR’), not an enormous missing-media block before the name.
- A restrained, branded **placeholder illustration** can replace an empty media rectangle *only as decorative empty-state art*, not a fake approved photo. No media may be represented as approved without provenance/license.
- Distinguish ‘preview anywhere’ from ‘camera unlocks after arrival verification’. Keep GPS/AR eligibility and source-of-truth display; never activate the camera from a preview alone.
- Clear next action (‘Get Directions’), subordinate reminder action only when available, concise but visible content/approval and notification limitations. If actual approved stories are unavailable, show honest availability rather than an enabled but dead preview.

### `04-place-details.png` — Ordinary Google Place Details

- Prioritize provider-backed place name, available address and Get Directions; Map and Save/Remove are secondary.
- Group essential details and attributions in airy white sections; actual missing fields remain missing. Use original `ProviderAttributions`/Google credits, links and graceful errors.
- The mock hides **Open AR** for a generic nonfeatured place. Before implementing this change, reconcile the user-approved curated Viro-only rule against the existing separate legacy POI/compass camera overlay; guard featured Viro admission rather than blindly deleting an intentional legacy feature. No new Viro access for generic Google Places.
- Omit precise raw coordinates from the conceptual presentation unless an existing user-facing feature needs them; do not alter stored location source data.

### `05-profile-settings.png` — Profile and Settings

- Whiter/ivory page, compact real account identity and Saved Places shortcut, logical Language and AR & Location groups, clear selected language rows and 10–1000m slider/preset states.
- The mock anonymizes the account on purpose; the implementation must show the **real signed-in account identity**, proper sign-out/auth guard and existing save/persistence rules.
- Preserve EN/JA/KO autonyms, explicit Save where currently required, device-local activation radius defaults/limits, settings accessibility and one vertical scroll owner.
- Development Viro test routes may remain behind existing debug gates, but should not compete as major public-facing CTAs. Do not remove QA entry points without an agreed replacement.

### `06-saved-places.png` — Saved Places

- Replace huge repeated all-filled-action cards with compact white rows, one clear View action and subordinate Remove affordance; keep removal confirmation/recovery as existing behavior requires.
- Compact warning banner when sync needs attention, preserving the exact true local-vs-cloud safety claim and explicit Retry/Sign in options.
- **The sample names in the mock are illustrative and do not match proven bookmark IDs.** Do not persist/disclose unauthorized Google metadata, invent names or trigger paid Details calls on mount. Display a real known name only when permitted by existing transient contracts; otherwise an honest generic label with user-triggered details resolution and no exposed provider ID.
- Retain virtualized scalability for up to 1,000 saved bookmarks, session transitions, offline/local state and user-controlled sync.

### `07-directions.png` — Directions and Navigation

- Genuine map and provider route blue remain primary. White floating header/controls, ivory/white lower dock; strong destination, walking/driving selection, actual displayed mode, concise route length/time and explicit navigation eligibility.
- Keep the **measured/collapsed dock** and true expanded Journey; never copy a screenshot-fixed bottom-sheet height. Existing fresh-location/accuracy guards, explicit route intent, user location versus route origin, provider attribution and native Insets are untouchable.
- Any ‘Refresh location’ concept must use existing intentional recovery and permission rules; do not introduce a new request loop or imply navigation is ready when GPS is stale. Mode labels/copy issue #40 remains separate.
- Preserve existing Google Maps handoff and local walking-navigation contract; mock geometry and text are illustrative, not a substitute for actual computed route.

### `08-ar-camera-concept.png` — Live Viro chapter ring and reading UI

- **Not a camera screenshot or acceptance proof.** It visualizes brighter seafoam edges on a dark forest semi-transparent square, the actual camera unobstructed, Overview ahead, History to the right, and minimal top/bottom status utilities.
- Current app has more nuanced native Destination Stories: 1–12 chapter covers, `Opened` session indicators, held focus/collapse, media/text pages, controls, help, capture, recenter, A-/A+, tracking guards. Apply the color/legibility treatment to the **existing native presentation**. Do not replace it with a static two-tile overlay.
- Preserve the 1.5 Viro world-unit focused distance, orientation basis, translation behavior, native scene bounds, brief finger-pad hold/release (not short-tap), collapse-on-other-visible-tile, tracking loss recovery, permissions, expiry, restore and GPS/entry freshness.
- No bottom sheet; text and tiles must live **inside Viro**. The real physical background remains the user's camera feed; the mock's courtyard is fictional and must never ship as camera imagery.
- Verify dark/bright camera contrast, translucency, touch routing and tracking physically. Existing AR edge `#71DCD2` may be used/adapted as a compatible teal; seafoam `#42D5A5` is the approved visual target, not permission to break native readability.

## 5. Responsive, accessibility and localization acceptance

All screens must handle Android safe areas, navigation mode, 360×800/short/narrow sizes, normal and ≥1.5 text scale, EN/JA/KO with real resources, long place titles and CJK fallback, landscape/IME only where applicable, TalkBack labels, no horizontally lost primary controls, loading, empty, failure, retry and offline/permission-stale states. No text clipping, invisible tabs, fixed-height bodies or inaccessible dark-on-dark AR panels. Verify **contrast** on actual screens rather than assuming these concept colors automatically pass.

Use controlled test states without paid provider calls on mount, fake GPS grants, silent account changes or data resets. Keep native Google credits and AR controls visible. Capture before/after ADB evidence at stable states and log device/APK/JS revision; browser/component sketches are supplementary, not native acceptance.

## 6. Implementation boundaries and separate defects

This is a **visual and content hierarchy** refinement. The November 2 ADB audit had 79 genuine 1080×2400 screenshots, but not all live camera/on-site/auth states. Its captured development client's JS revision was unknown. First verify current main and do not assume a screenshot equals latest source state.

Separate issue tracker entries:

- [#39](https://github.com/mjfelecio/ARgala/issues/39): blank Explore sheet after no-match search (**confirmed in audit; functional**).
- [#40](https://github.com/mjfelecio/ARgala/issues/40): driving wait copy mentions walk (**confirmed copy**).
- [#42](https://github.com/mjfelecio/ARgala/issues/42): Recenter overlays native Google toolbar (**visual overlap; tap impact unverified**).
- [#41](https://github.com/mjfelecio/ARgala/issues/41): disconnected Metro blocks lazy AR dev routes (**test environment**, not a verified AR product bug).

Keep separate focused fixes or explicitly record cross-dependencies. Do not claim UI polish resolves them without reproduction/regression evidence.

## 7. Acceptance and delivery

Approved visual direction is met when **all eight screen families** use consistent colors and component hierarchy and actual Android captures reflect the principles above without behavioral regressions. Deliver a screen-to-reference evidence table, before/after device shots, skipped test matrix, any unavoidable deviations with reasons, and current code/test/PR status. Make no claims about production ARCore, real geofences, location reminders or native navigation without proper physical/on-site evidence.

The owner has approved the *visual concepts*. It is the coding agent's responsibility to reconcile their illustrative content with actual product contracts, provider restrictions and source behavior. Any decision that materially adds features or changes product behavior returns for owner approval.
