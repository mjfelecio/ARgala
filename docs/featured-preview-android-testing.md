# Featured destination AR — Android presentation testing

The presentation path contains the supplied nine destinations, 20 chapters and
53 photographs, with EN/JA/KO stories, captions, credits and visitor guidance.
Classic is the default. Exhibit is an optional Lake Danao prototype. ACLC remains
an independent development/GPS-validation experience and is outside those counts.
The presentation entry uses explicit development provenance: it does not prove
arrival or earn Passport stamps. Supplied landmark centers and route entrances
are separate; neither grants an AR activation point or field acceptance.

## Prepare the existing client

1. Use the compatible installed development APK and this branch's Metro source.
   Start `EXPO_PUBLIC_VIRO_SPIKE=1 npx expo start --dev-client --localhost` and
   connect USB Metro with `adb reverse tcp:8081 tcp:8081`. Use a local dependency
   directory; an external `node_modules` symlink can break lazy-import URLs even
   when the main bundle loads. Keep the server and USB connection available.
2. Open Profile's existing guarded AR presentation entry (currently labeled
   “ACLC ring prototype”), then select Classic or Exhibit. This shared launch
   label does not make the pilot part of the nine-destination presentation.
3. Select the destination, review preflight, then explicitly start native AR.
   Support, permission and tracking failures retain their normal recovery.
4. Record APK hash, source revision, device/Android version, font scale, locale,
   lighting and results. An Android export is not an APK. Any new development or
   preview APK build requires the owner's approval for that specific build.

## Test matrix

- Open all nine Classic destinations and every chapter. Check all 53 photos,
  image identity, aspect ratio, captions, credits and text-only chapters against
  the supplied content. Turn toward ring chapters beyond the current view.
- Test real short finger taps, Previous/Next, Close/reopen and explicit Recenter.
  The reader stays at 2.25 units. Reading-size controls remain in the bounded
  screen toolbar; page controls and Close stay on the focused native frame.
- In D01 Exhibit, confirm the three covers form a shallow arc. Opening a chapter
  removes all cover geometry until Close finishes, then restores the arc. Check
  text-led and photo-led chapters, title clearance and photo reveals. Retired
  cover callbacks must not reopen or collapse a reader.
- Check Capture processing, failure/retry, actual photo preview and Discard/Back.
  Feedback spans the toolbar below the shared Recenter/Capture action row.
  Save/Share are separate actions; never infer successful delivery from a chooser.
- Test Help, first entrance/Skip, tracking loss/recovery, background/return and
  exit/reentry. Confirm camera release on background/exit and restoration of
  chapter/page without implicit recentering or repeated permission prompts.
- Use explicit Settings Save to test Japanese/Korean glyphs and all reading
  sizes. Restore the original language, radius and other preferences afterward.
  Fluent editorial review is separate from native font/layout verification.
- Check bright/dim surroundings, large system text, native frame pacing and
  repeated image navigation, including D08's large photographs. JS/HWUI timing
  alone does not establish Viro renderer FPS.
- Test with phone WAN disabled after preparation. USB Metro can still supply
  bundled assets; label that result separately from standalone APK offline use.

## Presentation sequence and remaining gates

Show Classic first as the complete fallback. Open a chapter, page through its
photos/text/credits and Close before selecting another. Exit to choose another
destination. The supplied 2026-11-13 content supersedes the earlier limited
research preview and two-image inventory; do not repeat those old counts or the
superseded “probable match” description for Sal's.

Show D01 Exhibit separately for owner feedback. The owner reported reliable quick
finger taps, but has not yet accepted its visual direction. Do not extend Exhibit
to the other eight destinations before that review and real-device acceptance.
See [prototype evidence and device gaps](design/presentation-exhibit/README.md)
and [validation](validation.md) for observed results, rather than treating this
checklist as completed tests.

No on-site GPS/route calibration, redistribution clearance or Passport approval
is implied by this content integration. There is no destination video player.
Once Jelzon confirms the presentation deadline, reserve final testing, packaging
and recovery time and stop new visual features at that cutoff. Deliver Classic
if Exhibit is not accepted in time.
