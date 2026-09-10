# J.A.R.V.I.S. OS Agent Bootstrap

## READ THIS FIRST

This file is a handoff contract for any new coding agent continuing J.A.R.V.I.S. OS.

### Golden engineering rule
Do not assume the latest TEST commit is good. The verified recovery checkpoint is:

`6204acac920429d407dbbb44aae432874555b26e`

A protected reference to that exact tree exists as:

`jarvis-golden-6204ac`

The active TEST branch is intended to remain on that checkpoint until the owner explicitly authorizes the next experiment.

## Repository and deployment

Repository:
`https://github.com/shivashisvicky/Jarvis-OS`

Stable production branch:
`main`

TEST branch:
`test/jarvis-intelligence-next`

TEST URL:
`https://shivashisvicky.github.io/Jarvis-OS/test/`

Production URL:
`https://shivashisvicky.github.io/Jarvis-OS/`

GitHub Actions workflow:
`.github/workflows/deploy-dual-pages-test.yml`

The workflow builds production from `main` and TEST from the TEST branch, then publishes both. Do not modify the deployment workflow to solve application bugs. Do not modify `main` during experimentation.

## Current objective

J.A.R.V.I.S. is being developed as a deterministic, conversational multi-surface assistant. The current focus is reliable chained commands while preserving already-working Books, YouTube, and Maps context behavior.

Canonical desired chain examples:

- `Show me restaurants in Jagannath Nagar and open the third one`
- `Show me restaurants in Delhi and open the fifth one`
- `Show me videos about X and play the sixth one`
- analogous Books/entity follow-ups

The meaning of a chain is sequential:

1. Parse the clauses.
2. Execute clause 1 through the correct surface authority.
3. Wait for the fresh result context produced by clause 1.
4. Resolve clause 2 against that fresh result set, not stale global context.
5. Execute the requested ordinal/entity action.

For Maps, `open the fifth one` means exactly result index 5 in the current Maps result list and must pin that result.

## Critical verified state at checkpoint 6204ac

At the 6204ac checkpoint:

- Books ordinal context was working and responsive.
- YouTube ordinal context was working.
- Maps ordinal context was working.
- `restaurants in Jagannath Nagar -> open the third one` had been tested successfully.
- Books remained snappy after the Maps ordinal fix.
- The dangerous shared persistent `__JARVIS_LAST_CONTEXT_SURFACE__` experiment had already been rolled back. Do not reintroduce that shared global as a generic context authority mechanism.
- The Maps ordinal authority is intentionally separate from the generic context-reference authority.
- Stable `main` must remain untouched.

## Known architecture

Important files/components include:

- `jarvis-context-engine-v1.js`: context engine, known-good baseline around v3.3.0. Avoid modifying without concrete evidence.
- `jarvis-context-reference-authority-v1.js`: generic context-reference authority with surface-owner logic. Avoid broad changes.
- `jarvis-context-ordinal-extension-v1.js`: generic ordinal extension, v1.6 at the checkpoint.
- `jarvis-map-ordinal-authority-v1.js`: dedicated Maps ordinal authority. It listens for Maps context and resolves ordinals against the actual Maps result list.
- `jarvis-map-absolute-authority-v25.js`: Maps absolute authority, V27 around this checkpoint. Handles arbitrary-city Maps searches using geocoding/category lookup and publishes Maps context.
- `jarvis-command-chain-v1.js`: chained command parser/executor. Checkpoint 6204ac contains the narrowly scoped Maps-authority chain routing experiment.
- `jarvis-command-authority-v2.js`: command classification authority.
- `jarvis-command-final-routing-v3.js`: final command routing and Maps POI handling.
- `jarvis-youtube-command-authority-v1.js`: YouTube/media surface ownership.
- Ebook authority family under `jarvis-ebook-*.js`: do not destabilize while working on chain routing.

## Important Maps details

Maps can handle arbitrary cities, not only Bhubaneswar. The absolute Maps authority has geocoding/category logic for locations such as Delhi.

The Maps ordinal authority captures `jarvis:map-context`, stores the actual result objects, and uses rendered result cards with:

`[data-jarvis-map-v27]`

It indexes result cards from zero, so ordinal 5 maps to DOM index 4.

The Maps ordinal authority must remain ahead of generic context fallback because a previous change that called the generic context-reference authority first caused Maps ordinals to be hijacked and selected the wrong result.

## Important chain history

### Earlier successful work

Original bug: `Play oggy - 6th one` opened a book because stale Books context won ordinal fallback.

The ordinal extension was patched to route ordinals by immediate surface ownership. This fixed YouTube sixth-result behavior.

Maps surface ownership was then added to Maps authority. A separate Maps ordinal authority was introduced because using the shared generic context reference path caused Maps commands to fall back to Books.

The dedicated Maps ordinal authority fixed Maps ordinals without breaking Books. User explicitly tested and confirmed Maps ordinal worked and Books was snappy.

### Chain v2.3.x experiments

Chain v2.3.0 preserved `and` as the joining keyword and added `then`, comma, and `, then` support. It broadened ordinal parsing and added media handoff behavior.

The user tested:
`Show me restaurants in Jagannath Nagar and open the third one`

It worked, but there was a noticeable 10-20 second delay before the ordinal selection. A freshness wait was narrowed to Maps `updatedAt` plus query matching.

A later experiment attempted to make Maps first-clause routing direct and Maps ordinal selection explicit. This produced a Delhi regression in another agent's subsequent work, including Bhubaneswar results for a Delhi query and pinning result #2 instead of #5.

The user then requested an exact rollback to 6204ac. The TEST branch was force-moved back to that commit.

## Do not repeat these mistakes

1. Never broadly roll back to an old baseline just because one chain test fails. Preserve working later surface fixes.
2. Never modify `main` while experimenting.
3. Never alter the Actions/deployment workflow to fix application routing.
4. Never introduce a shared persistent global context-surface flag into the generic context authority without proving it cannot hijack Maps/Books/YouTube.
5. Never let generic context-reference resolution run before the dedicated Maps ordinal authority when Maps owns the current surface.
6. Never resolve an ordinal from stale context merely because the ordinal is syntactically valid.
7. Never treat the visible phrase `Showing restaurants in Delhi and open the fifth one` as proof that the second clause has been resolved. It is the command/response text, not the selection result.
8. Do not assume a function exists on `window.jarvisMapAuthority` merely because it exists inside the IIFE. Verify its exported API before depending on it.
9. Do not add broad heuristics or hardcoded city-specific routing for Delhi/Bhubaneswar. Fix the authority/handoff boundary.
10. Do not make multiple unrelated changes in one experiment.

## Deployment/testing protocol

Before coding:

1. Verify current TEST branch SHA.
2. Verify `main` SHA has not changed.
3. Compare current TEST to the golden checkpoint if needed.
4. Identify the smallest authority responsible for the failing behavior.

When changing code:

1. TEST branch only.
2. One narrowly scoped change.
3. Preserve trace logging where useful.
4. Commit with a precise message.
5. Wait for the automatic Actions deployment.
6. Verify TEST URL deployment.
7. Only then ask the owner to test.

After a regression:

1. Stop making additional speculative changes.
2. Capture the exact command and observed result.
3. Inspect the relevant trace/authority/context state.
4. Compare against 6204ac.
5. Revert only the bad experiment, not unrelated working features.

## Current immediate next step

Start from exact checkpoint `6204acac920429d407dbbb44aae432874555b26e`.

Do NOT resume the later v2.3.4 or other-agent changes.

Before changing chain logic, inspect the exact checkpoint versions of:

- `jarvis-command-chain-v1.js`
- `jarvis-map-ordinal-authority-v1.js`
- `jarvis-map-absolute-authority-v25.js`
- `jarvis-command-authority-v2.js`
- `jarvis-command-final-routing-v3.js`
- `index.html`

Then establish a traceable reproduction of:

`Show me restaurants in Delhi and open the fifth one`

The required behavior is:

- first clause resolves to Delhi
- Maps publishes a fresh Delhi result list
- second clause resolves to ordinal 5 against that exact list
- result #5 is selected/pinned
- no Bhubaneswar contamination
- no generic Books/YouTube fallback
- no arbitrary 10-20 second timeout-based handoff

Do not fix this by hardcoding Delhi or by changing unrelated surface authorities.

## Useful links

Repository:
`https://github.com/shivashisvicky/Jarvis-OS`

TEST branch:
`https://github.com/shivashisvicky/Jarvis-OS/tree/test/jarvis-intelligence-next`

Golden checkpoint:
`https://github.com/shivashisvicky/Jarvis-OS/commit/6204acac920429d407dbbb44aae432874555b26e`

Golden branch:
`https://github.com/shivashisvicky/Jarvis-OS/tree/jarvis-golden-6204ac`

Agent handoff branch:
`https://github.com/shivashisvicky/Jarvis-OS/tree/jarvis-agent-handoff-6204ac`

TEST deployment:
`https://shivashisvicky.github.io/Jarvis-OS/test/`

Actions:
`https://github.com/shivashisvicky/Jarvis-OS/actions`

## Instructions to the next coding agent

You are inheriting an existing system, not starting a greenfield implementation.

Read this file completely. Then inspect the actual repository at the stated checkpoint. Trust repository code and verified test history over assumptions.

Do not say that a rollback or rewrite is necessary until you have compared the current failing path against the golden checkpoint.

Do not make the owner repeat the architecture or history already documented here.

The owner prefers concise engineering communication, evidence-first diagnosis, narrow reversible patches, automatic TEST deployment, and explicit confirmation before testing. The goal is to preserve working behavior while improving one capability at a time.
