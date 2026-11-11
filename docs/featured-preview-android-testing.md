# Featured destination AR — Android preview testing

The nine story previews are development research, not the normal location-gated
featured-destination flow. They use a simulated development session, do not prove
arrival, and do not earn Passport stamps. Destination center and accessible
entrance approval, source/content review and on-site checks remain outstanding.
Do not present simulated admission as verified location behavior.

## Before the session

1. Use the installed compatible development build with native Viro and the current
   Metro bundle. Ensure `EXPO_PUBLIC_VIRO_SPIKE=1` in the local development
   environment. Unlock the phone and authorize USB debugging, then connect the
   device to Metro (USB reverse on port 8081 can be used).
2. Sign in or use the app's existing guest session. Open Profile and the development
   AR entry; select any featured destination. A failed support/permission check
   should offer the app's normal recovery rather than a simulated success.
3. Do not assume an Android export is an APK, and do not build another development
   or preview APK without the owner approving that specific build.

## Short test sequence

- Open each of the nine destinations. Confirm its title, chapter covers, overview
  photograph, caption/credit and the rest of its story correspond to the chosen
  location. Note any inaccurate or uncertain photo, claim or name for review.
- Test actual finger taps and close/reopen, Back and Recenter. Turn toward other
  chapters and check that they remain stable and open in the intended order.
- Test one first-visit entrance and a return, Skip, tracking loss/recovery and
  background/foreground. Watch for drifting, blocked controls or repeated prompts.
- Change to Japanese and Korean through the existing Settings flow. Verify actual
  native glyph rendering, text flow, captions and control readability. These are
  draft translations and require fluent review.
- Try bright and dim surroundings, and note camera image fit, contrast, frame
  smoothness and device temperature. Test photo failure/retry if reproducible.
- Separately verify the real destination and route entrance on site before using
  them for real admission/directions. Do not infer proximity from simulation.

## Presentation sequence

1. Connect the development phone to the running Metro server and keep the USB
   connection and server available throughout the demonstration. The selector is
   development-only; a standalone release does not contain an equivalent demo.
2. Open Profile → ACLC ring prototype and choose a destination. Say that this is
   a simulated, research-based AR preview, so the audience can distinguish it from
   an on-site GPS arrival. Show the preflight, then start the camera.
3. Open the overview, move through the photo, text and credit pages, then close
   it and choose another chapter. Lake Danao, Lake Janagdan, the Mangrove Eco Park,
   Pineapple Farm, Leyte Golf, Alto Peak and Sabin have two overview images to demonstrate paging.
4. Exit back to the selector to show another destination. For the pineapple farm,
   describe Sal's as a probable match rather than a confirmed entrance or operator.
5. If tracking or network setup interrupts the live demonstration, use the current
   Android testing record and describe the intended behavior; do not claim that
   the simulation verifies GPS, routing or a Passport stamp.

## Current limits

D01, D03, D04, D05, D06, D07 and D09 have two overview photos; the other two destinations
have one. The owner approved the prior preview resources; the additional photos
are identified in the research inventory and still need visual and factual review.
Photos and researched facts have not all been independently reviewed. There is no
integrated destination video player; the existing Viro seeking issue remains
unresolved. Device screenshots and mocked tests do not establish outdoor GPS,
accurate directions, physical short-tap reliability or final presentation readiness.
Record device/build, date, destination, language, conditions, result and failures.
