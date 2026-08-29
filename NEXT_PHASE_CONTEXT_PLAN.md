# Next Phase Context Plan

**Updated:** 2026-08-29

## Baseline

Frozen golden baseline: `ede622c6e7f35dbd67f2007806122116d724dcb5`.

Ebook/Gutenberg is verified and protected. Do not modify it for unrelated work.

## Next phase

Shell / Intelligence, one issue at a time.

### Issue 1: numbered result references

Target commands:

- `open result 2`
- `open number 2`
- `open no. 2`

The current reference authority recognizes these forms but does not resolve the numeric index in its fallback resolver. Fix only that mismatch and add/extend deterministic coverage.

### After Issue 1 is green

Handle each as a separate issue:

1. ordinal references including `last`;
2. contextual location references (`here`, `there`, `nearby`);
3. context expiry/clearing;
4. explicit intent versus stale context;
5. action/result chaining;
6. entity continuity;
7. ambiguity resolution;
8. graceful clarification.

## Operating rule

**One issue → one fix → one push → one validation.**

Never bundle several of these into one deployment.
