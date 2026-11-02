# Owner refinements after reference corrections

Owner feedback supersedes the preceding dot/underline, provisional badge and
numeric-entry presentations. AR design and native configuration remain excluded.
Implementation commits: `f44673d` (explicit Saved View/cache behavior) and
`8fa1bf8` (UI refinements and sticky settings) on `feat/seafoam-forest-ui`.

Implemented changes:

- Saved icons align to the card's top. Rows use a real name/address only while
  matching-language provider content is available within its original reuse
  window, with official provider credits. The redundant “Google Maps · Open to
  load details” text is removed. Unknown records use the localized “Saved place”.
- The owner explicitly chose **Load directly from View**. The foreground/focused
  View handler starts at most one missing lookup before navigating; repeated taps
  are guarded. Details remains a disabled observer. Direct links, refocus,
  foreground return, remounts, invalidation and failures do not inherit authority.
  Completed full responses are reused; recovery after failure stays explicit.
- No bookmark schema or persistence changes: Google IDs are durable; display
  names/addresses remain transient. Restarting the app may therefore restore
  generic labels until an explicit View lookup. No automatic list lookups.
- Featured catalog and preview remove the Provisional name presentation without
  changing editorial verification data, eligibility or pending-content guidance.
- Nearby Places uses a white rounded section, forest heading, contextual icon and
  outlined search action. Result rows match the catalog, with one explicit leaf
  action, distance and chevron. Search/500 m/attribution/error contracts remain.
- Language rows have horizontal padding and rounded selection backgrounds.
  The numeric radius input and long independent-discovery explanation are
  removed. Slider, detents, presets, precise restored values and explicit Save
  remain; keyboard-entry-only tests are replaced by exposed-control regressions.
- Settings shows sticky **Save** and **Undo** only for dirty drafts with the
  regular Save action offscreen. Native content/viewport measurements and scroll
  offset determine visibility. The absolute bar preserves the one scroll owner;
  measured bottom clearance keeps later content reachable. Errors from sticky
  Save are visible beside its actions. Undo restores both latest saved values,
  discards unfinished local slider interaction and is disabled during saving.
- The later tab instruction removes the dot/underline entirely. Selected text
  uses the existing explicit semibold utility; inactive text stays regular.

## Review and verification

Initial behavioral regressions failed before badge/input removal and direct
Saved loading/cache display changes. Sticky tests failed before implementation.
The independent review found two issues, each reproduced and corrected:

1. Expired Details could mask fresh Nearby in a Saved row. Rendering and expiry
   now resolve the same reusable source, preserving its original timestamp. The
   regression retains the actual default-zero-GC Nearby source with a disabled
   observer, as the retained Map does; cache absence never grants request authority.
2. Sticky Save failures were initially offscreen near the regular Save. The
   corrected regression inspects the sticky surface itself in EN/JA/KO, including
   live language changes, rather than accepting text elsewhere in the tree.

Focused checks before the latest additions: 35 Saved/journal tests and 99
settings/catalog/Nearby tests passed. Updated sticky/cache checks: 54 tests passed
before the sticky-feedback correction. The full pre-sticky check passed 1,335
cases; it is historical and does not establish final acceptance.

Final `npm run check` passed strict TypeScript, zero-warning ESLint and **1,342
tests in 118 files**. Final `npm run export:android` passed Metro/Hermes export:
`index-e43810c11b0659b797567cc588bef2cf.hbc` (8.5 MB). `git diff --check` passed.
No dependencies, native configuration, backend, persistence schemas or AR
presentation changed; no APK build, push, PR, merge or deployment was performed.

## Native evidence and limits

Existing Galaxy A53 / Android 16 development client, English, 1080×2400,
preexisting density override 420, font scale 1.1. Private captures under
`/tmp/argala-owner-refinements/`: `language-after.png` shows padded rounded
language selection and `profile-after.png` shows slider/presets without the
numeric input or removed technical explanation. These predate the later sticky
and marker-removal instructions. `current.png` likewise reflects the intermediate
underline and is not evidence for final selected-tab styling.

The original Metro process stopped during this task; it was restarted. Startup
and background-app captures establish no final-screen acceptance. Native
verification of direct View, the polished Nearby states, final selected-tab
weight and the new sticky bar (including visibility, Undo and errors) remains
pending. The final implementation is verified through real-screen/hook tests
with native/network boundaries mocked and through Android bundle compilation.
Those checks do not establish Android layout/touch acceptance. No device display,
language, radius, account or bookmark edits were made for this inspection.

The simpler direct View handler replaces the initially considered navigation
intent: it issues the request in the explicit event, so no mount effect needs
lookup authority. Saved display reads and expiry use the original reusable
source snapshot; observation and seeded queries never restart its reuse window.
