# Place Details: P01 / P02

The owner-supplied `ARgala_POI_Details_Implementation_Package.zip` contains the
approved `argala_place_details_rich` and `argala_place_details_minimal` PNG/HTML
references. Both were inspected before implementation alongside the screen
specifications, scope decisions and `global.css`.

One protected parent-stack page displays the current in-memory Place. The
mint page, compact location illustration, editorial title, factual white card,
rounded Directions action and subordinate Map/AR actions follow the references.
The page scrolls and leaves long names and translated labels untruncated. It
has one Back header and no bottom tabs. HeroUI Native supplies controls and
cards; UniWind uses the existing global tokens and Plus Jakarta Sans.

The current provider contract has no photos, categories, ratings, business
hours, alternate names or tourist verification. Those mockup elements are
omitted. A presentation-only approved-image slot includes an accessible label
and credit, with fallback on image failure; no runtime caller supplies it yet.
Only actual provider descriptions and addresses create their optional sections.
Coordinates are labeled latitude/longitude without a fabricated GPS-lock badge.
Google Maps branding and third-party attributions remain visible off-map.
There is no extra map preview, weather, contribution, bookmark or share feature.

Details owns no device watcher and claims no current user distance. Map/AR own
their existing location and permission flows; the page explains where a current
user distance can be seen. This also avoids a new permission request merely to
read cached place information.

Get Directions opens the dedicated Walking Directions preview through a single-use transient intent; the preview requests only after its own fresh foreground GPS/watcher sample, or reuses a matching completed snapshot. View on Map returns the selected Place to Explore. Open AR opens the real immersive camera/list experience with an in-memory selection handoff, without recognition or anchoring claims.

Opening, returning, remounting, foregrounding, changing locale and invalidating
queries never authorize a paid request. Load Details is offered only when the
current language's full details are absent. A failed explicit request retains
any available summary and displays a translated error with explicit recovery.
No provider content or image is persisted by this feature.

Native screenshot comparison, TalkBack, enlarged system text, touch interaction
and live Google/Supabase scenarios require Android acceptance testing. Structural
component assertions are recorded separately from native device evidence.
