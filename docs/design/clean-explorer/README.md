# Clean Explorer Home reference

Source: owner-supplied ARgala_UI_Handoff, generated with Stitch. The three Markdown documents and H01 PNG are copied unmodified; other source-relative links refer to the complete handoff.

Owner approval on 2026-10-18 resolves the source documents’ older proposed labels: P1 green palette, P2 three-destination navigation as a **future** shell choice, P3 explicit Settings Save, P4 user-action Search Nearby. This PR implements shared actions and Home only. The protected stack stays in place.

H01 is [the sole Home image reference](references/home-map.png). Its static map, microphone, categories, ratings, Saved, avatar and bottom tabs are artwork, not implemented features. Use live native Google tiles and actual provider fields.

Typography uses Android’s system font and glyph fallback. No Plus Jakarta Sans binary was supplied; no font or UI dependency is added. This pass uses the approved StyleSheet primitives and a docked panel with a real expand action, rather than installing a native bottom-sheet package.
