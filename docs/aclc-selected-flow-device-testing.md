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
outcomes. The checklist below defines the full scope; the partial 2026-10-27 results are recorded afterward.

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

## Partial off-site results — 2026-10-27

Galaxy A53 SM-A536E, Android16/API36, source c09ce99, existing APK; see the
artifact hash and setup observations in validation.md. No new APK/native change.

- Observed: signed-in map, preserved catalog plus ACLC pilot, ACLC map selection,
  explicit development simulation → selected native route, correct ACLC title and
  simulated-arrival disclaimer, real camera and Overview tile.
- Owner confirmed: ring opens and draft text is readable using held interaction.
- Owner confirmed: expanded panel on page3/3 restores after background/return.
  First attempt was inconclusive because the panel had been closed beforehand;
  the second attempt started with the expanded panel on page3/3.
- Android camera-service snapshot after two seconds in the background: no active
  clients. Return reacquired the camera; logical page restoration was observed.
- Pending: full EN/JA/KO/size/control coverage, permission/install interruptions,
  five-minute expiration, authenticated Google requests/Maps handoff and actual
  ACLC GPS/entrance/radius field calibration. This off-site simulation verifies
  none of the geographic admission criteria.

Owner also confirmed same native-scene tracking loss → turn → recovery retains
original orientation and expanded page3/3. Exit returned to the retained selected
ACLC map, and Android reported no active camera clients afterward. Battery ended
35%, USB charging,37.0°C. These observations pass those brief scenarios only;
full field/lifecycle/locale acceptance remains pending.
