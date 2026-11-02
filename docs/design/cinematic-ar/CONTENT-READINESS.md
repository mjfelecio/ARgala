# Story ingestion and readiness

The client's submitted research form stays unchanged. No content has been
researched or invented as part of implementation. The renderer supports approved
bundled assets; static build-time requires provide image asset IDs. Do not put
provider images, external URLs or a guessed image index in `source`.

For a reviewed launch destination, retain the existing strict credit, rights,
approval, translated alt/caption and tile media bindings. Add an explicit
`offlineRightsReference` to every story asset. An editorial record has this form:

```ts
storyApproval: {
  contentVersion: '<exact ar.contentVersion>',
  approvalReference: '<review record assessing the overall visual sequence>',
  reviewer: '<actual reviewer>',
  reviewedAt: '<YYYY-MM-DD>',
  primaryChapterIds: ['<chapters the editor assessed as visual story sequence>'],
}
```

This is a human assessment, never a magic image-count approval. Mechanical checks
reject missing review, stale version, absent media, one cover (including duplicate
IDs for the same bundled source), missing offline rights or unreviewed EN/JA/KO
text/alt/captions. Several images are necessary but not sufficient. The editor
may accept a text-led History/supporting chapter when the overall approved story
has a meaningful visual sequence. It need not be listed as a visual primary.

Tiles may choose `presentation: 'photo' | 'gallery' | 'story'`; omitted treatment
uses story. All media are manually advanced and keep complete captions/credits.
Gallery pages precede supporting prose; story pages interleave visual and text
pages without dropping any text. Timeline input remains pending until actual
sourced dates and imagery exist. Text-only remote manifests can retain matching
bundle bindings/treatments, but cannot publish assets or editorial rights. A new
content version invalidates an old editorial assessment until reviewed.

`approvedArContent` gates full D01–D09 stories and their existing admission/UI
consumers. It does not hide catalog/map/directions or grant GPS authority. The
explicit pilot remains outside D01–D09 launch readiness and retains its existing
separate development/approved-input contracts. All current launch entries remain
pending; no live destination was promoted.
