# J.A.R.V.I.S. OS Engineering Tracker

**Last updated:** 2026-09-01

## Golden baseline

`ede622c6e7f35dbd67f2007806122116d724dcb5`

Verified deployed baseline. Ebook/Gutenberg remains frozen unless a new reproducible regression is reported.

## Current working commits

- `782c51c0bb00f2410139a85132adfcf6adb59870` — Phase 2 Search Hub provider-fidelity guard wired into the module loader.
- `1ddc591d5a15bb018435ef420468977106d93603` — baseline documentation refresh.
- `a45a0ca2f28d0a85dd0b167ff785b40576762444` — continuation checkpoint refresh.

The Phase 2 code is **not** promoted to the golden baseline until CI/deployment and manual validation are green.

## Status

| Track | Status | Notes |
|---|---|---|
| 3.0 foundation | DONE | Runtime/architecture guardrails established |
| Command authority cleanup | DONE | Compatibility and routing hardened |
| Entity intelligence | DONE / STABLE | Generic person/book resolution, no hardcoded names |
| Ebook/Gutenberg | DONE / FROZEN | Search, readable filtering, MP3 exclusion, 404 exclusion, reader handoff protected |
| Voice/iOS | STABLE | Spoken response lifecycle and mic release restored in latest verified cycle |
| Time Now | STABLE | `What time is it` tested with written + spoken response when voice is active |
| Maps | STABLE | Destination routing fixed; small UI/Stop Voice polish issue remains separate |
| News | STABLE | Previous hardening complete |
| Media | STABLE / CONTEXT READY | YouTube search/playback works; result-reference continuity remains intelligence work |
| Search Hub | ACTIVE PHASE 2 | Provider fidelity guard just wired; manual validation pending |
| Shell / Intelligence | ACTIVE | Context/result-reference layer |
| API Lab | PLANNED | After Shell / Intelligence |
| SFTP / Files | PLANNED | After API Lab |
| Terminal | PLANNED | After SFTP / Files |
| Proactive intelligence | PLANNED | Later Phase C |

## Phase 2: Search Hub provider fidelity

**Goal:** provider selection must remain authoritative from user selection through request, response and UI rendering.

**Patch:** `782c51c0bb00f2410139a85132adfcf6adb59870`.

**Implementation:** `jarvis-search-provider-fidelity-v1.js` is loaded by `jarvis-module-loader.js`; the Web feature now uses the Phase 2 asset version.

**Validation:**

1. Brave + `cabs`.
2. Bing + `cabs`.
3. Switch providers without a reload and repeat.
4. Confirm result/status labels never inherit the previous provider.
5. Confirm search result content itself is not altered by the guard.

## Next intelligence queue

After Phase 2 validation, proceed one issue at a time:

1. Numbered result references: `open result 2`, `open result 3`, `open number 2`, `open no. 2`.
2. Ordinal references: first, second, third, last.
3. Contextual locations: here, there, nearby.
4. Context clearing and expiry.
5. Explicit intent versus stale context.
6. Action/result chaining.
7. Entity continuity.
8. Ambiguity resolution.
9. Graceful clarification.

## Product-furnishing goals

These are deliberately separate from the next routing fix:

- One shared context model across Command, Search, Maps, Media and Books.
- Voice and text must enter the same command authority and produce the same `CommandResult` contract.
- Natural language variations must not require hardcoded exact phrases.
- Search Hub should receive a clean search query, not the command wrapper.
- Result references should resolve by domain + result identity, not by DOM position alone.
- Failed speech recognition must release the mic and leave the app ready for the next command.
- UI polish must not be allowed to change intelligence behavior.

## Development rule

**One issue → one fix → one push → one validation.**

For each issue: reproduce it, identify the owning authority, compare to the best baseline, change only that authority/test surface, push once, wait for CI/deployment, manually validate, then freeze if verified.

Do not combine unrelated fixes. Do not use speculative cache busts as a substitute for a root-cause fix.

## Protected subsystems

During Shell / Intelligence work, do not modify Ebook/Gutenberg, Voice/iOS, Time Now, Maps, News, Media, Command Center, Games, Notes/Calculator or core navigation unless a separate reproducible regression is demonstrated.

## Handoff

Before starting a new session, read:

- `JARVIS-BASELINES.md`
- `JARVIS-CONTINUATION.md`
- `JARVIS-OS-TRACKER.md`
- `JARVIS_ROADMAP.md`
- `NEXT_PHASE_CONTEXT_PLAN.md`

Then inspect CI/deployment for the current Phase 2 Search Hub change and validate it before starting the next numbered-reference issue.
