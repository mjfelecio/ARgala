# ARgala — Consolidated Product Blueprint and Coding-Agent Handoff

**Planning baseline:** 25 October 2026 (Asia/Manila)

**Status:** Product brainstorming decisions consolidated; **not** an audit of the application code

**Pilot destination:** ACLC College of Ormoc

**Platforms:** Android-first React Native/Expo application; React Native Viro for the immersive experience

## 1. Executive intent

ARgala is an existing tourism discovery app with a polished, Google Maps-inspired visual identity. Keep that existing product recognizable and working. Its ordinary map explores **any supported place**, not merely the nine curated destinations. A separate **exclusive, on-site AR experience** is available to **nine client-curated featured destinations**. The first physical pilot is **ACLC College of Ormoc**, expressly requested by the client and convenient for on-site developer testing.

The visitor journey is:

1. Discover a featured destination through its card, map, or search; other ordinary places remain discoverable too.
2. Select the destination; use the app's **existing map marker and bottom sheet** for basic location, distance, directions, and an AR teaser/status.
3. View a route preview and, when desired, deep-link Google Maps for walking/driving navigation. **No native turn-by-turn AR navigation.**
4. Receive increasingly anticipatory messages as the visitor approaches the **selected** destination. Foreground alerts are ordinary UI; background notifications are separately opt-in and best-effort.
5. Verify real-device proximity using GPS accuracy and stable readings. At a configurable destination radius (initial hypothesis ~50 m; field-test before finalizing), invite the visitor to **Launch AR**.
6. Open a native Viro camera session after permission and tracking checks. Holographic square destination-information tiles form a 360-degree ring around the visitor. Overview starts at **0° ahead**, History at **+90° to the visitor's right**. They discover panels by rotating the phone.
7. Tap a tile to animate it closer and toward the currently viewed direction, expand it, paginate/read information in-camera, then close to restore the ring. All destination information is rendered in the Viro AR scene, **not** in 2D bottom sheets.
8. Stamp the Tourist Passport on the first eligible launch for a featured destination and retain progress locally, syncing on sign-in when available.

**Fundamental rule:** Map discovery and navigation are broad; AR content is narrow, place-specific, and available only at the selected featured destination. Never show AR labels for unrelated businesses or other landmarks. The meeting's early proposal for nearby-landmark overlays inside AR was explicitly superseded by later direct decisions.

## 2. Authority, evidence, and unknowns

**Priority order for conflicting specifications:**

1. Latest direct requirements and decisions from the developer's client conversations (the approved decision ledger below).
2. The developer's original direct app requirements, including unrestricted map discovery and preservation of existing UI.
3. The supplied SRS and diagrams, **additive where compatible**, not a replacement for direct client requirements.
4. The 17:26 meeting and its cleaned English reconstruction (the latter is meaning-preserving, not verbatim, and warns about uncertain passages).
5. Technical recommendations in this blueprint, explicitly subordinate to code inspection and physical testing.

**Available planning evidence:** `ARgala_English_Meeting_Record.md` and `ARgala_audio_transcript.md` were read. **Unavailable during this planning pass:** ARgala's actual application source tree and the previously mentioned `ARgala_SRS_and_Diagrams.docx`. Do **not** infer that a screen, service, or dependency is absent merely because its code was unavailable here. The implementing agent must read the repository and the SRS before editing, and report genuine conflicts.

**Still required from the client/team:** Names and coordinates for the other eight curated destinations; verified ACLC coordinates or entrance/visitor activation point; approved texts and translations (EN/JA/KO); media rights; map/API credentials and current provider; actual target Android phones; actual auth/sync/back-end capabilities. These are prerequisites for *final* nine-destination rollout, not blockers to a mock-data single-destination proof of concept.

## 3. Complete decision ledger (D01–D54)

Decisions are grouped below in their original order. Some early examples and provisional thresholds were refined later; the latest specific decision prevails.

### Featured destinations, discovery, and navigation

- **D01** — Exclusive AR for nine client-curated featured destinations; preserve unrestricted ordinary-place discovery. The old generic AR tab/discovery may be hidden or dormant, not destructively removed.
- **D02** — Prearrival teaser/preview information is available, but the live AR camera unlocks only when physically near the selected destination.
- **D03** — Initial AR content: essential overview, history, facts, images and destination-specific visitor details where relevant; rich 3D models, particles, and reconstructions later.
- **D04** — All detailed featured-destination information appears as square Viro holographic tiles and panels inside ARCamera, not a separate 2D sheet.
- **D05** — Camera-position-relative tile ring follows user translation but holds its own orientation while the user turns their phone; no exact physical-object anchoring.
- **D06** — Tapping a tile expands an in-scene holographic panel; other tiles dim; close restores the ring.
- **D07** — Destination-dependent optional categories and adaptive spatial distribution, with Overview at 0° and History to the right at +90°; no blank slots.
- **D08** — Configurable radius per destination; ~50 m is a tentative default subject to real GPS calibration.
- **D09** — Initial camera-facing direction defines 0°; provide Recenter.
- **D10** — No persistent directional/radar arrows for the MVP; revisit subtle guidance only if testing shows it is needed.
- **D11** — Proximity teasing messages increase in anticipation as the selected destination nears; simple polished alerts/toasts rather than separate preview scenes.
- **D12** — Foreground proximity milestones plus background OS notifications, deduplicated and resilient to jitter.
- **D13** — Background proximity reminders require deliberate **per-destination opt-in** and required permissions; never force continuous tracking.
- **D14** — Offline-first essential curated content with optional remote extra media and future assets.
- **D15** — Reuse the app's existing English, Japanese, and Korean localization; add no other locale now.
- **D16** — Use client-provided facts where possible, research missing information, and obtain client approval for historically/culturally sensitive content; mocks can drive development.
- **D17** — Nine featured locations are reachable from a Featured Destinations card section and identifiable special map markers.
- **D18** — Before arrival, featured-place 2D details remain **minimal** (name, cover, address/location, distance, directions, AR teaser/unlock). History and rich descriptions remain for in-camera AR; ordinary places retain their existing details.
- **D19** — At the eligible physical location, AR-incapable devices may use a simple read-only informational fallback; supported devices first attempt Viro and can retry failed initialization.
- **D20** — Digital Tourist Passport with a stamp for each of the nine when an eligible AR experience starts (or eligible fallback); no rewards program in MVP.
- **D21** — Guest progress persists locally and merges/syncs on sign-in via the existing auth architecture where supported.
- **D22** — Passport summary lives inside Featured Destinations; no additional tab.
- **D23** — AR photo capture (camera plus holograms, save/share) follows core scene stability; no MVP video recording.
- **D24** — In-app route preview and **Start Navigation** Google Maps deep link; no custom turn-by-turn navigation.
- **D25** — Walking and driving are the supported MVP navigation modes.
- **D26** — Nearby-category filters: All (default), Attractions, Restaurants, Hotels, Shopping; unrestricted free-text search.
- **D27** — Initially search near the user's available location; after map pan/zoom, refresh only on **Search This Area**.
- **D28** — Preserve existing marker → **bottom sheet** interface; don't replace it with a carousel or redesigned details workflow.
- **D29** — Saved Places/bookmarks for any place from existing map details, local guest storage, merge on sign-in; no trip itinerary builder.
- **D30** — GPS missing: use permissible recent last-known position, or manual map area/search; never use manual map center as proof of on-site AR eligibility.

### AR delivery, presentation, and testing

- **D31** — Progressive delivery: Viro single-destination proof of concept → complete map/directions/proximity/AR vertical slice → expand to nine → supporting passport, saved places, notifications, fallback, and polish. Photo capture after core.
- **D32** — Development-only proximity simulation with real camera/tracking; forbidden in production builds.
- **D33** — ACLC College of Ormoc is the first client-designated test destination; do not invent its exact coordinates.
- **D34** — Horizontal 360° ring with subtle vertical/depth staggering and restrained motion, ensuring readability.
- **D35** — Subtle cyan/teal holographic borders and emerald ARgala-green accents, translucent dark panels, soft scanning/glow and strong contrast; **visual coherence with the app's polished Maps-inspired theme is mandatory**. Avoid an unrelated neon sci-fi shell.
- **D36** — Lengthy history content uses **in-AR paginated expanded panels** with previous/next and page indicator; handle EN/JA/KO text lengths.
- **D37** — On selection, move panel toward **current viewer heading** and closer, center it, dim other tiles; keep it spatially stable afterward (not continually head-locked); close restores ring.
- **D38** — Short, skippable ~2–3 second startup/reveal when tracking is ready: Overview first, others sequentially; one-time Look Around hint.
- **D39** — Portrait-only Viro experience for MVP; do not change the rest of the app's orientation handling.
- **D40** — Once physically unlocked, a live AR session continues if user walks beyond radius; exiting requires fresh verification to reopen.
- **D41** — Tracking loss gently dims panels, prompts recalibration/move phone slowly, restores selected tile/page when tracking returns, and offers retry; avoid automatic disruptive restart.
- **D42** — Location verification uses accuracy-aware stable readings, retry state, and hysteresis. Uncertain readings show Verifying Location; don't unlock on a single untrustworthy GPS point.
- **D43** — On confirmed arrival, show a polished, dismissible **AR Experience Unlocked** invitation with Launch AR CTA. Never automatically open the camera; dedupe per arrival.
- **D44** — Brief backgrounding supports *logical* session restoration (provisional five-minute grace). Reinitialize AR tracking and relative positions; restore selected tile/page, not stale transforms. Expired/killed sessions recheck location.
- **D45** — First AR use presents a themed but visually cohesive permission/system-check screen, requesting missing permissions only then. Skip on normal repeat launches.
- **D46** — Expanded Viro panels have adjustable A−/A+ text sizes; adapt default dimensions and repaginate, persist preference across sessions.
- **D47** — Map→AR transition is seamless and branded, not an extreme full-screen science-fiction theme switch.
- **D48** — **Hybrid controls:** detailed information and panel navigation are 3D Viro; Exit, Recenter, Help and later Capture are minimal ordinary React Native 2D utility controls. No detailed destination content in 2D overlays.
- **D49** — Development-only diagnostics panel showing distance/accuracy, tracking state, positions, focus, errors, perf where measurable; simulation and tracking-test controls; strip/protect from production.
- **D50** — Bundle essential content with schema/versioning and support validated remote content updates with cached fallback. Full CMS is not part of MVP.
- **D51** — Merge provider-discovered place and matching curated featured place into **one enriched map marker**, with conservative verified place-ID/coordinate matching; preserve ordinary search and existing bottom sheet.
- **D52** — Graceful offline behavior for nine featured destinations, local Passport and bookmarks, and eligible local GPS/AR usage. Online-only discovery/routes explain limitations. Do not promise arbitrary offline Google Maps tiles or perpetual cached Places content.
- **D53** — Adaptive visual quality on diverse supported Android hardware; preserve information/interactions while scaling down optional effects as needed. Read-only fallback remains for AR-incapable devices.
- **D54** — Language is changed only in ARgala's **existing app settings**, not by adding a camera language selector. The AR session uses the currently selected locale and reflows content accordingly.

## 4. Deliberate exclusions and previously rejected approaches

- No AR labels for random nearby hotels, clinics, restaurants, or other POIs, even though an early meeting proposed this as an option.
- No visible history or lengthy featured-place details in normal map bottom sheets for supported AR users; exceptions are the **on-site device-incompatible fallback** and essential teaser/location facts.
- No physical-object recognition, QR anchor, world-scale fixed geospatial object alignment, AR directions, or turn-by-turn navigation inside the camera.
- No heavy 3D reconstructions, particle-heavy effects, AR video recording, generic AR tab, or CMS in the first technical vertical slice.
- No new language picker inside the camera, no additional locales, and no new Passport tab.
- No broad UI redesign of the current maps-inspired application.
- No automatic camera activation, blanket background location tracking, or production dev-mode proximity bypass.

## 5. Proposed feature boundaries (verify with actual repository)

These are **logical modules**, not commands to restructure a working app.

| Module/boundary | Responsibility | Preserve/reuse |
|---|---|---|
| Existing navigation, map, marker, bottom sheet | Ordinary nearby-place discovery, category filters, pan/Search This Area, selected-place details, route preview | Existing components and UI patterns; minimal invasive changes |
| `FeaturedDestinationCatalog` | Nine curated IDs, static baseline, activation point/radius, tile manifests, source/approval metadata | Existing data/cache/API abstractions |
| `DestinationResolver` | Conservative provider-result ↔ curated-place association; one enriched marker | Existing map provider, place ID, selection behavior |
| `ProximityService` | Foreground permission, distance, accuracy, stable-sample state, arrival/teaser events | Existing `expo-location` integration if present |
| `ArrivalAlerts` | Branded in-app milestone alerts, optional background reminders | Existing toast, notifications, permission settings |
| `ARAccessGate` | Selected curated destination + permissions + accuracy-verified local proximity + device support; dev-mode simulation isolated | Existing navigation/auth gating |
| `ARSessionController` | Permission preflight, tracking lifecycle, reveal, tracking recovery, resume/expiry, logical tile focus | Existing React Native app lifecycle conventions |
| `ViroDestinationScene` | 360° square tiles, 3D text/image material, expand/restore, pagination, font sizing | Viro-compatible native Expo development client |
| `ARUtilityChrome` | Minimal 2D Exit/Recenter/Help (future Capture) controls | Existing visual design system, accessibility labels |
| `Passport` / `SavedPlaces` | Durable local data, idempotent stamps/bookmarks, guest→account merge | Existing auth/store/sync implementation |
| `DestinationContentUpdater` | Signed-in app-agnostic versioned updates, schema validation, local fallback, asset permissions | Existing backend if available; do not build a CMS by assumption |
| `DevARDiagnostics` | Dev-only GPS/pose/heading/tracking/readout, simulation and tests | Strict build/env guard; never expose in release |

### Proposed curated destination schema

```ts
type Locale = "en" | "ja" | "ko";
type LocalizedText = Record<Locale, string>;

type ARTile = {
  id: string;                 // stable within destination, e.g. "history"
  kind: "overview" | "history" | "facts" | "gallery" | "visitor-info" | string;
  title: LocalizedText;
  body?: LocalizedText;
  assetIds?: string[];        // licensed first-party/approved assets
  desiredAngleDeg?: number;   // overview=0, history=+90 as product convention
  order: number;
};

type FeaturedDestination = {
  id: string;                 // immutable ARgala ID, independent of provider ID
  externalPlaceIds?: string[];
  name: LocalizedText;
  teaser: LocalizedText;      // safe to display before arriving
  activationPoint: { latitude: number; longitude: number }; // field-verified
  activationRadiusMeters: number; // initial 50m candidate, per-place config
  markerPoint?: { latitude: number; longitude: number };
  tiles: ARTile[];            // optional categories, no blank tile objects
  contentVersion: number;
  schemaVersion: number;
  approvalStatus: "draft" | "approved";
  attribution?: string[];
};
```

This is an example contract. Compare with existing types, avoid duplicate models, and allow locale fallback only according to the current app's localization policy. **No invented real history, address, geocoordinates, price, or ownership facts.** Any omitted required locale must be flagged before production publication; development placeholders should be conspicuously marked.

### Content and provider boundaries

- The embedded nine-place catalog and remote updates must use **client-owned, written/verified, or properly licensed media and facts**.
- No automatic Wikipedia/current-news content ingestion into a published destination without editorial review.
- Do not store/cache arbitrary Google Places photos, reviews, ratings, descriptions, coordinates, or other provider content outside currently permitted contractual exceptions. **Google Place IDs are specifically exempt from general cache restrictions**; personal bookmark IDs can be stored, and details should be refetched as needed.
- Preserve attribution when displaying provider data and keep it distinguishable from independent curated content.
- Content updates must be schema-validated, downloaded atomically, and applied between sessions where possible, preventing a mid-AR tile/page from changing unexpectedly. Retain last good approved local content on invalid updates or failed connectivity.

## 6. AR layout mathematics and scene invariants

**Critical feasibility spike:** Prove the following on an actual Android phone before styling the entire scene. Viro's documented `ViroARScene` exposes `onCameraTransformUpdate` with position/rotation/forward and `onTrackingUpdated` tracking states. Verify the exact installed library API and event performance before writing production scene code.

- Establish a **horizontal yaw reference** at first stable tracking. That initial direction is 0°.
- The ring's translation follows the camera position, ideally with low-latency smoothing, but the ring's horizontal **rotation reference stays locked** until the visitor taps Recenter.
- Do **not** parent the ring to the phone's continuously rotating camera orientation. If ring yaw follows camera yaw, History never actually moves to the visitor's right as the phone rotates; it defeats the 360° experience.
- Use world-space positions from a session-relative basis. Conceptually, for an initial forward of negative Z, a tile at bearing `θ` and distance `r` is `x = r·sin(θ)`, `z = −r·cos(θ)`; transform by initial yaw and translate by camera position. Confirm Viro handedness/sign conventions with on-device tests. **+90° must be visually right** to the visitor.
- Panels face toward the viewer at their ring position. Keep a comfortable reading distance, non-overlapping field of view, and minimal vertical staggering. Tune `r`, panel size, spacing and animation on devices; do not hardcode the final values based solely on desktop mockups.
- On selection, animate the chosen panel toward the viewer's *current* heading, center and enlarge, dim the rest. Once the transition completes, the selected panel **must not keep snapping to the user's changing heading**. Close restores the ring positions.
- Recenter recomputes origin yaw from the current heading but should not reset content unless necessary. Translation smoothing cannot introduce visible lag, floating away, or nausea-inducing jumps.
- Stop scene rendering/update pressure when the app backgrounds; restore logical focus and page on quick return after acquiring a fresh pose.
- Keep all actual featured-destination detailed text/images/pagination Viro-native. Native overlays are limited to standard utility actions and status/permissions/recovery controls.
- Tracking LIMITED/UNAVAILABLE should dim/freeze interactive content and show recoverable guidance; upon NORMAL, restore content state and reestablish scene pose as needed.

## 7. Proximity and session state contracts

### Proximity

States (suggestion): `unknown → far → approaching → near → verifying → eligible`; plus `denied`, `unavailable`, and `temporarily_uncertain`. Define actual transition predicates and cooldowns from field measurements.

- Inputs: **selected featured destination ID**, its verified activation point/radius, timestamped device location, accuracy estimate, permission status, and optional dev simulation.
- Distance calculation: geographic haversine or equivalent, unit-tested with edge cases; never compare raw latitude/longitude differences to meters.
- Accuracy-aware stability: gather multiple reasonably recent samples; reject implausibly old/inaccurate points; use hysteresis around thresholds to avoid flicker. Do not simply expand radius by arbitrary GPS error, or treat map position as visitor position.
- Far/approaching/near messages are **per selected destination**, not nearest random POI. Distances and copy are localized. Notify only at milestone transitions, not continuously while the GPS value fluctuates.
- On successful entrance, invitation is dismissible and has Launch AR CTA. In-app selection remains the primary way to discover this; no forced camera open.
- Once session entered legitimately, the current session continues if the user walks outside radius; all **new** sessions require verification (unless a valid short suspended-session restoration is in progress).
- If verification stays inconclusive, show status, manual retry, and helpful safe guidance; do not fail open. Record anonymous dev diagnostics if enabled.

### AR lifecycle

Suggested logic: `idle → preflight → permissions → initializing → tracking-ready → reveal → exploring`; optional `tracking-limited → recovering`, `backgrounded → suspended → reacquire-tracking → exploring`, or `closed`.

- First-use permission UI is normal branded ARgala, not a neon theme takeover.
- Cinematic reveal is approximately two to three seconds and skippable; repeated sessions should be quick.
- A short provisional five-minute suspension grace preserves selected tile, page, and font setting only; no stale camera/world transform is trusted. Device/process termination ends the session.
- Handle app background, camera interruption, low memory, permission revocation, ARCore unavailable, tracking lost for a long time, and denied location safely.
- AR unsupported device: only allow the **read-only fallback while eligible on-site**; do not expose rich descriptions remotely through the featured map sheet.

### Background proximity opt-in

- User explicitly opts in per destination; request foreground permission first, background permission only if they opt in.
- Register only selected opted-in destination geofence(s), persist opt-in settings, and unregister promptly on opt-out or destination removal. Respect Android limits and battery behavior.
- OS scheduling/notification delivery is **best effort**, especially when app is terminated; do not claim exact or guaranteed instant arrival notifications.
- If denied, the app still works for foreground discovery and on-demand AR verification.

## 8. UI and design rules

- **Identity:** Existing polished, Maps-inspired ARgala components are the source of truth for typography, spacing, elevations, shapes, icons, palette, and permission screens. Add restrained cyan/teal luminous borders and green highlights **inside** AR content.
- **No visual whiplash:** Map→camera transitions remain recognizable; avoid an unrelated science-fiction cockpit with giant neon overlays. Effects are brief and optional.
- **Map:** Retain current bottom sheet for ordinary/featured basic details. Do not introduce an unsupported new home carousel for generic places. Featured cards and distinctive markers extend the existing interface.
- **AR chrome:** Minimal fixed React Native Exit/Recenter/Help controls. Keep important 3D panels clear of safe areas and button touch targets.
- **Inside Viro:** Square tiles, page indicators and prev/next, A−/A+ adjustable text size, images where content exists; support long Japanese/Korean strings with readable layouts and repagination.
- **Accessibility and safety:** readable contrast outdoors, test large text, restrained animations, touch target sizes, screen reader labels for 2D controls, a compact Look Around / be aware of surroundings hint. Future reduced-motion adaptation can reuse the same animation registry.
- **Camera orientation:** Portrait-only while Viro screen is active; restore ordinary app behavior outside it.
- **Navigation:** Google Maps Maps URL format `https://www.google.com/maps/dir/?api=1&destination=LAT,LNG&travelmode=walking&dir_action=navigate` (driving supported analogously). Prefer no explicit origin so Google Maps can use device location and enter navigation when supported. Handle browser/route-preview fallback. Validate URLs and encode parameters.

## 9. Delivery phases and review gates

Each phase should produce a reviewable branch/PR with coherent small commits, test evidence, and real-device demonstrations at the appropriate gates. Don't implement unrelated phases preemptively.

| Phase | Goal | Exit gate |
|---|---|---|
| **0 — Repository reconnaissance** | Inspect actual existing `ARgala` root, git state, Expo/RN version, native build setup, navigation/map/bottom-sheet/i18n/auth/storage, SRS. Record conflicts and dependency compatibility. | Written inventory and targeted change plan; no core behavior replaced |
| **1 — Native Viro feasibility spike** | Install compatible Viro under current Expo native development build (never Expo Go), render one square tile with real rear camera, inspect camera transform/AR tracking, test taps. | Runs on a specific physical Android model; yaw/translation behavior demonstrated, no crash |
| **2 — ACLC ring interaction prototype** | Session-relative stable-yaw 360° tiles; Overview=0°, History=+90°; on-device rotate/translate, recenter, expand/collapse, dark translucent professional styling, tracking-loss recovery, portrait. Use labeled mock approved later. | Tile orientation/translation and interactions behave correctly; video/screenshots for review |
| **3 — One-destination vertical slice** | Existing featured card/marker/bottom-sheet→route/deep link→proximity/teasers/arrival→AR preflight→Viro; dev diagnostics/simulated proximity; EN/JA/KO baseline. | Both real onsite ACLC location and offsite simulated development path; no production bypass |
| **4 — Nine curated destinations/content** | Stable catalog IDs, approved content and translations, optional categories, image rights, independent config, remote-update validation/offline fallback, unified place marker matching. | All nine supplied/verified and accessible through the intended real selection flow; no other POI gets AR |
| **5 — Supporting product features** | Passport and guest sync, bookmarks, graceful offline UI, background opt-in notifications, read-only device fallback, adaptive performance. | Durable state and opt-in/privacy behavior tests pass; map remains unrestricted |
| **6 — QA, polish, optional post-core media** | Real-device matrix, field GPS calibration, performance, accessibility, AR-photo capture only once the core is stable. | Stakeholder acceptance, crash-free smoke sessions, release-safe build; photos separately accepted |

**Scheduling caution:** Feature list is intentionally bigger than a single technical spike. With a short initial client demo window, do **Phases 0–3 before promising all Phases 4–6**. The final launch scope should be negotiated with the client after actual on-device feasibility is measured.

## 10. Acceptance and verification matrix

| Area | Must demonstrate |
|---|---|
| Preservation | Existing map, search, marker bottom sheet, auth/i18n, and other current functional screens still work; no unrelated redesign |
| Discovery | An arbitrary non-featured POI can be found and navigated to, but has no AR entitlement |
| Featured resolution | An ACLC provider search result and curated destination yield one featured marker/selected ID; similar named unrelated place is not merged |
| Routing | Walking/driving preview and Google Maps handoff work; behavior gracefully falls back if device location absent |
| Proximity | Far can't open Viro destination detail, near confirmed can; GPS accuracy/jitter shows verification/retry rather than flapping; manual map center doesn't unlock |
| Selection isolation | Only the **selected destination** appears in AR. No overlays for other landmarks even if close |
| Spatial pose | Opening view Overview at 0°, History at +90° right; turning reveals adjacent panels; walking translates the ring but doesn't spin it with the camera |
| Panel interaction | Tap → smooth expanded focus, other tiles dim, paginate, change text size, close → restore; still readable in JA/KO |
| Tracking | Tracking loss triggers coherent recovery and state preservation, not forced exit; Recenter reorients logically |
| App lifecycle | Quick background/resume reacquires tracking and restores tile/page; expired/killed session needs proximity verification |
| i18n | EN/JA/KO use existing app setting, every published essential string covered, fallback policy honored |
| Passport | Eligible session stamps at most once per destination; guest offline progress remains, auth sync merges idempotently |
| Offline | Curated local content loads offline; general online search fails gracefully, without prohibited cached provider content |
| Permissions | Camera/location requested contextually; denied/unsupported flows explain recovery; background monitoring only after opt-in |
| Release safety | Dev simulation and diagnostic toggles absent/inaccessible in production; protected production AR gate remains enforced |
| Performance | Tested on at least one moderate and one lower capability ARCore-supported Android device; tuning guided by measured scene responsiveness |

**Recommended test suite layers:** Pure unit tests for geodistance, stability/hysteresis, tile angle/transform and state transitions, locale completeness, metadata validation, deduplication and stamp merge; service/component integration tests for selection→gating→AR and resume/offline behavior; manual on-device tests for camera tracking, readability, notifications and Google Maps handoff. Do not claim simulator/emulator tests validate real-world AR tracking.

## 11. Technical risks and mitigation

1. **Dependency compatibility:** Existing Expo/RN native modules might not be compatible with the newest Viro. Audit project versions and make a minimal native development build spike before pinning versions or upgrading broadly. Viro requires dev build/prebuild, not Expo Go.
2. **Hologram spatial behavior:** Camera-following translation with stable relative yaw is subtle. Prove it early with physical rotation/walking, handling jitter and loss of tracking. Avoid the apparent shortcut of locking the tiles to device viewport orientation.
3. **GPS indoors/near campus:** Reported device accuracy may be poor and radius alone is ambiguous. Capture field samples at school gate, courtyard and interior; calibrate point/radius and verification policy with client approval.
4. **AR device eligibility:** Check ARCore support and availability before camera launch; unsupported devices see an eligible on-site read-only fallback.
5. **Background delivery limits:** Foreground app behavior can be reliable; background geofencing can be delayed and Android does not guarantee a terminated app will restart to receive a geofence event. Scope UX promises accordingly.
6. **Google licensing/billing:** Place provider IDs may be persisted, but Places-derived content generally cannot be arbitrarily cached/offline mirrored; maintain attribution and billing quotas. Do not expose unrestricted server API keys.
7. **Content rights and trust:** Nine names/coordinates and approved histories may arrive late; use clearly labeled placeholders only in development; do not invent facts for production.
8. **Mobile ergonomics:** 3D text is harder to read under sunlight and on small displays. Require genuine phone testing and support adjustable font and pagination.
9. **Offline vs route navigation:** Locally bundled AR content can work without data, but route generation/maps cannot be promised without provider-specific offline support. Preserve explicit UI failure states.
10. **Scope creep:** Leave advanced 3D, particle features, full CMS, AR photo/video, general AR POI labels and in-AR navigation outside the core vertical slice.

## 12. Ready-to-copy coding-agent goal prompt

> **Your role:** Lead Android-first React Native/Expo engineer and careful product implementer working in the **existing ARgala application**. Use independent subagents for genuinely separable reviews only when useful, and review their results yourself. Work in small inspectable steps and report evidence.
>
> **First actions, mandatory:**
>
> 1. Use the **current `ARgala` project folder as the project root**. Confirm its absolute path, `git status`, branch, remotes, existing source/config/test scripts, and package versions. **Do not nest another Expo app, overwrite files, or reinitialize an existing repository.** If it is truly a fresh empty directory, initialize Expo/TS and git immediately as originally authorized; use the available authenticated GitHub account to connect the intended `mjfelecio` remote only if its destination is unambiguous. If multiple candidate remotes/repos exist, stop for direction.
> 2. Read all local `AGENTS.md` and existing documentation, including the full `ARgala_SRS_and_Diagrams.docx` if present, the client meeting record and this blueprint. Audit current navigation, map/search, bottom-sheet UI, featured cards, i18n (EN/JA/KO), location, authentication, persistence, notifications, and native build setup. Direct developer/client decisions have priority over conflicting draft SRS suggestions. Preserve all unrelated working features.
> 3. **Before coding**, write a short compatibility/implementation note: installed Expo SDK/RN, map provider and costs, Viro package/version/config plugin, physical ARCore test device, the current auth/storage integration, app build method, current test baseline, repo/branch strategy, and any unresolved blockers. Do not assume that a library or screen is missing without checking.
> 4. Work on isolated topic branches and make **coherent, small commits after each verified logical change**. Avoid a single feature-dump commit. Respect user changes in the working tree; never destructively reset or modify unrelated files. Use PRs for meaningful review points. No unapproved migration of hosting/auth/provider or broad UI redesign.
>
> **North-star user flow:** An arbitrary ordinary POI remains searchable and navigable in ARgala's current map. A selected **featured** destination uses the existing marker/bottom-sheet pattern for basics, directions and AR teaser. GPS-derived stable, accuracy-aware proximity to that **selected** destination triggers escalating alerts and a dismissible invitation. The visitor launches the native Viro camera. A 360° ring of square, polished holographic panels shows **only that destination**: Overview is straight ahead on entry, History is +90° right. The tile ring follows camera translation but does **not** rotate with viewing yaw. Tap expands a panel toward the viewer's current direction, preserving 3D spatial stability; pagination and A−/A+ text stay in Viro. The entire experience looks like a natural extension of the existing polished, Maps-inspired ARgala product, not a jarring neon sci-fi redesign.
>
> **Implementation order, do not jump ahead:**
>
> - **Phase 0:** Repository/UI/provider audit and build/compatibility spike plan.
> - **Phase 1:** Integrate a compatible Viro into the existing Expo native **development build** (Expo Go is insufficient); on a real Android ARCore phone show a stable tappable single holographic square. Verify camera transform and tracking callbacks. Preserve existing navigation and map.
> - **Phase 2:** Implement ACLC-only 360° scene math and minimal content: 0° overview, +90° history, stable initial yaw, following translation, recenter, tile focus/restore, paging, adjustable text, tracking recovery, portrait, restrained cyan/teal and emerald polish. Use *clearly fake/labeled* text until client approves actual ACLC history; never invent real-world coordinates or unverified historical claims.
> - **Phase 3:** Wire existing Featured Destinations and marker/bottom sheet into explicit selected-destination context, minimal teaser details, walking/driving route preview, Google Maps navigation URL, foreground progressive proximity/status messages, accuracy-aware eligibility, permission preflight, AR entry/exit, session restoration, and dev-only diagnostics/proximity simulation. An actual on-site ACLC test must be a separate documented gate; simulation is **not** proof of real GPS behavior.
> - **Phase 4:** Expand via destination-agnostic validated catalog to all nine client-supplied featured locations and approved EN/JA/KO data/media, conservative Place ID matching, offline-first bundled content with versioned approved remote updates; show no unrelated POI labels inside AR.
> - **Phase 5:** Add Passport, Saved Places, guest merge, offline graceful behavior, eligible read-only fallback, per-destination opt-in background arrival notifications, and adaptive performance as scope permits. AR photo capture only after core on-device experience is stable; no AR video, CMS, complex 3D, heavy effects or in-AR turn-by-turn navigation.
>
> **Mandatory constraints and acceptance:**
>
> - Existing map/search is **not** reduced to nine places. Filters All/Attractions/Restaurants/Hotels/Shopping, free text, pan and Search This Area remain. Existing marker → bottom sheet stays. No duplicate featured vs provider marker for same verified place.
> - No detailed featured history/overview in a 2D bottom sheet or outside Viro for AR-capable users. Only essential place/navigation/teaser information is visible before onsite entry. The special in-person read-only fallback is for AR-incapable hardware.
> - The user selects the featured destination explicitly; AR never displays information from a different place even if physically nearby. In-scene tiles are camera-position-relative, not attached to a building, QR code, or map geospatial anchor.
> - Per-destination radius begins as a tentative ~50 m but must remain configurable, with real measurement at ACLC. Nearby/eligibility decisions use fresh location, accuracy, several readings when needed, and jitter-resistant transitions; manual map placement cannot grant AR. A legitimately started session continues beyond boundary until closed; a new session rechecks location.
> - Existing app locale is source of truth: EN/JA/KO, changed in existing Settings only. All featured content supports those locales, including different pagination lengths. No AR language picker.
> - First-use branded camera permission check; after tracking, short skippable tile reveal. Minimal 2D utility chrome (Exit/Recenter/Help); detailed content remains Viro-native. Tracking loss dims/recalibrates and preserves selection/page; short session backgrounding preserves logical progress, reacquires camera pose, and expires after provisional grace.
> - Provide a **development-only** diagnostic readout and simulated proximity/tracking scenarios, with reliable exclusion from release builds. Never persist a dev-only unlocked state in production.
> - Never promise caching of Google Places content contrary to current policies; use only independently curated or licensed offline catalog, place IDs and allowed user state. Do not silently cache or redistribute provider images/reviews. Preserve map attribution.
> - Keep notifications deduped, location background monitoring per-destination opt-in, and graceful behavior when permissions unavailable; Android terminated-app notifications are best effort rather than guaranteed.
> - Add tests for geometry, location thresholds/accuracy, destination isolation, content validation, localization, provider matching, offline/sync and Passport idempotency; manually test physical AR rotation, translation, brightness, taps, tracking loss, permissions, lifecycle and Google Maps handoff on device. Add measurable performance observations instead of unsupported quality claims.
>
> **Reporting cadence:** At each stage, report changed files, coherent commits/PRs, commands/tests passed or failed, exact real-device tests performed, screenshots/video where relevant, remaining product decisions, limitations and any changes that might break currently shipped screens. If a step genuinely needs a missing client destination, coordinates, content approval, credential, device, or provider decision, stop that step with a precise request rather than fabricate data or silently make a permanent architecture choice.
>
> **Final outcome:** A working, demonstrable ACLC College of Ormoc end-to-end ARgala vertical slice with every existing app feature preserved, followed by independently reviewable groundwork to expand safely to the other eight featured destinations. Only claim physical AR/proximity functionality after it has been tested on a real Android device.

## 13. Official implementation references consulted

- ViroReact + Expo native development builds and config plugin: https://viro-community.readme.io/v2.56.0/docs/integrating-with-expo
- Viro scene camera transforms, tracking states and node interaction: https://viro-community.readme.io/docs/viroarscene
- Viro AR scene navigator: https://viro-community.readme.io/docs/viroarscenenavigator
- Google ARCore supported devices: https://developers.google.com/ar/devices
- Expo Location background/geofencing constraints: https://docs.expo.dev/versions/latest/sdk/location/
- Google Maps directions/deep links: https://developers.google.com/maps/documentation/urls/get-started
- Google Places storage/attribution policies: https://developers.google.com/maps/documentation/places/web-service/policies

*Source review is time-sensitive. The coding agent must match APIs to the **installed** versions and recheck policies before release.*
