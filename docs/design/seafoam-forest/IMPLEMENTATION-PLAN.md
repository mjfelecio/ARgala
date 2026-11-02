# ARgala Seafoam Forest — Implementation Plan

> **Later owner scope correction:** AR design is excluded from this task and
> reserved for a separate task. Retain the existing native AR presentation,
> including panel #102724 and edge #71DCD2. This overrides every AR recoloring
> instruction in this archived handoff, including implementation Task 8.


> **For agentic workers:** Follow the repository's current `AGENTS.md` and applicable skills. Use `superpowers:subagent-driven-development` or `superpowers:executing-plans` where available, and implement this plan task by task. The owner has approved the visual direction; obtain fresh approval only for material changes in product behavior, outside-scope dependencies or deployment.

**Goal:** Implement the complete approved eight-screen Seafoam Forest UI refresh on ARgala Android without functional regression.

**Architecture:** Retain Expo Router, React Native, UniWind/Tailwind v4, HeroUI Native, global CSS semantic tokens, native Google Maps, and Viro. Adjust shared semantic tokens first, then screen families, preserving provider data and native state machines.

**Tech stack:** Expo SDK 57, React Native 0.86.3, strict TypeScript, `global.css`, UniWind 1.12.2, HeroUI Native 1.0.10, `react-native-maps` 1.27.2, `@reactvision/react-viro` 3.0.3, Vitest, Android/ADB.

**Design authority:** `DESIGN-SPEC.md` and `references/approved/01-explore.png`–`08-ar-camera-concept.png`. Cross-reference the exact requirements in the current repository; mock text, photos, geography, states and component bounds are illustrative.

## Working contract

- [ ] Inspect `AGENTS.md`, `DESIGN.md`, `.agents/skills/argala-ui/SKILL.md`, `docs/ui-infrastructure.md`, `docs/design/clean-explorer/DESIGN_SYSTEM.md`, `docs/brand-kit-rollout.md`, `docs/ui-refinements-2026-10-30.md`, `docs/ar-destination-stories.md` and relevant source **before editing**. Read required resources of any skill used.
- [ ] Check `git status`, current branch and recent history. Work from the correct updated mainline in a separate worktree or isolated task branch. Do not overwrite existing uncommitted work, device data or concurrent changes.
- [ ] Construct an actual screen/component inventory and identify source files, tests, state contracts, shared tokens and navigation owners. Do not assume paths beyond those verified below.
- [ ] Treat the screenshots as approved style references **not literal production assets**. Never embed the mockups in the actual app, mock location or route state, paste a fake camera background, invent place photos or Google data, or convert the app into a static UI prototype.
- [ ] Keep the scope visual/UI-hierarchy-focused. Preserve existing payment/provider request boundaries, location freshness/admission and permission gates, normal and curated flows, data structures, content status, authentication, translations, navigation and ARCore behavior.
- [ ] Prefer existing design-system components and semantic classes. Keep `global.css` the single source of colors; do not introduce NativeWind, a TypeScript theme, custom navigation framework or new library without explicit approval.
- [ ] Maintain readable partial/empty/error/retry states as first-class screens. No hard-coded content based on screenshots. Keep accessible controls ≥48dp, native font scaling, EN/JA/KO, CJK fallback, screen reader labels, native attribution, safe areas and gesture ownership.
- [ ] Make **small coherent commits** at reviewable boundaries, with affected-scope tests and evidence. Do not deploy, merge or reset user changes on your own. Use repo workflows and open a PR or present review-ready commits for owner approval.

## Task 0 — Reconcile authority, baseline and reference evidence

**Input:** All eight references; all current repository design and native behavior docs.  
**Likely files:** `AGENTS.md`, `DESIGN.md`, `docs/ui-infrastructure.md`, `docs/design/clean-explorer/DESIGN_SYSTEM.md`, `docs/brand-kit-rollout.md`, `.agents/skills/argala-ui/SKILL.md`; actual source/test paths discovered locally.

- [ ] Read and inventory preexisting theme contracts, router screens, forms, Android native map and Viro flows. Record source revision and which screen states are currently testable.
- [ ] Confirm screenshot provenance: eight images here are owner-approved conceptual mockups; the separate 2026-11-02 ADB audit was observational and may represent a different JS bundle.
- [ ] Add explicit repository design-document supersession: previous **artwork-only** Seafoam Forest rollout remains true for artwork history, but this owner approval now permits consistent *screen UI* and *native Viro visual* refinement. Update only conflicting visual guidance; retain all operational requirements, logo geometry and safety guards.
- [ ] Keep an implementation mapping table: reference PNG → actual route/component → real states → associated tests → known deviations. Have a baseline ADB capture for each reachable screen or mark it blocked honestly.
- [ ] Commit design-authority reconciliation separately from app changes if useful, after checking documentation references.

**Verification:** All required docs agree with the new approved visual scope; no implication that permissions, routes or AR behavior were newly approved.

## Task 1 — Semantic foundation, text and shared components

**Likely files:** `global.css`, existing HeroUI Native/UniWind primitives, semantic theme tests, app layout and shared components identified during inventory.

- [ ] Before editing, write or update narrowly scoped tests for semantic state mappings and theme/variant behavior where testable. Note screenshot-only aspects that require device inspection.
- [ ] Update shared tokens to the spec: ivory `#FCFBF7`, forest `#247A53`, deep forest `#174D38`, signature seafoam `#42D5A5`, mint mist `#E8F8F0`; retain functional route blue and semantic danger/warning colors.
- [ ] Replace overused page-wide mint backgrounds with ivory/white where appropriate. Differentiate default, selected, pressed, disabled, busy, focus, error and high-contrast states.
- [ ] Reuse established typography and spacing; allow Android font scaling and Japanese/Korean expansion. Check shared buttons, cards, chips, headers, sheets, navigation and status-bar behavior.
- [ ] Confirm white text on primary forest meets contrast needs; do not use seafoam for small white-surface text. Avoid global map recoloring via page backgrounds.
- [ ] Commit semantic token changes as their own coherent change.

**Verification:** Targeted component tests, TS/lint/check; device comparison of primary buttons, inputs, tabs, sheets and long text.

## Task 2 — Explore and map controls (`01`)

**Likely files:** Explore route, map controls/search/category components, `src/features/map/place-sheet.tsx`, map-style config and existing map tests, after source discovery.

- [ ] Preserve compact query header, **pinned Featured** action, categories, Search this area trigger, recenter, MapView attribution, sheet state machine (`unsearched`, `loading`, `empty`, `failed`, `results`, `selected`) and native insets.
- [ ] Apply ivory/white overlays, one clear forest selected chip/primary action and restrained seafoam active states; don't saturate map itself by hiding roads or park boundaries.
- [ ] Inspect actual Google style configuration separately from screenshot's rural green geography. Adjust only supported neutral-land/park differentiation if needed and safe.
- [ ] Validate no accidental Places/Routes charge on component mount and no search or coordinate-flow regression.
- [ ] Capture ADB evidence for default, loaded result, empty, error and expanded sheet; mark any states not reproducible.
- [ ] Keep [#39](https://github.com/mjfelecio/ARgala/issues/39) and [#42](https://github.com/mjfelecio/ARgala/issues/42) separately tracked. If fixes overlap layout work, reference the issues and test behavior explicitly.

**Verification:** Map interaction/recenter, credits, category scroll, distinct sheet states, device taps and location safety.

## Task 3 — Featured and Tourist Passport (`02`)

**Likely files:** Featured catalog, Passport/progress components, destination-list primitives and tests discovered during inventory.

- [ ] Build a compact deep-forest Passport progress card with measured values, existing sync semantics and small decorative seafoam stamps; never imply visits that are not in the actual state.
- [ ] Present nine curated destinations as readable denser rows/cards with the proper fetched destination title, content status and navigational intent.
- [ ] Preserve pending/unapproved content and asset provenance. Use truthful generic illustration when approved media is missing; no mock icon presented as a factual landmark.
- [ ] Check loading, empty, unavailable, disconnected, signed-out and long-title behavior where applicable.

**Verification:** Exactly current curated data; progress and sync accurately reflect backing state; screen remains scrollable and translated.

## Task 4 — Curated destination preview (`03`)

**Likely files:** Curated destination route and `src/features/destinations/` components, eligibility/reminder controls, existing tests.

- [ ] Reorder visual hierarchy: real name and availability first; supporting story/visit proposition; appropriate media/placeholder; primary Get Directions; conditional reminders/status.
- [ ] Make clear that stories can be previewed where allowed but **live camera unlock is physically proximity-gated**. Do not change GPS thresholds, approvals or eligibility contracts.
- [ ] Use approved destination imagery only; brand placeholder is decorative and explicitly not claimed as site photography.
- [ ] Verify real pending content, disabled controls, permission denial and location stale states; keep navigation and provider source.

**Verification:** No unintended AR admission; no fictitious content; accessibility and multilingual checks on real data.

## Task 5 — Ordinary Place Details and Saved Places (`04`, `06`)

**Likely files:** `src/features/map/`, place-detail route, saved-place components, bookmark persistence/sync and provider adapters, tests identified during inspection.

- [ ] For ordinary Google Places, prioritize real provider place name, availability, address, attribution and Get Directions. Place secondary Map/Save affordances consistently; no provider metadata invention.
- [ ] Review existing legacy generic AR affordance against **curated-only destination Viro** decision. Do not delete unrelated legacy POI flow or grant generic access to featured camera; escalate a product change if necessary.
- [ ] For Saved Places, use compact white rows with single View action and subordinate Remove. Preserve removal safeguards, native list virtualization and up to 1,000 bookmarks.
- [ ] Handle actual cloud/local bookmark state and sync errors accurately. Sample names in mock PNGs are *not real bookmark metadata*. Do not expose raw IDs by default or trigger paid Details calls automatically.
- [ ] Maintain explicit user-initiated Details and reconciliation, sign-in transitions, permission and provider attribution contracts.

**Verification:** Known/missing provider metadata, offline/sync warnings, long saved lists and no new paid provider reads on mount.

## Task 6 — Profile and Settings (`05`)

**Likely files:** `src/features/settings/`, authenticated profile route, locale/radius persistence and tests.

- [ ] Apply clean white/ivory profile identity, Saved Places shortcut and grouped Language / AR & Location forms. Use actual signed-in identity, not anonymized mock data.
- [ ] Preserve supported EN, JA, KO autonyms and translation resources. Maintain existing save/confirm behavior rather than silently saving an illustrative control if existing contract needs explicit Save.
- [ ] Preserve configured activation radius range, persistence, account/session/permission semantics and existing debug gates.
- [ ] Validate large text, TalkBack, keyboard safe areas, account state, settings scroll and min/max slider/presets.

**Verification:** Settings persist and restore without unintended changes; screen reader and all three locales remain usable.

## Task 7 — Directions (`07`)

**Likely files:** `src/features/directions/route-preview-screen.tsx`, associated Journey/route sheet and map controls, source and tests.

- [ ] Keep the real Google map, route blue, user marker, route selection and attribution. Rebalance white/ivory floating UI, destination card, transport switch and route summary.
- [ ] Preserve the recently fixed **measured compact dock and expanded Journey**; do not translate screenshot pixels into fixed layout heights or create competing bottom sheet gestures.
- [ ] Do not add auto route recomputation or paid requests on mount. Respect position freshness, location accuracy, explicit intent, actual route availability and provider handoff.
- [ ] Consider a Refresh location affordance only if existing safe manual recovery already supports it; new GPS behavior requires approval.
- [ ] Reference [#40](https://github.com/mjfelecio/ARgala/issues/40) as a separately verifiable route-label correction; no claim of fix based on design alone.

**Verification:** Driving/walking and unavailable routes, compact/expanded sheet gestures, safe-area insets, short display, stale GPS, keyboard and Maps handoff.

## Task 8 — Viro native AR visual treatment (`08`)

**Likely files:** `src/features/destination-ar/`, native Viro components, AR route and existing tracking/interaction tests discovered during inventory.

- [ ] Treat mock as *color, hierarchy and luminous edge inspiration*, not physical test evidence or a replacement camera background.
- [ ] Recolor existing dark forest translucent chapter covers, focused reading surfaces and status controls to improve contrast against real camera feed, with restrained seafoam edges/affordances.
- [ ] **Preserve** chapter count 1–12, positions (Overview forward, History right), 1.5-unit focused distance, native world transform, held-finger interaction, collapse on other visible tile, `Opened` session state, text controls, tracking/permission recovery, session restore and expiry/admission.
- [ ] Verify no 2D bottom-sheet transplant, no static two-panel reduction, no lost touch routing. Preserve existing native help, camera/capture, recenter and A-/A+ controls.
- [ ] Inspect screenshot captures over genuinely bright and dark surfaces; use physical Android ARCore where available. ADB alone without outdoor/on-site movement cannot prove positional or arrival accuracy.
- [ ] Keep [#41](https://github.com/mjfelecio/ARgala/issues/41) classified as an environment test blocker until independently reproduced on a correct running client.

**Verification:** Native build/device startup as authorized, chapter progression, multi-finger hold and release, visibility, permissions, stale/expired location and live camera contrast. Report any physically untestable scenarios.

## Task 9 — Integrated verification, before/after evidence and PR

- [ ] Run repo's `npm run check` (typecheck + lint + tests), plus relevant targeted Vitest suites after each boundary. Identify any preexisting failures and do not misstate verification.
- [ ] Audit all eight mapped screen families on a real Android app with ADB. Record package/version, device resolution, Android version, app/runtime/JS commit, network and data conditions.
- [ ] Compare before/after reference by **intent and visual hierarchy**, not exact photo/map label/pixel match. Produce at least one representative stable capture per reachable family plus state variants.
- [ ] Exercise 360×800-ish viewports or nearest real/emulated supported device, ≥1.5 font scale, Japanese, Korean, TalkBack controls, safe areas, offline/permission/error/retry and long user/provider data.
- [ ] Confirm no new paid Google Places/Routes requests, provider attribution/brand violations, false bookmark sync state, account regression or featured AR admission shortcut.
- [ ] Verify issue #39–#42 separately and report whether untouched, intentionally addressed with regression evidence, or blocked.
- [ ] Update repository design docs as appropriate; make coherent conventional commits, diff review, and open review-ready PR(s) only through project-approved workflow. Keep release/merge gated by owner's later approval.

**Final deliverables:** Source diff, updated design authority, test output with commands and results, native screenshot contact sheet/folder, screen-to-reference matrix, deviations table, regression/blocked-state list, and PR links. **No silent deployment or merge.**

## Acceptance matrix

| Screen | Reference | Dominant treatment | Critical invariant |
| --- | --- | --- | --- |
| Explore | `01` | White map overlays, forest active controls | Google map, query, sheet states and native attribution |
| Featured | `02` | Compact forest Passport, ivory destination list | Real progression and nine curated items |
| Curated detail | `03` | Destination hierarchy, honest media placeholder | Preview versus arrival-gated Viro |
| Place details | `04` | Clear provider place info and one main action | Provider ID, attribution, source contract |
| Profile | `05` | Clean forms and real account identity | EN/JA/KO, radius persistence, auth |
| Saved | `06` | Dense white rows and honest sync | Real metadata, no paid auto-fetch |
| Directions | `07` | True map/route blue, measured white dock | Location freshness, actual transport, sheet geometry |
| AR camera | `08` | Dark translucent forest tiles, seafoam edges | Existing native chapter ring and held interaction |

## Risk review / stop points

1. **Unresolved repo conflict:** If current `main` has changed materially, stop and reconcile before editing.
2. **Provider cost:** Reject UI code that adds Google API calls solely to fill cards or labels. Prefer honest existing data/fallbacks; ask owner if a richer source is desired.
3. **AR behavior:** Reject static or React Native overlays that replace Viro chapters, physical eligibility or held interaction.
4. **Illustrative mock data:** Reject screenshot-derived user identity, bookmark names, route distance, camera scenery, destination approvals or GPS positions.
5. **Visual QA:** Reject screenshot-perfect layouts that fail long strings, small Android displays, full text scaling, TalkBack or sheet dragging.
