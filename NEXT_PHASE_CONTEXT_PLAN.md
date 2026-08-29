# Next Phase Context Plan

**Updated:** 2026-08-30

## Baseline

Frozen golden baseline: `ede622c6e7f35dbd67f2007806122116d724dcb5`.

Ebook/Gutenberg is verified and protected. Do not modify it for unrelated work.

## Current checkpoint

The immediate context-reference issue is now **Media ordinal result recovery across navigation**.

Reported flow:

- Search YouTube and obtain multiple results.
- Return to Command Center.
- Say `Play the first one`.
- Previous behavior said there was no current result list.

Patch commit: `670ebb554efb086ef747df732456409637cef27b`.
Deployment/cache update: `e1621b1d6462870b173cd740c137ae75ad5cd54d`.

The context engine is now `3.4.0`. It can recover the latest valid `jarvis-youtube:*` result cache, restore Media, replay the stored query and select the exact result by YouTube ID.

**Status: PATCHED, VALIDATION PENDING.**

Do not promote this to the golden baseline until deployed/manual verification succeeds.

## Required validation

1. Search YouTube for a query with multiple results.
2. Leave Media for Command Center.
3. Say `Play the first one`.
4. Confirm the exact first result plays.
5. Repeat `Play the second one`.
6. Repeat `Play result 2`.

If this fails, inspect the Media authority/context handoff only. Do not change Ebook, Voice/iOS, Maps, News or unrelated routing as a workaround.

## Next issue after validation

### Numbered result references

Target commands:

- `open result 2`
- `open number 2`
- `open no. 2`
- `open result 3`

The existing reference authority recognizes these forms but their numeric resolution still needs isolated validation/fix.

### Remaining sequence

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

## Operating rule

**One issue → one fix → one push → one validation.**

Never bundle several of these into one deployment.
