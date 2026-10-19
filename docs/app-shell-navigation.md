# Clean Explorer application shell

The authenticated shell adds presentation and navigation around the existing Home Map and AR features. The root authentication guard is unchanged.

```text
Root protected Stack
└── (app) Stack
    ├── (tabs) JavaScript Tabs — initial destination: index
    │   ├── index   /          Explore → existing MapScreen
    │   ├── ar      /ar        ImmersiveArScreen → existing ArScreen
    │   └── profile /profile   placeholder with an Open settings action
    ├── place/[providerId] /place/:providerId — POI Details
    ├── directions  /directions — compact walking preview
    └── settings    /settings  existing SettingsScreen
```

Route files remain thin exports. `src/features/navigation/` owns `AppTabs`, `AppHeader`, the AR shell and the Profile placeholder. There are no duplicate `/` or `/ar` route files. The group layouts declare their initial routes for direct entry; `Tabs` also uses `initialRouteName="index"` and `backBehavior="initialRoute"`. Android Back from AR or Profile returns to Explore; Back at Explore propagates to the parent. Settings pushes onto the parent stack so Back restores the originating tab and its state.

Explore and Profile use one compact branded header with Android top safe area, an Ionicons compass mark, ARgala, a translated context label and a circular Settings action. AR hides both the branded header and tab bar. Its safe-area shell adds a visible Back to map button without changing camera, tracking, permission or discovery logic. Existing Open AR and AR-to-map POI actions navigate to the same public paths as before.

## Map and bottom navigation geometry

The tab bar participates in normal navigator layout. Its 64-unit content height resolves from the existing CSS spacing scale; the navigator's bottom inset is added once. It is not positioned over the map. The Home Map reserves left/right safe area only, so its measured scene ends above the complete bar and Android navigation area. Its existing sheet container height, snap points, measured map padding, Google credits and route fitting all use that smaller scene. Animated credit padding and settled route-fitting geometry remain separate.

Explore stays mounted between tab changes. A location refocus temporarily clears the hook's position while it checks permissions and starts GPS. `LocatedMap` retains the last position to keep the existing native map, selected POI, query observers and walking route mounted through that interval. Provider actions remain disabled until the hook has a current position; retaining the map does not grant permissions or issue requests. No provider results are persisted to disk. Authentication changes still clear transient queries and remove the protected shell.

## Components and theme

- Reuse Expo Router's supported JavaScript `Tabs` and the existing parent `Stack`.
- Reuse HeroUI Native `Button`, `Button.Label`, `Surface` and `useThemeColor`.
- Use actual Ionicons for the mark, destinations, Settings and return action.
- Use UniWind classes and the existing `global.css` palette, spacing and Plus Jakarta Sans family. Navigator-only styles resolve through `useResolveClassNames` and `useThemeColor`; there is no additional theme object or dependency.
- English, Korean and Japanese navigation labels and placeholder copy live in the existing locale resources and change during rendering.

## Differences from the Stitch artwork

The shell follows the approved green/mint hierarchy and typography. The mark is an Ionicons compass; the artwork's avatar is replaced by the requested Settings action. The approved three destinations omit Saved. Existing live map controls and the functional POI sheet remain in place, with their duplicate branding/Settings row removed. No generated photos, account details, search capabilities or POI metadata are added. AR keeps its existing functional layout inside the immersive shell; the other screens have not been redesigned. A device comparison is still required before claiming a visual match.

## Android development-build acceptance

Install the current development APK and run `npx expo start --dev-client` from this branch. Record build ID, device, Android version, navigation mode, text scale, date and results:

1. Sign in; confirm Explore is initially selected with one branded header and one Settings action. Check all three tabs and labels in English, Korean and Japanese.
2. Search once, select a POI and request a walking route. Expand the sheet; visit Profile and Settings, then return with both visible controls and Android Back. Confirm map selection, results, route, sheet expansion and Google credits remain usable without new provider requests.
3. Repeat with gesture and three-button Android navigation, a smaller viewport/split screen and larger text. Check touch targets, header insets, marker visibility, route framing, scrollable sheet content, attribution and walking warnings. The existing portrait orientation setting remains unchanged.
4. Open AR from the tab and Open AR control. Confirm the conventional shell is hidden and Back to map is always available, including permission-denied/loading states. Check camera and sensors stop on blur/background, resume correctly, and respect permission revocation and explicit Retry.
5. Select a POI in AR and use its directions action. Confirm it returns to the retained Explore map with that POI selected, without an automatic details or route request. Walk remains explicit.
6. Open `/ar`, `/profile` and `/settings` directly while signed in and signed out. Check protected routing and Android Back; sign out and verify the shell cannot be revisited through Back.

Automated checks exercise the installed SDK's router reducers and focus hooks with native rendering/hardware/network boundaries replaced. They do not establish Android rendering, physical sensor behavior or live provider integration. See [validation evidence](validation.md).

Details and Walking Directions use the protected parent stack without the tab bar or duplicate navigator headers. Get Directions owns a single-use transient request intent; Home View Route reuses its completed route. See [route preview](design/clean-explorer/ROUTE_PREVIEW.md).
