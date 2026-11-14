# Destination Stages Implementation Plan

> Implement task-by-task with superpowers:executing-plans. Each behavioral change
> uses focused RED→GREEN regression coverage; keep a ledger and commit coherently.

**Goal:** Implement the approved gallery-first Danao stage, then extend only after
physical acceptance. **Architecture:** Immutable stage profile and one per-frame
focus controller; shared services, separate gallery progress. **Tech stack:**
Installed Expo57/React/Viro3.0.3, no new dependencies/native changes.
**Spec:** ../specs/2026-11-14-destination-stages-design.md

## Task 1: Gallery data, progress and frame contracts

- [ ] Cover all 53 catalog photos, D01's seven and chapter-count separation.
- [ ] Validate optional Exhibit gallery progress against explicit media IDs;
      preserve Classic's existing shape and all identity/expiry fences.
- [ ] Implement immutable D01 composition and separate gallery focus target.
- [ ] Verify pure/session tests RED→GREEN.

## Task 2: Native Danao stage and gallery

- [ ] Cover actual scene gallery selection, paging, isolated geometry, completion,
      reading controls, image recovery, Help/tracking and background restoration.
- [ ] Implement gallery entrance, distinct story stations, native shoreline/ridge
      accents and bounded entrance/reveal using the existing focus/controller.
- [ ] Reuse image completion/error handling; give metadata its own pagination.
- [ ] Add EN/JA/KO interface copy, preserving unrelated locale changes.
- [ ] Run focused scene/screen/session tests, npm run check, Android export and
      all-photo hash checks. Record exact evidence and commit D01.

## Task 3: Native acceptance and other destinations (gated)

- [ ] Wait for owner notification before connecting to the phone.
- [ ] Review D01 gallery/stage on A53; save only meaningful navigation samples.
- [ ] After acceptance, implement remaining eight profiles and expose completed
      destinations only. Repeat full checks and all9/53-photo/20-chapter sweep.
- [ ] Stop new visuals by Nov19; stabilize Nov20. Keep Classic for Nov21 if Exhibit
      is not accepted. Obtain specific approval before any APK packaging build.

## Review focus

Gallery must never become a fake chapter; late image/selection/Close callbacks
cannot revive retired views; metadata size/locale changes preserve media identity;
immediate background after accepted Close cannot reopen it; Classic does not
inherit Exhibit focus/configuration. Pin these in actual service/scene tests.
