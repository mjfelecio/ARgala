# Cinematic AR visible presentation implementation plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement task by task.

**Goal:** Make the native AR visibly match the approved cinematic handoff while content/video remain deferred.
**Architecture:** Existing Viro scene, ring, session and admission owners remain. Shared native frame and authored vector-derived textures give the existing square geometry its approved forest/seafoam presentation. Native animation owns motion; React changes only at real events.
**Tech Stack:** Installed Expo57/React Native0.86/Viro3.0.3; no dependencies or native patches.
**Spec:** `docs/design/cinematic-ar/DESIGN-SPEC.md`, original approved camera concept; owner correction to prioritize fun/flashy AR, 2026-11-02.

## Constraints and review focus

- Preserve native camera, ring headings, focus distance1.5, held-click owner and collapse behavior. No constant idle motion or camera tint.
- Keep all decorative geometry hit transparent; preserve controls, credits and text fit.
- Caption paging cannot remount the loaded image. Help/tracking changes retire queued actions.
- Reduced motion and scheduling pressure keep a complete readable frame and final transforms.
- Recovery does not replay entrance, reset history or earn progress. Development preview explicitly requests full entrance without clearing persisted history.
- Approved direction already supplied; implement in existing isolated worktree without another design questionnaire. Every APK build still needs owner approval.

## Task1 — Holographic frames and meaningful covers

Files: new `holographic-assets.ts`, `holographic-frame.tsx`, `chapter-emblem.tsx`; authored assets under `assets/ar/`; reproducible `scripts/generate-ar-holographic-art.py`; modify `information-tile.tsx`, `information-panel.tsx`, `native-styles.ts` only as needed.

- [x] Add regression for readable frame/cover meaning under normal and reduced decoration, one hit owner and no decorative hit capture. Demonstrate failure.
- [x] Build rounded matte/translucent forest frames, crisp seafoam brackets, chapter emblem and clearer cover hierarchy. Derive artwork colors from existing CSS; no new brand palette or destination imagery.
- [x] Run focused scene/gallery tests; inspect generated artwork and native render. Preserve existing content geometry.

## Task2 — Native entrance and page response

Files: `cinematic-deployment.tsx`, new `page-transition.tsx`, `information-panel.tsx`, `destination-ar-session-screen.tsx`, locale resources and relevant tests.

- [x] Add regressions for page transition on actual cursor changes without image remount, no motion when disabled/reduced, final stable content, full development preview with existing history intact.
- [x] Keep native animation definitions stable; strengthen emblem formation/unfold/settle inside3000ms (owner feedback: show all covers before departure) and return650ms. Page changes use brief opacity/translation inside a stationary frame.
- [x] Add explicitly requested full entrance preview before development startup; leave actual destination first/return/recovery policy intact.
- [ ] Run regressions, full `npm run check`, native patch check and Android export. Perform brief existing-APK device capture when available; record physical limits honestly.

## Task3 — Review and evidence

- [x] Fresh read-only whole-change review; fix important findings with focused regression coverage.
- [ ] Update cinematic implementation/validation evidence with screenshots and exact checks. Commit small reviewable changes; no merge or deployment.


Ruling: The supplied design remains the approved direction; owner correction
requests visible cinematic execution, then explicit acceptance of the revised
appearance/entrance. No replacement design questionnaire was needed.
Ruling: Initial native feedback required changing simultaneous outward flight
into a forward spread/hold before staggered departure; full entry3000ms remains
within the approved2–3s range. Content and video remain deferred.
Ruling: Use the actual painted cover as the native hit surface. The0.01-opacity
quad failed on-device; owner confirmed the painted-surface correction opens.
