# Destination Stages Implementation Plan

> Implement task-by-task with superpowers:executing-plans. Each behavioral change
> uses focused RED→GREEN regression coverage; keep a ledger and commit coherently.

**Goal:** Implement the approved gallery-first Danao stage, then extend only after
physical acceptance. **Architecture:** Immutable stage profile and one per-frame
focus controller; shared services, separate gallery progress. **Tech stack:**
Installed Expo57/React/Viro3.0.3, no new dependencies/native changes.
**Spec:** ../specs/2026-11-14-destination-stages-design.md

## Task 1: Gallery data, progress and frame contracts

- [x] Cover all 53 catalog photos, D01's seven and chapter-count separation.
- [x] Validate optional Exhibit gallery progress against explicit media IDs;
      preserve Classic's existing shape and all identity/expiry fences.
- [x] Implement immutable D01 composition and separate gallery focus target.
- [x] Verify pure/session tests RED→GREEN.

## Task 2: Native Danao stage and gallery

- [x] Cover actual scene gallery selection, paging, isolated geometry, completion,
      reading controls, image recovery, Help/tracking and background restoration.
- [x] Implement gallery entrance, distinct story stations, native shoreline/ridge
      accents and bounded entrance/reveal using the existing focus/controller.
- [x] Reuse image completion/error handling; give metadata its own pagination.
- [x] Add EN/JA/KO interface copy, preserving unrelated locale changes.
- [x] Run focused scene/screen/session tests, npm run check, Android export and
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

### Task 3 rollout continuation — owner authorized 2026-11-14

The owner confirmed corrected Danao paging is stable, then explicitly requested
continuing the other eight custom stages. This opens profile implementation;
remaining native verification stays part of the rollout rather than a new
permission gate. Keep Classic and the accepted Danao profile intact.

1. Add immutable profiles for all nine using the approved destination treatments,
   bounded distinct station positions and existing 53-photo/20-chapter content.
2. Add static symbolic scenery through installed Viro polylines, below64 nodes,
   ignored by hits, hidden during focus/Help and removed for reduced effects.
3. Bind each guarded lazy scene to its explicitly selected profile. Show all nine
   Exhibit choices; preserve timeout/Retry, principal, lifecycle and Classic paths.
4. Exercise every real profile/gallery/story scene, independent progress,
   captured-basis geometry and EN/JA/KO UI. Run full check/export/photo hashes.
5. Review the complete rollout delta, fix material findings, then use the existing
   A53 client for important navigation samples and a nine-destination device sweep.
   Record exact limits; packaging/build still needs separate owner approval.
