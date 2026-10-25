# ACLC M3 lifecycle verification

Status: implementation prepared for offline review; **M3 physical verification NOT RUN**. The owner stopped ADB verification and deferred it to2026-10-26. Do not start device commands until the owner resumes verification. The camera was released during the previous M2 trial; the task Metro server is stopped. No M3 APK was built or installed.

## Scope and entry

The existing approved Viro3.0.3 development APK can load this JavaScript through Metro. Native dependencies, configuration, recognizer and provider settings are unchanged. Follow the existing SDK57 dev-client launch flags and USB forwarding procedure in [the ring checklist](aclc-ar-ring-device-testing.md) when verification is resumed. No new APK is needed for the JS-only candidate; every later APK still needs separate per-build approval.

Profile → ACLC ring prototype remains behind both `__DEV__` and `EXPO_PUBLIC_VIRO_SPIKE=1`. The actual ring route now uses the M3 session owner. The original Viro feasibility square retains its explicit-retry M1 startup behavior. Only labeled development samples are available; this route is not production destination admission or a GPS simulation result.

A new owner is keyed by authenticated principal and has destination/admission/principal/provenance identity. The development admission ID is a component-owned correlation value, not a verified capability. M4 must supply the actual selected-destination single-use entry and fresh foreground eligibility validator. URLs and cache presence are not admission.

## Expected lifecycle

- Start is explicit. Read support and camera grants first. Permission requests need an explicit Allow action; an existing request remains shared outside disposable native views.
- Resolve the native module after successful preflight, before final mount readiness. Revalidate fresh pending-entry eligibility only after module loading, full-scene measurement and opening transition readiness. Missing/failed entry never mounts. A20s deadline bounds the complete startup; late work cannot revive it.
- Initial startup remains pending until a NORMAL tracking sample and usable horizontal pose. Permission/install interruptions before that require explicit Retry and fresh eligibility. They receive no live-session restoration exemption.
- First-use reveal begins only after tracking-ready: Overview first, remaining tiles sequentially over approximately2.4s. Skip is ordinary utility chrome. Lost tracking pauses reveal; reduced motion and completed/recovery sessions are quick.
- Native panel selection/pages and the actual reading controller remain above the disposable native navigator. Reading-size save errors and unsaved local size survive native unmount. A separate one-time intro flag is the only added persisted data (`argala.ar-introduction.v1`). No live admission, pose, coordinates, provider data or camera frames are stored.
- Background/blur immediately removes the native scene. An established live session can return within strictly less than300000ms after suspension, after focus/foreground/transition/permission checks. Restore logical panel/page from a newly captured coordinate frame; do not reuse old spatial transforms. New admission/selected destination/principal/provenance changes invalidate the old owner.
- Recovery startup interrupted by a system activity requires explicit Retry; the previous live exemption is retained only while the original grace remains valid. No automatic remount loop may reset Viro's per-view install-request flag.
- Exactly five minutes, clock rollback, explicit Exit, screen disposal/process death or auth change ends restoration authority. New entry requires fresh verification. Once a legitimate session is live, there is no continuous GPS/radius enforcement.
- Within one surviving native coordinate frame, temporary tracking loss dims/freezes interaction and retains basis/focused transform/page. A new NORMAL pose resumes updates without recentering. Explicit Recenter or a fresh native frame is the only new basis.
- Keep the accepted finger-pad, hold-briefly, release technique. Accurate visible-surface hits and decorative input exclusion remain in place; short-tap reliability is not claimed.

## Native error limitation

The pinned Android bridge's [StartupListenerARCore.onFailure](https://github.com/ReactVision/viro/blob/v3.0.3/android/viro_bridge/src/main/java/com/viromedia/bridge/component/VRTARSceneNavigator.java) logs the startup failure and exposes no JavaScript renderer-startup event. The support API also collapses installed/not-installed/update-required supported states into one supported enum. Do not invent an installation-result callback or parse raw log/error strings into UI.

Interrupted startup shows explicit Retry. A native failure that produces neither usable tracking nor an interruption reaches the localized bounded startup-timeout recovery. This is safe fallback behavior, **not precise AR-services failure classification**. Install/update/decline scenarios remain unverified. A future native bridge change would require a concrete patch, native validation and separately approved rebuilt APK; no such change is included here.

## Physical checklist — all NOT RUN for M3

Use the same named Galaxy A53 candidate after charging; record actual battery/configuration at verification time. Keep camera captures private/local and out of Git. Automated tests replace native boundaries and cannot pass these rows.

| Scenario | Required observation | Result |
| --- | --- | --- |
| First-use permission | Existing grants are read first; denial/Settings/Allow behave correctly; permission activity never duplicates a prompt on resume | NOT RUN |
| Native install/service failure | Test actual install/update/decline when practical; explicit recovery, no repeated automatic prompt, no raw errors; document timeout limitation | NOT RUN |
| Pending interruption | Background before first tracking-ready; return requires Retry, does not start a camera automatically | NOT RUN |
| Reveal | No reveal before ready; Overview first, sequential tiles, Skip, quick repeat; reduced-motion behavior | NOT RUN |
| Live background/return | Open History/page/A+, background briefly, verify camera release, resume/reacquire; same logical reading progress at the new frame | NOT RUN |
| Recovery interruption | Interrupt reinitialization; return requires explicit Retry with no automatic native view/prompt loop | NOT RUN |
| Expiry/Exit | Expired session and Exit cannot restore authority; old callbacks cannot revive camera; new entry verifies again | NOT RUN |
| Same-frame loss/turn/recovery | Hold selected panel, lose tracking, turn, recover: no automatic ring recenter and same focused transform/page | NOT RUN |
| Navigation/auth | Settings/Back/blur release and restore correctly; auth change/explicit Exit dispose the old owner | NOT RUN |
| Locale/reading | EN/JA/KO through existing Settings, all sizes/pages/fallback glyphs and errors; no clipped text, alpha rectangles or one-sided controls | NOT RUN |
| Appearance/performance | Bright/dark/outdoor backgrounds, large system text, measured pose/output pressure and actual animation/touch behavior | NOT RUN |

The deterministic4:59/5:00 boundary is automated evidence; it does not establish physical permission/camera behavior. The M2 broader rotation/translation/CJK/contrast/performance checklist remains partial. Actual ACLC on-site GPS/arrival is a separate M4+ gate requiring approved activation coordinates/content/provider association; M3 contains no GPS watcher or paid provider request.
