# J.A.R.V.I.S. OS Engineering Changelog

## 2026-09-07

### Deployment and recovery handoff

- Formalized the PROD/TEST split in the continuation and architecture documents.
- PROD branch: `prod/2026-09-06-stable`.
- TEST branch: `test/jarvis-intelligence-next`.
- `main` remains the production GitHub Pages source.
- TEST deployment is handled by `.github/workflows/deploy-dual-pages-test.yml` and publishes TEST beneath `/test/`.
- Protected whole-tree recovery anchor: `6010a558da5cb14894a46880ed7c2c6c35e2699f`.
- Latest broken user-visible deployment: Actions run `34113235306`, commit `a6885092d29f9bb077d87ef090ff03ea9a489548`.
- Preservation branches were created for the stable anchor and intermediate experimental commits so forensic comparison remains possible.

### Recovery approach

The recovery is intentionally surgical. Do not discard unrelated fixes that predate the John Henry / Beowulf experiments merely because the latest Ebook experiment failed.

The immediate recovery candidate is the mature `6010a...` tree. It must be deployed and user-verified before being declared a new behavioural baseline.

### Engineering approach for intermittent Ebook failures

- Do not add another global interceptor as the first response.
- Trace one command from query through context, result index, Gutenberg ID, source acquisition, Reader-open and Reader-ready.
- Identify the first owner that fails or fires twice.
- Keep prewarming separate from Reader opening.
- Use bounded network retry only inside source acquisition and only with idempotent state.
- Preserve exact BookRecord/Gutenberg ID across the handoff.
- Reject stale asynchronous search responses.

### Pending

1. Obtain a fresh TEST Actions run from the recovered tree.
2. Verify deployed TEST head SHA matches the intended recovery commit.
3. Test Beowulf and John Henry Newman with at most one retry.
4. If failure remains, add/inspect traces before changing routing code.
5. Validate Books, Maps and YouTube ordinal behaviour when shared context/authority code changes.
6. Do not promote TEST changes to PROD until behavioural verification is complete.

## 2026-08-28

### Session checkpoint

- Persistent continuation checkpoint added in `JARVIS-CONTINUATION.md`.
- Baseline tracking added in `JARVIS-BASELINES.md`.
- Regression ledger added in `JARVIS-REGRESSIONS.md`.
- Architecture guardrails added in `JARVIS-ARCHITECTURE.md`.

### Recent Ebook work

- Added Beowulf live regression coverage.
- Added author entity regression coverage.
- Corrected author test semantics to accept `BOOK_AUTHOR` as a legitimate author entity while still rejecting generic Web/Search routing.
- Added/iterated Gutenberg network race and reader source fallback handling.
- Converted Ebook stability layer toward guard-only behaviour.

### Workflow policy

Do not hand the user a new build for manual testing while the relevant live regression gate is red or has not run. A green build/deploy is not sufficient to declare behavioural correctness.
