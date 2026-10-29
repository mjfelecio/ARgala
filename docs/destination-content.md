# Approved destination text updates

This extends the existing catalog and selected-destination AR flow. The nine
study destinations and separate ACLC pilot keep their IDs. Current ACLC research
is still development-only; this change publishes no factual content or images.

## Bundle, update and offline contract

The reviewed application catalog remains authoritative for names, activation
points/radii, accessible entrances, provider associations and bundled media.
Protocol 1 updates **AR title/body text only**. It cannot supply coordinates,
provider results, numeric image handles, remote image URLs or executable code.
Remote assets/configuration need a later explicit protocol extension and rights
review. A newer app can change the catalog compatibility version when necessary.

Each artifact has exactly `schemaVersion: 1`, `catalogVersion: 1`, a positive
safe-integer `revision`, `approvalStatus: "approved"`, and `destinations`. Each
destination has a known `id`, nonempty `contentVersion` and 1–12 unique tiles. One
tile must have role `overview`; at most one has role `history`. Other categories
may omit role. Every title/body supplies `en`, `ja` and `ko`, each containing a
nonempty `value` and `approvalReference`. References record review evidence; they
are not cryptographic signatures or automatic proof of editorial accuracy.
The client rejects unknown fields, incomplete translations and oversized text.

An artifact is the complete approved text overlay, not a patch to the previous
artifact. Omitted destinations return to their bundled text. Publish a higher
revision with `destinations: []` to withdraw all remote text. Do not delete the
published row to withdraw: a null/missing publication deliberately retains the
last good cache. Older revisions cannot downgrade that cache; changing an existing
revision's content is rejected. Revisions belong to the publication, not a device
clock or app-account identity.

The wire/storage budget is 512KiB. Titles are at most 200 characters and bodies 6000;
approval references 500 and content versions 80. PostgreSQL also applies a 512KiB
budget to its JSONB text representation, which includes formatting overhead, so
leave headroom. The transport checks declared length and decoded stream bytes,
rejects redirects, bounds the complete operation to 15 seconds and captures the
request account's bearer. No service-role key enters the app.

Featured Destinations has an explicit Check for updates action. Loading, focus,
reconnection, language changes and query invalidation never download content or
call Google. Guests use the bundle and previously downloaded approved text, with
sign-in guidance for downloads. Errors retain usable prior content and localized
Retry guidance. The update status is technical content availability, not a claim
that all ten destinations have approved text.

One project-scoped AsyncStorage value holds only validated curated text and its
publication metadata. Invalid/unknown-version cache falls back to the bundle;
I/O failure does not authorize overwriting unread state. Installs serialize,
persist before UI publication, and retain previous state on failure. Auth changes,
backgrounding and unmount retire a request. A native storage write already in
progress may finish with valid public content after retirement, but its completion
cannot update retired UI. This is public curated data shared on the device, not a
private account journal; no token, provider display data or location is stored.

The admission store resolves content when issuing a new selected-destination
entry. It captures a separate parsed destination snapshot; later updates do not
change that entry's tiles/pages or remount its owner. Future entries use the
current approved revision. Cache hydration never substitutes for fresh GPS,
selected-destination eligibility, first tracking-ready or Passport rules.

## Publication workflow

1. Obtain actual editorial approval and licensed/source evidence for each locale
   and field. A label saying approved does not grant permission to publish copied
   provider descriptions or the existing ACLC research draft.
2. Prepare the full overlay with a revision greater than the current publication.
   Review it against `contentManifestSchema` and the actual bundle/catalog version.
   Keep missing/unapproved destinations out. Do not use synthetic test fixtures as
   production data.
3. Run the app and SQL contract tests and include the artifact/source/approval
   review in the content PR. Verify three locales, roles, size, page layout and
   unchanged geometry/media. Missing facts or approval evidence remain a content
   blocker, not a reason to invent text or coordinates.
4. A database owner publishes the reviewed JSON into the singleton
   `private.destination_content` row in a transaction (INSERT initially, UPDATE
   for later revisions). Application roles have no publication privileges and
   the private schema is not exposed. There is no CMS or application write RPC.
   No production artifact is seeded by the migration.
5. Signed-in clients explicitly call public `get_destination_content()` through
   the configured HTTPS project. It is an INVOKER wrapper over a narrow private
   DEFINER with pinned empty search path and `auth.uid()` check. Anonymous calls
   and direct application table writes are denied. A missing artifact returns null.
6. Verify a real authenticated download, airplane/offline restart, subsequent
   revision, withdrawal and unchanged live AR reading position on a phone before
   describing the delivery pipeline as physically verified.

## Verification boundaries

Focused tests exercise real schema/repository/provider/admission code and actual
locale resources, mocking native storage/network boundaries. Tests cover local
restart, malformed data, monotonic revisions, failed saves, cancellation and late
results, guest behavior and explicit recovery without automatic provider calls.
The actual admission store and provider prove captured entries retain content and
fresh GPS is still required. These tests do not establish physical storage,
Viro typography, touch routing, tracking or on-site arrival accuracy.

`npm run test:destination-content` creates its own PostgreSQL cluster and applies
all migrations. It checks empty publication, authenticated reads, rejected
anonymous/read-without-user calls, denied client publication/direct reads,
invalid artifacts, monotonic withdrawal, RLS flags and preservation of existing
limiter/journal grants. Existing limiter and journal suites now also apply the
complete migration chain. Hosted deployment and real app downloads are separate
evidence; record their actual status in validation.md.
