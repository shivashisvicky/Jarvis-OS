# J.A.R.V.I.S. OS Engineering Changelog

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
- The next single issue is numbered result references: `open result 2`, `open number 2`, `open no. 2`.
- Historical/duplicate Ebook and Media experiments should not be treated as active work.

### Engineering policy

Every change follows **one issue → one fix → one push → one validation cycle**. Do not stack speculative fixes or unrelated cleanup. A new baseline requires green CI/live validation plus manual verification of the deployed behavior.

## 2026-08-28

### Session checkpoint

- Persistent continuation checkpoint added in `JARVIS-CONTINUATION.md`.
- Baseline tracking added in `JARVIS-BASELINES.md`.
- Regression ledger added in `JARVIS-REGRESSIONS.md`.
- Architecture guardrails added in `JARVIS-ARCHITECTURE.md`.
- Ebook/Gutenberg stabilization was the active track.

### Recent Ebook work

- Added Beowulf live regression coverage.
- Added author entity regression coverage.
- Corrected author test semantics to accept `BOOK_AUTHOR` as a legitimate author entity while still rejecting generic Web/Search routing.
- Added/iterated Gutenberg network race and reader source fallback handling.
- Converted Ebook stability layer toward guard-only behaviour so it does not compete with the canonical Ebook authority.
