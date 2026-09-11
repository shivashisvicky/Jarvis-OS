# J.A.R.V.I.S. OS TEST Handoff

**Purpose:** Give the next agent enough exact state, history, architecture, known failures, testing rules, recent fixes, and future roadmap to continue the project safely even if the current chat reaches its limit.

**Last updated:** 2026-09-12
**Repository:** `shivashisvicky/Jarvis-OS`
**Active branch:** `test/jarvis-intelligence-next`
**Stable branch:** `main` MUST NOT be modified for TEST work.
**TEST URL:** `https://shivashisvicky.github.io/Jarvis-OS/test/`

---

## 1. Non-negotiable engineering rules

1. Never modify `main` unless the user explicitly requests production promotion.
2. All experiments/fixes happen on `test/jarvis-intelligence-next` first.
3. Do not change GitHub Actions deployment logic to solve application behavior.
4. No broad rollback unless explicitly requested.
5. Preserve working Maps, Books, YouTube, Context Engine, entity authority, and reader behavior.
6. Never make generic Context Engine routing depend on the shared `window.__JARVIS_LAST_CONTEXT_SURFACE__`. A previous experiment broke Maps.
7. Prefer small additive/surgical files over rewriting mature authority modules.
8. Every changed browser-loaded JS/CSS file must receive a cache-bust update in `index.html`.
9. After every push, verify the corresponding GitHub Actions run before asking the user to test.
10. Never call a deployment green until Actions actually reports success.
11. User tests primarily on iOS Safari. Mobile timing/layout matters.
12. Keep this handoff updated after significant architecture, debugging, or UX changes.
13. Do not ask the user to “proceed” or “continue” when the next engineering action is clear. Inspect, implement, deploy, verify, then report.
14. If a regression appears, identify the responsible layer first. Do not guess and do not roll back unrelated working features.

---

## 2. Current project philosophy

JARVIS is evolving toward one intelligence layer with multiple authoritative surfaces rather than a collection of disconnected mini-apps.

Current important surfaces:

- 🗺️ Maps
- 📚 Books / Ebooks / Reader
- ▶️ YouTube / Media
- 🔎 Search / web-facing capabilities
- 📰 News
- 🌤️ Weather
- 🧮 Calculator
- 📝 Notes
- 🎮 Games
- 📁 Files
- 🔌 API / integration-oriented capabilities
- Remote-related functionality

The critical architectural lesson is **surface-specific authority**. A surface that owns the current result set should be the authority for ordinal follow-ups on that result set. Generic context is useful for continuity, but must not override a fresh surface-owned result set.

Desired command-chain architecture:

```text
VOICE / SUBMIT
      ↓
CHAIN PARSE
      ↓
FIRST SURFACE SEARCH / RESOLUTION
      ↓
RESULT SET AVAILABLE
      ↓
ATOMIC ORDINAL HANDOFF
      ↓
OPEN / PIN / PLAY / READ REQUESTED ITEM
```

The desired UX is:

```text
“Show me restaurants in Delhi and open the sixth one”
→ search Delhi
→ result set appears
→ #6 is selected
```

not:

```text
search Delhi
→ #1 flashes
→ generic context waits
→ #6 appears 20 seconds later
```

---

## 3. Important checkpoints / history

### Earlier stable checkpoints

- `f026f45822826df5efc08387902470cd0be99988` = stable baseline referenced by the older handoff.
- `b0a41c1c610296016ddbb17d0862b792d755458d` = earlier known-good Maps surface-owner work.
- `6204acac920429d407dbbb44aae432874555b26e` = recovery checkpoint after bad global context experiments.

Do not casually roll back to old checkpoints. Later reader/entity/context work would be lost.

### Chain progression

- `f3f108a70edc814f0dd0b901a85237d7f6e8b219` = chain v2.3.0; `and`, `then`, `, then`, broader ordinal parsing, deferred media query and tracing.
- `19fa94c741f50dbdcffb7de8520fd543ef9b8f7a` = Maps freshness improvement using `updatedAt` and result/query validation.
- `ee2e0189d6e6c435f3e520f2233c48ff87a1c3d8` = punctuation bridge created.
- `e0663196cf0c9c051c7c0e695343ea254c23f516` = punctuation bridge loaded.
- `75703b63c55d8d2fcb329a3ca478e0070b641cd3` = debug panel manual parser probe.
- `b0eca0283fef12eaafcff742eb27ae4c6ddd055e2` = debugger cache-bust.
- `97c99cb22dfff6f037f1597fae3a5025225f0481` = Settings diagnostics toggle.
- `d0977f9a5823ab13701d7d04254e4e48b947bd45` = chain v2.4.5 performance patch.
- `6d9aa53d54d71f1eef5e355e8290479ea271ba60` = fast chain handoff for Books and Maps.
- `64fee0a85a7fe00b96fa1cf98ee8d8ebc6165f93` = Maps atomic selection / latest old handoff head.

### Reader/UX commits from the current continuation

- `43be749346d6fc66a67638c180c8844a42c0a960` = **golden TEST reader/context baseline** explicitly validated by user. User said it worked perfectly with no delay and all functionality. Do not alter unless explicitly requested.
- `6d54d4f5a65c4a8843c2d22be1313aed73313545` = reader Source Serif 4 + heading renderer and cache-bust.
- `89455f659567d75f769a1c49da43ac6084e6ae72` = reader pagination/chapter-target/title-cleanup implementation.
- `e18f4956e0b658f4459cd0509593b9550301bb64` = reader pagination/title cache-bust.
- `c71d7446a5d9c3db212a7133fa8873f27cd0086e` = reader handoff loading animation v2, synchronized to visible spoken response.
- `4558f84834d72a9cb1c0dfd116b694affcb2a7a7` = animation cache-bust and corrected index load order; no duplicate home script in final index.
- `d179a43d051d07c451f4f40a9c6ab3530632d7e4` = reader paper/dark theme CSS.
- `3c131a5ac425423426c5bc26a8bb6770156c21ab` = current latest TEST head as of this handoff, cache-busting the reader theme styling.

Current Actions run for `3c131a5...` was run **#511**, workflow `Deploy Jarvis OS Dual Pages (TEST)`, and was `in_progress` when last checked. Do not call it green until the run completes successfully.

---

## 4. The biggest historical failure: shared surface ownership

A previous design made generic Context Engine routing read:

```js
window.__JARVIS_LAST_CONTEXT_SURFACE__
```

This caused stale/shared state to contaminate routing and made Maps stop responding.

Maps authority may still publish surface ownership signals such as:

```js
window.__JARVIS_LAST_CONTEXT_SURFACE__
window.__JARVIS_CONTEXT_SURFACE_OWNER__
```

inside its own authority logic.

**Do not make generic Context Engine decisions depend on those globals.**

The safe rule is:

> Fresh result set + surface-specific authority beats generic stale context.

---

## 5. Maps architecture

Primary Maps authority:

`jarvis-map-absolute-authority-v25.js`

Despite filename, current implementation is V27.

Capabilities:

- Known Bhubaneswar places via local `P` data.
- Arbitrary cities through Photon geocoding.
- Category searches use the JARVIS Places Worker first, then Photon category fallback.
- Arbitrary-city category searches are centered on the geocoded city.

A Delhi regression was fixed. Example correct Delhi results included:

1. Embassy Restaurant (Samosa)
2. Fa Yian The Chinese Restaurant
3. National Restaurant
4. Keshav Restaurant
5. Parikrama - The Revolving Restaurant
6. Neelam Restaurant

This proved the earlier hardcoded/stale-city issue was fixed.

### Maps result DOM contract

Rendered result buttons:

```html
<button type="button" class="place-result" data-jarvis-map-v27="0">...</button>
```

The attribute is zero-based; visible ordinals are one-based.

```js
[data-jarvis-map-v27="4"]
```

means visible result #5.

### Maps context publication

Maps publishes context similar to:

```js
window.jarvisContextEngine?.set?.({
  domain:'MAPS',
  active:true,
  location:...,
  query:...,
  results:...,
  selected:null
}, 'merge')
```

and dispatches `jarvis:map-context` with results.

### Maps default-first-result issue

Normal `render()` historically called `show(page[0])`, which could expose the first result before a chain ordinal was applied.

Desired chain behavior is atomic selection of the requested result before the user sees an intermediate first pin.

### Maps ordinal authority

`jarvis-map-ordinal-authority-v1.js` is surface-specific and must be preserved.

It:

- keeps private Maps context from `jarvis:map-context`;
- checks freshness;
- refuses to act when another surface clearly owns the interaction;
- avoids cross-surface words such as YouTube/video/book/ebook;
- can click the actual result card;
- can directly pinpoint a stored result from lat/lon when the DOM card is unavailable.

### Maps fast selection

`jarvis-chain-map-fast-select-v1.js` is V2 in the later TEST chain.

It detects a Maps first route on `jarvis:command-chain`, extracts the follow-up ordinal, then on `jarvis:map-context` selects the exact result from `event.detail.results[index]` instead of waiting for a DOM card.

It updates `#mapFrame`, updates Context Engine selected state, and emits a trace.

### Maps atomic handoff

`jarvis-chain-map-atomic-handoff-v1.js` hides `#mapFrame` during a Maps chain:

```css
html[data-jarvis-chain-map-atomic="1"] #mapFrame {
  visibility:hidden!important
}
```

It reveals the frame after the final chain trace or a 15-second safety timeout.

If latency remains, do **not** increase this timeout blindly. Measure the async stage first.

---

## 6. Maps regression: Delhi + punctuation

Command:

```text
Showing restaurants in delhi and open the 5th one.
```

Initially produced Bhubaneswar restaurants because loose freshness matching accepted overlapping tokens such as `restaurants`.

That was corrected by requiring relevant location tokens to match.

Then a second exact cause was found: terminal punctuation.

The chain regex expected `one` at end-of-string, but:

```text
open the 5th one.
```

contains a period. Generic routing then received the whole chain and stale Maps context could win.

The punctuation bridge was introduced to normalize terminal punctuation only when a chain connector/action pattern is present.

Do not replace it with a broad command rewrite.

---

## 7. Command-chain runtime

File:

`jarvis-command-chain-runtime-fix-v1.js`

Current runtime family is v2.4.x / v2.5.0-era behavior. The runtime exposes:

```js
window.jarvisCommandChain = {
  version:'2.4.5',
  split,
  parse,
  run
}
```

Important parser behavior:

- strips terminal `.`, `!`, `?`;
- supports `and`, `then`, comma, comma + then;
- supports first through twentieth;
- supports larger numeric/word ordinals;
- supports cardinal words such as `one`, `two`, etc.

Chain flow:

1. set `__JARVIS_COMMAND_CHAIN_RUNNING__`;
2. resolve clauses;
3. route first clause through surface-aware `first()`;
4. route follow-up through `follow()`;
5. try direct `domTarget(nextClause,nextType,5000)` before generic context waiting;
6. if DOM target succeeds, continue immediately;
7. otherwise use freshness wait with a bounded timeout.

`domTarget()` knows current result DOM patterns for Maps, Books, and YouTube.

### Historical syntax failure

An earlier chain script had a JavaScript string/escaping error in its split regex and failed to parse entirely. The replacement runtime fixed this. Do not resurrect the broken implementation without fixing syntax and validating parser traces.

---

## 8. Debugger / diagnostics

Files:

- `jarvis-chain-debug-panel-v1.js`
- `jarvis-chain-debug-settings-v1.js`

Settings key:

```text
jarvis.chainDebug.enabled
```

Debugger must be genuinely zero-cost when OFF:

- OFF = no diagnostic listeners attached and panel removed.
- ON = listeners attached and diagnostics shown.
- Settings toggle dispatches `jarvis:chain-debug-toggle`.

Useful events include:

- `RAW_VOICE`
- `RAW_SUBMIT`
- `DOM_INPUT`
- `DOM_AT_TRACE`
- `CHAIN_TRACE`
- `MANUAL_PARSE`
- `SPLIT_RESULT`
- `PARSE_RESULT`
- entity traces
- ebook context traces

A critical successful trace showed:

```text
chainVersion: 2.4.5
chainRunning: true
```

for:

```text
Show me restaurants in delhi
open the sixth one
```

with clause 0 = `MAP_POI`, clause 0 dispatched true, clause 1 = `CONTEXT_FOLLOWUP`, clause 1 dispatched true.

This proved parser/routing was functional and shifted investigation toward asynchronous result acquisition/selection timing.

---

## 9. Books / ebook architecture

Important loaded modules include:

- `jarvis-ebook-book-fast-resolver-v1.js`
- `jarvis-entity-authority-v2.js`
- `jarvis-ebook-network-race-fix-v1.js`
- `jarvis-ebook-network-fast-v1.js`
- `jarvis-ebook-search-authority-v2.js`
- `jarvis-ebook-reader-v7.js`
- ebook context/retention/stability/performance modules

### Entity authority

`jarvis-entity-authority-v2.js` is the entity resolution authority. It uses Gutenberg/Gutendex first and Wikidata fallback.

It rejects explicit search commands and generic surface words when deciding whether text is an entity/book candidate.

It can publish entity state and hand book resolution to ebook search authority.

### Ebook search race fix

`jarvis-ebook-search-authority-v2.js` reached v20.6.1 in the chain-race work.

Critical behavior:

```js
if(fallback.length){
  trace('RESOLVED_PRIMARY', ...);
  render(fallback,q);
  if(fallback.length<8&&!window.__JARVIS_COMMAND_CHAIN_RUNNING__)
    void search(q).then(...);
  return true;
}
```

Background hydration must not race an active command chain.

### Fast resolver race fix

Originally the ebook surface was opened before Gutenberg results were confirmed:

```js
const surfacePromise=openSurface();
const rows=await fetchFast(q);
```

That caused blank/empty ebook surfaces.

The architecture was changed to:

1. fetch Gutenberg first;
2. confirm/filter relevant rows;
3. open ebook surface;
4. hydrate/search UI.

User explicitly tested this and said it worked perfectly.

Preserve this order.

---

## 10. Reader pagination/chapter bugs and exact fixes

The user found multiple reader problems:

### Problem A: false section selector entries

For *The Dream of Gerontius*, the selector showed:

```text
part of Newman himself.
```

as a section.

Cause: loose detection treated any prose beginning with `part` as a chapter/section.

Fix: narrowed section detection to genuine forms such as:

```text
CHAPTER I
BOOK II
PART III
PROLOGUE
EPILOGUE
APPENDIX
```

with structural constraints.

### Problem B: selector changed but visible page did not

The reader previously stored only `{label,page}`. Multiple headings in the same giant page chunk therefore pointed to the same page.

Fix:

- reader pagination changed to line-based chunks around 3600 characters;
- chapter entries now store `{label,page,line}`;
- selector values are chapter-array indexes, not page numbers;
- changing selector sets `page=c.page`, `targetLine=c.line`;
- rendered lines receive `data-jbe-line` and exact target scrolling.

### Problem C: `3 / 3` giant pages

Old `splitPages` used paragraph blocks with ~5200-character chunks. This could collapse huge Gutenberg books into only a few pages.

New reader v12 splits normalized lines into ~3600-character chunks, preserving line boundaries where possible and safely splitting exceptionally long lines.

This was a surgical reader-only change.

### Problem D: `$b` in Apologia title

The user saw:

```text
Apologia pro vita sua : $b being a history of his religious opinions...
```

`$b` is a Gutenberg catalog/metadata formatting artifact, not part of the actual book title/body.

Reader v12 added:

```js
const cleanTitle=s=>String(s??'JARVIS READER')
  .replace(/\s*:\s*\$b\s*/gi,': ')
  .replace(/\$b\b/gi,'')
  .replace(/\s{2,}/g,' ')
  .trim();
```

This sanitizes the displayed JARVIS title only. It does not mutate book text.

### Problem E: *The Dream of Gerontius* structural TOC

Official Gutenberg TOC has top-level sections such as:

1. `INTRODUCTION | 1`
2. `JOHN HENRY NEWMAN | 21`
3. `THE DREAM OF GERONTIUS | 25`
4. `THE ETERNAL YEARS | 70`

Current v12 chapter detection is intentionally conservative and may not expose all non-chapter top-level TOC sections. If this becomes a user-visible regression, add structural TOC-aware detection rather than loosening the generic `part` regex again.

Do not broaden section detection without a concrete failing book.

---

## 11. Reader typography

User wanted book text to look uniform across Windows/iOS, with normal body text and bold headings.

Reader CSS:

`jarvis-ebook-reader-polish-v1.css`

Source Serif 4 was added correctly at the **top** of the CSS before rules, because an earlier attempt placed `@import` after rules and the font could be ignored.

Current body:

```css
.jbe11-page{
  font-family:"Source Serif 4",serif!important;
  font-weight:400!important;
  line-height:1.78!important;
}
```

Headings:

```css
.jbe11-content-heading{
  display:block;
  font-weight:700!important;
  letter-spacing:.012em!important;
  margin:1.05em 0 .35em
}
```

Reader JS now renders each line into a span and applies heading class only to likely headings.

User tested this typography and said:

> It worked wonderfully.

Preserve this typography unless the user explicitly requests a different style.

---

## 12. New reader themes, current work

User asked whether JARVIS Reader should have a dark theme/background. Decision:

- default reading surface = restrained warm paper/ivory;
- text = softer charcoal, not pure black;
- dark reading mode = deep charcoal background + warm off-white text;
- no decorative image behind book text;
- JARVIS chrome remains recognizably separate from the reading surface.

Added in `jarvis-ebook-reader-polish-v1.css`:

```css
.jbe11-page,.jbe11-body{
  background:#f7f1e5!important;
  color:#29251f!important
}

.jbe11-dark .jbe11-body,
.jbe11-dark .jbe11-page{
  background:#151617!important;
  color:#e8e3d8!important
}
```

A subtle page shadow is used on larger screens and removed on mobile.

**Important:** The CSS currently contains the dark-theme class rules, but the reader UI must actually toggle `jbe11-dark` before dark mode is considered functionally complete. The current theme work was styling-first. Verify the live TEST UI. If there is no visible theme control, add it narrowly to reader v12 only, preserving all reader navigation/network logic.

The latest theme CSS commit is `d179a43d051d07c451f4f40a9c6ab3530632d7e4`, followed by index cache-bust commit `3c131a5ac425423426c5bc26a8bb6770156c21ab`.

Current `index.html` cache-bust values include:

```html
jarvis-ebook-reader-polish-v1.css?v=20260912-reader-paper-dark-v14
jarvis-ebook-reader-v7.js?v=20260912-reader-pagination-title-v15
jarvis-ebook-reader-loading-v1.js?v=20260912-reader-handoff-loading-v2
```

Use the actual current `index.html` when continuing. Do not rely on old cache-bust examples if they differ from live TEST.

---

## 13. Reader handoff loading animation

User wanted a tiny animation immediately after the spoken phrase:

> “Let me identify Beowulf…”

and before the reader opens.

### First attempt failed

Initial loader listened for an internal `HANDOFF_WAIT` chain trace as if it were a DOM event. It did not work because that trace was internal/debug behavior, not a dispatched DOM event.

### Corrected v2

File:

`jarvis-ebook-reader-loading-v1.js`

Current guard:

```js
window.__JARVIS_EBOOK_READER_LOADING_V2__
```

It observes visible `#jarvisReply` text. When the response matches both:

- `let me identify`
- a book/ebook/read/reading term

it shows an isolated overlay:

```text
Opening your book
[small animated book pages]
[three dots]
```

A MutationObserver removes the overlay once `.jbe11` exists.

It includes reduced-motion support.

This is additive and does not touch reader source acquisition, pagination, Books authority, Maps, or YouTube.

User's latest observation before v2 was that the animation was not visible and the reader may simply be opening very quickly. That is acceptable from a UX standpoint. Do not slow the reader merely to make the animation visible. The animation should be a best-effort micro-transition, not an artificial delay.

---

## 14. Reader network/source acquisition

Reader v12 still intentionally preserves mature source acquisition architecture.

It honors:

```js
window.jarvisEbookSourceAcquire
```

when available, otherwise tries Gutenberg direct/Jina candidates.

Candidates include direct Gutenberg text and HTML endpoints plus Jina proxy candidates.

Timeout in the reader-local fallback remains around 9 seconds per attempt, with one retry.

If the reader still takes 20-30 seconds, do not rewrite the reader. Measure:

```text
CHAIN_START
BOOK_RESOLUTION_START / END
BOOK_RESULTS_RENDER
BOOK_CONTEXT_PUBLISH
BOOK_READ_CLICK
READER_OPEN
SOURCE_ACQUIRE_START
SOURCE_RESOLVED
TEXT_EXTRACTION_END
FIRST_PAGE_RENDER
```

A future optimization may prefetch the **selected** book text after its card is known, but do not prefetch every search result without evidence.

---

## 15. YouTube / Media architecture

Primary media module:

`jarvis-live-media.js`

Backend:

```text
https://jarvis-media.shivashisvicky112.workers.dev/api/search
```

Search has an approximately 20-second AbortController timeout/cache path.

Media result cards:

```text
#videoResults [data-jvc-id]
```

Player path includes `autoPlayFirst(query)` and direct result-card player invocation.

User observed:

> Video also same story, first list showed up and 20 sec later video played.

If this remains, measure:

```text
CHAIN_START
MEDIA_SEARCH_START / END
MEDIA_RESULTS_RENDER
MEDIA_CHAIN_CLICK
PLAYER_START
PLAYER_READY
```

Do not assume the chain parser is responsible.

---

## 16. Known command examples / regression tests

### Maps

```text
Show me restaurants in Delhi and open the sixth one
```

Expected:

- Delhi results
- sixth visible result selected
- no Bhubaneswar stale context
- no intermediate wrong selection if atomic handoff is active

Also test punctuation:

```text
Show me restaurants in Delhi and open the sixth one.
```

### Books

```text
Beowulf and open the fifth one
```

Expected:

- Beowulf search/resolution
- requested ebook card selected
- reader opens
- no stale Maps/YouTube context
- title should not contain Gutenberg `$b` metadata artifact

### YouTube

Use a multi-result query followed by an ordinal, for example:

```text
Search Oggy and play the sixth one
```

Expected media result set and selected player, with no Books ordinal takeover.

### Reader

Test:

- open a book directly;
- PAGE jump;
- NEXT/PREVIOUS;
- A− / A+;
- chapter/section selector;
- exact selector movement to a heading;
- long books with more than 3 pages;
- titles containing Gutenberg `$b` metadata;
- *The Dream of Gerontius* section structure;
- iOS Safari scrolling and safe-area behavior.

---

## 17. Current performance problem

Core functionality is working, but the user has observed roughly 20-30 second waits in some chain scenarios.

Important distinction:

- parser/routing is already proven functional;
- the slow segment may be surface search, context publication, reader source acquisition, media player startup, or map iframe/network behavior.

### Recommended timing markers

#### Maps

```text
CHAIN_START
MAP_SEARCH_START
MAP_GEOCODE_START / END
MAP_RESULTS_RECEIVED
MAP_RENDER
MAP_CONTEXT_PUBLISH
MAP_FAST_SELECT
MAP_FRAME_WRITE
```

#### Books

```text
CHAIN_START
BOOK_RESOLUTION_START / END
BOOK_RESULTS_RENDER
BOOK_CONTEXT_PUBLISH
BOOK_READ_CLICK
READER_OPEN
SOURCE_ACQUIRE_START
SOURCE_RESOLVED
FIRST_PAGE_RENDER
```

#### YouTube

```text
CHAIN_START
MEDIA_SEARCH_START / END
MEDIA_RESULTS_RENDER
MEDIA_CHAIN_CLICK
PLAYER_START
PLAYER_READY
```

All diagnostics must remain optional and detached when debugger is OFF.

Only optimize the measured slow segment.

---

## 18. Production promotion gate

Do **not** move the current TEST reader/theme work to production merely because Actions is green.

Before production promotion, require:

1. latest TEST Actions green;
2. user validates Books search + ordinal;
3. user validates Maps Delhi + ordinal + punctuation;
4. user validates YouTube ordinal;
5. user validates reader opening;
6. user validates reader pagination and chapter selector;
7. user validates reader typography on iOS Safari;
8. user validates paper/dark theme behavior if theme toggle is exposed;
9. user validates no `$b` title artifact;
10. user validates loading animation does not introduce delay;
11. broad regression across voice, Maps, YouTube, Search, News, Weather, Calculator, Notes, Games, Files, API, Remote;
12. smoke test on iOS, Android, and desktop where available;
13. only then consider promotion to production.

The current user-validated golden checkpoint is still `43be749346d6fc66a67638c180c8844a42c0a960`. It is a reference safety point, not a reason to discard later validated additive work.

---

## 19. Future JARVIS capability roadmap

The user asked what major capability should come after production. The recommended direction is **engineering first**, then image intelligence/editing, then 3D/spatial capabilities.

The guiding principle is:

> JARVIS should operate on information and systems, not merely display tools.

### Priority 1: JARVIS Engineering Bay ⚙️

Build as an integrated intelligence surface, not a generic toolbox.

Potential capabilities:

- JSON/XML formatter and viewer
- API request builder/tester
- OpenAPI/Swagger explorer
- HTTP header inspector
- JWT decoder/inspector
- Base64 encoder/decoder
- Regex tester
- XPath/JSONPath tester
- XML ↔ JSON conversion
- Diff viewer
- log analyzer
- SQL playground
- webhook tester
- API response diagnostics
- architecture diagram generator
- sequence diagram generator
- integration-flow visualization
- payload generation from schemas
- API contract comparison

Example voice interactions:

```text
“JARVIS, inspect this API response and tell me why the integration failed.”
“Compare these two API versions and tell me what will break.”
“Generate a test payload for this SuccessFactors endpoint.”
“Show me the integration flow for this OpenAPI specification.”
```

This is especially aligned with the existing integration/engineering direction of the project.

### Priority 2: Image intelligence + editing 🖼️

Do not build a full Photoshop clone initially.

Focus on multimodal understanding + useful transformations:

- background removal
- crop/resize
- enhancement
- text extraction/OCR
- screenshot understanding
- annotation/highlighting
- image comparison
- diagram interpretation
- document/photo cleanup
- profile-photo preparation

Potential commands:

```text
“JARVIS, remove the background.”
“Read this screenshot and tell me what failed.”
“Compare these two screenshots and tell me what changed.”
“Highlight the broken component.”
“Read this architecture diagram.”
```

The strongest JARVIS behavior is not editing alone. It is:

```text
SEE → UNDERSTAND → REASON → MODIFY → EXPLAIN
```

### Priority 3: 3D / spatial engineering 🧊

Eventually add a spatial workspace rather than a decorative 3D viewer.

Potential capabilities:

- basic 3D object generation
- room/furniture visualization
- dimension-based modelling
- simple mechanical component modelling
- exploded assemblies
- spatial layout analysis
- object placement
- model inspection
- image-to-3D experiments where technically practical

Example:

```text
“Create a simple enclosure from these dimensions.”
“Show me where this furniture could fit.”
“Explode this assembly and label the components.”
```

### Long-term multimodal JARVIS architecture

The eventual target is:

```text
          ┌── Vision / Images
          │
          ├── Engineering / APIs
          │
JARVIS ───┼── Books / Knowledge
          │
          ├── Maps / Places
          │
          ├── Media / YouTube
          │
          └── Spatial / 3D
                 ↓
        Shared Intelligence Layer
                 ↓
       Context-aware action execution
```

Surfaces should exchange context through explicit contracts, not accidental global variables.

The most powerful future interaction is cross-surface:

```text
“JARVIS, look at this CPI error screenshot, identify the problem,
create the corrected JSON payload, and show me the integration flow.”
```

That is the direction that makes the system feel like JARVIS rather than a collection of widgets.

---

## 20. Future engineering architecture rules

When Engineering/Image/3D surfaces are eventually implemented:

1. Give each surface its own authority module.
2. Give each result set an explicit context contract.
3. Make ordinal selection surface-local whenever possible.
4. Keep generic context as a fallback, not primary authority for fresh result sets.
5. Do not let image or 3D state leak into Maps/Books/YouTube routing.
6. Keep heavy diagnostics opt-in.
7. Prefer async progressive rendering over artificial loading delays.
8. Use Web APIs/workers/backend services where required, but keep UI state deterministic.
9. Cache expensive results only when cache keys are explicit and invalidation is understood.
10. Treat external APIs as unreliable dependencies and show graceful fallback states.
11. Every new browser-loaded module needs a cache-bust.
12. Every significant new surface needs regression tests before production promotion.

---

## 21. Current status at this handoff

**Core chain functionality:** 🟢 Working.

**Maps Delhi routing:** 🟢 Correct result set confirmed.

**Maps ordinal:** 🟢 Functionally works; atomic/latency behavior still deserves measurement.

**Books search/entity resolution:** 🟢 Functional after fast resolver and chain-race fixes.

**Books ordinal:** 🟢 Functional at the validated checkpoints.

**Reader typography:** 🟢 User validated as “worked wonderfully.”

**Reader pagination/chapter targeting:** 🟡 Latest surgical fix needs continued real-book regression testing, especially structural TOCs.

**Reader `$b` title cleanup:** 🟢 Implemented in v12 title display.

**Reader loading animation:** 🟡 Implemented as v2 visible-response trigger; should never introduce artificial reader delay.

**Reader paper theme:** 🟡 Implemented and deployed through current TEST run, pending user visual validation.

**Reader dark theme:** 🟡 CSS support implemented; verify/add actual UI toggle if not yet exposed.

**YouTube/media:** 🟡 Functional, with reported playback latency requiring timing diagnosis.

**Debugger:** 🟢 Optional and designed to be zero-cost OFF.

**Automatic deployment:** 🟢 Working; do not modify pipeline.

**`main`:** 🟢 Untouched and must remain untouched during TEST work.

**Current TEST head:** `3c131a5ac425423426c5bc26a8bb6770156c21ab`

**Current Actions run:** #511, head `3c131a5...`, status was `in_progress` at handoff creation. Verify before testing.

---

## 22. Exact continuation procedure for the next agent

When a new chat/agent starts:

### Step 1
Read this handoff completely.

### Step 2
Inspect the actual TEST branch HEAD. Never assume this document's HEAD is still current.

### Step 3
Inspect the current `index.html` load order and cache-bust values.

### Step 4
Check the latest Actions run for the actual HEAD. Do not ask the user to test an unverified deployment.

### Step 5
If debugging a failure, reproduce the smallest failing path and classify it as:

1. parser/routing;
2. result acquisition;
3. context publication;
4. ordinal selection;
5. rendering/UI;
6. reader source acquisition;
7. media player startup;
8. external network latency.

### Step 6
Patch only the responsible layer.

### Step 7
Cache-bust changed browser files.

### Step 8
Push to TEST only.

### Step 9
Verify Actions.

### Step 10
Only then provide the user with the exact test flow.

### Step 11
After the user validates a meaningful change, update this handoff with the commit, behavior, and any new regression information.

---

## 23. Final instruction

The project has reached a much better functional state after repeated earlier regressions. The correct strategy is **enhance it, don't rebuild it**.

Protect working surface authorities. Measure latency before optimizing. Keep reader work isolated. Keep generic context generic. Keep production frozen until TEST has passed focused and broad regression.

Future agents should treat this document as the continuity bridge when the conversation ends, but should always verify the live repository state before making code changes.
