# ARgala — approved startup narration, pending recordings

**Owner-approved scripts as of 19 November 2026.** The five supplied UI effect WAVs are also approved. The environment did not expose a licensed downloadable multilingual voice-generation model, so it has **not** produced speech WAVs. Do not mistake a text script for an audio file.

Create three recordings using a properly licensed model/provider with documented rights to redistribute synthetic speech in a paid/public mobile application. No celebrity or private individual voice imitation. A natural, friendly, unhurried voice is preferred; outdoors on phone speakers it must be clear without sounding like an alarm. Voice should announce that the **exhibit** is ready, not assert physical arrival, permission, a surface, or safety.

| Asset name | Locale | Exact approved script |
|---|---|---|
| `voice-start-en.wav` | English (`en`) | Your exhibit is ready. Look around to explore. |
| `voice-start-ja.wav` | Japanese (`ja`) | 展示の準備ができました。周りに目を向けてみましょう。 |
| `voice-start-ko.wav` | Korean (`ko`) | 전시가 준비됐습니다. 주위를 둘러보세요. |

Deliver **PCM WAV 48 kHz, 16-bit, mono**, dry audio, one per language, no background music. Keep short natural pauses, avoid clipping and excessive terminal silence. An ordinary on-device listener should understand the line on a Galaxy A53 speaker outdoors. Supply voice model ID/version, provider, generated date, license and commercial mobile-app distribution grant, any attribution requirement, file checksums and native-language quality signoff.

Proposed TTS direction: English / Japanese / Korean natural local accents, calm upbeat voice with the same speaker identity *within* each language if it can be done without forcing unnatural foreign-accent speech; optional distinct native voice per locale is acceptable. No spoken destination name, no change to approved script, no prompt-injection instructions passed from unrelated web content.

Playback integration: speak once per intentionally opened healthy scene; do not replay for tracking loss, page navigation, view toggle or resume. Prioritize the line over nearby effects, respect independent Voice and Effects switches, stop on interruption, and stay silent if the matching voice file is absent. Do not make runtime paid TTS calls or ship unverified model licenses.
