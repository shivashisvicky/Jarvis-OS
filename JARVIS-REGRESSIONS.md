# J.A.R.V.I.S. OS Regression Ledger

## 2026-08-28 Ebook regression

### Symptoms observed

- First Beowulf search after refresh can return no results while spoken response occurs.
- Repeated Beowulf search can eventually return the correct list.
- Default/stale Gutenberg lists have appeared briefly or remained instead of the requested results.
- `READ IN JARVIS` / `Read the first one` has intermittently failed.
- Reader has shown a blank white/error screen.
- Reader has shown `1 / …` without completing pagination.
- John Henry Newman can resolve to the ebook/author path but previously failed to open the book.
- `Time now` previously failed while `What time is it` worked; the latest reported test had `Time now` working.
- iOS voice has previously become stuck with the microphone orange and unable to return to idle.

### Latest manual verification

- **Beowulf:** correct result list returned and ebook opened successfully in the reader with spoken response.
- **Reader:** content now loads and pagination is present (`1 / 350` in the reported test).
- **John Henry Newman:** resolved/opened successfully in repeated tests, but initial open can take approximately **20–30 seconds**. This is now a performance/reliability concern rather than the previous total routing/open failure.
- **Remaining reader defect:** Gutenberg raw/metadata front matter is being rendered as visible book content, including `Title`, `URL Source`, `Published Time`, and `Markdown Content`. This should be normalized away before the actual reading text.
- **Current interpretation:** the core routing and reader-opening regression appears substantially improved. Do not declare the Ebook feature fully fixed yet because content normalization and Newman latency remain.

### Evidence / CI findings

- Beowulf search regression can pass in clean Chromium while reader-opening tests fail.
- Author entity classification can legitimately be `BOOK_AUTHOR`; do not weaken the product contract merely to force a green test. The important contract is that author resolution must not fall into generic Web/Search routing.
- A prior CI run showed production deployment green while only Gutenberg Ebook tests failed. This validates the desired isolation of the Books regression.
- A cancelled deployment caused a post-deploy gate to fail before tests ran. Do not interpret that as a product regression.

### Current hypothesis

The ebook surface accumulated overlapping authority/reader/stability/compatibility paths. Stale result races and inconsistent reader handoffs were more plausible than independent random Gutenberg failures. The latest test suggests those handoff problems are now much less severe, while source normalization remains incomplete.

### Current remediation direction

- One owner for Ebook command routing.
- One canonical Gutenberg search result model.
- Request IDs / stale-response rejection so old/default results cannot overwrite a newer search.
- One canonical reader handoff using the resolved BookRecord.
- Reader must not claim success until content and page count are initialized.
- Strip Gutenberg transport/metadata front matter from the reader before pagination/rendering.
- Preserve real book headings, chapters and structured contents rather than rendering transport metadata.
- Investigate Newman 20–30 second latency separately from routing correctness. Prefer faster source selection/caching without changing the public command contract.
- Ebook stability code should be guard-only and must not rewrite buttons/IDs or compete with the Ebook authority.
- Voice lifecycle must be protected and always return to idle on success/failure.

## Regression policy

Never change a test only to make it green. If a test exposes a contract mismatch, determine whether the product or the test is wrong, document the decision, and preserve coverage for the user-visible behaviour.
