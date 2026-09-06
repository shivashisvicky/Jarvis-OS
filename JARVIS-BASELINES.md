# J.A.R.V.I.S. OS Baselines

## Current verified working baseline

**Baseline date:** 2026-09-06

**Stable commit:** `6010a558da5cb14894a46880ed7c2c6c35e2699f`

**Protected baseline branch:** `baseline/2026-09-06-stable-reader`

This is the current user-verified stable state. The user explicitly tested the deployed reader and confirmed that the functional context/ordinal behaviour and reader typography work together. Treat this state as the rollback target for any later experimental change.

### Verified user-visible behaviour

The following three ordinal surfaces must work simultaneously and must never be fixed by breaking another:

- **Books:** search a book, then `open/read/show the third one` resolves the third current book result.
- **Maps:** search a multi-result map query such as restaurants in a city, then `open/show the third one` resolves the third current map result.
- **YouTube/Video:** search videos, then `open/show/play the third one` resolves the third current media result.

The reader is also verified working with:

- JARVIS Reader v11.
- Live Gutenberg text loading.
- Page navigation and page counter.
- Chapter/section selector.
- Previous/Next navigation.
- Close and Gutenberg handoff controls.
- Reader typography presentation with a fitted sans-serif treatment and bold reader subject/title.

## Baseline protection rule

**Do not modify the ordinal/context stack, Ebook routing, Maps authority, YouTube authority, or reader behaviour casually from this baseline.** Any future change must preserve all three ordinal surfaces together.

A cosmetic reader change must remain isolated to reader presentation. It must not modify context, routing, search, result IDs, pagination, chapter detection, or domain ownership.

For any functional regression after a new commit, first compare against `6010a558da5cb14894a46880ed7c2c6c35e2699f` and/or branch `baseline/2026-09-06-stable-reader` before attempting another patch.

## Current main-stack activation at baseline

`index.html` activates the domain-first context-reference authority with cache-bust `20260906-context-reference-v31`, the Ebook stack including Ebook search/resolved handoff/reader v11, and the map authority v27. The live media module persists current YouTube result context for cross-surface ordinal references.

Important loaded reader assets:

- `jarvis-ebook-reader-v7.js` as reader **v11**.
- `jarvis-ebook-reader-polish-v1.css` for reader presentation.

## Recent changes that produced this baseline

- `004e913a03f0831c718051c098ad9b5f8b69553c` - domain-first ordinal ownership across Books, Maps and Video.
- `868be71f04f45ff884f6f0ef888fcea206d2c5aa` - activated/cache-busted context-reference authority v31.
- `1297e50a2ad9a8146a8d1c68ac4c0b9f3be41360` - isolated reader typography and bold reader title/subject presentation.
- `6010a558da5cb14894a46880ed7c2c6c35e2699f` - cache-busted reader typography CSS.

The last two commits are presentation-only. They do not change command/context behaviour.

## CI qualification

At the time this baseline was recorded, GitHub Actions had not yet exposed a workflow run for `6010a558da5cb14894a46880ed7c2c6c35e2699f`. Therefore this baseline is **user-verified functional**, not yet CI-certified by a newly observed run.

If CI later reports a regression attributable to the typography/docs change, revert to the previous functional code state rather than changing functional modules to accommodate the cosmetic change.

## Historical known-good reference

`f6b43298ff823dc0420ba6cbdce9274afba7baab`

This is an older Phase 1 known-good reference. Do not casually reset to it. It predates later reader/context/ordinal work and is useful only for comparison during forensic debugging.

## Baseline discipline

A baseline should represent a complete working state, not a collection of individually good commits. Never cherry-pick an old parent or child module in isolation when it has synchronized dependencies in later commits. Treat Ebook/search/reader/context/ordinal work as a dependency graph.

For every future push, record:

1. Commit SHA.
2. Exact files changed.
3. User-visible behaviour targeted.
4. Existing behaviour explicitly protected.
5. CI result.
6. Manual result when relevant.
7. Rollback SHA if the change fails.
