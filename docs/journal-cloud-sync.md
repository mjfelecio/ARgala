# Account journal cloud sync

This extends the local journal from PR29; it does not replace the map, auth,
provider cache, Passport award gate or guest transfer ownership rule. Guests stay
local. Account sync concerns only exact Google Place IDs, independent curated IDs,
and earliest earned visit times. It never stores provider names, coordinates,
descriptions, photos, reviews, camera data or an asserted server GPS attestation.

## Offline state and reconciliation

The existing `argala.journal.v1:<encoded principal>` key remains. Its original
v1 payload is accepted. Before the first account request, a single serialized
write upgrades it to a v2 envelope: visible v1 journal, cloud revision, a
non-credential client namespace/sequence, latest pending bookmark intents and one
in-flight snapshot/request ID. Guests need no envelope. All document writes remain
within the existing1MiB budget; the public journal still limits1000 bookmarks and
only known destination stamps. Pending intent metadata is bounded to2000 distinct
references and stores only reference, desired save/remove state and edit version.

A request is persisted before network work. Failures retain it for retry/restart.
Conflicts return the latest account snapshot; pending explicit local intents are
reapplied to it, preserving other devices' unrelated edits. A successful or
replayed request acknowledges only edit versions captured by that flight. Newer
edits remain pending, including remove→re-add when the final value happens to
match the submitted snapshot. A lost response followed by another device's
removal does not replay an already-acknowledged add into the cloud snapshot.

Concurrent edits to the same reference resolve through serialized server revision
checks and reapplication of pending explicit intent; no device clock determines
bookmark ordering. Passport merges by destination and earliest stored visit time,
never by deleting another device's stamp. Those times are local progress metadata,
not trusted attendance evidence. Restored/cloned client namespaces that no longer
match their last server receipt reset to a new namespace while preserving pending
local work. Receipts retain only the latest sequence/request digest per client;
there is no per-operation or location-history log. Each account admits at most128
client receipts under its account lock. Rejected fresh sequence/revision requests
allocate no receipt. Existing clients/replays continue at capacity; new admission
fails with a localized limit message while retaining local work. No receipt is
automatically evicted: doing so could undermine delayed replay safety.

A guest import is a fresh local save intent even if a stale account snapshot
already contains that reference. The first-account claim rule is unchanged: check
ownership before the target write; once claimed while current, finish under that
account key even after sign-out. A subsequent account does not inherit already
claimed guest state. Credentials never enter journal storage.

## Server contract and ownership

Migration `202610280001_journal_sync.sql` creates `account_journals` and
`journal_sync_clients`, both with per-user SELECT RLS and cascading account cleanup.
Application roles cannot write the tables directly. The public
`sync_travel_journal` wrapper runs as INVOKER and calls a private DEFINER function
with empty `search_path`, schema-qualified objects and explicit `auth.uid()`
filtering. PUBLIC/anon execution is revoked; authenticated execution is narrow.
Keep the private schema outside the hosted API's exposed schemas. No caller owner
ID or service-role credential is accepted from the app.

The RPC strictly validates its journal before row work, takes the current account
row lock, checks sequence/request identity and expected revision, then returns
applied/conflict/reset with a current snapshot. Replays do not rewrite state.
A valid revision replaces the bookmark set and unions first visits. Strict keys,
provider identifier limits, destination allowlist, duplicate rejection, finite
integer times, result/document budgets and revision bounds are tested. Direct API
clients can edit their own journal through this RPC; it is not a reward or
anti-fraud system. Client receipt rows track device namespaces rather than storing
an event for every mutation.

Transport calls only the configured HTTPS Supabase PostgREST RPC. It captures the
account token at request start; a later SDK session cannot change that request's
owner. The complete operation, including response reading, has a15s deadline and
1MiB request/response budget. Native/SQL/network diagnostics are never UI copy.
No Places/Routes request or Google quota is involved.

## Foreground behavior and recovery

The provider hydrates locally first. An authenticated foreground owner attempts
sync after hydration, after debounced local edits (300ms), and on foreground
return. Token refresh updates the next request token without starting a request
by itself. One job per owner coalesces duplicate calls; at most four conflict/reset
rounds run before explicit recovery. Background/unmount retires the controller,
aborts network work and fences acknowledgements/UI publication. Durable local
state remains available for the next owner.

Saved Places and Passport distinguish guest-local, pending, syncing, synchronized
and failed states. Retry uses the current account token and durable request; local
save errors are separate. English/Japanese/Korean resources cover authentication,
service unavailable, timeout, conflict and unknown failure. Network failures do
not disable offline save/remove or clear current data. Sync now explicitly pulls
other devices' changes without requiring a local edit.

## Deployment and evidence

The configured host is `dhjlcvviiscuuzjtzxor.supabase.co`. Initial project linking
and direct-ref database dry run were rejected403. After the owner restored CLI
database access, a dry run listed only `202610280001_journal_sync.sql`. CLI2.122.0
then applied exactly that migration with vault updates disabled, no seeds/roles,
and no replay of the existing limiter migration. Deployed source is commit
`b0f3e1b`; SQL SHA256:
`97bf946c92ca09b1380c7264e79bf30adef7c45fe614e1e00a6c4d00cc5d77e4`.

Hosted metadata checks confirmed both table RLS flags/read policies, denied direct
application writes, denied anonymous RPC execution, authenticated execution,
public INVOKER/private DEFINER with pinned search path, and migration history.
The private schema probe returned406/PGRST106 (not exposed). Live RPC requests
with missing and invalid bearers returned401/42501 and401/PGRST301. A subsequent
dry run reported no pending migrations. No authenticated application user or
Google provider request was used; those observations do not prove a signed-in
multi-device round trip.

Local verification uses `npm run check`, `npm run test:journal-sync`,
`npm run test:limiter`, and `npm run export:android`. The SQL test creates its own
PostgreSQL cluster and roles; it never targets Supabase. It tests anonymous denial,
RLS isolation/direct-write rejection, strict malformed/large requests, revision
conflicts, duplicate deletion replay, namespace reset, monotonic stamps, eight
concurrent writers, receipt admission at capacity and cascading cleanup. Native/storage/network boundaries remain
mocked in app tests. Real hosted bearer integration, two-device/reinstall behavior
and Android process-death storage still need separate observations; ADB is not used
for this stage.

### Subsequent physical phone check — 2026-10-28

Source `3cffea9` on the existing Galaxy A53 development APK: actual signed-in
Saved Places reached synchronized status after saving ACLC. Force-stop/relaunch
preserved the bookmark and restored synchronized status. With phone networking
disabled, a Google bookmark remained local and sync showed recoverable failure;
restoring the original network settings and pressing Retry reached synchronized
status. Both test references were removed and the empty journal synchronized.

After explicit guest entry, a new ACLC bookmark survived force-stop/relaunch.
The owner then signed in directly on the phone; the guest reference appeared in
the account and synchronized. The fixture was removed afterward. This is a real
single-account app/RPC round trip, not a two-device, second-account, reinstall or
remote response-loss trial. See [client smoke evidence](client-progress-smoke-2026-10-28.md).
