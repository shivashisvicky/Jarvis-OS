# J.A.R.V.I.S. OS Engineering Changelog

## 2026-09-01

### Controlled Ebook/context checkpoint

- Restored and preserved the known-good Ebook command stack before attempting the ordinal follow-up improvement.
- `John Henry Newman` was verified working again in the stable build after earlier routing regressions.
- `Beowulf` was verified working again in the stable build.
- `open the third one` for the John Henry Newman result set was verified working after resolved BookRecord context was passed into the Ebook command authority.
- The ordinal-followup change was intentionally isolated to `jarvis-ebook-command-authority-v1.js`; it does not rewrite Maps, YouTube, Search, News, Time, or the global Voice Authority.
- A later reader-only sanitization commit, `efadc12ec24f01617b5a41dabd6a73d8cfe989f2`, removes malformed Gutenberg transport markup from visible book titles/metadata. This is intentionally UI/reader scoped.

### Actions run 33514203915: what actually failed

The red run was for commit `f8f9ba7dd16c57913776f13d79065bbe0191cc80`, not the later reader-sanitization commit. Build and production Pages deployment succeeded. Home/News/Voice, Gemini, in-shell Web Search and Media jobs succeeded. Only the Gutenberg Ebook and Entity Intelligence gates failed.

- Ebook gate failed all five tests.
- Beowulf list test saw **9 unique titles** and also had a retry with **0 cards**, showing live-result nondeterminism/stale/default catalogue interference rather than a compile failure.
- Beowulf reader tests could not find `[data-read]` after the result state changed.
- Frankenstein canonical-reader test likewise found the result text but no `[data-read]` control.
- John Henry Newman entity gate returned `UNKNOWN` instead of `BOOK_AUTHOR`.
- Author-name regression returned `BOOK` for Charles Dickens, which is a contract mismatch in the current entity test path and must be fixed at the entity owner, not by weakening unrelated routing.

### Engineering rule reinforced

A green build/deploy is not enough. Do not call a revision a baseline until the relevant live gates are green. When a live gate is red, inspect the exact owner and compare against the last verified working revision before making another change.

## 2026-08-28

### Session checkpoint

- Persistent continuation checkpoint added in `JARVIS-CONTINUATION.md`.
- Baseline tracking added in `JARVIS-BASELINES.md`.
- Regression ledger added in `JARVIS-REGRESSIONS.md`.
- Architecture guardrails added in `JARVIS-ARCHITECTURE.md`.
