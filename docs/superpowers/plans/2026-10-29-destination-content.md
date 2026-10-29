# Approved destination content delivery

The owner authorized implementation of the blueprint's versioned curated-content,
validated-update and offline-fallback pipeline. Product design remains approved;
this records engineering choices, not a new brainstorming checkpoint.

## Scope and decisions

- Preserve the ten stable featured IDs (D01–D09 plus the separate ACLC pilot),
  existing catalog model, Google provider safeguards, and development draft gate.
- First protocol transports approved **AR text only**, including approval
  references and complete EN/JA/KO title/body values. Coordinates, names,
  provider associations, radii and bundled licensed media stay in the reviewed
  application catalog. Remote numeric image handles/URLs are forbidden. Remote
  media/configuration require a subsequent explicit protocol extension.
- An immutable complete overlay snapshot carries schema/catalog versions and a
  monotonically increasing safe-integer revision. Empty higher revisions can
  withdraw previously published text. A missing/unpublished server snapshot does
  not erase the last valid local one. Reject downgrades and same-revision changes.
- Use the existing HTTPS Supabase project and captured authenticated token for an
  explicit update check. No Google calls, automatic refetch, extra dependencies,
  CMS or service key. Guest mode can read bundled/previously approved local text;
  it cannot download updates. Publication remains a reviewed owner operation.
- Persist one project-scoped, validated snapshot atomically with AsyncStorage.
  Save before publishing it to UI; failures preserve current content. Bound
  network/storage bytes, tile/text counts and request lifetime. Cancel/fence
  publication after principal/foreground/unmount retirement, including late native
  network completions. No provider results or user/location data enter this cache.
- Existing real admission captures resolved content at entry issuance; later
  updates affect future entries only. Catalog hydration grants no GPS authority.
- Keep main's prepared presentation environment unchanged: implement in the
  existing isolated worktree on `feat/destination-content`.

## Review focus

1. Malformed/draft/incomplete-locale/oversized updates never replace last good data.
2. Concurrent refreshes and corrupt/failed storage do not permit rollback or lost
   durable state. Unsupported schema/catalog versions fall back to the bundle.
3. Account/foreground changes abort/fence network and late publication; reconnect,
   remount, locale changes and query invalidation never trigger update requests.
4. Updating text cannot alter admission geometry/provider matching; an issued AR
   entry retains its original tile content through focus/restoration.
5. Authenticated clients can read only the published artifact; anonymous calls and
   all application publication writes are denied. Existing limiter/journal grants
   survive the additive migration.

## Tasks and commit boundaries

### 1. Validated protocol and durable repository

Create `src/features/destination-content/{model,repository}.ts` and focused tests.
Produce `contentManifestSchema`, `resolveContent(destination, manifest)`,
`ContentRepository.open()` and `.install(manifest, isCurrent)`. Test real invalid
inputs, last-good/restart behavior, corruption/read/write failures, monotonic
revisions, simultaneous installs and ownership retirement. Watch RED before code,
then GREEN. Commit `feat(content): add validated offline content snapshots`.

### 2. Hosted read contract and bounded transport

Add an owner-published singleton artifact table and authenticated read-only RPC in
`supabase/migrations/202610290001_destination_content.sql`. No production content
seed. Add `service.ts` with captured-token/deadline/abort/stream-budget tests.
Create `scripts/test-destination-content.py` for real isolated PostgreSQL privilege,
empty/published-read and existing-grant checks. Add command/CI step. Run this and
existing limiter/journal tests. Commit `feat(content): add authenticated content delivery`.

### 3. App integration and explicit recovery

Create content context/provider and update status component. Wrap the app shell;
hydrate cache locally, use TanStack Query's explicit mutation transport, and keep
status/recovery copy in all three actual locale resources. Add explicit check to
Featured Destinations; show bundle/cache/error with usable prior content. Resolve
AR text in map/route readiness and inject the current resolver into admission
without remounting the owner. Tests exercise real provider, query defaults,
localization, background/auth retirement, duplicate presses, offline recovery and
captured-entry stability. Commit `feat(content): connect approved updates to AR entry`.

### 4. Publication evidence and verification

Document authoring/approval/version/withdrawal workflow, missing production content,
and exact verification limits. Run lint/typecheck/full Vitest, Edge checks if
changed, all three isolated SQL tests, and Android export. Independently review the
whole branch, fix confirmed issues and rerun relevant checks. No new APK build,
ADB or main merge is authorized by this implementation step. Hosted deployment,
metadata/auth probes and real application downloads are separate evidence; never
claim mock/SQL tests establish phone storage, tracking or arrival accuracy.

## Progress

- Repository inspection: catalog/admission snapshots, journal transport/repository,
  HOP query/error/focus patterns reviewed. Adapt explicit-action/error boundaries;
  preserve ARgala's stricter request policy instead of HOP's automatic retries.
- Baseline `npm run check`: 99 files / 1,045 tests, lint/typecheck passed.
- Task1: `6248313`; model/repository RED before implementation, seven focused
  tests GREEN. Invalid cache and failed reads/writes preserve bundle/last good.
- Task2: `bb13f57`; transport RED→GREEN (eight tests), new SQL RED before RPC and
  null-validation regressions; all three SQL suites passed against the complete
  migration chain. Hosted dry run returned 403; no deployment or content seed.
- Task3: `61a5908`; 44 content/admission tests passed, plus 27 real navigator and
  selected-entry tests after matching fixtures to the production Query provider
  and injected content lookup. Full check: 103 files / 1,077 tests, lint/typecheck
  passed. Independent read-only review and lifecycle follow-up found no material
  defect. React Compiler lint findings were corrected without suppressions.
- Task4: documentation complete; Android export passed (8.2MB Hermes bundle
  `entry-feb942170ede7708d699a623d05a8d21.hbc`). Hosted deployment remains pending
  CLI database access. No native dependency change, APK, ADB, main checkout
  modification or content publication.
