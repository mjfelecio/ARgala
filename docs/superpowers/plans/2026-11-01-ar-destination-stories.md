# Destination Stories Implementation Plan

> **For agentic workers:** Use superpowers:executing-plans to implement this plan task by task.

**Goal:** Make the selected-destination AR workflow a cohesive, content-led experience.

**Architecture:** Preserve the existing destination catalog, immutable admissions, native Viro ring and session lifecycle. Derive chapter presentation and mixed text/image pages locally; session-only exploration progress grants no visit or provider authority.

**Tech Stack:** Expo 57, Viro 3.0.3, strict TypeScript, HeroUI Native, UniWind, i18next, Vitest.

**Spec:** Owner-approved Destination Stories proposal in the task conversation, 2026-11-01.

## Global constraints

- Preserve Overview at 0°, History at +90°, focus distance 1.5, held interaction and collapse-on-other-tile.
- Rich destination content and reading controls remain native Viro. Utilities have bounded hit surfaces.
- No new dependencies, backend protocol, native patch, production facts or media approvals.
- Preserve first-ready admission, Passport and unsupported-reader eligibility gates. No APK build without specific approval.

## Review focus

- Mixed-page cursors must preserve text offsets and media identity after reflow and restoration.
- Other-tile collapse, stale completion and restored focus must not create chapter openings.
- Help must disable native interactions without retiring the live frame or expiry clock.
- Maximum valid content must render; long titles, captions and translated labels must remain reachable.
- Production content readiness is separate from interface completion; development provenance stays visible.

## Task 1: Content and session foundations

- [x] Add failing regressions for 12 chapters, leading images, text cursor reflow, and durable-in-session media/opened IDs.
- [x] Implement explicit page kinds, image-first order, offset/identity restoration and whitelisted logical progress.
- [x] Verify focused geometry/gallery/session tests.

## Task 2: Native chapters and reading

- [x] Add real-scene tests for accepted focus completion, opened indicators, native chapter hierarchy and deferred callbacks.
- [x] Add chapter presentation, native cover/reading hierarchy, larger image area and subordinate page controls. Preserve full text/metadata.
- [x] Verify native scene/gallery tests including reflow and tracking interruption.

## Task 3: Workflow and utilities

- [x] Add screen/locale regressions for bounded Help, retained frame, arrival chapter context and explicit recovery.
- [x] Implement compact top/bottom utilities, clear preflight/current-state presentation, arrival invitation and unsupported-reader hierarchy.
- [x] Add EN/JA/KO copy and development-only realistic chapter samples; preserve existing authority owners.
- [x] Verify workflow, locales, admission and photo boundaries.

## Task 4: Delivery and verification

- [x] Document approved-content readiness, editorial handoff and implementation/physical acceptance separately.
- [x] Run npm run check, npm run export:android and git diff --check.
- [x] Obtain independent whole-change review, resolve material findings, and record exact evidence in docs/validation.md.

## Execution ledger

- Ruling: implement inline in a managed worktree; the owner already approved and requested execution of the proposal.
- Ruling: the initial shared dependency symlink was replaced with a worktree-local npm ci after an unrelated cleanup removed the source checkout's node_modules. No package or lockfile changes were made.
- Ruling: locale changes reset text to its first page because translated source offsets are not equivalent; same-locale text uses offsets and image pages retain media identity.
