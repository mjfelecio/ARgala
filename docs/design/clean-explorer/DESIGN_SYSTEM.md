# ARgala design system

## 1. Identity and authority

**[C] Clean Explorer:** map-first, green and white, rounded pill buttons, clean information hierarchy, restrained tourism photography and outdoor-readable controls. The Home Map is the composition reference; AR is more immersive and information-light; details are editorial; auth uses a scenic header over a full-height white form; settings is a straightforward utility page.

**[E] Source:** `references/stitch_argala_travel_ui/clean_explorer/DESIGN.md` plus the selected screen HTML and PNGs in the manifest. That file is preserved verbatim. It contains both a semantic YAML palette and a narrative palette that disagree, as well as component examples outside the approved functional scope.

**[P] This document normalizes those references for native implementation.** It does not claim all normalized values came from the export or that the export has passed accessibility testing.

## 2. Color contract

| Proposed token | Value | Basis / use |
| --- | --- | --- |
| `brandPrimary` | `#247A53` | [C/E] Approved primary swatch; default filled action and selected controls. |
| `brandStrong` | `#174D38` | [C/E] Pressed action and stronger green emphasis. |
| `mint` | `#E7F4EC` | [C/E] Secondary buttons and selected context. |
| `surface` | `#FFFFFF` | [C/E] Sheets, forms, cards, primary content. |
| `pageMint` | `#EEFDF3` | [E/P] Exported page surface; optional for settings/detail page background. Do not put a mint gap under auth content. |
| `text` | `#1C2923` | [C/E] Primary text. |
| `textSecondary` | `#3F4942` | [E/P] Readable secondary text from export semantic tokens. |
| `border` | `#E2EBE5` | [E] Narrative border token. |
| `routeBlue` | `#2A72E5` | [C/E] User-location and route accent, not general brand actions. |
| `danger` | `#BA1A1A` | [E/P] Errors and restrained destructive emphasis. |

**Conflict retained:** exported YAML says `primary: #00603D`, `primary-container: #247A53`, `secondary-container: #B7EFD2`, and `on-surface: #111E18`; narrative swatches use the approved values above. Several HTML files use those semantic variants. Do not copy all variants into independent screen themes. Review this proposed common mapping before coding.

A white-dominant identity does not mean erasing every mint page background that the owner approved. Keep white content surfaces, pale context, and one recognizable primary action color. Do not add category oranges/purples merely because the generic design narrative mentions them.

## 3. Typography

**[E] Font family:** Plus Jakarta Sans, referenced through Google Fonts CSS in the HTML. No font binaries are included. Export values are preserved in `tokens/exported-design-tokens.json`.

| Role | Size / line height / weight from source |
| --- | --- |
| Mobile hero | 28 / 34 / 700 |
| Page or place title | 24 / 32 / 700 |
| Section heading | 20 / 26 / 600 |
| Card title | 16 / 22 / 600 |
| Body large | 16 / 24 / 400 |
| Body standard | 14 / 20 / 400 |
| Supporting metadata | 12 / 16 / 500 |
| Action label | 14 / 20 / 600 |

**[P] Native application:** treat these as a starting type scale, not screenshot-pixel dimensions. Essential instructions and errors must remain readable when enlarged. The exported 10/14 label-sm token is not a license to make important controls microscopic. Test Korean and Japanese with an appropriate glyph fallback rather than assuming the Latin font covers them. Use the installed font-loading approach after checking SDK compatibility; do not migrate the UI stack just to load this font.

## 4. Spacing, geometry and responsive behavior

**[E]** The narrative specifies a 4/8-unit rhythm, 16-unit outer gutters, a 28-unit sheet top radius and pill actions. YAML radii and some HTML classes differ. **[P] Normalize by component**, not by ambiguous token names: input radius 16; card radius 20; real sheet top radius 28; auth/welcome top radius 32; pill radius fully rounded. Start with spacing 4, 8, 12, 16, 24, 32.

Exported PNGs vary in width from 334 to 706 pixels and many show an entire long page. They are not uniform phone viewports. Do not shrink a whole 1600-pixel-long destination screenshot to fit one device screen. Match hierarchy and component proportions; allow native scrolling.

**[P] Review targets:** at least 48 logical units for interactive targets; primary action minimum height 48, prominent action 56, inputs 52 or taller as text scales. These are design targets for this build, not measurements proving the supplied screenshots conform.

Full-height pages paint their surface to the bottom system inset. Only map and camera contextual panels behave as bottom sheets. Authentication, welcome and destination pages are not draggable just because they have rounded tops. Remove decorative drag handles from non-draggable pages.

## 5. Reusable components

| Component | Visual contract | Behavioral contract |
| --- | --- | --- |
| Primary button | Solid green, white label, pill, icon aligned consistently. | Disabled/loading/error recovery; preserve handler semantics. |
| Secondary button | Light mint with dark green text; same height as peer. | Visually subordinate; never a second primary. |
| Icon action | Simple icon on white/mint round surface. | Accessible label and adequate hit target; no unlabeled fake control. |
| Text field | White, subtle border, rounded; consistent on sign-in/register. | Visible label, keyboard types, error text, password visibility and focus state. |
| Language row | Native name, selection indicator, mint selected surface. | True selected state; persisted language through existing settings. |
| POI summary | Name, available address, honest user distance; actions below. | Rich/minimal as data variants, not separate business objects. |
| POI label | Compact readable white surface; restrained green selection. | Same provider ID, collision/hit area awareness and list alternative. |
| Context sheet | Docked to bottom/insets, rounded top, compact initial state. | Expanded states only where functional; never hide map attribution or controls. |
| Inline status | Small readable message + appropriate retry. | Differentiate unsearched, empty, unavailable and failed; keep stable codes. |
| Radius control | 100 m display, slider and 50/100/200/500 presets. | 10–1000 integer range; presets and numeric value agree; persistence errors visible. |
| Account summary | Compact initial/avatar icon and real email. | No fabricated personal profile, verification tier or statistics. |

**[P] Implement the smallest useful set**, extending `src/ui/shared.tsx` or its focused successors. The HTML uses Tailwind and DOM scripts; that is visual reference code, not a reason to add Tailwind, NativeWind, a WebView or a new backend. Reuse React Native StyleSheet, the installed gesture/animation stack and actual native map/camera surfaces.

## 6. Sheets, map and camera

**[E]** Generic DESIGN.md suggests 110-unit, 50% and 92% sheet detents. Those are not universally approved product requirements. **[P]** Use content-aware peek/expanded states, then verify on actual supported device sizes. Route overview stays compact. AR defaults to labels and a compact nearby strip; details expand only for the relevant selection/proximity state.

Preserve Google attribution from the existing implementation. Mockup maps and the tower/lake camera backgrounds are reference pixels only. Do not render them as functional map/camera content or draw the distorted black route wedges seen in some exports.

AR selection means selecting a **returned place label**, not recognizing a building. No reticles, ground-plane stems, shutter controls, camera mode rails, zoom chips, or fake calibration status. Changes to label dimensions must also account for collision lanes and reserved header/sheet space; changing padding alone can break hit targets or visibility.

## 7. States are part of the design

Design and test keyboard-open, long-text, text-enlarged, partial-data, unsearched, loading, error/retry, denied-permission, poor GPS, missing heading, stale tracking and no-route states. Keep app-owned strings in EN/KO/JA resources; do not freeze translated strings in state or show raw SDK errors. Provider-attributed content stays data, not an invented local translation.

Do not represent a checked box or a green status dot as verified sensor health. UI status is driven by the existing tracking contracts. No design polish may hide a meaningful fallback or create an automatic paid call.
