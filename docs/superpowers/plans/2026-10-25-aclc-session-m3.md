# ACLC M3 session lifecycle

Authority: approved ARgala_MVP_Blueprint.md Sections7/12, parent M3 in2026-10-25-aclc-viro-vertical-slice.md and the owner's pending-versus-live / same-frame orientation clarifications. Owner authorized PR26 merge and proceeding. No renewed product design gate.

## Compatibility and boundaries

Existing isolated managed worktree; branch feat/aclc-ar-session from PR26 merge956ecfc. Expo57.0.31/RN0.86.3/React19.2.3/Viro3.0.3 stay pinned. CI validate40196806148 passed exact PR head812f8d3 before merge; merged baseline npm run check passed782 tests/71files, typecheck and zero-warning lint. M2's owner-verified fixes pass its brief interaction trial; remaining rotation/translation/CJK/outdoor/performance cases remain explicit, not waived.

No new dependency, native patch, APK, GPS/provider work or invented destination content. Reuse existing camera permission sharing, full-screen native measurement, installed Router focus/transition hooks, CSS/HeroUI controls and EN/JA/KO. HOP-Driver permission/bootstrap patterns were consulted; preserve ARgala's stricter passive-read/explicit-retry contract rather than copying automatic permission startup. SDK57 docs and installed code are the API authority.

M4 owns real destination manifest, GPS eligibility and single-use entry intents. M3 defines an injected fresh-entry validator called immediately before every first mount; its actual route is development-only and explicitly labeled. Production entry is not exposed. A development validator is never geographic eligibility. Pending startup gains no radius/restoration exemption; tracking-ready establishes live status. Readable text and controls remain Viro-native.

## Interfaces

- Pure session owner holds destination/principal identity, pending/live status, suspension timestamp, selected ID and reading cursors. No pose, coordinates, provider data or frames. Identity change/exit/unmount/process death closes ownership. Exact300000ms grace expires; clock rollback cannot extend it.
- useViroStartup gains optional lifecycle callbacks and a synchronous mount-authorization predicate; default square/M1 behavior remains explicit Retry. State above navigator owns permission/install attempts. Same-frame loss retains native geometry; a remount restores logical progress only after a new NORMAL horizontal pose.
- Ring scene accepts an optional externally owned reading controller and initial/logical progress callbacks. Existing standalone scene tests remain real. Selected ID/page restore in the fresh coordinate frame; old transforms are never passed back.
- First-use approximately2.4s reveal starts only after tracking-ready, pauses for lost tracking and is skippable. A dedicated completion key stores only its one-time flag; failures remain recoverable with localized diagnostics-free UI. Repeat/recovery sessions skip reveal. Reduced motion avoids staged motion. Reuse utility chrome; no rich-content overlay or language picker.

### Task 1: Pure logical session owner

Add session.ts/test. RED tests: pending interruption requires fresh validation; first-mount revalidation; only ready promotes live; outside-radius continuation; suspended4:59 versus5:00; clock rollback; destination/principal mismatch; explicit close/process-new-instance; interrupted recovery does not auto-loop native installation; progress retained without any spatial fields; stale attempt callbacks fenced. Implement and run focused tests plus lint/typecheck before coherent commit.

### Task 2: Startup and foreground session orchestration

Extend use-viro-startup.ts/tests and add use-ar-session.ts/tests. RED: mount predicate runs after preflight and delayed transition/measurement immediately before mount; denied admission never mounts; late permission/support/deadline callbacks cannot revive retired attempts. Passive resume only for established suspended sessions and never re-prompts; revocation blocks mounting; initial/install interruption requires Retry, including interrupted live recovery. Grace/identity checks repeat at mount. The M3 screen must resolve its native module before enabling final mount readiness, so a lazy bundle delay cannot separate eligibility validation from native creation. Run real hooks with native boundaries mocked; preserve all M1 regressions.

### Task 3: Logical scene restoration and reveal

Extend destination-ring-scene/information-panel; add dedicated intro preference/hook as needed. RED: fresh-frame selection/page restored from logical snapshot, no stale transforms, same-frame loss/turn/recovery retains orientation, completed Close clears selection; external reading controller survives native unmount/save failure. Reveal begins at first ready, Overview first/sequential/skippable/quick repeats, pauses on tracking loss, reduced motion; EN/JA/KO intro errors/retry and locale changes. Run focused scene/preferences/controller tests and lint/typecheck before commit.

### Task 4: Guarded route and installed-router lifecycle tests

Wire only development ring route to session experience, with actual auth identity, utility Exit/Retry/Skip/status and injected development admission. Existing square and provider flows stay intact. RED real-screen tests using installed focus hooks: delayed transition, foreground snapshot, camera release/reentry, logical reading restoration, failed/expired initial/recovery attempts, permission revoke/request interruption, auth change/Exit, late callbacks and actual locale resources. Native install attempts stay outside disposable navigator and never retry automatically after interruption. Full npm run check, export:android and diff check; no APK build without separate approval.

### Task 5: Review and evidence

Independent read-only whole-branch review (authorized by blueprint); one focused RED→GREEN fix pass for confirmed material findings. Update parent plan and validation/checklist. Draft PR only; no automatic merge. Record physical M3 tracking/background/permission cycles as NOT RUN while the low-battery phone charges. M4 approved activation point/content/provider association and on-site GPS remain later inputs/gates.
