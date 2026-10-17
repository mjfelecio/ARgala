# Future catalog integration

`placesService.nearby({ center, radiusMeters, language })` accepts an arbitrary geographic center. The home map supplies current device coordinates. A future curated catalog screen can supply a selected destination's coordinates through exactly the same service; neither the provider endpoint nor the shared Place model needs a tourist-only filter.

Keep catalog ownership and verified preview content in a future `features/destinations` feature. Supply catalog coordinates as `center`, and keep any future establishment filter (for example 500 meters) in that feature's own configuration. It must not overwrite `settings.activationRadiusMeters`, which is the single global AR activation setting, initially 100 meters. Discovery's default search radius is separately centralized in `src/config/limits.ts`.

`Place` carries provider/providerId, coordinates, optional description, optional source (`discovery` or `curated`) and attribution metadata. Future adapters can implement `PlacesService`; route destinations only need coordinates. Do not send catalog identifiers to Google Place Details. No destination list, hardcoded city, verified imagery, day/night previews or catalog table is included in this foundation.

English/Korean/Japanese translation resources live separately under `src/i18n/locales`. The initial screen labels have partial Korean/Japanese translations; missing content falls back to English. These are infrastructure resources, not complete reviewed product translations. Add catalog and preview strings there when verified content exists.
