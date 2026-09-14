# J.A.R.V.I.S. OS Architecture Guardrails

## 1. Deployment architecture

Jarvis uses separate environments so experiments cannot contaminate production.

- `prod/2026-09-06-stable` = protected PROD branch.
- `test/jarvis-intelligence-next` = experimental TEST branch.
- `main` = GitHub Pages production source and must not be used as an experiment branch.
- `.github/workflows/deploy-dual-pages-test.yml` builds PROD and TEST separately and publishes TEST beneath `/test/`.
- A TEST deployment must never be promoted to PROD merely because Actions is green.
- Vision has a separate TEST Worker and must not be silently routed through the shared intelligence worker.

The protected whole-tree recovery anchor is `6010a558da5cb14894a46880ed7c2c6c35e2699f`.

## 2. Command lifecycle

`User input -> Command Authority -> Entity/Intent resolution -> Domain owner -> UI action + CommandResult -> Voice Authority`

Only one layer should own each responsibility. Domain modules must not independently re-route unrelated commands.

The long-term target is one command object shared across surfaces, containing at minimum:

- command ID
- source (`voice`, `typed`, `ui`)
- normalized query
- intent/domain
- authoritative owner
- result-set ID when applicable
- selected entity/item
- parent/follow-up command ID
- lifecycle state
- timing/diagnostic metadata

The command core coordinates surfaces. It must not become a second authority for Maps, Books, Reader, Media, Vision or Spatial.

## 3. Ebook ownership

- Command Authority: decides whether a command is an Ebook request.
- Entity Authority: identifies title/author evidence.
- Ebook Authority: owns Gutenberg discovery and canonical BookRecord creation.
- Ebook UI: renders the result list from the current request.
- Context Engine: stores the current result set for references such as `read the first one`.
- Context Reference Authority: resolves the ordinal against the current valid result set.
- Canonical Reader: opens and renders the resolved BookRecord.
- Network transport: obtains text for the already-resolved Gutenberg ID.
- Voice Authority: owns spoken response lifecycle.

## 4. Hard boundaries

An Ebook fix must not modify the implementation of Voice, Time Now, Maps, YouTube, News or Command Center unless CI demonstrates a real cross-domain contract regression and the change is explicitly documented.

The Ebook stability layer is **guard-only**. It must not rewrite search buttons, reader IDs, DOM attributes, or create competing search/read handlers.

There must be one canonical Reader-open owner. Network warming may prepare a source but must not become a second Reader router.

The same principle applies to every mature JARVIS surface: one authoritative owner, many consumers.

## 5. State invariants

### Search

Every search has a request identity. Only the latest request may commit results. Stale/default results must never overwrite the current query.

### Reader

The Reader receives the exact resolved BookRecord/Gutenberg ID from the current result. It must not silently rediscover a different book from a title query. It is considered loaded only after readable content and page count are available.

### Context

`read the first one` resolves against the latest valid Ebook result set. Returning home must not destroy the context needed for a follow-up reference unless the context has explicitly expired.

### Single-dispatch invariant

One user command may produce one authoritative domain action. A prewarm, context event and Reader-open operation must be correlated to the same command/BookRecord. A second listener must not independently open the same Reader.

### Voice

Every command must terminate its voice lifecycle. Success, error, timeout and cancellation paths must release recognition/microphone state and return the UI to idle.

### Time

Time commands are global utility intents and must outrank stale Ebook context. `time now` and `what time is it` should converge on the same deterministic route.

## 6. Professional intermittent-failure handling

Do not solve intermittent failures by adding more retries or interceptors first. Instrument the boundary.

For each Ebook command, trace:

`commandId -> query -> context turn -> result-set ID -> resolved index -> Gutenberg ID -> source acquisition -> Reader-open -> Reader-ready`

Every trace event must identify its owner and whether it is the first or duplicate invocation. The diagnosis must distinguish:

- stale search response
- missing/expired context
- incorrect ordinal index
- entity misclassification
- duplicate Reader-open dispatch
- Reader module not yet loaded
- Gutenberg source/network latency

Once the first failing boundary is identified, fix that owner. A bounded network retry is acceptable only inside source acquisition and only when it cannot trigger a duplicate UI action.

## 7. Recovery strategy

When a subsystem becomes unstable:

1. Stop adding interceptors.
2. Preserve the failing commit and intermediate experimental commits with branches/tags.
3. Compare the failing tree with the last user-verified tree.
4. Identify the first experimental owner that diverged.
5. Remove/revert only that experimental layer when possible.
6. Preserve unrelated fixes and cache-busters.
7. Run CI.
8. Deploy TEST.
9. Perform the smallest user-visible smoke test.
10. Promote only after behavioural verification.

A green build is evidence of build correctness, not proof of product correctness.

## 8. Vision Lab architecture

Vision deliberately has two different contracts.

### Faithful image processing

```text
Vision UI
  -> POST /api/enhance
  -> Cloudflare Images
  -> exact source dimensions
  -> conservative transforms
  -> browser preview/save
```

This path is for **Enhance**. It must preserve dimensions, aspect ratio, framing and meaningful objects unless a future explicit operation says otherwise.

### Generative image work

```text
Vision UI
  -> POST /api/image
  -> isolated TEST Cloudflare Workers AI
  -> FLUX.2 Klein
  -> browser preview/save
```

This path is for Edit/Generate and may legitimately alter pixels or scene content.

**Do not merge the two routes again.** The previous shared route allowed an apparent Enhance request to fall into a generative 1024×768 path. The dedicated endpoint was introduced specifically to eliminate that ambiguity.

Current user-verified Vision contract as of 2026-09-14:

- 4032×2268 input remains 4032×2268 after faithful Enhance.
- Composition/framing remain intact.
- Save works on iPhone.
- Enhance is intentionally conservative.

## 9. Spatial architecture

Spatial is an isolated capability surface:

```text
User command
  -> spatial command bridge
  -> Engineering Bay / spatial lifecycle
  -> spatial intelligence gateway
  -> Gemini JSON plan
  -> semantic/precision/geometry layers
  -> safe loader
  -> local Three.js renderer
```

Current architectural layers include:

- command bridge / noun routing;
- semantic assembly and existing-object targeting;
- safe AI loader and plan validation;
- geometry patch for torus/lathe and deterministic bicycle/curved-object behavior;
- precision patch for resize/selection;
- command-center Enter handling;
- dedicated motorcycle and curved-object fallbacks.

Known-good Spatial behavioral reference:

`c3f0a455becc20231211ed52877f778a153be64c`

The user verified desk creation and follow-up transformations at that checkpoint. Later changes must preserve those behaviors.

Spatial hard rule:

> Fix routing/semantic/selection problems at the smallest responsible layer. Do not rewrite the renderer because one object type is weak.

## 10. Surface authority model

Each surface should own:

1. request interpretation specific to its domain;
2. result acquisition;
3. canonical result identity;
4. result-set publication;
5. selection/open/play/read action;
6. domain-specific context.

The shared Context Engine may consume and expose references, but it must not become the owner of another surface's state.

Desired follow-up contract:

```text
surface.search()
  -> { resultSetId, results, selected:null, timestamp }

context.publish(resultSet)

follow-up ordinal
  -> resolve against that resultSetId
  -> surface.select(resultId)
  -> surface.performAction(resultId)
```

Never resolve an ordinal from stale global text when the surface has a fresh result-set identity.

## 11. Performance architecture

Prefer measured concurrency over arbitrary delay.

- Parallelize independent read-only discovery.
- Serialize authoritative state commits.
- Cancel stale requests.
- Cache stable metadata.
- Do not open a surface before required data is ready.
- Avoid duplicate listeners.
- Keep diagnostics disabled by default.
- Measure command start, surface start, result-ready, action-start and action-complete timestamps.

Timeouts are safety nets, not primary synchronization mechanisms.

## 12. Future architectural direction

JARVIS should converge on four shared primitives:

### Command

What the user asked.

### Context

What JARVIS currently knows is relevant to the user.

### Result Set

A durable, identity-bearing collection produced by a surface.

### Action

A typed operation performed against a known entity/result.

These primitives should enable cross-module experiences without creating cross-module ownership confusion.

## 13. Security / trust boundary

Before action-taking modules expand, establish:

- explicit permission scopes;
- read-only versus action-taking distinction;
- confirmation for destructive/high-impact operations;
- audit trail;
- provider isolation;
- secrets kept server-side;
- reversible operations where possible;
- environment-specific credentials and endpoints.

A personal operating system should be conservative at action boundaries.
