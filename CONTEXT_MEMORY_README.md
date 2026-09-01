# JARVIS Context Memory v1

This isolated layer stores the current conversational entity/result context in `sessionStorage` and exposes it through `window.jarvisContextMemory` / `window.jarvisContextEngine`. It is intentionally additive and does not replace command routing.

## Contract

Context is a relationship, not a phrase list:

`domain + active result/entity context + reference expression + action`

The layer is intended to support natural follow-ups such as `open the second one`, `open result 2`, `play the first one` and `take me there` without hardcoding specific user/entity names.

## Boundaries

- Command Authority decides the primary intent.
- Domain Authority executes the action.
- Context Memory supplies relevant prior result/entity state.
- Voice Authority owns speech lifecycle.
- Search Hub receives a cleaned search query only after Search intent has been established.

## Current roadmap

1. Search/provider contract validation.
2. Numbered result references.
3. Ordinal references.
4. Contextual location references.
5. Context expiry and explicit-intent precedence.
6. Action/result chaining.
7. Entity continuity.
8. Ambiguity and clarification.

## Reliability rules

- Context must be domain-aware and freshness-bounded.
- Stable result identity should be preferred over DOM position.
- A failed recognition attempt must not poison subsequent commands.
- Global intents such as time must outrank stale domain context.
- Each roadmap item is validated independently before the next is implemented.
