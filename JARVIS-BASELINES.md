# J.A.R.V.I.S. OS Baselines

## Golden baseline: 2026-08-29

**Current verified baseline:** `ede622c6e7f35dbd67f2007806122116d724dcb5`

This remains the frozen, manually verified Ebook/Gutenberg baseline as of 2026-08-29.

Verified in the deployed Pages build:

- Beowulf search returns readable Gutenberg books.
- `READ IN JARVIS` opens the reader.
- Gutenberg 404 records are filtered before they become reader targets.
- Audio/MP3 Gutenberg records are not shown as ebook results.
- John Henry Newman can resolve to a readable Gutenberg edition.
- Ebook search/listing and reader handoff are functioning again.

### Freeze rule

Do **not** modify the Gutenberg/Ebook path while working on an unrelated subsystem unless a reproducible Ebook regression is demonstrated. If an Ebook change is required, branch from this SHA and make one issue / one fix.

## Current working state: 2026-09-01

The golden baseline is intentionally **not** being moved yet. The deployed product has since received additional Ebook hardening and Shell/Intelligence work, but a new baseline requires the exact deployed build plus manual regression verification.

Latest Shell/Intelligence work:

- `782c51c0bb00f2410139a85132adfcf6adb59870` — Phase 2 Search Hub provider-fidelity guard wired into the module loader.
- `jarvis-search-provider-fidelity-v1.js` — keeps the selected Search Hub provider authoritative in the user-facing result/status labels.
- `jarvis-module-loader.js` — loads the provider guard with the Web feature and uses a Phase 2 asset version.

**Phase 2 status:** pushed, validation pending. Do not call it a baseline until CI/deployment and manual Search Hub validation are green.

### Known verified product behavior from the current development cycle

- iOS and Android app shell opening is stable.
- Voice response lifecycle was restored and the microphone orange/stuck state was fixed in the latest verified cycle.
- Maps destination routing is functioning; the remaining UI polish issue is separate from routing.
- YouTube/Media search and playback are functioning; result-reference continuity remains an intelligence track.
- Ebook search/reader behavior has been repeatedly tested as working, but Ebook remains protected.
- Search Hub query routing was fixed for normal searches such as `cabs`; provider-fidelity work is the current isolated Phase 2 task.

## Protected behavior

The following must remain unchanged during unrelated fixes:

- Command Center and ordinary web search
- Voice/iOS command flow
- Time Now
- Maps and destination routing
- News
- YouTube / Media playback
- Games
- Notes / Calculator
- Core shell navigation
- Ebook/Gutenberg

## Historical reference

`f6b43298ff823dc0420ba6cbdce9274afba7baab` remains the historical Phase 1 known-good reference. It is a diagnostic comparison point, **not** the current development baseline.

## Baseline policy

A commit becomes a new baseline only after the relevant CI/live regression suite is green **and** the deployed behavior has been manually verified. A successful build alone is not enough.

## Engineering cadence

JARVIS development follows a strict **one issue → one fix → one push → one validation cycle**. Do not stack speculative fixes. If the fix does not solve the reported issue, stop, inspect the exact failure, and make the next smallest targeted change.

## Next milestones

1. Validate Phase 2 Search Hub provider fidelity without touching protected domains.
2. Validate numbered result references: `open result 2`, `open result 3`, `open number 2`, `open no. 2`.
3. Extend ordinal references: first, second, third, last.
4. Add contextual location references: here, there, nearby.
5. Add context expiry/clearing and explicit-intent precedence.
6. Add action/result chaining and entity continuity.
7. Add ambiguity handling and graceful clarification.
8. Only then move into API Lab, SFTP/Files and Terminal tracks.

## Session handoff files

Read these before continuing work:

1. `JARVIS-BASELINES.md`
2. `JARVIS-CONTINUATION.md`
3. `JARVIS-OS-TRACKER.md`
4. `JARVIS_ROADMAP.md`
