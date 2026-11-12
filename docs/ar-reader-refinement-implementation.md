# AR stability and reader refinement — November 12, 2026

Implementation is on `feat/ar-experience-refinement`; no merge, deployment or APK build is included. The owner approved the [plan](superpowers/plans/2026-11-11-ar-stability-reader-refinement.md). Destination media, facts, translations and coordinates remain the existing testing material; no destination/entrance approval or Passport authority was added.

## Implemented behavior

- The guarded development route explicitly owns module loading, failure, Retry and Back, with a 20-second deadline. Gallery loading has the same bounded recovery and retired-attempt handling. Principal replacement retires the route owner. Existing native startup, permission and final admission checks remain separate.
- Focus/Close has one declarative native animation owner. Valid completion survives Help/tracking fences and is reconciled in the current transition token, frame and NORMAL tracking epoch. Stale/unmounted callbacks cannot settle a newer transition. Accepted Close updates restoration intent immediately, before an AppState event can retire uncommitted React state. Recenter remains explicit.
- A separate clean matte reader texture removes the inner brackets. Generation checks confirmed every preexisting AR artwork file, including the chapter tile frame, stayed byte-identical.
- The selected-destination bottom toolbar groups Recenter/Capture with contextual A−/A+, using the existing parent reading preference. Size commands are bound to the focused chapter token/frame; preference errors and Retry remain on the screen toolbar. Isolated legacy probes retain native size/error recovery when they have no screen reading owner.
- The 1.25-unit canvas, 1.275-unit painted surface and **2.25-unit focus distance** remain unchanged. Flowing text height grows from 0.50 to 0.82 units; aspect-fit photo height from about 0.405 to 0.76, with a separate 0.24-unit metadata region. Shared geometry budgets drive pagination.
- Previous/page indicator/Next/Close share a native row beneath the canvas, with no independently animated anchor. Visible action sizes are retained; disabled/decorative surfaces ignore hits. Loading/error/Retry, image identity, metadata offsets, full attribution and CJK font fallback are preserved.
- Existing Help has a short EN/JA/KO Recenter recovery sentence. No new dependency, native patch, GPS wiring, video or new media was introduced.

## First-open investigation

The original A53 cold-route trace recorded `route-import-start`, fallback commit, pending lazy status at five seconds, then successful import resolution at **10,883 ms**. The selector did not commit while that fallback remained visible. This localizes the observed failure to route reveal after import resolution, before gallery selection, permission or Viro scene work. It does not identify a specific upstream React/native renderer defect.

The explicit loading owner was selected from that evidence. With the change, a fresh-process first entry reached the selector without reopening, followed by **five successful consecutive exit/reopen checks**. A deadline/Retry is also present for genuinely unresolved or rejected loading; that deadline alone is not claimed as proof of the original failure's cause.

The test setup separately encountered a corrupt Metro file-map cache and an early development-client connection before the server was ready. Metro recovered via a full crawl. After repeated Fast Refresh changes, the retained native app surface sometimes became blank; a clean process restart restored it. These development-server/reload conditions are distinct from the traced prototype failure. No app data was cleared.

## Automated evidence

| Command / scope | Result |
| --- | --- |
| `npm run check` before the new toolbar/layout | TypeScript, zero-warning lint; **1,460 tests / 130 files passed** |
| `npm test -- src/features/destination-ar/destination-ar-session-screen.test.tsx src/features/destination-ar/destination-ring-scene.test.tsx src/features/ar-photo/ar-photo-controls.test.tsx` | **129 tests / 3 files passed** for toolbar/capture ownership |
| `npm test -- src/features/destination-ar/content-layout.test.ts src/features/destination-ar/information-gallery.test.ts src/features/destination-ar/information-gallery-panel.test.tsx src/features/destination-ar/destination-ring-scene.test.tsx src/features/destination-ar/destination-ar-session-screen.test.tsx` | **175 tests / 5 files passed** for reader geometry, content, restoration and transitions |
| `npm run check` at `fa87670` | TypeScript, zero-warning lint; **1,472 tests / 130 files passed** |
| `npm run check` after final rounded controls | TypeScript, zero-warning lint; **1,475 tests / 130 files passed** |
| `EXPO_OFFLINE=1 EXPO_PUBLIC_VIRO_SPIKE=1 npm run export:android -- --max-workers 1` | PASS after final rounded controls; Metro/Hermes Android export, 74 assets and 8.6 MB bundle `index-109acfaf1181f7755821e04437e2b547.hbc`; not an APK |
| `git diff --check` | Passed before implementation commits |

Watched failures before correction: unresolved route recovery; gallery timeout in EN/JA/KO; completion delivered during tracking loss/Help; atomic Close before React commit; conflicting animation control; delayed native finish; separate reader binding; missing contextual toolbar; floating row placement and insufficient photo area. Existing tests were updated where their assertions intentionally encoded the superseded internal-control layout or old line budgets. Source-character retention and media/caption cursor tests remain active.

## Physical Android evidence

Device: Samsung Galaxy A53 SM-A536E, Android 16. Existing development APK last updated November 8; current JavaScript through USB Metro. Physical 1080×2400, density override 420 (physical density 450), system font scale 1.1. The USB connection initially dropped and was re-established. No settings/account/journal data was cleared.

| Scenario | Current evidence |
| --- | --- |
| Cold process / first prototype navigation | Selector opened without exit/reopen after explicit loader change |
| Repeated exit/reopen | Five of five selector checks passed |
| Native camera startup | Rear camera opened; stationary trial exposed bounded timeout/Retry; second explicit Retry reached a live tracked photo reader |
| Focus/collapse and rapid Close | ADB Close returned to original cover; final controlled trial sent three rapid Close taps and settled to the complete cover without Recenter. Physical finger/near-boundary interruption matrix remains pending |
| Recenter / Help / interruption restoration | Recenter after upright positioning produced centered text/photo and spatial row; brief Home/app return retained the focused photo at 2/5. Longer background returned through restoring startup, restored photo/credit at 2/5, then showed limited tracking and explicit Retry. Stable NORMAL recovery, Help and controlled transition interruption remain pending |
| Screen and spatial toolbar fit/touch | Final rounded buttons/container, text/photo canvas and both toolbars rendered on A53; no overlap in retained views. Previous changed 3/5 text→2/5 photo credit; Close accepted. A second Previous tap missed after phone movement: ADB coordinates do not establish finger reliability |
| Photo/text presentation, caption/credit and portrait | Final text and large landscape photo/credit captured; caption and credit remain independently paginated at the current size. Portrait check pending |
| EN/JA/KO native rendering and reading sizes | EN photo metadata changed from small to standard and back through screen A+/A−; photograph/page retained and original small preference restored. Large, text-page reflow and JA/KO native glyphs pending |
| Capture preview/discard | Explicit Capture opened the real native screenshot preview; Discard selected, without Save or Share. Returned to live native camera/reader after Discard |
| Normal ACLC real-GPS admission | Not repeated; no assumption of physical on-site eligibility. Prior November 11 evidence remains historical |

Native fit and touch are separate from mocked callbacks and bundle export. Physical finger reliability, large-text/short-view clearance and interrupted animation behavior must be recorded before calling this defense-ready. Private screenshots/recordings belong outside Git; no generated mockup is native evidence.

## Review and delivery

The independent read-only review found no critical or minor issues and one important short-screen risk: unbounded bottom-toolbar error recovery. A new 320×360 / 1.5-font-scale real-screen regression failed before correction. The bottom overlay is now capped to 40% of the current scene with one scroll owner; Recenter/Capture use labeled icon buttons on short scenes. The focused recovery/capture suite passes 79 tests across two files. This proves application bounds and ownership, not native Yoga or finger acceptance. All implementation stays on this one branch; source changes are split into stability and visual commits. No new APK is authorized by this report.

Private device evidence currently retained: `.superpowers/reviews/ar-reader-20261112/startup-retry.png` shows the localized bounded native-startup failure and explicit Retry. It is **not** a reader-layout screenshot. A second explicit startup retry acquired tracking. A real photo page, full caption/credit and floating reader row rendered; the owner viewed it and liked the layout, requesting rounded container corners. The private `photo-initial-framing.png` records that pre-rounded view, with captured orientation partly outside the left edge. The owner then requested matching rounded buttons too. The authored rounded toolbar surface and color-tinted button alpha mask preserve control sizes, visible native quad hit geometry and event ownership. On a clean process at final runtime commit `1088e58`, the A−/A+ toolbar was visible after focus. An ADB A+ tap increased the photo metadata from small to standard, and A− restored small, retaining the photograph/page. `final-screen-toolbar-small.png` and `final-screen-toolbar-standard.png` record this. Captured world orientation was sideways, placing the native row beyond the right edge; the owner was asked to hold the phone upright and Recenter. After upright positioning and Recenter, the final rounded row rendered beneath the focused text/photo with clear separation from the screen toolbar. Retained evidence: `final-expanded-text-rounded.png`, `final-photo-credit-rounded.png`, `rapid-close-restored-tile.png`, and `final-photo-brief-return.png`, and `restored-focus-tracking-limited.png`. The comprehensive interruption and physical finger matrix remains outstanding. No tracking or location was synthesized.

The rounded-control follow-ups were checked with the real scene/panel tests: the material regression failed before the mask was applied; 158 focused tests then passed. All older AR textures stayed byte-identical when generating both new assets.

## Remaining presentation acceptance

The source implementation and automated checks are ready for review. A final
presentation sign-off still requires actual finger interaction, JA/KO native
glyphs, the existing portrait photograph, large reading/system text, short
viewport clearance and controlled tracking/background interruptions during
opening/closing/Recenter. These cells are not implied by the successful ADB
trials or the test suite. The device reached 15% battery during the final brief
trial, so extended camera rehearsal was stopped under the project low-battery
rule. No native FPS, thermal stability or transition latency measurement is
claimed. Earlier simultaneous owner/ADB interactions were excluded from the
controlled rapid-Close result.

Keep the current dependencies and scope for the defense. Defer new GPS entrance
calibration, video, additional content and architectural changes. Rehearse the
accepted existing-device flow after charging; decide on a separately approved
presentation APK only after the remaining native matrix. No build is requested
or authorized by this report.

The final longer-background trial restored the logical focused photo and page, but tracking was limited in the changed camera view; stable NORMAL recovery is explicitly unverified. The app was sent to Home to release the camera at 15% battery.
