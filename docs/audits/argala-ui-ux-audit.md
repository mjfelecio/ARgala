# ARgala Android UI/UX audit

Confirmed findings: **0 P0, 1 P1 and 3 P2 resolved; 1 optional P3**.

Date: 2026-10-21. Status: audit and scoped remediation complete; **conditional readiness for client UAT, not UAT sign-off**.

## Baseline and method

- Isolated branch `refine/ui-ux-audit`, based on fetched `origin/main` / `eb63d44` (main was current). Original untracked kickoff archives/plan and other worktrees are preserved.
- Samsung Galaxy A53 / SM-A536E, Android 16 / API 36, 1080×2400, physical density 450 dpi with existing 420 dpi override, gesture navigation, original font scale 1.1, system dark mode. Larger-text probe: 1.6. Portrait is the app's supported orientation.
- Existing `com.mjfelecio.argala` development APK, version 1.0.0 / code 1, last updated 2026-10-21 08:39 local. Its native build is recorded in `docs/validation.md` as EAS build `a344e965-f8b3-447f-9261-1a74941e7001` from `ccda6c5`. Package/config/native dependency inputs have not changed since that build; the intervening dependency patch is JavaScript Router code. Current audit JavaScript is served by Metro **from this worktree**, through ADB reverse port 8081. The APK's version label alone does not identify the JavaScript revision.
- Read the operating manual, foundation spec/plan, validation, shell/UI infrastructure and Clean Explorer screen/content guides. Inspected the original archives read-only and the owner's HOP profile/root patterns. Existing functionality and content approvals take precedence over mockups.
- Real ADB taps, swipes, Back, foreground return, device screenshots, live Search/selection/Directions and settings controls; static review supplements these observations. Provider data and coordinates are omitted from retained evidence. Account information is redacted. No account reset or synthetic runtime provider/catalog data.
- Baseline `npm run check`: typecheck, zero-warning lint and **584 tests / 56 files passed**. Tests do not prove native rendering or field accuracy.
- OpenCode v2.0.22 is installed, but the supplied provider-filter syntax is unsupported; model listing returned no models and a provider probe returned `provider.no-route`. No billing/auth configuration changed. GPT-6 Luna supplied a read-only code audit as the requested fallback; parent owns device work and verification.

## Screen and journey coverage

| Area | Baseline observation | Limits / remaining checks |
| --- | --- | --- |
| Welcome / language selection | Read actual screen, routing/persistence contracts and existing resource-based tests. | Device has an established signed-in session. First-launch onboarding is protected; do not clear account/preferences to manufacture access. Fresh-install EN/KO/JA, Continue/restart and save failure remain manual UAT. |
| Sign In / Create Account | Read actual form, keyboard avoidance, validation, confirmation and errors; existing actual-locale regressions pass. | No supplied reauthentication credentials. Preserve the working session; device signed-out forms, keyboard, rejection, registration and confirmation remain unverified. |
| Explore | Rendered initial unsearched state; explicit live Search returned 20 places; selected a returned native marker and received details; inspected both dock states and tab/Back return. | Read-only inspector observation confirmed one unique nearby POST for explicit Search and no additional provider requests through Profile/refocus, foreground return and AR entry. Duplicate inspector notifications were deduplicated by request ID; this is not server billing evidence. No outdoor precision claim. |
| Featured Destinations | Catalog scroll shows D01–D09, including long names. Opened D01–D09 individually, scrolled pending-content pages; Back returns through catalog. | All nine pending-content pages rendered on device; approved-content states remain blocked below. |
| Destination details / Daytime Preview | Missing approved media, overview, entrance and center are explained; Directions/nearby acquisition unavailable for the documented reason. Duplicate-key warning observed on entry. | Approved-content/gallery fullscreen, destination-centered Search and entrance routing blocked by absent approved runtime content. Synthetic test fixtures are not device acceptance. |
| General POI Details | Opened from real selection; inspected fallback media, primary/secondary actions, essentials and Google attribution; Directions opens dedicated preview. | Provider coordinates/address are excluded from retained evidence. Missing/failed-details recovery is covered by automated contracts; live provider failures were not forced. Direct-link states remain a manual UAT item. |
| Walking Directions | Observed current-location loading, then a real completed route summary, expanded snapshot/destination context and walking caution. Fit action available; Android Back restores Details. | Real-world walkability, route accuracy and outdoor movement not field-tested. Stationary map pixels/fit framing must be checked without publishing the location. |
| AR | Real camera, heading, unscanned state, collapsed/expanded nearby dock, Map return and incoming POI handoff. English bearing visibly truncates at normal 1.1 scale. | Projection accuracy, calibration and prolonged thermal/performance behavior need outdoor UAT. Revoked camera permission rendered the guidance; explicit Allow camera opened Android permission UI and restored preview. EN/KO/JA headers checked at 1.1 and 1.6; English also at 320 dp width. Repeated native denial and TalkBack spoken order remain manual UAT. |
| Profile / Settings | Actual account summary (redacted), language selection, dirty state, scroll to Save/sign-out/About; Korean save succeeds and UI translates. Existing radius retained at 500 m. 1.6-scale probe reflows settings; tab label spacing needs follow-up. | EN/KO/JA saves and English cold-start persistence checked. Entering 9 m showed validation; the 500 m preset cleared it. Original 500 m restored. Slider drag updated the displayed value from 500 to 850 m; the original 500 m preset was then restored. Open device settings reached Android InstalledAppDetails; Android Back restored Profile. Sign-out not executed without reauthentication access. |
| Loading / disabled location | Initial location waiting, Directions waiting and service-disabled recovery rendered. Fallback uses legacy blue native buttons instead of the green presentation. | Camera revocation/recovery checked; repeated native denial and live provider failure/empty/no-route remain unverified. No fabricated server results. |

## Findings and remediation order

Confirmed observations are distinct from static risks and optional visual recommendations. No confirmed P0 crash or inaccessible primary journey so far.

| ID | Priority / evidence | Observed vs expected | Cause / focused correction | Verification |
| --- | --- | --- | --- | --- |
| UX-01 | P1, observed on Explore and Directions with system dark mode | Dark map lies behind dark status icons; system status is difficult to read. Approved application surfaces/maps should follow one light presentation with readable system chrome. | Maps selects FOLLOW_SYSTEM independently of the fixed light app theme. App-level Appearance was experimentally ineffective and removed. The version-checked native default now selects LIGHT; unsafe JavaScript `MapView.userInterfaceStyle` remains unset and CSS map styling remains. | Cold/reload app under dark OS; verify native map is light and status icons readable; repeat route/AR/Back and light OS. Mocked tests cannot establish native map color. |
| UX-02 | P2, observed D09 entry / Metro stack | Gallery and nearby section both have key `D09`; React warns about duplicate siblings. Navigation should be free of reconciliation warnings and reset each section for a different destination. | `destination-screen.tsx`: use section-specific keys that retain destination identity. | Real screen regression across catalog IDs and switching destinations, fail on duplicate-key console output; reopen pages on phone with no warning. |
| UX-03 | P2, observed AR at 1.1 scale | Heading reads `138° · approxi…`; controls consume space while status text is forced to one line. Status and compass-unavailable guidance should remain readable. | `ar-chrome.tsx`: permit center text to wrap/reflow; shorten the visible Scan label while retaining its explicit intent/accessibility. Keep measured chrome and full camera bounds. | Actual EN/KO/JA resources, large-font/small-width device captures; verify Map/Scan, disabled/busy states, camera bounds and no new requests. |
| UX-04 | P2, observed location-disabled fallback | Recovery abruptly changes to uppercase blue native buttons, default font and blue-grey notices. Loading/permission/error states should use the existing Clean Explorer controls and CSS tokens. | `ui/shared.tsx` still owns old StyleSheet/native Button presentation, used by auth/bootstrap/map/AR statuses. Replace presentation with HeroUI/UniWind while preserving localized children, callbacks, disabled states and lifecycle owners. Do not add a new UI abstraction/library. | Existing location/auth/AR/error suites plus actual disabled-location and camera-denial recovery, larger text and screen scrolling. |
| UX-05 | P3, aesthetic recommendation | Catalog nests a large mint pill inside every rounded white card; long repetitive pending labels dominate the list. | Optional low-risk simplification to cohesive tappable rows using existing HeroUI. Keep provisional status, all nine entries, names and navigation. | Before/after catalog at normal/large text, EN/KO/JA; every row remains at least 48 dp and opens the same ID. |
| R-01 | Review risk, not confirmed defect | Standalone `/settings` has no in-app caller; Profile already renders full settings. | Preserve working navigation; do not introduce an extra Settings step solely to use the route. | Direct link and Back can be tested separately. |
| R-02 | Not reproduced on settled screen | Initial 1.6-scale screenshot suggested crowded labels; the settled screen retained separate readable labels. | No change warranted by the repeated observation. Font scaling remains enabled. | Measure label bounds/spacing under the actual navigator at 1.6 and reduced width. |

Implementation batches (after baseline coverage is recorded):

1. UX-01: app/native appearance alignment; focused regression and device cold/route/AR checks, then a Conventional Commit.
2. UX-02: destination section identity; real screen failing regression, device entry/Back checks, then a Conventional Commit.
3. UX-03 and UX-04: readable shared status/recovery presentation and AR chrome; focused regressions and actual permission/font/language checks, then coherent Conventional Commits.
4. Resolve R-02 if reproduced; perform low-risk UX-05 polish or explicitly retain as optional. Full `npm run check`, Android export/config checks if relevant, independent review, device regression sweep, update validation evidence and reviewable PR. Never merge automatically.

## Acceptance boundaries

All confirmed P1/P2 findings are addressed and the changed flows were exercised on the connected phone. No confirmed P0 was found. Independent review found no unresolved critical/important issues. No claim of GPS/compass calibration, complete translations, route correctness or safe pedestrian access. Missing content/credentials and unavailable physical conditions remain explicit manual UAT gates rather than successful checks.


## Remediation evidence

- **UX-02 resolved:** gallery and nearby section now use distinct destination-aware keys, retaining their destination-change resets. A real-screen regression failed for all nine IDs before the fix; the destination suite now passes 27 tests. Opened D01–D09 through actual Android links and inspected the rendered names/pages; no duplicate-key banner returned. [Before](evidence/destination-before.png) / [after](evidence/destination-after.png) show D09 at the same viewport. The Google/catalog request and sensor boundaries are unchanged.
- Japanese settings saved successfully and Japanese AR reproduced the same baseline truncated qualifier. Original English was restored using Save; the current cold-start bundle displays English.
- The settled 1.6-scale tab bar remained legible with separated labels; R-02 was not reproduced reliably and is not treated as a confirmed defect.
- **UX-01 resolved on rebuilt APK:** EAS build `aa63d13d-0095-4ade-9c67-76169b1c0501` from `276aad4` finished and installed in place at 11:20 local, preserving the account. Explore and Walking Directions now render light under dark Android, with readable dark status icons; Explore also stayed light after switching Android to light mode. Original dark mode restored. [Before](evidence/map-status-before.png) / [after](evidence/map-status-after.png) retain only system chrome. No unsafe JS enum was added.

- **UX-04 resolved in observed states:** shared HeroUI notices/actions replace legacy presentation. [Before](evidence/recovery-before.png) / [after](evidence/recovery-after.png) are cropped 1.6-scale recovery controls; location-disabled recovery at 1.6 and camera-revoked guidance/explicit permission recovery were exercised. Repeated denial and system-settings revocation scenarios remain UAT.

- **UX-03 resolved:** full English bearing/compass guidance at normal and enlarged text, with explicit Map/Scan controls. [Before](evidence/ar-heading-before.png), [after](evidence/ar-heading-after.png), [1.6 scale](evidence/ar-heading-large.png) are header crops with camera content omitted.


### Final source and review evidence

- `npm run check`: TypeScript, zero-warning ESLint, **601 tests / 57 files passed** on the final implementation. Targeted native/destination (35), shared/location (43), shell/AR (67) regressions passed; deliberate red runs established the reported failure paths before the fixes.
- `npm run check:native-patches`, `npx expo install --check`, `npx expo-doctor` (21/21), `npm run check:android`, and final `npm run export:android` passed. No Edge implementation changed, so Edge/limiter checks were not rerun locally for this UI patch.
- Fresh independent review of `eb63d44..276aad4` found no confirmed critical/important issues. Reviewer independently passed 51 tests across native patch, destination screen, shell and shared UI suites. No production code changed after that review.
- P3 UX-05 is retained as optional follow-up: catalog simplification deserves its own comparison with approved content. No additional speculative layout changes were made. R-01 remains an unused-compatible route, not a broken journey; R-02 did not reproduce on the settled screen.
- Original account/session, 500 m activation radius, English, font scale 1.1, 1080×2400 size, dark OS mode, location services and camera/location grants were retained/restored at handoff. The existing 420 dpi override is not changed.


### Rebuilt APK sweep and handoff

- [EAS development build](https://expo.dev/accounts/mjfelecios-team/projects/argala/builds/aa63d13d-0095-4ade-9c67-76169b1c0501), commit `276aad41ec677f45d8cea79a99e3d756d0ad62a9`; APK SHA-256 `220aba05cd8c5c873c8fa731caa4f7c38ea89509d4d71d70c46b692667503346`. ADB streaming install stalled; non-streaming in-place install returned Success. Installed package update time is 2026-10-21 11:20:12. No data reset.
- Live explicit Search returned 20 places. AR reused the transient results, expanded/collapsed and selected a place; View Details and Android Back restored the camera. Directions rendered a completed walking preview with distance/duration; Sheet drag and Back were exercised; explicit Fit framing remains a manual UAT check. Maps remained light; Google credit stayed visible above the dock. These are observed journeys, not outdoor route/sensor or exhaustive camera-transform acceptance.
- Header-only evidence: [Korean 1.6](evidence/ar-heading-ko.png), [Japanese 1.6](evidence/ar-heading-ja.png), [320 dp / 1.6 English](evidence/ar-heading-narrow.png). Normal 1.1 translated unavailable-heading guidance and enlarged approximate bearings were readable. Language changes persisted only after Save; English restored.
- Before client acceptance, use a test account/fresh install for Welcome, authentication, keyboard/confirmation/sign-out and repeated permission denial/settings revocation. Supply approved catalog coordinates, entrances, descriptions and media before gallery/nearby/destination routing acceptance. Field-test GPS/heading calibration, walking safety, prolonged camera heat/performance, TalkBack spoken navigation and another Android device. Live failure/empty/no-route cases remain unverified rather than simulated as successes.
- Delivery consists of the baseline audit plus four focused implementation commits and final evidence. No new product feature, provider permission, persistent provider storage or automatic paid-request trigger was introduced. Optional P3 catalog polish is left for a separate comparison.


### Requested visual follow-up

The owner's follow-up supersedes the earlier long AR-header wording: keep only degrees, with a compact dash for unavailable heading and the full translated accessibility label. Home now has a landmark icon on Featured Destinations and a tighter 48 dp Search Nearby surface. These changes were observed on the connected Galaxy A53 after reloading the current bundle; all 601 checks remain green. Earlier header screenshots record the historical audit correction, not the final requested wording.
