# J.A.R.V.I.S. OS Regression Ledger

## 2026-09-07: John Henry / Beowulf experimental-chain regression

### User-visible failure

After the experimental sequence culminating in Actions run `34113235306` / commit `a6885092d29f9bb077d87ef090ff03ea9a489548`, the user reported that Ebook behaviour became completely broken: neither **Beowulf** nor **John Henry Newman** worked reliably.

The run itself was green for build/deploy/URL verification. This is evidence that CI did not reproduce the behavioural failure, not evidence that the product was correct.

### Experimental sequence to preserve for forensic comparison

- `d41a803396ba0ee08849271f9c7a1dd8b638a73f` - persist exact selected book for ordinal follow-up.
- `2c698c6e1b3442c651a0af78185fb8ec68a47d5c` - make ebook ordinal handoff single-path.
- `7847704599d8943b0e056ae660b6bbd3539f5143` - activate ebook single-path handoff.
- `7a47daf4b55f4bde0d6fa820027f79783e73503d` - route entity-first clauses directly in command chains.
- `d64a4b80a7df675d2a289f7cebcea67da4d8f4f5` - activate chained entity handoff cache-busters.
- `32d81f7...` / `a688509...` - subsequent resolved-result/search/static-path experiments culminating in the broken deployment.

Preservation branches were created before further recovery work so these experiments remain available for comparison.

### Important diff finding

The final nine-commit experimental cluster after `d41a803...` changed only a narrow set of application files: `index.html`, command-chain, Ebook command authority, Ebook network race fix, Ebook search authority and Entity Authority. This makes a surgical recovery preferable to resetting unrelated historical work.

### Likely failure class

The strongest current hypothesis is an **ownership/race interaction**, not a random Gutenberg outage. In particular:

1. Search produces and stores a result set asynchronously.
2. Entity/context resolution can run on a different event path.
3. Command Chain v2.2 introduced a new first-clause dispatch path through `EntityAuthority.handle()` for entity candidates.
4. Ebook network v4 introduced a capture-phase `jarvis:context-followup` listener that can directly call `jarvisEbookReaderOpen()` and suppress the normal path.
5. Multiple layers therefore have authority over the same transition: resolve selection, warm source, and open Reader.

This is exactly the kind of duplicate execution path the architecture guardrails say to remove rather than patch around.

### Intermittency interpretation

There is not enough evidence to blame one literal source line as a confirmed root cause yet. The suspicious boundaries are:

- `jarvis-command-chain-v1.js`: `dispatchFirst()` / `runChain()` in v2.2.
- `jarvis-ebook-network-race-fix-v1.js`: the capture-phase `jarvis:context-followup` listener and its polling loop for `jarvisEbookReaderOpen`.
- `jarvis-context-engine-v1.js`: persistence of `selected` on `jarvis:context-followup`.
- `jarvis-context-reference-authority-v1.js`: dispatch of `jarvis:context-followup` after resolving a BookRecord.

A professional diagnosis should trace one command through these boundaries and record a correlation ID, context turn, domain, BookRecord/Gutenberg ID, and the first Reader-open call. Do not add another handler until this trace identifies which owner fires first and whether it fires twice.

### Recovery decision

Recover TEST to the mature `6010a558da5cb14894a46880ed7c2c6c35e2699f` tree rather than rolling back unrelated historical fixes. The recovered tree is the validation candidate, not automatically a new behavioural baseline.

### Minimal acceptance tests

After the recovered tree is actually deployed to TEST:

1. Search `Beowulf` and confirm the correct list.
2. Search `John Henry Newman` and confirm the author/book result path.
3. `open/read the third one` from each applicable result list.
4. Allow at most one retry for this recovery acceptance test.
5. Confirm Reader content and page count initialize.
6. Separately smoke Maps third-result and YouTube third-result only if shared context/authority code has changed.

## 2026-08-28 Ebook regression history

Earlier failures included Beowulf first-load no-results, stale/default Gutenberg results, intermittent `READ IN JARVIS`, blank Reader, `1 / …` without pagination, and John Henry Newman routing/open failures. A prior checkpoint reported Beowulf and Newman opening successfully after retries, with Newman taking roughly 20–30 seconds. That history is evidence that the user-visible contract can work and should not be replaced with a generic fallback design.

## Regression policy

Never change a test only to make it green. A green build/deploy is not sufficient. A behavioural baseline requires deployed verification. Prefer surgical removal of the first faulty owner over broad rollback. Preserve all unrelated fixes, branches, cache-busters and forensic commits.
