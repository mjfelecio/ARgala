# Supabase and Google setup

For the complete setup sequence through Expo signing, an Android APK and phone installation, start with the [Android setup guide](android-setup.md). This document explains the backend contracts and deployment details behind that walkthrough.

Create a Supabase project; use its public publishable key only in the mobile environment. ARgala signs in through Supabase's Google OAuth provider, not an app-owned password. Configure the Google consent screen and a Google **web** OAuth client with the Supabase provider's callback URL as its authorized redirect URI. Enable Google in Supabase Auth and enter the client ID and secret there; never put the secret in the app or repository. Add the exact `argala://auth-callback` URL to Supabase Auth's redirect allow list. For external Google consent screens in testing, authorize the intended Google test accounts; review Google's publishing requirements before public use. The Google OAuth credentials are distinct from the Maps SDK and server API keys.

Verify the complete Google sign-in on the installed Android app before disabling the hosted email/password provider. The application no longer exposes password sign-in or registration, and no legacy-account migration is supplied. Disabling the provider and handling existing sessions or deleting old users are separate hosted operations requiring review. Supabase may automatically link a verified Google identity to an existing user with the same email; this is provider behavior, not an app migration. Guest access remains local, and its existing journal merge applies after account sign-in.

The browser callback is accepted only by the current in-memory sign-in attempt. If Android terminates the app during the browser flow, start sign-in again; cold-start callback completion is not implemented. Configure and verify the native browser module in an approved Android build before relying on this flow. Hosted OAuth settings, email-provider cutover and physical sign-in have not been verified by the code changes alone.

Integration check on 2026-11-15: the hosted public Auth settings reported Google
disabled and email enabled. The workspace contains no Google OAuth client
credentials. Enable the provider and configure the exact callback above using
credentials kept in Supabase; guest entry remains available meanwhile. Do not
disable email or revoke existing sessions before successful Google acceptance.

From the project root, install/use the Supabase CLI and link your project:

```sh
npx supabase login
npx supabase link --project-ref YOUR_PROJECT_REF
npx supabase db push
```

Review the migration before pushing. `private.google_request_limits` holds one current counter per authenticated user. Its atomic RPC allows 30 combined Google requests per one-minute window starting with the first request. Only `service_role` may execute it. A missing migration or database error blocks provider requests. Run the isolated SQL concurrency test with `python3 scripts/test-rate-limiter.py` when PostgreSQL server binaries are installed; it creates its own temporary cluster and does not use an existing database.

Enable billing, Places API (New), and Routes API on a Google Cloud project. Configure server keys through the Supabase dashboard's Edge Function secrets page or a local ignored secrets file:

```sh
npx supabase secrets set --env-file /absolute/path/to/ignored-edge-secrets.env
npx supabase functions deploy places-nearby
npx supabase functions deploy place-details
npx supabase functions deploy walking-route
npx supabase functions deploy places-search
npx supabase functions deploy route-preview
```

Copy `supabase/functions/.env.example` to the ignored `supabase/functions/.env` for local secrets if desired. Pass that path explicitly to CLI commands; never commit its values. The Edge secrets file needs `GOOGLE_PLACES_API_KEY` and `GOOGLE_ROUTES_API_KEY`. Restrict each key to its corresponding API. Hosted Supabase provides `SUPABASE_URL` and named JSON dictionaries `SUPABASE_PUBLISHABLE_KEYS` / `SUPABASE_SECRET_KEYS`; the handlers prefer each dictionary’s `default` key. Single-key local variables (`SUPABASE_PUBLISHABLE_KEY` / `SUPABASE_SECRET_KEY`) and legacy injected anon/service-role keys remain supported as fallbacks. Never copy a secret/service-role key to the mobile environment. Set Google quotas and billing alerts appropriate to your project; per-user application limits do not replace project quotas.

`verify_jwt = false` disables the legacy gateway JWT check; **each handler still validates the bearer token using Supabase Auth `getUser` before reading provider data**, then consumes the database limit. This supports current JWT signing keys. Do not bypass this wrapper when adding handlers. Native calls supply the session token through `supabase.functions.invoke`.

Nearby Search accepts any valid center, radius greater than zero up to 5000 meters, and language `en`, `ko`, or `ja`. It requests up to 20 distance-ranked results with explicit fields and no curated destination/type restriction. This is a bounded sample of Google Places discovery, not an enumeration of all Google Maps labels. There is no Nearby Search (New) pagination. Field masks select paid SKUs; review Google pricing before deploying. Descriptions are optional in the shared model and are not fabricated or requested by the initial field mask.

Google specifies [no maximum Place ID length](https://developers.google.com/maps/documentation/places/web-service/place-id). This app preserves IDs unchanged and derives its identifier ceiling from the shared `REQUEST_LIMITS.maxBodyBytes` budget in `supabase/functions/_shared/contracts.ts`. The Edge reader independently enforces the existing 4096-byte limit on the complete request body, including JSON fields and envelope overhead, before consuming quota or calling Google. IDs longer than 512 characters are supported when the request fits that budget; larger complete requests return `BODY_TOO_LARGE` without increasing the application limit.

Only the Android Maps SDK key is embedded in the native app. Places and Routes server keys are read exclusively inside Edge Functions. Provider responses and coordinates are not logged by application code or stored in PostgreSQL. Google content stays in transient client memory while displayed and clears on logout/unmount. Place identifiers may later be stored under Google's permitted exceptions; that feature is not implemented.

Place data is displayed on the Google map with its attribution visible. Additional returned provider attributions must remain visible with selected place data. AR currently displays no Google place content. Do not add photos, reviews, off-map results, permanent caches or alternative maps without reviewing Google's attribution and data policies. Public product Terms of Use and Privacy Policy must be supplied before distribution.

References: [Nearby Search (New)](https://developers.google.com/maps/documentation/places/web-service/nearby-search), [Place Details](https://developers.google.com/maps/documentation/places/web-service/place-details), [Places policies](https://developers.google.com/maps/documentation/places/web-service/policies), [React Native Auth](https://supabase.com/docs/guides/auth/quickstarts/react-native).

Walking routes use Google Routes computeRoutes with WALK mode and explicit distance/duration/polyline/warning fields. Draw returned paths on the Google map and retain the walking caution and provider warnings. A route is a snapshot from the supplied origin; there is no turn-by-turn guidance, continuous rerouting or guarantee of pedestrian access.

Key injection reference: [Supabase Edge environment variables](https://supabase.com/docs/guides/functions/secrets). The admin secret has service-role privileges for the private limiter RPC; caller JWTs are validated with a low-privilege publishable client.

## Selected-destination slice endpoints (2026-10-27)

`places-search` supports explicit bounded free-text/category/area search;
`route-preview` supports explicit WALK/DRIVE snapshots. Both use the same bearer
validation, atomic limiter, payload/result limits and provider boundaries as the
existing handlers. The mobile client requires both deployed functions. Deployment
and unauthorized-request evidence is recorded in validation.md; that evidence does
not establish authenticated Google calls or route accuracy. The existing
`walking-route` endpoint remains available for older clients. Global text-search
results retain the Google Maps logo and returned provider attributions.

## Account journal RPC

The account-sync extension uses additive migration202610280001_journal_sync.sql,
not another Google Edge handler. Read [journal cloud sync](journal-cloud-sync.md)
for the revision/replay contract, per-user RLS, private implementation and data
limits. After authorized project access, inspect a database dry run and apply only
pending migrations with `--skip-vault`; do not include seeds/roles or repair
migration history by guessing. The migration was deployed to the configured
project on2026-10-28; validation.md records its source hash and hosted checks.
No Places/Routes credentials, native settings or limiter objects changed.
