# ACLC M2 native ring checkpoint

Status: implemented for development review; **physical Gate B incomplete**. This extends the M1 native feasibility result and its owner-accepted temporary held interaction. It does not establish production destination admission or GPS eligibility.

## Build and entry

Use the already-approved Viro3.0.3 development APK from [build91f33401](https://expo.dev/accounts/mjfelecios-team/projects/argala/builds/91f33401-365b-4ec0-b0c2-23c1f0c4ec25). Its recorded SHA-256 is `0b756a3f883042a70c70d44d28d44fffad4a726828867e881a1d0a5daa5dff95`. No new native module/configuration or APK was added for M2. The only dependency addition is the MIT-licensed pure-JS `unicode-segmenter@0.17.3` for Hermes-safe grapheme segmentation.

From the implementation checkout:

```bash
EXPO_PUBLIC_VIRO_SPIKE=1 npx expo start --dev-client --localhost --port 8081
adb reverse tcp:8081 tcp:8081
```

Open the development client with SDK57 onboarding/Fab/auto-launch suppression, then Profile → **ACLC ring prototype** → Start. The original **Viro feasibility test** square remains available for comparison. Release builds and disabled-opt-in links render unavailable without native support/permission/preference work.

A lost USB reverse mapping can show the development `Could not load bundle` overlay. Restore forwarding and reopen the client; do not classify that as unsupported AR hardware or an Android native crash. Warm Metro's lazy screen/scene modules before timed physical tests. Module preloading/export is bundling evidence, never tracking evidence. Start/Retry only when the owner is holding the phone upright toward a textured, well-lit area. Initial horizontal pose acquisition has the existing20s deadline.

## What to expect

- Four conspicuously labeled development samples: Overview, History, Visitor notes, Facts. None asserts dates, histories, coordinates, visitor rules or actual destination facts. Missing optional bodies are omitted and remaining angular slots redistribute.
- Overview begins ahead; History begins90° right. The ring follows translation while its initial yaw stays fixed. No compass/device-yaw parenting, GPS, geospatial anchor or unrelated POI is involved.
- Use the finger pad, hold briefly, then release. Ordinary short taps remain unreliable in the pinned recognizer; no native correction, pressure threshold or enlarged invisible hit area was implemented.
- A selected native panel captures the current horizontal view, moves closer/centers/enlarges and then stays world-fixed. Other tiles dim. Conflicting interactions are ignored during motion.
- Native Previous/Next, page indicator, A−/A+ and Close controls are inside the panel. Close animates in the moving ring frame so translation during closing or tracking recovery cannot leave an old endpoint. Recenter cancels a transition, uses the current valid view and preserves selected ID/page.
- Same-frame LIMITED/UNAVAILABLE dims/freezes interactions and pauses motion. NORMAL requires a new pose before spatial actions; it never recaptures initial yaw automatically. Focus/page remain intact. Blur/background unmounts this development scene; explicit Retry is still required. M3 logical restoration is not implemented.
- Exit/Recenter/Help/status are ordinary utility chrome. Help shows callback rates and computed position-output rates, not native/GPU FPS or acknowledged frame delivery. Only counters are reported; coordinates/frames are not logged or stored.
- Reading size alone persists under its dedicated device-local key. Late loads cannot overwrite a user action, reads follow pending writes across remounts, and failures have localized explicit retry. Page/content/location/camera data is not persisted.

## Trial parameters and verification limits

Initial ring radius2 native units, square tile0.68, expanded square1.25, focus distance1.15; subtle ±0.04 vertical staggering; native280ms focus/close motion (zero duration when reduced motion is requested). Translation output is capped at30Hz with a60ms smoothing time constant, 2mm deadband and25cm snap threshold. These are engineering starting values, not measured comfort/performance guarantees.

Pagination retains graphemes, original source offsets and explicit newlines. Size changes reflow around the current source position; locale changes clamp page ordinal. Logical font points are4/5/6 with conservative line/width budgets. After the first physical trial reported blurred text, glyph textures now use8× integer font sizes (32/40/48 for body text),8× layout bounds and reciprocal node scale to retain the intended world size. This follows [Viro text sizing guidance](https://viro-community.readme.io/docs/virotext#sizing); visual improvement still needs physical confirmation. Visible action surfaces are now0.18 high (previously0.12), with larger labels, separated rows and a0.46-wide Close button. No invisible hit area or recognizer modification was added. These budgets are **not** native glyph measurements. Viro world bounding boxes describe layout and cannot prove text overflow is absent. Check actual font, fallback, wrapping, clipping and controls at every size/language before acceptance. Existing Plus Jakarta Sans/CSS token family is retained; no typography substitution or unlicensed glyph/image asset was introduced.

## Gate B record

Initial trial: 2026-10-25, Samsung Galaxy A53 / SM-A536E, Android16/API36, existing approved APK and current Metro source9968e70. ADB connected, battery13%, USB charging,37.1°C. The owner started the scene; a private local capture showed the live camera and an Overview tile at20:38. This establishes rendering only; the owner subsequently confirmed Overview ahead and History to the right. Focus, readability and motion outcomes require separate observations. Keep low-battery runs brief. A second/lower-capability handset remains a later performance gate. Keep any camera captures local/private and out of Git; no app camera-save/share feature was added.

| Scenario | Required observation | Result |
| --- | --- | --- |
| Ring orientation/translation | Full360° turn, Overview ahead/History right, several safe steps, no camera-yaw spin or drifting radius | PARTIAL: owner confirms Overview ahead and History right; full turn/translation not yet scored |
| Current-view focus | Select History while facing right/away from entry; panel centers in current view, then stays in its world position when turning/moving | PARTIAL: owner reports focus works; world stability not separately scored |
| Close/recenter | Move while closing, repeat after tracking interruption, restore into current ring without snap; recenter during transition preserves selected ID/page | NOT RUN |
| Reading controls | Every page and size, clear hit regions and disabled bounds, long/unbroken text; no clipped or lost text | ISSUE: owner reports blurry/small text and unreliable controls, especially Close. Owner corrected the initial response: clipping was NOT reported. Higher-resolution text and larger visible controls prepared; retry pending |
| Locale/font | Existing Settings only; repeat in EN/JA/KO, inspect Plus Jakarta Sans/fallback/CJK glyphs and readable controls | NOT RUN |
| Tracking/lifecycle | Lose tracking, turn, recover same frame without recenter; background/Back releases camera; reentry/Retry gets a fresh frame | PARTIAL: Home released camera (no active client); return showed explicit interrupted/Retry UI. Same-frame ring recovery not yet scored |
| Appearance/accessibility | Bright/dark camera backgrounds, outdoor contrast, large system text, reduced-motion behavior, utility overlap/portrait bounds | NOT RUN |
| Pressure/performance | Record Help's pose/output rates while rotating/walking, inspect actual response/animation cadence separately; no unsupported FPS claim | NOT RUN |

M1's outstanding AR-services installation/update/decline and denied-settings cases remain unverified; M2 does not waive them for UAT. ACLC on-site GPS is a separate later gate requiring approved activation coordinates/content/provider association. Do not advance to production integration or claim M2 physically complete from mocked tests, config checks or export alone.
