# ARgala Android UI/UX audit

Date: 2026-10-21. Status: baseline audit and remediation in progress; **not UAT sign-off**.

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
| Explore | Rendered initial unsearched state; explicit live Search returned 20 places; selected a returned native marker and received details; inspected both dock states and tab/Back return. | Exact provider request counts need network/server instrumentation; rendering alone cannot prove counts. No outdoor precision claim. |
| Featured Destinations | Catalog scroll shows D01–D09, including long names. Opened D01–D09 individually, scrolled pending-content pages; Back returns through catalog. | All nine pending-content pages rendered on device; approved-content states remain blocked below. |
| Destination details / Daytime Preview | Missing approved media, overview, entrance and center are explained; Directions/nearby acquisition unavailable for the documented reason. Duplicate-key warning observed on entry. | Approved-content/gallery fullscreen, destination-centered Search and entrance routing blocked by absent approved runtime content. Synthetic test fixtures are not device acceptance. |
| General POI Details | Opened from real selection; inspected fallback media, primary/secondary actions, essentials and Google attribution; Directions opens dedicated preview. | Provider coordinates/address are excluded from retained evidence. Missing/failed-details recovery and direct cold links still to check on device. |
| Walking Directions | Observed current-location loading, then a real completed route summary, expanded snapshot/destination context and walking caution. Fit action available; Android Back restores Details. | Real-world walkability, route accuracy and outdoor movement not field-tested. Stationary map pixels/fit framing must be checked without publishing the location. |
| AR | Real camera, heading, unscanned state, collapsed/expanded nearby dock, Map return and incoming POI handoff. English bearing visibly truncates at normal 1.1 scale. | Projection accuracy, calibration and prolonged thermal/performance behavior need outdoor UAT. Camera denial/recovery and larger fonts remain targeted checks. |
| Profile / Settings | Actual account summary (redacted), language selection, dirty state, scroll to Save/sign-out/About; Korean save succeeds and UI translates. Existing radius retained at 500 m. 1.6-scale probe reflows settings; tab label spacing needs follow-up. | Slider drag/tap, numeric invalid/recovery, Japanese save, restart persistence, device-settings return and a reduced viewport remain targeted checks. Sign-out not executed without reauthentication access. |
| Loading / disabled location | Initial location waiting, Directions waiting and service-disabled recovery rendered. Fallback uses legacy blue native buttons instead of the green presentation. | Native denied/revoked grants and live provider failure/empty/no-route remain separately identified; no fabricated server results. |

## Findings and remediation order

Confirmed observations are distinct from static risks and optional visual recommendations. No confirmed P0 crash or inaccessible primary journey so far.

| ID | Priority / evidence | Observed vs expected | Cause / focused correction | Verification |
| --- | --- | --- | --- | --- |
| UX-01 | P1, observed on Explore and Directions with system dark mode | Dark map lies behind dark status icons; system status is difficult to read. Approved application surfaces/maps should follow one light presentation with readable system chrome. | UniWind is pinned light while Android native appearance follows dark system settings. Investigate supported app-level `Appearance.setColorScheme('light')`; leave unsafe `MapView.userInterfaceStyle` unset and retain CSS map style. Do not alter the phone's system theme as a fix. | Cold/reload app under dark OS; verify native map is light and status icons readable; repeat route/AR/Back and light OS. Mocked tests cannot establish native map color. |
| UX-02 | P2, observed D09 entry / Metro stack | Gallery and nearby section both have key `D09`; React warns about duplicate siblings. Navigation should be free of reconciliation warnings and reset each section for a different destination. | `destination-screen.tsx`: use section-specific keys that retain destination identity. | Real screen regression across catalog IDs and switching destinations, fail on duplicate-key console output; reopen pages on phone with no warning. |
| UX-03 | P2, observed AR at 1.1 scale | Heading reads `138° · approxi…`; controls consume space while status text is forced to one line. Status and compass-unavailable guidance should remain readable. | `ar-chrome.tsx`: permit center text to wrap/reflow; shorten the visible Scan label while retaining its explicit intent/accessibility. Keep measured chrome and full camera bounds. | Actual EN/KO/JA resources, large-font/small-width device captures; verify Map/Scan, disabled/busy states, camera bounds and no new requests. |
| UX-04 | P2, observed location-disabled fallback | Recovery abruptly changes to uppercase blue native buttons, default font and blue-grey notices. Loading/permission/error states should use the existing Clean Explorer controls and CSS tokens. | `ui/shared.tsx` still owns old StyleSheet/native Button presentation, used by auth/bootstrap/map/AR statuses. Replace presentation with HeroUI/UniWind while preserving localized children, callbacks, disabled states and lifecycle owners. Do not add a new UI abstraction/library. | Existing location/auth/AR/error suites plus actual disabled-location and camera-denial recovery, larger text and screen scrolling. |
| UX-05 | P3, aesthetic recommendation | Catalog nests a large mint pill inside every rounded white card; long repetitive pending labels dominate the list. | Optional low-risk simplification to cohesive tappable rows using existing HeroUI. Keep provisional status, all nine entries, names and navigation. | Before/after catalog at normal/large text, EN/KO/JA; every row remains at least 48 dp and opens the same ID. |
| R-01 | Review risk, not confirmed defect | Standalone `/settings` has no in-app caller; Profile already renders full settings. | Preserve working navigation; do not introduce an extra Settings step solely to use the route. | Direct link and Back can be tested separately. |
| R-02 | Device follow-up, not yet confirmed defect | 1.6-scale screenshot suggests crowded tab labels. | Reproduce on settled screen before choosing a correction. Never disable app-wide font scaling. | Measure label bounds/spacing under the actual navigator at 1.6 and reduced width. |

Implementation batches (after baseline coverage is recorded):

1. UX-01: app/native appearance alignment; focused regression and device cold/route/AR checks, then a Conventional Commit.
2. UX-02: destination section identity; real screen failing regression, device entry/Back checks, then a Conventional Commit.
3. UX-03 and UX-04: readable shared status/recovery presentation and AR chrome; focused regressions and actual permission/font/language checks, then coherent Conventional Commits.
4. Resolve R-02 if reproduced; perform low-risk UX-05 polish or explicitly retain as optional. Full `npm run check`, Android export/config checks if relevant, independent review, device regression sweep, update validation evidence and reviewable PR. Never merge automatically.

## Acceptance boundaries

Not completed: remediation, final independent review, broad device regression and final UAT readiness audit. No claim of GPS/compass calibration, complete translations, route correctness or safe pedestrian access. Missing content/credentials and unavailable physical conditions remain explicit manual UAT gates rather than successful checks.


## Remediation evidence

- **UX-02 resolved:** gallery and nearby section now use distinct destination-aware keys, retaining their destination-change resets. A real-screen regression failed for all nine IDs before the fix; the destination suite now passes 27 tests. Opened D01–D09 through actual Android links and inspected the rendered names/pages; no duplicate-key banner returned. [Before](evidence/destination-before.png) / [after](evidence/destination-after.png) show D09 at the same viewport. The Google/catalog request and sensor boundaries are unchanged.
- Japanese settings saved successfully and Japanese AR reproduced the same baseline truncated qualifier. Original English was restored using Save; the current cold-start bundle displays English.
- The settled 1.6-scale tab bar remained legible with separated labels; R-02 was not reproduced reliably and is not treated as a confirmed defect.
- **UX-01 implementation awaiting APK:** native default scheme patch replaces the failed app-level Appearance hypothesis; see `docs/validation.md`. The old APK correctly remains dark until rebuilt.
