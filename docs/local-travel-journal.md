# Local guest travel journal

The approved supporting-feature delivery adds explicit Continue as guest after
Welcome, Saved Places through Profile, and Tourist Passport within Featured
Destinations. It reuses the existing map sheet, Details screen, protected Router
stack, HeroUI/UniWind and English/Japanese/Korean resources. No extra tab, native
module, new provider cache or native build is required.

Guest mode restores locally and supports curated browsing and eligible local AR;
it supplies no Supabase session. Online Places and Routes continue to require
sign-in through the existing authenticated Edge handlers. The app does not claim
offline Google tiles or arbitrary cached provider results.

Saved Places persists a discriminated reference: curated destination ID or exact
Google Place ID. Google names, coordinates, photos, reviews, ratings, descriptions
and addresses are not stored. Saved Google entries use a generic localized label
and their ID; opening them goes to existing Details, where loading fresh provider
content remains explicit. Curated names come from the independent bundled catalog.
Save/remove work locally and retain their previous state on storage failure.

`argala.journal.v1:<encoded principal>` separates guest and account journals.
A process-wide serialized repository validates data, limits each document to1MiB
and1000 bookmarks, writes before publishing success, and never silently replaces
corrupt data. Signing in merges guest references and stamps into that account,
then clears the guest source only after durable account persistence. Ownership is
checked after reads immediately before the first account write. That write is the
claim point: once started for the current account, the serialized transfer finishes
for that account even if sign-out follows. A later account does not inherit that
already-claimed guest transfer. Retirement before claim leaves the guest source
for the next owner. This is an explicit ownership rule, not a claim that in-flight
AsyncStorage writes can be cancelled. Interrupted
merges retry idempotently. A different account does not inherit the previous
account's journal. No credentials or location samples enter this storage.

Passport stamps are idempotent first eligible-session events. The selected-entry
bridge receives its signal only after tracking-ready; approved content, verified
provenance, non-simulated entry and principal identity are required. The current
ACLC research draft and development simulation earn no stamp. The nine-site count
continues to use D01–D09; an eventual genuine approved ACLC pilot visit is separate.
Disk failures offer explicit retry in AR utility chrome. This is application-local
progress, not tamper-resistant proof of physical attendance.

Account cloud synchronization is a separate extension of this local merge, now
implemented with a v2 envelope, durable request/intent metadata and an RLS-backed
RPC; see [cloud sync](journal-cloud-sync.md). Guest state remains local until an
account claims it. The extension preserves ID-only data, deletion/replay semantics,
account isolation and recovery. Background reminders, eligible unsupported-device
fallback, trusted remote content publication and adaptive/capture remain separate.

## Verification boundaries

Automated tests cover actual repository, providers, guest entry/installed Router
guards, Saved/Passport UI and error resources with native/storage/network
boundaries mocked. SDK57 JavaScript export checks packaging. Neither establishes
physical touch/layout, Android storage across process death, AR capability,
on-site GPS, OS background notifications or live provider correctness.

When a phone is available, separately verify guest cold start/offline entry;
save/remove/reopen and sign-in merge; sign-out/account switch; no stamp from
simulation; storage recovery presentation; and one genuine approved on-site first
tracking-ready stamp. The latter remains blocked on approved destination content
and real-location verification, not something to fake in a demo.
