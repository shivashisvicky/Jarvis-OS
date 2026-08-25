# JARVIS Context & Entity Memory Phase

## Baseline
- Maps restaurant search and follow-up context are working in the stable baseline.
- `Whats the nearest one`, `Which one is the nearest`, and similar conversational map follow-ups were recently stabilized.
- `Take me there` now resolves the selected restaurant name instead of searching for the literal word `there`.
- Rich provider labels such as `Oishi Fresh | Fastfood Restaurant | Bhubaneswar` are treated as one logical entity by the new memory layer.
- Two OSM/provider matches for Oishi Fresh are accepted as provider behavior unless the user reports a correctness problem.

## Phase pushed
Commit: `5c245e3d18fdb773562b649a67d6addac8e38d3b`

### Runtime changes
- `jarvis-context-memory-v1.js` is now loaded directly after `jarvis-context-engine-v1.js`.
- The memory layer mirrors the live context engine without replacing its existing routing authority.
- Context is stored in `sessionStorage` with a 30-minute freshness window.
- Rich entity labels are canonicalized at the memory boundary by taking the logical name before `|` while preserving the live engine result unchanged.
- Generic references are recognized by the memory layer for future routing use: `there`, `here`, `that place`, `that location`, `it`, `that one`, `this one`, and ordinal result references such as `first`, `second`, and `third`.
- The layer tracks MAPS, SEARCH, and BOOKS domains and can retain selected entities/results across a page reload in the same browser session.
- Existing command/map/ebook authority was deliberately not rewritten in this phase.

### Regression guard
- Added `tests/unit/context-memory-v1.test.ts` covering rich map entity canonicalization and BOOKS context persistence.
- Main CI `Jarvis OS CI` completed successfully for the phase commit.

## Next validation
Primary user-facing tests should be intentionally small:
1. `Show me restaurants in Jagannath nagar`
2. `Whats the nearest one?`
3. `Take me there`
4. `Find Beowulf`
5. After the book result is visible, use a natural follow-up such as `Open that one` where supported.

The goal is to verify that context is treated as an entity/domain relationship rather than a collection of hard-coded phrases.
