# J.A.R.V.I.S. OS Continuation Checkpoint

**Last updated:** 2026-08-28
**Purpose:** Session-to-session engineering handoff. Read this before continuing work on Jarvis OS.

## Current baseline

The current working repository is `shivashisvicky/Jarvis-OS` on the default branch.

Latest engineering work is focused on **ebook intelligence / Gutenberg routing and reader reliability**. The most recent push was intended to fix a Gutenberg network race and ebook reader source failures.

### Latest commits

- `3c4ff4918265304e67b640b9e3528a52c0d31537` - latest push. Ebook network/race and reader-path fix, with index loading configuration corrected/retained.
- `85978e7690f66daf85b57bfedf9f8ef9ee30e2e6` - `Fix Gutenberg ebook network race and reader source`.

## What was already working before this checkpoint

- Command Center internet search routing is working for queries such as "search the internet for black or blue".
- Books are generally recognized/routed as an ebook domain, rather than being treated as an arbitrary keyword.
- Gutenberg book listing infrastructure exists.
- Voice functionality on iOS was restored and duplicate voice-response issues have had dedicated fixes.
- YouTube command routing/playback work has been iterated and is separate from the current ebook task.
- Maps, News, weather, command authority, context/reference authority, entity authority and other Jarvis subsystems have dedicated patches in the repository. Avoid regressing these while fixing ebooks.

## Ebook problem being worked on

Observed failures included:

1. Searching **Beowulf** did not reliably produce ebook results.
2. Searching **John Henry Newman** did not reliably produce ebook results.
3. Searching both terms could remain idle instead of opening/activating the Ebooks surface.
4. Initial ebook loading could take roughly a minute and then appear to start working later, indicating a race/timing/network problem.
5. `READ IN JARVIS` previously failed or the reader remained at a loading state such as `1 / …`.
6. Gutenberg itself has valid listings for the affected books, so the issue is Jarvis routing/network/source handling, not absence of the books.

## Latest fix details

The latest implementation introduced a network/race mitigation around Gutenberg/Gutendex and improved the reader's source retrieval path. The reader now has fallback source candidates including Gutenberg text endpoints and Jina-backed retrieval where appropriate.

Important existing files/components include:

- `jarvis-ebook-authority-v2.js`
- `jarvis-ebook-command-authority-v1.js`
- `jarvis-ebook-reader-v3.js`
- `jarvis-ebook-stability-v1.js`
- `jarvis-ebook-library-v2.js`
- `jarvis-ebook-compat-v1.js`
- `jarvis-ebook-network-race-fix-v1.js`

`index.html` currently loads the ebook authority/command/reader/stability modules and the ebook library/compat modules. Preserve this loading order unless there is a demonstrated reason to change it.

## Critical next step

**Do not assume the latest ebook fix is successful until CI/live testing confirms it.**

Next engineer/session should:

1. Check the newest GitHub Actions run for commit `3c4ff4918265304e67b640b9e3528a52c0d31537`.
2. If CI fails, inspect the exact failing job/test and fix only the relevant regression.
3. If CI passes, manually test at minimum:
   - `Beowulf`
   - `John Henry Newman`
   - a combined/multi-term ebook query
   - `READ IN JARVIS`
   - reader pagination / close / retry
4. Verify that opening the Ebooks tab is immediate and does not sit idle.
5. Verify no regressions in Command Center, voice, Maps, News, YouTube and Time Now.

## Engineering rule for continuation

Treat the latest verified green build as the **best baseline**. Do not stack speculative fixes on top of a failing or unverified build. For every push, record the commit SHA, what changed, the failing symptom it targets, and the resulting Actions status here.

## Session continuity note

When starting a new chat, use this file as the first project handoff document. The goal is to continue from the latest verified Jarvis state rather than restarting diagnosis from scratch.
