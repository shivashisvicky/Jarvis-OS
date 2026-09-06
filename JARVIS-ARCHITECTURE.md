# J.A.R.V.I.S. OS Architecture Guardrails

## Command lifecycle

`User input -> Command Authority -> Entity/Intent resolution -> Domain owner -> UI action + CommandResult -> Voice Authority`

Only one layer should own each responsibility. Domain modules must not independently re-route unrelated commands.

## Cross-surface ordinal ownership

Books, Maps and YouTube/Video all support follow-up references such as `open the third one`. These are separate domains sharing one conversational reference mechanism.

**Invariant:** all three must work simultaneously. A fix for one surface must not disable another.

The current reference authority uses **domain-first ownership**:

1. If live domain is `MAPS`, map result ordinals own the command.
2. If live domain is `MEDIA`, `VIDEOS`, `VIDEO` or `YOUTUBE`, media result ordinals own the command.
3. Otherwise resolve the current valid Books result context.
4. A stale selected UI surface is only a fallback. It must never outrank an explicit live domain.

This rule exists because previous iterations caused a cycle of regressions: media ordinals were incorrectly routed to Books, then media fixes caused Books ordinals to disappear. The current architecture explicitly prevents that ownership inversion.

## Ebook ownership

- Command Authority: decides whether a command is an Ebook request.
- Entity Authority: identifies title/author evidence.
- Ebook Authority: owns Gutenberg discovery and canonical BookRecord creation.
- Ebook UI: renders the result list from the current request.
- Canonical Reader: opens and renders the resolved BookRecord.
- Context Engine: stores the current result set for references such as `read the first one`.
- Voice Authority: owns spoken response lifecycle.

## Reader presentation boundary

Reader typography is presentation-only. The current reader v11 is the functional reader owner. Typography changes belong in `jarvis-ebook-reader-polish-v1.css` and must not modify reader fetching, pagination, chapter detection, result IDs, context, or command routing.

The current reader body uses a fitted sans-serif/iOS-friendly presentation and the reader subject/title uses a bold weight. This is deliberately separate from the book's functional content pipeline.

## Hard boundaries

An Ebook fix must not modify the implementation of Voice, Time Now, Maps, YouTube, News or Command Center unless CI demonstrates a real cross-domain contract regression and the change is explicitly documented.

The Ebook stability layer is intended to be **guard-only**. It must not rewrite search buttons, reader IDs, DOM attributes, or create competing search/read handlers.

Ordinal/reference fixes must not use broad global interceptors that capture commands from unrelated active domains.

## State invariants

### Search

Every search has a request identity. Only the latest request may commit results. Stale/default results must never overwrite the current query.

### Reader

The reader receives the resolved book identity from the current result. It must not silently rediscover a different book. The reader is considered loaded only after readable content and page count are available.

### Context

`read the first one`, `open the second one`, and `show the third one` resolve against the latest valid result set belonging to the active domain. Returning home must not destroy the context needed for a follow-up reference unless the context has explicitly expired.

### Voice

Every command must terminate its voice lifecycle. Success, error, timeout and cancellation paths must release recognition/microphone state and return the UI to idle. A stuck orange microphone is a release failure, not an acceptable state.

### Time

Time commands are global utility intents and must outrank stale Ebook context. `time now` and `what time is it` should converge on the same deterministic route.

## Recovery strategy

When a subsystem becomes unstable, stop adding interceptors. Compare against the known-good baseline, identify the first owner that diverged, and repair that owner. Prefer removing duplicate execution paths over adding another bridge.

For a regression in ordinal context, inspect the live context domain and the reference authority before changing individual surface modules.

## Baseline discipline

The current protected functional checkpoint is documented in `JARVIS-BASELINES.md` and `JARVIS-CONTINUATION.md`. Do not treat an old passing child module as independently safe if it depends on later context, reader, or entity work.
