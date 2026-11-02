# Cinematic AR audio review inventory

Development audition is implemented. Production/language approval is pending.
Both saved preferences default to **on**, per owner instruction. The production
`approvedSystemAudio` manifest remains empty; the guarded development manifest
contains preview-only clips. Missing localized speech never falls back to English.

| Cue | EN draft | JA draft | KO draft | Status |
| --- | --- | --- | --- | --- |
| First tracking-ready entry | AR initialized. | ARを起動しました。 | AR이 시작되었습니다. | Synthetic recordings prepared; wording/pronunciation/release review pending |
| Deployment | Original420ms soft sweep | Same | Same | Development audition |
| Accepted focus | Original100ms confirmation | Same | Same | Development audition |
| Page / Close | Original65ms tick /120ms descending cue | Same | Same | Development audition |

Exact WAV files, production command, speech-tool/version, pronunciation aliases,
rights rationale and signal inventory: [audio asset record](../../../assets/development/ar-audio/README.md).
No runtime TTS, cloud speech account, model, engine binary, new native dependency
or new APK is used. Scripts are app-owned system announcements; no destination
narration or client research content is generated.

The development preflight **Preview full entrance** action auditions the full
startup even when cinematic history is already saved. It does not clear history
or grant verified admission. Verified destination entry cannot receive the
preview manifest; runtime development guards and model `previewOnly` ownership
also reject preview playback outside that path. Preflight identifies the clips
as synthetic drafts. Short speech uses peak normalization; long-program loudness
estimation was rejected after it muted these short clips. No OS volume/DND is
changed. Preview playback levels are0.45 voice /0.35 effects within Viro.

Actual Galaxy A53 check: the owner explicitly confirmed **“Heard the voice and
effects”** for the English startup/deployment audition. This establishes audible
preview operation on that existing APK, not approval of all scripts, languages,
volume levels or an exhaustive interruption matrix. JA/KO signal files and
locale selection are verified automatically; pronunciation needs human review.

The player permits one cue at a time; it does not queue interruptions. Playback
instances have monotonic IDs so a retired native finish cannot stop a newer cue.
Help, tracking loss, language/preferences changes and foreground ownership can
stop the current cue. Optional audio imports cannot block camera entry. Late
assets update the current owner for future events without remounting the camera
or speaking a missed startup line. The reserved tracking-loss file is not emitted;
loss currently cancels playback. Return/recovery never repeat startup speech.

Before populating the production manifest, record exact recording hashes,
script/pronunciation reviewer, owner decision/date and final distribution rights.
Then test actual EN/JA/KO audio, all four preference combinations and Android
volume/interruption/background behavior. No reviewer or approval is invented.
