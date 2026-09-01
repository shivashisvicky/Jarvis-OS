# Context & Entity Intelligence Phase Status

**Last updated:** 2026-09-01

## Current status

The Context and Entity intelligence work has moved from scaffolding into the active Shell / Intelligence track. Core context persistence and generic entity resolution are stable. The current work is tightening the boundary between conversational intent, domain ownership and Search Hub query execution.

### Stable / completed

- Context Reference Authority is deployed.
- Book result context can persist across surfaces.
- Generic entity resolution distinguishes people/books without hardcoded names.
- Gutenberg author evidence is routed to the ebook authority where appropriate.
- Maps restaurant/entity follow-ups such as `Whats the nearest one?` and `Take me there` have been stabilized.
- Ebook/Gutenberg remains protected at the verified baseline.
- Voice and text now converge on the same response lifecycle; the previous iOS voice activation/mic-stuck problem has been repaired in the latest verified cycle.

## Current Phase 2: Search Hub provider fidelity

Commit: `782c51c0bb00f2410139a85132adfcf6adb59870`.

The Phase 2 guard ensures that the provider selected in Search Hub remains authoritative in the user-facing status/result labels even when backend result records contain another internal source label.

### Validation contract

- Brave selection → Brave-labelled results/status.
- Bing selection → Bing-labelled results/status.
- Switching provider without reload must not leave stale labels.
- Search result content must remain unchanged by the guard.
- Normal search queries such as `cabs` must continue working.

**Status: PUSHED / VALIDATION PENDING.**

## Next context contract

After Phase 2 is verified, the next isolated issue is numbered result references:

- `open result 2`
- `open result 3`
- `open number 2`
- `open no. 2`

Then extend the same reference model to:

1. `first`, `second`, `third`, `last`.
2. `here`, `there`, `nearby`.
3. Context clearing and expiry.
4. Explicit intent versus stale context.
5. Action/result chaining.
6. Entity continuity across surfaces.
7. Ambiguity resolution.
8. Graceful clarification.

The objective is not to accumulate hardcoded phrases. The objective is a reusable reference-resolution contract: **domain + context + entity/result identity + requested action**.

## Engineering rule

**One issue → one fix → one push → one validation.**

Do not combine context, entity, ebook, voice, maps or visual changes in the same fix. If a protected subsystem regresses, stop and isolate it as a new issue.
