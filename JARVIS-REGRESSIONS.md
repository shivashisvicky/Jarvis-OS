# J.A.R.V.I.S. OS Regression Ledger

## 2026-09-01 Search / Voice / Context checkpoint

### Current observations

- iOS and Android app opening is stable in the latest verified cycle.
- iOS voice response lifecycle is restored; the previous orange/stuck microphone issue was fixed and later testing did not reproduce it.
- `What time is it` can return both written and spoken output when the voice lifecycle is active.
- A historical failure where voice required a typed command to activate speech is now treated as a protected regression contract: voice input must initialize the same response authority without a prior text command.
- Maps destination routing is functioning; remaining Stop Voice/button placement is a UI issue and must not be used to alter routing.
- Media/YouTube search and playback are functioning.
- Ebook search and reader loading are functioning in recent manual tests; Ebook remains protected.
- Search Hub returned unrelated results for commands such as `search the internet for black or yellow` when the command wrapper was forwarded as the search query. The query-normalization work corrected normal cases such as `cabs`.
- Phase 2 now adds a provider-fidelity guard so the selected Search Hub provider remains authoritative in the user-facing UI.

### Active regression contract

**Search Hub provider fidelity**

Commit: `782c51c0bb00f2410139a85132adfcf6adb59870`.

Required checks:

1. Brave selection stays Brave in status/result labels.
2. Bing selection stays Bing in status/result labels.
3. Switching provider does not leave stale labels.
4. Result content and links remain unchanged by the guard.
5. Normal search routing remains intact.

Status: **pushed / validation pending**.

## Historical 2026-08-28 Ebook regression

### Symptoms observed

- First Beowulf search after refresh can return no results while spoken response occurs.
- Repeated Beowulf search can eventually return the correct list.
- Default/stale Gutenberg lists have appeared briefly or remained instead of the requested results.
- `READ IN JARVIS` / `Read the first one` has intermittently failed.
- Reader has shown a blank white/error screen.
- Reader has shown `1 / …` without completing pagination.
- John Henry Newman can resolve to the ebook/author path but previously failed to open the book.
- `Time now` previously failed while `What time is it` worked; later testing had `Time now` working.
- iOS voice has previously become stuck with the microphone orange and unable to return to idle.

### Latest interpretation

The core Ebook routing/reader regression was substantially improved through isolated Ebook fixes and cache/deployment guards. Do not reopen the Ebook investigation unless a new reproducible Ebook failure appears.

### Current Ebook protection

- One owner for Ebook command routing.
- One canonical Gutenberg search result model.
- Request IDs / stale-response rejection so old/default results cannot overwrite a newer search.
- One canonical reader handoff using the resolved BookRecord.
- Reader must not claim success until content and page count are initialized.
- Strip Gutenberg transport/metadata front matter from the reader before pagination/rendering.
- Preserve real book headings, chapters and structured contents rather than rendering transport metadata.
- Investigate Newman latency separately from routing correctness.
- Ebook stability code remains guard-only and must not compete with Ebook authority.
- Voice lifecycle must be protected and always return to idle on success/failure.

## Regression policy

Never change a test only to make it green. If a test exposes a contract mismatch, determine whether the product or the test is wrong, document the decision, and preserve coverage for the user-visible behaviour.

## Protected rule

A regression in Voice, Time, Maps, Media, News, Ebook or Command Center must be fixed as its own issue. Do not use an unrelated context/search/UI change as a workaround.
