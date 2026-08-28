# J.A.R.V.I.S. OS Architecture Guardrails

## Command lifecycle

`User input -> Command Authority -> Entity/Intent resolution -> Domain owner -> UI action + CommandResult -> Voice Authority`

Only one layer should own each responsibility. Domain modules must not independently re-route unrelated commands.

## Ebook ownership

- Command Authority: decides whether a command is an Ebook request.
- Entity Authority: identifies title/author evidence.
- Ebook Authority: owns Gutenberg discovery and canonical BookRecord creation.
- Ebook UI: renders the result list from the current request.
- Canonical Reader: opens and renders the resolved BookRecord.
- Context Engine: stores the current result set for references such as `read the first one`.
- Voice Authority: owns spoken response lifecycle.

## Hard boundaries

An Ebook fix must not modify the implementation of Voice, Time Now, Maps, YouTube, News or Command Center unless CI demonstrates a real cross-domain contract regression and the change is explicitly documented.

The Ebook stability layer is intended to be **guard-only**. It must not rewrite search buttons, reader IDs, DOM attributes, or create competing search/read handlers.

## State invariants

### Search

Every search has a request identity. Only the latest request may commit results. Stale/default results must never overwrite the current query.

### Reader

The reader receives the resolved book identity from the current result. It must not silently rediscover a different book. The reader is considered loaded only after readable content and page count are available.

### Context

`read the first one` resolves against the latest valid Ebook result set. Returning home must not destroy the context needed for a follow-up reference unless the context has explicitly expired.

### Voice

Every command must terminate its voice lifecycle. Success, error, timeout and cancellation paths must release recognition/microphone state and return the UI to idle. A stuck orange microphone is a release failure, not an acceptable state.

### Time

Time commands are global utility intents and must outrank stale Ebook context. `time now` and `what time is it` should converge on the same deterministic route.

## Recovery strategy

When a subsystem becomes unstable, stop adding interceptors. Compare against the known-good baseline, identify the first owner that diverged, and repair that owner. Prefer removing duplicate execution paths over adding another bridge.
