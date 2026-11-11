# ARgala design authority

## Cinematic AR assignment — 2026-11-02

The owner separately assigned the approved [cinematic AR design](docs/design/cinematic-ar/DESIGN-SPEC.md).
This supersedes the earlier refresh's AR exclusion only within that enhancement.
Existing GPS/admission, native tracking, ring geometry, hold interactions and AR
palette stay contractual. [Implementation and acceptance limits](docs/design/cinematic-ar/IMPLEMENTATION.md)
include the failed native video feasibility gate; no video player or reviewed
voice asset is claimed shipped.


## Approved Seafoam Forest screen refresh — 2026-11-02

The later owner-approved eight-screen handoff supersedes earlier artwork-only
visual restrictions below. Use ivory #FCFBF7 pages, white surfaces, #247A53
primary controls, #174D38 headings/Passport, restrained #42D5A5
seafoam accents and #E8F8F0 contextual mint. Later owner instruction excludes AR design from this task: retain its existing
#102724 panels, #71DCD2 edges and all native presentation. Logos, launcher
and Journey geometry remain locked. Natural map geography, route blue and all
provider, navigation, permission, persistence, eligibility and lifecycle contracts
remain in force. See the committed [refresh specification](docs/design/seafoam-forest/DESIGN-SPEC.md) and
[implementation evidence](docs/design/seafoam-forest/IMPLEMENTATION.md). Earlier rollout passages are historical where
they conflict with this visual approval.

This file routes design tools to existing evidence; it does not replace the
approved design. [AGENTS.md](AGENTS.md), later explicit owner decisions, and
current implementation notes override historical/proposed handoff text.

## Established visual language

Clean Explorer: map-first, green/white, pale mint context, rounded pill actions,
quiet sections and outdoor-readable contrast. Plus Jakarta Sans is bundled, with
native CJK fallback. [UI infrastructure](docs/ui-infrastructure.md) supersedes the
early handoff's system-font/StyleSheet suggestions. [Prior hierarchy refinement](docs/audits/2026-10-21-ui-hierarchy-refinement.md)
establishes white utility pages, plain sections/dividers and subordinate actions.

## Token and component authority

[global.css](global.css) is the sole visual token/theme source: primary #247A53,
strong #174D38, mint #E7F4EC, white, ink #1C2923, secondary #3F4942, route #2A72E5.
Use its typography roles, 4-unit spacing rhythm and input/card/sheet/page/pill
radii. HeroUI Native owns primitives; UniWind owns presentation. Read installed
component source before applying newer documentation. No parallel TS theme,
NativeWind migration, @expo/ui replacement or dependency pack for this cleanup.

## Brand artwork

Seafoam Forest v2 (2026-11-02) retains the original green UI palette. Outlined
primary/horizontal/arch logos and Journey artwork use #42D5A5 seafoam with #174D38
forest or #FCFBF7 inverse. Launcher/splash backgrounds use forest. Artwork-only
CSS tokens keep these separate from UI semantics; primary actions stay #247A53.
Existing text, surfaces, fields, tabs, maps and native AR colors remain.
See [brand provenance](docs/brand-kit-rollout.md).

## Composition

Name/task first; one prominent next action. Group related content, disclose
secondary detail progressively, and keep errors/recovery and provider credits
findable. Use 16-unit page gutters (existing forms may retain 20/24), 8–12 within
groups, 16–24 between groups. Touch targets are at least 48 dp and may grow.
No fixed-height text rows or app-wide font-scaling cap. [Design system §§3–7](docs/design/clean-explorer/DESIGN_SYSTEM.md).

## Protected recent decisions

Do not undo the compact branded Explore header/pinned Featured shortcut, measured
Directions collapsed primary group, 2.25-unit AR focused-panel distance (owner comfort adjustment, 2026-11-11), or
collapse-on-other-tile held interaction. [Latest refinement](docs/ui-refinements-2026-10-30.md).
Keep full native scene bounds independent of chrome/sheets and retain the accepted
finger-pad brief hold/release instruction, not a short-tap promise.

Selected-destination AR uses [Destination Stories](docs/ar-destination-stories.md):
native chapter covers and image/text reading pages, bounded top/bottom utilities,
and session-only Opened indicators. Editorial readiness and physical acceptance
remain separate from the implemented presentation.

## Working skill and review

Use [argala-ui](.agents/skills/argala-ui/SKILL.md) for Android insets, keyboard,
large text, EN/JA/KO, AR and screenshot acceptance. General Impeccable/Expo defaults
yield to these approved project decisions. No new art direction or questionnaire.
