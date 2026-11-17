type Size = Readonly<{ width: number; height: number }>;

// generate-ar-holographic-art.py: 512-square frame/reader, x/y=5, rx=30,
// stroke=3. Stay inside the stroke with one extra texture pixel of clearance.
const frameTextureSize = 512;
const frameCornerCenter = frameTextureSize / 2 - 5 - 30;
const frameInnerRadius = 30 - 3 / 2 - 1;
const safeFrameFraction = 2 * (frameCornerCenter + frameInnerRadius / Math.SQRT2) / frameTextureSize;

/** The native image's ClipToBounds clips a rectangle, never its parent's
 * rounded texture. Fit the entire original aspect into an inscribed rectangle
 * of that painted ellipse (the square texture stretches with its frame).
 * Keep the frame/slot unchanged, and never crop or manufacture photo assets. */
export function fitPhotoInsideRoundedFrame(photo: Size, frame: Size): Size {
  const scale = Math.min(1, frame.width * safeFrameFraction / photo.width, frame.height * safeFrameFraction / photo.height);
  return { width: photo.width * scale, height: photo.height * scale };
}
