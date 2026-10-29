# Supporting MVP features

The approved map, discovery, selected-destination AR, Passport, local/account
journal sync and approved text-update pipeline remain the foundation. This
increment adds the remaining supporting feature implementations without adding
new destination facts, coordinates or media approvals.

## Nearby reminders

Destination details offers an explicit one-shot nearby reminder for a destination
with an approved bundled point. Settings lists enabled reminders and allows
removal. The separate engineering radius is 150 m, with at most 10 enabled
reminders. It does not change the selected destination's AR activation radius.
Android notification, precise foreground and background location permissions are
requested only during explicit enable, with an explanation before background
permission. Registration is best effort; Android background restrictions,
force-stop and device settings can delay or prevent delivery.

Consent and delivery claims are principal-scoped and serialized in local storage.
An OS initial Enter or repeated delivery cannot consume another reminder without
an explicit disable/enable. Opt-out is persisted before native cleanup. Notification
selection returns to the selected featured place after navigation is ready; it
never launches AR, earns a stamp or initiates a paid provider request. The headless
task is defined before Expo Router's entry point; definition alone starts no
monitoring. Existing foreground location owners retain their previous contracts.

## Unsupported-device reader

Only a definite native hardware `UNSUPPORTED` result can offer this reader.
Missing native code, unavailable services, denied permissions, unknown support and
transient startup failures retain their existing recovery. The reader requires an
approved, verified, non-simulated selected entry and fresh route-owned eligibility.
Losing eligibility or foreground ownership unmounts its authorization owner;
returning requires a new lease check. It has no outside-radius/live-AR grace.

Under blueprint D20, the first positive visible layout revalidates entry and
captures a Passport event, separately from AR tracking-ready. Drafts and simulated
entries remain ineligible. No fake tracking event is generated.

## Bundled gallery and adaptive presentation

Approved bundled destination media may be bound explicitly to an AR tile by ID.
Validation rejects unknown or duplicate IDs. A panel retains all text pages, then
shows its bound images with paginated localized alt text, caption and credit.
Reading progress identifies the asset through locale/size changes and native
remounts. The unsupported reader uses the same approved bindings. Failed images
retain navigation and a localized fallback. Text-update protocol v1 cannot publish
assets; no Google gallery data or unapproved images have been bundled.

Sustained JavaScript scheduling delay removes optional edge decoration for the
current native frame. It preserves all content, controls, ring basis and focused
transform. This is a conservative scheduling signal, not a native FPS, GPU or
thermal measurement. Physical performance still requires observation.

## AR photos

The live foreground AR utility controls expose explicit capture. Viro captures
the native camera/scene, excluding React Native utility chrome, with its automatic
gallery save disabled. Preview offers Save, Share and Discard. A user save writes
to the gallery; capture otherwise uses temporary app-owned files. There is no
upload or camera history. The pinned renderer may apply its own watermark.

Capture is fenced by logical identity and native-frame generation. Late results
are cleaned, and a hung native screenshot cannot start overlapping captures.
Temporary files remain leased until an in-flight save/share completes, then are
removed on retirement. A share chooser's dismissal does not establish delivery.
Android API29 and below require write-only save permission; modern saves request
no broad photo-library read permission. Owned-path validation and bounded storage
budgets fail closed on unexpected output or cleanup failure.

## Native and data acceptance still required

The five added Expo modules require a new development APK for complete testing:
TaskManager, Notifications, FileSystem, MediaLibrary and Sharing. Startup probes
allow an older APK to display guidance instead of evaluating missing modules.
The repository's specific per-build approval gate remains in force.

On the rebuilt APK verify: startup and existing map/auth/routes; permission denial,
Settings interruption and revocation; real background reminder delivery and
opt-out; camera/scene screenshot, preview, gallery save and share cancellation;
gallery readability/hit behavior when approved images exist; unsupported hardware
reader on a suitable device; lifecycle and sustained performance. Automated mocks
and Metro exports do not prove these behaviors.

D01–D09 still require approved centers/entrances, facts, translations and licensed
media. ACLC research remains a development draft; the tentative activation radius
requires an actual on-site GPS calibration. No code change supplies these approvals.
