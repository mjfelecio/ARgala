# Catalog integration

`placesService.nearby({ center, radiusMeters, language })` accepts an arbitrary geographic center. The home map supplies current device coordinates. Featured Destinations supplies a verified selected-destination center through the same service; neither the provider endpoint nor the shared Place model has a tourist-only filter.

`src/features/destinations` owns the bundled D01–D09 catalog, approved copy and daytime previews. Its fixed establishment radius is 500 meters, centralized independently as `DESTINATIONS.nearbyRadiusMeters` in `src/config/limits.ts`. It does not overwrite `settings.activationRadiusMeters`, the device-local AR activation preference initially set to 100 meters, or discovery's 1,000-meter default. Eligibility uses unrounded destination-to-place distance; the displayed distance is separately rounded and labeled as from the destination.

`Destination` remains separate from `Place`. A verified center authorizes an explicit nearby search; an independently approved accessible entrance enables the curated walking adapter. A center never substitutes for an entrance. `destinationToRoutePlace` preserves curated namespaces and the existing route-preview intent; curated preview details return to the catalog, never Google Place Details. Home-map handoff is separately gated because its current selection path loads Google details.

The nine draft names are provisional. No coordinates, tourist descriptions, photos, rights or content translations were supplied as approved data. Missing fields stay missing; catalog browsing needs no GPS or camera. See [content readiness and approval requirements](design/clean-explorer/DESTINATIONS.md). The manifest's approval references support review rather than proving a source's truth or licensing by themselves.

English/Korean/Japanese app labels live under `src/i18n/locales`. Approved tourist copy and photo metadata live in the manifest with per-field approval references. An approved English content fallback is visibly labeled; unavailable copy has an honest empty state. No provider results, location histories or camera frames are persisted.

Nearby queries are disabled observers with transient retention. Only the Explore Nearby button calls the existing authenticated service; mount, focus, locale changes, invalidation and reconnect cannot spend quota. An offline explicit attempt fails immediately instead of queuing a later paid retry. Use `setPlaceSelection` for memory-only navigation summaries so their lifetime is established before an unobserved query is created.
