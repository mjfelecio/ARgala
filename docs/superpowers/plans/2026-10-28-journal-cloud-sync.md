# Account journal cloud sync implementation plan

> **For agentic workers:** Use superpowers:executing-plans, test-first tasks and one independent final immutable-branch review.

**Goal:** Sync Saved Places and earned Passport progress between account devices without sacrificing offline saves, deletion semantics or account isolation.

**Architecture:** Keep the existing journal and serialized repository. Account documents upgrade atomically from v1 to a v2 envelope containing the visible journal, last cloud revision, versioned latest bookmark edit intents, persistent client sequence and one durable in-flight snapshot. A PostgreSQL compare-and-swap RPC serializes each user's journal and deduplicates the last request per client. Conflicts reapply pending edit intents onto the returned snapshot; an acknowledged/replayed request clears only intents captured by its edit version and reapplies newer ones. This distinction prevents a lost response from resurrecting a bookmark another device subsequently deleted.

**Tech Stack:** Existing Expo57/React19/strict TypeScript, AsyncStorage, Zod, Supabase/PostgREST and PostgreSQL. No dependencies or native configuration changes.

**Spec:** Owner-approved blueprint D20–D22/D29/D52/Section12 Phase5; docs/local-travel-journal.md; user explicitly approved account sync on2026-10-28. Builds on unmerged draft PR29; do not merge it without instruction.

## Global constraints

- No ADB/APK build; mocked network/storage and isolated PostgreSQL are separate from live Supabase/device evidence.
- Persist/sync only exact Google Place IDs, independent curated IDs and first earned visit times. No provider display content, coordinates, camera data, auth credentials or visit attestation claims.
- Guest never syncs as an account; existing durable guest-claim semantics and verified tracking-ready award gates remain intact.
- Keep the existing storage key and validate/upgrade its payload without deleting v1 data. Account-specific envelopes and captured JWT requests must survive account changes without cross-account publication.
- Use bounded strict payloads (journal <=1000 bookmarks/known10 destination stamps; document/request/response <=1MiB); serialized writes publish after persistence. Malformed responses and failed writes retain local work and durable in-flight retry data.
- Reuse HeroUI/UniWind/locales. Show account sync status/retry in Saved Places/Passport; keep guest local-only guidance. No automatic paid Places/routes calls.
- Read-only default access via per-user RLS; write RPC wrapper is SECURITY INVOKER over a private SECURITY DEFINER implementation with pinned empty search_path, explicit auth.uid ownership, narrow execution grants and no supplied owner ID. Never distribute a service-role key.
- Prepare/review/verify the additive migration before any hosted deployment. No destructive schema operations; report hosted readiness separately.

## Review focus

Lost responses followed by another device's deletion; edits during in-flight requests; sign-out/token refresh while requests wait; retirement during disk acknowledgement; malformed/oversized direct RPC input and cross-user SQL access; restored/cloned client sequence namespaces.

### Task 1: Durable protocol and local reconciliation

Files: journal/sync-protocol.ts (+tests), repository.ts (+tests), model.ts (shared stamp schema only if needed).
- [x] RED: v1 upgrade, durable flight reuse, deletion on conflict, no resurrection after replay, concurrent local edits, failed acknowledgement, retired owner and guest exclusion.
- [x] Add v2 envelope without replacing the journal's public v1 shape. A flight captures UUID request ID, sequence, revision and submitted journal before network.
- [x] Rebase conflicts from all pending intents; after applied/replayed responses retain only intents newer than the flight edit version. Stamps union by destination/earliest time; removed bookmarks remain explicit versioned delete intents.
- [x] Client-namespace reset response rebases local differences and starts a new non-credential client ID. Never trust a request ID as account authority.
- [x] GREEN and commit feat(journal): persist revisioned sync requests.

### Task 2: Account-isolated transactional PostgreSQL

Files: supabase/migrations/202610280001_journal_sync.sql, scripts/test-journal-sync.py, package.json and existing CI workflow.
- [x] RED isolated PostgreSQL tests: anon denial, per-user RLS, direct write denial, schema/body limits, revisions/conflicts, duplicate replay after another device removes a bookmark, strict sequences/reset, monotonic stamps, concurrent calls, cascading account cleanup.
- [x] Two tables with bounded per-row state: account_journals(user_id,payload,revision), journal_sync_clients(user_id,client_id,last_sequence,last_request_id,last_digest). No operation/location history.
- [x] Public invoker RPC sync_travel_journal(p_client_id,p_request_id,p_sequence,p_revision,p_journal); private implementation checks auth.uid, validates before row work, locks the account row, returns applied/conflict/reset with echoed request identity, revision and snapshot. Replays do not write; wrong client namespace resets safely. New valid revision replaces bookmarks and unions stamps. No scalar owner parameter.
- [x] GREEN, isolated limiter test, CI command and coherent backend commit.

### Task 3: Captured-account transport, controller and UI

Files: journal/sync-service.ts, sync-controller.ts (+tests), provider.tsx/context.ts/actions.tsx or sync-status.tsx, Saved/Passport surfaces, EN/JA/KO.
- [x] RED real service/controller/provider tests: captured bearer, timeout/auth/unavailable/unknown errors, duplicate invocation, response bounds, offline retry, pending local save, account switch, no guest request and actual locale recovery.
- [x] Fetch configured HTTPS PostgREST RPC with the captured account token; never obtain a later principal's token for old work. Abort/deadline and discard retired results.
- [x] One coalesced sync per owner; bounded4 conflict/reset rounds. Hydrate locally first. Attempt on authenticated foreground hydration/local edit/foreground return, stop automatic retries after failure until explicit Retry or a new trigger. Keep local saves available during network failure.
- [x] Status distinguishes local guest, pending account changes, syncing, synchronized and recoverable failure; new errors translated in all three locales. Local-save errors remain separate from cloud errors.
- [x] GREEN full npm run check, SQL tests, Android export and commit.

### Task 4: Independent review and deployment checkpoint

- [x] One immutable whole-branch independent review, then one RED→GREEN pass for material findings and final checks; no re-review loop.
- [x] Record evidence, schema/data boundaries and conflict rules. Draft stacked PR against PR29 while it remains open; never merge unasked.
- [x] Validate configured project identity and dry-run the migration. The owner restored database access for this approved task; apply only the reviewed additive migration after the verified dry run, and distinguish deployment from authenticated application integration evidence.
