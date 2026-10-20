# ARgala Authentication UI — Agent Package

This is the **next feature after merged PR #14 (Welcome & Language Selection)**. Its goal is one focused PR restyling the existing sign-in/registration flow, not replacing Supabase authentication.

## Contents

- `ARgala_Auth_UI_Design_Spec.md`: approved visual behaviors versus existing auth requirements.
- `ARgala_Auth_UI_Implementation_Plan.md`: actionable phased agent plan, tests and commit points.
- `ARgala_Auth_UI_Agent_Kickoff.md`: copy into your coding agent.
- `references/sign-in-code.html` and `references/sign-in-screen.png`: original approved refined Stitch sign-in design.
- `references/create-account-code.html` and `references/create-account-screen.png`: original approved refined Stitch create-account design.

Reference HTML and images are **not runtime assets**. Screen PNGs were checked with Pillow as readable 706×1600 PNGs. The generated scenic photo is not an approved licensed asset and cannot be shipped blindly.

## Branching and review

Use latest `main`, `feat/auth-clean-explorer-ui`, commit in coherent increments, open PR (not merged), request review. Preserve protected routes and first-launch behavior. After this: Profile & Settings UI, then integrated Android field UAT.
