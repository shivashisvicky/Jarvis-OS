# J.A.R.V.I.S. OS Continuation Checkpoint

**Last updated:** 2026-09-01

## Current engineering state

Jarvis is in a controlled Ebook/Gutenberg stabilization phase. The last verified user-facing build had Beowulf working, John Henry Newman working, and `open the third one` working through preserved result context. The remaining reader defect was malformed Gutenberg transport/metadata markup leaking into visible titles/content.

### Recent commits

- `efadc12ec24f01617b5a41dabd6a73d8cfe989f2` - `fix: sanitize malformed Gutenberg book titles in reader`.
- `f8f9ba7dd16c57913776f13d79065bbe0191cc80` - `fix: preserve resolved book context for ordinal followups`.
- `4889f763ad8234724fe8414e43a2a4dd6baf386e` - restored Ebook search reconciliation authority.

## Important Actions evidence

Run `33514203915` was for `f8f9ba7...` and was **red**.

- Pages build/deploy: passed.
- Home + News + Voice: passed.
- Gemini: passed.
- In-Shell Web Search: passed.
- Media Search: passed.
- Gutenberg Ebooks: failed all 5 tests.
- Entity Intelligence: failed Newman author resolution while bare Beowulf passed.

The Ebook failures were specific: nondeterministic result counts (9 unique then 0 on a retry), missing `[data-read]` controls after result replacement, and Newman entity timeout. Entity failures were `UNKNOWN` for John Henry Newman and `BOOK` for Charles Dickens where a person/author classification was required.

This proves the run did **not** break every subsystem. It proves the changed Ebook/context/entity contracts were not green in that deployment.

## What is already known to work

- Voice lifecycle has been fragile historically. Do not touch global voice code for a Books fix.
- Maps and YouTube must remain isolated from Ebook changes.
- Search Hub must not inherit book queries merely because entity resolution is uncertain.
- `open the third one` must use the resolved context item/BookRecord instead of rediscovering the current list.
- Default/stale Gutenberg results must never replace a newer requested result list.

## Ebook implementation guardrails

- One command owner.
- One canonical Ebook search/result owner.
- One resolved BookRecord passed into reader/follow-up actions.
- Stale/default result replacement must be rejected.
- Reader is loaded only when readable content and pagination are initialized.
- Reader sanitization must remain reader-scoped.
- Entity classification belongs to Entity Authority, not ad-hoc book keyword lists.

## Current next goals

1. Run a fresh live regression against the exact current head `efadc12...`.
2. Verify Beowulf result list stability and `READ IN JARVIS`.
3. Verify John Henry Newman author classification and opening.
4. Verify `open the third one` again after deployment.
5. Verify reader title/content contains no `$b`, `$i`, raw HTML, or transport-envelope metadata.
6. Verify voice response remains present for Ebook commands.
7. Verify Maps, YouTube, Search, News, Time and Command Center remain green.

## Process rule

Never hand over a build for manual testing while the relevant live gate is red or unverified. After every push: inspect the exact failing job, compare with the last known-good revision, make the smallest owner-local fix, push, wait for Actions, and record the result here. Do not stack speculative fixes.
