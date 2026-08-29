# J.A.R.V.I.S. OS Baselines

## Golden baseline: 2026-08-29

**Current verified baseline:** `ede622c6e7f35dbd67f2007806122116d724dcb5`

This is the frozen, manually verified Ebook/Gutenberg baseline as of 2026-08-29.

Verified in the deployed Pages build:

- Beowulf search returns readable Gutenberg books.
- `READ IN JARVIS` opens the reader.
- Gutenberg 404 records are filtered before they become reader targets.
- Audio/MP3 Gutenberg records are not shown as ebook results.
- John Henry Newman can resolve to a readable Gutenberg edition.
- Ebook search/listing and reader handoff are functioning again.

### Freeze rule

Do **not** modify the Gutenberg/Ebook path while working on an unrelated subsystem unless a reproducible Ebook regression is demonstrated. If an Ebook change is required, branch from this SHA and make one issue / one fix.

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

## Historical reference

`f6b43298ff823dc0420ba6cbdce9274afba7baab` remains the historical Phase 1 known-good reference. It is a diagnostic comparison point, **not** the current development baseline.

## Baseline policy

A commit becomes a new baseline only after the relevant CI/live regression suite is green **and** the deployed behavior has been manually verified. A successful build alone is not enough.

## Engineering cadence

JARVIS development follows a strict **one issue → one fix → one push → one validation cycle**. Do not stack speculative fixes. If the fix does not solve the reported issue, stop, inspect the exact failure, and make the next smallest targeted change.
