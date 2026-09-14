# J.A.R.V.I.S. OS Engineering Changelog

## 2026-09-14

### Vision Lab — faithful Enhance verified

- Added a dedicated `/api/enhance` endpoint so faithful Enhance cannot fall through the generative image route.
- Faithful Enhance uses Cloudflare Images transformations rather than the generative Workers AI model.
- The browser sends the original image to `/api/enhance`; generative Edit/Generate continue using the compressed reference image through `/api/image`.
- The Vision shell/client cache-busting was updated during the implementation.
- A temporary dynamic iOS Save patch caused a Vision Lab loading regression. The patch was removed rather than leaving a fragile loader dependency.
- iOS Save behavior was then kept inside the existing Vision client path.
- User subsequently verified that Save works on iPhone.
- User verified a 4032×2268 faithful Enhance result against its source: dimensions, framing and meaningful object placement remained intact.
- The enhancement is intentionally conservative. Do not make it more aggressive merely to produce a larger visual delta.

### Spatial protection

- Spatial remains isolated from Vision work.
- Known-good Spatial behavioral reference remains `c3f0a455becc20231211ed52877f778a153be64c`.
- Later Spatial work includes deterministic desk fallback, selection/precision resizing, torus/lathe geometry, bicycle/motorcycle and curved-object support. These must be preserved while future modules are developed.

### Documentation / continuation

Added/updated:

- `JARVIS-AI-START-HERE.md` — mandatory durable entrypoint for future AI agents.
- `JARVIS-DOCS-INDEX.md` — documentation map and maintenance rules.
- `JARVIS-FUTURE-ROADMAP-2026.md` — product strategy, P0/P1/P2 roadmap, future modules and cross-module experiences.
- `JARVIS-ARCHITECTURE.md` — command/context/result/action architecture plus Vision and Spatial boundaries.
- `JARVIS-BASELINES.md` — current user-verified Vision and protected Spatial behavioral anchors.

The project now has a deliberate documentation contract: significant changes update the relevant subsystem handoff, baseline record, changelog and durable agent guidance as appropriate.

## 2026-09-07

### Deployment and recovery handoff

- Formalized the PROD/TEST split in the continuation and architecture documents.
- PROD branch: `prod/2026-09-06-stable`.
- TEST branch: `test/jarvis-intelligence-next`.
- `main` remains the production GitHub Pages source.
- TEST deployment is handled by `.github/workflows/deploy-dual-pages-test.yml` and publishes TEST beneath `/test/`.
- Protected whole-tree recovery anchor: `6010a558da5cb14894a46880ed7c2c6c35e2699f`.
- Latest broken user-visible deployment at that time: Actions run `34113235306`, commit `a6885092d29f9bb077d87ef090ff03ea9a489548`.
- Preservation branches were created for the stable anchor and intermediate experimental commits so forensic comparison remains possible.

### Recovery approach

The recovery is intentionally surgical. Do not discard unrelated fixes that predate the John Henry / Beowulf experiments merely because the latest Ebook experiment failed.

### Engineering approach for intermittent Ebook failures

- Do not add another global interceptor as the first response.
- Trace one command from query through context, result index, Gutenberg ID, source acquisition, Reader-open and Reader-ready.
- Identify the first owner that fails or fires twice.
- Keep prewarming separate from Reader opening.
- Use bounded network retry only inside source acquisition and only with idempotent state.
- Preserve exact BookRecord/Gutenberg ID across the handoff.
- Reject stale asynchronous search responses.

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
