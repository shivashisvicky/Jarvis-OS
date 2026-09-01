# JARVIS Context & Entity Memory Phase

**Updated:** 2026-09-01

## Baseline

The context/entity layer is part of the stable Shell / Intelligence foundation. Ebook/Gutenberg remains protected at the verified baseline.

Previously verified map context behavior includes:

- `Whats the nearest one?`
- `Which one is the nearest?`
- `Take me there`

These resolve against the current map/entity context rather than treating `there` as a literal search term.

## Existing memory layer

Commit lineage includes the Context Memory layer that:

- Mirrors the live context engine without replacing its existing routing authority.
- Persists relevant MAPS, SEARCH and BOOKS context in `sessionStorage`.
- Uses a freshness window rather than indefinite memory.
- Canonicalizes rich provider/entity labels at the memory boundary.
- Recognizes generic references such as `there`, `here`, `that place`, `that location`, `it`, `that one`, `this one`, and ordinal references.

The design goal is reusable context, not a collection of user-specific hardcoded phrases.

## Current active phase

### Search Hub provider fidelity

Commit: `782c51c0bb00f2410139a85132adfcf6adb59870`.

A narrow guard was added to keep the user-selected Search Hub provider authoritative in the UI/status layer even if returned records contain an internal source label from another engine.

**Status: pushed / validation pending.**

## Context architecture target

A conversational follow-up should resolve using:

`domain + active result/entity context + reference expression + action`

This should support natural variations such as:

- `open result 2`
- `open number 2`
- `open no. 2`
- `open the second one`
- `play the first one`
- `take me there`

The resolver should use stable result identity where available and should not depend on exact wording or DOM position.

## Next milestones

1. Validate Search Hub provider fidelity.
2. Implement/validate numbered result references.
3. Extend ordinal references: first, second, third, last.
4. Add contextual location references: here, there, nearby.
5. Add context expiry and clearing.
6. Enforce explicit-intent precedence over stale context.
7. Add action/result chaining.
8. Strengthen entity continuity across surfaces.
9. Add ambiguity resolution and graceful clarification.

## Product requirements

- Voice and text must converge on one command authority.
- Voice recognition failures must return the microphone to idle.
- Search Hub receives a cleaned query, not the command wrapper.
- Global utility intents such as time outrank stale domain context.
- Context should persist long enough for natural follow-ups but expire deliberately.
- No specific book/person/location names should be hardcoded into the generic resolver.

## Validation discipline

Each milestone is an independent issue:

**one issue → one fix → one push → one validation → freeze if verified.**

Do not combine context, voice, maps, books or UI changes in the same patch.
