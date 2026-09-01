# J.A.R.V.I.S. OS Architecture Guardrails

## Command lifecycle

`User input -> Command Authority -> Entity/Intent resolution -> Domain owner -> UI action + CommandResult -> Context Authority -> Voice Authority`

Only one layer should own each responsibility. Domain modules must not independently re-route unrelated commands.

## Intelligence boundary

JARVIS should route by **intent + entities/slots + domain**, not by an ever-growing dictionary of exact sentences. Natural-language variants should converge on the same command contract.

A follow-up reference should resolve as:

`active domain + current result/entity context + reference expression + requested action`

Examples:

- `open result 2`
- `open number 2`
- `open the second one`
- `take me there`
- `play the first one`

An unresolved conversational command must not silently become a browser search merely because an exact phrase was not recognized.

## Search ownership

Search Hub owns browser/web retrieval only. Command Authority decides whether the user actually requested a web search. If the request is conversational, navigational, calculational, media, maps, books or another supported intent, Search Hub must not become a generic fallback by default.

The Search Hub request contract should receive the cleaned query, not command-wrapper text such as `search the internet for ...`.

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

A result reference resolves against the latest valid result set in the relevant domain. Returning home must not destroy the context needed for a follow-up reference unless the context has explicitly expired.

Result identity should be stable where available. DOM position is a rendering detail, not the canonical identity.

### Voice

Every command must terminate its voice lifecycle. Success, error, timeout and cancellation paths must release recognition/microphone state and return the UI to idle. A stuck orange microphone is a release failure, not an acceptable state.

Voice and text must converge on the same command authority. No typed command should be required to initialize voice response behavior.

### Time

Time commands are global utility intents and must outrank stale domain context. `time now` and `what time is it` should converge on the same deterministic route.

### UI

The command input should clear after each submitted command. Touch controls must have a reliable hit target and must not overlap navigation or result content.

## Recovery strategy

When a subsystem becomes unstable, stop adding interceptors. Compare against the known-good baseline, identify the first owner that diverged, and repair that owner. Prefer removing duplicate execution paths over adding another bridge.

## Phase discipline

The current Shell / Intelligence track is developed one contract at a time:

1. Search/provider contract.
2. Numbered result references.
3. Ordinal references.
4. Contextual location references.
5. Context expiry and explicit-intent precedence.
6. Action/result chaining.
7. Entity continuity.
8. Ambiguity and clarification.

Each contract gets its own implementation, CI coverage and manual validation before the next one is changed.
