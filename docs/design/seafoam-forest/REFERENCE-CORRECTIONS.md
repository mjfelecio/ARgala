# Seven-screen reference correction checklist

Baseline: `6f0e77f`, existing `feat/seafoam-forest-ui` branch. Prepared before
implementation on 2026-11-02. References: supplied `references/approved/01–07`
PNGs, inspected individually. AR is excluded. Untracked owner assets are untouched.

| Reference | Details to reconcile | Initial finding | Final evidence |
| --- | --- | --- | --- |
| 01 Explore | Strong sheet headings; active tab dot; search/filter spacing | Missing active dot, weaker sheet headings | Implemented: explicit heading weights and active dot; normal EN and narrow EN/JA/KO captures. Pinned shortcut, scrolling categories, measured sheet and 48dp controls retained. |
| 02 Featured | Compact forest Passport; decorative passport/stamp; integrated truthful sync | Globe and detached sync controls | Implemented: compact fraction, booklet/stamp motif, in-card light/dark sync. Normal EN and narrow EN/JA/KO; actual 0/9. Long eligibility copy intentionally wraps at large text. |
| 03 Destination | Approval icon; honest content/arrival groups; Journey placeholder; directions/reminder icons | Plain notices, generic missing-media tile, ungrouped actions | Implemented: approval/content icons, honest availability groups, Journey placeholder and action icons. Normal EN and narrow EN/JA/KO, including lower notices/disabled actions. No approved photos/stories fabricated. |
| 04 Place | Available address under name; primary Directions; balanced white Map/Save; bookmark/Saved check; no AR or coordinate rows | AR and raw coordinates present; text-only save | Implemented: name/address hierarchy, balanced Map/Save, bookmark/check, no ordinary AR or coordinate rows. Real loaded normal EN and narrow EN/JA/KO; saved check verified on existing bookmark. |
| 05 Profile | Identity + Saved group; leading icon/real chevron; selected language; radius/sections; single scroll | Saved disconnected from identity | Implemented: real identity/Saved group, actionable chevron, selected-language and radius weights. Normal EN top verified; narrow captures verify lower scroll access. Narrow identity/language/radius matrix remains unverified. |
| 06 Saved | Warning banner with heading/icon/specific error/recovery; quiet healthy states; section/count; honest metadata; View chevron/Remove trash | Plain sync text; no count/metadata/action icons | Implemented: count, honest ID-only metadata, View chevron/trash. Real synced/count=3 normal EN and narrow EN/JA/KO. All failed/quiet sync variants and recovery verified in real-resource tests; native failed banner remains unverified. |
| 07 Directions | Destination, mode icons, displayed mode, actual metrics, recovery, Start inside measured block; content identity; expanded Journey retained | Metrics/recovery outside primary measurement | Implemented: complete measured compact block and icons. Loaded walking normal EN and narrow EN/JA/KO; EN draft/expanded; JA driving draft/waiting/stale recovery. Loaded driving, denied/error native cells remain unverified. |

Verification checklist:

- [x] Regression fails before each behavioral correction, then passes.
- [x] Warning tokens compile; foreground contrast >=4.5:1.
- [x] EN/JA/KO: actual resources, live language, truthful sync/recovery.
- [x] Details/Saved: explicit actions, busy state, no automatic paid work.
- [x] Automated Directions: loaded/pending/error, walking/driving draft vs displayed,
  stale/denied location, long title, delayed/retired measurements, remounts.
- [x] Targeted regressions, full `npm run check`, Android export.
- [ ] Android normal and 360×800/1.5 text, locales, sheets, action labels.
- [x] Separate actual loaded captures from unavailable/recovery evidence.

## Execution decisions

Ruling: retain this existing task checkout/branch as explicitly requested; it is
separate from main and serves the connected development client.

Ruling: preserve external Google Maps navigation without app GPS. Existing code
and regression explicitly allow this handoff; current-location guidance applies
to local walking navigation/provider origins, not external app authority. The
reference's disabled external CTA cannot override this contract.

Ruling: use installed HeroUI/UniWind/Ionicons and bundled Journey geometry. No
dependency/native changes or APK build. Device evidence uses the existing APK.

## Implementation and validation ledger

Implementation commits: `37e6ab7` and `8cab000`. All source changes are verified;
native acceptance is limited to the states identified in the evidence table.

Review: independent read-only review found two important corrections to make
before delivery: continuous walking distance must not invalidate compact geometry,
and availability must read installed approved text rather than only bundled data.
Both have focused real-screen regressions in the correction pass.

Ruling: retain explicit Retry for account auth failures. The installed root guard
excludes Sign in while a session exists; adding a sign-in link would be a dead
recovery action. Retry already captures the refreshed token. No sign-out or auth
behavior is added by a styling pass.

Review accuracy correction: tighten Google bookmark metadata to explicitly say
“Open to load details” (EN/JA/KO). This satisfies the plan's honest ID-only
metadata requirement: opening does not imply an automatic paid lookup.

Final review fix pass: real-screen regressions for continuous walking progress
and installed-content availability both failed before the fixes (124 others
passed); explicit-step metadata regressions failed in all three locales. The
fixes exclude continuous progress counters from structural measurement identity,
read the installed text overlay solely for availability, and clarify metadata.
Native `onLayout` still measures any real reflow in a surviving primary block.

## Automated evidence

- Initial focused Details/Saved/token regression: 4 expected failures, 51 passes.
- Initial Directions regression: 5 expected failures, 83 passes. Corrected the
  driving test snapshot to carry its real mode; mismatched-mode snapshots must
  continue requiring explicit route computation.
- Initial Profile/Destination grouping regression: 2 failures, 38 passes.
- Explicit weight compiler regression: failed before opt-in CSS utilities.
- Combined screen/journal check: 199 tests passed across 8 files.
- Review corrections: 2 expected failures, 124 passes; metadata wording failed
  in all 3 locales before correction. Corrected focused run: 144/144 passed.
- Final `npm run check`: strict TypeScript, zero-warning ESLint, 118 test files,
  **1,332 tests passed**. Includes installed focus/readiness, retired callback,
  no-paid-request lifecycle/remount/recovery, long titles, all sync errors,
  bookmark busy/coalescing, 1,000-row virtualization and actual locale resources.
- Final `npm run export:android`: Metro/Hermes export passed, Android bundle
  `index-9fdca96e56b6a406da14c6d1d784d462.hbc` (8.5 MB). This is not an APK.
- `git diff --check`: passed. No dependency, native configuration, Edge,
  persistence/service, route authority or AR source/material changes.

No APK build, push, PR, merge or deployment was performed. Independent review's
important findings are fixed in one pass; its metadata wording concern is also
resolved against the explicit truthful-copy requirement. No deferred findings.

## Native verification conditions

Existing Galaxy A53/SM-A536E, Android 16 development APK
`com.mjfelecio.argala` 1.0.0/code 1; local Metro over ADB reverse. Original
1080×2400 physical screen, preexisting density override 420 (physical 450),
font scale 1.1; narrow run uses 945×2100 physical override at density 420,
equivalent to 360×800 logical units, with font scale 1.5. Signed-in real account,
three existing ID-only Google bookmarks, zero earned stamps, saved activation
radius 500 m; these records/radius were not edited. EN is the original language.

Private PNG/XML evidence lives under `/tmp/argala-reference-correction/`, not
Git, because captures include real account identity and location. Approved PNGs
remain conceptual references. Files prefixed `discarded-` are explicitly invalid
or mislabeled captures and establish no acceptance. Android display-size changes
restarted the activity, so fresh loaded evidence is needed after each change.

Paid searches and routes were submitted only through explicit app actions for
this requested verification. No artificial location, query injection, metadata
persistence, bookmark edits, sync retry or AR entry was used. Actual provider
Details were initially reused from a full Nearby response. Background/foreground
journal sync may run through the existing lifecycle.

Native matrix limitations: normal EN represents all seven screen families;
360×800 / 1.5 text represents EN/JA/KO for Explore, Featured, destination preview,
Saved and loaded provider Details/walking Directions. Profile narrow captures
show lower scrolling content, but retained scroll positions mean filenames
ending `language`/`radius` do not by themselves verify those controls. Normal
JA/KO and the narrow Profile identity/language/radius comparison remain unverified.
The automation stopped obtaining fresh UIAutomator snapshots after the final
Android display reset; no stale XML or wrong-screen file establishes acceptance.

Restored: English (visually confirmed), font scale 1.1, no size override,
preexisting density override 420 retained; actual radius remains 500 m. Account,
three bookmarks and zero stamps were not edited. No native denial/provider-error,
failed-sync/guest state, TalkBack traversal, IME, outdoor GPS/navigation, live AR,
reminder delivery, or approved-photo/gallery acceptance is claimed.

## Reference adaptations and evidence index

- The mock's precise typography pixels, custom passport illustration and route
  units are adapted to existing roles, installed Ionicons and actual route copy.
  The booklet/check motif is decorative. Full names and necessary eligibility
  guidance grow/scroll at large text. Existing partial JA/KO translations may
  retain English fallbacks for previously existing route/location strings.
- Static identity has no trailing chevron, because no identity action exists.
  Map uses its leading icon and explicit label; row View keeps the requested
  trailing chevron. External Google attribution retains the supplied official
  wordmark; no illustrated Google mark is substituted.
- Saved Google labels remain generic even after explicit Details lookup. No
  provider metadata was added to persistence or fetched on Saved mount.
- Passport sync recovery retains specific truthful errors. Account auth failures
  offer Retry with the refreshed-token path; the guarded sign-in route is not a
  valid recovery destination while that session exists.
- Ordinary Place Details removes only its own legacy AR handoff. Curated admission
  routes and every AR design/material/interaction remain unchanged.
- Current-location requirements apply to local walking navigation. External
  Google Maps handoff retains its existing independent authority. Long native
  route content uses the existing scroll owner, handle and inset accounting.
- Native maps keep their natural provider geography and blue route. The installed
  renderer's rural map is greener than the reference; no APK/native patch was
  built to change that presentation in this pass.

Verified representative files (all paths under the private capture directory):

| Content | Evidence |
| --- | --- |
| Explore controls/heading/active tab | `01-explore-en-final.png`, `01-explore-{en,ja,ko}-360-large-final.png` |
| Real Passport/catalog | `02-featured-en-final.png`, `02-featured-{en,ja,ko}-360-large-final.png` |
| Honest empty gallery and grouped notices/actions | `03-preview-en-final.png`, `03-preview-{en,ja,ko}-360-large-final.png` and `-lower` variants |
| Address/unsaved secondary actions | `04-details-en-loaded-final.png` |
| Loaded existing saved place/check | `04-details-{en,ja,ko}-360-large-final-loaded.png` and `-actions` variants |
| Profile identity/language/radius header | `05-profile-en-final.png`, `profile-top-manual.png` |
| Saved generic rows/count/healthy sync | `06-saved-en-final.png`, `06-saved-{en,ja,ko}-360-large-final.png` (narrow files contain final metadata wording) |
| Loaded walking summary | `07-directions-en-loaded-final.png`, `07-directions-{en,ja,ko}-360-large-final-result.png` |
| Draft/expanded route content | `07-directions-en-draft-driving-final.png`, `07-directions-en-expanded-final.png` |
| Actual waiting/stale driving recovery | `07-directions-ja-360-large-driving-result.png` — explicitly **not** a loaded-driving capture |

The first `07-directions-en-final.png` is loading; its later `-loaded-final`
replacement establishes loaded acceptance. `discarded-*` files and interrupted
normal JA automation outputs are not evidence. No comparable baseline capture
set exists, so this is reference-to-render comparison rather than a claimed
complete before/after native matrix.
