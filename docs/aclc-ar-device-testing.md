# ACLC M1 native feasibility checkpoint

Status: the approved [development APK](https://expo.dev/artifacts/eas/xCwGwSwy5ztzenU8RU19Z06JjtsDUhrH3bOPLc8VdUw.apk) was built successfully from `fa29e8e`; installed APK identity verified; physical camera/tracking observed; the owner accepts held interaction as passable using the finger pad. Short taps remain unreliable; remaining AR-services and presentation checks are pending. [EAS build](https://expo.dev/accounts/mjfelecios-team/projects/argala/builds/91f33401-365b-4ec0-b0c2-23c1f0c4ec25). M2 scene/ring implementation must wait for physical Gate A. The full approved product flow and lifecycle clarifications are in the [implementation plan](superpowers/plans/2026-10-25-aclc-viro-vertical-slice.md).

## What this checkpoint adds

- Pinned `@reactvision/react-viro@3.0.3`, AR-only plugin mode, no cloud/geospatial provider. No new provider credentials, GPS, factual destination copy or media are required by this test.
- A single explicitly labeled ACLC development square, placed 1.5 native scene units ahead of the first horizontal pose under NORMAL tracking. It stays fixed in that native frame. Translation following and the 360° ring belong to M2.
- Completed-interaction feedback in Viro (temporary hold-then-release guidance), tracking-limited dimming and retained square orientation/tap state after temporary same-frame tracking loss. A replacement scene acquires a fresh pose.
- A 20 s deadline across support check, permission check and first tracked pose. The native support callback uses enum values, not parsed English errors. SUPPORTED establishes hardware capability, not installed/current AR services. Viro's startup failures may only appear natively; an unreported failure becomes a localized timeout with explicit Retry.
- Permission and initialization attempt ownership lives above the native navigator. Blur/background unmounts the native scene and retires unfinished callbacks. **M1 always needs explicit Retry after interruption, including a previously live test.** The later production session/grace policy is not implemented or simulated by this square.
- A shared in-flight camera permission operation; checks do not prompt, Allow is explicit, settled grants are rechecked. Microphone/storage/location convenience requests are never used.
- Passive permission reads are independently retireable. A delayed read rechecks foreground attempt ownership immediately before any request; a hung read cannot block explicit Retry or poison route reentry. Only an already-started OS permission activity remains shared until it settles.
- Camera/AR features remain optional in the generated Android manifest, preserving ordinary map use on unsupported AR hardware. SDK 57 manifest mods run in reverse registration order: `plugins/with-optional-ar.js` is listed before Viro so its normalization runs after Viro replaces the feature array. Final merged-manifest verification is separate from config introspection.

## Prepare the concrete development build

Run required automated checks first, review the branch, and obtain the owner's approval for this specific development APK. The existing development APK cannot load Viro through Metro. Reuse the current EAS project and signing credentials; do not reinstall or reset the app's stored session/preferences unnecessarily.

After approval, from the implementation worktree:

```bash
npx eas-cli@latest build --platform android --profile development
```

Install the resulting APK on the named physical test device and record the build ID, commit and APK SHA-256. The owner approved this one M1 build and it finished successfully; the artifact record below identifies it. Any additional EAS or local APK build requires separate approval.

## Enter the test

Using that rebuilt development APK, start Metro from the same worktree:

```bash
EXPO_PUBLIC_VIRO_SPIKE=1 npx expo start --dev-client --clear
```

Sign in using the existing account flow, open Profile, and select **Viro feasibility test**. Press **Start native AR test**. Grant camera access using the contextual Allow action when needed. Existing app Settings remains the only language selector. Closing the test returns to Profile; the route does not activate the existing generic AR camera.

Disable the flag/restart Metro to hide the launch control. A release build ignores the flag. Unsupported/old-APK/transient/error paths remain localized; there is no geographic production bypass or persisted admission.

## Physical Gate A record

Candidate from previous app evidence: Samsung Galaxy A53 / SM-A536E, Android 16/API 36. The owner made this device available on 25 October. Current Viro evidence is recorded below; earlier camera-overlay smoke tests are not Viro evidence. Use a charged device; keep tests brief if battery/temperature is unfavorable.

Record each scenario as PASS / FAIL / NOT RUN with device, OS, build/APK hash, app locale, lighting, text scale and observed outcome. Do not put credentials, precise GPS coordinates, camera frames or raw native errors into ordinary application logs.

| Scenario | Required physical evidence | Current result |
| --- | --- | --- |
| Native startup | Real rear camera, NORMAL tracking, square rendered and holding then releasing changes its Viro label/material (temporary owner-approved M1 guidance). Check Plus Jakarta Sans and CJK glyph behavior; record any fallback/font issue. | PARTIAL — real camera/NORMAL/square and owner accepts the updated English held interaction as passable with a finger-pad technique. Short taps remain unreliable; native font identity/CJK/readability were not separately scored. |
| Yaw/translation | Rotate and walk a few steps safely; world-stable square gives parallax, not a head-locked overlay. Inspect transform/tracking callbacks using a temporary debugger if needed, without committing frame/position logs. | PASS for brief handheld yaw/sideways movement — owner confirms original room position and natural parallax. Extended walking not run. |
| Same-frame tracking loss | Tap square, obscure/defocus scene, turn phone, regain NORMAL without remount. Square retains its world pose and tap state. | PASS — owner observed tracking lost, turned the phone, then recovered the same square orientation/position and tap state. |
| Startup interruption | Background or trigger an AR-services system activity before first tracked pose. Return must not mount a new view or show another automatic install prompt. Retry is explicit. | NOT RUN |
| Permissions/install | Camera denial/permanent denial, revocation on background, missing/outdated AR services, accept/decline installation, unknown support, timeout and retry. Record whether native failures reach only logcat; never treat timeout as unsupported hardware. | PARTIAL — timeout release, ADB revocation, explicit OS prompt/denial and no automatic re-prompt on resume observed. Original grant/flags restored. AR-services install/update/decline and denied-settings screen not run. |
| Bounds/lifecycle | Initial stack entry, repeated Back/Profile/reentry, foreground/background, dark OS theme, full portrait preview, positive native bounds and camera release after exit. | PARTIAL — stack entry/reentry, background release, explicit Retry, Exit to Profile and map return observed; aspect ratio/OS-theme checks pending. |
| App preservation | Real existing Maps, ordinary POI Details, Directions and Settings/auth still open; no microphone/background location prompt, no paid provider request caused by the spike. Compare any Fabric crash against the known baseline. | PARTIAL — retained auth, map and Profile/Settings opened; no discovery/route search. Live POI Details/Directions not exercised. |
| Locale/readability | EN/JA/KO preflight/errors, long text/large system font, outdoor brightness, dark/bright camera scenes and native tap hit areas. | PARTIAL — English controls and square observed at font scale 1.1; CJK/large text/outdoor not run. |

Gate A passes only after a real development APK demonstrates the above core integration on a named Android device. A passed export, config check, mocked callback or local manifest task is not this evidence. Specific installation failures/font/preview/native crashes remain integration issues until observed and resolved. If reliable tracking/startup cannot be demonstrated, stop downstream work and record the failure.

The local `:app:processDebugMainManifest` verification stopped because `ANDROID_HOME` points to a missing SDK directory. CNG and config introspection succeeded, but no final merged manifest or app-native compilation result is available from this host. The finished EAS APK has now passed the static manifest/permission checks recorded below; the local SDK remains unavailable and physical acceptance is still pending.

Deferred minor from code review: a queued tracking-status callback from a disposed scene can briefly change guidance during Retry. It cannot grant readiness/admission or reposition the square; fence that display callback by attempt before the production session milestone.

No ACLC on-site GPS, approved entrance or location radius claim follows from M1. Those are separate later gates requiring client-verified inputs.

## Native build references

- [Pinned Viro package and peer dependencies](https://github.com/ReactVision/viro/blob/v3.0.3/package.json), [plugin options](https://github.com/ReactVision/viro/blob/v3.0.3/plugins/withViro.ts).
- [Pinned raw support callback](https://github.com/ReactVision/viro/blob/v3.0.3/components/Utilities/ViroUtils.tsx), [native startup handler](https://github.com/ReactVision/viro/blob/v3.0.3/android/viro_bridge/src/main/java/com/viromedia/bridge/component/VRTARSceneNavigator.java).
- [Expo SDK 57 camera reference](https://docs.expo.dev/versions/v57.0.0/sdk/camera/); permission adapter checked against installed 57.0.6 declarations/source.

## Approved native build and artifact inspection — 25 October 2026

- Build: [91f33401-365b-4ec0-b0c2-23c1f0c4ec25](https://expo.dev/accounts/mjfelecios-team/projects/argala/builds/91f33401-365b-4ec0-b0c2-23c1f0c4ec25), status **FINISHED**, completed `2026-10-25T07:43:18.768Z` (15:43 Asia/Manila).
- Source: `fa29e8e76f20750582e5fcea04e96840640eea20`; EAS CLI 25.3.0; Android `development` profile, internal APK, existing remote keystore reused with credential changes disabled. CI run 40172052234 passed before submission. Only one build was submitted under this approval.
- [Download APK](https://expo.dev/artifacts/eas/xCwGwSwy5ztzenU8RU19Z06JjtsDUhrH3bOPLc8VdUw.apk); size 308,575,060 bytes (~294 MiB).
- APK SHA-256: `0b756a3f883042a70c70d44d28d44fffad4a726828867e881a1d0a5daa5dff95`.
- Gradle: **BUILD SUCCESSFUL**, including manifest processing, native compilation and `assembleDebug`.
- Static final-APK inspection using Android AAPT2: package `com.mjfelecio.argala`, camera and AR-camera features optional, ARCore metadata `optional`, camera permission present, microphone/background-location permissions absent, native Maps key metadata present (value not recorded).
- ZIP/DEX inspection: arm64 Viro renderer/ARCore libraries and Viro package/module classes present. These checks prove packaging, not native initialization, tracking, font rendering, touch behavior or live Maps/provider operation.
- A direct unauthenticated download returned HTTP 403; authenticated `eas build:download --build-id 91f33401-365b-4ec0-b0c2-23c1f0c4ec25` succeeded. A checksum-verified local copy is retained at `/home/kirbysmashyeet/.cache/argala/builds/91f33401-365b-4ec0-b0c2-23c1f0c4ec25/argala-development.apk` for later in-place installation.
- No ADB command, installation, simulator session or physical test was run. The owner reports the phone is unavailable and will notify when ready; every scenario in Gate A remains NOT RUN. Do not start M2 before that gate passes.

## Physical session — 25 October 2026

- Device: Samsung Galaxy A53 / SM-A536E, Android 16/API 36; existing Google Play Services for AR 1.44.241490493. English UI, previously recorded font scale 1.1. Indoor handheld check; exact lighting quality and native font identity are not established.
- The already-installed APK SHA-256 exactly matched the approved artifact above. No reinstall, application-data reset, permission reset, new APK build or credential change was performed. Retained authentication and the existing native Google map opened. Discovery remained unsearched; the test did not initiate a Places/Routes request.
- Metro served the opt-in test from the implementation worktree over ADB reverse. Native NORMAL tracking plus valid first horizontal pose reached “Tracking ready.” The owner confirmed **live camera and square visible** on the phone. An initial ADB capture appeared black behind the controls; capture output alone was not treated as proof of camera failure.
- **Touch failure reproduced:** the owner tapped the square with the original full-screen utility overlay and reported no response. A controlled JS-only diagnostic removed that overlay after readiness, leaving the same Viro square/click handlers. The owner then confirmed **“Tap received” appears**. This was an isolated observation; press duration was not controlled, so it does not isolate the overlay as the cause of the later short-tap failure; the utility overlay was then limited to its top controls/content instead of full-screen bounds. With the original controls restored, the owner confirmed **tap works with controls visible**. The diagnostic removal was reverted; Viro click handlers were unchanged. This isolated comparison does not establish repeatable interaction; mocked callbacks cannot prove native hit routing.
- Camera disconnect was observed after Home/background. Return displayed the interrupted state and explicit Retry, with no automatic scene restart. A later startup without a usable tracked pose reached the localized 20 s timeout and disconnected the camera; timeout was not classified as unsupported hardware. No AR-services installation/update prompt occurred with the already-installed service.
- Battery began at 25% with USB charging; the final read was 17% / 39.5°C. Camera was paused during investigation; no extended walking/performance test ran. The app was returned to Home after checks, with camera disconnected. No camera frames, precise locations or raw native errors are included in this repository record.
- The owner confirmed **stays in place with parallax** after turning away/back and moving the phone sideways. This establishes brief handheld world stability; extended walking/performance is not established.
- The owner confirmed **tracking lost, then same square and tap state** after covering the rear camera, turning the phone, then uncovering it and returning to the same view. The native camera had remained connected since the last explicit Retry before this check; no reset/Retry was requested during the recovery scenario.
- ADB briefly disconnected; the first Exit/revocation commands did not execute. After reconnecting, camera disconnect and Profile were observed. Restoring `adb reverse` recovered the development-client connection without another build. Camera permission was then revoked through ADB while backgrounded. Start displayed the contextual Allow guidance without opening an OS prompt or connecting the camera. Explicit Allow opened Android’s real permission dialog; choosing Don’t allow resulted in the interrupted/Retry screen, and a further Home/resume did not prompt or mount the camera. The OS marked the denial `USER_FIXED`; that flag and the camera grant were restored to their exact original state (`granted=true`, `USER_SET` plus sensitivity flags). The denied-settings screen and post-grant tracking were not rerun.
- Exit returned to Profile and Explore/map reopened. The camera remained disconnected throughout revoked-permission checks and exit. Final Home leaves sensors inactive; `stay_on_while_plugged_in` remains its original `0`.
- **Repeatability failed:** after the single successful restored-controls tap, the owner reported that taps remain unreliable across text/panel/border. The overlay correction is partial evidence, not a passed touch gate. The later diagnosis and owner-approved held interaction are recorded below. **Gate A remains pending** for the unexercised AR-services install/update/decline, denied-settings and presentation cases above. No ACLC GPS/on-site validation or M2 implementation follows from these partial observations.

### Temporary hold interaction decision and offline follow-up

After the initial successful interaction, the owner reported unreliable short taps in all square regions and apparent persistence of the clipped “ACLC Tap” label. A shared parent `ViroNode` now owns completed-click handling for text, fill and border. Focused regressions reproduced cancellation when Down/Up resolved to separate child handlers and passed after sharing the owner. This addresses that event-owner problem; it does not repair native short-tap recognition.

A temporary coordinate-free probe showed native click completions under NORMAL tracking and alternating committed React selection state. The owner initially reported reliable alternation, then clarified that longer holds worked while normal short taps did not. The earlier isolated tap and “reliable” response therefore do **not** constitute a passed short-tap gate. A local device capture also established that 24-point native text was clipped to “ACLC Native” / “ACLC Tap”; no camera frame is committed.

The pinned native `ViroTouchGestureListener` only synthesizes a stationary tap on release below 50 ms, while the hold path needs a MOVE event after that threshold. A stationary ordinary press at/above the threshold can be lost. Inspection of the exact packaged AAR’s Java bytecode confirmed this branch; the packaged code contains the same condition. [Pinned source](https://github.com/ReactVision/virocore/blob/v3.0.3/android/sharedCode/src/main/java/com/viro/core/internal/ViroTouchGestureListener.java).

The owner explicitly chose to keep this as a platform limitation **for now**, defer native correction, and guide users to **hold briefly, then release**. No minimum hold duration or universal hold reliability is claimed. EN/JA/KO guidance and label copy follow that instruction; native label size was reduced to fit the existing square, retaining its font family and scene geometry. Final readability and the updated held interaction require later phone verification. Temporary diagnostics were removed. The uncommitted native-correction draft was removed without patching the installed library; Viro’s package/AAR/Gradle exports and the existing native-patch set remain unchanged. No APK was built.

Further ADB work stopped at the owner’s request. The camera was backgrounded before offline investigation. Existing original camera permission/flags had been restored after the earlier permission tests. Gate A and M2 remain pending; no on-site GPS or production arrival claim follows from this session.

## Resumed held-interaction verification — 25 October, 18:28 onward

The owner made ADB available again for final guidance/readability checks on JS source `3b764ef`, using the existing approved development APK. The Galaxy A53 began at 7% battery, USB charging, 37.5°C, with the original granted camera permission/flags unchanged. No permission changes, reinstall, native correction or APK build were performed.

- The owner reported a crash after Start. The visible development screen showed `Render Error: Could not load bundle` / `LoadBundleFromServerRequestError` for the lazy destination-scene module. The app process remained alive, the Android crash buffer was empty, and `adb reverse --list` had lost the Metro port mapping. This establishes a development bundle-loading failure; it does not establish a native renderer crash.
- Restoring USB forwarding, preloading the exact scene module from Metro (5,702,348 bytes), and reopening the same client cleared that loading failure. The camera connected at 18:37:19 and disconnected at 18:37:37 after the bounded startup failed to reach its first tracked horizontal pose. The UI displayed the localized startup timeout and explicit Retry. No tracked square or successful held interaction was observed in this attempt.
- The owner was asked to hold the phone upright toward a textured area, Retry, and move gently to synchronize a subsequent physical attempt. While waiting, the camera remained off. Final label readability and held-interaction checks remain pending; this attempt does not supersede earlier tracking/parallax observations or clear Gate A.
- Fresh `npm run typecheck` and `npm run lint` passed. Application code is unchanged; the previously recorded 727-test full check was not rerun for this evidence-only update. No native tracking, on-site GPS, service-install or localization claim follows from Metro preloading.

## Owner acceptance of held interaction — 25 October, 18:49 follow-up

After the upright Retry, the owner reported that the experience was “a lot more stable” and **passable**, and that using more of the finger pad helped compared with a tiny fingertip contact. Record this as owner acceptance of the temporary held interaction, not proof that touch area is the cause or a measured native requirement. Ordinary short taps and native recognizer correction remain deferred.

The native camera connected at 18:49:46 and remained connected until the agent returned the app to Home at 18:54:06. Camera disconnect was verified. This resolves the prior pending owner-held Retry; native font identity, CJK, outdoor/large-text readability and the unexercised AR-services cases remain separate checks. The owner did not separately score full-label readability.

A concise finger-pad hint was added to live guidance in EN/JA/KO, with the same hold/release action and native recognizer. No pressure/area threshold or larger invisible hit area was implemented. This final wording is covered through actual locale resources and the real screen test path; it has not been separately rechecked on the phone. No new APK, native correction, paid provider action or ACLC GPS verification was performed.
