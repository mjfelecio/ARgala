# Photo Islands Rollout Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Extend the accepted Danao museum experience to allnine destinations.

**Architecture:** Generalize immutable photo-bay configuration to one/two images
per bay. Reuse existing scene/gallery/session owners and per-destination scenery.

**Tech Stack:** Existing SDK57, pinned Viro3.0.3, TypeScript/Vitest. No dependencies.

**Spec:** `docs/superpowers/specs/2026-11-14-photo-islands-rollout-design.md`

## Global Constraints

- All9 destinations,20 chapters,53 original photographs with no duplicate padding.
- Keep accepted Danao geometry, flat2.25 reader, stationary focused paging, Classic.
- Cover height≤1.05, original aspect; story top≤lowest bay photo bottom−0.16.
- All shown photos open their own media; galleries stay separate from Passport.
- Preserve themes, native/lifecycle/GPS/capture owners, locale resources and content.
- No APK/native/dependency changes; November19 freeze,November20 stabilization.

## Review Focus

- D05's six photos/three chapters must not force a duplicate or missing story.
- Tall D05/D07 originals must fit and clear optional story controls.
- Six-photo/two-chapter destinations need a final photo-only bay.
- Other destinations must retain their scenery instead of inheriting Danao's.
- Every image's focus/Close scale must match its aspect-bounded visible width.

### Task1: Variable photo bays and bounded original-image geometry

**Files:** `photo-islands.ts/test`, `exhibit-stage.ts`.

**Interfaces:** Bay media IDs become a readonly one/two-image tuple. Add immutable
destination angle configurations; `createPhotoIslandsProfile(front, angles?)`
defaults to its destination angles and accepts an explicit validated override.
`photoIslandStoryY(profile,bayIndex)` shares clearance with scenery.

- [x] Add failing tests for all9 media/chapter counts,53 unique entrances, final
  single bays, no extra chapter, aspect/height bounds, exact focus scale and
  story clearance in captured/turned bases.
- [x] Implement ordered two-photo chunks and optional final single; validate bay
  count/finite unique angles and enough bays for existing chapters.
- [x] Cap image height proportionally and derive story position below the lowest
  image, preserving accepted Danao coordinates. Run targeted geometry tests.

### Task2: Allnine scene activation and native acceptance evidence

**Files:** `exhibit-ring-scene.tsx`, `photo-island-scenery.tsx`, actual scene/session
tests and documentation. Existing source profiles remain unchanged for rollback.

- [x] Add failing real-scene coverage for every standalone source, exact image
  selection, separate chapter denominator/openings, no text beneath photos,
  preserved per-destination scenery and session restoration across allnine.
- [x] Enable all9 islands through stable immutable presentations. Generalize
  static bay bases with the destination's existing welcome scenery.
- [x] Verify targeted tests, full `npm run check`, Android export and fresh review.
- [x] Sweep allnine on A53 using existing APK; inspect representative portraits,
  gallery/chapter/Close, capture preview/Discard, and release camera on Exit.
- [x] Add minimal inspected external gallery samples; update exact validation
  coverage/limits, commit only task changes and leave unrelated SDK/auth work.

Native evidence: source3b824ae, existing Nov8 client. Allnine welcome/gallery1→2/
Close checks passed; D05 full portrait selection, chapter2 paging and capture/
Discard passed. Exit released the camera. Two screenshots and one eight-second
navigation clip added externally. Exact limits are in `docs/validation.md`:
representative native checks, not all53 entrances/all20 chapters/JA/KO/FPS.
