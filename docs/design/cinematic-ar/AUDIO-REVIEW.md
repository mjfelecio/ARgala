# Cinematic AR audio review inventory

Status: pending production and owner/language review. No recordings are bundled
or approved. Both preferences default to **on**, per owner instruction during
implementation on 2026-11-02. Missing clips remain silent, never English fallback.

| Cue | EN script draft | JA script draft | KO script draft | Review |
| --- | --- | --- | --- | --- |
| First tracking-ready entry | AR initialized. | ARを起動しました。 | AR이 시작되었습니다. | All scripts/pronunciation/recordings pending |
| Deployment | Nonverbal soft lock cue | Same | Same | Original production and approval pending |
| Accepted panel focus | Nonverbal soft confirmation | Same | Same | Original production and approval pending |

These are drafts for review, not approved spoken translations. Existing localized
readiness/reveal/tracking status remains the visual channel. No destination facts
are spoken. Return visits, page navigation and tracking recovery never speak the
first-entry line.

Production decision: use bundled reviewed recordings through the installed Viro
sound API at low volume, with device volume respected. Do not add a cloud speech
provider, permissions or a separate native audio dependency. Prepare exact WAV
files and a record for each containing creator/tool and version, license or
written permission (including bundled/offline distribution), exact script,
language, duration, pronunciation reviewer, owner approval and date. No live
service or third-party voice is selected or invoked by this implementation.

The runtime manifest `approvedSystemAudio` intentionally has no clips. Populate
it only with the reviewed files and linked evidence; its approval references are
not permission to invent a reviewer. Independently test each language's clip,
all four preference combinations, OS volume/audio interruption and background
cleanup on Android before declaring audible behavior accepted.
