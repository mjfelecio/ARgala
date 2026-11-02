# Cinematic AR implementation evidence

Baseline: `b794c96316b8dbb5a1cfcfa713bcfe7a2a1c4c81` (`main`, PR44).
Owner assigned the supplied handoff on 2026-11-02. Issues39–42 were all closed;
PR43 merged at08:10Z and PR44 at10:44Z. Work is isolated in
`.worktrees/cinematic-ar`, branch `feat/cinematic-ar-stories`. No merge/deployment
or APK build is authorized or performed.

## Implemented behavior

- Human story review is separate from map/directions availability and GPS entry.
  `ar.storyApproval` records reviewer, reference, date, exact content version and
  the editor's primary visual chapter IDs. Those chapters must bind a sequence
  of distinct reviewed bundled assets with offline rights. Two aliases of the
  same cover do not qualify; two images alone never manufacture editorial review.
  Reviewed EN/JA/KO text, captions and alt remain necessary. History and visitor
  information outside that primary set may be text-led. D01–D09 remain provisional;
  no facts/assets/approvals were invented. The development pilot remains separate.
- A per-install destination/provenance-scoped cinematic flag uses
  `argala.ar-cinematic.v1:<provenance>:<encoded destination ID>`. The old global
  `argala.ar-introduction.v1` help flag is preserved independently. No principal,
  positions, camera data, chapter content or reading progress is persisted here.
  Completion occurs after accepted native tracking-ready and settlement/Skip;
  background restoration of an established logical session settles without replay.
  Failed initial native startup never marks completion. Failed flag writes retain
  current-session completion with localized Retry.
- Full entry uses2600ms including600ms emblem formation; return650ms; reduced
  motion180ms direct fade. The existing arch geometry was rasterized from
  `assets/brand/arch.svg` using ImageMagick to a256×222 transparent PNG, without
  redrawing it. Twelve native keyframes describe the outward arc; no React
  frame updates or ongoing motion. Every settled node returns to canonical
  `buildRingSlots` positions/orientation and native hit targets.
- Viro's first chain array level is parallel and inner arrays sequential.
  Installed Android `AnimationManager` retains earlier parsed registry entries.
  Native yaw steps use shortest **relative** deltas: Viro normalizes stored Euler
  angles between steps, so absolute negative targets can cause long rotations.
  Scene/session deadlines remove animation wrappers without native finish callbacks.
  Tracking loss settles deployment and recovery retains progress/native frame.
- Focused content stays crisp; ring neighbors use0.4 prominence and retain the
  accepted hold-to-collapse behavior. Camera feed is never dimmed. Current AR
  palette,1.5-unit focus distance, reading controls and camera bounds are preserved.
- Bundled chapters support photo/gallery and interleaved visual-story treatments.
  Galleries lead with all imagery; stories alternate image metadata and prose.
  Every caption/alt/credit and all body text remain reachable manually. Same-locale
  caption reflow restores source offset within asset identity, rather than the
  old page ordinal. Translation reflow retains the asset with clamped page index.
  No invented factual timeline is added in the absence of sourced timeline input.
- System Voice and Sound Effects default **on**, explicitly selected by the owner.
  Existing strict preference records migrate without changing language/radius;
  partial language/radius saves preserve existing audio opt-outs. Both toggles
  participate in the existing explicit Save/Undo and sticky action logic.
- The Viro audio adapter consumes actual deployment/focus events, permits one cue
  at a time, respects independent settings, drops interrupted/duplicate cues and
  does not fall back to English speech. The manifest is intentionally empty:
  no legally sourced/reviewed recordings have been supplied. See AUDIO-REVIEW.md.

## Verification and remaining gates

Targeted Settings/onboarding/AR suite: **420 tests across39 files passed**.
A subsequent full `npm run check` passed strict TypeScript, zero-warning lint and
**1,370 tests across123 files**. A final reading-box clearance regression was then
added and passed after retaining the original body bounds. Final `npm run check`
passed TypeScript, zero-warning lint and **1,371 tests across123 files**; final
Android export also passed (8.5MB Hermes). `npm run test:destination-content`, `npm run check:native-patches`,
`npm run check:android` and Android export passed (8.5MB Hermes, new emblem asset).
These checks are not an APK build. Video feasibility **failed** the installed seek
command; all temporary app imports were removed and restored files SHA256 checked.
No product video player/dependency/schema ships. See VIDEO-FEASIBILITY.md.

The complete cinematic/story/audio enhancement is **not release accepted** while
D01–D09 rich content/rights/translation review, recordings and video feasibility
remain pending. A native runtime check cannot establish on-site geographic
admission, sunlight performance, all-language TalkBack or release-build thermal
behavior. Concept reference `references/08-ar-camera-concept.png` is design input,
not an implementation screenshot. Original client research form remains unchanged.


## Physical Android scope and limits

Galaxy A53 SM-A536E / Android16, existing development APK installed2026-10-30,
1080×2400 display, effective420dpi, original system font scale retained. Battery
was50% initially and47% at the video stop; no prolonged thermal exercise. Matching
SDK57 Metro ran from the isolated worktree over USB reverse8081. No APK was built,
installed or upgraded. App session/data were retained; OS volume was not changed.

The development ring reached actual native tracking-ready, rendered the original
chapter frame over the real rear camera, and accepted an ADB held Overview opening.
A brief background/return recovered the camera/focus; recordings and screenshots
stay private in `/tmp/argala-cinematic-evidence`. First/return recordings were
partially confounded by initial lazy-module bundling and temporary fixture Fast
Refresh; they demonstrate native rendering, but do **not** certify exact full/
return timing, emblem visibility or the complete 360° sweep. A temporary development
scope `development-cinematic-qa-a` was used to avoid erasing real intro/history data;
its source change was restored. It grants no selected-destination/GPS authority.

The isolated ViroVideo fixture visibly decoded/advanced a test pattern and fired
completion callbacks. The owner confirmed video operation but heard no initial
very quiet tone, then reported repeated error screens during seeking/restart.
The error was traced to installed ViroVideo's Android `NativeModules.UIManager`
command path in Fabric. Further video testing stopped, the fixture import was
removed, both temporary app files restored byte-for-byte, and the client restarted.
No native correction, alternative player or new dependency was attempted.

Still unverified: exact first/return/Skip/reduced-motion device timing and full
sweep, deliberate tracking-loss recovery, bright/dim neighbor focus/touch matrix,
real approved destination galleries/rights/translations, optional video seeking/
audio/lifecycle/captions, reviewed voice/effect playback, all-language TalkBack,
release performance, on-site geographic admission and native permission/install
matrix. Automated coverage establishes model/component contracts, not these cases.


Final code commits: `9ef435e` readiness/intro foundation, `108bbb4` audio settings,
`7d373a7` native deployment/recovery, `1d078c9` visual stories/caption restoration.
After fixture removal the ordinary native ring was observed running again without
its video error screen. AR was exited to release the camera. No approved video,
voice clip or native dependency was installed; no PR was pushed, merged or deployed.


## Image priority follow-up — 2026-11-02

The owner deferred video work and requested sample photos. The photo area now
uses the compact heading space (0.405 versus 0.28 native units, about45% taller),
without changing the square frame, camera distance, caption or controls. Loading
and failure retain the caption/credit; an explicit native Retry replaces only
its image attempt and obeys Help, tracking and transition interaction fences.
Source replacement resets a failed image; caption navigation retains the bitmap.

The owner's “image unavailable” report reproduced on a valid bundled JPEG.
Installed Viro3.0.3 Android `VRTImage` emits `onLoadEndViro` with a null payload
**after** its download listener sets the bitmap. Requiring a true `success`
field rejected real successful loads. The application now accepts that native
completion while still failing explicit false and `onError`; retired callbacks
cannot change the current attempt. The empty-payload regression failed before
the fix and passed afterward. No dependency patch was needed.

On the existing Galaxy A53 development APK, the corrected callback visibly
rendered the licensed ACLC **Iriga** campus photo in the native focused panel.
That photo is explicitly not ACLC Ormoc. The reproducible development ring now
contains it and a generic landscape, with source/license records in
`assets/development/ar-gallery/README.md` and sample captions in EN/JA/KO.
Overview demonstrates a gallery and History a mixed visual story. These are
sample fixtures, not destination approval, geographic authority or Passport
content. Both development gates precede module evaluation. Static export can
still include development assets; runtime gating does not assert bundle removal.

Device checks used the existing APK and USB Metro; no build/install or OS setting
changes. This follow-up observed battery42% to37%; testing remained brief. The
native image callback/bitmap fix was observed with the temporary sample fixture;
the final permanent loader is covered by component tests, with a complete final
on-device gallery/navigation/language matrix still pending. Video remains behind
the documented stop gate. No video correction was attempted in this follow-up.


Final follow-up verification: `npm run check` passed strict TypeScript,
zero-warning lint and **1,390 tests across125 files**. Native dependency patch
verification passed with0 files updated; `git diff --check` passed. Android
Metro/React Compiler/Hermes export with the development flag disabled passed
(8.6MB). Both JPEG assets remain statically included (about282KB combined);
runtime guards prevent release evaluation rather than promising asset removal.
No APK was built. Metro was stopped during final checks, then restarted for owner
review; the app was left untouched and foreground/device sensors were not restarted.
