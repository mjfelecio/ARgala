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

Curated Home-map handoff now uses a namespaced transient selection, a remote
viewport that works without GPS, and the existing minimal bottom sheet. Curated
IDs never reach Google Details. Only an exact approved provider association can
normalize provider selection to a featured destination; ACLC has no approved
association yet. Rich featured copy stays in the arrival-gated experience.
Directions requires an independently approved accessible entrance and explicit
preview action; remote browsing never supplies a physical route origin.

The separate `pilot-aclc` record preserves D01–D09. Its Maps place center and
approximate entrance are owner-approved independently; the 50m activation radius
remains a field-calibration trial. Sourced EN/JA/KO ACLC research is development
content only. No approved factual tiles, provider association or licensed campus
media have been promoted. See ../../aclc-pilot-inputs.md and
../../content/aclc-research-draft.md.

The approved hierarchy is adapted to real content: one Back control, labeled
daytime hero or mint empty state, destination heading, horizontal thumbnails,
overview/highlights, Directions and nearby search. The gallery has actual
approved counts, source credits, a scrollable fullscreen viewer and Android Back.
No location subtitle, landscape photo, altitude, temperature, duration, road
access claim, AR distance gate or tourist highlight is invented to fill the design.
All product controls use existing HeroUI/UniWind; short viewports and long text
scroll instead of imposing fixed screen heights or single-line captions.

| ID | Provisional SRS name | Name / center / entrance / copy / media approval |
| --- | --- | --- |
| D01 | Lake Danao Natural Park | All pending |
| D02 | Lake Kasudsuran | All pending |
| D03 | Lake Janagdan | All pending; Hanagdan alias unresolved |
| D04 | Ormoc Mangrove Eco Park | All pending |
| D05 | Pineapple Farm | All pending |
| D06 | Leyte Golf and Country Club | All pending |
| D07 | Alto Peak | All pending; Alta alias unresolved |
| D08 | Heaven’s Peak | All pending |
| D09 | Sabin Resort Hotel | All pending |

With this manifest, all nine pages open and all destination Google actions are
disabled with reasons. Automated complete-content scenarios use explicitly
synthetic fixtures; those coordinates, text and asset IDs never enter runtime
catalog records. Client-approved content is needed to exercise live destination
searches and walking entrances in UAT.

Local POI navigation uses `setPlaceSelection` to configure transient retention
before storing an unobserved query. This avoids a zero-cache-lifetime race while
the next screen mounts. Retention expires when unused and auth clear still
removes the data. It does not grant details or route-request authority.
