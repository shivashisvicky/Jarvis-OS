# J.A.R.V.I.S. OS TEST Handoff

_Last updated: 2026-09-10_

## Purpose

This file is the continuity note for future ChatGPT agents working on the J.A.R.V.I.S. OS TEST branch. Read this before changing code. The project is a live, browser-deployed personal assistant where regressions are expensive because multiple command/context authorities interact.

## Repository and deployment

- GitHub repository: https://github.com/shivashisvicky/Jarvis-OS
- Stable branch: `main`
- Experimental branch: `test/jarvis-intelligence-next`
- TEST URL: https://shivashisvicky.github.io/Jarvis-OS/test/
- Production URL: https://shivashisvicky.github.io/Jarvis-OS/
- TEST is automatically deployed by GitHub Actions after pushes to the TEST branch.
- Workflow: `.github/workflows/deploy-dual-pages-test.yml`
- The workflow builds PROD from `main` and TEST from `test/jarvis-intelligence-next`, then publishes both. Do NOT modify the workflow to solve application bugs.
- `main` is the protected stable baseline for this work. Do not push application fixes to `main`.

## Working method

1. Inspect the current TEST code and recent commits before changing anything.
2. Make the smallest possible surgical change.
3. Push only to `test/jarvis-intelligence-next`.
4. Wait for the automatic Actions deployment to finish successfully.
5. Verify the TEST URL before asking the user to test.
6. Test the exact failing command first.
7. Do not broad-rollback unless there is hard evidence that the current architecture is unrecoverable.
8. Do not rewrite working Books, YouTube, Maps, or context authorities while fixing an isolated chain bug.
9. Do not solve application logic by changing the deployment pipeline.
10. Keep trace/debug instrumentation when it helps isolate command routing.

## Stable architecture / known-good behavior

The current system has several separate authorities. They intentionally overlap only at controlled handoff points.

### Context engine

- `jarvis-context-engine-v1.js`
- Known-good baseline version is 3.3.0 from stable baseline commit `f026f45822826df5efc08387902470cd0be99988`.
- Do not modify casually.

### Shared context reference authority

- `jarvis-context-reference-authority-v1.js`
- Current branch contains surface-owner logic.
- It must NOT read/use a persistent global Maps flag as a generic fallback. A previous experiment with shared `__JARVIS_LAST_CONTEXT_SURFACE__` caused Maps commands to stop responding.

### Generic ordinal extension

- `jarvis-context-ordinal-extension-v1.js`
- Current working version: v1.6.
- It routes ordinals using surface ownership/immediate command route.
- Books + YouTube + Maps ordinal behavior was verified working before chain work.

### Dedicated Maps ordinal authority

- `jarvis-map-ordinal-authority-v1.js`
- Current working version loaded by TEST index: `20260910-map-ordinal-owner-v1-7`.
- It listens to `jarvis:map-context`, stores the actual Maps result list, and intercepts ordinals while Maps owns the surface.
- It can click `[data-jarvis-map-v27="N"]` result cards or directly pin a stored result.
- This authority was added because generic context reference fallback incorrectly sent Maps ordinals to Books.
- Do not remove or bypass this authority casually.

### Maps absolute authority

- `jarvis-map-absolute-authority-v25.js`
- Current implementation is labeled MAP AUTHORITY V27.
- It supports category searches and arbitrary-city geocoding using Photon plus the JARVIS places worker.
- It owns Maps surface via `__JARVIS_CONTEXT_SURFACE_OWNER__` and publishes Maps context.
- Rendered category result buttons use `data-jarvis-map-v27="index"`.
- IMPORTANT: the current exported object at the bottom is only:
  `window.jarvisMapAuthority={getContext:...,nearest:...}`
  It does NOT currently export `open` or `select` even though internal `open()` exists. Therefore any chain code that checks `jarvisMapAuthority.open` will fall through unless that export is added in a separate, carefully tested patch.

### Command authority

- `jarvis-command-authority-v2.js`, current version 12.0.0.
- It classifies explicit POI commands such as `show me restaurants in Delhi` as MAP_POI.
- It does NOT reliably classify a bare phrase like `restaurants in Delhi` as MAP_POI. Therefore the chain parser has its own `bareMapPoi()` fallback.

### Final routing

- `jarvis-command-final-routing-v3.js`
- Current code handles MAP_POI through `jarvis:map-intent` and the Maps UI.
- It is not the preferred first-clause path for a bare Maps POI chain because command authority may classify that bare phrase as conversation/intelligence.

### YouTube / Books

- YouTube surface ownership and ordinal behavior were already fixed and verified.
- Books reader/search/context behavior was also made stable and snappy before the current chain experiment.
- Do not regress them while repairing Maps chaining.

## Chain feature goals

The command chain feature should support natural multi-action commands while preserving each surface's authority.

Examples:

- `Show me restaurants in Jagannath Nagar and open the third one`
- `Show me restaurants in Delhi and open the fifth one`
- `search cats on YouTube and play the sixth one`
- `show me restaurants in Delhi, then open the fifth one`

Joining keywords intentionally supported:

- `and` must remain supported because it was the original working joining keyword.
- `then` must be added.
- comma forms should work, including `, then`.

The chain must NOT send the entire sentence to the first surface authority. It must split into clauses and execute them sequentially.

## Chain history and regressions

### Before chain work

Maps, Books, and YouTube ordinal context were working independently.

### Chain v2.3.0

Commit: `f3f108a70edc814f0dd0b901a85237d7f6e8b219`

Changes:
- preserved `and`
- added `then` and comma/`, then`
- broadened ordinal parsing
- added deferred media query handling
- did not modify context authorities

Test:
- `Show me restaurants in Jagannath Nagar and open the third one` worked.
- However it took roughly 10-20 seconds before the third result was selected.

### Chain v2.3.2

Commit: `19fa94c741f50dbdcffb7de8520fd543ef9b8f7a`

Attempted latency fix by making Maps freshness use `updatedAt` rather than generic context turn advancement.

This exposed a larger chain handoff problem.

### Chain v2.3.3 / v2.3.4 state

A narrow patch attempted to:

- route the first MAP_POI clause directly to Maps authority
- resolve a Maps ordinal against the actual current Maps result list and click the exact indexed card

However, the first implementation checked `window.jarvisMapAuthority.open`, while the Maps authority did not export `open`.

Current TEST source fetched on 2026-09-10 shows chain source version `2.3.4`, with `mapQueryMatches()` and direct Maps handoff logic. The Maps authority still does not export `open` or `select`.

## Current user-reported failure

Exact voice command tested:

`Showing restaurants in delhi and open the 5th one`

User screenshots show:

1. J.A.R.V.I.S. displays the spoken/status text as `Showing restaurants in delhi and open the 5th one.`
2. The Maps search field still visibly contains the full chain text, truncated by the UI.
3. The result list is Bhubaneswar restaurants, not Delhi.
4. Six results are shown, including:
   - Res palm restaurant
   - Red palm restaurant
   - Chancellor Restaurant
   - Oishi Fresh | Fastfood Restaurant | Bhubaneswar
   - Hare Krishna veg restaurant
   - Treat Restaurant
5. The map pin is on `Red palm restaurant`, which is result #2, although the command requested #5.

This means two things are wrong in this test:

- The first clause did not cleanly become an isolated Delhi Maps search.
- The second clause did not select the fifth Maps result. It selected #2, consistent with a competing Maps ordinal handler receiving the command/context before the chain's intended exact-card selection.

## Important interpretation of the spoken/status text

`Showing restaurants in delhi and open the 5th one` is NOT the desired final resolved response for the whole chain.

The first Maps action may legitimately produce a status such as `Showing restaurants in Delhi.` The `and open the fifth one` portion is the second clause and should be executed only AFTER the Delhi result list is fresh.

The UI command input may still visually retain the original full chain text. That alone is not proof of the second clause being resolved. The decisive evidence is the actual result set and selected map pin.

## Critical cache-busting issue to check first

The TEST `index.html` currently references:

`jarvis-command-chain-v1.js?v=20260910-command-chain-youtube-handoff-v1`

while the source file has progressed to chain version 2.3.4.

This query string was not updated with the chain patch. Safari/iOS can therefore continue using a cached older copy of the chain script even though GitHub contains newer source.

Before changing chain logic again, update ONLY the script cache-buster in TEST `index.html` to a new unique version matching the current chain patch, for example:

`./jarvis-command-chain-v1.js?v=20260910-command-chain-v2-3-4`

Push that cache-buster change to TEST, wait for Actions, then repeat the exact Delhi test. Do not modify other script versions or pipeline configuration in the same commit.

## Likely next engineering steps

### Step 1: force fresh chain script

Update only the chain script query parameter in TEST `index.html`.

Deploy and test:

`Show me restaurants in Delhi and open the fifth one`

Expected:
- Delhi results
- #5 selected
- pin on #5
- no Bhubaneswar contamination
- no 10-20 second wait

### Step 2: if Delhi still becomes Bhubaneswar

Inspect chain trace and first-clause handoff. The current `dispatchFirst()` attempts `jarvisMapAuthority.open()`, but the current Maps authority does not export that method. Either:

- add a narrowly scoped `open` export to Maps authority, or
- use an existing Maps-owned event/entry point in a way that preserves the exact clause and does not send the full chain.

Do not modify generic context authorities for this.

### Step 3: if Delhi is correct but #5 still becomes #2

The dedicated Maps ordinal authority and chain follow-up may both be intercepting the second clause.

The chain must have one authoritative path for a Maps ordinal during chain execution. Prefer the chain's exact current result-card selection while the chain is running, and prevent a competing generic submit/voice ordinal listener from stealing the same clause.

Potential narrow solution: while `__JARVIS_COMMAND_CHAIN_RUNNING__` is true, the Maps ordinal authority should ignore chain-internal follow-up events, allowing `dispatchFollowup()` to select the exact `[data-jarvis-map-v27="4"]` card. This must be tested carefully because standalone Maps ordinals must remain working.

### Step 4: if #5 selects correctly but pin is initially #1

The Maps renderer calls `show(page[0])` after rendering, so a fresh search naturally pins #1 first. The chain must wait for fresh result cards and then select #5 after rendering completes.

A narrow DOM wait for `[data-jarvis-map-v27="4"]` may be appropriate. Do not rewrite the Maps renderer.

## Guardrails

- Never modify `main` for TEST experimentation.
- Never broad rollback to the old stable baseline merely because one chain test fails.
- Never remove working Maps ordinal, Books, or YouTube authorities to fix chain behavior.
- Never reintroduce shared persistent `__JARVIS_LAST_CONTEXT_SURFACE__` reads into generic context resolution.
- Never hardcode Delhi restaurants or any other search result.
- Never assume the result order from a backend. Select by the actual rendered result index/context array.
- Never call a generic context resolver for a Maps ordinal if Maps owns the surface and an exact Maps result list is available.
- Keep changes isolated and reversible.

## Key commits

- Stable baseline: `f026f45822826df5efc08387902470cd0be99988`
- Earlier Maps surface-owner working point: `b0a41c1c610296016ddbb17d0862b792d755458d`
- Chain v2.3.0: `f3f108a70edc814f0dd0b901a85237d7f6e8b219`
- Chain v2.3.2: `19fa94c741f50dbdcffb7de8520fd543ef9b8f7a`
- Latest chain patch before this note: `6204acac920429d407dbbb44aae432874555b26e`

## Latest deployment

Latest verified Actions run:

- Run ID: `34458134704`
- Run number: `303`
- Head SHA: `6204acac920429d407dbbb44aae432874555b26e`
- Branch: `test/jarvis-intelligence-next`
- Build PROD + TEST: success
- Deploy dual Pages TEST: success
- Verify PROD + TEST URLs: success

## Useful URLs

- Repository: https://github.com/shivashisvicky/Jarvis-OS
- TEST branch: https://github.com/shivashisvicky/Jarvis-OS/tree/test/jarvis-intelligence-next
- TEST app: https://shivashisvicky.github.io/Jarvis-OS/test/
- Actions: https://github.com/shivashisvicky/Jarvis-OS/actions
- Latest run: https://github.com/shivashisvicky/Jarvis-OS/actions/runs/34458134704
- Workflow: https://github.com/shivashisvicky/Jarvis-OS/blob/test/jarvis-intelligence-next/.github/workflows/deploy-dual-pages-test.yml

## Immediate starting point for the next agent

Do NOT ask the user to re-explain the project.

Start by:

1. Read this file.
2. Confirm current TEST HEAD and Actions status.
3. Inspect TEST `index.html` and `jarvis-command-chain-v1.js`.
4. Fix the stale chain-script cache-buster only.
5. Deploy.
6. Test `Show me restaurants in Delhi and open the fifth one`.
7. Only then make another logic change if the exact failure remains.

The user's priority is correctness without regressions. The desired engineering style is small changes, evidence first, deployment verification, then testing.