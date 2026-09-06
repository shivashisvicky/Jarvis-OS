# J.A.R.V.I.S. OS Continuation Checkpoint

**Last updated:** 2026-09-06
**Purpose:** Session-to-session engineering handoff. Read this before continuing work on Jarvis OS.

## STOP POINT: current stable baseline

The current repository is `shivashisvicky/Jarvis-OS` on `main`.

**Stable user-verified commit:** `6010a558da5cb14894a46880ed7c2c6c35e2699f`

**Protected rollback branch:** `baseline/2026-09-06-stable-reader`

This state was manually verified by the user after the latest deployment. It is the preferred rollback target. Do not restart diagnosis from older August baselines unless forensic comparison requires it.

## What is working together at this checkpoint

### Ordinal context

All three surfaces are required to work simultaneously:

1. **Books:** `Beowulf` or another book query -> `open/read/show the third one` opens the third current Gutenberg result.
2. **Maps:** a multi-result query such as restaurants in a city -> `open/show the third one` acts on the third current map result.
3. **YouTube/Video:** a video search -> `open/show/play the third one` acts on the third current media result.

The critical architectural rule is **domain-first ordinal ownership**. A stale selected UI surface must not steal an ordinal from the currently active domain.

### Reader

Reader v11 is the canonical reader. It currently provides live Gutenberg text retrieval, page splitting/pagination, chapter/section detection, Previous/Next controls, page jump, retry and official Gutenberg handoff.

Reader presentation is separate from reader behaviour. The current reader polish gives the reader body a fitted sans-serif/iOS-friendly treatment and gives the reader subject/title a bold treatment. This is cosmetic only.

## Current active stack

`index.html` currently activates, among other protected modules:

- Context engine v3.
- Context memory v2.
- Context reference authority v31.
- Command authority v12.
- Entity authority v3.3.
- Command intelligence v2.
- Conversation choice authority v10.
- Context intelligence v5.
- Deterministic command authority v6.
- YouTube command authority v2.
- YouTube gesture fix v5.
- Ebook network race fix v1.
- Ebook authority v2.5.
- Ebook command authority v11.
- Ebook search authority v20.1.
- Resolved Ebook handoff fix v1.
- Ebook text transport v2.
- Ebook reader v11 live fix.
- Ebook stability v3.2.
- Map authority v27.
- Voice response authority v4.

The live media module also persists actual rendered YouTube results into context so ordinal references can resolve against the live media result set.

## Important implementation facts

### Ebook context

`jarvis-ebook-search-authority-v2.js` remembers rendered Gutenberg results as `BOOKS` context. The current result set is therefore the source of truth for `read/open the first/second/third one`.

### Media context

`jarvis-live-media.js` publishes the rendered YouTube result list as `MEDIA` context. This is required for cross-surface ordinal ownership and must not be allowed to permanently overwrite a newer Books context.

### Ordinal authority

`jarvis-context-reference-authority-v1.js` v2.12.0 uses domain-first ordering:

- active `MAPS` domain gets map ordinal ownership first;
- active `MEDIA/VIDEOS/VIDEO/YOUTUBE` domain gets media ordinal ownership first;
- otherwise the Books context is resolved;
- selected surface is only a fallback, not a stronger authority than the live domain.

This ordering was introduced specifically because a stale selected surface previously caused YouTube ordinals to fall into Books, and subsequent media fixes could then make Books ordinals stop working. The current implementation is intended to solve both directions without breaking either surface.

## Recent commits leading to the stable state

- `195817852e3aeb12455bbffcc4620ffff16b2225` - preserve BOOKS context across entity resolution.
- `67909830479f111038a6878aab7cf296dd8b3880` - prevent duplicate Gutenberg results while preserving reader authority.
- `d07f7a0fdeafb963c39f79edce949ec36972e63c` - restore full Gutenberg result surface and author ranking.
- `84139b2daf761bd7c9c9acc451cae8a49fa4795f` - cache-bust entity ebook handoff fix.
- `9fe6d1456d50441bba28ff2c4533ef4275b09580` - expand single-result ebook handoff without disrupting resolved context.
- `265ff6f6ffd494018a4812ae6bc76002a441cd82` - persist live YouTube result context.
- `8551b37fadee9b659cb23d34bb331e12039d2726` - cache-bust live media context fix.
- `f6b2cd265436984a6170c7654acdc1dcd3e98a05` - restore cross-surface map/media ordinal ownership.
- `004e913a03f0831c718051c098ad9b5f8b69553c` - make ordinal ownership domain-first across Books, Maps and Video.
- `868be71f04f45ff884f6f0ef888fcea206d2c5aa` - activate/cache-bust context-reference authority v31.
- `1297e50a2ad9a8146a8d1c68ac4c0b9f3be41360` - isolated reader typography and bold reader title/subject presentation.
- `6010a558da5cb14894a46880ed7c2c6c35e2699f` - cache-bust reader typography CSS.

## Known historical failures and lessons

### Do not repeat the V20 Ebook race

Earlier Ebook search authority V20 performed a second remote Gutenberg search before using entity-resolved results, introducing an asynchronous race in entity -> Books -> reader handoff. Resolved results should be rendered deterministically when already available.

### Do not fix one ordinal surface by blocking another

The Books/Maps/Video ordinal stack is a synchronized dependency graph. Do not add a broad `blockingDomains` rule, stale selected-surface preference, or global media interception that can steal an ordinal from another active domain.

### Do not resurrect older reader versions

The current canonical reader is v11. Older reader implementations are historical references only. Do not replace v11 with an older reader merely because an old test once passed.

### Do not casually reintroduce map followup code

The current `index.html` does not load the historical `jarvis-map-followup-authority-v1.js`. Maps currently rely on the active map authority/context-reference path. Do not add the historical followup module without evidence that the current map ordinal path is failing.

## Safe engineering workflow

1. Start from the current stable baseline, not an old parent commit.
2. Identify the exact owner of the failing behaviour.
3. Change the smallest possible surface.
4. Do not mix cosmetic work with routing/context work.
5. Push one logical change.
6. Wait for its Actions result before deciding the next code change.
7. If a regression appears, compare against `6010a558da5cb14894a46880ed7c2c6c35e2699f` and revert rather than stacking speculative patches.
8. Preserve the three-way ordinal contract after every functional change: Books + Maps + YouTube.

## Manual smoke test before declaring a future baseline

At minimum verify:

- Book search and `open the third one`.
- Map multi-result search and `open the third one`.
- YouTube/video search and `open/play the third one`.
- Reader opens, text loads, page counter is populated, pagination works.
- Chapter/section selector works.
- Reader title/subject remains bold and body typography remains consistent.
- Close returns to the expected surface.
- Existing voice, Time Now, Command Center and unrelated routes remain intact.

## Baseline qualification

The 2026-09-06 state is **user-verified functional**. At the time it was recorded, GitHub Actions had not yet exposed a workflow run for the typography cache-bust commit. Do not misrepresent this as CI-certified. If CI later reports a regression, investigate the exact job and use the protected baseline branch for rollback.

## Golden rule for future agents

**Do not make the next chat rediscover the last four days.** Read this file, read `JARVIS-BASELINES.md`, then inspect the current code at the protected baseline before proposing changes. Preserve working behaviour first, then improve one isolated thing at a time.
