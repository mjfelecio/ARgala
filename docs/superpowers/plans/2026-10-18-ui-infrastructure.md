# Clean Explorer UI Infrastructure Implementation Plan

> Execute inline with superpowers:executing-plans. The owner's supplied two-phase architecture and validation instructions govern this plan.

**Goal:** Establish the approved CSS-owned UniWind/HeroUI foundation in the existing Android Expo SDK 57 application.
**Architecture:** Official Metro integration and root providers; CSS semantic theme; actual HeroUI showcase isolated from paid/device services. Preserve all product screens and backend functionality in Phase 1.
**Tech Stack:** Expo 57, React Native 0.86, UniWind, Tailwind CSS 4, HeroUI Native, Expo Font, existing Gesture Handler/Reanimated.
**Spec:** `docs/superpowers/specs/2026-10-18-ui-infrastructure-design.md`

## Global constraints

- Stable main base `69bebee`; PR #6 stays unmerged.
- CSS owns colors/typography/spacing/radii; no TypeScript theme duplication.
- Localize copy in English/Korean/Japanese. No paid calls from showcase.
- Native build and runtime evidence are distinct from Hermes export.

## Review focus

- Release users must not enter the showcase; development users can open it without provider credentials.
- Selected, disabled and busy controls expose appropriate accessible states.
- Live language changes update visible state messages.
- Existing auth/permission/query behavior remains unchanged.
- Android font names, CJK fallback, touch targets and large text require actual native verification.

## Task 1: Infrastructure

- [x] Run baseline `npm run check`.
- [x] Install compatible packages with `expo install`; inspect installed package docs and peers.
- [x] Add `metro.config.js`, `global.css`, generated UniWind types, bundled font config and root gesture/HeroUI providers.
- [x] Run dependency, type, lint, Android configuration and export checks before committing `feat(ui): establish UniWind and HeroUI infrastructure`.

## Task 2: Showcase

- [x] Write focused failing tests for local selection/reset, disabled/loading accessibility, locale changes and release access gating.
- [x] Implement `src/features/ui-showcase/showcase-screen.tsx` and a development-only root gate; no wrapper design-system components.
- [x] Run targeted tests then full check and Android export. Commit `feat(ui): add Clean Explorer component showcase`.

## Task 3: Evidence and PR

- [ ] Attempt development APK build and Android runtime showcase verification using available EAS tooling.
- [ ] Record exact evidence, selected versions, CSS structure, Phase 2 component mapping and outstanding device checks in `docs/validation.md` and UI integration documentation.
- [ ] Review the branch, commit documentation, push the dedicated branch and create a focused PR; never merge.
- [ ] Report Phase 1 results and justified custom components before Phase 2 or additional screens.
