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

1. Beowulf list test failed its title-uniqueness assertion because the rendered list contained a duplicate title. The assertion reported expected 10 unique titles and received 9 unique titles.
2. Beowulf reader test could not find `[data-read]` because the active search authority rendered only `data-rel-read` while the compatibility/test contract expected both selectors.
3. Canonical Frankenstein reader test found the search text but no `[data-read]` button for the same selector-contract mismatch.
4. John Henry Newman Ebook test timed out waiting for the read handoff after the result list was rendered.
5. These failures occurred on the old `f8f9ba7...` deployment and are not evidence that unrelated domains were broken.

### Fresh validation after commit 7eb0980394dedda49a5a0b1b1481df50ea1ff628

The targeted search-authority fix was deployed in run `33526095035`.

- Beowulf result-list test: **PASS**. The duplicate-title failure was removed.
- Author-name generic-search test: **PASS**.
- Beowulf reader: **FAIL**, but now for a different and more precise reason: the test was looking for the obsolete `.jbe2-reader`, `#jbe2Page`, `#jbe2Count`, `#jbe2Section`, and `#jbe2Next` selectors.
- Frankenstein reader: same obsolete-reader-selector failure.
- John Henry Newman reader: same obsolete-reader-selector failure.
- Entity Intelligence: **PASS**.
- Home + News + Voice: **PASS**.
- In-Shell Web Search: **PASS**.
- Media Search: **PASS**.
- Gemini Intelligence: **PASS**.

This is important: the second red run exposed a **test drift**, not a new reader/product regression. The live reader is `jarvis-ebook-reader-v7.js`, which creates the canonical v11 surface: `.jbe11`, `#jbe11Page`, `#jbe11Counter`, `#jbe11Chapter`, and `#jbe11Next`. The E2E test was still asserting the legacy `.jbe2-*` contract even though the reader had already moved to v11. The test has now been updated in commit `17ab28bc2d530cf1bde752fc0b815b1bbaa06354` to assert the actual canonical reader contract.

### Current remediation rules

- One Ebook command owner.
- One canonical BookRecord/result list.
- One context source for ordinal follow-ups.
- No stale/default result may overwrite the current query.
- Search results expose both `data-read` and `data-rel-read` for compatibility with the existing reader/command contract.
- Search rendering removes duplicate normalized titles before publishing the canonical result list.
- Reader tests must track the canonical reader identity. Do not reintroduce `.jbe2-*` selectors when the active reader is v11.
- Reader opens the exact resolved BookRecord and must not silently rediscover another book.
- Reader title/content sanitization remains reader-scoped.
- Entity classification must be repaired in the Entity Authority, with Gutenberg evidence used where appropriate.
- Voice, Maps, YouTube, Search, News, Time and Command Center remain protected boundaries.
- Do not declare a baseline until the live gates for the changed behavior are green.

### Historical mistakes that must stay visible

- Default/stale Gutenberg lists have previously replaced a correct list after it briefly appeared.
- Full author names previously fell into generic Web Search.
- Adding overlapping Ebook interceptors/overlays repeatedly caused regressions and, in some revisions, removed voice responses.
- Manual testing was repeatedly requested against red or unverified builds. This is now explicitly prohibited.
- `open the second/third one` failures were caused by context being lost or the follow-up handler rediscovering the list instead of using the resolved BookRecord.
- Reader transport markup was previously allowed to leak into visible content.
- Regression tests were allowed to lag behind the canonical reader identity. This caused false red gates even though the product reader had moved from the legacy `jbe2` surface to the v11 `jbe11` surface. The test suite is now explicitly tied to the canonical reader contract.

## Regression policy

Never change a test only to make it green. If a test exposes a contract mismatch, determine whether the product or the test is wrong, document the decision, and preserve coverage for the user-visible behaviour. Test selectors must be derived from the current canonical component contract, not historical selectors.
