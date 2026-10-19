# Featured Destinations

The bundled catalog owns the draft SRS §3 IDs D01–D09 and provisional names.
Lake Janagdan/Hanagdan and Alto/Alta Peak require the client's official-name review.
The kickoff's SRS DOCX was inspected directly. Its CSV is an approval checklist,
not a data seed; its Stitch images, tourist facts and distances are illustrative.

All nine records currently lack verified centers, accessible entrances, approved
copy, photos and translations. They remain browsable without GPS or camera.
No coordinates, descriptions, categories, rights or access claims were inferred.
Missing approved content blocks full nine-site field UAT, not local navigation.

`catalog.ts` validates each supplied field. Centers and walking entrances have
independent approval references. Verified display names, each translated overview
and highlights field require their own approval reference. Media requires a
bundled `require(...)` asset, unique ID, descriptive approved English alt text,
credit, rights reference and approval reference; captions may be localized.
This schema enforces a complete record of approval; maintainers must verify the
actual sources and rights before merging content. A string alone is not proof.

For each future content change, record: destination ID; official name/source;
center/source/date; accessible entrance/source/date; each approved locale and
field; asset path and credit/license evidence; client approval reference/date.
Validate the manifest and review the asset/license together. Never copy the
readiness CSV's pending rows into approved fields.

Implementation keeps HeroUI/UniWind and the existing CSS tokens. The owner's
HOP CouponDetailsCard and HOP-Driver ShowTripDetails were inspected for card,
scrolling and explicit empty-state patterns; their library stack and raw-error
handling are not imported. No new dependency or TypeScript theme is needed.

Destination nearby search uses its own fixed 500 m center radius. Home remains
1,000 m by default and local AR activation remains 100 m. Nearby results show
straight-line distance from the destination and retain Google attributions.
No optional user-distance acquisition is added, so browsing never prompts GPS.

Curated Home-map handoff is deferred: Home currently requires GPS and its
selection path fetches Google details. A follow-up needs a namespaced local
selection, permission-free remote viewport and provider-safe sheet. There is no
inert View on Map action. Verified-entrance directions use the existing walking
preview's map and single-use intent. No curated ID may reach Google details.
