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

### Evidence / CI findings

- Beowulf search regression can pass in clean Chromium while reader-opening tests fail.
- Author entity classification can legitimately be `BOOK_AUTHOR`; do not weaken the product contract merely to force a green test. The important contract is that author resolution must not fall into generic Web/Search routing.
- A prior CI run showed production deployment green while only Gutenberg Ebook tests failed. This validates the desired isolation of the Books regression.
- A cancelled deployment caused a post-deploy gate to fail before tests ran. Do not interpret that as a product regression.

### Current hypothesis

The ebook surface accumulated overlapping authority/reader/stability/compatibility paths. Stale result races and inconsistent reader handoffs are more plausible than independent random Gutenberg failures.

### Current remediation direction

- One owner for Ebook command routing.
- One canonical Gutenberg search result model.
- Request IDs / stale-response rejection so old/default results cannot overwrite a newer search.
- One canonical reader handoff using the resolved BookRecord.
- Reader must not claim success until content and page count are initialized.
- Chapter/contents navigation must use structured document sections.
- Ebook stability code should be guard-only and must not rewrite buttons/IDs or compete with the Ebook authority.
- Voice lifecycle must be protected and always return to idle on success/failure.

## Regression policy

Never change a test only to make it green. If a test exposes a contract mismatch, determine whether the product or the test is wrong, document the decision, and preserve coverage for the user-visible behaviour.
