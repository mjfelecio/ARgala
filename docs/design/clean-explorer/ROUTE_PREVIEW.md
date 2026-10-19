# Walking Directions — compact R01

The owner-supplied `ARgala_Walking_Directions_Kickoff.zip` selects the compact
R01 overview ([approved reference](references/walking-route-r01.png)), rather than expanded R02. The implementation adds a protected
parent-stack `/directions` screen above the existing tabs. It follows the
[screen specification](SCREEN_SPECIFICATIONS.md#r01--walking-directions--route-overview)
and the [execution plan](../../superpowers/plans/2026-10-19-walking-route-preview.md).

## Route acquisition and cost

POI Details → **Get Directions** creates a single-use, memory-only intent and
opens the preview. Its owner can submit one walking request after both a current
foreground position and a healthy continuous watcher sample are available.
Both samples must belong to the current focus/foreground ownership, be at most
30 seconds old, and have reported accuracy within 100 m. These reuse the app's
existing GPS usability limits; they are separate from discovery/AR radii.
Permission activities may suspend startup; resume rechecks grants and waits for
a new owner's sample. The existing location hook owns native cleanup and the
15-second complete startup deadline.

A pending intent expires after two minutes. Claiming removes its navigation
handle. A disabled QueryClient observer retains the preview session and result
for at most two minutes after it becomes unused. Only the claiming screen owns
acquisition authority; remount can display an existing result or pending request,
but cannot re-arm an unspent intent. A failed, expired or abandoned acquisition
requires an explicit **Try walking route again** action, which creates a fresh
intent. Rapid duplicate presses are guarded synchronously. Auth changes clear
pending handoffs and sessions; late responses cannot restore cleared data.
Nothing is stored on disk.

Home Map's **Get walking route** continues to request and display its own route.
After success, **View Route** passes that result and its original submitted
origin to the preview with zero additional Routes requests. Returning to the
same selected POI preserves Home's route. Selecting a different POI clears its
route as before.

Bare/dead URLs, tab changes, remounts, refocus, foreground return, locale changes,
query invalidation and reconnect do not independently authorize paid calls.
There is no rerouting, navigation guidance or successful-route refresh action.

## Presentation and intentional R01 differences

- A real native Google map renders the provider polyline in the existing CSS
  route blue, with the captured origin and green destination markers. The live
  user marker/Recenter requires usable current GPS. A moving user marker never
  changes the captured origin or reroutes the preview.
- The white header sits inside Android safe areas, with Back and the localized
  title. There are no Share/Profile extras or duplicate branded tab header.
- The compact white rounded dock is measured and scrollable, capped at 55% of
  the measured map scene. The header and safe areas are outside that scene.
  Google map padding is omitted until the current map instance is ready, then
  reserves the measured dock for legal attribution. Fit padding is added once,
  matching the Android Maps implementation. Fit/Recenter use accessible buttons.
- The dock uses HeroUI Chip/Card/Button/Spinner, UniWind, Plus Jakarta Sans and
  the existing `global.css` palette. It shows returned distance/duration,
  destination name, optional address, the snapshot explanation, standard walking
  caution and actual returned warnings/third-party credits. It never invents
  an address, route or tourist description.
- The screenshot's terrain claim, impossible static map geometry, black route
  triangle, sample time/distance and place-specific walkway claim are omitted.
  Native pins replace the illustrated landmark pin. Metrics use the existing
  localized meters/minutes wording rather than the screenshot's exact format.
  Actual cautions and snapshot text make the dock denser; long names, warnings
  and large fonts scroll rather than truncate. The dock is fixed, without a
  decorative drag handle or extra expanded screen.

The supplied PNG was inspected and compared to the implemented hierarchy. No
Android screenshot of this implementation was obtained; pixel parity, native
pin colors, legal-label placement and enlarged-text usability are **unverified**.

## Android acceptance still required

Build/install a configured APK and record device, Android version, navigation
mode, font scale, build/configuration and results before UAT:

1. Details → Get Directions → delayed permission/fix → preview: verify exactly
   one live Routes request; Place Details and hardware/visible Back restore the
   source journey. Change locale, background/resume, refocus and revisit without
   new paid calls.
2. Home Search → POI → Get walking route → View Route: verify zero new Routes
   calls, matching origin/destination/geometry, and preserved Home selection and
   route on return. Keep AR selection, tab state and Settings Back intact.
3. Deny/revoke GPS, disable services, stall startup, use stale/inaccurate samples,
   and exercise explicit Retry. Check no-route, timeout, upstream/rate-limited
   responses and malformed route recovery without raw diagnostics or fake paths.
4. Check Map readiness/loading, Fit and Recenter on a small/short viewport,
   rotation if enabled, 150% system text, TalkBack, gesture and three-button
   navigation. Ensure warnings, real provider credits and native Google legal
   labels remain visible/reachable. Route remains a snapshot while moving.
5. Open bare/expired directions URLs signed in and signed out; sign out while
   waiting or requesting and verify protected routing/data clearing.
