# Camera POI overlays: developer device testing

The feature uses the existing Android Expo SDK 57 camera, foreground location,
Places Edge Functions and map walking routes. Automated evidence is in
[validation](validation.md). No APK or phone validation of these overlays was
performed during implementation.

## Behavior and limits

- Open camera from the map. Tap **Scan / Refresh** to search at the current GPS
  position: 1000 m discovery radius, at most 20 results. GPS, heading, focus,
  foreground, remount, language changes and invalidation never initiate a search.
- Compatible in-memory results can be reused for two minutes when the original
  search center is within 100 m and the request language matches. Results stay
  transient; authentication changes clear the query cache. Scan explicitly
  refreshes around the current position and uses the current language.
- Portrait labels use an approximate 60° horizontal field of view. There is no
  physical camera calibration, pitch/altitude projection, occlusion detection,
  object recognition, ARCore or spatial tracking. Keep the phone upright. At most
  three labels occupy separate vertical lanes; each label's horizontal position
  follows the bearing relative to heading. The compact list includes every result.
- The nearest POI within the device-local activation radius (100 m by default)
  is highlighted and expanded automatically. Manual selection takes priority and
  stays selected when it leaves the field of view or radius. Outside activation,
  places remain selectable. Address can be unavailable; additional details come
  from the existing provider and load only on request.
- **Get Directions on map** passes the unchanged Google Place ID and an in-memory
  summary to the map. Tap **Get walking route** there to use the existing route
  service/polyline. No turn-by-turn navigation is provided. An expired summary
  offers an explicit details action rather than fetching on entry.
- Directional labels require healthy continuous GPS, sample age at most 30 s,
  known location uncertainty at most 100 m, and a true-north heading of medium or
  high reported accuracy received within 10 s. Magnetic-only, low-accuracy,
  nonfinite, missing or old heading readings fall back to the list. Distances and
  activation pause when GPS is unhealthy. These are conservative MVP thresholds,
  not guarantees that a POI is physically inside the radius.
- AR requests foreground GPS updates at a zero-distance threshold with the
  existing 3 s minimum interval so stationary rotation can receive updates. The
  native provider still controls delivery; stale data is never silently treated
  as healthy. Camera, watchers and freshness timers stop on blur/background.
- Google Maps' unmodified attribution asset and provider credits appear beneath
  the results. There are no captured/stored camera frames or persisted Places
  responses. API failure text is localized; native/provider diagnostics are not
  displayed.

## Phone checklist

Use the configured environment and [Android setup guide](android-setup.md).
Build/install a real Android APK with the restricted Maps SDK key and authenticated
Supabase Edge Functions. Record device model, Android version, APK/build ID,
configuration names (no secrets), scenario and result.

1. Grant camera and precise foreground location; open AR without reopening the
   app. Stand still and rotate through north/360°. Scan real POIs; compare names,
   distances and directions with visible landmarks and Google Maps.
2. Check label readability, three-lane collision behavior, long names, large
   system fonts and provider attribution on the smallest supported screen.
3. Walk across the configured activation boundary in both directions. Repeat
   with a different setting. Check automatic nearest selection and a manually
   selected POI while turning away; all results remain accessible in the list.
4. Select a label and a list row; request additional details. Open the map and
   explicitly request walking directions. Check the selected POI, route polyline,
   route summary, walking caution and provider credits. Repeat the same POI after
   closing it. Back navigation must not multiply sensor subscriptions.
5. Deny/revoke camera and location, permanently deny prompts, disable GPS, use
   approximate location, simulate poor accuracy/compass interference and wait
   beyond the freshness thresholds. Confirm useful list/retry/settings guidance
   and absence of false directional/activation claims.
6. Background/foreground and navigate away during permissions, GPS startup,
   scanning and details loading. Confirm preview/watchers stop and resume,
   late completions do not restart sensors, and settled denials do not reprompt.
7. Exercise no results, network failure and rate limiting. Check explicit recovery
   and EN/KO/JA language changes, including while an error is visible.
8. Inspect service logs/Google billing metrics: requests occur only for explicit
   Scan, additional details, map selection or Walk. Rotations, GPS callbacks,
   remounts and lifecycle changes must add no provider calls. Sign out and back
   in to verify transient results from the prior session are gone.

The translation additions are implementation translations, not a completed native
speaker review. Real compass accuracy, magnetic interference, sensor update rate,
power use and visual alignment remain device-dependent and require these checks.
