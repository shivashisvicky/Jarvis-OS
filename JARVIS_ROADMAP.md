# J.A.R.V.I.S. Intelligence Roadmap

## North Star
JARVIS should understand what the user means, choose the correct capability, execute it, observe the result, preserve relevant context, and support the next natural instruction without forcing the user to restate information.

## Guardrails
- Features and correctness take priority over cosmetics.
- Preserve working behavior before adding capability.
- Prefer isolated, reversible changes.
- Explicit commands outrank inferred context.
- Context should be scoped, time-bounded, and domain-aware.
- Voice and text should converge on the same command authority.
- Every major intelligence change should gain a deterministic test before the next layer is added.

## Phase A: Bulletproof the foundation
Status: IN PROGRESS
- Lock contextual reference contracts with unit tests.
- Verify ordinal result references: first, second, third, last, number N.
- Verify contextual location references: there, here, nearby.
- Verify context clearing and expiry behavior.
- Verify explicit search/map intent is not hijacked by stale context.
- Verify book result follow-ups remain owned by the ebook authority.

## Phase B: Make JARVIS feel intelligent
Status: FOUNDATION DEPLOYED
- Context Engine v3 with short history and domain-aware state.
- Command Authority v9.1 with contextual follow-up precedence.
- Cross-module result references.
- Next targets: action/result chaining, entity continuity, ambiguity resolution, and graceful clarification when context is insufficient.

## Phase C: Make JARVIS feel alive
Status: PLANNED
- Proactive briefings only when useful.
- User-defined routines and recurring workflows.
- Situation-aware suggestions.
- Personalized shortcuts without hard-coding user behavior into routing.
- Activity trail showing intent -> action -> result at a user-facing level, without exposing hidden reasoning.

## Product baseline
The visual layer is frozen at the current polished HUD / Arc Reactor baseline unless a visual change has a concrete usability benefit. Cosmetic work must remain isolated from intelligence logic.

## Current intelligence baseline
- Context Engine: v3
- Command Authority: v9.1
- Latest activated commit: 0fe76bf1bc6af1a4c68aaec68178edb6787beb2d
- CI: Jarvis OS CI run 1982 is validating this baseline.

## Suggested validation sequence after deployment
1. Find Beowulf
2. Open the first one
3. Open the second one
4. Find Jagannath Nagar
5. Return Home
6. Show me restaurants there
7. Find GGP Colony
8. Show me restaurants there
9. Search the internet for Beowulf
10. Open the first one

## Long-term inspiration
- Turing: intent over syntax.
- Shannon: recover meaning from noisy input.
- Wiener: sense -> act -> observe -> correct.
- Engelbart: augment the human rather than replace them.
- Hopper: the machine should adapt to human language.
- Feynman: verify that it actually works.
