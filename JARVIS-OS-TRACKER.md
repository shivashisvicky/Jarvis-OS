# J.A.R.V.I.S. OS Engineering Tracker

**Last updated:** 2026-08-29

## Golden baseline

`ede622c6e7f35dbd67f2007806122116d724dcb5`

Verified deployed baseline. Ebook/Gutenberg is frozen unless a new reproducible regression is reported.

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
| Media | STABLE | Previous 3.0 hardening complete |
| Shell / Intelligence | ACTIVE | Next workstream |
| API Lab | PLANNED | After Shell / Intelligence |
| SFTP / Files | PLANNED | After API Lab |
| Terminal | PLANNED | After SFTP / Files |
| Proactive intelligence | PLANNED | Later Phase C |

## Active queue

### 1. Numbered result references

**ACTIVE NOW**

Fix the existing reference contract for `open result 2`, `open number 2`, and `open no. 2`.

The current authority recognizes this syntax but its fallback resolver only resolves first/second/third and one/two/three. This is the next and only active code fix.

### 2. Remaining context references

After item 1 is green, handle each as a separate issue:

- ordinal references: first, second, third, last;
- contextual locations: here, there, nearby;
- context clearing and expiry;
- explicit intent versus stale context;
- action/result chaining;
- entity continuity;
- ambiguity resolution;
- graceful clarification when context is insufficient.

## Development rule

**One issue → one fix → one push → one validation.**

For each issue: reproduce it, identify the owning authority, change only that authority/test surface, push once, wait for CI/deployment, manually validate, then freeze the result if it becomes the best verified state.

Do not combine unrelated fixes. Do not use speculative cache busts as a substitute for a root-cause fix. Do not touch a frozen subsystem to solve a different problem.

## Protected subsystems

During Shell / Intelligence work, do not modify Ebook/Gutenberg, Voice/iOS, Time Now, Maps, News, Media, Command Center, Games, Notes/Calculator or core navigation unless a separate regression is demonstrated.

## Tracker hygiene

Completed issues and stale experimental PRs should be closed. GitHub's open work should represent actual pending engineering work, not historical debugging attempts.

## Session handoff

Before starting work in a new chat, read `JARVIS-BASELINES.md`, `JARVIS-CONTINUATION.md`, `JARVIS-OS-TRACKER.md`, and `JARVIS_ROADMAP.md`. Then continue with the single issue marked **ACTIVE NOW**.
