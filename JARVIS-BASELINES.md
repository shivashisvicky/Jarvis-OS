# J.A.R.V.I.S. OS Baselines

## Known-good reference

`f6b43298ff823dc0420ba6cbdce9274afba7baab`

This is the historical Phase 1 known-good reference. Do not casually reset to it. Use it as the comparison point when diagnosing regressions.

## Current rule

A commit becomes the new baseline only after the relevant CI/live regression suite is green. A deployment that merely builds successfully is **not** a baseline.

## Current status (2026-08-28)

- Current development is focused on Gutenberg/Ebook reliability.
- Protected behaviour: Voice, Time Now, Maps, YouTube, News, Command Center and unrelated command routes should not be changed as part of an Ebook fix.
- Latest pushed Ebook candidate: `3c4ff4918265304e67b640b9e3528a52c0d31537`.
- This candidate is **not yet a proven baseline** until Ebook CI is green.
