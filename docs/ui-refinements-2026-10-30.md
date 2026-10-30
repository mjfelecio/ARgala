# Device-driven UI refinements

These changes implement the owner's three requests while preserving the approved
Maps-inspired design, existing native APK capabilities and provider boundaries.
No extra APK build, dependency or native patch is required.

## AR panels

Focused placement moves from1.15 to1.5 Viro world units; panel dimensions, ring
radius and text sizes stay the same. This is an engineering comfort starting
point. Focus, Recenter and fresh-frame restoration use the shared geometry.

Holding/releasing another visible unfocused tile collapses the current panel to
the ring. It does not immediately expand the other tile. Close remains available.
Opening/closing transitions, noninteractive scene phases, stale pose and tracking
loss cannot use this action. Queued native callbacks read committed interactivity
and retire on unmount; callbacks from the already selected tile are ignored.
Reading progress and the captured native coordinate basis remain intact.

Geometry/controller/real-scene regressions pass, including retained callbacks.
Physical comfort, text readability at the new distance and native held-hit routing
still require an upright, textured camera view. The unattended camera view was
nearly black and did not reach tracking-ready. Short taps remain the accepted
Viro platform limitation; no native tap correction was added.

## Directions dock

The collapsed dock measures its compact title/mode/primary-action block instead
of relying on the old168dp reserve. One shared geometry calculation adds the
24dp native handle, bottom clearance and safe inset once, then caps to available
scene height. The same peek drives the native map baseline. Expanded details and
retired layout callbacks cannot change that measurement. Compact titles use two
lines; the expanded Journey section retains the full destination name.

On the GalaxyA53/Android16 gesture-navigation setup, Start Navigation previously
began at physical y2311 and was clipped at2400. The corrected complete button was
observed at y2172–2298, clear of the gesture area. Preview selected mode and Start
Navigation both remained visible after choosing another mode. This was repeated
at system font scale1.3; the original1.1 was restored. These bounds describe this
phone/configuration, not a universal pixel target. Native scroll remains recovery
for a viewport too small to display the entire primary group.

## Explore header

One branded floating surface now holds the query and trailing explicit search
action. Featured remains pinned beside the horizontally scrolling category row;
its visible label is shortened while its full accessibility label is retained.
Search this area becomes a compact centered chip, with its radius conveyed by
the localized accessibility hint. The initial instruction describes the search
field/icon. Typing, filter changes and language changes never submit a request.
Button and keyboard submission share the disabled/busy guard.

The normal-scale phone header ended around physical y561, compared with the old
y687 control stack. Native rendering at font scale1.3 was also observed. English,
Japanese and Korean resources and action states are covered by real-resource
component tests; the full large-font/native locale matrix remains acceptance work.

## Review status

The independent reviews confirmed the interaction/layout ownership fixes and
provider/lifecycle preservation. The complete local check passes1,254 tests across
114 files with strict TypeScript and zero-warning lint. Phone tests establish
layout and the specific flows in docs/validation.md, not on-site GPS calibration,
real geofence delivery, unsupported hardware behavior or AR-photo acceptance.
