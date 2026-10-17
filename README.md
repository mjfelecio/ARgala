# ARgala

Android-only travel discovery foundation using Expo SDK 57 and Expo Router. Application source and configuration live directly in this repository root.

## Local setup

Use Node 22.13 or newer (Node 22 LTS recommended) and npm. Install from the lockfile with `npm ci`.

Copy `.env.example` to `.env`, then set the Supabase project HTTPS URL and **publishable** client key. Never use a secret/service-role key in an `EXPO_PUBLIC_` variable. Missing or invalid client configuration produces a setup screen.

Use a separate Google key restricted to **Maps SDK for Android**, Android package `com.mjfelecio.argala`, and the SHA-1 fingerprint of the signing certificate for each build. Set `GOOGLE_MAPS_ANDROID_API_KEY` in the build environment. This Android key is embedded in the binary; restrictions are essential. Google Places/Routes web-service keys belong exclusively in Supabase Edge secrets.

Start Metro with `npm start`. Native modules require an Android development build. The default Expo assets remain template assets pending branding; no destination imagery is supplied or verified.

## Android builds

Link to your own Expo/EAS project using `npx eas-cli@latest init` and set `EAS_PROJECT_ID`. Configure the client variables and Android Maps key in the EAS `development` and `preview` environments. Run:

```sh
npx eas-cli@latest build --platform android --profile development
npx eas-cli@latest build --platform android --profile preview
```

The development profile includes the Expo development client. Preview produces an internally distributed APK. EAS cloud builds and device checks require actual account configuration and execution; build profiles alone do not prove a successful build.

## Architecture and scope

See [design](docs/superpowers/specs/2026-10-17-argala-design.md), [implementation plan](docs/superpowers/plans/2026-10-17-argala-foundation.md), and [progress](docs/progress.md).

The foundation separates authentication, foreground device location/heading, Google Maps, Places, walking routes, camera preview, and settings. Discovery accepts arbitrary geographic centers. It is not limited to a tourist catalog. AR uses GPS and compass bearings; spatial AR and turn-by-turn navigation are excluded.

Google API content must not become a persistent POI database. Query data stays in memory, and no camera frames or travel history are persisted. Public Terms of Use and Privacy Policy URLs must be supplied before distributing the product.

## Supabase authentication

Create a Supabase project and enable the email/password provider. Leave email confirmation enabled unless your development policy deliberately disables it. Registration without a session tells users to confirm their email, then sign in. No profile table is required. Sessions use the device's app-scoped AsyncStorage, including refresh tokens; use an appropriately secured device for development. No travel history or camera data is stored there.

## Settings and extension points

AR activation defaults to 100 meters and is persisted as one global setting (10–1000 whole meters). Nearby discovery defaults independently to 1000 meters, with a server maximum of 5000 meters and 20 returned results. Settings and language preferences contain no location history. Device language initializes English, Korean or Japanese; partial Korean/Japanese resources fall back to English.

See [backend setup](docs/backend-setup.md) for migrations, secrets and deployment, and [future catalog integration](docs/extending-discovery.md) for destination-centered discovery, preview data and localization extensions.

## Validation

```sh
npm run check
npm run check:edge
npm run lint:edge
npm run check:android
npm run test:limiter
npx expo install --check
npx expo-doctor
npm run export:android
```

The limiter check needs Python 3 and PostgreSQL server binaries. Edge checks use the pinned Deno CLI through npx. Android configuration introspection uses a nonfunctional local marker to verify key injection; it does not require Google credentials. The PR workflow runs the same checks without app secrets.

See the [validation report](docs/validation.md) for evidence, dependency advisories, external configuration and untested hardware/cloud behavior. Changing the Android Maps key requires regenerating native configuration and rebuilding: run `npx expo prebuild --platform android` before a local `npx expo run:android`, or use a fresh EAS build. Generated native directories are ignored and EAS uses the app config.

Recommended next tasks: configure/deploy the hosted services, build and test an Android preview APK, review provider policies/quotas and inherited dependency advisories, then implement basic bearing-based POI overlays and verified curated content. Complete translation review and destination previews remain later work.
