# ARgala — Cinematic AR Experience and Rich Visual Stories

**Owner-approved design — November 2, 2026 (Asia/Manila)**  
**Decision owner:** ARgala developer/client liaison  
**Target:** Existing Android Expo + React Native + native Viro/ARCore implementation  
**Status:** Direction and outstanding media/audio decisions approved in conversation. Implementation planning permitted; no app code changes or deployment authorized by this document.

> Execution note: the owner assigned implementation on2026-11-02 after PR43/44
> merged. Historical planning-only authorization language below is retained as
> provenance. See IMPLEMENTATION.md and VIDEO-FEASIBILITY.md for current scope,
> the native stop gate and remaining content/audio review.

## 1. Intent

AR is ARgala's distinguishing experience, not a novelty tab or a collection of paragraphs in front of a camera. Visitors should feel that they have activated a credible futuristic interface, and then discover **authentic, media-rich stories about the real destination** through interactive exhibits. The entrance can be cinematic; ongoing navigation and reading must remain calm, legible, comfortable and useful.

The established AR workflow remains intact: curated featured destinations only; preview permitted before arrival; native AR camera admitted only when the chosen destination's real proximity/approval/location checks succeed. The AR experience consists of native Viro square chapter panels positioned around the user's initial heading in a 360-degree ring. Overview is ahead; History is to the right. Panels are spatially stable and move with camera translation as already designed. The current hold-to-focus and collapse-on-other-panel behavior, chapter page navigation, adjustable holographic text and recovery guards remain contractual.

This is **a separate AR enhancement**, not an implicit amendment to the previously approved eight-screen Seafoam Forest UI implementation package. The owner is waiting for a separate agent to finish issues #39–#42 before beginning theme implementation. No app modifications or GitHub tickets are authorized by this design document alone.

## 2. Approaches considered and selected

| Approach | Strength | Tradeoff | Decision |
| --- | --- | --- | --- |
| A — Precision/JARVIS-style technical HUD | Distinct startup, strong orientation and system character | Can become unreadable, noisy movie-interface ornamentation | Use **only** for restrained initialization, system states and navigation framing |
| B — Living Museum | Strong emotional and educational destination storytelling | Decorative filigree, particles and vague magic can undermine credibility | Use **only** for media presentation and chapter transitions, not constant flourishes |
| **Hybrid — Functional Futurism** | Clear technical entry, calm spatial navigation, rich authentic exhibits | Requires consistent motion/audio rules and careful state handling | **Approved** |

**Human-designed references:** [GMUNK's *Oblivion* interface work](https://gmunk.com/OBLIVION-GFX/Everything) for cohesive functional minimalism; [Territory Studio's *The Martian*](https://territorystudio.com/project/the-martian/) for research-grounded fictional interface logic; [Material Design's motion principles](https://m2.material.io/design/motion/understanding-motion/) for informative/focused/expressive motion; [Apple's spatial layout guidance](https://developer.apple.com/design/human-interface-guidelines/spatial-layout/) for spatial comfort. These are principles to study, not artwork to copy or license to ship.

### Design philosophy

**90% quiet, legible, practical interface; 10% deliberate cinematic emphasis.** Every visual or sound effect must correspond to a real event: tracking ready, a chapter reaching its assigned position, a panel receiving focus, content advancing, or tracking being lost/restored. Never add random telemetry, invented coordinates, busy scan lines, free-floating UI filigree, permanent particles, decorative ground targets, artificial scenery or neon overload.

## 3. Full first-visit initialization

**Trigger:** The *first successful AR visit to a particular approved destination* once camera permission, selected destination admission and native Viro tracking are genuinely ready. Never present successful initialization as a substitute for these checks.

**Target duration:** approximately **2–3 seconds after tracking readiness**, adjusted from physical device testing to prioritize smoothness. A visible Skip affordance and reduced-motion alternative must exist; state transitions may finish immediately if the app resumes late or tracking changes.

1. **Readiness:** Real camera is unobstructed. A compact ARgala system indicator acknowledges tracking; no fake floor scanner or imaginary world anchor is implied.
2. **Emblem formation:** The *existing approved ARgala logo/emblem* manifests as a small, restrained holographic form ahead of the user. Do not redraw its brand geometry as a new logo. A brief, localized robotic system line announces initialization.
3. **Unfold:** The emblem separates into recognizable chapter covers or compact panel forms. These move in a coordinated, expanding **spiral** along short, purposeful paths; the user sees that panels are moving beyond the phone's current field of view.
4. **Settle:** Each chapter arrives at its real assigned 360-degree heading. Overview settles directly ahead; History to the right. The transition ends with one restrained seafoam edge acknowledgment and low-volume deployment/lock sound, not a barrage of per-tile chimes.
5. **Exploration:** Panels become stationary at their established ring positions; normal interaction and the native chapter system begin. The presentation never requires or implies a bottom sheet.

**The entrance is the spatial tutorial.** Do **not** add permanent edge arrows, offscreen chapter labels, unrelated compass HUDs or discovery hints. Existing Help remains accessible. The purposeful sight of panels traveling beyond the view is sufficient to suggest turning.

### Returning visits and recovery

- **Returning to the same destination:** a quick **0.5–0.8 second** panel deployment without full emblem ceremony or repeated spoken introduction. Prefer a soft nonverbal completion sound; never force a long delay before interaction.
- **First access at a different destination:** the full introduction may play once for that destination.
- **Tracking lost and regained:** preserve original panel headings and native recovery semantics. Use a subtle status indicator and short nonverbal acknowledgment. **Never replay the full spiral or reset the destination's story progress merely because tracking recovered.**
- **User backgrounds/foregrounds:** do not duplicate the intro on resume or leave partially animated nodes blocking input. Resolve state deterministically, preserving safe cancellation.
- **Reduced motion or Skip:** use quick opacity/scale transition directly to final positions without orbit/spiral; the final interactive state must be the same.

Whether first-visit completion is stored per destination or scoped to an app installation is an implementation choice, but it must not reset on ordinary tracking recovery or every app backgrounding. Document the storage decision and test it.

## 4. Deployed ring and chapter interaction

The existing native 360-degree chapter ring is the canonical layout. Its headings, camera translation behavior, focused 1.5 Viro-unit distance, visible chapter count (currently up to 12), tracking guards and held finger-pad focus behavior remain unchanged unless a *separate* owner-approved product decision changes them.

### Idle covers

- Use matte/translucent deep-forest panels with restrained seafoam edge cues, readable titles and intentional iconography tied to real content; preserve safe legibility against bright sky and dark surroundings.
- **No perpetual orbit, bobbing, pulsing, shimmer, animated circuits or looping particles.** Static is the baseline after deployment; subtle changes may acknowledge a genuine state transition.
- A chapter's visual cue should reflect its content/availability, not manufacture approvals, facts or media that do not exist.

### Focus and reading

1. The existing **hold** gesture focuses the selected panel; a subtle border acknowledgment confirms the interaction.
2. The focused panel moves/expands using the existing native behavior into a legible reading surface. It stays inside Viro; no React Native bottom-sheet substitute.
3. **Other visible chapter panels dim rather than disappear**, approximately a modest 35–45% of their normal prominence as a design starting point (tune against real surroundings). The real camera feed is **not dimmed**. Non-focused panels remain identifiable and able to receive the current hold-to-switch interaction.
4. Once media is presented, the technical frame visually yields to the *authentic story content*. Navigation controls remain discoverable, compact and consistent.
5. Closing focus restores surrounding panels. Existing `Opened` indicators, orientation and chapter page state behave as before.

### Page transitions

User-controlled progression only. Change media/content **inside a stable holographic frame** using brief fades or restrained directional slides rather than spinning/teleporting the entire panel. Never autoplay image slideshows or move spatial anchors during ordinary reading.

## 5. Rich visual storytelling is mandatory

**Explicit owner correction:** A text-only AR chapter experience is **not acceptable** for the core product. Rich visual presentation is required. The app must be built to render authentic, approved destination media as first-class chapter content; text is supporting context, not the dominant medium.

### Required presentation families

| Family | Purpose | Interaction |
| --- | --- | --- |
| Feature photo | Let visitors see a real destination or object, with concise context | Full, readable image; meaningful caption/credit |
| Photo gallery | Multiple views of a subject or place | Manual next/previous, sensible preloading |
| Visual story | Alternate approved images and short text/caption blocks | Manual page progression |
| Factual timeline | Present sourced events with supporting media where available | Readable sequence; no invented dates or reconstructions |
| Short video | Show movement, experience or a demonstrated point of interest | **Explicit Play/Pause** only; no autoplay; user-controlled seek/mute where supported |
| Information card | Concise sourced supporting material | Used when media is legitimately unavailable, not as the universal chapter layout |

These are **presentation components**, not new mandated chapter names or a requirement that every destination contain all formats. The renderer must select suitable treatments from actual approved content and remain coherent when a source lacks one media type. Chapter content can include supporting prose, source attribution and existing adjustable font size; video needs play controls and accessible captions/transcript appropriate to the languages available.

### Explicit non-goals for this phase

- No interactive 3D assets, placed 3D reconstructions or historical scene reconstruction; revisit only after the media-rich 2D-in-AR experience works well on actual devices.
- No fabricated historical pictures, unlabeled AI-generated visuals, unlicensed Google Maps/third-party photography, or fictional destination media.
- No requirement to auto-generate media from text, auto-source YouTube, narrate stories, or integrate generative speech/content services.

## 6. Content source-of-truth: client's research form

Input form: `featured-destination-research-form.md` (owner-provided, submitted to client). It requests one destination record per working ID **D01–D09**, including official names, actual destination and public entrance coordinates, source-verified content in Overview/History/Highlights/Visitor Information/Interesting Facts, reviewed EN/JA/KO material, original photo files with captions, alt descriptions, creator credit, license/permission including offline use, approval, and source dates. The client performs source research; the developer does not invent missing content.

The form currently makes **photos required and videos optional**. This is compatible with launch: approved photo-led chapters can deliver a rich experience, while the player supports videos **only when actual usable, permissioned files are supplied**. Do not silently convert optional videos into a new mandatory client deliverable.

**Minimum AR-media readiness (owner-approved):** Do **not** approve a destination for its full featured AR story experience if the content amounts to one cover photo and otherwise paragraphs. Editorial/content review must find enough approved, section-relevant images or videos to deliver an authentically **visual sequence** in its primary story chapters. Specific supporting chapters (e.g. visitor rules, fees, interesting facts) may be text-led when appropriate; lack of a historical photograph need not automatically invalidate a factual History section if the *overall destination* meets the meaningful-media bar. This is an explicit **editorial approval gate**, not an automatic guessed photo-count threshold. Distinguish "featured destination exists for map/directions" from "its AR stories are content-ready"; preserve existing proximity and admission boundaries. Builder must propose a truthful way to expose that approval without introducing fake material.

For each video eventually provided, the ingestion contract should capture at minimum destination/section association, exact filename, title/caption, source/creator, display credit, permitted usage and offline/bundled distribution, approval, playback poster/thumbnail, language/caption availability and duration. This may be handled through an **optional addendum** to the research form; do not alter the already-sent client form without owner review.

**ACLC College of Ormoc:** development/on-site AR test destination from the project history; it does **not** appear in the client's D01–D09 list. Keep it labeled as a test fixture until the owner/client confirms otherwise. Do not silently substitute ACLC for one of the contracted featured destinations.

**Approval gates:** if an image/translation/license/description is pending, present honest missing-content treatment rather than shipping unapproved media. Media status must not bypass live AR admission or location validation. Source credits and suitable alt descriptions/captions must remain linked to media.

## 7. Audio and localization

**Voice scope:** very short robotic system announcements only; **no destination narration, no robotic reading of chapters and no chatty assistant**. Relevant examples: first-visit AR initialized, optional critical status. Use a consistent brand identity, without excessive synthetic voice filters or movie-computer gimmicks.

**Localization:** spoken announcements follow the selected app language **English, Japanese or Korean**. All scripts, pronunciations and timing require review; the sample lines from ideation are not approved final translations. Accompany voice with corresponding on-screen text where it communicates necessary state. Prefer bundled, reviewed local audio assets that do not require Internet at activation. Missing localized speech should not block AR: omit the voice and show the accurate translated text/status, rather than pretending a translation exists.

**Production and approval (owner-approved):** The development side is responsible for preparing consistent, appropriately licensed synthetic/recorded system-voice assets in all three languages and submitting the exact scripts and recordings for owner/language review. The destination-research client does **not** have to create these clips. No unreviewed voice asset should ship as an approved localization. Production sourcing/licensing and technical audio method are builder decisions to document before bundling.

**Independent persisted settings (approved):**

1. **System Voice** on/off.
2. **Sound Effects** on/off.

Default values and platform audio behavior are builder proposals to verify with owner/device conventions; respect device volume and accessibility settings, do not override DND or make unexpected loud audio, and avoid playing multiple cues simultaneously. A speech-off user may still want low-key deployment sounds. All sound is nonessential to understand the experience.

**Suggested event mapping:** first init one short voice; deployment/lock one modest sound sequence; selecting/closing a chapter a quiet feedback cue; tracking loss/recovery visible and possibly quiet nonverbal alert. Returning visits should **not repeat speech by default**.

## 8. Proposed technical integration (builder-facing, not a code order)

Preserve Expo SDK 57, React Native 0.86, Expo Router, existing `global.css` / UniWind / HeroUI Native, `@reactvision/react-viro` native AR, established destination-content contracts and the user's current app state. Avoid introducing a separate animation engine or third-party media framework without evidence and explicit agreement.

**Current-source reconnaissance at the time of planning:** The repo already has `src/features/destination-ar/information-gallery.ts` and `information-panel.tsx` with approved bundled `ViroImage` gallery pages, `RingController` / `scene-geometry.ts` for headings and focus, an existing session `reveal` phase, `use-ar-introduction.ts` tracking a global introduction, and `src/features/settings/preferences.ts` / `settings-form.tsx` persisting language and radius. The current `src/features/destinations/catalog.ts` validates bundled *image* metadata (credit, rights and approval); no established video contract was verified. Build on these rather than duplicating their systems. A global first-use intro is **not** identical to the newly approved per-destination cinematic first-visit rule; reconcile the two carefully.

- **Phase controller:** separate non-interactive initialization effect state from authoritative tracking/admission and active chapter state. It must have a single source of truth and guards against duplicate entry, interruptions, fast repeat launches and lost tracking.
- **Motion:** Viro supports reusable property animations (position, rotation, scale, opacity) and chained transitions; apply such primitives to the **existing ViroNode hierarchy** when compatible. Compute the target ring from the existing chapter-heading transform, not new guessed coordinates. An intro should resolve to the *same final positions and hit targets* as the current static scene.
- **Audio:** Viro supports stereo and spatial audio. Short nonverbal cues and localized bundled voice can use the existing native audio route if it behaves correctly; test real Android output, interruptions and muted state before adding any package.
- **Media:** reuse existing native image/media chapter capabilities if available. Verify actual Viro/video playback, memory lifecycle, posters, user gestures and accessibility on device before promising video performance. If the current player cannot meet requirements, propose the smallest compatible solution explicitly before implementation.
- **Rendering:** avoid dynamic high-count particles, heavy fullscreen filters and continuous render churn. Use a performance budget measured on a real midrange Android target. On constrained hardware, reduce transitional embellishments before readability or tracking quality.
- **No hidden external calls:** do not query Places, Directions or unknown media services as a side effect of showing an AR panel. Prefer validated app assets and the approved destination content pipeline.

## 9. Safety, comfort and accessibility

- Run cinematic motion **only after trustworthy native tracking**; avoid misleading cues that simulate world surface detection or coordinates.
- Respect a reduced-motion setting (system and/or app) by placing panels directly with a short fade; skip the spiral without losing content.
- The user can skip/interrupt the first intro and interact promptly; no long lockout, no loop on re-tracking, no full entrance on every foreground.
- Ensure adequate panel readability under sunlight, shadows and low light; use deep forest translucent surfaces and accessible contrast, not glowy small seafoam text.
- Do not dim or replace the actual camera feed while reading; be mindful that users are physically walking or rotating. Never encourage walking while absorbed in content.
- Maintain working Back, close, recenter, permissions, text size, held input, accessibility labels, error states and tracking-loss recovery.
- Never let a video auto-play audio, and pause it on chapter exit, app backgrounding or tracking loss according to established session rules.
- User captions/transcripts and supporting content should be accessible in supported languages where verified; pending translations must be clearly handled rather than fabricated.

## 10. Verification and acceptance

**The enhancement is successful only when the actual AR experience, not merely a screenshot/mockup, demonstrates the intended behavior.**

1. On first admitted visit to a featured destination, the compact logo/emblem unfolds and chapter panels settle into the **original correct 360° positions** within the approved-duration envelope; users can skip.
2. A return visit is fast and speech-light. Changing destination triggers the first-visit treatment only under the agreed per-destination rule. Background/resume and tracking recovery never duplicate or scatter panels.
3. No directional hints are introduced; spatial discovery is taught through the full opening motion and existing Help.
4. Opened chapter remains focused; other panels dim but stay visible and interactive; no camera dimming or 2D bottom sheets; hold-to-switch remains reliable.
5. Real approved photos and photo-led visual stories render with captions, credits and manually controlled progression; an AR-content approval gate rejects effectively text-only destinations while permitting appropriate text-led supporting sections. If usable videos exist, they play **only on explicit user activation** and pause safely.
6. Owner-reviewed, legally usable EN/JA/KO announcement assets, on-screen fallback and independent voice/effect toggles behave predictably and persist. No spoken narration of historical content.
7. On small screens/large fonts, with bright/dark backgrounds, interruptions, low-power/performance constraints and on-site tracking, panels remain usable and readable.
8. The enhancement does not reopen #39–#42 or regress the approved eight-screen Seafoam Forest UI visual redesign. Test these issues separately against the known branch state.

**Evidence:** native Android/ADB recordings of first deployment, return, interrupted entry, reading and gallery/video controls; performance observations, localization checks, current source commit/JS bundle, content/asset provenance and skipped physical tests explicitly noted. A generated concept mockup is not acceptance evidence.

## 11. Boundaries and what remains for the builder

**Owner-approved:** Hybrid Functional Futurism; compact ARgala emblem splitting into 360° panels; first cinematic and returning fast entrance; short localized system voice only; independently switchable voice/effects; no directional hints; dim-not-hide adjacent panels; stable native Viro hold interactions; rich approved photos/video and controlled progression; no autoplay; 3D and reconstructions deferred; anti-AI-slop restraint.

**Builder decisions to document:** detailed easing and frame timings, panel/deployment path computation, media asset packaging and memory budget, stable content-schema mapping, video playback feasibility, graceful low-power mode, reduced-motion source, audio handling and the defaults for the two audio toggles. Verify these rather than claiming implementation is already proven.

**Requires owner approval if later proposed:** new data providers/costs, use of unauthorized content or generative recreation, expanded destination list, changed GPS eligibility or AR anchoring semantics, new media narration, or native dependencies that materially expand build risk.

**Next sequence:** design approved and companion task-by-task plan prepared → wait for four separate bug fixes → coding agent checks current source and task plan → agent implements in isolated branch with real-device verification → owner reviews PRs. Do not merge this enhancement untested into the existing theme work.
