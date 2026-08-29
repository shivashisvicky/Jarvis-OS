# J.A.R.V.I.S. Intelligence Roadmap

## North Star
JARVIS should understand what the user means, choose the correct capability, execute it, observe the result, preserve relevant context, and support the next natural instruction without forcing the user to restate information.

## Engineering guardrails

- Correctness before cosmetics.
- Preserve working behavior before adding capability.
- Prefer isolated, reversible changes.
- Explicit commands outrank inferred context.
- Context is scoped, time-bounded and domain-aware.
- Voice and text converge on the same command authority.
- Every intelligence change gets deterministic coverage before the next layer is added.
- **One issue → one fix → one push → one validation cycle.**
- The 2026-08-29 Ebook/Gutenberg baseline is frozen and must not be touched by unrelated work.

## Completed tracks

### Foundation
Status: COMPLETE

- JARVIS OS 3.0 foundation established.
- One-authority architecture and runtime guardrails established.
- Production/deployed acceptance gates established.

### Command Authority Cleanup
Status: COMPLETE

- Command authority compatibility repaired.
- Time/voice release behavior protected.
- Ordinary form input protected from command interception.

### Entity Intelligence
Status: COMPLETE / STABLE

- Generic entity resolution for people and books.
- Book/person precedence without hardcoded names.
- Gutenberg author evidence routed through the ebook domain where appropriate.

### Ebook / Gutenberg
Status: COMPLETE / FROZEN

Golden baseline: `ede622c6e7f35dbd67f2007806122116d724dcb5`

Verified in the deployed build:

- Beowulf and John Henry Newman searches work.
- Read-in-JARVIS handoff works.
- Audio/MP3 records are excluded from ebook results.
- Gutenberg 404 records are filtered before reader rendering.
- Reader content loads and pagination works.

Do not modify this subsystem unless a new reproducible regression is reported.

## Active track: Shell / Intelligence
Status: IN PROGRESS

### Current issue
**Numbered result references.**

The context reference authority recognizes commands such as `open result 2`, `open number 2` and `open no. 2`, but the resolver fallback currently handles only first/second/third and one/two/three. Fix this one contract without changing unrelated routing.

### Remaining Shell / Intelligence sequence

1. Numbered result references.
2. Ordinal/result reference coverage: first, second, third, last.
3. Contextual location references: here, there, nearby.
4. Context clearing and expiry.
5. Explicit search/map intent must not be hijacked by stale context.
6. Action/result chaining.
7. Entity continuity and ambiguity resolution.
8. Graceful clarification when context is insufficient.

Each item is a separate issue and separate push.

## Later 3.0 subsystem migration

After Shell / Intelligence is validated:

- Media
- News
- Maps
- API Lab
- SFTP / Files
- Terminal

## Phase C: Make JARVIS feel alive
Status: PLANNED

- Proactive briefings only when useful.
- User-defined routines and recurring workflows.
- Situation-aware suggestions.
- Personalized shortcuts without hard-coding user behavior into routing.
- User-facing activity trail showing intent → action → result without exposing hidden reasoning.

## Product baseline

The visual HUD / Arc Reactor layer is frozen unless a visual change has a concrete usability benefit. Cosmetic work must remain isolated from intelligence logic.

## Validation philosophy

The deployed application is the product. A source/build success is not enough. For every change, validate the exact reported behavior in CI and, where applicable, the deployed Pages build. Never ask the user to repeatedly retest unrelated subsystems.
