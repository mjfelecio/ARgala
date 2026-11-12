# AR capture refinement — November 12, 2026

Implemented in `7122e58` on `feat/ar-experience-refinement`, following the
[owner-approved plan](superpowers/plans/2026-11-12-ar-capture-polish.md).

## Result

The photo review uses the selected ivory/forest app styling, explicit Plus
Jakarta Sans weights, a compact title/description, and one scrolling page.
The rounded photo canvas uses 58% of safe viewport height, clamped to 220–560 dp;
`contain` preserves portrait and landscape subjects. Save is full-width primary,
Share secondary and Discard tertiary. Existing sharing/session and temporary
file explanations remain below the actions.

Capture retains its label and reserves the same 24 dp icon/spinner slot while
processing, with a short localized preparation message inside the existing
bounded utility chrome. No full-screen loading overlay, synthetic percentage
or artificial delay was added. The camera keeps its existing bounds.

After capture returns its owned file, the photo canvas shows bitmap loading
until native Image success. Save and Share wait for image readiness; Discard
remains available during bitmap loading. The preview is keyed by URI, and its
callbacks and 15-second deadline retire on completion/unmount. Late events
cannot affect a later capture or clear a failed attempt. A stalled/failed bitmap
uses the existing localized discard-and-recapture error. Save/share labels stay
stable with separate operation feedback, and saved success remains explicit.
All three new strings are present in EN/JA/KO.

The public capture interfaces, controller/service, native screenshot operation,
resource leases, temporary cleanup, session/principal/frame ownership, admission,
Passport, AR ring and 2.25-unit focused distance are unchanged. The existing
Android Modal/Back discard path is retained; active native operations still
prevent discard through the controller. No dependencies or assets were added.

## Automated verification

| Command | Result |
| --- | --- |
| `npm test -- src/features/ar-photo/ar-photo-controls.test.tsx src/features/ar-photo/controller.test.ts src/features/ar-photo/service.test.ts` before changes | 44 tests / 3 files passed |
| `npm test -- src/features/ar-photo src/features/destination-ar/destination-ar-session-screen.test.tsx` after changes | 123 tests / 4 files passed |
| `npm run check` at the final source state | TypeScript, zero-warning lint and 1,485 tests / 130 files passed |
| `EXPO_OFFLINE=1 EXPO_PUBLIC_VIRO_SPIKE=1 npm run export:android -- --max-workers 1` | PASS; 74 assets, 8.6 MB Hermes bundle `index-04b74095aa25afd71cdd3283584a6134.hbc` |
| `git diff --check` and staged diff check | PASS before source commit |

Focused failures were observed before implementation for missing bitmap gating,
bounded loading, retired callback protection and responsive canvas. The final
stable-label regression was also rerun against the original controls and failed
in EN/JA/KO, then passed with the new controls. Two test-only `act` callbacks
initially returned the Vitest helper object rather than void; these were
corrected before the successful full check. Existing save/share tests now
explicitly deliver native image success before exercising those actions.

The real controls/controller and locale resources are exercised while native
and storage boundaries are mocked. Viewport tests cover 800/360/1600 heights,
1.5 system font-scale input, contained images and a single scroll owner. These
are sizing/behavior checks; they do not prove Android Yoga, physical touch or
visual quality. Export is not an APK build.

## Review and physical Android verification

A fresh read-only review inspected the task diff against baseline `1b5f2c5`,
including the new preview, plan and surrounding session/resource integration.
It reported no confirmed P0–P3 findings. It did not independently run tests or
use the phone.

The owner reconnected the A53 and explicitly authorized verification despite
low battery. Using the existing November 8 development APK with source
`7122e58` through USB Metro on Android 16, the capture UI was exercised at 12%
battery, 1080×2400 physical resolution, 420 density override and 1.1 font scale.
A disconnected USB-forwarding error in the development launcher was resolved
by restoring the port reverse and opening the existing client; no APK was built.

Observed native results:

- Real camera plus Viro chapter tile captured into an upright photograph.
- Capture retained its label, showed the spinner and preparation message, and
  kept camera/ring geometry visible while processing.
- The preview displayed its bitmap-loading spinner with Save/Share disabled
  and Discard available, then decoded the actual photograph and enabled actions.
- Ivory/forest hierarchy, rounded photo canvas, full-width actions, safe areas,
  dark status-bar text and complete aspect-contained portrait rendered as intended.
- Scrolling exposed the full explanatory notes without hiding action access.
  These scroll interactions were performed by the owner during the recording.
- The Android image share chooser was observed and dismissed with Back; no
  recipient or external delivery was selected. Restoring-AR guidance appeared
  afterward; stable tracking recovery specifically after the chooser was not
  confirmed in that trial.
- A subsequent controlled Save displayed “Saving…” then “Saved to gallery”.
  A MediaStore query for the exact generated filename confirmed the gallery row.
- Discard returned directly to the live focused reader at page 1/5. The app's
  capture cache was empty afterward while the saved gallery row remained.
  Only that newly created test gallery row was then deleted; an exact-name query
  returned no result. Existing gallery items were untouched.
- A third capture followed by Android Back returned to the same live reader,
  restored light AR status-bar text and left the temporary capture cache empty.
- The owner explicitly reported: **“Looks good to me, I've verified it.”**

Private native evidence under `.superpowers/reviews/ar-capture-20261112/`:
`processing.png`, `bitmap-loading.png`, `preview-en.png`,
`preview-notes-scrolled.png`, `saving.png`, `saved-success.png`,
`returned-reader-after-discard.png`, `returned-reader-after-back.png`, and
`capture-flow-initial.mp4` (20-second actual
device recording). These show a neutral camera area without incidental people.
They are not generated mockups and are excluded from Git.

The core capture/processing/preview, Save, Discard, Back and direct return checks
passed, and the visual result is accepted by the owner. Battery declined from
12% to 10% during the brief camera trials, which the owner explicitly authorized.
AR was exited to release the camera after verification.
Remaining stress/coverage cells are separate: short/narrow layout, landscape,
large text, native JA/KO copy, TalkBack, forced decode/storage/permission failures and full share/background/tracking recovery. Automated
coverage is not reported as hardware success for these cells. No settings
changes, real-GPS arrival or Passport grant were used for this verification.

Keep private native evidence outside Git and exclude incidental people. No APK
build, merge, push or deployment was performed. Presentation sign-off remains
subject to the native checks above and the existing AR reader acceptance gaps.
