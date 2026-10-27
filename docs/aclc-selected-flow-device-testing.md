# Selected ACLC flow: pending physical verification

2026-10-27: no ADB, new APK, camera capture or on-site GPS test was performed for
this integration. Owner confirmation that the ring prototype works well applies
to that prototype, not the checklist below. Native dependencies/configuration
are unchanged; use the existing Viro development APK. Any new APK build requires
separate approval.

When the owner resumes testing, run from this branch on a reachable local network:

```sh
EXPO_PUBLIC_VIRO_SPIKE=1 npx expo start --dev-client --lan
```

Open the server in the installed development client, not Expo Go. Normal Expo Go
cannot load Viro. Configure the existing ignored provider environment locally;
never commit credentials. LAN requires phone/computer connectivity. Do not start
ADB merely to use this checklist.

Record device/OS, APK identity, source commit, language, conditions and actual
outcomes. Every item below is currently NOT RUN for the integrated flow.

1. Open Featured Destinations → ACLC → map. Check remote browsing without GPS,
   selected marker/minimal sheet, pending content explanation, and separate
   entrance used by explicit Directions. Other catalog records retain their IDs.
2. In a development build with the flag, use the explicit Simulate arrival action.
   Confirm the simulation/research label, ACLC identity and sourced draft. This
   bypasses geographic admission only; real camera tracking is still required.
   D01–D09 must not expose an ACLC draft action. Release/flag-off/dead links must
   not start GPS, permission work or a native scene through this development path.
3. Start in a well-lit textured area. Hold a finger pad briefly then release on
   visible surfaces. Check both control columns, Close, text sizes, pagination,
   EN/JA/KO, English fallback labels, readability and no rectangular text artifact.
   Ordinary short taps remain an acknowledged pinned-platform limitation.
4. Lose tracking, turn, recover in the same scene: retain original ring basis and
   focused transform. Explicit Recenter may establish a new basis. Background
   removes the camera; a fresh native frame restores logical reading progress,
   never old transforms. Return within five minutes and after expiry separately.
   Expiry must offer Back to Explore and require a new handoff, not a dead Retry.
5. Interrupt first startup with permission/system activity. No duplicate automatic
   prompts; decline/failure requires explicit Retry. First scene and tracking-ready
   require fresh real eligibility. Only a session that became live gets the
   outside-radius/five-minute recovery exemption. Exit returns to the retained map.
6. Check explicit text/category/Search This Area and walking/driving Preview with
   configured authenticated providers. Panning/refocus/background/language changes
   must not silently call paid providers. Check attribution, captured route mode,
   Google Maps handoff and localized failure recovery. A native Maps launch and
   authenticated Google success have not been established by auth rejection tests.
7. Separately at ACLC, verify the owner-selected Maps place center, approximate
   accessible entrance and tentative 50m radius. Record summarized watcher age,
   accuracy and approach/stationary/leave outcomes, not a travel trace. Check poor
   accuracy/stale GPS/dismissal/deduplication. New real entry requires corroborated
   fresh continuous samples; no remote viewport or simulation proves arrival.
   After legitimate live entry, moving outside the radius must not end the scene;
   exit and reopening require fresh admission. Confirm safe entrance suitability
   and calibrate thresholds before claiming field acceptance.

Approved factual content, licensed media and exact Google Place ID association
remain separate inputs. Development research is editable in
[the research draft](content/aclc-research-draft.md); it is not production approval.
Passport, guest sync, reminders and broader offline/fallback phases remain deferred.
