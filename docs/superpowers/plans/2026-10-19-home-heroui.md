# Home Map HeroUI Implementation Plan

> Execute inline with superpowers:executing-plans under the owner's supplied architecture and scope.

**Goal:** Rework PR #6 on the CSS-owned HeroUI foundation while preserving maps, paid API controls and AR handoff.
**Architecture:** Feature-specific compositions of HeroUI controls; persistent Gorhom sheet within the map; resolved CSS for native geometry only.
**Tech Stack:** Existing Expo 57/UniWind/HeroUI stack plus @gorhom/bottom-sheet 5.2.14.
**Spec:** `docs/superpowers/specs/2026-10-19-home-heroui-design.md`

## Global constraints

PR #8 owns infrastructure. PR #6 must stay unmerged. No custom token theme, fake POI data, new navigation or backend changes. All UI copy uses existing translations; new cases need EN/KO/JA resources.

## Review focus

- Full-details actions must disappear after success and return after cache reset/failure or new-language request.
- Actual HeroUI components must retain labels, disabled/busy states and enlarged-text scrolling.
- Dragged sheet occupation must protect Google credits while route fitting waits for settled geometry.
- Native map layout changes must not cause paid requests.
- Owner device verification remains separate from mocked tests/export/native compilation.

## Tasks

- [x] Demonstrate duplicate-detail failures in Home/AR tests, then fix state guards and retry behavior.
- [x] Share native test shims while retaining actual HeroUI components; keep the established lifecycle suite.
- [x] Replace controls/panel, add persistent sheet and native padding integration, and remove custom primitives/token files.
- [x] Validate focused regressions/full check, Expo dependencies/Doctor, Android config/export; review the complete diff.
- [x] Update validation and component mapping; push the reworked branch to PR #6 without force, set its base to the infrastructure branch and report remaining runtime work.
