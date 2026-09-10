# J.A.R.V.I.S. OS TEST Handoff

**Purpose:** Give the next agent enough exact state, history, architecture, known failures, and testing instructions to continue the TEST branch without repeating old mistakes or destabilizing working functionality.

**Last updated:** 2026-09-11
**Active repository:** `shivashisvicky/Jarvis-OS`
**Active branch:** `test/jarvis-intelligence-next`
**Stable branch:** `main` MUST NOT be modified for this work.
**TEST URL:** `https://shivashisvicky.github.io/Jarvis-OS/test/`

---

## 1. Current mission

The core conversational functionality is now working:

- Maps search + ordinal follow-up works, including arbitrary cities such as Delhi.
- Books / ebooks search and ordinal continuation works functionally.
- YouTube / media ordinal continuation works functionally.
- Chain grammar supports `and`, `then`, comma, and `, then` forms.
- Terminal punctuation such as `.` no longer breaks chain parsing.
- Debug diagnostics can be enabled from Settings and are intended to be zero-cost when disabled.

The remaining priority is **performance / latency**, not a broad rewrite.

User's current observation:

> Command chain works, but Books, Maps and Video can still show the first/default result and then take roughly 20-30 seconds before the requested ordinal item is opened/pinpointed.

The user is happy that the functionality is finally reliable and wants enhancement now. Treat the current working behavior as a protected baseline. Make surgical changes only.

---

## 2. Golden rules

1. **Never modify `main`.**
2. Work only on `test/jarvis-intelligence-next` unless explicitly instructed otherwise.
3. Do not change the GitHub Actions deployment pipeline to solve application logic.
4. Do not perform broad rollback unless explicitly requested.
5. Preserve the working Maps / Books / YouTube context authorities.
6. Do not reintroduce a shared global context-surface read into the generic Context Engine. A previous experiment using `window.__JARVIS_LAST_CONTEXT_SURFACE__` caused Maps to stop responding.
7. Prefer additive, narrow files over rewriting mature authority modules.
8. Cache-bust every changed browser-loaded JS file in `index.html`.
9. After every push, verify GitHub Actions before asking the user to test.
10. The user tests on iOS Safari. Timing behavior must be considered on mobile Safari, not only desktop.
11. Do not claim a deployment is green until Actions confirms it.
12. Keep the handoff document updated whenever a significant architectural discovery or fix is made.

---

## 3. Important stable checkpoints / history

### Stable baseline
`f026f45822826df5efc08387902470cd0be99988`

### Earlier known-good Maps surface-owner work
`b0a41c1c610296016ddbb17d0862b792d755458d`

### Explicit recovery checkpoint
`6204acac920429d407dbbb44aae432874555b26e`

This checkpoint was used after bad global context experiments. Descendants from that failed experiment were removed from TEST. Do not casually roll back to it now because later reader/entity/context work would be lost.

### Recent chain progression
- `f3f108a70edc814f0dd0b901a85237d7f6e8b219` = chain v2.3.0, preserves `and`, adds `then` / `, then`, broader ordinal parsing, deferred media query and tracing.
- `19fa94c741f50dbdcffb7de8520fd543ef9b8f7a` = Maps freshness branch changed to use `updatedAt` and result/query validation.
- Chain v2.4.x = fixed Maps stale-context problems and direct Maps follow-up routing.
- `ee2e0189d6e6c435f3e520f2233c48ff87a1c3d8` = punctuation bridge created.
- `e0663196cf0c9c051c7c0e695343ea254c23f516` = punctuation bridge loaded from `index.html`.
- `75703b63c55d8d2fcb329a3ca478e0070b641cd3` = debug panel enhanced with manual parser probe.
- `b0eca0283fef12eaafcff742eb27ae4c6ddd055e2` = debug panel cache-bust.
- `97c99cb22dfff6f037f1597fae3a5025225f0481` = Settings diagnostics toggle introduced.
- `d0977f9a5823ab13701d7d04254e4e48b947bd45` = chain runtime v2.4.5 performance patch.
- `28e3ad5e01f4b4e5f61dab8cb97f44bdcce978a0` = previous known TEST head before the later fast-handoff commit sequence.
- `6d9aa53d54d71f1eef5e355e8290479ea271ba60` = `perf: fast chain handoff for books and maps`.
- **Latest head at this handoff:** `64fee0a85a7fe00b96fa1cf98ee8d8ebc6165f93` = `perf: make map chain selection atomic on context publish`.

A new handoff-document commit may follow if this file is created after the latest code commit. Always inspect the branch HEAD before further work.

---

## 4. The biggest historical failure: shared surface ownership

A shared global variable was once used by generic context reference authority to decide which surface owned the latest result:

```js
window.__JARVIS_LAST_CONTEXT_SURFACE__
```

Maps authority itself may still claim its surface using this variable and:

```js
window.__JARVIS_CONTEXT_SURFACE_OWNER__
```

That is okay inside Maps authority as a publication/ownership signal.

**Do NOT make the generic Context Engine depend on `__JARVIS_LAST_CONTEXT_SURFACE__`.**

That previous design made Maps stop responding because a stale/shared flag contaminated generic context routing.

Surface-specific authority must own its own decisions.

---

## 5. Maps architecture and known behavior

Primary Maps authority:

`jarvis-map-absolute-authority-v25.js`

Despite the filename, current implementation is **V27**.

Important behavior:

- Supports known Bhubaneswar places via local `P` data.
- Supports arbitrary cities through Photon geocoding.
- Category searches use the JARVIS Places Worker first, then Photon category fallback.
- Arbitrary-city category search is centered on the geocoded city.
- Current Delhi test successfully produced Delhi restaurants, for example:
  1. Embassy Restaurant (Samosa)
  2. Fa Yian The Chinese Restaurant
  3. National Restaurant
  4. Keshav Restaurant
  5. Parikrama - The Revolving Restaurant
  6. Neelam Restaurant

This proves the earlier Delhi regression was fixed.

### Maps result DOM contract

Rendered buttons are:

```html
<button type="button" class="place-result" data-jarvis-map-v27="0">...</button>
```

The attribute is zero-based while the visible ordinal is one-based.

For example:

```js
[data-jarvis-map-v27="4"]
```

means visible result #5.

### Maps context publication

Maps publishes context with:

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

and dispatches:

```js
jarvis:map-context
```

with `results`.

### Maps default-first-result behavior

The normal `render()` currently calls `show(page[0])` after rendering a page. This means a normal search can immediately show the first result's pin/frame.

For a chain such as:

> Show me restaurants in delhi and open the sixth one

the desired UX is NOT:

1. show/pin #1
2. wait
3. select #6

It should ideally be:

1. search Delhi
2. render the result set
3. atomically select/pin #6 before the user sees an intermediate #1 state

There is an atomic handoff mechanism intended to address this.

---

## 6. Maps chain helpers currently loaded

### `jarvis-map-ordinal-authority-v1.js`

Surface-specific ordinal authority.

It keeps a private `mapContext` from `jarvis:map-context` and can directly handle an ordinal if Maps owns the current surface.

Important safety checks:

- It refuses to act when another surface is clearly active.
- It checks current map context freshness.
- It avoids words like `youtube`, `video`, `ebook`, `book`, etc.
- It can click the actual map result card.
- If the DOM card is unavailable, it can directly pinpoint a stored result using lat/lon.

Do not remove this authority.

### `jarvis-chain-map-fast-select-v1.js`

Originally selected the requested result on `jarvis:map-context` using a DOM click.

It has now been updated to **V2** in commit:

`64fee0a85a7fe00b96fa1cf98ee8d8ebc6165f93`

Current V2 behavior:

- On `jarvis:command-chain`, detects a Maps first route and extracts the ordinal from the second clause.
- On `jarvis:map-context`, obtains the exact requested result from `event.detail.results[index]`.
- Instead of waiting for the DOM card to appear, it directly updates `#mapFrame` using the result's lat/lon.
- It updates Context Engine selected state.
- It emits a trace event for the fast selection.
- This is intended to eliminate the intermediate first-pin state.

Current V2 code is deliberately small and does not touch the core Maps authority.

### `jarvis-chain-map-atomic-handoff-v1.js`

Loaded in `index.html` before the punctuation bridge.

It listens for a chain whose first route is `MAP_POI` or `MAP_NAV` and temporarily applies:

```css
html[data-jarvis-chain-map-atomic="1"] #mapFrame {
  visibility:hidden!important
}
```

It reveals the frame after the final chain clause trace or after a 15-second safety timeout.

This is a UX guard against showing the wrong first pin while the chain completes.

**Important:** If the user still sees 20-30 seconds of delay, investigate the actual async search/publish timing. Do not simply increase the timeout.

---

## 7. Exact Maps regression that was fixed

The command:

> Showing restaurants in delhi and open the 5th one.

previously produced Bhubaneswar restaurants and selected the wrong item.

The first suspected cause was loose freshness matching:

```js
relatedQuery()
```

matched any overlapping token, so:

`restaurants in delhi`

could incorrectly match:

`restaurants in Bhubaneswar`

because both contained `restaurants`.

This was fixed by requiring the relevant location tokens to match.

But the screenshot then revealed an even more exact cause:

### Terminal punctuation broke chain parsing

The voice command contained:

```text
open the 5th one.
```

The chain action-ordinal regex expected `one` at end-of-string. The trailing period prevented the chain from being recognized.

Normal generic routing then received the full chain and stale Maps context leaked through.

This is why the punctuation bridge exists.

---

## 8. `jarvis-command-chain-runtime-fix-v1.js`

Current runtime chain implementation is **v2.4.5**.

Current file SHA before later changes:

`354b35c32f7eaa7f1c15f84ff94dace3e72b3898`

It defines:

```js
window.jarvisCommandChain = {
  version:'2.4.5',
  split,
  parse,
  run
}
```

### Important parser behavior

`clean()` strips terminal punctuation:

```js
.replace(/[.!?]+\s*$/,'')
```

and normalizes whitespace.

Chain separators support:

- `and`
- `then`
- comma
- comma + then

It supports action ordinals such as:

- first through twentieth
- thirtieth through ninetieth
- numeric ordinals
- cardinal words such as `one`, `two`, etc.

### Important chain flow

`run(parsed)`:

1. Sets `__JARVIS_COMMAND_CHAIN_RUNNING__`.
2. Resolves each clause.
3. First clause goes through surface-aware `first()`.
4. Follow-up context clause goes through `follow()`.
5. Before waiting for context, it tries `domTarget(nextClause,nextType,5000)`.
6. If DOM target succeeds, it continues immediately.
7. Otherwise it uses freshness waiting with a 5-second bound.

`domTarget()` can directly target:

- Maps: `[data-jarvis-map-v27="N"]`
- Books: `#jbe6Results .jbe6-book` and a read button
- YouTube: `#videoResults [data-jvc-id]`

This was designed to remove unnecessary context-engine waiting.

### Potential remaining performance issue

The chain runtime still calls `first()` for the first clause, and first-clause surface authorities may themselves have asynchronous network behavior.

Also, `domTarget()` polls up to 5 seconds at 50ms intervals. This is much better than 20 seconds but is still a possible source of latency if the actual result DOM is not produced promptly.

Do not blindly reduce this timeout. First determine whether the delay is:

- search/network
- render
- context publication
- reader text acquisition
- media player startup
- map iframe load

---

## 9. Punctuation bridge

File:

`jarvis-command-chain-punctuation-bridge-v1.js`

Purpose:

- Handles terminal punctuation on chain commands.
- Cleans `.` `!` `?` before passing through existing chain authority.
- Applies to submit and voice command paths.
- Only acts when a chain connector and action keyword are present.

Do not replace this with a broad command rewrite.

---

## 10. Debugger / diagnostics

Files:

- `jarvis-chain-debug-panel-v1.js`
- `jarvis-chain-debug-settings-v1.js`

Settings key:

```text
jarvis.chainDebug.enabled
```

The user requested the debugger to be available from Settings so it can be turned on only when needed.

### Zero-cost requirement

The debugger was initially problematic because merely hiding the panel still left event listeners attached and doing work.

It was then changed to true attach/detach behavior:

- OFF = no diagnostic listeners attached, panel removed.
- ON = diagnostic listeners attached.
- Settings toggle dispatches `jarvis:chain-debug-toggle`.

Do not regress this.

### Useful debug events

The panel can show:

- `RAW_VOICE`
- `RAW_SUBMIT`
- `DOM_INPUT`
- `DOM_AT_TRACE`
- `CHAIN_TRACE`
- `MANUAL_PARSE`
- `SPLIT_RESULT`
- `PARSE_RESULT`
- entity traces when available
- ebook context traces when available

A particularly useful screenshot showed:

```text
chainVersion: 2.4.5
chainRunning: true
```

and correct chain traces for:

```text
Show me restaurants in delhi
open the sixth one
```

with:

- clause 0 resolved as `MAP_POI`
- clause 0 dispatched true
- clause 1 resolved as `CONTEXT_FOLLOWUP`
- clause 1 dispatched true

That proved chain routing itself was functioning.

### First failed diagnostic clue

A screenshot showed:

```text
RAW_SUBMIT {value:"Show me restaurants in delhi and open the sixth one"}
```

but no chain trace.

Manual parser showed null / `chainVersion:null`.

Investigation found the original chain script had a JavaScript string/escaping problem in the split regex, so the entire chain script failed to parse. The runtime fix file was introduced as the working replacement.

Do not return to the broken original chain implementation without fixing its syntax first.

---

## 11. Books / ebook architecture

Primary files loaded by `index.html` include:

- `jarvis-ebook-book-fast-resolver-v1.js`
- `jarvis-entity-authority-v2.js`
- `jarvis-ebook-network-race-fix-v1.js`
- `jarvis-ebook-network-fast-v1.js`
- `jarvis-ebook-search-authority-v2.js`
- `jarvis-ebook-reader-v7.js`
- several ebook context/authority/stability modules

### Entity authority

Current entity authority file is `jarvis-entity-authority-v2.js`, version `3.4.0`.

It uses Gutenberg/Gutendex first and Wikidata as a fallback.

Important behavior:

- `candidate()` rejects explicit commands such as `search`, `find`, `play`, etc.
- It also rejects generic surface words such as books, ebooks, maps, youtube, restaurants.
- It resolves a book title or author using Gutenberg evidence.
- It publishes `window.__JARVIS_ENTITY__` and `window.__JARVIS_ENTITY_ROUTE__`.
- Book resolution can hand off to `jarvisEbookSearchAuthority.searchResolved()`.

### Ebook search race fix

`jarvis-ebook-search-authority-v2.js` was updated to version `20.6.1`.

The key change prevents background hydration from racing a chain:

```js
if(fallback.length){
  trace('RESOLVED_PRIMARY', ...);
  render(fallback,q);
  if(fallback.length<8&&!window.__JARVIS_COMMAND_CHAIN_RUNNING__)
    void search(q).then(...);
  return true;
}
```

This was important because the chain could otherwise be fighting a background search refresh.

### Earlier ebook bug

The fast resolver originally opened the Files/Ebooks surface before confirming the Gutenberg search result:

```js
const surfacePromise=openSurface();
const rows=await fetchFast(q);
```

That produced an empty query / blank result surface.

It was changed to:

1. fetch Gutenberg first
2. filter/confirm relevant rows
3. open the surface
4. hydrate/search the ebook UI

User explicitly tested this and said:

> Yeah worked perfectly.

Preserve that architecture.

---

## 12. Ebook reader latency

`jarvis-ebook-reader-v7.js` opens the reader shell quickly, then calls `loadBook(payload)`.

The slow portion is likely source acquisition / text extraction rather than the chain parser.

`loadBook()` does approximately:

```js
const raw = await sourceAcquire(id,title)
```

then extracts text and renders pages.

`jarvis-ebook-network-race-fix-v1.js` provides source acquisition with multiple Gutenberg/Jina candidates.

Known candidates include Gutenberg direct text endpoints and Jina text proxy endpoints.

Earlier fallback `fetchOne()` had a 9-second timeout per candidate.

The race-fix `fetchText()` currently uses a fetch with no explicit timeout in that layer. This is a likely place to investigate for intermittent 20-30 second reader waits.

### Recommended next investigation

Do not change the whole reader.

First instrument or inspect exact timing for:

1. chain ordinal detected
2. book card appears
3. READ click happens
4. reader shell appears
5. `sourceAcquire()` begins
6. first source resolves
7. text extraction completes
8. first page renders

The user specifically observed that the book list can appear and then the reader can take a long time to become useful. That points toward reader content acquisition, not search-list rendering.

A good future optimization may be **prefetching the selected book's text as soon as the requested book card is known**, but only after confirming this timing. Avoid speculative prefetch of every book.

---

## 13. YouTube / Media architecture

Primary media module:

`jarvis-live-media.js`

Backend endpoint:

```text
https://jarvis-media.shivashisvicky112.workers.dev/api/search
```

Search has a roughly 20-second AbortController timeout and may use cache.

Important function:

```js
autoPlayFirst(query)
```

roughly does:

```js
const items = await search(query);
player(items[0].id);
```

Media result cards are:

```text
#videoResults [data-jvc-id]
```

Clicking a card invokes the player immediately.

### User-observed latency

The user said:

> Video also same story, first list showed up and 20 sec later video played.

The current chain runtime already has a DOM-first media handoff:

```js
#videoResults [data-jvc-id]
```

and clicks the selected card as soon as it exists.

If the video still waits 20 seconds, likely causes are:

- the chain is not seeing the card quickly enough
- the selected card click is not the actual player-start path
- media search/cache logic blocks before cards are truly available
- player startup is itself waiting on an external resource

Inspect timing before modifying.

A useful next trace should distinguish:

```text
MEDIA_SEARCH_START
MEDIA_RESULTS_RENDERED
MEDIA_CHAIN_CLICK
MEDIA_PLAYER_START
MEDIA_PLAYER_READY
```

Keep this diagnostic behind the optional debugger.

---

## 14. Current `index.html` load order

Important current order around intelligence/context/chain:

```html
<script src="./jarvis-context-engine-v1.js?v=20260909-context-engine-v3-3-registry"></script>
<script src="./jarvis-context-memory-v1.js?v=20260826-context-memory-v2"></script>
<script src="./jarvis-map-ordinal-authority-v1.js?v=20260910-map-ordinal-owner-v1-7"></script>
<script src="./jarvis-book-reference-retry-v1.js?v=20260909-book-reference-retry-v5-map-owner"></script>
<script src="./jarvis-context-reference-authority-v1.js?v=20260910-context-reference-owner-first-v2-18"></script>
<script src="./jarvis-context-ordinal-extension-v1.js?v=20260910-ordinal-owner-v1-6"></script>
<script src="./jarvis-chain-debug-panel-v1.js?v=20260911-chain-debug-v2-0"></script>
<script src="./jarvis-chain-debug-settings-v1.js?v=20260911-debug-settings-v2"></script>
<script src="./jarvis-command-chain-runtime-fix-v1.js?v=20260911-command-chain-v2-4-5"></script>
<script src="./jarvis-chain-map-atomic-handoff-v1.js?v=20260911-map-atomic-v1"></script>
<script src="./jarvis-command-chain-punctuation-bridge-v1.js?v=20260910-chain-punctuation-v1"></script>
```

Later, among the core authority files:

```html
<script src="./jarvis-command-authority-v2.js?v=20260828-command-authority-v12"></script>
<script src="./jarvis-ebook-book-fast-resolver-v1.js?v=20260910-book-fast-resolver-v1-6-2"></script>
<script src="./jarvis-entity-authority-v2.js?v=20260909-entity-authority-v3-4-0-catalog-context"></script>
```

Later Maps/media/ebook files include:

```html
<script src="./jarvis-command-final-routing-v3.js?v=20260909-map-poi-claim-v12"></script>
<script src="./jarvis-youtube-command-authority-v1.js?v=20260910-youtube-surface-owner-v1"></script>
<script src="./jarvis-ebook-network-race-fix-v1.js?v=20260908-ebook-network-v4-race-early"></script>
<script src="./jarvis-ebook-network-fast-v1.js?v=20260911-ebook-network-fast-v1"></script>
<script src="./jarvis-ebook-search-authority-v2.js?v=20260911-ebook-search-v20-6-1-chain-race"></script>
<script src="./jarvis-ebook-reader-v7.js?v=20260908-ebook-reader-v11-coordinator-v2" defer></script>
```

Maps:

```html
<script src="./jarvis-map-absolute-authority-v25.js?v=20260905-map-arbitrary-city-v27"></script>
<script src="./jarvis-chain-map-fast-select-v1.js?v=20260911-map-fast-select-v1"></script>
```

If a file is changed, bump its query-string cache key.

---

## 15. Known good user tests

### Maps

This works:

```text
Show me restaurants in Delhi and open the sixth one
```

and equivalent punctuation form:

```text
Show me restaurants in Delhi and open the sixth one.
```

Expected:

- Delhi restaurants, not Bhubaneswar.
- Sixth visible result selected.
- No stale previous Maps context.

Also tested conceptually:

```text
Show me restaurants in Jagannath Nagar and open the third one
```

This eventually worked correctly before performance optimization.

### Books

Examples used:

```text
Beowulf and open the fifth one
```

and direct ebook/entity resolution tests.

Books were functional after the fast resolver race fix.

### YouTube

Example pattern:

```text
Play Oggy and open/play the sixth one
```

The original bug was that a YouTube ordinal could open a book because stale Books context won the ordinal fallback. Surface-owner routing fixed this.

---

## 16. Current known problem to solve next

The current user screenshot shows the debugger over the Files surface after:

```text
Beowulf and open the fifth one
```

The debug trace showed the chain parser correctly recognized:

```text
parts: ["Beowulf", "open the fifth one"]
```

and the first clause was not a MAP route. This is a useful clue for the next Books latency investigation.

A separate Maps screenshot showed:

```text
restaurants in delhi
```

with correct Delhi results, but the user says the requested ordinal selection still takes time.

The key question is now **where the 20-30 seconds are actually spent**.

Do not assume it is the chain parser.

---

## 17. Recommended next debugging plan

### Step A: Verify latest deployment

Before any new test, inspect TEST branch HEAD and Actions. The latest known code commit before this handoff-document update is:

`64fee0a85a7fe00b96fa1cf98ee8d8ebc6165f93`

Do not tell the user to test until the corresponding deployment is green.

### Step B: Measure, don't guess

With debugger enabled, add optional timing markers for exactly these stages:

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

All timing instrumentation must be disabled and detached when diagnostics are OFF.

### Step C: Only optimize the slow segment

Examples:

- If Maps `MAP_RESULTS_RECEIVED` is slow, optimize search/geocode race.
- If Maps results are instant but `MAP_FAST_SELECT` is delayed, fix event ordering.
- If Books READ click is instant but `SOURCE_ACQUIRE` takes 20 seconds, optimize reader transport.
- If YouTube card click is instant but player starts 20 seconds later, inspect media player/network path.

---

## 18. Strong recommendation for future performance design

The final desired architecture is:

```text
VOICE / SUBMIT
      ↓
CHAIN PARSE
      ↓
FIRST SURFACE SEARCH
      ↓
RESULT SET AVAILABLE
      ↓
ATOMIC ORDINAL HANDOFF
      ↓
OPEN / PIN / PLAY / READ REQUESTED ITEM
```

The chain should not wait for a generic context engine if the surface already has the actual result set.

Surface-specific result sets are the authoritative source for ordinals.

This is especially important because generic context can be stale or shared across surfaces.

The ideal user experience is:

```text
"Show me restaurants in Delhi and open the sixth one"

Search Delhi → result list appears → #6 selected
```

not:

```text
Search Delhi → #1 flashes → generic context waits → #6 appears 20 seconds later
```

Similarly:

```text
"Beowulf and open the fifth one"

Resolve Beowulf → ebook cards appear → #5 read action starts
```

and:

```text
"Search Oggy and play the sixth one"

Media results appear → #6 player starts
```

---

## 19. Things that should NOT be changed casually

### Do not remove

- `jarvis-map-ordinal-authority-v1.js`
- `jarvis-context-ordinal-extension-v1.js`
- `jarvis-context-reference-authority-v1.js`
- `jarvis-command-final-routing-v3.js`
- `jarvis-youtube-command-authority-v1.js`
- ebook entity authority
- ebook resolved handoff / search authority
- ebook network race fix
- punctuation bridge
- optional debugger settings architecture

### Do not do

- broad rollback to `main` or the stable baseline
- pipeline edits to solve JS behavior
- global context ownership flags consumed by every surface
- hardcoded Delhi/Bhubaneswar routing
- hardcoded ordinal item names
- waiting 20 seconds merely because a previous implementation did
- background searches that race an active chain
- opening an ebook surface before the requested entity/search has been resolved

---

## 20. User preferences for this engineering work

The user wants:

- less talk, more implementation
- careful, surgical changes
- TEST first
- deployment verification before testing
- no `main` changes
- no unnecessary rewrites
- preserve working behavior while enhancing it
- quirky/fun tone is okay, but engineering communication should stay direct

Most importantly, the user has experienced repeated regressions from broad changes. Treat every working feature as something to protect.

---

## 21. Current status summary for next agent

**FUNCTIONALITY:** 🟢 Core chain functionality works.

**Maps Delhi routing:** 🟢 Correct Delhi result set confirmed.

**Maps ordinal:** 🟢 Functionally works, but latency/atomic visual behavior still needs verification.

**Books entity/search:** 🟢 Functional after fast resolver and chain-race fixes.

**Books reader:** 🟡 Intermittent / potentially slow content acquisition remains.

**YouTube/media:** 🟡 Functional, but user reports delayed playback after result list.

**Chain parser:** 🟢 v2.4.5 runtime replacement is working.

**Terminal punctuation:** 🟢 Fixed.

**Debugger:** 🟢 Optional via Settings and intended to be zero-cost OFF.

**Pipeline:** 🟢 Automatic deployment, do not modify.

**`main`:** 🟢 Must remain untouched.

**Latest code commit before this document:** `64fee0a85a7fe00b96fa1cf98e8d8ebc6165f93`.

**Next task:** measure the exact 20-30 second latency segment and optimize that segment only.

---

## 22. Final handoff instruction

Start by reading this document, then inspect the actual current TEST branch HEAD and the relevant files before writing code.

Do not trust an old summary over the live branch.

If the latest user test reports a regression, first identify whether it is:

1. parser/routing,
2. surface result acquisition,
3. context publication,
4. ordinal selection,
5. reader/media/map rendering,
6. external network/player latency.

Only then patch the responsible layer.

The project is finally in a good functional state. **Enhance it, don't rebuild it.**
