# M4 execution: approved ACLC arrival foundation

Parent: `2026-10-25-aclc-viro-vertical-slice.md`, M4–M7. Base: `06f972b` (M3 draft PR #27; this branch is stacked, no merge authorized).

Owner reports on 2026-10-27 that the ring prototype works well. Record that observation without marking every lifecycle/locale/GPS test passed. No ADB or APK build is authorized by this continuation.

1. Extend the existing catalog with a separately namespaced ACLC pilot and approval-aware versioned AR metadata; preserve D01–D09 and omit unknown facts/points. Test missing data, independent approvals, unique roles/IDs, locale fallback, and production content exclusion of development samples.
2. Add pure foreground arrival transitions: healthy continuous samples only, <=10s age, <=1s future, <=20m accuracy, 3 increasing samples spanning >=6s, conservative containment; jump rejection, uncertainty reset, corroborated exit, deduped milestones/dismissal. All policy numbers are trial calibration hypotheses.
3. Expose immutable continuous-watcher sample metadata independently of one-shot coordinates in the existing location owner. Add consuming proximity hook with independent expiry clock and synchronous fresh validation; never start a second watcher. Test actual hook/native boundaries and selection/focus lifecycle.
4. Add in-memory single-use 30s AR entry handles, principal/selection binding and fresh revalidation at creation/claim/first mount. No URL or cached-data admission; live exemption remains owned by M3. Test stale/duplicate/selection/auth/provenance rejection.
5. Verify full checks/export, update evidence, and fresh independent review. Commit each coherent change. M5 connects consumers; missing approved points/content/association blocks real admission and field verification only. Continue independently implementable later work without inventing inputs.

Interfaces: catalog -> arrival uses approved activation point/radius only; watcher -> arrival uses exact continuous sample, never latest one-shot position; arrival -> intent validates current state synchronously; intent -> M3 produces pending identity, never established authority. Keep existing provider services untouched.
