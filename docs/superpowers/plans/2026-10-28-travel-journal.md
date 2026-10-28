# Local travel journal implementation plan

> **For agentic workers:** Use superpowers:executing-plans for task-by-task inline execution and one independent final review.

**Goal:** Deliver usable offline guest access, device-local Saved Places and an idempotent Passport summary without storing Google content or granting fake arrival authority.

**Architecture:** A validated, bounded journal stores independently curated destination IDs, Google Place IDs, bookmark state and first eligible visit times. A serialized repository writes before publishing success, isolates account keys, merges guest data durably on sign-in and retains the guest source after failed writes. Existing contexts, protected routes, HeroUI/UniWind and app locales remain.

**Tech Stack:** Installed Expo57/Router, React19, AsyncStorage, Zod, Vitest; no dependencies/native configuration changes.

**Spec:** Owner-approved ARgala_MVP_Blueprint.md D20–D22/D29/D52 and Section12 Phase5 (source supplied in main checkout). Approved delivery/input constraints in 2026-10-25-aclc-viro-vertical-slice.md.

## Global constraints

- No ADB or APK build; no simulator/mocks presented as physical AR or on-site GPS proof.
- No provider names, coordinates, descriptions, reviews or images persisted. Google identifiers remain unchanged.
- A remote map center, simulated/draft session, pending startup cannot earn a Passport stamp; restored callbacks cannot earn additional stamps. Existing AR admission remains authoritative.
- Guest entry requires explicit Continue as guest after onboarding; guest mode never impersonates a Supabase session or bypasses Edge auth. Online discovery/routes still require sign-in.
- Guest data merges only into the account actually becoming active. Account data remains separately keyed. Errors remain localized, and failed storage never reports success or deletes the source.
- No new tab; Passport summary belongs to Featured Destinations, Saved Places is reached from Profile and existing details/sheet actions.
- Cloud sync, trusted content update publication, approved nine-place rollout, background reminders, read-only device fallback and adaptive/capture work remain separately tracked. This local delivery does not claim those completed; continue in dependency order.

## Review focus

Auth changes during slow storage; overlapping saves/guest merge; malformed disk state; development sessions accidentally awarding progress; provider-content retention in bookmarks.

### Task 1: Validated durable journal

Files: src/features/journal/model.ts, repository.ts, corresponding tests.
- [x] RED: actual model/repository tests for duplicate stamps, rejected development evidence, ID-only bookmarks, malformed input, serialization, durable failure/retry, guest merge and account isolation.
- [x] Implement strict bounded records and serialized transactional local writes; merge guest into account before clearing guest, all in one queue.
- [x] Targeted GREEN, commit feat(journal): add durable scoped travel state.

### Task 2: Explicit guest shell and journal provider

Files: auth/guest-access.tsx and tests, navigation/root-navigation.tsx, auth/sign-in-screen.tsx, app/_layout.tsx, journal/provider.tsx, destination-ar/admission-provider.tsx, profile settings.
- [x] RED: hydration gate, offline guest entry/restart, sign-in transitions, real account principal, failed merge/retry and stale completion guards.
- [x] Preserve existing auth/provider boundaries; clear transient queries on guest scope changes; account journals never become guest state.
- [x] GREEN and commit feat(auth): support explicit local guest exploration.

### Task 3: Saved Places and earned Passport UI

Files: journal/actions.tsx, saved-screen.tsx, passport-summary.tsx and tests, thin route, existing map sheet/details, destinations list, selected AR bridge, EN/JA/KO locales.
- [x] RED: real UI localized save/remove/error/retry, reopen by ID without automatic provider calls, guest merge visible, Passport awarded only after verified established session and at most once.
- [x] Wire save controls into existing map/details; show user-owned IDs without retaining provider content. Existing explicit Details recovery fetches when requested.
- [x] Add Passport summary inside Featured Destinations; pilot remains separate from nine-site count. Surface local persistence errors and retry without exposing raw messages.
- [x] Targeted GREEN, full npm run check and Android export, commit.

### Task 4: Review and evidence

- [x] One fresh immutable whole-branch review; reproduce material findings before one fix pass; final green checks.
- [x] Update validation, next-phase dependencies and documentation. Draft PR against merged main; do not merge the new PR without instruction.

## Next dependency gates

Approved centers/content/EN-JA-KO/media/provider associations block publishing the other destinations. No trusted content publishing endpoint exists yet, so do not invent a URL or promote research drafts. Cloud account sync needs additive RLS-backed schema and its own concurrency/deployment validation; no local-only claim substitutes for sync. Notifications require native dependency/configuration and per-build approval; off-site automated testing cannot verify OS background delivery. These remain visible follow-up work, not reasons to block usable local journal delivery.
