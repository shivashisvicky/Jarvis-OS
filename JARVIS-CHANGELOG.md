# J.A.R.V.I.S. OS Engineering Changelog

## 2026-08-28

### Session checkpoint

- Persistent continuation checkpoint added in `JARVIS-CONTINUATION.md`.
- Baseline tracking added in `JARVIS-BASELINES.md`.
- Regression ledger added in `JARVIS-REGRESSIONS.md`.
- Architecture guardrails added in `JARVIS-ARCHITECTURE.md`.
- Current work remains Ebook/Gutenberg stabilization.

### Recent Ebook work

- Added Beowulf live regression coverage.
- Added author entity regression coverage.
- Corrected author test semantics to accept `BOOK_AUTHOR` as a legitimate author entity while still rejecting generic Web/Search routing.
- Added/iterated Gutenberg network race and reader source fallback handling.
- Converted Ebook stability layer toward guard-only behaviour so it does not compete with the canonical Ebook authority.
- Current Ebook candidate is not a baseline until live CI passes.

### Workflow policy

Do not hand the user a new build for manual testing while the relevant live regression gate is red or has not run. The user should not be responsible for repeatedly retesting unrelated Jarvis subsystems.
