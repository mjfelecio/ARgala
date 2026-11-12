# AR Stability and Reader Refinement Implementation Plan

> **For agentic workers:** Use `superpowers:executing-plans` after owner approval, implementing and verifying each task in order. Do not begin implementation from this document until approved.

**Status:** Owner approved implementation on November 12, 2026; work in progress. Builds, merge and deployment remain separately gated.

**Goal:** Make first entry and panel collapse recoverable and reliable, then create a spacious, photo-led native reader without changing the accepted ring or arrival rules.

**Architecture:** Retain the existing route/session/controller/native-scene boundaries. Give code loading an observable, bounded owner and give each focus transition a single completion owner. Extend the current utility chrome and native reader, with one reading-size preference and shared reader-layout measurements.

**Tech stack:** Expo 57.0.32, React 19.2.3, React Native 0.86.3, Viro 3.0.3, TypeScript, existing HeroUI/UniWind and Vitest. No dependency or native-runtime change is proposed.

**Spec:** Owner's “ARgala — AR Experience Stability and Reader UX Refinement” request, November 11, 2026. Project authority: `AGENTS.md`, `DESIGN.md`, `docs/ar-destination-stories.md`, and the existing cinematic AR specification, subject to later owner decisions.

## Execution status — November 12, 2026

| Tasks | Status |
| --- | --- |
| 1–4 loading, transitions, Help, clean reader surface | Implemented and committed; source regressions pass. Cold first navigation and five warm reopens passed on A53. |
| 5–7 screen toolbar, spatial row, photo-first reader | Implemented and committed. Final text/photo/credit, rounded container/buttons and screen size controls observed. Controlled ADB page/size/rapid-Close trials passed; full finger/fit matrix remains task 9. |
| 8 automated checks | Latest typecheck/lint and 1,475 tests / 130 files pass; final Android export passes with 74 assets. No APK build. |
| 9 physical verification | Partial device acceptance recorded. Final rounded geometry, ADB paging/size/rapid-Close, Capture/Discard and brief return observed. Longer return restored focus but tracking remained limited. Stopped at 15% battery; finger/interrupted-transition/CJK/portrait/short-view matrix remains open. |
| 10 report and one-branch handoff | Implementation report records exact checks, private screenshots and gaps. Independent read-only review completed; its important short-toolbar recovery finding was fixed and regression-tested. |

The checklists below preserve the approved task specification; this status table and implementation report distinguish implemented code from remaining physical acceptance.

## Global constraints

- Preserve **2.25 Viro scene units** for focused distance, native camera bounds, captured orientation, canonical chapter ring and unexpanded tile artwork.
- Preserve dark green `#102724` surfaces and teal `#71DCD2` edges; no general app redesign.
- Preserve fresh-entry GPS checks, admission/principal/provenance ownership, established-session recovery and Passport restrictions. Simulated sessions never prove arrival.
- No destination research or photo/content/coordinate additions, replacements, removals or approval promotion. Existing content is testing material only.
- Use existing components and dependencies; all changed app copy belongs in EN/JA/KO locale resources.
- No new APK build without approval for that specific build. Use the installed development APK and Metro where compatible.
- One branch and eventual PR: `feat/ar-experience-refinement`. Keep fixes and visual changes in separate reviewable commits on this branch; no merge without instruction.

## Investigation findings

### Checkout and baseline

The investigation started in `/home/kirbysmashyeet/Source/typescript/ARgala` on `main` at `4911d84`, with accepted comfort and featured research changes in the working tree. Other worktrees existed but were not substituted for this checkout.

At the owner's subsequent request, the earlier work was committed as **`1c15c38`**, `feat(ar): add featured research previews and improve panel comfort`, on **`feat/ar-experience-refinement`**. It contains the prior nine-destination research previews, sixteen bundled images, draft EN/JA/KO resources, 2.25-unit geometry and prior evidence. Unrelated brand handoffs and ZIP files remain untracked and untouched. No refinement application code has been changed.

Read: full current `AGENTS.md`, design authority, featured research inventory/testing guide, relevant validation entries, cinematic implementation/design references and AR reader code. The UI skill and historical documents still contain superseded 1.5-unit/hold-only directions; current owner instructions and AGENTS take precedence. HOP's camera-permission hook was consulted for foreground permission refresh precedent; its different camera library is not proposed for adoption.

Fresh verification against the earlier work:

| Command | Result |
| --- | --- |
| `npm run check` | PASS: typecheck, zero-warning lint, **1,447 tests / 128 files** |
| `npm test -- src/features/destination-ar/destination-ar-session-screen.test.tsx src/features/destination-ar/destination-ring-scene.test.tsx src/features/destination-ar/use-ar-session.test.tsx src/features/destination-ar/use-viro-startup.test.tsx src/features/destination-ar/ring-controller.test.ts src/features/destination-ar/information-gallery-panel.test.tsx` | PASS: **170 tests / 6 files** |
| `git diff --cached --check` before the earlier-work commit | PASS after removing Markdown trailing whitespace in the previously untracked research form |
| Android export / APK build | Neither rerun during this investigation; previous export evidence remains historical |

Additional investigation probes ran **outside the repository**, using copies of existing real-screen tests with native boundaries mocked. Command: `./node_modules/.bin/vitest run --config /tmp/argala-ar-probes/config.mts -t INVESTIGATION`. Result: **4 expected failures, 108 skipped, 3 files**. These demonstrate missing recovery/completion behavior; they are not fixes or a passing acceptance suite. Temporary harnesses and logs are local investigation artifacts, not committed application tests.

### Issue 1: first entry remains on Loading

**Physical reproduction:** observed on the Samsung Galaxy A53 SM-A536E / Android 16, installed development APK last updated November 8, USB Metro on port 8081. Within this existing process, Profile → ACLC ring prototype showed only an ivory page and a spinning “Loading…” notice for over a minute. Back to Profile → reopen reached the destination selector. This was a cold route/module-entry observation, **not a fresh APK installation or controlled cold-process trial**.

The busy spinner is significant: `ViroRingRoute` in `dev-entry.tsx:9–21` renders that fallback around `React.lazy(import('./destination-ar-session-screen'))`. `DevelopmentGallerySession`'s separate content-loading notice has no busy spinner. This strongly identifies the outer route Suspense boundary as the observed stage, but identical global loading copy means visual inspection alone is not an internal state trace.

**Sequence traced:**

1. Profile launch pushes `/viro-ring`; the route checks both development guards.
2. `dev-entry.tsx` lazily imports the session-screen module under Suspense.
3. Once resolved, the destination selector mounts. A featured selection assembles existing preview content; selecting the ACLC gallery additionally calls `loadDevelopmentGalleryContent()`.
4. `DestinationArSessionExperience` reads intro history and reading preferences and measures the full scene.
5. Explicit Start begins `useViroStartup`: native support → camera permission → prepared.
6. `ring-loader.ts` dynamically resolves the native scene. Measurement, intro-history readiness, navigation transition readiness and fresh authorization gate initial mounting.
7. Native normal tracking plus a valid horizontal pose captures the frame and calls ready; first tracking-ready revalidates entry and establishes the session.
8. Reveal settles into interactive exploration.

**Confirmed gaps:**

- Outer lazy-route pending has neither a deadline nor a local load-error/Retry boundary.
- Gallery-content loading handles rejection/null but not a promise that never settles. The controlled probe remains on Loading after **60 seconds** without permission or Viro work beginning.
- The actual native-startup path already has a **20-second** deadline, including delayed scene import and missing first tracking/pose. Existing regressions pass. Adding another blanket native-start timer would duplicate existing behavior.
- Initial intro-history loading also participates in mount readiness. Rejection is handled; a stalled read can consume the existing startup deadline. The reading-size read and optional audio do not independently gate entry.

**Root cause status:** the missing outer-loader recovery is confirmed. The reason the observed first route fails to reveal its content is **not confirmed**. Hypotheses: lazy-import settlement/reveal scheduling at first navigation; Metro module loading/evaluation; or a navigation/Suspense interaction. Do not report gallery assets, ARCore or measurement as the established cause of the observed pre-selector hang.

**Logs:** the app PID's Android log contained Reanimated `RetryableMountingLayerException` warnings (“Unable to find SurfaceMountingManager” for retired surface tags). These were not correlated to a precise route-entry timestamp and do not establish causation. No relevant Viro startup error was captured for the pre-selector hang. UIAutomator sometimes could not obtain an idle snapshot; stale XML was excluded from evidence. Read-only inspector evaluation did not provide usable internal loader state.

**Recommendation:** first add development-only stage/attempt/duration diagnostics after approval and repeat first-route/reopen tests. If the import resolves but Suspense does not reveal, replace this outer gate with a small explicit load-state component behind the existing guards. If import itself stalls, identify that boundary before choosing the load mechanism. In either case, give outer module and gallery loading owned deadlines, localized failure, explicit Retry and Back; fence late completions and principal/unmount changes. Reuse the existing 20-second startup budget as an initial recovery-policy value, measured separately before Start; do not call that value a root-cause fix or add automatic retries.

### Issue 2: partially collapsed panel

**Physical reproduction status:** the exact stuck state was **not** reproduced in the brief device trial. Lake Danao's overview opened; its photograph and text page rendered; three rapid Close taps returned it to the original cover with its Opened indicator. This is one successful cycle, not a reliability claim or a test of physical rapid fingers.

**Confirmed controlled reproduction:**

1. Mount the real `DestinationRingScene`, supply normal tracking and fresh pose.
2. Open History and deliver its opening completion.
3. Request Close: controller becomes `closing`, with a new token and translation-following origin.
4. Either report LIMITED tracking, or set scene interaction false as Help does.
5. Deliver the native closing-completion callback at that boundary.
6. Restore normal tracking/interactivity and supply fresh pose, without synthesizing a second animation completion.
7. The focused-panel node remains; the original tile is not restored. Both recovery assertions fail.

**Confirmed mechanism:** `DestinationRingScene.complete()` discards completion when `interactiveRef` is false or tracking is not normal. No pending completion is retained. The controller can therefore remain `closing` after a completed native animation. Its own `close()` accepts only `focused`, so repeated Close cannot repair that logical state. Recenter replaces the transition token and produces a focused transform, explaining why it can recover a usable layout.

**Related code risks, not yet physically proven causes:**

- `InformationPanel` renders `animation.run=false` but starts/pauses via `setNativeProps`. Competing declarative and imperative ownership must be tested through unrelated rerenders.
- Viro 3.0.3 forwards animation finish to the component's current callback without an animation ID in the event. Existing token-keyed node replacement is important; preserve generation/token fencing.
- Animations use shared registered names. Verify registration-before-run and stale/native interruption behavior before changing naming policy.
- Logical progress currently saves `selectedId` during closing. A new native frame can restore an accepted Close as an open panel. Define closing intent explicitly during session restoration.

The installed Viro Java bridge was inspected from the packaged AAR: `run=false` pauses; completion emits an event and terminates the managed animation. These agree with the [Viro animation documentation](https://viro-community.readme.io/docs/animation). A suppressed callback must not be assumed to arrive again. Whether a subsequent resume replays the native animation is separate device evidence still needed.

**Recommendation:** retain valid completion for the current transition even when interaction is temporarily fenced, then settle it when the same native frame is safe to reconcile. Keep new interactions blocked during transitions. Use one authoritative native animation/transform owner, explicit canonical end transforms, and token plus native-frame retirement checks. Preserve the captured frame through temporary tracking loss. Define Close intent so background restoration does not resurrect an accepted closing panel; an already-focused panel still restores focused with its cursor. Never recenter implicitly on Close.

### Reader/layout findings

- Corner brackets are baked into `assets/ar/holographic-frame.svg/.png`, generated by `scripts/generate-ar-holographic-art.py`. `decorations={false}` already removes an optional rule but cannot remove these brackets. Editing the shared texture would also change idle tiles, so introduce a separate expanded-reader surface.
- The 1.25 × 1.25 reader contains two control rows. Its prose box is only **0.50 units** high; the current image box is approximately **1.08 × 0.405**. `ScaleToFit` preserves subjects but leaves many photographs visually small.
- Current photo assets include landscape ratios approximately 1.33–1.83 and a **1200 × 1600 portrait** image. Portrait and landscape testing can use existing material without acquiring anything.
- `ArUtilityChrome` already owns bounded safe-area top/bottom overlays; `ArPhotoControls` already owns capture lifecycle. Extend these rather than replacing them.
- `useReadingSize` already owns persistence and recovery. `galleryCursor`/`cursorAtPage` already preserve text offsets, media IDs and metadata offsets. The moved controls must use this same path.

## Proposed layout and alternatives

**Recommended approach:** preserve panel footprint and distance, reclaim internal control space, attach one native reader row below the content, and extend the existing screen toolbar. This minimizes spatial and animation changes while making content materially larger.

Alternative considered: enlarge the whole focused panel. It creates more content room but increases edge clipping and short-screen/toolbar collision risk at the accepted distance. Defer unless the reclaimed-space design fails native readability testing. A screen-fixed reader action overlay was also considered; it conflicts with the requested spatial relationship and is not recommended.

```text
Screen overlay: Exit · destination title · Help
Camera and unchanged 360° native chapter ring

       Focused holographic content canvas — 2.25 units
       chapter context / compact title
       spacious flowing text OR dominant contained photograph
       associated caption / concise credit on photo pages

       Native reader row, same selected spatial frame
       Previous · page / total · Next · Close

Screen overlay, Android bottom inset
Recenter · Capture Photo | A− · A+ while reader is focused
```

The diagram is a proposal, not a native screenshot or functional proof.

**Initial geometry targets for device tuning:** retain the 1.25-unit square canvas and 1.08-unit reading width. Increase text height from 0.50 toward **0.80 units**, and photo height from about 0.405 toward **0.75–0.80**, reserving an explicit caption/credit region. Keep all content inset from the rim. Place the native reader row approximately **0.04 units beneath the canvas**, with action heights at least the existing **0.18 units**, growing if projected targets are too small. Final row widths must fit translated labels; never shrink controls to force a one-row appearance. These are proposals, not accepted physical dimensions.

Keep photo `ScaleToFit` and natural aspect ratio, with quiet matte space where needed. Use metadata pagination when captions/credits do not fit, preserving media identity and offsets. Any metadata-only continuation must retain clear association with the photograph. No autoplay, new media, artificial crop or dramatic effects.

The native row belongs under the same transition/frame owner as the panel, and is shown only in settled focus. It retires immediately for closing and cannot leave an independently animated or clickable surface behind. Previous/Next disabled surfaces explicitly ignore hits; labels remain decorative; the visible quad remains the sole completed-click owner.

The screen toolbar uses the existing bottom safe-area owner and bounded hit region. Text-size controls appear in focused reading and are disabled at their limits or during transition. Recenter retains existing recovery availability. Capture retains the exact live/focused/foreground native capture owner and save/share lifecycle. Reading failures and Retry remain visible in this toolbar without hiding capture errors.

**Risks:** world-space sizes do not imply dp touch sizes; project targets on the A53 and verify physically. The lower spatial row may collide with screen chrome on short/aspect-changed views or when the user tilts/moves. Measure chrome occupation independently from full-screen camera bounds, use a shared content/row layout budget, and test the fit before committing final geometry. Do not follow the user's gaze or automatically recenter to keep controls visible. If constraints cannot coexist on the shortest supported view, stop for a concrete layout decision rather than silently clipping or shrinking controls.

## Review focus

- A settled native completion arriving during Help/tracking loss must survive the interaction fence without accepting new input.
- A loader resolving after Retry, blur or principal replacement must not mount stale content or start native/GPS work.
- Recenter during closing must retire old callbacks and preserve the existing explicit focused recovery behavior.
- Large CJK captions and the existing portrait photo must retain subjects, attribution access and cursor identity through reflow/restoration.
- Short viewports and large Android text must leave screen controls reachable and native hit regions unobstructed without resizing the camera.

## Ordered implementation tasks — approved November 12, 2026

### 1. Diagnose and repair first-route loading

**Files:** `dev-entry.tsx`, `development-gallery-loader.ts`, `destination-ar-session-screen.tsx`, their tests; introduce `development-session-loader.ts` and its test only if explicit route loading is warranted. All paths are under `src/features/destination-ar/` unless stated otherwise.

- [ ] Add guarded stage/attempt/elapsed diagnostics for route import, gallery content, intro history, native import, measurement, transition readiness, support/permission, tracking and establishment. Do not log coordinates, principals, credentials or raw native errors.
- [ ] Repeat first-route and reopening with existing APK/Metro; capture actual import settlement and screen reveal. Distinguish cold process, cold route, warm route and Metro disconnect.
- [ ] Move the two external pending-load probes into focused repository regressions. Cover actual locale copy, rejection, never-settled promise, Retry, late success/failure, unmount and principal change.
- [ ] Implement the smallest evidence-supported loading fix and explicit bounded recovery. No repeated automatic import/permission retries; native mount still requires fresh final authorization.
- [ ] Run `npm test -- src/features/destination-ar/destination-ar-session-screen.test.tsx src/features/destination-ar/development-gallery-loader.test.ts src/features/destination-ar/use-viro-startup.test.tsx src/features/destination-ar/use-ar-session.test.tsx` plus any new loader test. Record red and green results.
- [ ] Verify five exit/reopen cycles and a fresh process if the phone permits; report each stage and failures. Commit separately with a Conventional Commit subject.

**Acceptance:** selector/preflight opens without requiring a reopen, or a bounded localized error exposes working Retry/Back. A late retired operation cannot create a camera or real admission. Existing native-start deadline tests still pass.

### 2. Repair focus/close completion ownership

**Files:** `ring-controller.ts`, `information-panel.tsx`, `destination-ring-scene.tsx`, corresponding controller/scene/gallery tests, and session tests if restoration intent changes.

- [ ] Add the two controlled failing completion-boundary tests to the real scene suite. Add retained/stale completion, unrelated rerender, repeated Close, recenter and unmount cases.
- [ ] Track valid completion under the current token/frame independently from interactive permission. Reconcile safely after a fence is lifted; stale tokens/frames never settle a replacement transition.
- [ ] Remove competing animation/transform writes within the existing component boundary; register before run and apply canonical final transforms exactly once. Preserve the translation-following closing origin handoff.
- [ ] Encode accepted Close in logical restoration so a new frame restores collapsed, while ordinary focused restoration retains chapter/cursor. Keep Opened-count semantics unchanged.
- [ ] Test opening/closing, tracking loss during closing, Help, background/new-frame restoration, recenter while focused/opening/closing, reduced motion and 1/3/4/12 chapters. Include actual focus/navigation hooks in screen regressions where they govern remounts.
- [ ] Run controller, ring scene, gallery panel, session hook and session-screen tests. Record red/green and device trials. Commit separately from visual work.

**Acceptance:** no accepted Close leaves a transition-owned panel indefinitely; original tile geometry returns without automatic Recenter. Recovery preserves the valid frame, current cursor and explicit recenter behavior.

### 3. Add quiet Recenter recovery guidance

**Files:** `src/i18n/locales/{en,ja,ko}.json`, session-screen Help tests.

- [ ] Add one short sentence to existing Help: “If the AR panels appear misplaced or stop responding correctly, try Recenter to restore their positioning.” Supply natural JA/KO equivalents.
- [ ] Confirm actual locale resources and language switching through the Help UI; no persistent banner or new tutorial.

**Acceptance:** guidance is reachable in all three languages and Help still fences native input without remounting the camera.

### 4. Simplify only the expanded frame

**Files:** `holographic-frame.tsx`, `holographic-assets.ts`, `information-panel.tsx`, `scripts/generate-ar-holographic-art.py`, new authored expanded surface under `assets/ar/`, frame/scene tests.

- [ ] Generate a separate matte reader surface with the existing colors/transparency and restrained outer rim, omitting inner brackets. Keep existing cover texture bytes unchanged.
- [ ] Bind the expanded surface only to the reader; preserve background-before-text rendering order and pass-through event handling.
- [ ] Verify generated opacity and changed binding; inspect bright/dim native appearance. No redundant behavioral test for artwork details.

**Acceptance:** no inner bracket crosses reading content, and unexpanded cover appearance/hit surfaces are unchanged.

### 5. Extend the bottom screen toolbar

**Files:** `ar-utility-chrome.tsx`, `destination-ar-session-screen.tsx`, `destination-ring-scene.tsx`, `information-panel.tsx`, existing `ArPhotoControls` only if a small presentation prop is required, locale files and relevant tests.

- [ ] Extend existing `RingControls` with a settled-reader availability signal and `changeReadingSize(delta: -1 | 1)` command. Publish committed focus/transition changes, never per-frame pose.
- [ ] Route that command to the existing panel size-change/cursor-reflow path and the single parent `useReadingSize` owner. Retire the command on unmount, Help, closing and frame replacement.
- [ ] Present Recenter/Capture together with contextual A−/A+ using existing buttons/icons, >=48 dp screen targets, localized accessibility/disabled states, consistent spacing and bottom inset once.
- [ ] Keep preference failure/Retry and capture failures accessible; do not couple the reading preference to native capture ownership or duplicate persistence.
- [ ] Test toolbar visibility, limits, retained commands, caption/text cursor reflow, preference recovery and capture ownership. Test 320/360-width short views and Android text growth.

**Acceptance:** one reading-size state; current text offset/media metadata position survives size changes; screen chrome has only visible hit bounds and capture/recenter behavior is preserved.

### 6. Add the floating native reader row and reclaim text space

**Files:** `information-panel.tsx`, `information-tile.tsx` (reuse `NativePanelAction`), new small `reader-layout.ts`/test if shared measurements require it, `content-layout.ts`, gallery and scene tests.

- [ ] Extract shared content/row rectangles so text height, line budget, photo metadata and action positions agree. Preserve glyph width rules, protective CJK/grapheme breaks and source offsets.
- [ ] Move Previous, page indicator, Next and Close beneath the canvas under the same focus/frame owner. No independent screen-fixed reader overlay or extra native animation owner.
- [ ] Remove A−/A+ from native content and grow prose allowance toward the measured 0.80-unit target; recompute pagination conservatively rather than merely enlarging the displayed text box.
- [ ] Preserve accurate quad hits, decorative pass-through, disabled hit exclusion, transition fencing and a sufficiently large Close. Fit translated labels without reducing action sizes below the accepted physical target.
- [ ] Test content/control nonintersection, row retirement, size/locale reflow, stale clicks, rotated geometry and interruption/recenter ownership. Verify native overlap/touch physically.

**Acceptance:** content and row never overlap in tested layouts; controls stay spatially attached and disappear coherently during collapse. No stranded or invisible hit geometry.

### 7. Make current photographs visually primary

**Files:** `information-panel.tsx`, `information-gallery.ts`, shared reader layout, gallery/content tests. Media inventories and source content remain unchanged.

- [ ] Expand the photo region toward 0.75–0.80 units high, with restrained framing and a separate concise caption/credit area. Retain aspect-fit and existing image load/error/Retry ownership.
- [ ] Derive metadata page budgets from available space and supported font sizes. Preserve every caption/credit, media ID, source reference and cursor offset through pagination and session restoration.
- [ ] Exercise existing landscape photos and the existing 1200×1600 D05 portrait. Do not crop/research/replace any photograph.
- [ ] Test null Android load completion, explicit false/error, retired callbacks, Retry, loading, long CJK metadata, text-only chapters and repeated page/size/locale changes.

**Acceptance:** photographs receive materially more visible area than the baseline, retain their complete subjects/aspect ratio, and all captions/credits remain associated and reachable.

### 8. Complete automated verification

- [ ] Run focused regressions after each behavioral fix, then **`npm run check`** after each coherent completed change and at the final implementation state. Record actual counts and failures.
- [ ] Run **`EXPO_PUBLIC_VIRO_SPIKE=1 npm run export:android -- --max-workers 1`** for final JS/asset compatibility and **`git diff --check`** before commits. Export is not an APK.
- [ ] Run native configuration/SDK checks from AGENTS only if that scope actually changes; no such change is presently planned. Do not add Edge checks for untouched backend work.

### 9. Complete physical Android verification

- [ ] On charged A53/Android 16, record installed APK revision, JS commit, device configuration, locale and test conditions. Use the existing APK/Metro unless native compatibility demonstrably requires a build.
- [ ] Cover first route, repeated reopen, normal/rapid close, transition interruption, recenter, brief background/foreground, established focus restoration and tracking loss/recovery.
- [ ] Check text/photo pages, all reader sizes, captions/credits, actual JA/KO glyphs, landscape/portrait media, bright/dim backgrounds and native/screen toolbar clearance/hit delivery.
- [ ] Check one ordinary Capture preview/discard without save/share side effects and confirm camera focus/refocus behavior. Request physical finger tests for short taps; ADB callbacks do not prove finger reliability.
- [ ] Repeat ACLC real-arrival only if the owner is physically there with fresh real GPS. Otherwise explicitly mark untested; do not simulate and call it GPS evidence.
- [ ] Capture comparable text/photo/toolbar/close/loading/recovery screenshots or short recordings. Keep private camera/account/location captures out of Git and exclude incidental people; agree on a neutral camera setup for retained evidence.

### 10. Presentation-readiness report and one PR

**Files:** `docs/validation.md`, `docs/ar-destination-stories.md`, existing Android preview guide, and this plan's checklist.

- [ ] Record exact commands/counts, red/green regressions, physical scenarios, visual evidence and skipped cells. Remove temporary diagnostics or retain only an explicitly guarded, sanitized useful trace.
- [ ] Reconcile obsolete AR guidance in the active UI skill/design authority where the approved toolbar and existing 2.25-unit/tap decisions supersede it.
- [ ] Review the combined branch diff for scope, admission/provenance and content preservation. Keep all work in this branch and prepare one PR when the implementation is approved and ready; no automatic merge.

## Acceptance matrix

| Area | Automated evidence required | Physical evidence required |
| --- | --- | --- |
| First opening | Pending/rejected/late loader, deadline, Retry, guard/owner fencing; SDK focus/navigation readiness | First-route and repeated reopen, fresh process, useful recovery |
| Close stability | Boundary completions, stale tokens, recenter, rerenders, tracking, Help, new-frame restoration | Normal/rapid finger close, interrupted transitions, original tile restored |
| Help | Real EN/JA/KO copy and interaction fencing | Readable guidance without camera remount |
| Expanded frame | Separate binding, tile texture unchanged, pass-through geometry | Clear corners, contrast and alpha ordering |
| Screen toolbar | One size owner, focus availability, cursor/persistence/errors, capture leases | Safe-area fit, >=48 dp screen targets, TalkBack labels, no native hit obstruction |
| Spatial row | Shared bounds, enabled/disabled hits, retirement and transition ownership | Reachability at 2.25 units, rotated hits, short-screen/chrome clearance |
| Photos | Aspect-fit props, media/caption identity, full metadata, load/error/Retry/CJK tests | Large landscape/portrait presentation, glyph fit, captions/credits |
| Admission/session | Existing GPS/provenance/expiry/Passport regression suite | ACLC only when actually on site; simulated previews clearly labeled |
| Delivery | Final full check, Android export, clean scoped diff | Rehearsal on intended device/setup; APK separately approved if needed |

## Decisions, risks and recommendation

The implementation plan and layout approach were approved on November 12. No new library, build, destination content or GPS wiring decision is requested. Initial geometry values remain subject to physical fit testing; material deviations will be brought back with evidence.

The first-entry trace localized a successful import followed by a stalled fallback reveal; the precise upstream renderer trigger remains unresolved. An explicit loading owner passed the recorded cold/warm device trials. No native animation change should be shipped solely because a mocked event sequence fails; validate the fix on the installed renderer. Camera/toolbar hit routing, typography and aspect-ratio comfort remain physical acceptance gates.

For the defense, prioritize loading recovery and deterministic Close first, then the separate clean reader frame, existing-toolbar extension, spatial row and larger contained photos. These can be attempted within the current native capabilities. Defer video, content replacement, new entrance calibration, all-nine GPS admission wiring and any broad architecture/dependency upgrade. If time becomes limited, keep verified stability fixes and only the visual changes that pass the actual device matrix; do not label the entire experience presentation-ready based on tests/export alone.

**Original approval gate:** implementation waited for owner review. The owner approved all ten tasks on November 12; implementation and remaining verification are recorded above and in `docs/ar-reader-refinement-implementation.md`. Separate APK approval still applies.
