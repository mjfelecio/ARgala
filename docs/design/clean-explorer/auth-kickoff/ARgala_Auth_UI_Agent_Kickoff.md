# Agent kickoff — ARgala Authentication UI

Repo: `mjfelecio/ARgala`
Starting branch: latest `main` (at handoff `84d1deeb` after PR #14 merge)
New work branch: `feat/auth-clean-explorer-ui`

Implement **only** AU01/AU02: the approved Clean Explorer **Sign In & Create Account** design, using the attached `ARgala_Auth_UI_Implementation_Plan.md`, design spec and refined Stitch HTML/PNGs.

Read `AGENTS.md`, `docs/design/clean-explorer/SCREEN_SPECIFICATIONS.md`, `docs/design/clean-explorer/WELCOME.md` and current code. Follow the plan task-by-task. Prefer installed HeroUI Native `TextField`/`Input`/`Label`/`Button` and UniWind `className`, with `global.css` as the sole theme source. Reuse the welcome scene or a similarly original local fallback; **do not ship Stitch's remote sample image**.

**Nonnegotiable preservation:** keep current email/password Supabase flows, credentials schemas, session restoration, registration email-confirmation path, protected routing and onboarding completion. Password input must not be trimmed. UI mode switch must remain functional. Signup helper requires ≥8 chars but sign-in accepts a nonempty shorter password. No fake account content, extra providers, guest/social/biometric auth, forgot-password promise, or additional backend calls.

**Design:** modest upper scenic hero, full-height white form below with rounded upper corners and NO floating mint gap. Two modes share identical input components and button styles; safe-area/keyboard/150% text/CJK usability. Add accessible password visibility and translated loading/error states. Keep Android controls reachable with keyboard open.

Follow TDD and small Conventional Commits. Run applicable checks and physical Android testing if possible; distinguish mock test results, Hermes export, APK build, and real-device UAT. Open an unmerged PR; **do not merge**.

Report: file changes, design comparison, auth invariants, test results, any Android limitations, and remaining visual or user-testing work. Do not change unrelated map, AR, catalog, routing or backend code.
