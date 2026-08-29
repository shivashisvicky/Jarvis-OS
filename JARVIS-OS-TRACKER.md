# J.A.R.V.I.S. OS Engineering Tracker

**Last updated:** 2026-08-30

## Golden baseline

`ede622c6e7f35dbd67f2007806122116d724dcb5`

Verified deployed baseline. Ebook/Gutenberg is frozen unless a new reproducible regression is reported.

## Current working commits

- `670ebb554efb086ef747df732456409637cef27b` — Fix media ordinal context across navigation.
- `e1621b1d6462870b173cd740c137ae75ad5cd54d` — deployment/cache-version update for the Media context fix.
- `7e16a213e9600ddad036a7c63495b1568070ca34` — this session handoff checkpoint.

These working commits are **not** promoted to the golden baseline until CI/deployment and manual validation are green.

## Status

| Track | Status | Notes |
|---|---|---|
| 3.0 foundation | DONE | Runtime/architecture guardrails established |
| Command authority cleanup | DONE | Compatibility and routing hardened |
| Entity intelligence | DONE | Generic person/book resolution, no hardcoded names |
| Ebook/Gutenberg | DONE / FROZEN | Search, readable filtering, MP3 exclusion, 404 exclusion, reader handoff verified |
| Voice/iOS | STABLE | Protected from unrelated work |
| Maps | STABLE | Previous hardening complete; future improvements are separate issues |
| News | STABLE | Previous 3.0 hardening complete |
| Media | ACTIVE FIX / VALIDATION | Ordinal result recovery after leaving Media was just patched; manual validation pending |
| Shell / Intelligence | ACTIVE | Context/result reference layer |
| API Lab | PLANNED | After Shell / Intelligence |
| SFTP / Files | PLANNED | After API Lab |
| Terminal | PLANNED | After SFTP / Files |
| Proactive intelligence | PLANNED | Later Phase C |

## Active issue

### Media ordinal result recovery across navigation

**Reported behavior:** after a Media/YouTube result list is shown, returning to Command Center and saying `Play the first one` produced `I do not have a current result list to open` instead of playing the first result.

**Patch:** context engine `3.4.0` now reads the most recent valid `jarvis-youtube:*` session result cache when live Media context is missing, restores the query/results, navigates back to Media when required, reruns the stored query, finds the matching YouTube result by ID, and activates that card.

**Validation pending:**

1. Search YouTube with multiple results.
2. Leave Media for Command Center.
3. Say `Play the first one`.
4. Confirm the exact first result plays.
5. Repeat `Play the second one` and `Play result 2`.

Do not call this fixed/baselined until the deployed behavior is manually verified.

## Next queue after Media validation

1. Numbered result references: `open result 2`, `open number 2`, `open no. 2`.
2. Ordinal/result references: first, second, third, last.
3. Contextual locations: here, there, nearby.
4. Context clearing and expiry.
5. Explicit intent versus stale context.
6. Action/result chaining.
7. Entity continuity.
8. Ambiguity resolution.
9. Graceful clarification when context is insufficient.

Each item is a separate issue and separate push.

## Development rule

**One issue → one fix → one push → one validation.**

For each issue: reproduce it, identify the owning authority, change only that authority/test surface, push once, wait for CI/deployment, manually validate, then freeze the result if it becomes the best verified state.

Do not combine unrelated fixes. Do not use speculative cache busts as a substitute for a root-cause fix. Do not touch a frozen subsystem to solve a different problem.

## Protected subsystems

During Shell / Intelligence work, do not modify Ebook/Gutenberg, Voice/iOS, Time Now, Maps, News, Command Center, Games, Notes/Calculator or core navigation unless a separate regression is demonstrated. Media is protected from unrelated changes after the current ordinal-navigation issue is validated.

## Session handoff

Before starting work in a new chat, read `JARVIS-BASELINES.md`, `JARVIS-CONTINUATION.md`, `JARVIS-OS-TRACKER.md`, and `JARVIS_ROADMAP.md`. Then check CI/deployment for the current Media fix and manually validate the exact reported flow before moving to numbered result references.
