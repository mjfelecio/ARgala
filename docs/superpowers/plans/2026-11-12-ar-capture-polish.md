# AR Capture Polish Implementation Plan

**Status:** Owner approved the chat plan and ivory/forest direction on November 12, 2026.
**Execution:** Tasks 1–2 implemented in `7122e58`; full check passes 1,485 tests/130 files and Android export. Task 3 code review passed; native evidence pending the charged/reconnected A53. See [implementation report](../../ar-capture-polish.md).

**Goal:** Make screenshot processing and review feel integrated with the polished app.
**Architecture:** Keep capture controller/service ownership; isolate URI-keyed preview presentation and bitmap readiness. Use HeroUI, UniWind and existing CSS tokens. No new dependencies or APK.
**Spec:** Owner-approved “Polish AR Capture and Processing” plan in the conversation, reproduced below. Remain on feat/ar-experience-refinement.

## Approved design and constraints

Ivory page, forest headings, Plus Jakarta Sans explicit weights, compact header, large rounded aspect-contained photo. Canvas is 58% of viewport height after safe insets, clamped to 220–560 dp. Full-width Save primary, Share secondary and Discard tertiary; existing sharing/temporary explanations subordinate. One scroll owner; all actions reachable with large text/short view. Android Back discards an idle preview.

Capture retains its label/dimensions with a reserved spinner slot and bounded “Preparing your AR photo…” feedback within existing utility chrome. No full-screen processing overlay or fake percentages/delay. Preview opens after owned file capture, with canvas spinner until bitmap success. Disable Save/Share until loaded; keep Discard. Fence bitmap events and 15-second deadline by URI/lifetime; failure uses existing preview-failed recovery. Saving/sharing/saved/errors get consistent indicators. All new copy EN/JA/KO. Preserve native camera/reader/2.25 distance/admission/Passport, resource leases and timeouts. No public interface changes.

## Review focus

- Slow capture and bitmap never leave unbounded loading or an enabled premature Save.
- Retired image callbacks cannot affect a later capture, background or principal/frame owner.
- Large/translated copy and short viewport keep Discard/recovery reachable.
- Status chrome remains bounded and does not change native camera bounds/touch ownership.
- Back/save/share preserve existing serialized resource leases and cleanup.

### Task 1: Capture and bitmap presentation states

Files: existing ar-photo-controls.tsx/test; new ar-photo-preview.tsx if needed to isolate URI lifecycle.
- Write failing real-component regressions for stable capture label/status, delayed bitmap, load/error/deadline, retired callbacks and pending save/share.
- Run npm test -- src/features/ar-photo/ar-photo-controls.test.tsx and inspect expected failures.
- Implement presentation state with existing controller, PHOTO_DEADLINE_MS, Spinner and actual locale resources. Key preview by URI; retire events and timer on unmount/failure/load. Keep default props/API unchanged.
- Run photo controls/controller/service focused tests; expected all pass.

### Task 2: Preview layout and integration

- Build approved compact ivory/forest header, responsive contained canvas, full-width actions and quiet notes with one scroll owner. Keep current native Modal and safe-area owners; add dark status-bar treatment within preview lifetime.
- Test normal/short viewport geometry, font scale 1.5, actual locales, capture lease/background and existing screen integration; mocks prove behavior/bounds, not Yoga.
- Run npm test -- src/features/ar-photo src/features/destination-ar/destination-ar-session-screen.test.tsx; then npm run check and offline Android export; expected pass.
- Commit coherent source refinement after checks, with Conventional Commit and body.

### Task 3: Review and device evidence

- Obtain one fresh read-only review of this task range; fix material confirmed findings with red/green regression.
- Use existing dev APK/Metro on charged A53 when available; no new APK build. Capture native processing/preview/success/error where feasible; verify capture/discard, portrait/landscape, large text, scroll, background/return. Do not save/share publicly without explicit action authorization or claim native results from mocks.
- Update validation/implementation evidence with exact commands/counts, screenshots and skipped cases. Commit docs; do not push/merge/deploy.
