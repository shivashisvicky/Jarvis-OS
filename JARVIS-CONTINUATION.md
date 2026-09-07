# J.A.R.V.I.S. OS Continuation Checkpoint

**Last updated:** 2026-09-07
**Purpose:** Mandatory session-to-session engineering handoff. A new agent must read this file plus `JARVIS-ARCHITECTURE.md`, `JARVIS-BASELINES.md`, and `JARVIS-REGRESSIONS.md` before changing code.

## 1. Deployment architecture

This repository deliberately separates production from experimentation.

### PROD

- Production source branch: `prod/2026-09-06-stable`.
- Production promotion is deliberate. Do not debug or experiment on PROD.
- Last promoted production commit: `58e22a659c93951271119e37a0c30a930c37259e`.
- Protected whole-tree recovery anchor: `6010a558da5cb14894a46880ed7c2c6c35e2699f`.

### TEST

- Experimental branch: `test/jarvis-intelligence-next`.
- TEST is where Ebook/context/entity/command experiments are deployed and manually verified.
- TEST uses `.github/workflows/deploy-dual-pages-test.yml`.
- The workflow builds PROD and TEST trees separately and publishes TEST under `/test/`.
- Intended TEST URL: `https://shivashisvicky.github.io/Jarvis-OS/test/`.
- A green build/deploy is not a user-verified behavioural baseline.

### Main

- `main` remains the GitHub Pages production source in the repository architecture.
- Do not use `main` as a scratch branch.
- Do not merge TEST experiments into production merely because Actions is green.

## 2. Current recovery state

The latest user-visible broken deployment was Actions run `34113235306`, commit `a6885092d29f9bb077d87ef090ff03ea9a489548`, titled `fix: restore TEST static asset path`.

That run was green at CI/deployment level but the user subsequently reported that both Beowulf and John Henry Newman ebook behaviour was broken. Therefore that build is not a behavioural baseline.

The TEST branch has been moved back to the protected whole-tree anchor `6010a558da5cb14894a46880ed7c2c6c35e2699f`. This is a recovery of the mature pre-experiment tree, not permission to discard unrelated prior work.

Important: moving a Git ref does not itself guarantee that GitHub Pages has rebuilt. Always verify a new TEST Actions run and its head SHA before asking the user to test.

## 3. What must remain protected

The following accumulated behaviour must survive Ebook work:

- Books result search and ordinal selection.
- Maps result search, third-result selection and `take me there`.
- YouTube/video multi-result search and third-result selection.
- Reader opening, live Gutenberg text, page navigation/counter, chapter/section selector, previous/next and close/Gutenberg handoff.
- Voice lifecycle and unrelated command routes.

Do not fix Books by changing Maps or YouTube authority. Do not fix Reader by creating another competing search/router path.

## 4. Ebook/user regression target

The two named regression cases are:

1. `Beowulf`
2. `John Henry Newman`

The user expects each to work reliably, with at most one retry during this recovery phase. A first-load timing/network issue may be investigated, but repeated retries must not conceal a deterministic routing bug.

Desired chain:

`search book -> current Ebook result set -> ordinal/reference resolution -> exact BookRecord -> canonical Reader -> readable content/page count`

The reader must never rediscover a different book from a title query after the result has already been selected.

## 5. Investigation method

When a regression appears:

1. Identify the last user-verified working build.
2. Compare the next experimental commit against that build.
3. Find the first owner that changed the contract.
4. Revert/remove only that experimental layer where possible.
5. Preserve unrelated fixes and their cache-busters.
6. Add a trace at the ownership boundary before adding another interceptor.
7. Run CI.
8. Only after CI is green, deploy TEST and run the smallest relevant manual smoke test.
9. Do not promote to PROD until the user-visible regression suite is verified.

Do not perform a wholesale historical rollback simply because an Ebook experiment failed.

## 6. Current pending tasks

### P0: Deployment recovery

- Ensure TEST has a fresh Actions run whose head tree is the recovered stable tree.
- Verify the deployed TEST artifact corresponds to that run, not run `34113235306`.
- Do not ask for behavioural testing until this is confirmed.

### P0: Ebook reliability

- Verify Beowulf and John Henry Newman from clean TEST state.
- If either fails, capture which ownership boundary failed: search, context, ordinal resolver, entity authority, handoff, network transport, or Reader.
- Determine whether the intermittent failure is caused by duplicate listeners/routing or asynchronous source acquisition.

### P1: Mature fix design

- Prefer one canonical path and idempotent state transitions.
- Use request IDs / stale-response rejection for asynchronous search.
- Persist the exact selected BookRecord, not merely a title string.
- Let the canonical Reader own opening/rendering.
- Keep Ebook stability guard-only.
- Use bounded retry/fallback for network acquisition, with tracing and no duplicate UI actions.

### P1: Regression protection

- Keep Beowulf, John Henry Newman, Books ordinal, Maps ordinal and YouTube ordinal as separate smoke cases.
- Run the broader three-surface suite when shared context/authority infrastructure changes.
- Do not make unrelated subsystems pay the cost of every Ebook experiment.

## 7. Version/rollback rule

Every future engineering checkpoint must record:

- commit SHA
- branch
- Actions run ID/status
- user-visible symptom targeted
- files changed
- active component versions/cache-busters
- rollback anchor

Create preservation branches before destructive recovery operations. Never delete experimental history merely to make the branch look clean.

## 8. Current rollback anchor

`6010a558da5cb14894a46880ed7c2c6c35e2699f`

This anchor is the mature whole-tree recovery point. It must not be silently replaced by a later unverified build.
