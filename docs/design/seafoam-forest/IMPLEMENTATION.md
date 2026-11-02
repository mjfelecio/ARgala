# Seafoam Forest implementation evidence

Source baseline: `ec6cb24`, task branch `feat/seafoam-forest-ui`. The only
preexisting changes were untracked handoff/artwork/research files; they remain
untouched. The eight owner-approved PNGs in the supplied untracked folder are
conceptual references, not application assets or evidence of native behavior.

Execution follows the supplied implementation plan inline, with the later owner
instruction excluding all AR design changes. Existing architecture
and HOP/HOP-Driver semantic profile patterns were inspected. No new dependencies,
backend changes, native configuration or APK build are planned.

Ruling: use an isolated task branch in the existing checkout, which the handoff
allows, so the connected development client can load this workspace.

## Screen mapping

| Reference | Actual feature | Preserved states/contracts | Evidence |
| --- | --- | --- | --- |
| 01 Explore | map/home-map-controls, home-place-sheet, map-style | explicit search, all sheet states, credits | home-map-controls/map-screen/route-preview regressions; Android unsearched capture (after-current.png), large/360 Explore capture mislabeled 02-featured-360-large.png |
| 02 Featured | destinations/destinations-screen, journal/passport-summary | real nine-destination progress, pilot separate, sync | screens/provider regressions; Android 02-featured-final.png and 02-featured-360-large-final.png |
| 03 Preview | destinations/destination-screen, daytime-gallery | approved media only, reminders/entrance guards | screens regressions; Android 03-preview-en.png (real pilot, no media) |
| 04 Place | places/place-details-screen, place-details-content | explicit recovery, provider attribution | place-details-screen regressions; Android 04-details-recovery.png, missing/explicit recovery only |
| 05 Profile | settings/profile-settings-content, settings-form | one scroll owner, explicit Save, actual identity | settings/form regressions; Android 05-profile-en.png (private identity) |
| 06 Saved | journal/saved-screen | virtualized list, ID-only storage, no automatic fetch | saved-layout/provider regressions; Android 06-saved-final.png (real ID-only records) |
| 07 Directions | directions/route-preview-screen | measured dock, immutable route, route blue | route-preview-screen regressions; Android 07-directions-unavailable.png; loaded route not requested |
| 08 AR concept | destination-ar/native-styles, ring-scene | live Viro ring, tracking and held hits | Excluded by later owner instruction; original AR colors retained |

## Verification

The initial check passed typecheck/lint; its test phase overlapped new regression
assertions and reported only the three expected saved-ID failures (1,304 others
passed). It is not a pristine baseline test result. The dedicated theme test
failed before token changes and passed afterward; Saved EN/JA/KO tests exercise
real resources, explicit Open/remove, 1,000-item virtualization and no fetch.
The saved-ID assertion was corrected to inspect rendered text/accessibility
rather than serialized FlatList data props (which correctly retain the ID).

First completed `npm run check`: 118 files, 1,307 tests passed, strict TypeScript
and zero-warning ESLint. `npm run export:android` passed (Metro/Hermes export,
not an APK). Focused screen/state tests: 95 passed; map/control/Directions tests:
155 passed; final journal/theme/catalog regressions: 58 passed. Final complete
`npm run check` after compact-label and regression adjustments passed: strict
TypeScript, zero-warning ESLint, 118 test files and 1,310 tests. Device/native acceptance remains separate
from automated checks; no claims of on-site GPS or physical AR verification.

## Issue scope

Issues #39–#42 receive no behavioral changes in this visual pass. The current
baseline already includes the #39 native sheet-readiness correction; this task
does not claim to fix those issues through appearance changes.

## Implementation decisions and visual deviations

- Tasks 0–7 are implemented: reconciled authority, ivory semantic foundation,
  forest Explore controls with 48dp targets, neutral natural-land style/green parks,
  real nine-item Passport progress (pilot stays separate), generic catalog markers,
  destination name before media, provider detail cards, compact saved rows and
  white grouped Settings inside the existing single scroll owner. Directions
  retains its measured dock; only heading treatment changes.
- Task 8 is excluded by the owner's later instruction. No AR source or native
  material colors changed. A compiler regression locks the original AR colors.
- Task 9 automated verification and representative device inspection are recorded;
  the full native acceptance matrix remains outstanding where listed below.
- Real copy is longer than the illustrative images: consent, draft notices,
  sync status, GPS guidance and provider credits remain visible. Existing legacy
  POI AR navigation is retained; removing it is a separate product decision.
- Saved Google records have no persisted display metadata. Rows show the existing
  honest localized fallback, with short View/Remove labels and full accessible
  action labels. They never fetch metadata on mount or expose IDs as text.
- Passport uses nine segments reflecting actual journal stamps, plus the existing
  independently rendered sync/error controls on ivory so danger/recovery colors
  retain their established contrast. No fake stamp illustration/progress.
- No new story-preview controls, radius slider behavior, refresh-location logic,
  or invented destination photography were added to imitate reference pixels.

## Device conditions and remaining acceptance

Galaxy A53 (SM-A536E), Android 16, existing com.mjfelecio.argala 1.0.0/code 1,
1080×2400, physical density 450 with preexisting 420 override, original font
scale 1.1. Development JS served locally over ADB reverse; no APK built.
Screenshots are private under `/tmp/argala-seafoam-captures/` because the
connected account/profile may contain personal information. Mockups are not
native evidence. The first stable captures used the initial implementation
bundle; final captures will be identified separately.

Before/after comparison limitation: no comparable baseline APK captures were
made before code editing. Prior repository audit images are historical
references only; the initial current-screen capture showed Android Recents.
Loaded provider Details/Directions, induced provider errors, actual EN/JA/KO
native matrix, TalkBack navigation and outdoor GPS acceptance are not established
by this pass. Mocked regression tests cover those code paths, not physical success.
No search, route computation, sync retry, save/remove or AR admission was
submitted during the device styling review. Existing lifecycle sync may run.

Independent read-only review found no critical/important regressions. Its
documentation concern about archived AR recoloring instructions was resolved
with prominent later-owner exclusion notes in the spec and plan.

Final native observations: Featured at 360×800 logical units with font scale
1.5 wraps its heading/progress/copy and retains a scrollable catalog; no text
scaling caps were added. Restored font scale 1.1 and removed the temporary
size override, retaining the preexisting density override 420. Final normal
Featured shows Explore 9 (pilot excluded from the total), and Saved renders
short View/Remove actions beside honest generic names. Rural map areas remain
green in the installed renderer; no claim of exact reference map color matching.
The large Explore capture filename mentioned above is historical/mislabeled;
only the `-final` Featured capture establishes that screen's large-text state.

## Delivery

Review-ready local commits on `feat/seafoam-forest-ui`; no push, PR, merge,
deployment or APK build. Original untracked handoff/artwork/research files remain
untouched. Final source revision for device observations: implementation commit
`8f12a4c` (plus semantic foundation `d7884f8`). Documentation follows separately.

- [x] Authority reconciled; supplied spec/plan preserved with AR exclusion.
- [x] Seven screen families implemented with CSS semantic tokens.
- [x] Actual-resource EN/JA/KO tests, count/pilot, no-fetch and virtualized-list
  coverage; focused and full checks; Android bundle export.
- [x] Independent review; no significant code findings.
- [x] Representative Android captures; narrow/large Featured; device settings restored.
- [ ] Complete native loaded/error/denied matrix, EN/JA/KO, TalkBack and outdoor GPS.
- [ ] Comparable baseline/after captures for every family; baseline was not captured.
- [ ] Loaded Details/Directions native screenshots (no provider request submitted).
- [ ] AR design/physical acceptance: explicitly reserved for the owner's separate task.

## Seven-screen reference detail correction — 2026-11-02

The later owner-requested correction pass supersedes the earlier decisions above
that retained ordinary Place Details AR, detached Passport sync or limited
Directions to a heading change. UI commit `37e6ab7` and Directions commit
`8cab000` complete the new reference details. AR source/materials remain excluded.
See the pre-edit [reference checklist and verification ledger](REFERENCE-CORRECTIONS.md)
for implementation, intentional adaptations, rendered evidence and remaining
native acceptance. Its loaded provider captures are separate from this earlier
pass's unavailable states.

Final checks for the correction: strict typecheck, zero-warning lint and 1,332
Vitest tests across 118 files passed; Android Metro/Hermes export passed. The
independent review found two important issues, each reproduced and fixed with a
real-screen regression: continuous walking progress retains compact geometry,
and preview story availability reads the installed approved text overlay.


## Later owner refinements — Saved and Settings interactions

The owner's subsequent feedback supersedes the provisional-name presentation,
manual Saved→Load Details opening, radius keyboard entry/technical help and tab
marker decisions above. The final tab design uses selected text weight only.
See [owner refinements and verification](OWNER-REFINEMENTS.md) for the complete
scope, sticky Save/Undo behavior, explicit View authority, transient-name limits,
1,342-test check, final Android export and pending native acceptance.
