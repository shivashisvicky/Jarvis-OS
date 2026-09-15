# J.A.R.V.I.S. OS Regression Contract

**Date:** 2026-09-15
**Branch:** `test/jarvis-intelligence-next`
**Production branch:** `main` (do not modify for TEST work)

## Purpose

This document is a protection boundary for future agents. It records behavior that has been explicitly verified and must not be casually changed while fixing another issue.

## Non-negotiable rules

1. TEST first. Never modify `main` unless production promotion is explicitly requested.
2. Do not solve application behavior by changing deployment workflow logic.
3. Before changing a mature authority module, identify its current owner and inspect the current execution path.
4. Prefer one small surgical change over broad refactors or rollback.
5. After every browser-loaded JS/CSS change, update its `?v=` cache-bust in `index.html`.
6. After every push, verify the corresponding Actions run before asking for user testing.
7. If a regression appears, stop and identify the responsible layer before making another change.
8. Never use a known-good feature as a test fixture for an unrelated refactor.

## Verified Books contract

The Books surface is currently considered a protected working area.

### Direct search

`Beowulf` must produce multiple Gutenberg results when the network is available. The result set is authoritative for subsequent ordinal commands.

### Chained ordinal

The following command has been explicitly verified on iOS Safari:

`Beowulf and open the 6th one`

Expected flow:

```text
Beowulf
  -> broad Gutenberg result set
  -> BOOK context contains the result set
  -> ordinal 6 resolves from context
  -> reader opens Gutenberg book id 56613
```

Verified result #6:

`History of English Literature from "Beowulf" to Swinburne`

Gutenberg id: `56613`

The ordinal handoff must resolve by authoritative BOOK context/book ID. It must not require the sixth DOM card to exist before opening the reader.

### Books protection

Do not:

- replace broad Books search with exact-entity resolution;
- make the chain depend on the first result;
- add a background hydration race during an active command chain;
- make generic Context Engine state override fresh Books-owned results;
- refactor the reader while fixing search/chain behavior.

## Verified Vision contract

The Vision Lab faithful Enhance path is isolated from generative image editing.

- faithful Enhance uses the dedicated `/api/enhance` endpoint;
- it preserves source dimensions and framing;
- it does not invoke the generative Workers AI path;
- generative Edit/Generate remain on `/api/image`;
- iPhone Save has been user-verified.

Do not merge the faithful and generative paths merely to reduce file count.

## Verified Spatial contract

Known-good detailed desk behavior remains protected:

- create a 1200 mm wide × 600 mm deep × 750 mm high office desk;
- 30 mm tabletop;
- four metal legs;
- lower shelf;
- centered 27-inch monitor;
- follow-up: make desk 20% wider;
- follow-up: move monitor slightly left;
- follow-up: make legs black;
- follow-up: rotate monitor 15 degrees;
- follow-up: delete monitor.

Spatial Command Center Enter must submit through the same button path as ASK JARVIS and must not double-submit.

The selected-leg resize behavior must preserve the tabletop attachment when a leg is shortened.

Do not rebuild the Spatial renderer or semantic engine to fix an isolated geometry/selection defect.

## Current safety tooling

`scripts/jarvis-sanity-check.mjs` is a read-only TEST static checker. It checks for:

- missing local assets;
- browser-loaded JS/CSS without cache-busting;
- duplicate exact asset references;
- duplicated high-risk authority families.

Warnings are advisory. They are not permission to refactor a mature authority family.

## Recent CI lesson

A TEST-only sanity checker was accidentally invoked against `main`, causing a Pages workflow failure because the checker does not exist in PROD. The fix was to scope the sanity gate to TEST only. PROD application code was not changed.

This is a reminder that CI changes must respect the TEST/PROD separation just as runtime changes do.

## Explicitly deferred work

The following are **not** safe cleanup tasks merely because they look untidy:

- consolidating `jarvis-speech-recognition-release-v1.js` and `v2.js`;
- broad consolidation of the ebook authority patch family;
- deleting retired Engineering Bay Image Intelligence implementation code;
- replacing patch-heavy architecture with a single rewritten module;
- broad Context Engine ownership refactors;
- production promotion of TEST changes.

These require characterization tests and a separate, deliberate change window.

## Agent handoff rule

If the next agent cannot prove that a proposed change preserves the contracts above, it should leave the working behavior alone and document the proposed change instead.
