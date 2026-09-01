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
- The 2026-08-29 Ebook/Gutenberg baseline is frozen and must not be touched by unrelated changes.

## Current product checkpoint: 2026-09-01

The application shell is currently in a usable/stable state across iOS and Android. The active engineering work is no longer basic capability restoration. It is making JARVIS behave consistently as a context-aware assistant.

Recent manual observations:

- Voice response lifecycle is working again, including the previous iOS microphone/orange-indicator failure mode.
- `What time is it` works as a global utility intent when voice is active.
- Maps destination routing works; remaining Stop Voice/button placement is a UI issue, not a routing blocker.
- Media/YouTube and Books are functioning.
- Search Hub normal search routing was repaired; `cabs` is a confirmed working case.
- Natural-language variations such as `black or yellow` exposed the remaining boundary between conversational command handling and browser search. This is now being handled as a clean intent/query contract rather than a growing list of exact phrases.

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

Verified behavior includes Beowulf and John Henry Newman resolution, Read-in-JARVIS handoff, audio/MP3 exclusion and Gutenberg 404 filtering. Do not modify this subsystem unless a new reproducible regression is reported.

## Active track: Shell / Intelligence
Status: IN PROGRESS

### Phase 2: Search Hub provider fidelity

Commit: `782c51c0bb00f2410139a85132adfcf6adb59870`.

A provider-fidelity guard now keeps the selected Search Hub provider authoritative in the UI even if backend result records contain a different internal source label. The Web feature is loaded with a Phase 2 cache version.

**Status: PUSHED / VALIDATION PENDING.**

### Phase 3+ intelligence sequence

After Phase 2 is verified, build the context layer in this order:

1. **Numbered result references**: `open result 2`, `open result 3`, `open number 2`, `open no. 2`.
2. **Ordinal references**: first, second, third, last.
3. **Contextual locations**: here, there, nearby.
4. **Context clearing and expiry**: stale context must not survive beyond its useful lifetime.
5. **Explicit intent precedence**: direct commands must outrank stale/inferred context.
6. **Action/result chaining**: search → select → open/play/navigate without restating the entity.
7. **Entity continuity**: preserve logical identity across surface changes.
8. **Ambiguity resolution**: ask a concise clarification instead of guessing.
9. **Graceful clarification**: explain what context is missing and offer the smallest next step.

Each item is a separate issue and separate push.

## Product-furnishing goals

### Intelligence
- Move from phrase matching toward intent + slots + domain routing.
- Keep domain context separate from global utility intents.
- Preserve result identity, not just visible card position.
- Make voice and typed commands use the same normalization and authority path.

### Reliability
- Any recognition failure must return the microphone to idle and allow the next command without refresh.
- No feature may require a typed command to initialize voice behavior.
- No successful response should disappear because another surface was briefly opened.

### UX
- Clear the command text field after every submitted command.
- Keep the activation control reliable on touch devices.
- Keep Stop Voice inside the command interaction area without obscuring other navigation.
- Keep cosmetic changes isolated from command logic.

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
