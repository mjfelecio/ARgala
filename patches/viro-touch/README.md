# Viro Android tap correction

Owner-approved on 2026-11-08, replacing the temporary hold/release workaround.
This is a native runtime candidate; a rebuilt APK and Galaxy A53 acceptance are
still required. Do not deliver the new tap guidance to an older native runtime.

## Recognizer and packaging

The pinned [Viro 3.0.3 listener](https://github.com/ReactVision/virocore/blob/v3.0.3/android/sharedCode/src/main/java/com/viro/core/internal/ViroTouchGestureListener.java)
only synthesizes a stationary click below 50 ms. Its other path needs MOVE after
50 ms. The vendored listener retains its MIT notice and scale/rotation/drag
routing, adding Android `GestureDetector.onSingleTapUp` for stationary releases.
Long-press and double-tap recognition are disabled. There is no hold-duration or
pressure requirement. Platform touch slop rejects swipe fallback; a dispatch
fence prevents duplicate Down/Up pairs after the existing path has started.
Canceled/intercepted gestures and pointer changes retire the fallback. ARCore's
renderer does not support CANCEL, so cancellation never synthesizes a completing
UP. The next gesture starts with fresh listener ownership.

`npm ci` applies only the version-checked Gradle hook and verifies the pristine
AAR checksum. During the native build, `renderer.gradle` checks the version,
archive and original listener hash, compiles the replacement as Java 17, and
publishes a generated AAR through Viro's existing `default` artifact with task
dependencies. Outputs stay under the dependency's Gradle build directory. All
other archive entries, including native libraries and other classes, are
preserved. No C++ fork, runtime dependency or generated Android edit is needed.

JavaScript still uses the existing completed `onClick` callback. Visible control
geometry, one event owner per control, and current tracking/Help/lifecycle guards
remain responsible for admitting actions. This correction does not establish
short-tap reliability in the native renderer on a physical phone by itself.

## Automated verification

Run `npm run test:viro-touch` with JDK 21 installed (the test framework's Android
16 classes require it). The checksum-pinned Gradle 9.3.1 wrapper downloads test
dependencies on first use; no Android SDK, emulator, APK or device is needed.
The production replacement remains Java 17 bytecode.

- Robolectric exercises Android API 36 MotionEvents/GestureDetector and the
  listener from the actual default AAR, mocking only the renderer/JNI boundary.
  Stationary timing boundaries, jitter, existing MOVE dispatch, repeated taps,
  cancellation, multitouch, interception and destruction are covered.
- An archive test compares every resource, native library and class entry,
  allowing only the listener to differ, and checks Java 17 bytecode.
- Temporary Gradle fixtures reject changed package/AAR/class identities,
  including changed class-check metadata after extraction is already up to date.
- The normal project suite retains scene hit ownership, disabled controls,
  queued-callback fences and actual EN/JA/KO guidance coverage. CI runs both suites.

## Physical acceptance before claiming reliability

After separate owner approval, build one development APK containing this patch
and the already-merged SDK 57 maintenance updates. On the Galaxy A53, require
20 consecutive normal tap/open-close cycles under NORMAL tracking with settled
transitions. Verify Next/Previous, Close, text-size controls and available Retry;
each accepted tap must act once, with no page skipping or hold/finger-pad hint.
Check rapid taps against transition guards, gesture cancellation/multitouch,
Help, tracking interruption and background/refocus. Recheck JA/KO guidance and
glyphs. Record results in the session device checklist. No APK has been built or
installed for this correction yet.
