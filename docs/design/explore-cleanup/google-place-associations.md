# Google place associations for Explore

Research date: 2026-11-17. This evidence supports exact **display matching** only.
It does not establish an activation point/radius, AR eligibility, content approval,
Passport entitlement, or a replacement route entrance. Catalog coordinates and
entrances remain those supplied in `docs/content/presentation-2026-11-13/locations.json`.

Only public pages and ordinary public map links were inspected. No Google API key,
paid Places request, account action, or phone interaction was used. No live Places
API response is claimed; these are public listing-identity checks. Google Maps
itself returned a JavaScript shell or a tool-access error, so the readable evidence
below is explicit about its source.

## Associations supported by public evidence

| Catalog ID | Exact Google place ID | Public identity evidence |
| --- | --- | --- |
| D01 | `ChIJVREKfDnlBzMRfl4RQPJlsoU` | [Waze: Lake Danao Natural Park](https://www.waze.com/live-map/directions/ph/eastern-visayas/ormoc-city/lake-danao-natural-park?to=place.ChIJVREKfDnlBzMRfl4RQPJlsoU); [independent named listing with Google Maps URL](https://tocalmate.com/placelist/lake-danao-natural-park-ormoc-city-leyte-philippines/) |
| D03 | `ChIJR-Le6-3kBzMRh7dhK8rZPAw` | [Top-Rated: Lake Janagdan](https://www.top-rated.online/cities/Ormoc/place/p/1460318/Lake+Janagdan) |
| D04 | `ChIJw9UbztH3BzMRacBZ92EsYZw` | [VenueKonnex: Ormoc Mangrove Ecopark](https://venuekonnex.com/listing/ormoc-mangrove-ecopark/) |
| D05 | `ChIJKbrUq5zxBzMRL7306BmXue4` | [Top-Rated: Sal’s Pineapple Plantation](https://www.top-rated.online/cities/Ormoc/place/p/9929640/Sal%27s+Pineapple+Plantation) |
| D06 | `ChIJV4vCg4zxBzMROhJPn8Hz9DY` | [Homes.ph: named Leyte Golf Club map selection](https://homes.ph/restaurant/cities/ormoc?near=ChIJV4vCg4zxBzMROhJPn8Hz9DY&view=map); [GolfPH: named club with direct Google Maps listing](https://golfph.com/golf-courses/leyte-golf-and-country-club/) |
| D08 | `ChIJ4f0tMujlBzMRGLcx2nl2Mtc` | [Top-Rated: Heaven’s Peak](https://www.top-rated.online/cities/Ormoc/place/p/9261979/Heaven%27s+Peak) |
| D09 | `ChIJ5XvVgmT3BzMRqp2AP1xolmQ` | [VenueKonnex: Sabin Resort Hotel](https://venuekonnex.com/listing/sabin-resort-hotel/) |

### Verification details

- **D01:** the Waze URL itself contains the exact `ChIJ` identifier and its readable
  page identifies Lake Danao Natural Park in Ormoc. The independent named listing
  links to a Google Maps place with coordinates **11.0652951, 124.703809**, exactly
  the catalog center, and feature pair
  `0x3307e5397c0a1155:0x85b265f240115e7e`. Decoding the *observed* Waze place ID
  yields those same two feature values; no identifier was synthesized from a CID.
- **D03:** the page’s `LocalBusiness` JSON-LD binds `name: Lake Janagdan`,
  `geo: 11.09906540, 124.71774060`, and `hasMap` ending in
  `q=place_id:ChIJR-Le6-3kBzMRh7dhK8rZPAw` in one object. Coordinates exactly
  match the catalog. The separately indexed Homes.ph Lake Janagdan map selection
  uses the same ID, but its directly fetched page was only a hydration shell; it
  is corroboration rather than the primary coordinate evidence.
- **D04:** the named page’s primary photo component has
  `data-google-place-id="ChIJw9UbztH3BzMRacBZ92EsYZw"`; it is the only `ChIJ` ID
  in that page. Its primary Google Maps link uses **11.008989, 124.570055**,
  matching the catalog center to the page’s displayed rounding.
- **D05:** one `TouristAttraction` JSON-LD object binds Sal’s Pineapple Plantation,
  **11.03901820, 124.61326790**, and `hasMap` with the exact ID above. The
  coordinates exactly match the plantation catalog entry. This is **not** the
  similarly named SAL Pineapple shop/Pasalubong Center in the city center.
- **D06:** the indexed Homes.ph page identifies Leyte Golf Club and uses the exact
  `ChIJ` ID in its selection URL. Its direct response is a hydration shell. The
  GolfPH club page independently links to Google Maps’ named Leyte Golf Club
  listing at **10.9800643, 124.6611625**, exactly matching the catalog, with feature
  pair `0x3307f18c83c28b57:0x36f4f3c19f4f123a`. The observed Homes.ph `ChIJ` ID
  decodes to that same feature pair. This confirms the association without
  treating a name-only search result as evidence.
- **D08:** one `LocalBusiness` JSON-LD object binds Heaven’s Peak,
  **11.08378420, 124.72152560**, and its `hasMap` place ID. Coordinates exactly
  match the catalog.
- **D09:** the named page includes the ID on both its primary photo component and
  its dedicated `vag-place-id-single` marker. Its primary Maps URL uses
  **10.990489, 124.6211319**, matching the catalog center to rounding. No other
  `ChIJ` ID appears in the page.

The D01/D06 feature comparisons are reproducible: the observed 20-byte decoded
IDs have prefix `0a 12 09`, an eight-byte little-endian value at bytes 3–10,
tag byte `11`, and an eight-byte little-endian value at bytes 12–19. This is
recorded as an evidence cross-check, not a runtime ID-generation algorithm.

## Unresolved: do not add an association

- **D02 — Lake Kasudsuran:** public tourism/location pages and supplied map-center
  links were found, but no exact Google Places ID with independently verifiable
  listing identity was found. OpenStreetMap IDs, coordinate searches, My Maps
  custom-map IDs, and similarly named lakes are not substitutes.
- **D07 — Alto Peak:** [Wanderlog’s Alto Peak page](https://wanderlog.com/place/details/6136753/alto-peak)
  exposes `ChIJNQczD5XkBzMRa_IcNPC-orI`, but its own Google Maps listing coordinates
  are **11.107748, 124.708729**, several kilometers from the catalog’s
  **11.103007, 124.7424401**. This is a materially different listing location;
  the matching name alone is insufficient, so **do not register this ID**.
  Public results also identify “Mt. Aminduen (Alto Peak)” near the supplied
  center, but no exact ID for that listing was verified.

Unresolved destinations retain their persistent curated pins and curated-name /
approved-center external Maps links. Google results remain ordinary places until
an exact association has evidence; do not add fuzzy matching or repurpose an
existing AR provider association to hide these gaps.
