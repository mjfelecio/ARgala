# Finalizing featured-destination content

Start with the [review packet](content/featured-destinations-review-packet.md).
It contains the actual current **20 chapters for D01–D09**, English text with
expandable Japanese/Korean drafts, all **16 bundled photo links**, captions,
alt text, credits, provenance references and destination-specific questions.
This is an editorial snapshot, not a new source of runtime data.

## What is ready and what your approval means

The nine stories and photographs are loaded in the guarded development preview:
**Profile → ACLC ring prototype → destination selector**. Sign in for this
guarded development entry. The installed compatible development APK needs the
current Metro server with both development guards; this selector is not an
ordinary release entry. See [Android preview instructions](featured-preview-android-testing.md).

You approved the existing preview resources and the latest reader/capture UI.
The remaining review is the exact final text, correct image/site identification,
translations, names, and location/access evidence. No content is silently changed
from draft to verified by the AR implementation or this PR.

The canonical catalog still holds provisional D01–D09 records. Preview stories
are kept separate from approved normal-flow content. Showing a story through
simulation never establishes physical arrival or earns a Tourist Passport stamp.
The prior ACLC on-site GPS check is one separate pilot result, not verification
of nine destination entrances. UI acceptance and editorial/geographic acceptance
are different records.

## Review these in order

1. **Official name and place identity.** Resolve Janagdan/Hanagdan, Alto/Alta,
   and the exact diversion-road pineapple field before polishing descriptions.
   Keep destination IDs stable even when a displayed name changes.
2. **English chapters.** Mark each Keep / Revise / Remove, give final replacement
   wording, and attach a source for factual claims. Preserve dates on historical
   research. Current prices, hours, access rules and accreditation need current
   confirmation; otherwise leave them out of final visitor-facing copy.
3. **Photographs.** Open all linked bundled files. Confirm the actual subject and
   destination, choose the cover/sequence, and correct captions, alt text and
   concise credits. Record the source and applicable media approval evidence.
   A matching filename or a source page's label is not on-site identity proof.
4. **Japanese and Korean.** Review titles, bodies, captions and alt text against
   the final English version. Record fluent reviewers and dates. The existing
   translations are drafts, even where glyphs render correctly.
5. **Destination and entrance.** Supply the destination point and the actual
   accessible public entrance separately, with map links, source and date.
   Record permission/access restrictions and pedestrian/vehicle differences.
   Do not choose an AR radius in the research form; on-site engineering checks
   calibrate activation separately. A center inside a lake, summit or private
   field is not automatically a safe walking entrance.
6. **Final version decision.** Use Approved / Revise / Pending per field and
   locale, with reviewer/date and a content-version identifier. Partial approval
   must stay explicit rather than becoming blanket approval for the destination.

D02 Lake Kasudsuran and D08 Heaven’s Peak each have one preview image. The full
approved-story readiness check needs at least two distinct bound assets across
the designated primary visual chapters, with media on each primary chapter.
The seven two-photo previews satisfy only a count, not factual/editorial approval.
Text-led factual or visitor chapters can remain text-led; do not invent imagery
or history merely to fill a chapter template.

For **D05**, the working story uses Sal’s Pineapple Plantation as a probable match
to your large Ormoc Diversion Road field. The operator, exact field, barangay,
photo identity, public entry permission and entrance remain decisions to confirm.
Do not treat the researched plus code or an online plantation photograph as
verification of your intended field.

## Files and references

| Resource | Use |
| --- | --- |
| [Review packet](content/featured-destinations-review-packet.md) | Read current stories/translations and open all bundled images without navigating code. |
| [Research form](featured-destination-research-form.md) | Fill one per destination: final wording, name/location/entrance, sources, media and reviewer decisions. |
| [Research inventory](featured-research-preview.md) | Source links, research uncertainties, D05 leads and existing photo provenance. These are leads, not fresh verification. |
| [Lake Danao research draft](lake-danao-ar-research-draft.md) | Earlier editorial options, fisheries/protected-area sources and conflicting area measurements. Some candidate copy/images differ from the live packet. |
| [Catalog approval contract](design/clean-explorer/DESTINATIONS.md) | Why canonical fields are still pending despite having development preview photos. |
| [Reader implementation](ar-reader-refinement-implementation.md), [capture verification](ar-capture-polish.md), [validation](validation.md) | What was actually tested and the remaining native/device/GPS gaps. |
| [Approved text delivery](destination-content.md) | Text-only update protocol and separate publication workflow after actual editorial approval. It cannot deliver photos or coordinates. |
| [ACLC pilot inputs](aclc-pilot-inputs.md), [campus research draft](content/aclc-research-draft.md) | Separate pilot, not a tenth replacement for D01–D09. Campus facts/programs/visitor arrangements remain draft. |

The runtime source locations are:

- [English](../src/i18n/locales/en.json), [Japanese](../src/i18n/locales/ja.json),
  [Korean](../src/i18n/locales/ko.json): `featuredResearch.stories.D01` through
  `D09`, with ordered `{title, body}` chapters. Do not change unrelated app labels
  when reviewing stories.
- [Story/source mapping](../src/features/destination-ar/development-featured-content.ts):
  destination IDs, chapter IDs and research links.
- [Photo metadata](../src/features/destination-ar/development-featured-media.ts):
  image identities, localized captions/alt text, credits and provenance links.
- [Bundled asset mapping](../src/features/destination-ar/development-featured-media-assets.ts):
  exact current image files. The main D01 image lives in `assets/development/lake-danao/`;
  the other main/extra files are in `assets/development/featured-research/`.
- [Canonical catalog](../src/features/destinations/catalog.ts) and
  [AR readiness checks](../src/features/destinations/ar-content-readiness.ts):
  separately reviewed name/geometry/media/story approvals for normal use.

## How to return your final content

Use the existing research form for complete submissions, or this concise format
for corrections. Plain text or a document is fine; do not edit TypeScript or
manually split text into AR pages.

```text
Destination: D05
Official displayed name:
Content version:

Chapter 1 — Keep / Replace / Remove
Final English title:
Final English body:
Sources and date checked:
Final Japanese / reviewer / date: [or Pending]
Final Korean / reviewer / date: [or Pending]
[Repeat for each chapter]

D05-preview — Keep / Replace
Exact new filename if replacing:
What it shows and how the place was confirmed:
Final caption and alt text, EN / JA / KO:
Display credit / original source / media approval evidence:
Cover and sequence preference:
[Repeat for every image]

Destination map link and coordinates:
Public entrance map link and coordinates:
Access restrictions and confirmation source/date:
Approved by / date:
Still pending:
```

After review, integrate the approved version and media mappings in a content PR,
retain explicit pending fields, run readiness/localization tests and inspect real
AR pages. Full canonical approval requires a matching story/content version,
reviewer/date, primary visual chapters, distinct bound media, reviewed localized
text/alt/captions and the existing media evidence fields. Approval labels are
records, not automatic fact verification.

Current source and UI merges do not publish an approved content artifact to the
hosted text service. That publication is separate. Video is not integrated and is
not required for this submission. Content approval also does not calibrate GPS,
authorize private-property access, or replace on-site arrival/directions testing.
