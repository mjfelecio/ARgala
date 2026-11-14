# D01 destination stage and gallery

## Photo Islands — owner-selected direction, November 14

After reviewing the all-nine stage rollout, the owner requested more reason to
look around through AR. An interactive browser comparison explored the existing
front stage, Open Circle, Panoramic Ribbon and Photo Islands. The owner explicitly
selected Photo Islands and instructed implementation. See the
[design](../../superpowers/specs/2026-11-14-photo-islands-design.md) and
[plan](../../superpowers/plans/2026-11-14-photo-islands.md).

The first native slice is Danao: a gallery welcome ahead, then three bays at
−95°, +35° and +150° with two photographs each and an optional, larger story tile
below. Bay radius is 2.6 units. Photos retain separate native focus/Close targets
and open the shared gallery at the selected media ID; the welcome resumes it.
All seven photographs and all three chapter IDs remain intact. Browsing a photo
cannot create a selected/opened chapter or Passport progress. Static shoreline
accents sit below the bays; all browsing geometry disappears during reading and
Close. Reader, camera/session ownership, capture and 2.25-unit distance remain
unchanged. No page glint/reveal effects return.

Danao is enabled for the first physical review. The other eight destinations
retain their accepted stages until that checkpoint. Classic remains selectable;
`danaoFrontStagePresentation` retains the previous Danao composition for rollback.
The November 21 deadline, November 19 visual cutoff and November 20 stabilization
day still apply. No dependency, native change or APK build was made.

Offline verification: TypeScript, zero-warning lint, **1,565 tests / 137 files**
and Android export with **111 assets** passed. Fresh read-only review reported no
confirmed material issues and passed 108 focused tests in five files. The native
A53 first view rendered the welcome photograph, text, shoreline and look-around
hint with tracking ready. Full bay reachability and owner physical tap/spacing
review are in progress; browser simulation and mocked tests do not establish
those results. Earlier sections below record the preceding iterations.

## Current owner decisions — 2026-11-14

Jelzon confirmed **November 21**. The owner reports the complete Classic device
sweep passed and approved the corrected first Exhibit. Classic is the accepted
presentation fallback. The owner then selected destination-specific stages and
approved the Danao gallery-first browser concept: photographs lead, stories are
optional. Target new visual completion Nov19 and reserve Nov20 for stabilization.
The [approved stage illustration](D01-STAGE-REVIEW.html) is preserved separately
from native device evidence; it is a browser design preview, not an AR screenshot.

The new D01 implementation adds one prominent gallery entrance containing all
seven supplied photos, three compact story stations and six symbolic ridge/ripple
contours. The entrance preview fills its wide frame; the opened gallery uses
aspect-fit images so the complete original is available. Previous/Next changes
photographs directly; long captions and credits have separate text controls.
The initial native version omits the browser thumbnail strip for viewing space.
The existing reader stays at 2.25 units. All stage geometry retires during focus
and Close; only completed Close restores it. Gallery progress is separate from
chapter openings and Passport. Help, reduced motion/effects and tracking fences
quiet ornament without removing content or controls.

The previous faceted prototype remains an immutable internal rollback profile;
Classic stays selectable and default. The new stage is D01-only until native
review. Do not extend to D02–D09 before acceptance of this version. See the
[design](../../superpowers/specs/2026-11-14-destination-stages-design.md) and
[implementation plan](../../superpowers/plans/2026-11-14-destination-stages.md).

**No phone connection was made during this implementation:** the owner is
charging the A53 and will announce availability. Native appearance, tap routing,
CJK/large captions, alpha rendering, capture, recovery and performance for the new
stage remain unverified. Existing physical results below concern the earlier
prototype. Source checks and an export do not establish device acceptance or
produce a standalone APK. No APK build/install/publication was performed.

## Earlier first prototype

Classic is the content-complete fallback (commit `9960138`). The first Exhibit slice is limited to Lake Danao: three faceted chapter panels, chapter-specific cover photos, a text-led middle chapter, layered frames, native entrance/focus and short photo reveals. The flat reader stays at 2.25 units; content and credits remain complete. No atmospheric particles or other-destination rollout has started.

Open [the offline review illustration](D01-REVIEW.html) or [its wide composition capture](D01-REVIEW.png). They use the real supplied content and photo bindings, but are browser illustrations, **not Android/Viro screenshots**. Desktop perspective is illustrative; narrow windows show an inventory. Browser text flows continuously rather than reproducing native pagination. The neutral background is not a camera feed. The checked narrow Korean and Japanese reader captures remain private in the task's temporary evidence directory.

## Existing development client

Use the already-compatible development APK; no APK was built or installed. From this worktree, start Metro with `EXPO_PUBLIC_VIRO_SPIKE=1 npx expo start --dev-client`, open Profile's existing guarded AR presentation entry, and choose Classic or Exhibit before entry. Classic is selected initially. Exhibit offers only D01. Back/Exit returns to the selector; switching modes starts a separate owner. The optional Exhibit loader offers Retry or Continue with Classic after failure. A release build or disabled development flag cannot load this entry. ACLC remains a separate development/GPS-validation experience.

The source workspace's uncommitted SDK/auth changes were copied for compatibility and remain unstaged. On 2026-11-14, the existing installed APK was identified by SHA-256 `1a261cd4b63a2029d9f1b47eee9121ddd34d1f66fb82da82ca8e9b2ebe3bceac`, matching the previously accepted native tap-patched client. No APK was built or installed. Do not upgrade or rebuild an APK without owner approval.

## Galaxy A53 acceptance gate

For the **new gallery-first stage**, after the owner announces the phone is ready:

- Enter Exhibit → Lake Danao; inspect the wide photo entrance, all three story
  stations and ridge/ripple contours. No selection should happen during intro.
- Open Gallery and browse photos1–7 directly. More text/Back changes only caption
  or credit pages; Previous/Next changes the photograph. Check first/last disabled
  states, complete credits, native image failure/Retry and enlarged JA/KO captions.
- While gallery/story focus is opening, focused or closing, verify no stage covers
  or scenery overlap it. Close returns to the same composition; reopen keeps the
  last photo. Check physical quick taps, not only synthetic ADB taps.
- Background/recover while focused, and immediately after accepted Close; retain
  the correct open/collapsed state and gallery photo. Help must quiet ornament,
  fence taps and keep the camera frame. Recenter remains explicit.
- Compare Capture/Discard, native readability and warm repeated photo navigation
  with Classic. Save a minimal representative screenshot/short clip only during
  this navigation; record source/client/device and development caveats.

The following earlier-prototype matrix remains useful for regression:

Record client/APK identity, JS revision, device/Android version, battery, font scale, language and lighting. Compare Classic and Exhibit in brief batches using the same client and environment:

- All nine Classic destinations, all 20 chapters and all 53 photos; confirm offline availability after client/asset preparation.
- D01 arc visibility and comfort, real short finger taps, no missed/duplicate selection, text-led chapter, image Retry, caption/credit pages and Close back to the same arc.
- All EN/JA/KO glyphs and three reading sizes, with readable controls and adequate content clearance.
- Capture, Help, explicit Recenter, tracking loss/recovery, background/return and exit/reentry; no camera overlap or implicit recenter.
- Native frame pacing and memory during repeated photo navigation. JS scheduling pressure is not renderer FPS. Include D08 large photographs in later rollout checks.

The owner subsequently approved this first slice and reported that the complete
Classic sweep passed. The targeted agent-run A53 observations below remain
distinct from that later owner acceptance and do not establish native performance
acceptance. The new gallery/stage above needs its own D01 review before extension.

## Targeted Galaxy A53 results — 2026-11-14

Device: SM-A536E, Android 16, 1080×2400, override density 420 dpi, system font
scale 1.1 and dark OS theme. Existing APK above, source `6983671` plus the
reader-isolation/title and Capture-feedback corrections. Battery began at 15%;
the owner explicitly authorized continued testing at low charge. Private camera
frames and logs stay outside Git.

Classic D01 reached tracking-ready and rendered the supplied lake photograph,
caption and creator/license/year. Next advanced 1/13→2/13, Close returned to the
cover, and Exit released CameraService. Exhibit rendered the photo covers and
shallow arc. The owner reported quick finger taps on panels/Next/Close reliable.

An inner decorative rule crossed the Exhibit cover title; it is now suppressed.
The owner reported neighboring covers overlapping an expanded reader. Exhibit
now removes all covers during opening, reading and closing, and restores them
after Close completes. Retired callbacks cannot collapse or reopen a reader.
Native settled captures show the isolated photo reader and the returned arc.
Classic retains its existing visible-neighbor interaction. A brief Home/app
return released the camera while backgrounded and restored the focused lake
photo at page 1/13. This is one recovery trial, not controlled tracking-loss or
mid-transition acceptance.

The Capture failure/processing message now spans its own full-width toolbar row;
Recenter and Capture remain aligned together above it. The actual English failure
layout was inspected on this phone. EN/JA/KO feedback, recovery and retirement
are covered by real-resource component tests. Full `npm run check` passed strict
TypeScript, zero-warning lint and 1,484 tests across 132 files. Independent
follow-up review found no important issues. Android export passed (8.7 MB Hermes,
111 assets); all 53 original photo hashes were found in the output.

Phone Wi-Fi and mobile data were temporarily disabled while Exhibit displayed
its local covers; USB Metro remained connected and could supply bundled assets.
Original Wi-Fi on/mobile data off was restored. This is WAN-offline development
client evidence, not standalone APK offline acceptance. Initial Capture attempts
failed before native screenshot dispatch because Metro could not resolve a lazy
file-service import through this worktree's external dependency symlink. The
same dependency versions are now local to the worktree; the temporary diagnostic
was removed. This required no application capture-service change. Repeating Capture then
opened the real upright photo preview successfully; a temporary 1.34 MB JPEG
was present in the app cache and the native Pictures directory was empty.
Discard returned to the live arc and emptied the temporary cache.
Save and Share were not invoked in this pass.

D01 Exhibit also rendered actual Japanese cover/story/caption/credit/control
characters and Korean cover/caption/control characters. Japanese overview pages
were traversed through 11/12, including all five supplied photographs and body
text; sampled settled pages were inspected. Korean Next/Close synthetic taps in
the short recording did not advance the reader, so the clip is labeled only as
opening the Korean photo reader. This does not supersede the owner's separate
physical quick-tap report or prove all locale/control combinations. Settings
was explicitly saved back to English; the 500 m activation preference was kept.

A minimal curated gallery is stored outside Git at
`~/Pictures/ARgala-progress/2026-11-14/`, with six screenshots, one 12.5-second
native navigation clip and a captioned index. AGENTS.md now requests important
app-navigation milestones only. Raw troubleshooting frames remain separate.

Remaining gates include the complete nine-destination/20-chapter/53-photo native
matrix, full JA/KO content and controls, all reading sizes,
TalkBack, short/large-text conditions, controlled tracking and transition
interruptions, native frame pacing/memory and owner visual acceptance. No on-site
GPS/route or Passport claim follows from these presentation sessions.

Classic D08 also reached tracking-ready, completed the first-visit introduction
and opened its first native reader. Its 8.0 MB supplied photograph finished
loading and rendered with the correct garden caption. One post-navigation memory
snapshot reported approximately 1.30 GB PSS / 1.40 GB RSS; this is an isolated
measurement, not a frame-pacing benchmark or a leak assessment.

D08 overview was then traversed through all eight pages with 100 ms synthetic
taps; all three photographs, captions and credits rendered. Close restored its
cover. The second chapter and its other three photos remain outside this trial.

The subsequent Classic entry smoke pass reached live native AR and rendered the
first chapter photograph/caption in all nine destinations on this A53. Initial
automation that ran ahead of the returning selector was repeated with screen
verification. This covers each entry and first photo, not the full 20-chapter /
53-photo native matrix. See the destination table in `docs/validation.md`.

### Gallery-first Danao device continuation — 2026-11-14

The owner subsequently reported the full Classic sweep passed. The new Danao
stage is a separate review. On the same A53 and existing accepted APK, its wide
Gallery entrance, symbolic scenery, seven-photo browser and optional stories
rendered. Stage geometry stays hidden while a reader is open and returns after
Close. The gallery toolbar now fits the reader width; all three controls were
visible on the device. No APK build or dependency change was needed.

The owner reported slide shaking in both viewers, followed by confirmation that
the image movement was resolved. Danao now swaps pages without the late photo
reveal or nested page movement. In the installed Viro renderer, bitmap completion
is emitted after bitmap installation; starting a reveal then moved an already
visible photograph. Classic keeps its existing presentation defaults. Unchanged
frame-image props are also memoized across page commits.

A remaining story-border flash was reproduced on chapter 3 pages 6↔7. Removing
the extra focus-glint overlay from Danao eliminated the observed spike in a
controlled 14-second repeat; entrance, focus and Close motion remain. A fixed
top-border cyan mask ranged 1,738–1,836 pixels over 203 recorded frames, compared
with a previous peak of 5,441. Gallery photo 7→6→5 also showed no comparable
spike. These are recording comparisons, not native FPS or exhaustive acceptance.
The native cause of overlay replay was not established; a memo-only experiment
failed and was retired. The owner subsequently confirmed the latest update is
stable. This accepts the reported slide-stability fix; the remaining D01 sweep
is still pending.

Final checks: strict TypeScript, zero-warning lint, 1,510 tests in 135 files,
independent review and Android export passed. All 53 original photo hashes are
unchanged and present in the export. The minimal local sample gallery contains
an updated Danao gallery screenshot and one short story navigation clip.
The complete new-stage photo/metadata, locale/size, recovery, Capture/Discard
and performance sweep remains pending. D02–D09 are still gated on D01 acceptance.

### Nine destination stages — rollout implementation, 2026-11-14

The owner confirmed Danao paging is stable and explicitly authorized extending
Exhibit to the other eight destinations. All nine now have immutable, selected-
destination profiles and stable bound lazy hosts. Shared gallery/reader/capture
services retain separate per-mount transition and session state. Classic remains
the default and the accepted presentation fallback; ACLC remains separate.

| Destination | Symbolic treatment | Stories / photos |
| --- | --- | --- |
| D01 Lake Danao | Accepted shoreline, layered ridges and ripples | 3 / 7 |
| D02 Lake Kasudsuran | Paired fern fronds around the photo entrance | 2 / 5 |
| D03 Lake Janagdan | Enclosed basin contours and water rings | 2 / 6 |
| D04 Ormoc Mangrove Eco-Park | Branching roots and river banks | 2 / 6 |
| D05 Sal’s Pineapple Plantation | Receding field rows and fiesta pennants | 3 / 6 |
| D06 Leyte Golf and Country Club | Fairway sweeps and tree edges | 2 / 6 |
| D07 Alto Peak | Rising layered ridges and staggered story stations | 2 / 5 |
| D08 Heaven’s Peak | Garden terraces, flowers and mountain contours | 2 / 6 |
| D09 Sabin Resort Hotel | Bay horizon, waves and coastal trees | 2 / 6 |

Each has distinct station coordinates; all retain the same readable 2.25-unit
focused reader, complete supplied content, separate photo/metadata controls and
quiet page swaps. New scenery uses 6–15 static polyline meshes per destination,
ignores touches and disappears for focus, Help/tracking fences and reduced effects.
It is symbolic framing, not a terrain reconstruction or a route. The first A53
view prompted narrowing the new scenery group to keep its framing visible;
Danao's accepted composition is unchanged. No new assets, dependencies, lighting,
particles or native changes were required.

Offline rollout verification: `npm run check` passed TypeScript, zero-warning
lint and **1,554 tests in 136 files**. Coverage includes all nine actual scenes,
all 20 chapter openings, all 53 photo sources, 27 destination/language gallery
runs retaining complete captions/credits, and actual session-screen background
restoration for every destination. Profile/loader/selector failures were observed
before implementation. Independent review passed 265 tests in nine files with no
findings. New A53 sweep evidence is recorded separately in `docs/validation.md`;
these automated checks alone are not full native or owner visual acceptance.


The subsequent English A53 entry/gallery sweep reached all nine stages, rendered
all 53 photos and opened all 20 chapter targets across passes. This is an entry
and image-rendering sweep, not every story/metadata page or every locale/size.
D08 Help, size and background recovery retained the photograph. A fresh D09
Capture/preview/Discard and gallery Close passed. Laptop sleep interrupted the
USB development connection during an earlier attempt; reconnecting and repeating
the affected images passed. Precise coverage, one unexplained navigation reset,
performance observations and remaining acceptance limits are in the latest
`docs/validation.md` section. The phone was left at the Exhibit selector with no
active camera client. Only two stage screenshots and one 18-second navigation
clip were added to the existing local progress gallery.
