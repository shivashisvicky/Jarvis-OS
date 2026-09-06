# J.A.R.V.I.S. OS Regression Ledger

## 2026-09-06: Books / Maps / YouTube ordinal regression cycle

### Symptoms observed

During recent context-reference work, the same command pattern, `open the third one`, behaved inconsistently across surfaces:

- YouTube/video ordinals could fall through to Books and produce a stale-book response.
- A later media-context fix restored Maps/Video but caused Books ordinals to stop resolving.
- The root problem was not that one surface lacked ordinal support. It was competing/stale context ownership in a shared reference authority.

### Resolution

The reference authority was changed to **domain-first ordinal ownership** in:

`004e913a03f0831c718051c098ad9b5f8b69553c`

The index then activated the new authority with cache-bust:

`868be71f04f45ff884f6f0ef888fcea206d2c5aa`

The resulting deployed state was manually verified by the user with all three surfaces working:

- Books -> third result.
- Maps -> third result.
- YouTube/Video -> third result.

This state is preserved as:

`6010a558da5cb14894a46880ed7c2c6c35e2699f`

and branch:

`baseline/2026-09-06-stable-reader`

### Critical lesson

Do not solve cross-surface ordinal problems by making one surface globally block another. The active domain must own the ordinal. Selected UI state can be stale and therefore must not outrank live domain context.

## 2026-09-06: Reader typography change

### Scope

After the functional baseline was manually verified, a deliberately isolated presentation change was made:

- `1297e50a2ad9a8146a8d1c68ac4c0b9f3be41360` - reader typography and bold reader title/subject.
- `6010a558da5cb14894a46880ed7c2c6c35e2699f` - reader CSS cache-bust.

The user manually verified that the reader remained functional and visually consistent. The reader body has the new fitted sans-serif treatment and the reader subject/header is bold. No reader engine, routing, context, pagination or chapter code was changed.

### Rollback rule

If any functional regression is observed after a later change, return to the protected baseline branch/state rather than stacking more patches on top of the regression.

## Historical 2026-08-28 Ebook regression

### Symptoms observed

- First Beowulf search after refresh could return no results while spoken response occurred.
- Repeated Beowulf search could eventually return the correct list.
- Default/stale Gutenberg lists appeared briefly or remained instead of the requested results.
- `READ IN JARVIS` / `Read the first one` intermittently failed.
- Reader showed a blank white/error screen or `1 / …` without completing pagination.
- John Henry Newman could resolve to the ebook/author path but previously failed to open the book.
- `Time now` previously failed while `What time is it` worked.
- iOS voice previously became stuck with the microphone orange and unable to return to idle.

### Historical lesson

The Ebook surface accumulated overlapping authority/reader/stability/compatibility paths. Stale result races and inconsistent reader handoffs were more plausible than independent random Gutenberg failures. Do not reintroduce duplicate search/read handlers to solve a regression.

### Important historical Ebook findings

- Earlier Ebook search authority V20 introduced an asynchronous second Gutenberg search after entity resolution, creating a race in entity -> Books -> reader handoff.
- The canonical resolved result should render immediately when it is already available.
- Entity author evidence may legitimately classify as `BOOK_AUTHOR`; do not weaken that contract merely to satisfy a test.
- The current canonical reader is v11. Do not resurrect older reader implementations.
- Reader stability code should remain guard-only.

## Regression policy

Never change a test only to make it green. If a test exposes a contract mismatch, determine whether the product or the test is wrong, document the decision, and preserve coverage for the user-visible behaviour.

Never declare a new baseline from a build that has only compiled. Baseline qualification requires relevant CI/live evidence. A user-verified state may be recorded explicitly as user-verified when CI has not yet produced a run.

For every future functional push, record the commit SHA, targeted symptom, protected behaviour, CI result, and rollback target.
