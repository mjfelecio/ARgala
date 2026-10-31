# Design coherence audit — 2026-10-30

Baseline: `775f9da` on main; work branch `refine/design-coherence`. Untracked
owner kickoff archives/plan and local configuration remain untouched.

## Authority and method

Read current AGENTS, blueprint D01–D54, Clean Explorer design/scope/screen guides,
UI infrastructure, app shell, previous audits, latest refinement and validation.
Inspected HOP `PageTopBar`/shared controls and HOP-Driver Settings/SettingActionRow:
reuse their compact context, scrollable settings and explicit actions, not their
older styling stack or hardcoded colors. Opened Home H01 and prior actual-device
Details/Settings captures. These are historical references, not fresh screenshots.

Audience: visitors discovering ordinary places and selected featured destinations,
with EN/JA/KO support and outdoor/limited-location use. No invented demographics.
Approved identity/type/colors/spacing are indexed in root DESIGN.md; PRODUCT.md
indexes product evidence. Older StyleSheet/system-font/no-Saved/no-filters notes
are superseded by current AGENTS, infrastructure and blueprint. D01–D09 names
remain provisional; ACLC approved geometry is not approved factual AR content.

ADB is installed but `adb devices -l` returned no device. Physical verification
is unavailable, not successful. No emulator session or APK build was started.

## Audit, in journey order

| Area / state | Evidence and assessment | Decision |
| --- | --- | --- |
| Explore, unsearched/search/selection | Current controls/screen/tests + recent device evidence: compact header, pinned Featured, explicit Search and measured dock already corrected. | Preserve; no speculative restyle. |
| Directions, collapsed/expanded/mode change | Current sheet/screen + October 30 measurements: complete primary group and full expanded destination name. | Preserve corrected geometry; fresh native locale matrix pending. |
| Featured catalog, initial/pending | Passport then a tall content-maintenance card precede the catalog. Each destination nests a mint pill inside a white card; names are subordinate to IDs. Previous UX-05 explicitly deferred this polish. | P2 hierarchy: lead with destination choices after Passport; move updates after catalog; one white tappable surface per destination, name first, honest status below. |
| Featured/ordinary Details, missing/complete | Existing minimal featured teaser, explicit disabled reasons, ordinary editorial details and provider credits. | Preserve approved content/action boundaries. |
| Selected AR entry / ring / recovery | Current preflight/chrome/session/scene + recent evidence: bounded overlays, tracking guards, farther panels and held collapse already intentional. | No geometry, hit-routing, motion or admission change without new physical evidence. |
| Saved, long list / long Google ID | Actual screen renders every bookmark in ScrollView although schema permits 1,000; full opaque ID can dominate a card. Open and Remove have competing weight. | P2: virtualized growing rows, bounded visible ID (full ID retained), clear Open priority and subordinate Remove. No details fetching. |
| Passport, empty/earned/pilot | Count excludes pilot; state/error/sync remain truthful. | Preserve count/earning; keep summary in catalog, not another tab. |
| Profile/Settings, guest + large text/short viewport | Journal entry/guest note/sign-in and development launchers are fixed siblings above SettingsForm's only scroll owner. Growing translated text can consume the viewport before Account/Language/Save. | P1 accessibility risk confirmed in composition: move all growing content into the existing single scroll owner; retain compact fixed title/insets. Add failing real-screen containment regression before fix. |
| Authentication / onboarding, keyboard/error/language | Actual screens, resources and regression contracts: growing white form, keyboard avoidance, explicit submit/Continue and locale boundaries. | No new defect established; preserve. Native keyboard/fresh-install checks pending. |

No new P0 established. P1 is a code-confirmed layout ownership defect, not a
claim of device reproduction. Contrast baseline remains CSS-authoritative; do
not introduce a new palette/dark mode to satisfy generic skill defaults.

## Ordered cleanup

1. Install reviewed official Impeccable Codex skill/hooks, add evidence-linked
   project skill and durable context pointers; no overlapping Taste pack.
2. Reproduce/fix Profile scroll containment for both route entries and guest copy;
   retain draft, Save, sign-out, navigation and inset behavior.
3. Simplify Featured cards and move maintenance below the primary catalog.
4. Virtualize Saved; retain full identifier/action semantics and real localized
   loading/error/empty states, reduce competing action emphasis.
5. Targeted regressions, full check, final diff review and screenshot comparison
   where feasible. Native touch/AR/IME/field work remains a separate gate.

## Skills and installation

- Official [Impeccable](https://github.com/pbakaus/impeccable), source inspected at
  `df3a4abe7d0840d5f60324812c432e00b66a4e75`, skill 4.8.0 / engine 0.1.18.
  Reviewed README, npm shim, Rust installer and Codex hook manifest before running
  `DO_NOT_TRACK=1 npx --yes impeccable@4.8.0 install --providers=codex --scope=project --yes`.
  Adds `.agents/skills/impeccable` and `.codex/hooks.json`; no force, app dependency,
  instruction overwrite or other provider install. Installer timed out after
  writing skill/hooks while acquiring engine; launcher subsequently loaded context
  successfully. Codex must approve hooks via `/hooks`; this OpenCode session does
  not establish Codex hook execution. Shared telemetry disabled.
- `argala-ui`: project-specific portable rules with relative evidence links.
- Existing Expo design-system: useful adopt-before-build/token ownership and
  scaling guidance. Native-UI: useful keyboard/states/insets; its iOS-centric
  defaults and component migration suggestions yield to ARgala. Animation: use
  purpose/reduced-motion/UI-thread checks, but add no decorative motion here.
- [Taste](https://github.com/Leonxlnx/taste-skill) evaluated from official README:
  direction dealing, imagery and browser-review workflow overlap and are not a
  concrete missing native capability. Not installed. No additional UI libraries.

## Completed cleanup and review — 2026-10-31

All three scoped findings are addressed. Profile retains its fixed compact title
and existing safe-area owner, but Account, guest guidance, shortcuts and settings
now share SettingsForm's one ScrollView. The draft/save hook and navigation are
unchanged. Featured uses one white, name-first HeroUI interaction surface per
destination, with provisional status below and updates after the catalog. Saved
uses FlatList with stable bookmark keys, growing rows, a two-line visible opaque
ID (full ID retained for accessibility/navigation), primary Open and ghost Remove.
Loading/read failure/retry/empty remain distinct. No new display strings, facts,
provider requests, persistence shape, dependencies or native configuration.

Rendered review caught two composition details the original native mocks could
not establish: HeroUI's unlayered ghost/pill selectors overrode the intended white
card/radius, and its class merger removed the custom title-size utility. Scoped
important surface/radius utilities and ordinary token-styled Text inside the
HeroUI Button resolve those conflicts without changing all buttons. A real
component regression first failed on the missing title role. Browser computed
styles then confirmed white, 20px radius and 16px/24px title at text scales 1/1.5.

Final diff review checked SettingsForm mount/draft ownership; journal readiness,
principal and save behavior; exact navigation IDs; catalog status and maintenance
access; CSS precedence; virtual-list header/empty rendering; and provider/sensor
boundaries. No confirmed remaining source blocker in this scoped change. This is
an in-thread source/render review, not an independent review or native UAT sign-off.
General Impeccable web detector was not used as a native acceptance gate.

Implementation, skills and evidence are published in [PR #36](https://github.com/mjfelecio/ARgala/pull/36)
as separate incremental commits. Repository CI and review decisions are tracked
there; publication does not imply merge approval or physical acceptance.

### Independent read-only review — 2026-10-31

At the owner's explicit request, a separate review agent inspected
`775f9da..3d04976`, all changed application/test files, relevant consumers/hooks,
locale resources and binding design guidance. It opened the three browser contact
sheets before the builder audit, plus before/after comparisons, and verified the
vendored skill against the official release (only the documented whitespace
normalization differed). It found **no confirmed source blockers or actionable
regressions**. Independently rerun typecheck, zero-warning lint, five focused suites
with **84 passing tests**, and baseline-to-HEAD whitespace check passed. It changed
no tracked files, built no APK and did not grant native acceptance or merge itself.

The reviewer specifically retained the limitation that the FlatList test double
renders only the first ten rows: it cannot prove scrolling, window eviction /
re-entry or native recycling. Browser evidence still cannot establish Android
layout, text scaling, numeric IME/Save visibility, TalkBack, fling performance,
Back/refocus or foreground recovery. These remain physical acceptance work below.

## Before/after visual evidence (browser only)

The isolated review renders the actual screen components, installed HeroUI,
UniWind/global CSS, bundled font and real locale resources through React Native
Web in headless Chrome. Auth/navigation/settings/reminders are isolated, journal
state is explicitly synthetic, and no provider or device service is exercised.
Baseline copies of all six changed component files were byte-checked against
`775f9da`. No fabricated bookmark entered app storage. Temporary harness files
remain ignored, outside app routes; no test bypass was added to production.

| State | Before | After |
| --- | --- | --- |
| Catalog, EN, 360×800 | [Before](evidence/design-coherence/before-destinations-en-normal.png) | [After](evidence/design-coherence/after-destinations-en-normal.png) |
| Saved, EN, 360×800, synthetic ID | [Before](evidence/design-coherence/before-saved-en-normal.png) | [After](evidence/design-coherence/after-saved-en-normal.png) |
| Profile scrolled to numeric input, EN, 320×640, 1.5 text | [Before](evidence/design-coherence/before-profile-en-large-short-input.png) | [After](evidence/design-coherence/after-profile-en-large-short-input.png) |

Reviewed contact sheets: [normal EN/JA/KO](evidence/design-coherence/after-normal-locales.png),
[narrow/large text EN/JA/KO](evidence/design-coherence/after-large-short-locales.png),
[Saved empty/loading/read-error EN/JA/KO](evidence/design-coherence/after-saved-states.png).
There were 18 baseline and 27 after screen/state probes plus six input-scroll
captures per revision. After probes had no uncaught JS exceptions or document
horizontal overflow; measured browser buttons met 48×48. Long names/CJK labels
wrapped, errors/recovery remained visible, and Profile's guest block scrolled away
instead of occupying the input viewport. Existing English loading fallback remains
visible in partial locales. These are browser observations, not Android measurements.

Text enlargement multiplies computed text/line sizes only, not spacing; it is not
Android `font_scale`. Browser safe-area handling, synthesized font weights,
color-library diagnostics and IME differ from Android. No screenshot here proves
native typeface/contrast, Yoga, TalkBack, system bars, recycling performance,
keyboard placement, touch delivery, live provider/auth behavior or foreground
recovery. The review harness initially needed explicit web module resolution and
same-origin font serving; blank attempts were rejected, not retained as evidence.

## Checks and remaining acceptance

- Baseline `npm run check`: **1,254 tests / 114 files**, typecheck and zero-warning lint.
- Deliberate RED: Profile containment 2 failures; catalog ordering/shape 3 and
  Saved list/ID presentation 4 failures; later title-role 3 failures. Fixed source
  passes the focused three-file run: **41 tests**.
- Final `npm run check`: **1,266 tests / 116 files**, strict TypeScript and zero-warning lint.
- `npm run check:native-patches`: passed, zero updates.
- `git diff --check`: passed.
- `npm run export:android -- --max-workers 1`: passed on the explicit rerun,
  bundling 3,000 modules and producing the 8.5 MB Android Hermes bundle in `dist`.
  The interrupted earlier attempt is not counted. Export is not an APK build or
  native/device verification; no APK build was started.
- No Edge, migration or native configuration changes; their additional local
  checks are not required for this scope. PR CI still runs the full repository matrix.

**Physical Android pending:** installed APK screenshots at 360/short sizes and
normal/large text in EN/JA/KO; guest/account Profile scroll and numeric IME/Save;
Saved long-list fling, remove/reopen and TalkBack; icon Back/history; all modified
screens after foreground return. Preserve data/settings and reuse the compatible
development APK with current Metro when available. Do not build another APK
without specific approval.

**Separate field gates unchanged:** AR ring comfort at 1.5 units, held native
interactions/collapse, tracking/camera recovery and photo actions need physical
testing; selected-entry GPS calibration and background reminder Enter/delivery
need on-site/OS verification. The latest Explore/Directions/native AR refinements
remain untouched. Approved content and rights are still needed for nine-site UAT.
