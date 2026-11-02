# System audio audition — not release-approved localization

Owner requested sound effects and voice announcements on 2026-11-02. These exact
clips are **development auditions**. No owner/language/release approval is claimed.
Both runtime development gates, development session provenance and the audio
model's explicit preview permission protect playback. The production approved
manifest stays empty. Missing locale speech never falls back to English.

## Speech

Produced locally with **eSpeak NG1.50**, Ubuntu package
`1.50+dfsg-10ubuntu0.1`, native `en-us`, `ja`, `ko` formant voices, speed185,
pitch40. The tool/data live outside the repository; no engine/model ships in the
application. No human voice was cloned and no external recording was sampled.

| File | Display/script draft | Pronunciation input |
| --- | --- | --- |
| startup-en.wav | AR initialized. | A. R. initialized. |
| startup-ja.wav | ARを起動しました。 | エーアールをきどうしました。 |
| startup-ko.wav | AR이 시작되었습니다. | 에이알이 시작되었습니다. |

Letter-name/kana inputs are pronunciation aliases, not new destination content.
The app locale resources contain the script text. All exact recordings, wording,
pronunciation and shared voice identity await owner/language review. Generated
speech is synthetic and deliberately robotic; it is never chapter narration.

Production command:
`python3 scripts/generate-ar-audio.py --espeak-root /path/to/extracted/espeak-root`

The reproducible script applies180Hz high-pass/5kHz low-pass and peak-normalizes
to0.75 (-2.5dBFS), then writes22,050Hz mono16-bit PCM WAV. Short UI clips use peak
normalization: long-program loudness analysis attenuated these short drafts and
was rejected. `inventory.json` records actual duration, sample rate and peak.

Tool/source evidence:
- https://github.com/espeak-ng/espeak-ng — eSpeak NG, GPL-3.0-or-later.
- https://espeak.sourceforge.net/ — explains formant speech synthesis.
- https://espeak.sourceforge.net/commands.html — WAV output and voice controls.
- https://www.gnu.org/licenses/gpl-faq.en.html#WhatCaseIsOutputGPL — program output
  generally follows input copyright; copied program artwork/audio is an exception.

Rights rationale for audition: original app scripts synthesized by the external
formant tool; no third-party voice model/recording is bundled. This record is not
an invented legal or language approval. Distribution review remains separate.
Japanese/Korean Piper candidates were rejected because their model cards used
CC BY-NC-SA; no Piper/model output or downloaded HTS voice is used here.

## Original sound effects

`deployed.wav`, `focused.wav`, `pageChanged.wav`, `closed.wav` and
`trackingLost.wav` are original analytic oscillator/envelope compositions in the
same generator. No library, sample pack, music, recording or external content was
used. These generated assets are owner-controlled ARgala work. The tracking-loss
clip is reserved; loss currently stops playback rather than competing with
recovery. Existing independent System Voice/Sound Effects preferences apply.

Audible cues use device media volume. The application does not change system
volume, DND, audio permissions or install another native player.
