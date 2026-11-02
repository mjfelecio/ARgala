# Native video feasibility gate — stopped

**Result: failed controlled seeking/restart; production integration stopped.**
Galaxy A53 SM-A536E / Android16, existing Oct30 development APK, Expo57 /
React Native0.86.3 / Viro3.0.3, source based on b794c96, 2026-11-02.

An isolated ignored fixture used an original FFmpeg test pattern, initially4s
H.264/AAC and then8s for audio/seek controls. It was clearly a test pattern,
never destination imagery. No dependency/build, provider or client content was
added. Real camera and native AR tracking were live. ViroVideo buffered, explicit
Play/Pause advanced playback, and completion callbacks were observed. The owner
confirmed video operation but did **not** hear the first very quiet tone. The
fixture measured about−48dBFS peak before the player's0.1 gain; audibility was
therefore not established. OS media volume/mute/routing were inspected read-only;
no OS sound setting was changed.

Seeking2s and restart via `seekToTime(0)` exposed:

```
TypeError: Cannot read property 'dispatchViewManagerCommand' of null
```

Installed `components/ViroVideo.tsx:183` invokes
`NativeModules.UIManager.dispatchViewManagerCommand(...)`. `NativeModules.UIManager`
is null on the tested Fabric/bridgeless runtime. Moving restart through that
same API made Play hit the error too, matching the owner's repeated-error report.
This is a JavaScript runtime error screen, not evidence of a native process crash.
No repair or extra native media stack was applied under this feasibility task.

Both temporary app-file modifications were restored byte-for-byte against saved
SHA256 values; the app was restarted on the ordinary scene. The fixture remains
in ignored execution scratch, outside the application import graph and Git.
No video schema/player or unapproved video assets ship. Raw private recordings,
error capture and test pattern stay local under `/tmp/argala-cinematic-evidence`
and `.superpowers/sdd/2026-11-02-cinematic-ar-stories/video-spike`.

## Concrete next decision

1. **Smallest investigation:** a separately approved, version-checked JavaScript
   compatibility fix for Viro's Android command dispatch, with the existing native
   view manager/command probed first. This may avoid a new dependency or APK, but
   seeking, audio, captions, lost tracking and background behavior must still pass
   the same device matrix. No success is assumed from replacing one API name.
2. **Alternative product architecture:** explicitly suspend AR and open a native
   foreground player, then restore within the existing bounded session grace.
   This changes the approved in-AR contract and may add a native dependency/build;
   it needs owner approval before implementation.

The handoff's Task7 explicitly requires stopping for owner decision after unreliable
embedded playback. Photo-led stories and audio settings remain independently
reviewable. Client videos remain optional and the already-sent form is unchanged.
