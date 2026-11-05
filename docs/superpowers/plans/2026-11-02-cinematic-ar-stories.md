# Cinematic AR Stories — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use `superpowers:subagent-driven-development` (recommended) or `superpowers:executing-plans` to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Deliver a brief cinematic deployment of ARgala's existing 360° Viro chapter ring, followed by authentic, media-rich destination stories and localized, optional robotic system audio. Do not regress native AR tracking, location admission, existing navigation, four separate bug fixes or the previously approved eight-screen theme design.

**Architecture:** Extend the established `RingController`, `scene-geometry`, `ArSession`, Viro nodes, catalog, `InformationPanel` image gallery and Settings preferences. Pure, testable intro policy and geometry lead. Native video is a feasibility-gated optional content format; do not promise it works until demonstrated on Android.

**Tech Stack:** Expo ~57, React Native 0.86, Expo Router, TypeScript, `@reactvision/react-viro` 3.0.3, UniWind / HeroUI Native, Vitest, Android/ADB. Verify installed versions and scripts in the current repository before executing.

**Spec:** [approved design](../../design/cinematic-ar/DESIGN-SPEC.md). **References:** `references/approved/08-ar-camera-concept.png`, `references/brand/ARgala-Arch-Mint.svg`, `references/client/featured-destination-research-form.md`. Mockup is aesthetic direction, **not** functioning native scene evidence.

**Intended repository destination:** `docs/superpowers/plans/2026-11-02-cinematic-ar-stories.md`, only once work is authorized.

## Execution status — 2026-11-02

Owner assigned implementation in this session after PR43/44 merged. The historical
planning-only footer below is superseded by that assignment. Current evidence:
[implementation](../../design/cinematic-ar/IMPLEMENTATION.md).

| Tasks | Status |
| --- | --- |
| 1–3: readiness, replay policy, geometry | Implemented with targeted regression coverage |
| 4–5: native entrance, focus dimming | Implemented; native ring/hold smoke passed, full physical timing/sweep matrix pending |
| 6: media renderer | Galleries/visual stories implemented; actual client media and editorial review pending |
| 7: video | STOP: Viro Android seek/restart raises null UIManager error; isolated fixture removed |
| 8–9: audio | Saved toggles/event adapter implemented, both defaults ON by owner choice; recordings/rights/language review pending |
| 10: acceptance | Automated checks and limited device smoke; full acceptance not claimed |

## Global constraints

- [ ] **Wait** for separate agent's bug-fix handoff on `mjfelecio/ARgala` issues #39–#42. Verify what landed and where; do not assume the issues closed or overwrite their changes.
- [ ] Read current repository `AGENTS.md`, task-relevant skills and project scripts; inspect branch status and preserve existing edits. Implement in an isolated task worktree/branch under repository conventions.
- [ ] Capture baseline Android/ADB video and tests, current commit SHA, device/OS, native build and AR permission/location admission states. Obtain approval before adding material native dependencies, new providers, costs or content sources.
- [ ] Keep Overview 0°, History +90°, and all chapter final positions from the **existing** `buildRingSlots`. Preserve native Viro and existing hold-to-focus, cursor, font-size, recovery and accessibility behavior. No bottom sheets, fake world anchors, permanently animated particles or directional hints.
- [ ] Work test-first, commit coherent independent steps, and prepare reviewable PRs only. No merge, deploy or unrelated issue closure without owner authorization.

## Task 1 — Truthful AR-story readiness and provenance

**Likely paths:** `src/features/destinations/catalog.ts`, new `ar-content-readiness.ts`, tests; existing selected-destination UI if warranted.

- [ ] Write failing tests: one cover photo plus prose is **not** approved as a rich story; a visual sequence made from multiple relevant approved media is eligible; a text-led supporting visitor-info section is acceptable; missing rights/approval or missing reviewed translation remains pending.
- [ ] Add a documented **human editorial approval** signal (rather than a guessed magic image count) and verifiable metadata for approved section-relevant story media. Explicitly distinguish map/directions discoverability from readiness for full AR storytelling. Keep actual GPS/camera/admission boundaries unchanged.
- [ ] Preserve strict original image metadata (credit, rights, alt, caption, approval, translation) and separate `pilot-aclc` from D01–D09. Do not invent photos, sources, or historical facts.
- [ ] Run catalog/content tests, `npm run test:destination-content` when available; commit.

**Done:** A reviewer can establish why each destination's AR story is approved/pending; map/directions are not blocked by editorial work.

## Task 2 — Replay-safe first-visit intro policy

**Likely paths:** `src/features/destination-ar/use-ar-introduction.ts`, `destination-ar-session-screen.tsx`, `session.ts`, `use-ar-session.ts`, a pure `intro-policy.ts` and tests.

- [ ] Characterize existing global AsyncStorage `argala.ar-introduction.v1`. Write failing policy tests for first A, repeat A, first B, recover tracking, background/resume, Skip, reduced motion, and failure before native tracking is ready.
- [ ] Specify per-destination first-visit persistence scope, storage version, and precise moment an intro is marked seen. No full replay after tracking recovery or foreground. Preserve selected chapter, opening/cursor and revealed count.
- [ ] Reconcile with existing session phases `idle/preflight/initializing/reveal/exploring/limited/suspended/interrupted`. Represent first/repeat/recover/reduced/skip as explicit pure decisions; no duplicate controller.
- [ ] Run session, intro, settings persistence tests; commit.

**Done:** First admitted native AR entrance plays once per destination, repeat uses short variant, recovery does not reset the story.

## Task 3 — Pure geometry and cinematic choreography

**Likely paths:** existing `scene-geometry.ts`, new `intro-deployment.ts` and tests, `ring-controller.ts` only if required.

- [ ] Test N=1, common N, maximum 12, varied initial yaw, Overview ahead and History right. Test each chapter's **final transform exactly equals** the current `buildRingSlots` transform, including hit target and orientation.
- [ ] Compute short purposeful outward spiral trajectories: recognizable covers emerge near a compact **existing approved ARgala emblem**, arc into their assigned angular sectors, then settle at the unchanged ring radius. Never settle to new arbitrary coordinates.
- [ ] Data-drive timeline: full intro target 2–3 s; repeat 0.5–0.8 s; reduced motion direct fade/settle; Skip and interrupted timeline fast-forward safely. Add tests for no NaN and stable endpoints.
- [ ] Commit the pure, unit-tested motion math before touching native rendering.

**Done:** Motion can be verified without AR hardware and resolves to the existing ring's exact canonical final positions.

## Task 4 — Native Viro entrance and cancellation

**Likely paths:** `destination-ring-scene.tsx`, `destination-ar-session-screen.tsx`, `information-tile.tsx`, `native-styles.ts`, tests.

- [ ] Write tests that intro cannot claim success before actual Viro tracking/admission; Skip, reduced motion, background and lost-tracking all yield the correct stable interactive state.
- [ ] Reuse actual approved brand geometry and existing ViroNodes/animations. Integrate with `RingController` and the real session `reveal` phase; never substitute a flat 2D onboarding screen.
- [ ] Keep animated nodes low-count, no perpetual orbit, and settle to normal **hold interaction** immediately. Guard against an animation callback never firing and ensure no stale nodes block taps/hold.
- [ ] ADB smoke first/return/skip/tracking loss, measure timings; commit.

**Done:** Real Viro camera displays the intentional entrance and reliably becomes normal spatial navigation.

## Task 5 — Focus, dimming and legible functional frames

**Likely paths:** `destination-ring-scene.tsx`, `information-tile.tsx`, `information-panel.tsx`, `native-styles.ts`, focus tests.

- [ ] Test other chapters remain visible and hold-interactive while focused; camera feed **never dims**. Current code uses roughly `selection ? 0.25 : 1`; tune to approximately 35–45% prominence against actual backgrounds, not a blindly fixed alpha.
- [ ] Refine minimal seafoam edge emphasis, readable titles/content cues and focus/close transitions; conform to approved 08 AR concept and previously approved forest/seafoam tokens.
- [ ] No extra arrows, passive spinning, visual filigree, fake HUD statistics, neon clutter or React Native bottom sheets.
- [ ] Run ring/focus tests and physical bright/dim ADB comparison; commit.

**Done:** A selected exhibit feels primary while the surroundings retain their spatial context and interactivity.

## Task 6 — Media-rich first-class storytelling

**Likely paths:** `src/features/destination-ar/information-gallery.ts`, `information-panel.tsx`, `chapter-presentation.ts`, `content-layout.ts`, `catalog.ts`, tests.

- [ ] Characterize existing `GalleryPage` text/image union, `BundledGalleryPage` and `galleryCursor`. Add tests for preserved page position across language/font-size, tracking and background transitions.
- [ ] Add visual-first photo hero, manually controlled image gallery, approved image/caption interleaved visual story, and factual timeline **only when actual sourced content supports it**. Visitor-info prose remains acceptable as supporting utility.
- [ ] Show real captions, credits and alt text tied to the same asset; handle missing/failed images honestly. Keep adjustable text readable and transitions *inside* the stationary native 3D frame.
- [ ] Measure image memory/preload/error handling on Android; no autoplay slides, fabricated image, automatic source scraping or historical reconstruction.
- [ ] Run gallery/content tests; commit.

**Done:** Actual approved photo-led stories are the dominant AR chapter experience; progress and accessibility survive session transitions.

## Task 7 — Video feasibility stop gate, then player

**Likely paths only if feasible:** `catalog.ts`, `information-gallery.ts`, `information-panel.tsx`, new video component and tests.

- [ ] First examine installed Viro 3.0.3 native video capabilities. Perform a **small isolated Android test** with a permissioned bundled fixture while AR camera/tracking is active: explicit play/pause, audio, seeking, background/foreground, tracking loss, poster, caption and memory/performance.
- [ ] **STOP for owner decision** if embedded native playback is unsupported/unreliable; present evidence and smallest compatible alternate architecture, including dependency/build consequences. Do not pretend video works or quietly add a native media stack.
- [ ] If feasible/approved, add optional backward-compatible video metadata (filename, chapter association, poster, source, credit, offline rights/approval, captions/languages, duration). Keep existing image schema valid and the client's video submission optional.
- [ ] Test no autoplay, explicit Play/Pause, pause on chapter exit/background/lost tracking, mute behavior, readable errors and available subtitles/transcript. Manually validate on device; commit.

**Done:** Real controlled video works in native AR, or this task is transparently blocked while approved photo stories remain shippable.

## Task 8 — Localized audio preferences and reviewed clips

**Likely paths:** `src/features/settings/preferences.ts`, `provider.tsx`, `settings-form.tsx`, `use-settings-draft.ts`, translation resources, tests.

- [ ] Test migration of strict `argala.preferences.v1` records containing only `activationRadiusMeters` and `language`; preserve old choices after adding two new fields.
- [ ] Add independently persisted **System Voice** and **Sound Effects** toggles within current Save/Undo settings pattern; defaults follow owner-reviewed device conventions. Respect OS volume and access needs.
- [ ] Produce a tiny EN/JA/KO announcement-script inventory plus licensed/created bundled recordings **on the developer side**; record source, rights, reviewer and pronunciation. Obtain owner/language review; never assume translations are correct.
- [ ] Missing unapproved voice falls back to accurate localized on-screen status **without** unauthorized English audio or invented translation. Run migration/settings/locale tests; commit.

**Done:** Settings survive force-close, controls are independent, spoken content is reviewed and sound is never required to understand state.

## Task 9 — Event-driven robotic system cues, not narration

**Likely paths:** `destination-ar-session-screen.tsx`, new `use-ar-system-audio.ts`, tests, approved bundled assets.

- [ ] Test exactly one brief “AR initialized” equivalent on eligible first entry, no speech on repeat/recovery/page navigation, no overlapping cues, and all four combinations of independent toggles.
- [ ] Trigger sounds from **session events**, not React renders/camera frames. One quiet deploy/lock sound, a restrained focus acknowledgment and optional soft tracking state sounds; no per-panel chime storm or ambient music.
- [ ] Respect device volume/audio focus and interruptions. On-screen state stays visible/localized. No chapter narration, destination reading or cloud TTS side effects.
- [ ] Test EN/JA/KO asset routing, muted app and background/resume in ADB; commit.

**Done:** Audio offers personality without chatter, distraction, unexpected playback or an Internet requirement.

## Task 10 — Android acceptance and PR handoff

- [ ] Run focused tests, `npm run check`, `npm run test:destination-content`, `npm run check:native-patches`, `npm run check:android` where scripts apply. Report actual commands and outcomes; no “passed” claim for an unrun device check.
- [ ] Record ADB evidence: first A/return A/first B; Skip/reduced motion; hold/switch/dim; recovery and background; photo gallery and explicit video; both audio toggles and EN/JA/KO; empty/unlicensed media fallback.
- [ ] Verify sunlight/dark readability, larger text, orientation, midrange hardware thermal/frame performance, tracking state, real-device permission/location gating and story persistence. Remove expensive effects before reducing readability.
- [ ] Check `pilot-aclc` fixture separation from D01–D09, review #39–#42 behavior and preserve the unrelated approved Seafoam Forest eight-screen redesign.
- [ ] Document provenance, unverified media, licensing status, blocked device cases and performance tradeoffs. Prepare scoped PR(s) with coherent commits, review notes and actual ADB recordings. **No merge/deploy until owner approves.**

**Done:** Evidence shows the real app—not a concept mockup—meets acceptance conditions, with honest limitations called out.

## Review focus: five failure modes

| Failure mode | Gate / regression test | Tasks |
| --- | --- | --- |
| Flashy intro lands panels in wrong places | Exact final transform parity with `buildRingSlots`; ADB tracking | 3–4 |
| Intro repeats and resets the reading cursor | Per-destination first/repeat/recovery/background tests | 2, 4, 6 |
| “Media rich” becomes one cover plus paragraphs | Editorial approval and one-cover-negative fixture | 1, 6 |
| Video breaks ARCore or autoplays | Android feasibility **stop gate**, manual play lifecycle tests | 7 |
| Voice repeats, language is unreviewed, or old preferences are lost | Legacy schema migration, approved EN/JA/KO audio manifest, toggle tests | 8–9 |

## Suggested reviewable PR sequence

1. Policy/content/geometry foundation (Tasks 1–3).
2. Native entrance and panel refinement (Tasks 4–5).
3. Image-led story components (Task 6).
4. Video only after feasibility passes or owner approves alternate solution (Task 7).
5. Audio settings/localization and event cues (Tasks 8–9).
6. Full Android acceptance evidence and final integration review (Task 10).

This is an **implementation handoff, not authorization to code today**. After the other bug-fix agent finishes and the owner explicitly assigns implementation, recheck current source and branch instructions, then implement/test in isolation. Escalate conflicts with real source evidence instead of silently changing approved product decisions.
