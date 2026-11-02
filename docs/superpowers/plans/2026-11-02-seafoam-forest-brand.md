# Seafoam Forest brand integration

**Goal:** Integrate the supplied v2.0 identity into the existing branding placements,
retaining the familiar Clean Explorer UI. The owner's 2026-11-02 implementation
request and `ARgala-Brand-Kit-v2/06-Guidelines/README.md` are the specification.

**Architecture:** `global.css` remains the sole token source. Shared SVG components
consume exact outlined master geometry through the installed `react-native-svg`.
Static Expo configuration owns launcher/splash assets; dynamic configuration reuses it.

## Constraints

- Primary actions stay #247A53, stronger green stays #174D38; all existing UI,
  map geography, route blue, typography, layout and native AR colors remain.
- Artwork changes to #42D5A5 seafoam / #174D38 forest / #FCFBF7 inverse.
- Keep Journey only in the existing Welcome/auth decorative space. Omit optional
  patterns, icons and empty illustrations to avoid clutter and startup assets.
- No dependency, navigation, permission, admission or provider-contract changes.
- Continue the existing `feat/brand-kit-rollout` work; preserve supplied kits and
  unrelated untracked documents. No APK build without specific owner approval.

## Task 1: v2 assets and artwork tokens

- [x] Extend actual CSS compilation/logo tests for v2 colors, contrast and exact
  filled Journey geometry; observe failures against v1.
- [x] Copy four production SVG masters and supplied PNG layers/icon/favicon.
  Regenerate shared geometry and monochrome arch using existing tooling.
- [x] Update artwork-only tokens, alias forest to the existing stronger green,
  correct Journey rendering and update splash/adaptive background to forest.
- [x] Verify targeted tests, source provenance, PNG alpha/safe areas and config.

## Task 2: placement review and handoff

- [x] Retain Welcome primary / sign-in horizontal / compact Explore mark sizing,
  accessible labels and decorative ownership. Preserve behavioral assertions.
- [x] Review small marks, inverse lockups, launcher masks and source splash proof.
  Inspect real screens if a device is attached; otherwise label the gap.
- [x] Update design authority/provenance/validation docs to supersede v1 colors.
- [x] Run full `npm run check`, Expo dependency/doctor checks, Android configuration
  introspection and Android Metro/Hermes export; review the complete patch.
- [x] Commit asset/configuration changes and UI integration/docs as focused
  Conventional Commits. Do not push, merge or build an APK.

## Review focus

- Closed v2 Journey path must be filled, not interpreted as the old stroked path.
- Theme aliases must compile for native hook consumption without utility usage.
- Seafoam remains decorative: selected/busy/disabled controls keep existing colors.
- Marks and wordmark clear space must survive 32/64 dp and narrow headers.
- Android masks/splash require a rebuilt preview APK for final native acceptance;
  mock tests, source proofs and exports cannot establish this.
