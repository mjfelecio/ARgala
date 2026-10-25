# ACLC M1 native feasibility checkpoint

Status: implementation prepared; **no development APK built/installed and no physical Viro verification yet**. M2 scene/ring implementation must wait for physical Gate A. The full approved product flow and lifecycle clarifications are in the [implementation plan](superpowers/plans/2026-10-25-aclc-viro-vertical-slice.md).

## What this checkpoint adds

- Pinned `@reactvision/react-viro@3.0.3`, AR-only plugin mode, no cloud/geospatial provider. No new provider credentials, GPS, factual destination copy or media are required by this test.
- A single explicitly labeled ACLC development square, placed 1.5 native scene units ahead of the first horizontal pose under NORMAL tracking. It stays fixed in that native frame. Translation following and the 360° ring belong to M2.
- Tap feedback in Viro, tracking-limited dimming and retained square orientation/tap state after temporary same-frame tracking loss. A replacement scene acquires a fresh pose.
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

Install the resulting APK on the named physical test device and record the build ID, commit and APK SHA-256. This command has **not** been run for M1. Starting EAS or a local APK build requires the owner's per-build approval.

## Enter the test

Using that rebuilt development APK, start Metro from the same worktree:

```bash
EXPO_PUBLIC_VIRO_SPIKE=1 npx expo start --dev-client --clear
```

Sign in using the existing account flow, open Profile, and select **Viro feasibility test**. Press **Start native AR test**. Grant camera access using the contextual Allow action when needed. Existing app Settings remains the only language selector. Closing the test returns to Profile; the route does not activate the existing generic AR camera.

Disable the flag/restart Metro to hide the launch control. A release build ignores the flag. Unsupported/old-APK/transient/error paths remain localized; there is no geographic production bypass or persisted admission.

## Physical Gate A record

Candidate from previous app evidence: Samsung Galaxy A53 / SM-A536E, Android 16/API 36. Its current availability/charge, Google Play Services for AR installation/update state and Viro operation are **not established** by earlier camera-overlay smoke tests. Use a charged device; keep tests brief if battery/temperature is unfavorable.

Record each scenario as PASS / FAIL / NOT RUN with device, OS, build/APK hash, app locale, lighting, text scale and observed outcome. Do not put credentials, precise GPS coordinates, camera frames or raw native errors into ordinary application logs.

| Scenario | Required physical evidence | Current result |
| --- | --- | --- |
| Native startup | Real rear camera, NORMAL tracking, square rendered and tap changes its Viro label/material. Check Plus Jakarta Sans and CJK glyph behavior; record any fallback/font issue. | NOT RUN |
| Yaw/translation | Rotate and walk a few steps safely; world-stable square gives parallax, not a head-locked overlay. Inspect transform/tracking callbacks using a temporary debugger if needed, without committing frame/position logs. | NOT RUN |
| Same-frame tracking loss | Tap square, obscure/defocus scene, turn phone, regain NORMAL without remount. Square retains its world pose and tap state. | NOT RUN |
| Startup interruption | Background or trigger an AR-services system activity before first tracked pose. Return must not mount a new view or show another automatic install prompt. Retry is explicit. | NOT RUN |
| Permissions/install | Camera denial/permanent denial, revocation on background, missing/outdated AR services, accept/decline installation, unknown support, timeout and retry. Record whether native failures reach only logcat; never treat timeout as unsupported hardware. | NOT RUN |
| Bounds/lifecycle | Initial stack entry, repeated Back/Profile/reentry, foreground/background, dark OS theme, full portrait preview, positive native bounds and camera release after exit. | NOT RUN |
| App preservation | Real existing Maps, ordinary POI Details, Directions and Settings/auth still open; no microphone/background location prompt, no paid provider request caused by the spike. Compare any Fabric crash against the known baseline. | NOT RUN |
| Locale/readability | EN/JA/KO preflight/errors, long text/large system font, outdoor brightness, dark/bright camera scenes and native tap hit areas. | NOT RUN |

Gate A passes only after a real development APK demonstrates the above core integration on a named Android device. A passed export, config check, mocked callback or local manifest task is not this evidence. Specific installation failures/font/preview/native crashes remain integration issues until observed and resolved. If reliable tracking/startup cannot be demonstrated, stop downstream work and record the failure.

The local `:app:processDebugMainManifest` verification stopped because `ANDROID_HOME` points to a missing SDK directory. CNG and config introspection succeeded, but no final merged manifest or app-native compilation result is available from this host. Verify the merged manifest and permission blocks in the authorized EAS development build before physical acceptance.

Deferred minor from code review: a queued tracking-status callback from a disposed scene can briefly change guidance during Retry. It cannot grant readiness/admission or reposition the square; fence that display callback by attempt before the production session milestone.

No ACLC on-site GPS, approved entrance or location radius claim follows from M1. Those are separate later gates requiring client-verified inputs.

## Native build references

- [Pinned Viro package and peer dependencies](https://github.com/ReactVision/viro/blob/v3.0.3/package.json), [plugin options](https://github.com/ReactVision/viro/blob/v3.0.3/plugins/withViro.ts).
- [Pinned raw support callback](https://github.com/ReactVision/viro/blob/v3.0.3/components/Utilities/ViroUtils.tsx), [native startup handler](https://github.com/ReactVision/viro/blob/v3.0.3/android/viro_bridge/src/main/java/com/viromedia/bridge/component/VRTARSceneNavigator.java).
- [Expo SDK 57 camera reference](https://docs.expo.dev/versions/v57.0.0/sdk/camera/); permission adapter checked against installed 57.0.6 declarations/source.
