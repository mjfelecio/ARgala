---
name: argala-ui
description: Refine or review ARgala screens within the approved Clean Explorer identity. Use for hierarchy, spacing, accessibility, EN/JA/KO, Android layout, AR readability and screenshot verification; not for replacing the product design.
---

# ARgala UI refinement

Paths below are relative to this skill directory; work from the repository root.
Read [AGENTS.md](../../../AGENTS.md), [DESIGN.md](../../../DESIGN.md) and the
[latest refinement](../../../docs/ui-refinements-2026-10-30.md) before editing.
The owner approved the product; do not launch another design questionnaire.

## Authority and ownership

- Later direct owner decisions and current AGENTS rules override historical
  handoff proposals; the [blueprint decision ledger](../../../ARgala_MVP_Blueprint.md)
  preserves broad discovery, minimal featured prearrival details and on-site AR.
- Preserve Maps-inspired Clean Explorer, not a new identity. Use
  [global.css](../../../global.css) tokens and HeroUI Native primitives with
  UniWind. No second TS theme, NativeWind or wholesale @expo/ui replacement.
  The [infrastructure guide](../../../docs/ui-infrastructure.md) supersedes
  older font/StyleSheet advice. Installed component APIs take precedence over
  generic skill examples. Use Ionicons already present, not emoji controls.
- Retain bundled Plus Jakarta Sans, approved green/white/mint, route blue only
  for route/location meaning, existing radius/type scales and the 4-unit rhythm.
  [Design system](../../../docs/design/clean-explorer/DESIGN_SYSTEM.md).
- Read relevant HOP references as AGENTS requires, but do not copy their older
  stack, hardcoded colors, raw errors or backend behavior.

## Hierarchy and disclosure

- Lead with destination/name or task, then essential context, then the primary
  action. Use secondary/outline/ghost for navigation alternatives, save/remove,
  maintenance and recovery as appropriate. Don't make every action filled green.
- Simplify nested card/pill stacks into a single understandable interaction
  surface. Keep verified/pending distinctions visible; don't treat internal IDs
  as display titles. Never fabricate names for ID-only Google bookmarks.
- Prefer plain sections/dividers on utility/detail screens. Use existing
  16-unit page gutters, 8–12 within related groups and 16–24 between sections;
  preserve established 20/24-unit form gutters where intentional.
- Keep failures, recovery, consent, walking cautions and attribution visible;
  progressive disclosure cannot hide authority or safety limits.
  [Hierarchy precedent](../../../docs/audits/2026-10-21-ui-hierarchy-refinement.md).

## Android layout and interaction

- Insets have one owner: tab navigator owns its bottom inset, stack pages their
  own. Maps extend behind status bar; inset controls. Keep native map readiness,
  credit padding, measured dock occupation and settled fit distinct.
- Preserve compact Explore header and content-measured Directions peek, including
  compact action group + native handle + bottom clearance exactly once. Never
  replace these with screenshot-derived fixed heights. Expanded Journey retains
  full names. [Recent fixes](../../../docs/ui-refinements-2026-10-30.md),
  [navigation](../../../docs/app-shell-navigation.md), AGENTS map rules.
- Keep growing page content in a bounded scroll owner, not fixed siblings above
  an ever-smaller form. Don't nest vertical ScrollViews; virtualize genuinely
  large collections (journal supports 1,000 bookmarks). Leave headings readable.
- Targets ≥48 dp, visible pressed/disabled/busy/selected/expanded states, translated
  icon labels; decorative icons aren't actions. Preserve Android system Back.
- Forms retain keyboard avoidance and handled taps; inspect focused input,
  errors and Save with IME visible. No new keyboard library for cosmetic work.
  [Auth](../../../docs/design/clean-explorer/AUTHENTICATION.md),
  [Settings](../../../docs/design/clean-explorer/PROFILE_SETTINGS.md).
- Allow system text scaling and wrapping/content growth; no app-wide caps or
  fixed text heights to imitate PNG pixels. Short screens must remain scrollable.

## English / Japanese / Korean

- Copy belongs in `src/i18n/locales/`; render translation keys/codes at the UI
  boundary. Test actual resources, known failure, generic fallback, recovery and
  live locale changes. Never show raw native/provider error messages.
- Test long proper names, Japanese/Korean wrapping and font fallback. Do not
  insert forced Latin line breaks, invent content translations or truncate
  essential guidance/actions. Autonyms/proper/provider names may remain data.
- First-launch language preview remains local until Continue; Settings retains
  explicit Save. [AGENTS i18n/onboarding rules](../../../AGENTS.md),
  [Welcome](../../../docs/design/clean-explorer/WELCOME.md).

## AR comfort and readability

- Dark translucent panels, restrained cyan/teal edges and emerald accents extend
  Clean Explorer (blueprint D35/D47). No cockpit, radar or unrelated neon shell.
- Rich information/pagination/A−/A+ remain Viro-native; 2D overlays are only
  utilities/status/recovery. Bounds follow visible content, `box-none`; don't
  expand transparent overlays over the whole touch scene.
- Preserve 1.5-unit focused-panel distance, stable captured orientation, current
  transition/tracking/fresh-pose guards and collapse-on-other-visible-tile behavior.
- Tell users to use the finger pad, hold briefly, then release. Short-tap
  unreliability in Viro 3.0.3 is accepted; never add a native tap correction.
- Never trade admission, GPS freshness, restoration deadlines or live-frame
  ownership for appearance. Test contrast against light/dark camera backgrounds,
  physical panel comfort and held native hits separately from mocked callbacks.
  [Latest refinement](../../../docs/ui-refinements-2026-10-30.md),
  [ring device guide](../../../docs/aclc-ar-ring-device-testing.md), AGENTS.

## Review workflow

1. Read prior audit/validation and inspect real feature code/states before edits.
   Open approved references and distinguish them from current device screenshots.
2. Capture the installed development APK via ADB when available, recording device,
   viewport/density/font scale, locale, APK/native capabilities and JS revision.
   Preserve session/data and restore changed settings. No build without approval.
3. Rank concrete findings P0–P3 with screen/state and evidence. Separate confirmed
   failures, code risks and optional polish. Write an ordered small cleanup plan.
4. Demonstrate behavioral failures with real-screen/hook regressions before fixes;
   mock native/network boundaries, not the flow being checked. Preserve paid intent.
5. Compare before/after at 360×800 and short/narrow Android sizes; normal and ≥1.5
   text; EN/JA/KO; sheets collapsed/expanded; keyboard; loading/error/empty/long
   content; Back/refocus/foreground recovery where touched. Record skipped cells.
6. No phone: continue independent work using current code, prior captures and
   explicitly labeled browser/component evidence. Browser reflow is supplementary,
   never Android Yoga, IME, native map/camera, TalkBack or Viro acceptance.
7. Run targeted checks then `npm run check`; run additional AGENTS checks when
   backend/native scope demands them. Review final diff; commit coherently with
   Conventional Commits. Record exact results in `docs/validation.md` and audit.
8. Separate automated/static, rendered screenshots, physical touch/tracking/camera,
   and on-site GPS/background reminders. No invented UAT or native success claims.
