# J.A.R.V.I.S. OS Continuation Checkpoint

**Last updated:** 2026-08-29
**Purpose:** Session-to-session engineering handoff. Read this before continuing work on Jarvis OS.

## Current state

Repository: `shivashisvicky/Jarvis-OS`, branch: `main`.

### Frozen golden baseline

`ede622c6e7f35dbd67f2007806122116d724dcb5`

This is the verified 2026-08-29 Ebook/Gutenberg baseline. **Do not touch the Ebook path while fixing another subsystem.**

Verified in the deployed build:

- Beowulf search/listing works.
- John Henry Newman can resolve to a readable Gutenberg edition.
- `READ IN JARVIS` opens the reader.
- MP3/audio Gutenberg records are excluded from ebook results.
- Gutenberg 404 records are excluded before reader rendering.
- Ebook search and reader handoff are stable.

## Completed tracks

- JARVIS OS 3.0 foundation.
- Command/authority consolidation and compatibility cleanup.
- Generic entity intelligence for people/books without hardcoding specific names.
- Ebook/Gutenberg search, readable-edition selection, audio filtering, 404 filtering and reader handoff.
- Maps, News and Media hardening from the earlier 3.0 track.
- iOS voice path restoration and protection from unrelated Ebook changes.

## Active roadmap

The next major track is **3.0 Shell / Intelligence migration**. Work one issue at a time, in this order:

1. Context/result references and action/result chaining
2. Entity continuity and ambiguity handling
3. Media
4. News
5. Maps
6. API Lab
7. SFTP / Files
8. Terminal

Ebook is frozen unless a new reproducible Ebook regression is reported.

## One issue → one fix

This is the governing engineering rule:

1. Select exactly one reproducible issue.
2. Inspect the current source/deployed behavior.
3. Make the smallest targeted change.
4. Push exactly that change.
5. Wait for CI/deployment validation.
6. Manually verify the reported symptom.
7. Freeze the result if it becomes the new best baseline.

No speculative bundles, broad refactors, cache-only fixes, or unrelated cleanup in the same change.

## Current next issue

**Result reference: numbered selection (`open result 2`, `open result 3`, `open number 2`).**

The reference authority already recognizes numbered-reference syntax, but its fallback resolver currently maps only first/second/third/one/two/three. The next code change must make the existing numbered contract actually resolve the requested result, without changing Ebook search, reader behavior, voice, Maps or other routing.

## Protected behavior

During unrelated work, do not alter:

- Ebook/Gutenberg
- Voice/iOS
- Time Now
- Maps
- News
- YouTube/Media
- Command Center
- Games
- Notes/Calculator
- Core shell navigation

If a protected subsystem regresses, stop and treat it as a separate issue.

## Tracker hygiene

Historical/duplicate experiments are not active roadmap work. Completed issues/PRs should be closed. GitHub open items should represent real pending work only.

## Next-session instruction

Read this file and `JARVIS-BASELINES.md` first. Continue from the golden baseline and work only on the current single issue. Do not restart Ebook diagnosis from historical symptoms unless a new regression is observed.
