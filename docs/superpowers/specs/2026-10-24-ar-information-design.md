# Floating AR information design

Implements PR A of the [client follow-up brief](2026-10-24-client-review-followups.md), on main after optimization PR #21 (`101e450`). The owner delegates decisions and prefers stable, simple implementations. Every preview APK build still needs separate approval.

## Existing boundaries and references

`Place` already supplies optional `address` and `description`; its normalized model has no category field. Reuse those fields without another query or schema/mask change. Omit category icons rather than infer a category from a name. `rankPlaces` already derives raw `eligible`; `ArDiscovery` already validates GPS/watch health, native timestamps and true heading before supplying overlay labels. The nearby sheet and selected place share a stable provider ID.

The required navigation-reference inspection also identified these HOP-Driver files for PR B:

- `features/booking/active-booking/hooks/useSnappedCoordinates.ts`: nearest-point projection and distance-to-line; its poor-accuracy force-snap is unsuitable for this walking milestone.
- `features/booking/active-booking/utils/sliceRouteData.ts`: remaining geometry from the original line.
- `features/booking/active-booking/hooks/useTripProgress.ts`: remaining length and progress-derived estimate; arrival based only on remaining geometry must be strengthened.
- `features/booking/active-booking/hooks/useNavigationalMapLogic.ts`: memoized clipped geometry and map consumption; vehicle camera/rerouting behavior is excluded.
- `features/booking/active-booking/hooks/useNavigationSession.ts` and `useNavigationStepsCoordinator.ts`: reference/session ownership and step progress; no voice or unsupported turn guidance is being copied.
- `features/booking/active-booking/hooks/useReroutingDetection.ts`: three consecutive off-route violations before acting; reuse corroboration only, excluding vehicle thresholds, speech and automatic rerouting.
- `utils/locationUtils.ts`: explicit `[longitude, latitude]` conversions.

Those reference files use Turf 7.3.4 and Expo 54. ARgala remains Expo 57; its navigation design will validate current modular Turf APIs separately. No Turf dependency belongs in PR A.

## Presentation

- Ordinary, outside-radius, unselected POIs keep compact name/distance pills.
- `selected || eligible` gets a richer card: real name, approximate distance, selected/in-range status, real address (or description when address is absent), and an action hint.
- Selected cards retain the strong brand surface; eligible unselected cards use the existing surface/foreground/brand tokens. Compact pills retain their high-contrast camera styling.
- Rich cards use a maximum width of 232 dp; compact pills keep 168 dp. Both clamp to existing safe horizontal bounds. Projection centers, raw FOV and selection/ranking remain unchanged.
- Location copy is at most two lines. Omit empty metadata, not placeholder text. Full names and actual location text remain accessible.
- Reserve a rich-card-sized lane for each visible item, capped by the existing three-label maximum and measured free vertical space. This favors predictable non-overlap over maximum density. Compact/metadata-free cards may use smaller surfaces within those lanes. Use explicit line limits and a font-scale-aware height budget; no per-sample text measurement.
- Preserve current display-only horizontal stops and reset rules. Do not alter camera bounds or bottom-sheet clipping/occupation.

## Interaction and costs

An unselected pill/card selects its provider ID using the existing handler. A selected card invokes the same existing Details handoff as the sheet, guarded by current running/selection/navigation state. This is an explicit action; metadata display, eligibility, heading and selection changes initiate no paid request. Keep original completeness, language and response-age rules. The sheet remains unchanged and receives the same selected ID/data.

## Alternatives and decisions

A full card for every nearby POI would obscure the camera. Adding category data would require provider/model work without a demonstrated need. Per-card measured layouts would add sensor-driven layout churn. The chosen approach reuses existing metadata and fixed safe lanes, with richer content only for selected or truly eligible places. Selected places outside the radius remain manually inspectable and show Selected without implying Within range.

## Verification

Pure projection tests pin rich/compact bounds without changing bearings or eligibility. Real label tests cover contents, omitted fields, locale changes, selected/eligible/outside states, actions, CJK/full accessibility, narrow scenes, enlarged type and existing snapping/reset behavior. Real discovery tests cover label-to-sheet synchronization, explicit Details handoff, manual selection, raw radius boundaries, quality/stale/FOV fallback and no requests during sensor/selection updates. Run full checks/export and use the existing development client for brief ADB checks if the phone is available. Keep outdoor/low-battery limitations explicit; do not start a preview build.
