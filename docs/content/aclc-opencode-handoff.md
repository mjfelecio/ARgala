# ACLC College of Ormoc handoff for OpenCode

ChatGPT is researching the replacement copy and campus photos. OpenCode owns integration in `/home/kirbysmashyeet/Source/typescript/ARgala` once the user supplies that research and any accompanying image files. Read `AGENTS.md` and check `git status --short` first. The user wants a finished school-project refresh in one pass. Make routine editorial and implementation choices as part of the task.

## Starting point

- ACLC College of Ormoc is permanent destination `D10`. The current campus is on Lilia Avenue in Barangay Cogon, Ormoc City, Leyte. Verify each photo against that site. The former Bonifacio Street location and other ACLC campuses are easy to confuse with it.
- At handoff, `main` is at `a1c4ca8` with the interim ACLC refresh in the working tree. Keep those edits and the two untracked assets, `D10-school-seal.jpg` and `D10-stem-congress-2026.png`. They are part of the current implementation and are already referenced by code.
- The current Featured Destinations and AR Showcase cover is the official school seal. The gallery also has the dated 2014 graduation photograph and an excerpt of the November 2026 DepEd schedule naming the campus as a STEM Congress venue. The 2014 photograph also has a separate History binding with its original caption and credit.
- The Maps action uses the verified listing `ChIJT-SmSnzxBzMRLcvH4JvP5XI`. It serves as an external photo reference. The presentation itself uses bundled assets and works offline.
- The interim refresh passed `npm run check` with 1,840 tests across 156 files. The Android export contained byte-identical copies of all three assets. The refreshed screens and Viro rendering still need physical Android verification. [Interim source notes](final-handoff-2026-11-19/README.md) · [Validation](../validation.md)

## What to deliver when the research arrives

1. Replace generic D10 text with the finished English, Japanese, and Korean copy. Integrate the Featured Destination summary, History, three distinct AR chapters, and visitor guidance. Keep the prose specific to Ormoc, easy to read in short AR pages, and clear about permission to enter the active private campus.
2. Use the strongest verified Lilia Avenue exterior or entrance photo as the lead image when a source file is available for school-project reuse. Pick supporting images that add a different view or illustrate a chapter. Keep a source URL, author or publisher, supported date, credit, localized caption and alt text, and the school-project usage scope. Use the seal as the fallback cover if the research yields only photo leads. Keep the dated graduation photo available in History.
3. Use the research citations to support the copy and keep the attribution current. If evidence is inconclusive, write around the gap using documented facts. For source links with unconfirmed reuse permission, keep the lead in the source notes. The owner reports school-staff permission for use of public ACLC images in the nonpublished project. Apply that scope where supported by the image source and honor separately identified photographer or participant permissions.

## Integration points

| Surface | Files and details |
| --- | --- |
| Featured details, gallery and Showcase stories | `src/features/destination-ar/featured-presentation-content.json` owns the D10 summary, visitor guide, three chapters, gallery order, cover ID, and media metadata. `src/features/destinations/presentation-catalog.ts` projects the catalog. `src/features/destination-ar/featured-story-content.ts` resolves the Showcase chapters. Preserve the stable chapter IDs `overview`, `chapter-2`, and `chapter-3`. |
| Bundled images | Put image files in `assets/presentation/featured/` and register static `require` entries in `src/features/destination-ar/featured-presentation-media-assets.ts`. Record the actual packaged width, height, and SHA-256. The `kind` values `emblem` and `document` preserve contain-mode previews and neutral image labels. Ordinary photographs use the existing photo presentation. |
| History | `src/i18n/locales/destination-history.ts` holds the 2D summary. The D10 entry in `docs/content/final-handoff-2026-11-19/history-review.json` supplies the AR History text and claim IDs. `sources.json` in that directory resolves the source IDs. The History visual uses `history-images.json`, `src/i18n/locales/ar-history-visuals.ts`, and `src/features/destinations/history-content.ts`. |
| AR layout and visitor guidance | Check D10 anchors in `src/features/destination-ar/editorial-breaks.ts` after rewriting chapters or History. The short guide panels read `visit-guide-essentials.ts`, while full readers use the catalog guide. In `photo-islands.ts`, D10 needs exactly `Math.ceil((gallerySize - 1) / 2)` bay angles. Verify gallery, story, guide, and History clearance for the final image proportions. |
| Verified on-site AR | `presentation-catalog.ts` currently reads D10’s verified chapters and media bindings from `docs/content/final-handoff-2026-11-19/destination-D10.json`. Treat this as the reviewed baseline. If the new package explicitly covers verified on-site use under `AGENTS.md`, update through the existing content-version and media authorization path with accurate provenance. Otherwise the new Showcase stories stay on the Showcase path and verified entry continues using the reviewed chapter bindings. |

Keep D01–D09 content byte-for-byte equivalent where baseline tests enforce it. Preserve the approved geofence bytes and labels, separate Directions entrance and display point, legacy `pilot-aclc` records and development guards, Passport behavior, and native capture restrictions. Continue using the existing detail, viewer, and AR controls.

## Verification

- Run the focused destination content, details, gallery, History, Showcase, Photo Islands, visitor guide, and verified route tests. Update counts and cover assertions for the assets actually selected. Cover EN, JA, and KO, source credits, photo aspect ratios, and verified media filtering.
- Run `npm run check`, `npm run export:android`, and `git diff --check`. If Expo’s local typed routes are stale, regenerate them with Expo before rerunning typecheck. Check that the Android export contains the new image bytes. Record what passed in `docs/validation.md` and distinguish automated checks from device observations.
- Follow `AGENTS.md` for separate APK build approval. This handoff is for repository integration and local verification.
