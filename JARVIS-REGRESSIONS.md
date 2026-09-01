# J.A.R.V.I.S. OS Regression Ledger

## 2026-09-01 controlled Ebook/context regression

### User-visible working state

- Beowulf worked in the restored stable build.
- John Henry Newman worked in the restored stable build.
- `open the third one` worked for the John Henry Newman result set after the resolved BookRecord was passed through the context-followup path.
- Reader still had a separate Gutenberg transport/metadata rendering defect, where escaped or literal markup such as `$b`, `$i`, and related source-envelope fragments appeared in the book title/content area.
- Voice must remain untouched outside the Ebook command scope. Previous sessions proved that broad routing changes can remove spoken responses even when text routing still works.

### Actions run 33514203915

Run `33514203915` checked commit `f8f9ba7dd16c57913776f13d79065bbe0191cc80` and failed in exactly two product areas: Gutenberg Ebook and Entity Intelligence. The Pages build/deployment itself succeeded, and the Home/News/Voice, Gemini, in-shell Web Search and Media gates passed.

#### Ebook failures

1. Beowulf list test expected 10 unique titles but received 9. On another retry it received 0 cards. This indicates live catalogue/result timing or stale/default-result replacement, not a TypeScript/build failure.
2. Beowulf reader test could not find `[data-read]` after the result state changed.
3. Canonical Frankenstein reader test found the search text but no `[data-read]` button.
4. John Henry Newman Ebook test timed out waiting for the entity classification and then could not complete the reader handoff.
5. These failures occurred on the old `f8f9ba7...` deployment. They must not be treated as proof that the later `efadc12...` reader-title sanitization commit is bad or good. A fresh live gate is required.

#### Entity failures

- Bare Beowulf entity resolution passed.
- John Henry Newman resolved as `UNKNOWN` instead of the required `BOOK_AUTHOR`.
- Charles Dickens resolved as `BOOK` instead of `PERSON|BOOK_AUTHOR`.
- The correct fix is at the entity-resolution owner. Do not add more book-specific hardcoding or change Voice/Maps/YouTube/Search routing to mask this.

### Historical mistakes that must stay visible

- Default/stale Gutenberg lists have previously replaced a correct list after it briefly appeared.
- Full author names previously fell into generic Web Search.
- Adding overlapping Ebook interceptors/overlays repeatedly caused regressions and, in some revisions, removed voice responses.
- Manual testing was repeatedly requested against red or unverified builds. This is now explicitly prohibited.
- `open the second/third one` failures were caused by context being lost or the follow-up handler rediscovering the list instead of using the resolved BookRecord.
- Reader transport markup was previously allowed to leak into visible content.

### Current remediation rules

- One Ebook command owner.
- One canonical BookRecord/result list.
- One context source for ordinal follow-ups.
- No stale/default result may overwrite the current query.
- Reader opens the exact resolved BookRecord and must not silently rediscover another book.
- Reader title/content sanitization remains reader-scoped.
- Entity classification must be repaired in the Entity Authority, with Gutenberg evidence used where appropriate.
- Voice, Maps, YouTube, Search, News, Time and Command Center remain protected boundaries.
- Do not declare a baseline until the live gates for the changed behavior are green.

## Regression policy

Never change a test only to make it green. If a test exposes a contract mismatch, determine whether the product or the test is wrong, document the decision, and preserve coverage for the user-visible behaviour.
