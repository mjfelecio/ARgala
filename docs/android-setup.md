# Android setup: hosted services to your phone

Use the existing **preview APK** profile for your first phone installation. It produces an app you can open without keeping your computer's development server running.

This walkthrough matches Expo SDK 57, Android package `com.mjfelecio.argala`, Supabase authentication, and Google Maps/Places/Routes. The project owner followed the walkthrough on 2026-10-18 and confirmed installation and sign-in. Subsequent location/camera startup issues and automated checks are recorded separately in [validation evidence](validation.md).

## Contents

1. [Prepare your computer and accounts](#1-prepare-your-computer-and-accounts)
2. [Create your Supabase project](#2-create-your-supabase-project)
3. [Enable authentication and create a test account](#3-enable-authentication-and-create-a-test-account)
4. [Apply the Supabase database migration](#4-apply-the-supabase-database-migration)
5. [Create and link your Expo project](#5-create-and-link-your-expo-project)
6. [Generate Android signing credentials](#6-generate-android-signing-credentials)
7. [Configure Google Cloud and create three API keys](#7-configure-google-cloud-and-create-three-api-keys)
8. [Fill in the app's local environment](#8-fill-in-the-apps-local-environment)
9. [Set backend secrets and deploy the Edge Functions](#9-set-backend-secrets-and-deploy-the-edge-functions)
10. [Add the app variables to Expo's build environment](#10-add-the-app-variables-to-expos-build-environment)
11. [Validate and build the APK](#11-validate-and-build-the-apk)
12. [Install and test on your phone](#12-install-and-test-on-your-phone)
13. [Optional: run a development build for editing](#13-optional-run-a-development-build-for-editing)

There is also a [troubleshooting table](#troubleshooting). Replace every `YOUR_...` placeholder before running a command. Reuse existing projects and signing credentials if you have already completed setup; do not overwrite configured environment files.

## 1. Prepare your computer and accounts

You need:

- Node.js **22.13 or newer**, with npm.
- An [Expo account](https://expo.dev/signup).
- A [Supabase account](https://supabase.com/dashboard).
- A [Google Cloud account](https://console.cloud.google.com/) with billing available.
- An Android phone with internet, GPS, camera, and Google Play services.

EAS builds the APK in the cloud. Android Studio and a Google Play developer account are not needed for this direct APK installation. EAS builds consume your account's build allowance; check your [EAS plan](https://expo.dev/pricing) for available capacity.

From your existing checkout:

```bash
cd /path/to/ARgala
npm ci
```

Run all remaining terminal commands from the repository root. The `export` commands below use Bash syntax.

## 2. Create your Supabase project

In the Supabase dashboard:

1. Create a project named `ARgala`.
2. Choose a region near your users.
3. Set and save the database password.
4. Wait for provisioning to finish.
5. Copy these values from the project's connection/API settings:

| Value | Example |
| --- | --- |
| Project reference | `abcdefghijklmnopqrst` |
| Project URL | `https://abcdefghijklmnopqrst.supabase.co` |
| Publishable key | `sb_publishable_...` |

**This app specifically requires the `sb_publishable_...` key.** Its configuration validation does not accept the older `anon` JWT. Secret and `service_role` keys belong exclusively on the backend. See [Supabase API keys](https://supabase.com/docs/guides/getting-started/api-keys).

## 3. Enable authentication and create a test account

In Supabase:

1. Open **Authentication → Sign In / Providers**.
2. Ensure **Email** authentication is enabled.
3. Keep email confirmation enabled.
4. Open **Authentication → Users → Add user → Create new user**.
5. Enter a test email and password.
6. Select **Auto confirm user**.
7. Create the user.

Use this account for your first phone login. Auto-confirming this test account does not disable confirmation for everyone else.

Before testing registration with other email addresses, configure **custom SMTP**. Supabase's default email service only sends to addresses belonging to your Supabase organization's team, which can otherwise make signup appear broken. See [Supabase email restrictions and SMTP setup](https://supabase.com/docs/guides/auth/auth-smtp).

## 4. Apply the Supabase database migration

Authenticate and link the repository to your hosted project:

```bash
npx supabase login
npx supabase link --project-ref YOUR_SUPABASE_PROJECT_REF
```

Enter the database password if prompted. Confirm the project reference, then review and apply the repository's migration:

```bash
npx supabase db push
```

This creates the request limiter used before Google API calls. It is required even though the foundation does not have catalog or profile tables. An already-applied migration should require no further changes.

You do not need to run `supabase init` or start a local Supabase instance. See [backend setup](backend-setup.md) for migration and limiter details.

**Checkpoint:** `db push` completes successfully against the intended project.

## 5. Create and link your Expo project

Log in:

```bash
npx eas-cli@latest login
```

In the Expo dashboard, create a project with the slug **`argala`**, then copy its **Project ID** from the project settings. Reuse your existing project if you already have one. This ID is a UUID, separate from your Supabase project reference.

Export it in your current Bash terminal:

```bash
export EAS_PROJECT_ID="YOUR_EXPO_PROJECT_UUID"
```

Link and verify:

```bash
npx eas-cli@latest init --id "$EAS_PROJECT_ID"
npx eas-cli@latest project:info
```

The repository already reads `EAS_PROJECT_ID` through `app.config.ts`; retain that arrangement if the CLI offers instructions about editing dynamic configuration. If initialization adds metadata to `app.json`, inspect the diff: `app.config.ts` replaces `extra` with its own values, so a static `extra.eas.projectId` does not replace the environment variable. An added Expo `owner` field remains effective and should match the account or organization that owns your project.

Set `EAS_PROJECT_ID` in the local `.env` and EAS environment in the later steps. Repeat the terminal `export` when necessary for linking commands in a new shell. See the [EAS CLI reference](https://docs.expo.dev/eas/cli/).

**Checkpoint:** `project:info` identifies the intended Expo project and owner.

## 6. Generate Android signing credentials

Google Maps needs the fingerprint of the certificate that signs your actual APK.

```bash
npx eas-cli@latest credentials:configure-build --platform android --profile preview
```

For a new app, allow EAS to generate/manage the Android keystore. If credentials already exist, reuse them.

Inspect the credentials:

```bash
npx eas-cli@latest credentials --platform android
```

Select the **preview** profile and record its **SHA-1 fingerprint**:

```text
Package name: com.mjfelecio.argala
SHA-1:        the fingerprint from EAS
```

Keep using the same keystore for subsequent builds. Use the APK signing fingerprint shown by EAS, rather than an unrelated local debug certificate. See [Expo signing credentials](https://docs.expo.dev/app-signing/managed-credentials/).

## 7. Configure Google Cloud and create three API keys

Create or select a Google Cloud project, attach billing, and enable:

- **Maps SDK for Android**
- **Places API (New)**
- **Routes API**

Under **APIs & Services → Credentials**, create three separate keys:

| Key purpose | Application restriction | API restriction |
| --- | --- | --- |
| Android map | Android apps: `com.mjfelecio.argala` plus the EAS SHA-1 | Maps SDK for Android |
| Places backend | Server use; see below | Places API (New) |
| Routes backend | Server use; see below | Routes API |

For the backend keys, do not apply Android application restrictions: Supabase makes those requests from its servers. If you have not configured fixed outbound IP addresses, leave application restrictions as **None**, restrict each key to its single API, and store it only in Supabase secrets. If you do have fixed outbound addresses, restrict server keys to those addresses.

Set Google API quotas and billing alerts appropriate to your testing budget. Budget alerts do not impose a spending cap. See [Google key restriction guidance](https://developers.google.com/maps/api-security-best-practices).

## 8. Fill in the app's local environment

If `.env` does not exist, copy `.env.example` to `.env`. If it already exists, edit it without overwriting working values:

```dotenv
EXPO_PUBLIC_SUPABASE_URL=https://YOUR_SUPABASE_PROJECT_REF.supabase.co
EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_YOUR_KEY
GOOGLE_MAPS_ANDROID_API_KEY=YOUR_ANDROID_MAPS_KEY
EAS_PROJECT_ID=YOUR_EXPO_PROJECT_UUID
```

Use the **Android Maps key** here. The Places and Routes backend keys go in the next step.

The existing React Native Maps configuration injects the Android key during the build. Do not edit generated Android files. Keep `.env` out of Git.

## 9. Set backend secrets and deploy the Edge Functions

Create `supabase/functions/.env`, using its adjacent `.env.example` as the template. Preserve any existing configured file:

```dotenv
GOOGLE_PLACES_API_KEY=YOUR_PLACES_SERVER_KEY
GOOGLE_ROUTES_API_KEY=YOUR_ROUTES_SERVER_KEY
```

Upload the secrets:

```bash
npx supabase secrets set --env-file supabase/functions/.env
```

Deploy all three functions:

```bash
npx supabase functions deploy places-nearby
npx supabase functions deploy place-details
npx supabase functions deploy walking-route
```

Keep this secrets file out of Git. Hosted Supabase supplies its own runtime credentials; do not copy an admin key into the app or EAS mobile variables.

Preserve the repository's `verify_jwt = false` configuration. Each function already verifies the signed-in user's bearer token itself. A request without a user session should return `401`; an unauthenticated dashboard test is not a successful end-to-end app test.

**Checkpoint:** All three functions appear in Supabase's Edge Functions dashboard.

## 10. Add the app variables to Expo's build environment

The cloud build needs its own environment variables because your ignored local `.env` is not a reliable source for remote builds.

Open your Expo project's **Environment variables** settings and add:

| Variable | Value | Visibility | Environment |
| --- | --- | --- | --- |
| `EXPO_PUBLIC_SUPABASE_URL` | Same as local `.env` | Plain text | Preview |
| `EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Same as local `.env` | Plain text | Preview |
| `GOOGLE_MAPS_ANDROID_API_KEY` | Android Maps key | Sensitive | Preview |
| `EAS_PROJECT_ID` | Expo project UUID | Plain text | Preview |

Use **Sensitive**, rather than **Secret**, for the Maps key so it remains available when EAS resolves the dynamic app configuration locally. These mobile values are ultimately embedded in the app; key restrictions provide the protection.

If you plan to use the development workflow in step 13, assign these variables to **Development** as well. The existing build profiles select their corresponding environments. See [Expo environment variable behavior](https://docs.expo.dev/eas/environment-variables/usage/).

## 11. Validate and build the APK

Run:

```bash
npm run check
npx expo install --check
npx expo-doctor
npm run check:android
npm run export:android
```

Resolve failures before building. Configuration checks and an export do not replace the APK build or device tests.

Build:

```bash
npx eas-cli@latest build --platform android --profile preview
```

Use the existing Android keystore if prompted. The repository's preview profile already produces an **APK**, suitable for direct phone installation. See [Expo's APK build guide](https://docs.expo.dev/build-reference/apk/).

**Checkpoint:** EAS reports a successful Android build and provides an APK installation link. Save the build ID for your validation notes.

## 12. Install and test on your phone

When the build finishes:

1. Open the build's installation link or QR code on your Android phone.
2. Download the APK.
3. Allow your browser to install apps from that source when Android prompts.
4. Install and open **ARgala**.
5. Sign in with the test account from step 3.
6. Enable the phone's location services and grant **precise location while using the app**.
7. Test outdoors where GPS reception is reliable.

Check the features in this order:

| Action | Expected result |
| --- | --- |
| Open the map | Map tiles and your current position appear |
| Tap **Discover near me** | Nearby places load around your position |
| Select a place | Its details appear |
| Tap **Get walking route** | An available walking route loads and the map frames it |
| Tap **Open camera** and allow camera access | Camera preview opens |
| Change language in Settings | App interface follows the selected language |

Discovery requires pressing **Discover near me**; opening the map alone does not initiate a paid search. Discovery defaults to 1000 meters. The separate 100-meter AR activation preference applies to all POIs on this device; it does not control the discovery radius.

The current foundation includes camera preview and location/heading services. **Directional floating POI labels are still a future feature.** Walking routes are snapshots with warnings, rather than turn-by-turn navigation; availability varies by destination.

Record your phone model, Android version, build ID, test date, and observed results. Before client UAT, also exercise denied/approximate permissions, GPS disabled, background/foreground recovery, camera failure, heading behavior, and attribution visibility. A successful first install does not cover all of those cases.

## 13. Optional: run a development build for editing

Once the preview APK works, use a development build for faster code iteration.

Ensure the four Expo variables also exist in the **Development** environment, then run:

```bash
npx eas-cli@latest build --platform android --profile development
```

Install that APK and start the local server:

```bash
npx expo start --dev-client
```

Keep your computer and phone on the same Wi-Fi, then open the development server through the installed ARgala development client.

If the network blocks the connection:

```bash
npx expo start --dev-client --tunnel
```

Verify that the development build's signing SHA-1 is authorized on the Android Maps key if it uses different credentials. Preview and development use the same Android package, so installing one replaces the other when signing credentials match. A development build needs Metro for local iteration; the preview APK does not.

## Troubleshooting

| Symptom | First things to check |
| --- | --- |
| App shows setup/configuration required | Supabase URL and `sb_publishable_...` key exist in the **Preview** EAS environment; rebuild afterward |
| Map configuration missing | `GOOGLE_MAPS_ANDROID_API_KEY` was available during the build |
| Blank/gray map | Billing, Maps SDK enabled, key restrictions, package name, and the APK's actual signing SHA-1 |
| Map works but discovery/details/routes fail | Edge deployment, backend secrets, enabled APIs, migration, and Edge Function logs |
| Requests return `401` | Confirm a user is signed in to the intended Supabase project; sign out/in and inspect function logs while retaining the repository's authentication configuration |
| Login fails | Test user password and confirmation status |
| Registration email does not arrive | Default SMTP team-address restriction; configure custom SMTP |
| Requests return `429` | The app permits 30 combined Google requests per user per one-minute window; wait for the window to reset |
| Development build cannot connect | Metro running, same Wi-Fi, firewall, or tunnel connection |
| Android refuses to update an installed APK | Compare signing credentials; use the original keystore. Uninstalling a differently signed copy removes its local app data |
| Lint fails inside `.agents/` | Local skill scripts should be excluded by the repository's ESLint configuration; use a checkout containing the tooling exclusions |

Changing an embedded app setting requires rebuilding the preview APK. Updating a backend Google key requires updating its Supabase secret. Changing a Google key's allowed APIs or certificate restrictions does not change the embedded key value.
