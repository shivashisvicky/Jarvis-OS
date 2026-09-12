# J.A.R.V.I.S. OS — TEST HANDOFF / OPERATING MANUAL

**Last updated:** 2026-09-12
**Repository:** `shivashisvicky/Jarvis-OS`
**TEST branch:** `test/jarvis-intelligence-next`
**TEST URL:** `https://shivashisvicky.github.io/Jarvis-OS/test/`
**Production:** `main`

> This document is the source of truth for the next agent. Read it before changing code. The goal is continuity: the user must never have to re-explain architecture, constraints, previous failures, or intended behavior.

---

## 0. USER EXPECTATION / ENGINEERING STANDARD

JARVIS is a serious long-running personal OS project, not a toy/demo. The user expects production-quality engineering discipline even while working on TEST.

The user has explicitly been frustrated by agents making many speculative commits, breaking working functionality, then attempting more fixes. **Do not repeat this pattern.**

The correct workflow is:

1. Inspect the current TEST tree and relevant mature modules first.
2. Identify the actual responsible layer from code/traces.
3. Compare against an existing working JARVIS pattern before inventing architecture.
4. Make one small, surgical change whenever possible.
5. Cache-bust every browser-loaded changed asset in `index.html`.
6. Push only to TEST.
7. Verify the complete GitHub Actions run.
8. Only then ask the user to test.
9. If the test fails, inspect the trace and code before changing anything else.

**Do not manufacture confidence.** If something has not been tested or Actions has not succeeded, say so.

---

# 1. ABSOLUTE RULES

1. **Never modify `main` for TEST work.** Production promotion happens only when the user explicitly requests it.
2. All experimental work belongs on `test/jarvis-intelligence-next`.
3. Never change GitHub Actions/deployment logic to solve application behavior.
4. No broad rollback unless explicitly requested.
5. Preserve Maps, Books/Reader, YouTube/Media, Context Engine, entity authority, and existing working command-chain behavior.
6. Never make generic Context Engine routing depend on `window.__JARVIS_LAST_CONTEXT_SURFACE__`. A previous experiment broke Maps.
7. Surface-owned state may be published by a surface authority, but generic routing must not blindly consume it as global authority.
8. Prefer existing JARVIS architectural patterns over new mini-frameworks.
9. Do not blindly copy Postman, Blender, Three.js Editor, Babylon, etc. Use them as benchmark references only.
10. Spatial/Engineering Bay intelligence must remain isolated from generic command/context routing except through explicit, narrow integration points.
11. Do not let Spatial code modify Maps/Books/Reader/YouTube routing.
12. Avoid duplicate voice-response mechanisms. Existing JARVIS voice authority owns the normal voice path; Spatial should not compete with it.
13. Every changed browser-loaded JS/CSS file requires an `index.html` cache-bust change.
14. After every TEST push, verify Actions. Never call deployment green until Actions reports success.
15. The user primarily tests on iOS Safari. Touch behavior, event timing, viewport sizing, and mobile performance matter.
16. Keep commits minimal. The user explicitly dislikes chains of tiny speculative commits.
17. Do not ask “should I proceed?” when the next engineering action is clear. Inspect → implement → deploy → verify → report.
18. If a regression appears, determine the responsible layer first. Do not guess.
19. Never replace a working subsystem simply because a newer implementation looks cleaner.
20. Preserve known-good checkpoints. They are evidence, not invitations to reset the project.

---

# 2. CORE JARVIS ARCHITECTURE

JARVIS is one intelligence system with multiple authoritative surfaces, not a collection of unrelated mini-apps.

Important surfaces include:

- Maps
- Books / Ebooks / Reader
- YouTube / Media
- Search / Web
- News
- Weather
- Calculator
- Notes
- Games
- Files
- API / integration tooling
- Remote functionality
- Engineering Bay

The key architectural principle is **surface-specific authority**.

If Maps owns the current result set, Maps owns an ordinal such as “open the sixth one.” If Books owns the current book list, Books owns “open the third one.” Generic context provides continuity but must not steal ownership from a fresh, explicit result set.

Desired command chain:

```text
VOICE / SUBMIT
    ↓
CHAIN PARSE
    ↓
FIRST SURFACE SEARCH / RESOLUTION
    ↓
RESULT SET CONFIRMED
    ↓
SURFACE-SPECIFIC ORDINAL HANDOFF
    ↓
OPEN / PIN / PLAY / READ REQUESTED ITEM
```

Avoid:

```text
search
→ generic context waits
→ stale context wins
→ wrong item / long delay
```

---

# 3. KNOWN-GOOD CHECKPOINTS

These are historical evidence. Do not casually roll back to them because later Reader/entity/context work may be lost.

- `f026f45822826df5efc08387902470cd0be99988` — older stable baseline.
- `b0a41c1c610296016ddbb17d0862b792d755458d` — earlier known-good Maps surface-owner work.
- `6204acac920429d407dbbb44aae432874555b26e` — recovery checkpoint after bad global-context experiments.
- `43be749346d6fc66a67638c180c8844a42c0a960` — **golden Reader/context baseline** explicitly validated by the user as working perfectly with no delay.

Reader progression:

- `6d54d4f5a65c4a8843c2d22be1313aed73313545` — Source Serif 4 + heading renderer/cache bust.
- `89455f659567d75f769a1c49da43ac6084e6ae72` — pagination/chapter target/title cleanup.
- `e18f4956e0b658f4459cd0509593b9550301bb64` — pagination/title cache-bust.
- `c71d7446a5d9c3db212a7133fa8873f27cd0086e` — Reader handoff loading animation v2.
- `4558f84834d72a9cb1c0dfd116b694affcb2a7a7` — animation cache-bust/load-order correction.
- `d179a43d051d07c451f4f40a9c6ab3530632d7e4` — paper/dark Reader theme CSS.

Chain progression:

- `f3f108a70edc814f0dd0b901a85237d7f6e8b219` — chain v2.3.0.
- `19fa94c741f50dbdcffb7de8520fd543ef9b8f7a` — Maps freshness.
- `ee2e0189d6e6c435f3e520f2233c48ff87a1c3d8` — punctuation bridge created.
- `e0663196cf0c9c051c7c0e695343ea254c23f516` — punctuation bridge loaded.
- `75703b63c55d8d2fcb329a3ca478e0070b641cd3` — debug manual parser probe.
- `b0eca0283fef12eaafcff742eb27ae4c6ddd055e2` — debugger cache-bust.
- `97c99cb22dfff6f037f1597fae3a5025225f0481` — Settings diagnostics toggle.
- `d0977f9a5823ab13701d7d04254e4e48b947bd45` — chain v2.4.5 performance patch.
- `6d9aa53d54d71f1eef5e355e8290479ea271ba60` — fast Books/Maps handoff.
- `64fee0a85a7fe00b96fa1cf98ee8d8ebc6165f93` — Maps atomic-selection lineage.

Recent Spatial/Engineering Bay work is documented in Sections 11–17 below.

---

# 4. MAPS: DO NOT BREAK THIS

Primary authority file:

`jarvis-map-absolute-authority-v25.js` (implementation currently V27 despite filename).

Capabilities:

- Known Bhubaneswar places through local data.
- Arbitrary-city geocoding via Photon.
- Category search through JARVIS Places Worker first, Photon fallback second.
- Arbitrary-city category searches centered on the geocoded city.

A previously broken Delhi search was fixed. Correct example results included:

1. Embassy Restaurant (Samosa)
2. Fa Yian The Chinese Restaurant
3. National Restaurant
4. Keshav Restaurant
5. Parikrama - The Revolving Restaurant
6. Neelam Restaurant

### Maps DOM contract

Result cards use:

```html
<button type="button" class="place-result" data-jarvis-map-v27="0">...</button>
```

The DOM index is zero-based; visible ordinals are one-based.

```text
DOM 0 = visible #1
DOM 4 = visible #5
```

### Maps ordinal authority

`jarvis-map-ordinal-authority-v1.js` owns Maps ordinal follow-ups. Preserve it.

It keeps private Maps context, checks freshness, refuses obvious cross-surface ownership, can click the result card, and can directly pinpoint a stored result by coordinates.

### Maps fast selection

`jarvis-chain-map-fast-select-v1.js` selects directly from `event.detail.results[index]` rather than waiting unnecessarily for DOM cards. It updates the map frame, selected context, and trace.

### Maps atomic handoff

`jarvis-chain-map-atomic-handoff-v1.js` temporarily hides `#mapFrame` while a chain is resolving so the user does not see an incorrect first result.

Do not blindly increase its timeout. Measure the actual slow stage first.

### Maps punctuation lesson

`open the 5th one.` initially failed because the ordinal parser expected end-of-string after `one`. Terminal punctuation was normalized by a narrow punctuation bridge. Do not replace this with broad text rewriting.

### Critical Maps warning

A previous experiment made generic Context Engine routing depend on:

```js
window.__JARVIS_LAST_CONTEXT_SURFACE__
```

That broke Maps. **Never repeat it.**

---

# 5. COMMAND CHAIN

Primary file:

`jarvis-command-chain-runtime-fix-v1.js`

Runtime family is v2.4.x-era behavior and exposes:

```js
window.jarvisCommandChain = { version, split, parse, run }
```

Supported syntax includes:

- `and`
- `then`
- comma
- comma + `then`
- terminal `.`, `!`, `?`
- numeric ordinals
- first through twentieth and broader ordinal forms
- cardinal words such as one/two/etc.

Current conceptual flow:

1. Set chain-running state.
2. Resolve clauses.
3. Route first clause through surface-aware authority.
4. Route follow-up through surface-aware follow-up authority.
5. Try direct DOM target before generic context waiting.
6. Fall back to bounded freshness/context waiting only when necessary.

`domTarget()` knows current Books/Maps/YouTube result DOM patterns.

An older chain implementation had a JavaScript escaping/syntax failure in its split regex and failed to parse. Never resurrect that broken version.

---

# 6. DEBUGGER / DIAGNOSTICS

Files:

- `jarvis-chain-debug-panel-v1.js`
- `jarvis-chain-debug-settings-v1.js`

Setting:

```text
jarvis.chainDebug.enabled
```

When OFF, diagnostics should be genuinely low/zero cost: no unnecessary listeners and no visible panel.

When ON, useful traces include:

- `RAW_VOICE`
- `RAW_SUBMIT`
- `DOM_INPUT`
- `DOM_AT_TRACE`
- `CHAIN_TRACE`
- `MANUAL_PARSE`
- `SPLIT_RESULT`
- `PARSE_RESULT`
- entity traces
- ebook traces
- Spatial traces

Reader tracing is independently gated. The debug panel has shown `READER OFF` while other traces remain active.

The debug trace UI was specifically fixed for iOS scrolling. Keep the scrollable `<pre>` behavior with touch scrolling; newest entries appear at the top.

A successful chain trace previously proved:

```text
chainVersion: 2.4.5
chainRunning: true
```

and showed both first and follow-up clauses dispatched. That established that parser/routing itself was working and that later failures belonged to result acquisition/selection timing.

---

# 7. BOOKS / ENTITY / READER

Important modules:

- `jarvis-entity-authority-v2.js`
- `jarvis-ebook-search-authority-v2.js`
- `jarvis-ebook-book-fast-resolver-v1.js`
- `jarvis-ebook-network-race-fix-v1.js`
- `jarvis-ebook-network-fast-v1.js`
- `jarvis-ebook-reader-v7.js`
- ebook context/retention/performance/race modules

### Entity authority

Gutenberg/Gutendex is primary; Wikidata is fallback. Explicit search commands and generic surface words must not be misclassified as entities.

Entity authority can publish entity state and hand book resolution to ebook authority.

### Ebook race rule

The important fixed order is:

```text
fetch Gutenberg
→ confirm/filter results
→ open ebook surface
→ hydrate/search UI
```

Do not open an empty ebook surface first and then wait for the network.

Background hydration must not race an active command chain.

### Reader chapter targeting

The Reader uses line-based pagination around 3600 characters. Chapter entries store:

```text
{label, page, line}
```

Selector values are chapter-array indexes, not page numbers. Exact line targets are used for scrolling.

False headings such as prose beginning with `part` were rejected by stricter structural heading detection. Valid forms include genuine structures such as CHAPTER, BOOK, PART, PROLOGUE, EPILOGUE, APPENDIX.

### Reader title cleanup

Gutenberg `$b` metadata artifacts are removed conservatively. Do not alter actual body content unnecessarily.

### Reader theme

Source Serif 4 is used. Paper/dark theme CSS exists. If modifying theme behavior, verify the actual toggle state before declaring it complete.

### Reader loading animation

The handoff loading animation is tied to visible `#jarvisReply` text such as “let me identify” + book/ebook/read. It must not introduce an artificial delay.

---

# 8. YOUTUBE / MEDIA

Files include:

- `jarvis-live-media.js`
- `jarvis-youtube-command-authority-v1.js`
- related media/gesture fixes

Backend:

`https://jarvis-media.shivashisvicky112.workers.dev/api/search`

Cards use:

```text
#videoResults [data-jvc-id]
```

When diagnosing media-chain latency, measure:

```text
CHAIN_START
MEDIA_SEARCH_START
MEDIA_SEARCH_END
MEDIA_RESULTS_RENDER
MEDIA_CHAIN_CLICK
PLAYER_START
PLAYER_READY
```

Do not make generic context own Media ordinals when Media has a fresh result set.

---

# 9. ENGINEERING BAY: PRODUCT GOAL

Engineering Bay is intended to become a serious JARVIS engineering workspace, not a page full of disconnected buttons.

The full roadmap is broader than the first MVP.

### Payload / data tools

- JSON formatter / validator / minifier
- XML formatter / viewer
- JSON ↔ XML
- Base64
- JWT decoder
- Regex tester
- XPath / JSONPath tester
- payload generator

### API engineering

- API request builder/tester
- HTTP header inspector
- OpenAPI/Swagger explorer
- API contract comparison
- response diagnostics
- webhook tester

### Developer utilities

- Diff viewer
- log analyzer
- SQL playground
- architecture diagram generation
- sequence diagram generation

### Image Intelligence

- background removal
- crop/resize
- enhancement
- OCR / screenshot understanding
- annotation/highlighting
- image comparison
- diagram interpretation
- document cleanup

### 3D / Spatial

- primitive object generation
- room/furniture visualization
- dimension-based modeling
- mechanical component modeling
- exploded assemblies
- spatial layout analysis
- model inspection
- object selection and transformation
- export formats

Engineering Bay should be structured/grouped and loaded incrementally rather than becoming a giant monolithic page.

---

# 10. ENGINEERING BAY ARCHITECTURE

The canonical first-class module architecture was inspected in:

- `src/db.ts`
- `src/main.ts`

`AppId` is a central union. A true first-class app requires coherent changes to the AppId/apps map/render/navigation/prepareFeature paths. Adding only one union member caused a compile failure:

```text
Property 'engineeringBay' is missing ... required in type 'Record<AppId, AppMeta>'
```

That mistake was corrected.

The home-card owner is `jarvis-core-recovery-v1.js`, which already creates API Lab + SFTP. Engineering Bay must be a **distinct** home card with its own attribute, not another API Lab.

The earlier experimental `jarvis-engineering-bay-entry-v1.js` approach was wrong and was removed. `jarvis-module-loader.js` was restored to its previous architecture.

Current Bay has a genuine 3D/Spatial tab and dimensioned-object UI rather than a placeholder.

---

# 11. ENGINEERING BAY BENCHMARKS

The user explicitly requested comparison with strong existing tools and live GitHub examples where useful, but **not blind copying**.

Benchmarks reviewed:

### Postman

Useful benchmark floor:

- request construction
- params/headers/body
- response inspection
- status/time/size
- formatting/search
- collections/environments
- tests/scripts

### Insomnia

Useful benchmark floor:

- OpenAPI design/preview
- collections
- environments
- tests/mocks
- scripting
- multi-protocol/API debugging

### JSONLint / JSON tooling

Useful benchmark floor:

- validate
- format
- minify
- tree/view
- JSONPath
- diff

### Three.js ecosystem

Useful benchmark floor:

- WebGL renderer
- geometry/material separation
- OrbitControls
- TransformControls
- OBJ/GLTF export
- mobile touch support

### Three.js Editor / related GitHub editors

Useful architectural lesson:

```text
Editor state
→ selection
→ command/undo layer
→ viewport
→ inspector
```

This separation is a useful benchmark for future JARVIS Spatial architecture.

### Babylon.js / xeokit / threepp

Useful benchmark lessons include mature scene/camera/engine separation, selection/highlighting, BIM/model inspection, command stacks, snapping, and editor-core separation.

The rule is: **borrow proven architectural ideas, not their UI or entire architecture.**

---

# 12. ENGINEERING BAY BENCHMARK IMPLEMENTATION

File:

`jarvis-engineering-bay-benchmark-v1.js`

It is additive and currently provides/extends:

### Payload

- XML → JSON via DOMParser
- JWT decode note explicitly warns: local decoding only, signature/claims are not verified
- regex flags + improved matching
- UTF-8-safe Base64 using TextEncoder/TextDecoder

### API

- response status
- response time
- response bytes
- content type
- response headers
- copy response
- stricter JSON object header validation
- OpenAPI/Swagger inspector parsing JSON specs and listing operations

### Developer

Improved JSONPath support for:

- dot paths
- bracket keys
- numeric array indexes
- wildcard

### Spatial

Three.js is lazy-loaded only when Spatial is opened:

```text
three@0.186.0
```

The Spatial viewport uses:

- WebGL renderer
- dimension-driven BoxGeometry
- OrbitControls
- damping/touch
- grid
- lighting
- MeshStandardMaterial
- OBJ export
- GLB export
- reset view
- ResizeObserver
- capped DPR / low-power mobile settings
- CSS fallback if WebGL/dependencies fail

Potential future hardening: bundle Three.js locally with the project build instead of relying on esm.sh. Do not make that larger change casually.

### Known benchmark enhancer risks

The benchmark enhancer was written additively and may attach handlers alongside original handlers for API/regex/Base64. If duplicate actions appear, inspect event binding before changing architecture.

Separate esm.sh imports can potentially create multiple Three.js instances. If Three.js controls/exporters fail unexpectedly, consider a single-version import strategy or local bundling.

---

# 13. SPATIAL AI PRODUCT GOAL

The intended user experience is natural-language engineering:

```text
Create a 1200mm wide, 600mm deep and 750mm high office desk with a 30mm thick wooden tabletop, four metal legs, a lower shelf and a 27 inch monitor centered on top.
```

followed by iterative commands:

```text
Make the desk 200mm wider.
Make the legs 50mm shorter.
Move the monitor 100mm to the left.
Make the tabletop glass.
Add a keyboard tray underneath the tabletop.
Make the keyboard tray 500mm wide.
```

The Spatial system must understand the **scene**, semantic objects, dimensions, and relationships. It must not simply regex the entire sentence into one primitive.

The v1/v2 system deliberately uses a constrained plan schema and deterministic execution.

Current allowed conceptual operations include:

```text
create
select
resizeSelected
moveSelected
rotateSelected
scaleSelected
materialSelected
deleteSelected
clear
inspect
```

Create supports primitives such as:

```text
box
cylinder
sphere
cone
```

Use SI metres internally.

The AI must return a structured plan, never executable code.

---

# 14. SPATIAL AI SAFETY / ARCHITECTURE

The Spatial AI planner has:

- constrained plan validation
- operation whitelist
- operation count cap
- semantic scene state in sessionStorage
- object tree/inspector
- deterministic local fast paths for simple geometry/transforms
- AI fallback for complex requests
- client-side AI rate guard
- one AI call at a time
- plan cache
- explicit intelligence endpoint
- natural-language interception only for spatial-specific commands

The planner should not become generic JARVIS routing.

Natural-language interception must remain narrow and domain-specific.

Do not use a shared global context surface flag to make Spatial work.

Do not allow Spatial event handlers to swallow Maps/Books/YouTube commands.

---

# 15. CRITICAL SPATIAL FAILURE HISTORY

This section is extremely important. It records what went wrong so the next agent does not repeat it.

### Failure A: Engineering Bay was implemented with the wrong architecture

An experimental entry injector was used instead of following the canonical module/home-card architecture. It was removed.

Lesson: inspect `src/main.ts`, `src/db.ts`, and `jarvis-core-recovery-v1.js` before adding a first-class module.

### Failure B: compile failure from incomplete AppId integration

Only `engineeringBay` was added to the AppId union, but not to the required `Record<AppId, AppMeta>` map. Actions failed.

Lesson: a first-class module must be integrated coherently across all required app registries/render/navigation paths.

### Failure C: Spatial bridge became too complicated

The bridge accumulated lifecycle/rearm logic and dependencies on UI readiness. This was unnecessary.

The proven pattern is simple event interception + explicit Bay open + wait for actual Spatial engine + run.

### Failure D: Spatial planner returned a root single operation

The intelligence gateway sometimes returned:

```json
{"op":"create","type":"box",...}
```

instead of:

```json
{"operations":[{"op":"create",...}],"explanation":"..."}
```

`valid()` correctly rejected the former, causing:

```text
ENGINE_ERROR
plan@...:...
```

The response-shape guard was introduced to canonicalize a single operation into an `operations` array.

### Failure E: response-shape helper lost the fetch-wrapper race

The first helper installed its fetch wrapper too early. The Spatial lifecycle later replaced `window.fetch`, bypassing the helper.

A later helper re-armed itself when `window.fetch` changed.

Lesson: when wrapping globals in a multi-script lifecycle, identify who replaces the global and in what order. Do not assume startup order is permanent.

### Failure F: Spatial did not even open Engineering Bay

The latest user test revealed the bridge itself was not intercepting the command. This is a **command interception/Bay opening failure**, not an AI planning failure.

The bridge had been changed from a proven document-level capture/delegation pattern to form-local binding. That was a needless architectural deviation.

**The next agent must first restore/verify the proven event-delegation path. Do not touch AI planning until the command reliably opens Engineering Bay.**

This is the immediate outstanding issue.

---

# 16. CURRENT SPATIAL FILES / RESPONSIBILITIES

Important files seen during current work:

- `jarvis-engineering-bay-v1.js` — Bay shell/open/close/navigation/tool UI.
- `jarvis-engineering-bay-benchmark-v1.js` — benchmark enhancements.
- `jarvis-engineering-spatial-ai-v1.js` — earlier Spatial planner implementation.
- `jarvis-engineering-spatial-ai-v2.js` — newer planner/validation path.
- `jarvis-engineering-spatial-ai-v3.js` — current assembly-oriented Spatial planner in the latest inspected TEST tree.
- `jarvis-engineering-spatial-lifecycle-v1.js` — creates/lazily loads Spatial runtime when the Spatial pane exists.
- `jarvis-engineering-spatial-plan-shape-v1.js` — response-shape guard.
- `jarvis-engineering-spatial-command-bridge-v1.js` — natural-language command interception and Bay/Spatial handoff.
- `jarvis-engineering-spatial-ui-restore-v1.js` — restores/maintains Spatial workbench UI in the newer assembly flow.

Current index seen in recent TEST state loaded Spatial-related assets with cache-busts similar to:

```html
<script src="./jarvis-engineering-bay-benchmark-v1.js?..."></script>
<script src="./jarvis-engineering-spatial-ai-v3.js?..."></script>
<script src="./jarvis-engineering-spatial-ui-restore-v1.js?..."></script>
<script src="./jarvis-engineering-spatial-lifecycle-v1.js?..."></script>
<script src="./jarvis-engineering-spatial-plan-shape-v1.js?..."></script>
<script src="./jarvis-engineering-spatial-command-bridge-v1.js?..."></script>
```

Exact cache-bust values must always be read from the current TEST `index.html`, not guessed from this document.

---

# 17. IMMEDIATE NEXT TASK: RESTORE THE PROVEN SPATIAL COMMAND PATH

**Do not continue feature expansion yet.**

The immediate objective is only:

```text
User says spatial command
→ JARVIS recognizes it
→ Engineering Bay opens
→ Spatial tab activates
→ Spatial engine becomes ready
→ command reaches window.jarvisSpatial.run()
```

Only after this works should AI plan-shape validation and complex assembly behavior be tested.

### Required diagnostic sequence

Turn chain debugging ON and run a simple command such as:

```text
Create a 1 metre box.
```

Expected high-level trace:

```text
COMMAND_ACCEPTED
BAY_READY
SPATIAL_TAB_CLICKED
SPATIAL_READY
SPATIAL_ENGINE_READY
ENGINE_CALL
PLAN_READY / local equivalent
PLAN_APPLIED
ENGINE_RETURN
```

If the first trace is absent, the command never reached the Spatial bridge.

If `COMMAND_ACCEPTED` exists but `BAY_READY` is absent, Bay opening is broken.

If `BAY_READY` exists but `SPATIAL_TAB_CLICKED` is absent, the Bay DOM contract changed.

If Spatial tab opens but `SPATIAL_ENGINE_READY` is absent, investigate lifecycle/runtime loading.

If engine is ready but `ENGINE_ERROR` occurs, then inspect planner/plan shape.

**Never jump to the later layer before the earlier layer is proven.**

### Proven bridge principle

The bridge should use narrow spatial-domain recognition and capture/delegation at the document level so it remains robust to dynamically-created command form DOM.

The bridge must not require a fragile one-time binding to a form created later by the app.

It must not own generic commands.

---

# 18. SPATIAL SEMANTIC GAPS TO SOLVE AFTER BASIC PATH IS STABLE

Once basic opening/execution is stable, the planner must become semantically capable of the torture-test sequence.

The current schema needs explicit support for at least:

### Semantic selection

Something equivalent to:

```json
{"op":"select","target":{"name":"legs","type":"box"}}
```

Without this, “make the legs 50mm shorter” cannot reliably target the correct object.

### Resize

Something equivalent to:

```json
{"op":"resizeSelected","dimensions":{"x":...,"y":...,"z":...}}
```

This is preferable to blindly scaling when the user asks for an absolute dimensional change such as “make the desk 200mm wider.”

### Relative transforms

Support precise semantic commands such as:

```text
move monitor 100mm left
rotate tabletop 10 degrees
```

### Materials

Material changes must target the intended semantic object, not merely the currently selected arbitrary object.

### Assemblies

Multiple create operations are acceptable for desks/furniture/assemblies. The planner should preserve semantic names such as:

```text
Tabletop
Leg 1
Leg 2
Leg 3
Leg 4
Lower Shelf
Monitor
Keyboard Tray
```

The scene should remain inspectable and editable.

---

# 19. SPATIAL PERFORMANCE / MOBILE RULES

The user tests on iOS.

Keep:

- lazy 3D loading
- capped device pixel ratio
- low-power rendering where possible
- ResizeObserver
- touch-enabled OrbitControls
- no unnecessary animation loops when the viewport is idle
- bounded AI calls
- client-side cache/rate guard

Do not add heavy dependencies to initial page load unless justified.

Three.js currently loads lazily. If it remains CDN-based, keep all Three.js-related imports on one compatible version. If later bundling locally, make that a deliberate architectural change and verify build output.

---

# 20. ENGINEERING BAY TEST MATRIX

Before declaring Engineering Bay production-ready, test each layer separately.

### Bay UI

- Home card opens Bay.
- Bay closes.
- Tabs switch.
- 3D/Spatial tab opens.
- API Lab remains API Lab, not Bay.
- SFTP remains unchanged.

### Payload tools

- JSON validate/format/minify.
- XML parse.
- JSON ↔ XML.
- Base64 Unicode.
- JWT decode warning.
- Regex flags/matching.
- JSONPath.

### API tools

- request construction.
- response status/time/size.
- headers.
- copy.
- OpenAPI inspection.
- error handling.

### 3D

- box dimensions.
- cylinder/sphere/cone.
- orbit.
- touch gestures.
- resize viewport.
- reset.
- OBJ.
- GLB.
- WebGL fallback.

### Spatial AI

- simple local box.
- simple primitive dimensions.
- natural-language desk assembly.
- semantic object selection.
- absolute resize.
- relative movement.
- rotation.
- material change.
- add object to existing scene.
- export final scene.

### Regression gates

After Spatial work, verify at minimum:

- Maps search.
- Maps ordinal.
- Delhi arbitrary-city category search.
- Books search.
- Books ordinal.
- Reader chapter selector.
- Reader exact chapter scrolling.
- YouTube search/ordinal.
- generic Context Engine behavior.

Spatial changes must not require modifying those modules.

---

# 21. COMMIT / DEPLOYMENT DISCIPLINE

Preferred sequence:

```text
inspect current branch
→ inspect exact responsible files
→ make one surgical change
→ syntax/build check
→ update index cache-bust if needed
→ commit TEST
→ wait for Actions
→ verify build + deploy + smoke/verify jobs
→ report exact commit/run
→ user tests
```

Do not create throwaway branches/commits merely to experiment with the GitHub API.

Do not stack multiple speculative fixes.

Do not modify workflow files to make application tests pass.

Do not touch `main`.

If a change is wrong, fix the branch deliberately rather than producing a pile of compensating commits.

---

# 22. WHAT THE USER DOES NOT WANT TO HEAR

Avoid:

- “It should work.”
- “I think this is fixed” without evidence.
- “Proceed?” when the next engineering step is obvious.
- “Let’s rollback everything.”
- explanations blaming the user/browser without trace evidence.
- claims that Actions is green before checking it.
- feature expansion while a basic module path is broken.
- changing mature Maps/Books/Reader code to fix Spatial.

The user expects the agent to do the investigation itself and return with evidence.

---

# 23. FINAL HANDOFF STATE

At the moment this handoff was written:

- Production `main` is a known-good, user-validated production snapshot. **Do not modify it.**
- TEST is the only workspace for ongoing Engineering Bay/Spatial work.
- Engineering Bay UI exists and was previously visually confirmed by the user as looking good.
- Benchmark enhancements exist.
- Spatial AI assembly work exists.
- The current outstanding blocker is **command interception/Bay opening**, not a reason to redesign the entire Spatial planner.
- A prior plan-shape problem was real and has a response guard, but it should only be debugged after the command reliably reaches Spatial.
- The next agent must restore/verify the proven document-level Spatial command event path first.
- The next agent must then run the Actions pipeline and only present TEST for user testing after all relevant jobs succeed.

**North star:** make JARVIS more capable without making it less trustworthy. Every new subsystem must fit the existing authority architecture, be measurable, reversible, mobile-safe, and respectful of the working surfaces that already exist.
