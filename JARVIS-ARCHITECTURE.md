# J.A.R.V.I.S. OS Architecture Guardrails

## 1. Deployment architecture

Jarvis uses separate environments so experiments cannot contaminate production.

- `prod/2026-09-06-stable` = protected PROD branch.
- `test/jarvis-intelligence-next` = experimental TEST branch.
- `main` = GitHub Pages production source and must not be used as an experiment branch.
- `.github/workflows/deploy-dual-pages-test.yml` builds PROD and TEST separately and publishes TEST beneath `/test/`.
- A TEST deployment must never be promoted to PROD merely because Actions is green.

The protected whole-tree recovery anchor is `6010a558da5cb14894a46880ed7c2c6c35e2699f`.

## 2. Command lifecycle

`User input -> Command Authority -> Entity/Intent resolution -> Domain owner -> UI action + CommandResult -> Voice Authority`

Only one layer should own each responsibility. Domain modules must not independently re-route unrelated commands.

## 3. Ebook ownership

- Command Authority: decides whether a command is an Ebook request.
- Entity Authority: identifies title/author evidence.
- Ebook Authority: owns Gutenberg discovery and canonical BookRecord creation.
- Ebook UI: renders the result list from the current request.
- Context Engine: stores the current result set for references such as `read the first one`.
- Context Reference Authority: resolves the ordinal against the current valid result set.
- Canonical Reader: opens and renders the resolved BookRecord.
- Network transport: obtains text for the already-resolved Gutenberg ID.
- Voice Authority: owns spoken response lifecycle.

## 4. Hard boundaries

An Ebook fix must not modify the implementation of Voice, Time Now, Maps, YouTube, News or Command Center unless CI demonstrates a real cross-domain contract regression and the change is explicitly documented.

The Ebook stability layer is **guard-only**. It must not rewrite search buttons, reader IDs, DOM attributes, or create competing search/read handlers.

There must be one canonical Reader-open owner. Network warming may prepare a source but must not become a second Reader router.

## 5. State invariants

### Search

Every search has a request identity. Only the latest request may commit results. Stale/default results must never overwrite the current query.

### Reader

The Reader receives the exact resolved BookRecord/Gutenberg ID from the current result. It must not silently rediscover a different book from a title query. It is considered loaded only after readable content and page count are available.

### Context

`read the first one` resolves against the latest valid Ebook result set. Returning home must not destroy the context needed for a follow-up reference unless the context has explicitly expired.

### Single-dispatch invariant

One user command may produce one authoritative domain action. A prewarm, context event and Reader-open operation must be correlated to the same command/BookRecord. A second listener must not independently open the same Reader.

### Voice

Every command must terminate its voice lifecycle. Success, error, timeout and cancellation paths must release recognition/microphone state and return the UI to idle.

### Time

Time commands are global utility intents and must outrank stale Ebook context. `time now` and `what time is it` should converge on the same deterministic route.

## 6. Professional intermittent-failure handling

Do not solve intermittent failures by adding more retries or interceptors first. Instrument the boundary.

For each Ebook command, trace:

`commandId -> query -> context turn -> result-set ID -> resolved index -> Gutenberg ID -> source acquisition -> Reader-open -> Reader-ready`

Every trace event must identify its owner and whether it is the first or duplicate invocation. The diagnosis must distinguish:

- stale search response
- missing/expired context
- incorrect ordinal index
- entity misclassification
- duplicate Reader-open dispatch
- Reader module not yet loaded
- Gutenberg source/network latency

Once the first failing boundary is identified, fix that owner. A bounded network retry is acceptable only inside source acquisition and only when it cannot trigger a duplicate UI action.

## 7. Recovery strategy

When a subsystem becomes unstable:

1. Stop adding interceptors.
2. Preserve the failing commit and intermediate experimental commits with branches/tags.
3. Compare the failing tree with the last user-verified tree.
4. Identify the first experimental owner that diverged.
5. Remove/revert only that experimental layer when possible.
6. Preserve unrelated fixes and cache-busters.
7. Run CI.
8. Deploy TEST.
9. Perform the smallest user-visible smoke test.
10. Promote only after behavioural verification.

A green build is evidence of build correctness, not proof of product correctness.
