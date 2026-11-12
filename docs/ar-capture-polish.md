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

## Review and remaining device acceptance

A fresh read-only review inspected the task diff against baseline `1b5f2c5`,
including the new preview, plan and surrounding session/resource integration.
It reported no confirmed P0–P3 findings. It did not independently run tests or
use the phone.

The A53 was connected at 13% battery when this task began, then disconnected.
The owner was asked to charge it. No native screenshot or capture trial of this
new UI is claimed. Earlier reader screenshots in the AR refinement report are
not evidence of this capture redesign.

When charged and available, use the existing development APK and Metro to check:

- Capture → visible preparation feedback → loaded preview → Discard/Android Back;
  camera/reader resumes and temporary ownership retires.
- Actual bitmap decoding and orientation, portrait/landscape composition,
  processing spinner, safe areas and status-bar restoration.
- Short/narrow screen, large text, EN/JA/KO labels, scrolling, error recovery,
  TalkBack announcements and native touch pass-through while feedback appears.
- Save success/failure and share chooser/background leases as separately recorded
  device scenarios; mocked successes do not establish gallery/share delivery.

Keep private native evidence outside Git and exclude incidental people. No APK
build, merge, push or deployment was performed. Presentation sign-off remains
subject to the native checks above and the existing AR reader acceptance gaps.
