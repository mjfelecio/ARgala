# Client progress smoke test — 2026-10-28

Completed the available ADB-driven sweep; owner deferred hands-on AR checks.
These observations describe specific trials, not a guarantee of crash-free
operation or full UAT acceptance.

## Configuration

- Source: `feat/journal-sync`, `3cffea9`; existing installed development APK.
- Samsung Galaxy A53 SM-A536E, Android 16, USB-connected to the laptop.
- Package `com.mjfelecio.argala`, version 1.0.0/code 1.
- Installed APK SHA256:
  `0b756a3f883042a70c70d44d28d44fffad4a726828867e881a1d0a5daa5dff95`.
- Metro: `EXPO_PUBLIC_VIRO_SPIKE=1 npx expo start --dev-client --localhost --port 8081`,
  with USB `adb reverse tcp:8081 tcp:8081`. No new APK build or installation.
- Existing configured Google/Supabase providers; actual account restored at start.
  No credentials or authentication storage inspected.
- Start battery 38%, USB charging, 31.1°C. Native crash/event monitoring starts
  at device-local `10-28 10:56:57.000`.

## Observed results

| Scenario | Result and limits |
| --- | --- |
| Signed-in cold launch | Account restored; native map and location marker rendered. A subsequent development-client cold start spent a noticeable interval loading Metro before returning successfully. |
| Featured ACLC selection | Marker and expandable sheet rendered. Real off-site arrival stayed ineligible. |
| Signed-in bookmark | Saved ACLC; Saved Places showed synchronized status. Full force-stop/relaunch preserved the reference and restored synchronized status. |
| Real provider discovery/details | Explicit ACLC-centered Explore Nearby returned Google places. Selecting a result opened address/details and Google attribution. |
| Real walking/driving previews | Get Directions returned a walking route. Selecting Driving retained the walking preview until explicit Preview; driving then rendered successfully. No actual journey or arrival was tested. |
| External Maps | Start Navigation opened Google Maps, which displayed first-use navigation terms. Terms were not accepted. After dismissing them, Maps displayed the supplied entrance coordinates. Returned to ARgala; active external navigation was not verified. |
| Offline bookmark/recovery | Captured original network settings (Wi-Fi on, mobile data off), temporarily disabled both, saved a Google reference, and observed local retention plus localized recoverable sync failure. Restored exact network settings; explicit Retry reached synchronized status. |
| Removal | Removed both signed-in test references and observed synchronized empty Saved Places, matching its initial state. |
| Text/viewport search | Two GPS-centered text searches returned handled empty states. Explicit Search This Area around ACLC returned the named Google result; marker selection opened its sheet. These are different search centers. |
| Category search | Selected Attractions, then explicitly searched the viewport; handled empty state. No comprehensive category relevance audit. |
| Locale changes | Saved Korean, then Japanese; settings, tabs, and empty Saved Places/sync status rendered in each. Restored English and retained the existing 500m generic device preference. Some existing guidance uses English fallback. AR tile typography in these languages remains a separate check. |
| Guest entry | Signed out and explicitly continued as guest. Profile removed account identity; Saved Places displayed local-only guidance and an empty journal. |
| Guest persistence | Saved ACLC in guest mode; force-stopped/relaunched without clearing data. Guest mode and the saved reference survived. |
| Guest-to-account merge | Owner signed in directly on the phone. The guest ACLC bookmark appeared under the authenticated account and reached synchronized status. Removed the fixture and observed synchronized empty Saved Places again. |
| Native AR startup | Explicit development arrival simulation and Start mounted the rear-camera scene; UI reached live/exploring guidance, and Android camera service identified ARgala as the active camera client. Initial dynamic scene loading through Metro was noticeably slow. This does not establish hands-on control/readability or GPS acceptance. |
| Brief AR background/return | Home released the camera (active clients empty). Returning reacquired the camera and live guidance. Logical page/transform preservation was not rechecked in this trial. |
| AR exit | Exit test returned to the selected ACLC map; camera clients empty. |
| Camera missing/recovery | Backgrounded app, revoked the previously granted camera permission with ADB, and relaunched. Explicit Start showed permission guidance/Settings/Retry, without a native scene. Restored grant while backgrounded; return remained interrupted with no camera until explicit Retry, which reached live AR. Android's permission-revocation process termination was intentional, not classified as a crash. Original camera grant restored. A system permission-prompt decline/install attempt was not exercised. |
| Real-time session expiry | Established live AR, backgrounded for 318.2 seconds without clock changes, then returned. Expired-session guidance and Back to Explore appeared; camera clients remained empty. Back to Explore returned to the selected map. A new explicit simulation/Start subsequently reached live AR. |
| Location services off/recovery | Original master location state was on. Turned it off while backgrounded and dismissed Samsung's system warning. ARgala retained its map and showed Enable location/Retry/Settings guidance. Restored the original on state and pressed Retry; normal selected-destination guidance returned. This is service recovery, not measured GPS accuracy. |
| Passport after simulation | Featured Destinations displayed zero of nine visits, empty-stamp guidance and synchronized account status after the simulated sessions; no pilot stamp shown. |
| Utility chrome/native Back | Help displayed held-interaction guidance and pose diagnostics. Recenter was invoked without a crash; spatial correctness was not evaluated. Android Back returned to the selected ACLC map and released the camera. |

The initial signed-in journal was empty, so the guest trial does not establish
isolation from a populated account or between two different accounts. The
guest bookmark was removed after the sign-in merge check.

## Automated checks

Fresh `npm run check`: typecheck and lint passed; 99 files / 1,045 tests passed.
This run did not change application code, dependencies or native configuration.
Previous SQL/limiter/export evidence is recorded separately in validation.md;
those checks have not been rerun as part of this phone sweep.

## Pending physical checks

- Current-branch hands-on AR ring controls/readability, tracking-loss recovery and
  reading-position restoration: owner deferred these until later. Historical
  prototype/integration results do not replace this branch's hands-on check.
- System permission-prompt decline/install interruption, location-permission
  denial and extended foreground/low-memory soak.
- Actual on-site ACLC GPS admission, entrance suitability and radius calibration.
  Simulation can never establish these. Approved factual content/media/provider
  association remain separate inputs; development research is not approval.
- Two-account/two-device reconciliation, Android backup/reinstall and interrupted
  remote acknowledgement are not covered by this single-phone smoke test.

## Final runtime/restoration checkpoint

Device-local monitored window: `10-28 10:56:57`–`11:34:01` (about 37 minutes,
including intentional restarts and the background expiry wait). Final Android
crash buffer contained zero lines; ARgala crash/ANR events numbered zero. Metro
contained no observed JS fatal/error output. Historical Android exit records
before this window were not attributed to this run; current process exits were
the deliberate force-stops and permission-change termination. No application code
was changed during these trials. This does not guarantee future crash-free operation.

Original Wi-Fi/mobile-data settings and all three camera/fine/coarse permission
records (including flags) matched the captured baseline. Master location restored
to on. Owner remains signed in, English restored, generic radius 500 m unchanged,
test bookmarks removed. Battery ended 35%, USB charging, 36.3°C. Camera clients
empty. App backgrounded from the selected ACLC map to conserve battery; Metro
remains running with USB port reverse for the presentation.

## Presentation setup

Use the installed development client with the laptop/Metro available. With this
localhost setup, keep the USB cable connected and port reverse active. For the AR
demo, select Featured Destinations → ACLC, then explicitly use development-only
Simulate arrival. The scene contains labeled research drafts. Hold a finger pad
briefly and release to interact; ordinary short taps remain the accepted platform
limitation. No simulated/draft session should award a Passport stamp.

If demonstrating external navigation, Google Maps may ask the owner to accept its
first-use terms. This test did not accept those terms on the owner's behalf.

For a short progress demonstration:

1. Leave Metro running and open the app before the meeting; first dynamic AR
   module loads and development-client cold starts can take noticeable time.
2. Show Featured Destinations and its provisional/content-readiness labels.
3. Select ACLC on the map and expand the sheet. Save/remove demonstrates the
   account journal; Profile → Saved Places exposes sync status.
4. Explore Nearby from the featured detail uses the destination-centered 500m
   search. Home Search Nearby instead uses the phone's current location; use
   Search This Area when intentionally browsing the remote ACLC viewport.
5. Directions can demonstrate walking/driving preview without starting a journey.
6. For AR, use explicit development simulation and Start in a textured, well-lit
   area. Let the owner demonstrate held interactions after the hands-on check;
   this smoke sweep has not revalidated control reliability on this branch.
7. Exit AR to release the camera. Do not describe simulation as verified arrival,
   approved content, or an earned visit stamp.
