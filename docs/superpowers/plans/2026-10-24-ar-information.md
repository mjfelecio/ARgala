# Floating AR Information Implementation Plan

> Implement sequentially with the existing dedicated branch. Root reviews geography/cost boundaries; OpenCode Zen handles isolated UI/tests when available, with GPT-6 Luna fallback. No overlapping file edits.

**Goal:** Useful real place information on selected/in-range floating cards without replacing the sheet or spending extra provider requests.

**Architecture:** Keep raw projection/eligibility in the controller. Extend visual card geometry and the existing label component; reuse the sheet's Details action. No provider fields, queries or sensor algorithms change.

**Tech stack:** Expo 57, strict TypeScript, existing RN/UniWind/HeroUI/Reanimated and TanStack Query.

**Spec:** [AR information design](../specs/2026-10-24-ar-information-design.md).

## Constraints and review focus

- Start from merged main `101e450`; preserve raw FOV, timestamps, watcher health, true-heading quality, radius and all paid-request rules.
- Keep rich width 232 dp, compact width 168 dp, maximum count three, safe geometry and current display stops.
- Reuse address/description; no category inference, provider calls or new dependencies.
- EN/KO/JA copy stays in actual locale resources; omission and locale updates need real component coverage.
- Keep a manually selected outside-radius place inspectable without labeling it in range.
- Invalid/stale sensors remove direction immediately; Details actions must reject stale blur/selection events.
- Reserve safe font-scaled card lanes and preserve measured sheet clipping/camera bounds.
- No preview build or automatic feature-PR merge.

## Task 1: Visual geometry and data boundary

Files: `src/config/limits.ts`, `src/features/ar/projection.ts`, `projection.test.ts`.

- [x] Add failing tests: selected/in-range labels have a rich safe width; ordinary labels remain compact; narrow viewport bounds and raw FOV/radius/order are unchanged.
- [x] Run projection tests and verify meaningful failure.
- [x] Add `AR.richLabelWidth = 232` and choose/clamp each visual width using selected/eligible state only. Preserve ranking/membership/geographic values.
- [x] Run projection tests.

## Task 2: Rich cards and Details interaction

UI-owned files: `ar-labels.tsx`, `ar-labels.test.tsx`, three locale JSONs. Root-owned files: `ar-discovery.tsx`, `ar-discovery.test.ts`.

Interface: add `onInspect(providerId: string)` to `ArLabels`; ordinary taps call `onSelect`, selected taps call `onInspect`. Controller reuses one guarded Details handler for sheet and selected card.

- [x] Write failing real UI tests for real/omitted metadata, selected and eligible status, outside compact presentation, approximate distance, select/inspect actions, locale changes and enlarged/narrow safe bounds.
- [x] Write a failing discovery regression for selected-label Details navigation and synchronized stable selection without an automatic paid request.
- [x] Implement styled cards, bounded copy and accessible full text. Reserve `32 + 112 * max(1, fontScale)` dp safe lanes; keep smaller compact/metadata-free surfaces inside them. Use existing snapping/reset behavior.
- [x] Add EN/KO/JA status/action/approximate-distance copy; omit unsupported icons.
- [x] Wire the existing Details handoff with running/selected-ID/navigation guards; keep the bottom sheet intact.
- [x] Run focused label/discovery/projection/shell/cost tests and independent review.

## Task 3: Verify and deliver PR A

- [x] Run `npm run check`, applicable Android checks/export and `git diff --check`.
- [x] Attempt existing-client ADB verification and document gaps: USB tunnel failed to load the bundle; LAN Metro became available, but secure keyguard and 4% battery prevented card interaction. App stopped and screen off. Camera-card appearance, outdoor readability and live interaction remain unverified.
- [ ] Commit coherent Conventional Commits, push the dedicated branch and prepare PR A against current main. Do not merge it or start an EAS preview build.

PR B is independent and begins only after PR A's implementation/reviewable delivery, from latest stable main using its own branch and navigation design/tests.
