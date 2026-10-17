# ARgala foundation design

The two supplied briefs define the scope: Android-only travel discovery with Expo SDK 57, strict TypeScript, Expo Router, Supabase and Google APIs. All work stays in the existing ARgala root. The scaffold goes to main, then coherent validated commits go to feat/app-foundation and an unmerged PR.

## Architecture

Use feature folders under src/features for auth, location, map, places, directions, ar and settings. Router files only assemble screens. Small shared UI components use React Native styles. TanStack Query owns transient remote state; React context owns auth and persisted preferences. Pure geographic functions have no device imports.

Supabase Auth persists sessions with AsyncStorage and refreshes only in the foreground. Protected Router screens wait for initial session resolution. Registration supports email confirmation. Missing configuration displays actionable setup state rather than inventing credentials.

Location services request foreground permission, get current coordinates and watch GPS/heading only while a screen is focused and the app is active. Watchers remove subscriptions even when asynchronous setup finishes after unmount. Unavailable GPS, denied permissions and absent/uncalibrated compass receive separate fallback states. No camera frames or travel history are stored.

Places use provider-independent identifiers, names, coordinates, optional descriptions/source and required attribution metadata. nearby({center, radiusMeters, language}) accepts any validated center, initially the device location; future destination consumers use the same interface. No tourist-only filters. Search radius defaults centrally to 1000 meters; AR activation radius defaults to 100 meters and is independently configurable. A future destination catalog and its potential 500-meter establishment filter have an explicit documented integration point, without new catalog tables.

Three authenticated Supabase Edge Functions call Places Nearby Search (New), Place Details (New) and Routes computeRoutes. Explicit field masks, JSON schemas, body limits, timeouts and bounded input protect the integrations. Google server keys stay in Edge secrets. A small private Postgres rate-limit table and atomic function enforce shared per-user limits across Edge instances; it holds no POI, location or route content. Missing limiter configuration fails closed. Clients never receive raw upstream errors or keys.

The map uses Google react-native-maps with live position, recenter, camera navigation, nearby markers and Android native POI click details. Selected POIs can request walking routes with distance, duration and decoded polyline. Routes are informational, with Google's walking caution shown; no navigation engine. AR is a focused CameraView plus GPS/compass status and development diagnostics, without floating cards or spatial tracking.

Localization uses separate English/Korean/Japanese resources, device locale initialization, English fallback and a persisted language preference. Content translation remains an extension task. API results stay in component/query memory only, with no disk cache, and are cleared on logout. Google content is shown with its map and attribution metadata; no non-map Places content is introduced in AR.

## Validation and external configuration

Run strict client typecheck, ESLint, Vitest for geo/contracts/provider handlers/polyline, Expo install compatibility, Expo Doctor, Android bundle export and Android prebuild/manifest inspection. Edge code receives Deno type checks when Deno is available. Tests inject fetch/auth/limiter at boundaries; they never imply live Google validation.

Document Supabase project setup, email confirmation, migrations, authenticated Edge deployment, server keys, restricted Android Maps key, Android package/SHA-1 and EAS profiles. EAS cloud builds, device GPS/compass/camera/maps and live services require external configuration and actual execution before being claimed.

## Alternatives considered

Client Google web-service calls expose server credentials. A custom backend adds deployment burden and conflicts with the brief. Edge Functions with small shared contracts provide the requested integration boundary without a new server framework.

## Exclusions

No comprehensive POI database, nine-destination restriction, catalog content, admin portal, elaborate AR, 3D tracking, complete translations, turn-by-turn navigation or automatic PR merge.
