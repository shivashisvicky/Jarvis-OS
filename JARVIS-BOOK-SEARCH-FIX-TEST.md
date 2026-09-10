# JARVIS Book Search Fix Test

Baseline: `6204acac920429d407dbbb44aae432874555b26e`

Observed regression after restoring the checkpoint:
- A direct book/entity request such as `identify Pride and Prejudice` no longer reliably produces the fast 1-2 second result list.
- The Files/Ebooks surface can open blindly before a confirmed book result exists.
- The UI can intermittently show no list.
- The visible Standard Ebooks area may show an empty query (`""`), indicating that the ebook surface was opened before the actual query/result handoff completed.

Forensic finding in `jarvis-ebook-book-fast-resolver-v1.js` v1.6.1:
- `run()` currently starts `openSurface()` before `fetchFast(q)` completes.
- If the remote lookup fails or produces no relevant rows, `run()` returns false only after the Files/Ebooks surface has already been opened.
- This explains the blind/empty ebook surface behavior.

Planned narrow TEST fix:
1. Validate/fetch the requested book first.
2. Confirm at least one relevant Gutenberg row.
3. Only then open Files/Ebooks.
4. Preserve the existing fast path, incremental hydration, context publication, Books/Reader behavior, Maps, YouTube, and command chain.
5. Do not modify the context engine or shared context authority.
6. Do not modify `main` or deployment workflow.

Exact target behavior:
`identify Pride and Prejudice` -> identify/resolve -> open Ebook surface only after valid result evidence -> render the result list quickly.

TEST procedure:
- Make one runtime change only.
- Deploy automatically from TEST.
- Wait for Actions/build/deploy verification.
- Test direct book identification first.
- Then test book ordinal/context behavior separately.
- If regression appears, revert the single fix commit to the 6204 baseline.
