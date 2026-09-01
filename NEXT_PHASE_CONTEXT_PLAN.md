# Next Phase: Context & Entity Memory v1

## Goal
Make JARVIS retain structured conversational context across short command chains without changing stable domain routers.

## Confirmed target behavior

- `show me restaurants in Jagannath Nagar` -> remember domain/location/results.
- `open the third one` -> resolve against the remembered result set and open that exact entity.
- `Find Beowulf` -> remember a BOOK entity and its canonical BookRecord list.
- `Open the third one` after a book search -> use the preserved resolved BookRecord, not a fresh search.

## Current Ebook context result

The ordinal path now accepts the resolved context item directly in `jarvis-ebook-command-authority-v1.js`. This was the narrow change that made the user-confirmed `open the third one` work for John Henry Newman.

## Guardrails

- Additive context layer only.
- Do not rewrite stable Maps/Search/Media routers.
- Do not route through Voice as a side effect of context resolution.
- Do not use hardcoded book-title branches to compensate for missing entity context.
- The context object must preserve `domain`, `query`, `results`, selected/resolved item, canonical title, author and book ID where available.
- Follow-up handlers must consume the resolved item when supplied rather than re-searching.
