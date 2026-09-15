# Books Chain Regression Guard

TEST-only checkpoint note for the Books chain repair on 2026-09-15.

Known-good restored baseline: `af7aeec6d4aff3388b93d089f6f5602b153815d3`.

Observed issue: direct `Beowulf` search renders multiple Gutenberg results, but when a chained command runs, the first BOOK clause can resolve through `jarvisEntityAuthority.handle()`, which renders only the exact entity result. `jarvisEbookSearchAuthority.searchResolved()` intentionally does not hydrate sparse results while the chain runtime is active, so the chain context can remain at one result.

Repair contract: for a BOOKS first clause inside an active command chain, use the authoritative broad Books search so the shared BOOKS context contains the full result set before ordinal follow-up resolution. Non-chain single-book resolution remains unchanged.

PROD is not part of this repair.
