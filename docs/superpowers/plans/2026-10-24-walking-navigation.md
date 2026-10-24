# Walking navigation implementation plan

Spec: [walking design](../specs/2026-10-24-walking-navigation-design.md), implementing PR B of the client follow-ups independently from PR A.

- [x] Inspect main, outstanding PRs, existing route/sensor/map state and exact HOP-Driver files. Fetch current Turf/Expo 57 documentation; install only modular JS geospatial packages.
- [x] Root: write failing deterministic pure progress traces, implement prepared original route, qualified sample matching, monotonic trimming, uncertainty/off-route/arrival and interruption guards. Verify native units and immutable geometry.
- [x] Root: implement/test navigation hook using existing location/clock, no subscriptions or queries. Cover focus/background, stale expiry, stop and no automatic request authority.
- [x] Delegate simple screen/map/locale work to OpenCode Zen if available, otherwise Luna: existing sheet controls/status and separate display/fit geometry. No shared-file overlap.
- [x] Exercise real screen/query defaults for Start/GPS/foreground/language/failure/Stop with zero extra paid calls and no automatic map camera movement.
- [x] Independent review, full project checks, dependency/native/Android checks and export. Correct confirmed findings.
- [x] Record ADB limitation: secure keyguard at 4% charge prevented card interaction, then the phone disappeared from ADB before navigation verification. Existing app was force-stopped/display off; no live navigation, sensor accuracy or outdoor acceptance is claimed. No APK build without explicit owner approval.
- [ ] Conventional Commit, push and create separate reviewable PR against latest stable main; do not merge automatically.
