# Photo Islands — approved spatial direction

The owner selected Photo Islands in the interactive browser comparison and
explicitly instructed implementation on November 14. This extends the accepted
photo-led Exhibit: the visitor should turn their phone to discover photographs
and optional stories distributed around them, rather than see everything ahead.

## Spatial composition

Start with Lake Danao. Retain a photo-gallery welcome at the captured entrance.
Place three small bays at −95°, +35° and +150° relative to that entrance, on a
2.6-unit radius. Each bay contains two different supplied photographs separated
by 18° and a larger optional story tile underneath. Danao's seven original
photos therefore each have a visible entrance, including the welcome. Photos
are gallery entrances, never synthetic chapters or evidence that they illustrate
the nearby chapter. The bay locations are symbolic display geometry, not GPS.

Preserve destination scenery at the welcome and add restrained static shoreline
accents below the bays. Hide all browsing geometry through opening, reading and
Close; restore it after accepted Close completes. No JavaScript animation loop,
per-pose React updates, new particles or focused-reader reveal/glint effects.
Retain the same captured orientation through tracking recovery and Close;
only explicit Recenter or a new native frame changes it.

## Interaction and ownership

A bay photo opens the existing full destination gallery at that exact media ID.
Next/Previous continue through the same ordered gallery. The welcome entrance
resumes the existing gallery cursor. All entrances have distinct native focus
IDs so focus/Close use the selected tile's actual transform. Logical restoration
stores only the existing gallery cursor/focused flag, never photo entrances as
selected chapters or openings. Gallery browsing cannot create Passport progress.
Stale/disabled/retired image callbacks must not change cursor or focus.

Stories retain their stable IDs, content, reader cursors and opening semantics.
Reader remains flat, 1.25 units square, at 2.25 units. Reading preference,
captions, credits, capture and existing lifecycle/interaction fences remain owned
by their existing services. Use the visible photo as its accurate native hit
surface; decorative layers ignore events.

## Rollout and fallback

Implement and verify Danao first, then show it on the Galaxy A53 before expanding
the new geometry to the other eight destinations. Their accepted front stages
remain in place until that review. Keep the old Danao front-stage presentation
as a code-level fallback and Classic as the selectable presentation fallback.
No dependency upgrade, native modification or new APK is needed or authorized.
ACLC, GPS admission, camera, navigation and Passport rules are unchanged.

The presentation deadline is November 21. Stop new visual features November 19;
reserve November 20 for testing and packaging. Browser geometry is directional
approval, not evidence of native readability, hit testing or tracking stability.
Capture only a few useful real-app screenshots/clips during actual navigation,
separately from browser concepts, per AGENTS.md.
