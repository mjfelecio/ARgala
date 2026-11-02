# AR system audio preview implementation plan

> **For agentic workers:** Use superpowers:executing-plans inline.

**Goal:** Let the owner hear original system effects and EN/JA/KO robotic announcement drafts in the existing development prototype.
**Spec:** Cinematic AR DESIGN-SPEC sections7–8; owner request for missing sound/voice after accepting visual pass.
**Architecture:** Bundled generated WAVs through installed ViroSound. Both development guards and development session provenance precede audition assets. Production manifest remains empty until exact recordings and language review are approved. No runtime TTS, cloud account, native dependency or APK build.

## Tasks

- [x] Produce short original oscillator effects and formant voice drafts from existing app scripts. Record tool/version, sources, script aliases, peak/duration and pending language review. Keep developer tools outside the app.
- [x] RED→GREEN model guards for preview-only clips, distinct playback instances and stale native completion. Independent saved Voice/Effects preferences and non-overlap remain.
- [x] RED→GREEN real session preview wiring: locale-correct voice on explicit full-entrance preview despite existing history, deployed/focus/page/close effects, disabled/background cleanup; no preview audio for verified or release entry.
- [x] Add a brief native edge acknowledgement tied to actual settlement/focus, only if it preserves stable native hit ownership and reduced motion.
- [x] Phone audition with OS volume untouched, focused regressions, full check, dependency patch verification and final Android export. Record limits and commit.

Preview approval references record the owner's request to audition, not invented recording/language/release approval. Japanese/Korean pronunciation remains pending human review. Tool licenses are documented; no downloaded voice model or engine binary ships in the application.


Verification: targeted145/145; final check1413/126 files, TypeScript and lint;
8.6MB Android export; native patch check0 updates. Owner confirmed English voice
and deployment effects audible on the existing Galaxy A53 APK. JA/KO pronunciation
and complete interruption/volume/release matrices remain pending. Optional-load
regression was red before independent publication/in-place manifest updates.
