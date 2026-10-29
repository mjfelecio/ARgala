# Remaining approved MVP implementation

> Execute inline with `superpowers:executing-plans`, regression tests first,
> coherent commits and independent review. The owner explicitly wants the
> remaining approved feature set built before refinement, without per-feature
> approval pauses, and authorizes merging properly reviewed changes unless revoked.

## Authority and preserved gates

The product/design blueprint is approved. Do not brainstorm it again or invent
approved facts, coordinates, media rights or client decisions. PR31's reviewed
content pipeline is merged after green CI; its hosted read-only migration is
deployed without content seeds. Main remains runnable through its prepared local
environment. Implement additions in the existing isolated worktree.

Standing merge permission does not waive AGENTS.md's separate permission for
each development/preview APK build. Batch native dependencies/configuration before
requesting the concrete build. Never claim mocks/exports prove native behavior.
Do not add a native short-tap correction; finger-pad hold/release remains accepted.

## Build sequence

1. **On-site unsupported-device reader** — integrate the actual preflight's
   definite `UNSUPPORTED` result. Supported, transient, missing-native, permission
   and startup failures retain retry and never get a reader shortcut. Only an
   approved, verified, non-simulated selected entry with fresh route-owned GPS
   may reveal text. Keep GPS enforcing eligibility while reading; background,
   blur/stale/outside/principal changes hide content. Preserve captured content
   revision/locales, use existing HeroUI typography, keep details out of map sheets.
   Record the first validated reader establishment for Passport under blueprint
   D20, separately from AR tracking-ready; never synthesize a tracking event.
   Update the operating rule with this scoped, approved fallback exception.
2. **Per-destination opt-in reminders** — native adapters/task bootstrap,
   principal-scoped durable opt-ins, explicit permission flow, bounded approved
   geofences, persistent jitter/re-registration dedupe, disable/cleanup recovery,
   safe notification handoff after navigation readiness. No Google call, camera,
   AR admission or earned stamp from a geofence/notification. Use a distinct
   nearby-reminder radius and explain best-effort Android delivery. D01–D09 lack
   approved points; don't register them. Test missing modules in the old APK.
3. **Adaptive AR presentation** — scale optional visual work conservatively using
   real available signals, preserving every tile, page and control. Keep sensor
   state below native rendering boundary, stable ring basis/focus and existing
   localization/text sizing. Engineering thresholds aren't client-approved
   performance targets. Document device/thermal verification still required.
4. **Photo capture/save/share** — existing Viro screenshot API, camera plus scene,
   explicit gallery-save/share adapters and localized failures. No video, hidden
   capture, upload or retained camera history. Ignore/clean late captures after
   background/exit; clean temporary images. Implement the feature but retain the
   blueprint's physical core/capture acceptance gate before claiming it works.
5. **Remaining offline/media/catalog foundations** — finish the independently
   curated offline bundle/update boundaries needed by these features, approved
   bundled image presentation and conservative matching. Any remote media update
   must have an explicit rights/asset protocol and bounded atomic caching. Never
   copy Google galleries/reviews into offline data. Nine-site content/coordinate
   approval is an input gate, not a missing code feature or permission to fabricate.
6. **Integrated verification, then refinement** — full lint/types/tests, Edge/SQL
   checks where changed, dependency/Doctor/native-config/Android export for native
   changes, fresh whole-branch review, fix confirmed issues, CI and merges within
   standing authority. Request the one concrete batched APK when ready. Physical
   device matrix, background OS delivery, actual GPS, media save/share and approved
   content acceptance remain explicit. Start refinement after implementation is
   ready, without disguising missing field evidence as completed QA.

## Review focus

- Reader never leaks rich content on supported/unknown hardware or stale GPS;
  fallback establishment cannot manufacture a Passport event from a save error.
- Permission Settings interruptions preserve one owner and require explicit Retry
  after failure; ordinary browsing/resume never prompts or starts paid requests.
- Native registration/notification callbacks and capture results are fenced after
  principal, selection, foreground or consent retirement, including delayed success.
- Persisted opt-out precedes unregister; background work reads only approved
  catalog/explicit opt-ins. Re-registration and OS initial Enter cannot spam alerts.
- New native modules fail clearly in an older development APK. Don't merge a
  native-dependent startup regression into the owner's working presentation app.
- No provider content persistence, new coordinate authority, forged content
  approval, hidden upload, automatic rerouting or activation through URLs.

## Fallback files and RED→GREEN checks

`destination-ar/{read-only-fallback,selected-destination-route,
destination-ar-session-screen,use-fallback-visit}` and journal establishment bridge,
three actual locale resources, operating/verification docs. Real preflight screen
test must prove only UNSUPPORTED renders the fallback and camera/native scene
never starts there. Reader tests cover approved/verified/non-simulated entry,
fresh eligibility and late retirement, locale changes and actual rendered/layout
establishment. Existing AR/session/Passport tests must continue to pass.

## Progress ledger

- Content delivery PR31 merged after independent review, 1,077 passing tests and
  green CI; hosted migration verified, zero factual content published.
- Independent read-only investigations completed for SDK57 notifications,
  TaskManager/geofencing, Viro screenshot native behavior and save/share modules.
- Native modules planned: task-manager, notifications, file-system, media-library,
  sharing; install only SDK-compatible versions via `expo install` as needed.
- Baseline passed 1,077 tests. Supporting implementations and four independent
  review fixes are complete; final check passes 1,212 tests / 114 files with
  lint/types. Dependencies, Doctor 21/21, native configuration and Hermes export
  pass. Main's ignored environment and reference files remain preserved.

### Implementation checkpoint

Steps 1–5 are implemented, including approved bundled media support; no remote
asset protocol or factual seeds were invented. Independent whole-branch review
and re-review found no remaining confirmed blocker after four corrected findings.
The remaining Step 6 gates are CI/merge and a separately approved APK plus physical
acceptance. Refinement follows this engineering baseline; content approval and
on-site GPS remain external gates rather than unimplemented app code.
