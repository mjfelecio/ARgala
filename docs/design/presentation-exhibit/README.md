# D01 first spatial prototype review

Classic is the content-complete fallback (commit `9960138`). The first Exhibit slice is limited to Lake Danao: three faceted chapter panels, chapter-specific cover photos, a text-led middle chapter, layered frames, native entrance/focus and short photo reveals. The flat reader stays at 2.25 units; content and credits remain complete. No atmospheric particles or other-destination rollout has started.

Open [the offline review illustration](D01-REVIEW.html) or [its wide composition capture](D01-REVIEW.png). They use the real supplied content and photo bindings, but are browser illustrations, **not Android/Viro screenshots**. Desktop perspective is illustrative; narrow windows show an inventory. Browser text flows continuously rather than reproducing native pagination. The neutral background is not a camera feed. The checked narrow Korean and Japanese reader captures remain private in the task's temporary evidence directory.

## Existing development client

Use the already-compatible development APK; no APK was built or installed. From this worktree, start Metro with `EXPO_PUBLIC_VIRO_SPIKE=1 npx expo start --dev-client`, open Profile's existing guarded AR presentation entry, and choose Classic or Exhibit before entry. Classic is selected initially. Exhibit offers only D01. Back/Exit returns to the selector; switching modes starts a separate owner. The optional Exhibit loader offers Retry or Continue with Classic after failure. A release build or disabled development flag cannot load this entry. ACLC remains a separate development/GPS-validation experience.

The source workspace's uncommitted SDK/auth changes were copied for compatibility and remain unstaged; the existing client identity has not been established while offline. Do not install, upgrade or rebuild an APK without owner approval.

## Galaxy A53 acceptance gate

Record client/APK identity, JS revision, device/Android version, battery, font scale, language and lighting. Compare Classic and Exhibit in brief batches using the same client and environment:

- All nine Classic destinations, all 20 chapters and all 53 photos; confirm offline availability after client/asset preparation.
- D01 arc visibility and comfort, real short finger taps, no missed/duplicate selection, text-led chapter, image Retry, caption/credit pages and Close back to the same arc.
- All EN/JA/KO glyphs and three reading sizes, with readable controls and adequate content clearance.
- Capture, Help, explicit Recenter, tracking loss/recovery, background/return and exit/reentry; no camera overlap or implicit recenter.
- Native frame pacing and memory during repeated photo navigation. JS scheduling pressure is not renderer FPS. Include D08 large photographs in later rollout checks.

Collect owner feedback on this first slice **before further polish or extending to the other eight destinations**. Both owner direction acceptance and physical A53 checks are pending. The owner requested continued offline work on 2026-11-14; no physical or native performance acceptance is claimed. Once Jelzon's deadline arrives, set the feature cutoff with final testing, packaging and recovery reserved; deliver Classic if Exhibit is not accepted.
