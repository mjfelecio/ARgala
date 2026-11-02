# Destination Stories device trial — 2026-11-01

## Configuration

- Samsung Galaxy A53 / SM-A536E, Android 16; 1080×2400, physical 450 dpi,
  existing 420 dpi override, system font scale 1.1, dark OS theme.
- Existing development APK, version 1.0.0/code 1, last updated 2026-10-30.
  SHA-256: `ad5cc55cf6259bb4f93abd8ef9c0a702770aaa7a3045d850b8bc9d7de0403d0e`.
  Google Play Services for AR 1.44.241490493. No build or reinstall.
- Camera and foreground location grants already present. Notification and
  background-location grants remained denied. Existing sign-in/data retained.
- Start: 35% battery, USB charging, 38.3°C. No system display settings changed.
- JavaScript: `feat/ar-destination-stories`, initial `de5943b`, followed by
  reader-layout corrections committed as `09e950a`. Development opt-in,
  localhost Metro 8082 and USB reverse; no simulated GPS or geographic admission.

## Observations

| Scenario | Evidence/result |
| --- | --- |
| Existing APK / native scene | PASS for this trial: live rear-camera view, native Overview panel and page 2/4 captured around 19:40. Five development chapters; no production tourism claims. |
| Text readability | Owner: “its readable”. This is normal-scale English evidence, not every reading size/locale. |
| Right content margin | PASS on `09e950a`: after rejecting the original and estimated-width versions, the owner confirmed the native-flow version fills the content width naturally: “yes it works now”. |
| Bottom reading controls | PASS on `09e950a`: the owner confirmed visible padding below A−/A+/Close after the correction from 0.005 to 0.04 world-unit clearance and a 0.04 row gap. |
| Held controls | PARTIAL: Overview page 2/4 was observed. A complete Previous/Next/A−/A+/Close sweep was not explicitly confirmed. Accepted brief finger-pad hold/release remains required; no short-tap reliability claim. |
| Camera release | PASS for the observed return: camera connected at 19:40:00, disconnected at 19:41:15; subsequent Explore screenshot and empty active-client list agree. Not a complete background/restoration matrix. |
| Help / large system text | NOT RUN as a complete native acceptance check. Automated coverage is separate. |
| Japanese / Korean | NOT RUN on device in this trial. |
| Approved images / captions | NOT RUN on device: approved destination media was not supplied. Automated fixtures do not establish native fit. |
| Unsupported-device reader | NOT RUN: this handset supports native AR. |
| Photo save/share / on-site GPS | NOT RUN. Development entry never earns Passport progress. |

The initial download failed when USB reverse disappeared. Logs showed transport
EOF and no reverse mapping; restoring it and reopening the same APK loaded the
app. Later session interruptions/reloads are not evidence of renderer crashes.
Private app captures and scoped diagnostics remain in ignored local test storage;
camera frames and account/provider content are not committed.

## Corrections and verification limits

The reader's former fixed row estimates became visible hard line breaks because
Viro was configured with no native wrapping. Font estimates alone did not satisfy
the owner. A temporary invisible ten-M text sample measured 0.43 world units at
logical font size 5; only dimensions were logged. That supports the scale model,
not all glyph/fallback fit. The probe was removed.

Final text pages retain source offsets and conservative page budgets, but release
ordinary whitespace row breaks to Viro WordWrap across the actual reading box.
Explicit paragraphs and protective long-token/CJK grapheme breaks remain hard:
the pinned renderer does not split oversized words itself. Captions use the same
flow and bounded one/two-line pagination. Button rows and content share derived
vertical geometry so bottom inset cannot be consumed by row spacing.

Regression and final verification results are recorded in `docs/validation.md`.
The owner confirmed the final content width and bottom-control padding on the
existing phone/APK. This closes those two spacing findings. The other native
scenarios listed above remain independently unverified.
