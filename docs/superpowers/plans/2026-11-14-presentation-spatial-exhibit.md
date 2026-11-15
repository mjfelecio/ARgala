# ARgala presentation and spatial exhibit implementation plan

## Authority and constraints

Owner approved the 2026-11-14 conversation plan, including its amendments. Complete Classic first: nine destinations, 20 stable chapters, 53 bundled images and all EN/JA/KO copy. Follow the supplied INTEGRATE.md, archived under docs/content/presentation-2026-11-13/. Preserve unrelated workspace changes. No native/dependency upgrade or APK build. Keep ACLC separate. Preserve camera/session/admission/capture/Passport and 2.25-unit reader distance.

## Task 1: Classic

Import adapters/assets, recursively merge supplied locale leaves, hydrate catalog names/summary/gallery/visitor guide and independently referenced center/entrance. Route to entrance. No new AR activation/provider/Passport authority. Write focused regression tests, run targeted tests and full check, content SQL and Android export. Commit a dependable fallback before starting Exhibit.

## Task 2: D01 first spatial prototype

Add Classic/Exhibit selector before guarded entry; default Classic. Lazy bounded Exhibit loading. Separate animation refs, tokens, timers, registry names and transition state. Shared content, preferences, capture and session services only. D01 only: faceted forward chapter arc (0,+24,-24 degrees at radius 2), layered frames, photo-led covers, native deployment/focus and a brief image reveal. Flat reader remains at 2.25 units. Show this first slice before further polish or extending to the other destinations.

## Task 3: acceptance and rollout (gated)

Owner reviews early prototype; Galaxy A53 establishes physical touch, readability, CJK, recovery, capture and native performance. Only afterward prototype bounded atmospheric effects (one emitter, max24 particles, disabled for reading/Help/tracking/reduced motion/reduced effects), refine, and roll out accepted family treatments to other eight destinations. Keep Classic selectable. No device evidence may be inferred from mocks or exports.

## Presentation cutoff

Once Jelzon supplies the deadline, reserve final testing, packaging and recovery time and stop new visual work at that cutoff. If Exhibit is not accepted, deliver Classic. Do not contact the client without instruction.

## Verification and handoff

Hash and chapter/media/locale/routing/admission tests; real-screen visitor guides and language changes; pagination of long credits; mode isolation, loader timeout/retirement, scene recovery and reduced motion. Run npm run check, npm run test:destination-content, npm run export:android. Record commits, exact results, APK/client identity and device limits in validation evidence. Early prototype is a review milestone, not permission to roll out.
