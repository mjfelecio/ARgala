# Seafoam Forest v2 — Android screenshot proof

Captured on 2026-11-02, approximately 09:57–10:04 Asia/Manila, after the owner
connected the phone. This follows the initial offline verification of v2.

## Review artifacts

[Open the local screenshot gallery](../.superpowers/reviews/2026-11-02-seafoam-forest/index.html)
contains ten original PNG captures with full-size links and a short live Explore
MP4. The [capture index](../.superpowers/reviews/2026-11-02-seafoam-forest/README.md)
and [manifest](../.superpowers/reviews/2026-11-02-seafoam-forest/manifest.json)
record context and SHA-256 digests. The recording is 720×1600, approximately
13.65 seconds; screenshots are unmodified 1080×2400 native screencaps.

Raw artifacts live in the gitignored `.superpowers/reviews/2026-11-02-seafoam-forest/`
directory. They are local review evidence, not repository/published assets:
Explore includes live map/location content, and the keyboard includes personal
OS suggestions. The gallery uses only local files with no external resources.

## Device and source

- Samsung Galaxy A53, SM-A536E, Android 16, 1080×2400.
- Physical density 450, existing override 420 (roughly 411×914 logical units).
- Existing system locale en-GB; app copy English except local Welcome previews.
- OS dark mode enabled; the approved app theme remains light.
- Original system font scale 1.1; large-text captures at 1.5; restored to 1.1.
- Installed development APK 1.0.0 (version code 1), last updated 2026-10-30.
- JavaScript branding revision `92ff49e`, served through local Metro over ADB.
- Phone battery was 5% at connection and 4% at completion, USB charging; checks
  were limited to branding rather than sustained GPS/camera/AR testing.

## Captures and observations

| Capture | Screen/state | Evidence boundary |
| --- | --- | --- |
| 01 | Explore, English, collapsed dock, font 1.1 | Live application |
| 02 | Explore, English, expanded dock, font 1.1 | Live application |
| 03 | Explore, English, collapsed dock, font 1.5 | Live application |
| 04 | Welcome, English, font 1.1 | Real native screen, isolated providers |
| 05 | Welcome, Japanese, font 1.1 | Real native screen, local language preview |
| 06 | Welcome, Korean, font 1.1 | Real native screen, local language preview |
| 07 | Welcome, English, font 1.5 | Real native screen, isolated providers |
| 08 | Sign-in, English, font 1.1 | Real native screen, isolated providers |
| 09 | Sign-in with native keyboard, font 1.1 | Real native screen, isolated providers |
| 10 | Sign-in local invalid-input message, font 1.1 | Real native screen, isolated providers |

Visual inspection confirmed the seafoam/forest arch and outlined wordmark render
on the phone. The original green selected/action/tab treatment remains visible.
Explore's brand mark stays inside the existing search surface at both text sizes;
its native single-line placeholder clips at large text, while the separate search
button remains visible. Horizontal category scrolling remains the overflow path.
Both dock states retain the new mark, readable content and Google attribution.
This is appearance evidence, not a new provider/GPS accuracy acceptance claim.

Welcome's primary lockup and quiet filled Journey motif remain legible in the
three captured languages. At 1.5 text the logo retains proportions and Continue
and language choices remain visible. Sign-in's horizontal lockup sits in its
existing white badge above the form; the decorative Journey remains in the hero.
The keyboard capture shows focused Email and native IME without losing the hero;
it does not verify scrolling to every form action while the IME is open. The
local invalid dummy input produces red fields and the localized generic
validation message; no valid credentials or server authentication were submitted.
No logo overlap or clipping was observed in the captured states. Owner aesthetic
approval remains a review decision, not an automated test result.

## Isolation and restoration

The owner's existing session/onboarding guards hide Welcome/sign-in. To avoid
signing out or resetting data, those captures render the actual screen components
under the existing native Gesture/SafeArea/HeroUI wrappers with temporary
read-only Settings/Onboarding context values. No screen markup, logo geometry,
CSS, or translations were replaced. These are native component/layout previews,
not evidence of navigating the normal signed-in flow to those routes.

All temporary preview source and context exports were removed, and the original
three source files were restored byte-for-byte before final verification.
Explore was then captured live at large text and returned to font 1.1. No stored
preferences, authentication session or onboarding status were deliberately changed;
no sign-out, app-data reset, Continue/guest entry, paid Search, Places selection
or Walk was performed. Japanese/Korean previews stayed local to Welcome. The
initial development-client connection error recovered after Metro became ready
and the existing client was restarted; failure/loading captures were excluded.

The phone was left on live Explore with Metro/ADB reverse available for owner
review. Temporary recording/UI-dump files were removed from the phone.
`npm run typecheck` and `npm run lint` both passed after source restoration;
there are no application-code changes in this capture follow-up.

## Still unverified

The installed APK predates v2 launcher/splash resources. This work does not verify
new launcher icons, themed masks or production cold-start splash. Those require
a separately approved rebuilt preview APK. No APK was built or installed.

Native AR/camera behavior, on-site eligibility, full EN/JA/KO normal/large-text
matrix, TalkBack, sign-in loading/server failure, all IME scroll actions and other
screen sizes remain outside these brief captures. The recording supplements the
live Explore screenshots; the two dock states are documented by their PNGs.
