# J.A.R.V.I.S. OS Engineering Changelog

## 2026-09-06

### Stable baseline established

- User-verified stable checkpoint: `6010a558da5cb14894a46880ed7c2c6c35e2699f`.
- Protected rollback branch: `baseline/2026-09-06-stable-reader`.
- All three ordinal surfaces were manually verified together: **Books + Maps + YouTube/Video**.
- `open the third one` now uses domain-first ownership so stale selected UI state cannot steal an ordinal from the active domain.
- Reader v11 remains the canonical reader.
- Reader typography was changed in an isolated presentation layer to a fitted sans-serif/iOS-friendly treatment, with the reader subject/title in bold.
- No reader engine, context engine, search authority, map authority or YouTube authority was changed for the typography work.

### Important commits

- `f6b2cd265436984a6170c7654acdc1dcd3e98a05` - restore cross-surface map/media ordinal ownership.
- `265ff6f6ffd494018a4812ae6bc76002a441cd82` - persist live YouTube result context.
- `8551b37fadee9b659cb23d34bb331e12039d2726` - cache-bust live media context fix.
- `004e913a03f0831c718051c098ad9b5f8b69553c` - domain-first ordinal ownership across Books, Maps and Video.
- `868be71f04f45ff884f6f0ef888fcea206d2c5aa` - activate/cache-bust context-reference authority v31.
- `1297e50a2ad9a8146a8d1c68ac4c0b9f3be41360` - isolated reader typography and bold reader title/subject presentation.
- `6010a558da5cb14894a46880ed7c2c6c35e2699f` - cache-bust reader typography CSS.

### Baseline qualification note

At the time of recording, GitHub Actions had not exposed a workflow run for `6010a558da5cb14894a46880ed7c2c6c35e2699f`. Therefore the checkpoint is recorded as **user-verified functional**, not falsely labeled CI-certified.

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
