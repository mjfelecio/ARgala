# AR camera — Clean Explorer A01

This presentation pass follows the approved selected-state reference in
`ARgala_AR_Camera_Implementation_Kickoff.zip` and [A01](SCREEN_SPECIFICATIONS.md).
The screen uses a real rear-camera preview, a compact high-contrast AR/compass
control row, one Map return and an explicit Scan / Refresh control. The generic tab
bar and duplicate wrapper Back button are absent in AR.

`ArScreen` still owns focus/foreground camera permission and GPS/heading
lifecycles. `ArDiscovery` retains query reuse, sensor freshness/quality gates and
selected-place state. Three presentation components own chrome, directional
badges and a Gorhom nearby dock. HeroUI Native components and UniWind use the
existing `global.css`; there is no additional palette or dependency.

The label/sheet viewport is the space below the measured header and above pinned provider
credits. The nearby dock starts at a compact, font-scaled peek and supports
swiping and translated Show more/less controls. Automatic nearest-place selection
keeps the dock compact so the camera remains visible. A manual selection or an
incoming selected-place handoff opens the expanded dock, including places outside
activation/FOV. It preserves selection across heading changes and navigation. Requested expansion
is carried by the controlled native index so early selection survives delayed
native readiness; a one-detent viewport does not erase the expansion preference. Header Scan remains
visible while the panel scrolls. All returned places are available in the list.

Badges use the existing pure bearing/FOV ranking and provider IDs, with at most
three font-scaled lanes. Opaque dark surfaces, white text and a dark green selected
state keep labels readable against camera imagery. Badge dimensions and hit areas match the lanes. The
controller reserves settled sheet occupation and omits lanes that cannot fit.
A UI-thread clip follows the sheet position during native dragging, keeping
labels out of the dock's visual and touch region without per-frame React state.
The sheet's container/position styles are native geometry constraints; badge
left/top/width/height and camera absolute fill are the other dynamic native
styles. Static presentation uses CSS classes.

Google Maps branding and independently scrollable third-party credits stay
outside the moving sheet. Camera denial/mount failure retains permission
recovery, list selection and navigation. Invalid/magnetic/stale heading or poor
GPS suppresses directional/distance claims while retaining the list. Unscanned,
loading, empty and failure states remain distinct, with explicit retry via Scan.

View Details and View on Map carry the selected provider ID and summary through
the existing transient cache. Directions creates a single-use preview intent;
the existing route preview waits for its own fresh foreground GPS/watcher sample
before requesting walking directions. Rapid duplicate presses are ignored until
focus returns. Mount/focus, movement, language changes and remount do not acquire
new provider-request authority. Complete details suppress the paid recovery
button; missing/failed/evicted details retain explicit recovery.

Intentional differences from the reference: real camera imagery and provider
content; no reticle/stem, recognition claim, shutter/zoom controls, made-up
category or five-minute walking estimate. Distances are approximate geographic
distances, not walking distances. The fallback list and mandatory credits add
content absent from the artwork. The single Map control replaces the artwork's
duplicate Back/Map actions. Dynamic states and small-screen behavior extend the
selected-state reference; they are not approved screenshots.

Android display and outdoor accuracy are pending device verification. Check a
configured APK for camera permission denial/recovery and mount failure, Scan,
selection, heading rotation, no eligible places, poor/stale GPS, background and
return, long Korean/Japanese names, 150% text, small/landscape viewports,
TalkBack, scrolling credits, Details/Map handoff and exactly one Directions
request. Record device model, Android version, font scale, configuration,
screenshots and results in [validation](../../validation.md).

## Fixed camera scene

The native camera belongs to the full-screen AR scene, outside the safe-area overlay tree. It receives explicit positive scene dimensions before mounting. Controls, sheet, labels and provider credits reserve insets and occupation independently; neither expansion nor attribution height changes the preview bounds. The outer scene retains its last positive measurement through hidden-screen zero layouts, and actual resizing updates it. Focus/foreground and permission gates still unmount the camera when inactive, while selection and logical sheet expansion survive navigation.
