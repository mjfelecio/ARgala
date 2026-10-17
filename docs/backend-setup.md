# Supabase and Google setup

Create a Supabase project; use its public publishable key only in the mobile environment. Enable email/password authentication and configure email delivery/confirmation. The foundation uses Supabase PostgreSQL for Auth plus a private request counter, without profile, catalog, POI or travel-history tables.

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
```

Copy `supabase/functions/.env.example` to the ignored `supabase/functions/.env` for local secrets if desired. Pass that path explicitly to CLI commands; never commit its values. The Edge secrets file needs `GOOGLE_PLACES_API_KEY` and `GOOGLE_ROUTES_API_KEY`. Restrict each key to its corresponding API. Hosted Supabase provides `SUPABASE_URL` and named JSON dictionaries `SUPABASE_PUBLISHABLE_KEYS` / `SUPABASE_SECRET_KEYS`; the handlers prefer each dictionary’s `default` key. Single-key local variables (`SUPABASE_PUBLISHABLE_KEY` / `SUPABASE_SECRET_KEY`) and legacy injected anon/service-role keys remain supported as fallbacks. Never copy a secret/service-role key to the mobile environment. Set Google quotas and billing alerts appropriate to your project; per-user application limits do not replace project quotas.

`verify_jwt = false` disables the legacy gateway JWT check; **each handler still validates the bearer token using Supabase Auth `getUser` before reading provider data**, then consumes the database limit. This supports current JWT signing keys. Do not bypass this wrapper when adding handlers. Native calls supply the session token through `supabase.functions.invoke`.

Nearby Search accepts any valid center, radius greater than zero up to 5000 meters, and language `en`, `ko`, or `ja`. It requests up to 20 distance-ranked results with explicit fields and no curated destination/type restriction. This is a bounded sample of Google Places discovery, not an enumeration of all Google Maps labels. There is no Nearby Search (New) pagination. Field masks select paid SKUs; review Google pricing before deploying. Descriptions are optional in the shared model and are not fabricated or requested by the initial field mask.

Only the Android Maps SDK key is embedded in the native app. Places and Routes server keys are read exclusively inside Edge Functions. Provider responses and coordinates are not logged by application code or stored in PostgreSQL. Google content stays in transient client memory while displayed and clears on logout/unmount. Place identifiers may later be stored under Google's permitted exceptions; that feature is not implemented.

Place data is displayed on the Google map with its attribution visible. Additional returned provider attributions must remain visible with selected place data. AR currently displays no Google place content. Do not add photos, reviews, off-map results, permanent caches or alternative maps without reviewing Google's attribution and data policies. Public product Terms of Use and Privacy Policy must be supplied before distribution.

References: [Nearby Search (New)](https://developers.google.com/maps/documentation/places/web-service/nearby-search), [Place Details](https://developers.google.com/maps/documentation/places/web-service/place-details), [Places policies](https://developers.google.com/maps/documentation/places/web-service/policies), [React Native Auth](https://supabase.com/docs/guides/auth/quickstarts/react-native).

Walking routes use Google Routes computeRoutes with WALK mode and explicit distance/duration/polyline/warning fields. Draw returned paths on the Google map and retain the walking caution and provider warnings. A route is a snapshot from the supplied origin; there is no turn-by-turn guidance, continuous rerouting or guarantee of pedestrian access.

Key injection reference: [Supabase Edge environment variables](https://supabase.com/docs/guides/functions/secrets). The admin secret has service-role privileges for the private limiter RPC; caller JWTs are validated with a low-privilege publishable client.
