# Approved AR system audio

The 2026-11-19 owner handoff approved five original 48 kHz, 16-bit, mono PCM one-shots. Android packages the supplied bytes as raw resources in the local AR system audio module. The audition reel remains outside the app. The handoff's `audio-review.json` documents each WAV, its SHA-256 and approval.

| WAV | Accepted AR event |
| --- | --- |
| `reveal.wav` | Exhibit reveal completes |
| `panel_open.wav` | A new panel finishes opening |
| `page_turn.wav` | A page change is accepted |
| `panel_close.wav` | A panel finishes closing |
| `view_switch.wav` | The incoming view finishes switching |

Android prepares each cue locally and requests brief audio focus before playback. Focus denial, loss, foreground loss, interruption or scene exit ends the cue without replay. Voice and effects remain independent preferences. Any future reviewed startup speech takes priority over effects. Older APKs lack the optional audio module and remain silent for the approved cues.

`voice-scripts.json` preserves the exact approved English, Japanese and Korean lines. `VOICE-GENERATION-BRIEF.md` remains a reference for future authorized recording work. There are no approved voice recordings, so production startup speech is silent in all three locales.

Physical Galaxy A53 playback, perceived loudness, and audio focus interruptions still need device verification.
