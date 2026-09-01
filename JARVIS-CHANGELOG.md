# J.A.R.V.I.S. OS Engineering Changelog

## 2026-09-01

### Phase 2: Search Hub provider fidelity

- Added `jarvis-search-provider-fidelity-v1.js` as an isolated Search Hub guard.
- Wired the guard through `jarvis-module-loader.js`.
- Updated the Web feature asset version for the Phase 2 deployment.
- The guard keeps the user-selected provider authoritative in the Search Hub UI/status layer even when returned records carry an internal source label from another engine.
- **Validation status:** pushed, manual validation pending. This is not a new baseline yet.

### Product checkpoint

Latest development-cycle observations recorded for continuation:

- iOS and Android app opening is stable.
- Voice response lifecycle and iOS microphone release are stable after the latest verified fix.
- `What time is it` is a global utility route and has been tested with spoken + written output when voice is active.
- Maps destination routing is working; remaining Stop Voice/button positioning is a separate UI polish issue.
- YouTube/Media search and playback are working.
- Ebook search/reader behavior is working in manual tests and remains protected.
- Search Hub normal query routing is working for confirmed cases such as `cabs`.
- The previous unrelated-results case (`black or yellow`) established the requirement that the Search Hub receive the cleaned search query, not the command wrapper.

### Next-session validation

1. Validate Phase 2 provider fidelity with Brave and Bing.
2. If green, freeze/document the Phase 2 result.
3. Begin numbered result references as the next isolated intelligence issue.

## 2026-08-30

### Media ordinal context recovery

- Reported failure: after leaving a YouTube/Media result list, `Play the first one` returned the Command Center message that no current result list was available.
- Patched `jarvis-context-engine-v1.js` in commit `670ebb554efb086ef747df732456409637cef27b`.
- Context engine is now version `3.4.0`.
- Added recovery from the existing `jarvis-youtube:*` session cache when live Media context is unavailable.
- Added Media restoration, stored-query replay and exact YouTube-ID result matching before playback.
- Updated `index.html` cache/version references in commit `e1621b1d6462870b173cd740c137ae75ad5cd54d`.
- Updated session handoff/tracker in commits `7e16a213e9600ddad036a7c63495b1568070ca34` and `711b4babe910ea8943b6c2d52e010cbd65c1c51c`.
- **Validation status:** the current context plan should treat Media result continuity as a completed/stable capability only after the exact deployed flow is manually confirmed. Do not use Ebook or Voice changes as a workaround.

## 2026-08-29

### Golden baseline frozen

- Verified deployed Ebook/Gutenberg behavior and froze commit `ede622c6e7f35dbd67f2007806122116d724dcb5` as the current golden baseline.
- Beowulf search/listing works.
- John Henry Newman resolves to a readable Gutenberg edition.
- `READ IN JARVIS` opens the reader.
- Audio/MP3 records are excluded from ebook results.
- Gutenberg 404 records are excluded before reader rendering.
- Ebook search and reader handoff are stable.

### Roadmap reset

- Ebook/Gutenberg is now protected from unrelated changes.
- Shell / Intelligence is the next active 3.0 track.
- The intelligence goal is reusable context/result resolution rather than growing hardcoded command phrases.
- Historical/duplicate Ebook and Media experiments should not be treated as active work.
- Session handoff is documented in `JARVIS-CONTINUATION.md`, `JARVIS-OS-TRACKER.md`, `JARVIS_ROADMAP.md`, and `NEXT_PHASE_CONTEXT_PLAN.md`.

### Engineering policy

Every change follows **one issue → one fix → one push → one validation cycle**. Do not stack speculative fixes or unrelated cleanup. A new baseline requires green CI/live validation plus manual verification of the deployed behavior.

## 2026-08-28

### Session checkpoint

- Persistent continuation checkpoint added in `JARVIS-CONTINUATION.md`.
- Baseline tracking added in `JARVIS-BASELINES.md`.
- Regression ledger added in `JARVIS-REGRESSIONS.md`.
- Architecture guardrails added in `JARVIS-ARCHITECTURE.md`.
- Ebook/Gutenberg stabilization was the active track.
