# Clean Explorer UI infrastructure

Phase 1 begins at stable main `69bebee`. The owner's October 18 architecture correction supersedes the handoff's older StyleSheet-only implementation advice. PR #6 remains unmerged; this integration does not copy its custom action components or TypeScript theme.

## Libraries and setup

- UniWind **1.12.2**, with Tailwind CSS **4.3.3**; this is not NativeWind.
- HeroUI Native **1.0.10**, using granular component/provider imports.
- SDK-compatible `react-native-svg` **15.15.4**, the only newly added native UI module. Existing Gesture Handler **2.32.0**, Reanimated **4.5.1**, Worklets **0.10.1**, Screens **4.26.0** and Safe Area Context **5.7.0** remain unchanged.
- `tailwind-variants` **3.3.1** and `tailwind-merge` **3.7.0** satisfy HeroUI's required peers. Application code defines no project-specific variant abstraction.
- `expo-font` **57.0.4** and `@expo-google-fonts/plus-jakarta-sans` bundle regular/medium/semibold/bold weights under the Android family `PlusJakartaSans`. No font download occurs at runtime. Native CJK fallback still needs device review.
- `@expo/vector-icons` provides actual Ionicons glyphs. Icon color is read from CSS with `useThemeColor`, not duplicated in TypeScript.

`metro.config.js` wraps Expo's default config with official `withUniwindConfig`, pointing to `global.css` and generated `src/uniwind.d.ts`. No NativeWind Babel preset, `cssInterop`, PostCSS config or Tailwind JavaScript theme is used. The root imports CSS before rendering and provides Gesture Handler → Safe Area → HeroUI → existing app providers. Third-party native roots use `withUniwind`; React Native's built-in components already support utilities.

The Expo Font config changes native resources and SVG adds native code, so an older development client must be rebuilt unless its native modules/resources already match. UniWind/Tailwind styling changes alone need a Metro restart, not a native rebuild. Existing EAS project metadata is preserved when resolving dynamic app config.

## CSS authority

`global.css` defines:

1. Primitive approved colors and named utilities: primary `#247A53`, strong green `#174D38`, mint `#E7F4EC`, white `#FFFFFF`, ink `#1C2923`, route blue `#2A72E5`.
2. Semantic HeroUI colors (`accent`, `default`, `surface`, `foreground`, `muted`, fields, borders, success/danger), referencing those primitives.
3. Plus Jakarta Sans, the handoff's typography roles and line heights, the 4-unit spacing base, and named input/card/sheet/page/pill radii.
4. HeroUI 1.0.10 component selector overrides for pill controls, 48/56 minimum targets, content-growing button height, wrapping labels and card surfaces. Overrides follow the library's unlayered selectors so CSS cascade order remains explicit.

Only the approved light theme is selected with `Uniwind.setTheme('light')`. This does not assert an approved dark design. Screen code uses semantic utilities; native-only props can consume resolved CSS variables. Existing product screens retain their presentation until their own focused UI pass.

## Development showcase

Rebuild/install the development APK after the native changes, then run:

```bash
EXPO_PUBLIC_UI_SHOWCASE=1 npx expo start --dev-client --clear
```

Connect the Android development client to this Metro server. The root switches to a diagnostic composition without mounting authentication, location, camera, discovery or paid services. It works without Google/Supabase runtime configuration. Stop/restart Metro without the flag to return to the existing app. Release builds ignore this flag because the gate also checks `__DEV__`.

The showcase uses actual HeroUI Button, Card, Surface, Chip and Spinner. Select/reset actions change local state; disabled and permanently busy examples are intentionally inert. A labeled Ionicons action demonstrates an icon-only button. English/Korean/Japanese resources own copy. Native text scaling remains enabled, and content scrolls.

The only custom components are `ShowcaseScreen` (diagnostic composition) and `DevelopmentShowcase` (development access gate). There is no custom Button/Card/Surface wrapper library.

## Phase 2 Home Map mapping

| PR #6 implementation | Replacement |
| --- | --- |
| `PillAction` | HeroUI `Button` and `Button.Label` with primary/secondary/outline variants |
| `CircleAction`, View-drawn icons | HeroUI icon-only `Button` with labeled Ionicons |
| `FloatingSurface` | HeroUI `Surface` |
| Selected place summary | HeroUI `Card` composition; no fabricated metadata |
| Selection/context metadata | HeroUI `Chip` where appropriate |
| Context panel | Established persistent sheet implementation, retaining map interaction and measured viewport padding |
| Details reload on expansion | Show recovery only when the full details response is absent/failed/evicted |

HeroUI 1.0.10's documented BottomSheet composition uses a portal, optional screen overlay and `@gorhom/bottom-sheet` internally. Installed source confirms the Android portal is `box-none` and its content wraps Gorhom's ordinary sheet rather than `BottomSheetModal`. Therefore do not assume it always blocks the map: explicitly test an overlay-free composition, back behavior, docked sizing, map gestures, scrollable content, attribution and route padding before choosing between HeroUI composition and direct non-modal Gorhom. The optional Gorhom peer is intentionally deferred until that Home Map interaction is implemented. No sheet library or wrapper was added speculatively in Phase 1.

The Phase 2 pass must preserve explicit Search/selection/Walk requests, transient cache lifecycle, Google Maps/Places/Routes boundaries, permission behavior, GPS/AR navigation, walking warnings and provider attribution. Do not carry forward PR #6's TypeScript token theme or generic custom primitives. Other product screens remain out of scope.

## Documentation consulted

- [UniWind official integration](https://docs.uniwind.dev/quickstart), plus installed 1.12.2 source.
- [HeroUI Native existing-project setup](https://www.heroui.com/en/docs/native/getting-started/quick-start), plus installed 1.0.10 styles, component and provider sources.
- [Expo SDK 57](https://docs.expo.dev/versions/v57.0.0/) and [Expo Font](https://docs.expo.dev/versions/v57.0.0/sdk/font/).
- Owner's local Stitch handoff `ARgala_UI_Implementation_Kickoff/ARgala_UI_Handoff/`: `DESIGN_SYSTEM.md`, `SCOPE_AND_DECISIONS.md`, H01 specification, proposed tokens and Home Map reference. Reference material is also preserved on [PR #6](https://github.com/mjfelecio/ARgala/pull/6).
- Owner's HOP app root, CSS and Metro configuration: adapt provider/font-loading patterns, while replacing its older NativeWind v3 integration with the current UniWind API.

See `docs/validation.md` for exact checks and native verification limits.
