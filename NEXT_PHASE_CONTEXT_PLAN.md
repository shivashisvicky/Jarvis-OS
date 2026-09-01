# Next Phase Context Plan

**Updated:** 2026-09-01

## Baseline

Frozen golden baseline: `ede622c6e7f35dbd67f2007806122116d724dcb5`.

Ebook/Gutenberg is verified and protected. Do not modify it for unrelated work.

## Current checkpoint

The active Shell / Intelligence work is **Phase 2: Search Hub provider fidelity**.

### Phase 2 commit

`782c51c0bb00f2410139a85132adfcf6adb59870`

A dedicated provider-fidelity guard is now loaded by the Web feature. Its job is narrow: the provider selected by the user remains the authoritative provider identity in Search Hub UI/status rendering, regardless of an internal source label attached to returned records.

**Status: PATCHED, VALIDATION PENDING.**

## Required validation

1. Select Brave and search `cabs`.
2. Confirm results appear and the UI says Brave consistently.
3. Switch to Bing without refreshing.
4. Search `cabs` again.
5. Confirm Bing is shown consistently and no Brave label remains.
6. Confirm result links/content are not changed by the guard.

If this fails, inspect the Search Hub provider/rendering boundary only. Do not modify Voice, Maps, Media, Ebook or Command Authority as a workaround.

## Context architecture goal

The context engine should resolve a follow-up as a structured operation rather than a phrase lookup:

`current domain + current result set/entity + reference expression + requested action`

Examples:

- `open result 2`
- `open number 2`
- `open no. 2`
- `open the second one`
- `take me there`
- `play the first one`

The same model should work across Search, Maps, Media and Books without embedding specific names or exact sentence variants.

## Next issue after Phase 2

### Numbered result references

Target commands:

- `open result 2`
- `open result 3`
- `open number 2`
- `open no. 2`

Validation must cover at least Search and one other result-bearing domain before promoting the change.

## Remaining sequence

Handle each as a separate issue:

1. Numbered result references.
2. Ordinal references including `first`, `second`, `third`, `last`.
3. Contextual location references (`here`, `there`, `nearby`).
4. Context expiry/clearing.
5. Explicit intent versus stale context.
6. Action/result chaining.
7. Entity continuity.
8. Ambiguity resolution.
9. Graceful clarification.

## Product-furnishing requirements

- Voice and typed input must enter the same command authority.
- A recognition failure must not poison the next command.
- Every response must complete its voice lifecycle and release the microphone.
- Search Hub must receive a clean query rather than a natural-language command wrapper.
- Result references must use stable result identity where available, not fragile DOM position.
- Global intents such as time must outrank stale domain context.
- The command field should clear after each submitted command.
- UI controls must remain usable on touch devices and must not overlap unrelated navigation.

## Operating rule

**One issue → one fix → one push → one validation.**

Never bundle several context contracts into one deployment. Never promote a change to baseline until the deployed behavior is manually verified.
