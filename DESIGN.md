# ARgala design authority

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

## Composition

Name/task first; one prominent next action. Group related content, disclose
secondary detail progressively, and keep errors/recovery and provider credits
findable. Use 16-unit page gutters (existing forms may retain 20/24), 8–12 within
groups, 16–24 between groups. Touch targets are at least 48 dp and may grow.
No fixed-height text rows or app-wide font-scaling cap. [Design system §§3–7](docs/design/clean-explorer/DESIGN_SYSTEM.md).

## Protected recent decisions

Do not undo the compact branded Explore header/pinned Featured shortcut, measured
Directions collapsed primary group, 1.5-unit AR focused-panel distance, or
collapse-on-other-tile held interaction. [Latest refinement](docs/ui-refinements-2026-10-30.md).
Keep full native scene bounds independent of chrome/sheets and retain the accepted
finger-pad brief hold/release instruction, not a short-tap promise.

## Working skill and review

Use [argala-ui](.agents/skills/argala-ui/SKILL.md) for Android insets, keyboard,
large text, EN/JA/KO, AR and screenshot acceptance. General Impeccable/Expo defaults
yield to these approved project decisions. No new art direction or questionnaire.
