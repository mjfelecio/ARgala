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
