# Photo Islands Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Restore spatial exploration with Danao photo bays around the visitor.

**Architecture:** Extend Exhibit with explicit gallery-entrance descriptors and
pure captured-basis geometry. Reuse its gallery, native transitions and chapter
controller; map every photo entrance to the one existing logical gallery owner.

**Tech Stack:** Existing Expo SDK 57, strict TypeScript, React Native, pinned
Viro 3.0.3, Vitest/react-test-renderer. No dependencies or native changes.

**Spec:** `docs/superpowers/specs/2026-11-14-photo-islands-design.md`

## Global Constraints

- Danao first; physical Galaxy A53 review before expanding to eight other stages.
- Reader: flat 1.25-unit square, 2.25-unit distance; no page reveal/glint.
- Three bays at −95°, +35°, +150°; 2.6-unit radius, photo centers ±9° per bay.
- Classic selectable; old front-stage profiles/presentation retained.
- No changes to content, capture services, admission, camera lifecycle or Passport.
- Scene state remains per mount. No per-pose React publications or JS frame loop.
- English/Japanese/Korean labels come from locale resources; credits remain data.
- November 19 visual cutoff; November 20 stabilization; November 21 presentation.

## Review Focus

- A retired photo click after focus, Close, Help or unmount cannot replace cursor.
- Gallery restoration from any bay remains a gallery, never an opened chapter.
- Turned basis, explicit Recenter and tracking recovery preserve geometry/2.25 focus.
- Every photo remains reachable and small covers retain real native hit surfaces.
- Classic and other eight destinations preserve accepted behavior while D01 changes.

### Task 1: Gallery entrance identity and native focus geometry

**Files:** Create `src/features/destination-ar/photo-islands.ts` and
`photo-islands.test.ts`; modify `exhibit-stage.ts`.

**Interfaces:** `exhibitGalleryEntries(profile)` returns stable `{id, mediaId?}`
descriptors; `isExhibitGalleryEntry(profile, id)` classifies exact known IDs;
`exhibitSceneEntries(profile, chapters)` builds controller entries;
`buildPhotoIslandSlots(profile, entries, basis)` returns `RingSlot[]`.
Expose a frozen Danao islands profile separately from the old front-stage profile.

- [x] Add regressions for seven unique image entrances, 3 unchanged chapter IDs,
  all photo identity/bounds, angular separation and cardinal/turned bases.
- [x] Watch targeted test fail before implementation.
- [x] Implement pure descriptors/geometry, validate entry ownership/order, and
  retain the original front-stage builder for rollback/eight other destinations.
- [x] Verify select/Close from each entrance returns to that entrance, and fresh
  focus remains at 2.25 units. Run focused geometry/controller tests.

### Task 2: Photo bays through the existing scene and gallery owner

**Files:** Modify `destination-ring-scene.tsx`, `danao-stage.tsx`,
`exhibit-ring-scene.tsx`; create `photo-island-scenery.tsx`; extend
`destination-ring-scene.test.tsx` and locale resources only for new visible copy.

**Interfaces:** Gallery entry accepts its descriptor and selects its unique ID.
Scene derives a cursor by media ID only after native selection is accepted;
logical progress recognizes every entrance as the existing gallery.

- [x] Add failing real-scene tests: bay photo opens exact image, Next/Close,
  resume through welcome, restoration, no chapter openings, stale callbacks,
  tracking/Help, Recenter and unmount isolation.
- [x] Render bounded photo covers and larger story tiles in the approved bays;
  visible images own accurate hits and decoration ignores events.
- [x] Hide all neighboring geometry through opening/read/Close. Retain native
  stationary reader paging, shared preferences and previous chapter counts.
- [x] Enable Danao islands only. Export old Danao front presentation for rollback.
- [x] Run targeted scene/gallery/geometry tests, then `npm run check` and
  `npm run export:android`. Review diff; fix confirmed findings and reverify.

### Task 3: Native Danao review checkpoint

**Files:** Update presentation Exhibit README and validation evidence, preserving
unrelated pending auth/SDK edits. Minimal device gallery outside repository.

- [ ] Use the existing accepted development APK and Metro; no APK build.
- [ ] Verify tracking-ready, turn to all 3 bays, all 7 image entrances, galleries,
  each story, rapid paging, Close, Recenter and temporary tracking/Help recovery.
- [ ] Capture only important actual-navigation screenshots/short clip, inspect
  evidence, and release camera on Exit. Record exact native verification limits.
- [ ] Show Danao for owner review. Extend islands to other destinations only
  after physical acceptance; do not infer approval from automated screenshots.
