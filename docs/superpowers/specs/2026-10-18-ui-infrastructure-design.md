# Clean Explorer UI infrastructure

The owner's architecture correction authorizes two ordered phases. Phase 1 starts at stable main `69bebee`, adds UniWind (not NativeWind), Tailwind CSS v4, HeroUI Native, and a small Android development showcase. PR #6 remains unmerged. Phase 2 reworks only Home Map after the foundation is established and its validation is reported.

## Phase 1 contract

`global.css` is the authoritative source for semantic colors, Plus Jakarta Sans typography, 4-unit spacing, input/card/sheet radii (16/20/28), pill actions, and component overrides. Approved colors: primary #247A53, strong #174D38, mint #E7F4EC, white #FFFFFF, text #1C2923, route blue #2A72E5. The original Stitch source remains reference evidence; its older StyleSheet-only implementation advice is superseded by this request. No parallel TypeScript token theme.

Use Expo's default Metro config wrapped with official `withUniwindConfig`; import CSS at the root, then gesture and HeroUI providers around the existing application providers/navigation. Preserve auth, settings, transient query lifecycle, permission and sensor behavior, providers and all backend contracts. Bundle font files through Expo Font so startup needs no font network request; native platform fallback handles CJK glyphs. Match the approved light design explicitly; dark design is not yet approved.

The explicit development-only `EXPO_PUBLIC_UI_SHOWCASE=1` diagnostic mode works without Supabase or Google configuration and never mounts map/camera/location services. It composes actual HeroUI Button, Card, Surface, Chip and Spinner with localized sample copy. Demonstrate primary/secondary/outline/icon actions, disabled/loading states and local selection/reset behavior. This is a diagnostic composition, not a new product screen or generic component wrapper layer.

## Phase 2 decisions to carry forward

Map `PillAction`/`CircleAction` to HeroUI Button and icon-only Button, generic floating panels to Surface, selected place content to Card and metadata/selection to Chip. Use real icon glyphs. Inspect HeroUI BottomSheet's implementation before choosing a persistent dock: retain map interaction, gestures, scrollable enlarged text, attribution and measured padding. Show a details-recovery action only when full details are absent/failed/evicted, never merely because a loaded panel is expanded. Paid requests remain explicit Search/selection/Walk actions.

## Validation and release boundary

Run the unchanged baseline suite, focused behavior/localization tests, full `npm run check`, Expo dependency check, Expo Doctor, Android configuration check, and Android export. Attempt a real development APK build, installation and showcase interaction on Android; report build and runtime evidence separately. Missing external credentials/tooling is a documented blocking condition, never evidence of native compatibility. Open a focused Phase 1 PR; do not merge automatically or restyle additional screens before reporting results.
