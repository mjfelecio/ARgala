# Integrate the finished ARgala content

## Scope

Finish the existing college-presentation version. Do not redesign the ring, reader, animations or controls. Preserve the 2.25-unit reading distance, capture flow, reading-size settings, existing session recovery and ACLC pilot. Do not reopen destination research or add provisional/temporary labels to visitor-facing content.

## Integration steps

1. Merge `locales/en.json`, `ja.json` and `ko.json` recursively into the corresponding app locale files. Replace only supplied leaves. The `featuredResearch.stories` arrays are complete and retain all 20 chapter positions. Do not replace whole app locale files.
2. Copy `assets/presentation/featured/` into the app's `assets/presentation/featured/`. Assets are bundled; do not replace them with remote URLs.
3. Use the four TypeScript/JSON files in `ready-to-copy/src/features/destination-ar/`. They retain the `previewStoryContent(id)` and `developmentFeaturedStories` exports from the supplied snapshot and use the current `RingContent`/gallery shape. Compare with the current branch before replacing a modified file; port the content changes if that branch has evolved.
4. Use `content.json` for names, summaries and visitor details in the featured destination cards/details. Use the gallery's `coverMediaId` as its cover. Bind each chapter's `mediaIds` as supplied; chapters with an empty array remain text-led. Do not force identical photos onto every chapter.
5. Apply `locations.json` to the catalog's landmark `center` and separate `routeEntrance` fields. Route directions to `routeEntrance`, not the lake/summit center. Record the user's local access confirmation in the application's reference fields. D02, D03 and D07 require a guide; D02's approach is approximately one hour. Do not derive an AR radius, provider Place ID or Passport entitlement from these coordinates.
6. Remove old research-status wording from the presentation screens using the supplied locale labels and complete content. Keep internal runtime/admission safeguards intact. The adapter's metadata reference describes this college presentation; it does not invent third-party redistribution licenses.
7. Run the current repository's type, localization and content checks. Check the actual presentation phone: all nine destinations open, photos display without internet, captions remain readable, each language renders, page controls work, Close returns properly and an interrupted session can recover. Test physical taps, not only ADB taps.

## Build and presentation handoff

Use the compatible development client for immediate testing. Text, image and TypeScript changes do not by themselves require writing new native Android code. A self-contained presentation APK must still package the selected app bundle and assets. Keep this integration focused on the known working runtime; no Expo/Viro upgrades, new video player, geospatial feature or panel redesign is part of this task.

No live repository files or installed APK were changed while assembling this package. The ready-to-copy adapter is grounded in the supplied source snapshot; integration and device smoke-testing belong in the current app workspace.

## Completion target

Deliver the content-integrated version and report the branch/commit, the checks run, and the APK/client used. Do not block the college presentation on the items in `FOLLOW-UP.md`; retain them as a separate later-work list.
