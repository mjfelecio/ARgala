# Camera POI overlays implementation plan

**Goal:** Extend the verified camera foundation with nearby POI labels, proximity information and a map handoff for developer device testing.

**Architecture:** Keep geographic projection pure. Use disabled TanStack Query observers and explicit fetches through existing Places services. Preserve camera/location lifecycle owners and map walking-route implementation. No dependencies, backend changes or persistent provider cache.

**Scope:** The supplied camera discovery brief and existing foundation design govern this work. Android portrait, approximate 60° horizontal field of view, three nonoverlapping labels, 1000 m discovery / 20 results, existing device-local activation setting (100 m default).

## Tasks

1. Projection: test relative wraparound, FOV boundaries, invalid heading, inclusive activation, distance/direction priority, collisions, stable selected priority and empty results; implement `projection.ts` and central AR limits. Run focused tests, typecheck and lint; commit.
2. Discovery screen: add explicit Scan/Refresh, bounded in-memory reuse of compatible searches, fixed three label lanes, compact list, automatic nearest eligible information with manual selection override, explicit details, visible attribution and map handoff. Expose sensor sample times; expire directional data and gate scans when tracking is unhealthy. Test the real screen with native/network mocks, actual translations and production query defaults. Run full check; commit.
3. Map handoff: consume a Place ID via Router params and the existing in-memory query data, select without paid work, preserve explicit Walk route fetching. Test handoff, route/polyline and absence of automatic requests; run full check; commit.
4. Review feature, run compatibility/Doctor/Android config/export checks, record evidence and hardware limitations, commit documentation, push branch and prepare one unmerged PR to main.

## Review focus

- Stale or failed continuous tracking must suppress overlays/activation even when a one-shot fix exists.
- Camera denial must leave the discovery/list usable; uncertain heading must never imply calibrated placement.
- Focus, foreground, language, GPS, invalidation and remount must never initiate paid requests.
- Collision priority must not change manual selection; offscreen places stay in the list.
- Delayed requests, empty data and failures retain recoverable, localized states and attribution.

## Execution notes

- Baseline: `origin/main` at `f01fdbf`. Existing local `app.json` EAS changes are preserved and excluded from commits.
- Existing feature branch provides isolation in the requested repository; no worktree relocation.
- Follow the user-authorized implementation continuously, using focused red/green tests and incremental commits.

## Completion evidence

- Projection, explicit discovery UI, sensor freshness and map handoff implemented in separate Conventional Commits.
- Full check: 169 tests / 24 files, strict TypeScript and zero-warning lint passed.
- Expo compatibility, Doctor (21/21), Android config and Hermes export passed.
- Review fixes: map handoff provider credits; separate watcher freshness; stationary AR GPS threshold. Each behavior has regression coverage.
- Detailed thresholds and remaining physical-device/live-provider checks: `docs/ar-device-testing.md` and `docs/validation.md`.
