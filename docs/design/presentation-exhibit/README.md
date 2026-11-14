# D01 first spatial prototype review

Classic is the content-complete fallback (commit `9960138`). The first Exhibit slice is limited to Lake Danao: three faceted chapter panels, chapter-specific cover photos, a text-led middle chapter, layered frames, native entrance/focus and short photo reveals. The flat reader stays at 2.25 units; content and credits remain complete. No atmospheric particles or other-destination rollout has started.

Open [the offline review illustration](D01-REVIEW.html) or [its wide composition capture](D01-REVIEW.png). They use the real supplied content and photo bindings, but are browser illustrations, **not Android/Viro screenshots**. Desktop perspective is illustrative; narrow windows show an inventory. Browser text flows continuously rather than reproducing native pagination. The neutral background is not a camera feed. The checked narrow Korean and Japanese reader captures remain private in the task's temporary evidence directory.

## Existing development client

Use the already-compatible development APK; no APK was built or installed. From this worktree, start Metro with `EXPO_PUBLIC_VIRO_SPIKE=1 npx expo start --dev-client`, open Profile's existing guarded AR presentation entry, and choose Classic or Exhibit before entry. Classic is selected initially. Exhibit offers only D01. Back/Exit returns to the selector; switching modes starts a separate owner. The optional Exhibit loader offers Retry or Continue with Classic after failure. A release build or disabled development flag cannot load this entry. ACLC remains a separate development/GPS-validation experience.

The source workspace's uncommitted SDK/auth changes were copied for compatibility and remain unstaged. On 2026-11-14, the existing installed APK was identified by SHA-256 `1a261cd4b63a2029d9f1b47eee9121ddd34d1f66fb82da82ca8e9b2ebe3bceac`, matching the previously accepted native tap-patched client. No APK was built or installed. Do not upgrade or rebuild an APK without owner approval.

## Galaxy A53 acceptance gate

Record client/APK identity, JS revision, device/Android version, battery, font scale, language and lighting. Compare Classic and Exhibit in brief batches using the same client and environment:

- All nine Classic destinations, all 20 chapters and all 53 photos; confirm offline availability after client/asset preparation.
- D01 arc visibility and comfort, real short finger taps, no missed/duplicate selection, text-led chapter, image Retry, caption/credit pages and Close back to the same arc.
- All EN/JA/KO glyphs and three reading sizes, with readable controls and adequate content clearance.
- Capture, Help, explicit Recenter, tracking loss/recovery, background/return and exit/reentry; no camera overlap or implicit recenter.
- Native frame pacing and memory during repeated photo navigation. JS scheduling pressure is not renderer FPS. Include D08 large photographs in later rollout checks.

Collect owner feedback on this first slice **before further polish or extending to the other eight destinations**. The owner reports that quick finger taps work reliably, but has not yet reviewed the visual direction. The targeted A53 results below do not complete the full acceptance matrix or establish native performance acceptance. Once Jelzon's deadline arrives, set the feature cutoff with final testing, packaging and recovery reserved; deliver Classic if Exhibit is not accepted.

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
