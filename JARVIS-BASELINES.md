# J.A.R.V.I.S. OS Baselines

## Protected recovery anchor

`6010a558da5cb14894a46880ed7c2c6c35e2699f`

This is the mature whole-tree recovery anchor selected after user verification. It is not the historical Phase 1 reference and must not be confused with it.

## Historical reference

`f6b43298ff823dc0420ba6cbdce9274afba7baab`

Use this only as an older comparison point. Do not reset to it casually.

## Deployment branches

- PROD: `prod/2026-09-06-stable`
- TEST: `test/jarvis-intelligence-next`
- `main`: production GitHub Pages source in the repository architecture

TEST experiments must never be assumed to be production-ready. PROD is protected from experimental Ebook/context changes.

## Current recovery status: 2026-09-07

- Broken user-visible candidate: Actions run `34113235306`, commit `a6885092d29f9bb077d87ef090ff03ea9a489548`.
- That run was CI-green but behaviourally failed for Beowulf and John Henry Newman after deployment.
- TEST has been recovered to the `6010a...` tree, with preservation branches created for the broken and intermediate experimental states.
- The next deployment must be verified by Actions head SHA before manual testing.
- The recovered tree is the candidate for validation, not a newly declared baseline until user-visible tests pass.

## Baseline promotion rule

A commit becomes a behavioural baseline only after:

1. Actions build/deploy is green.
2. The deployed TEST artifact is confirmed to match the intended commit.
3. The relevant user-visible smoke tests pass.
4. No protected surface regresses.

A green Actions deployment alone is never sufficient.

## Protected behaviour

The following must remain intact while fixing Ebook reliability:

- Books search and ordinal selection.
- Maps search, third-result selection and `take me there`.
- YouTube/video search and third-result selection.
- Reader content, pagination/counter, chapter/section selection, previous/next and close/Gutenberg handoff.
- Voice lifecycle and unrelated command routes.

## Recovery rule

If the Ebook experiment fails, roll back only the experimental layer that introduced the regression when the dependency graph allows it. Preserve unrelated fixes, cache-busters and domain authorities. Prefer a small reversible change over a broad historical reset.
