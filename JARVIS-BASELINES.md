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

TEST experiments must never be assumed to be production-ready. PROD is protected from experimental Ebook/context/Vision/Spatial changes.

## Baseline promotion rule

A commit becomes a behavioral baseline only after:

1. Actions build/deploy is green.
2. The deployed TEST artifact is confirmed to match the intended commit.
3. The relevant user-visible smoke tests pass.
4. No protected surface regresses.
5. The verified behavior and exact commit are recorded here.

A green Actions deployment alone is never sufficient.

## Current verified behavioral anchors

### Spatial 3D — protected behavioral reference

`c3f0a455becc20231211ed52877f778a153be64c`

User-verified behavior at this reference:

- Create a 1200mm wide × 600mm deep × 750mm high office desk.
- 30mm tabletop.
- Four metal legs.
- Lower shelf.
- Centered 27-inch monitor.
- Make desk 20% wider.
- Move monitor slightly left.
- Make legs black.
- Rotate monitor 15 degrees.
- Delete monitor.

Later Spatial work must preserve this behavior. This commit is a behavioral reference, not a blanket rollback target.

### Vision Lab — verified product behavior

As of 2026-09-14 the user has verified the faithful Enhance flow on TEST:

- A 4032×2268 source produced a 4032×2268 result.
- The 16:9 framing remained intact.
- Meaningful objects and their positions remained intact.
- The result was conservative rather than generatively reconstructed.
- The Save button worked on iPhone and produced the test output used for comparison.

The faithful Enhance contract is therefore:

```text
input dimensions == output dimensions
input framing == output framing
meaningful scene geometry preserved
no silent generative fallback
```

Vision Enhance must remain on the dedicated `/api/enhance` route. Generative Edit/Generate must remain on `/api/image`.

The current TEST image implementation was last materially changed around commit `5218c89d7ff8e47c3a781387c9916b81b3912df7` before this documentation-only continuation. Treat later documentation commits as carrying the same verified behavior unless a code change explicitly touches Vision.

## Protected behavior

The following must remain intact while working on any new module:

- Books search and ordinal selection.
- Maps search, result selection and `take me there`.
- YouTube/video search and ordinal selection.
- Reader content, pagination/counter, chapter/section selection, previous/next and close/Gutenberg handoff.
- Voice lifecycle and unrelated command routes.
- Spatial desk creation and follow-up transformations.
- Vision faithful Enhance and iPhone Save.

## Recovery rule

If a new experiment fails:

1. Stop the experiment.
2. Identify the first failing owner.
3. Compare against the nearest user-verified behavior.
4. Preserve unrelated fixes and cache-busters.
5. Revert only the responsible experimental layer when possible.
6. Deploy TEST.
7. Verify Actions.
8. Re-run the smallest relevant smoke test.

Never use a broad rollback merely because the latest experiment is broken.
