# JARVIS OS Chat Handoff

## Current state: 2026-09-01

Repo: `shivashisvicky/Jarvis-OS`
Deployment: GitHub Pages / `shivashisvicky.github.io`

The current work is tightly scoped to Ebook/Gutenberg reliability and conversational context. The user requires code/history comparison, narrow owner-local changes, GitHub push, CI observation, and no regressions in Voice, Maps, YouTube, Search, News, Time or Command Center.

## Stable behavior that must be preserved

- iOS voice input and spoken responses.
- No stuck orange microphone after commands.
- Maps routing/search.
- YouTube/media search.
- Search Hub query handling.
- News and Time commands.
- Command Center conversational routing.
- Beowulf Ebook routing/results.
- John Henry Newman Ebook/author routing.
- Ordinal follow-up context, including `open the third one`.

## Important historical lesson

Several Ebook attempts broke working behavior because fixes were layered as competing interceptors, default-result reconciliation ran after the requested search, or context was rediscovered instead of passed through. One particularly damaging regression removed voice responses while the Ebook route still appeared to work. Do not repeat that pattern.

## Current code/history anchors

- `4889f763...` restored Ebook search reconciliation authority.
- `f8f9ba7...` added resolved BookRecord passthrough for ordinal Ebook follow-ups.
- `efadc12...` added reader-only sanitation for malformed Gutenberg title/metadata markup.

## Actions evidence

Run `33514203915` was red for `f8f9ba7...` even though the build and several unrelated live gates passed. Ebook failed because of unstable result rendering/missing read controls and Entity failed Newman/Charles classification expectations. This is evidence for owner-local debugging, not evidence that the entire OS is broken.

## Current reader issue

Gutenberg transport markup has leaked into visible reader/title content in the past, including literal `$b`/`$i` fragments and source-envelope metadata. The latest code adds a scoped sanitation pass. It must be verified live before becoming a baseline.

## Working method

1. Inspect the exact current head and failing Actions job.
2. Compare against the last user-confirmed good revision.
3. Identify the first responsible owner.
4. Make one minimal change.
5. Push.
6. Wait for CI/live gates.
7. If red, inspect and continue from evidence rather than asking for another blind manual test.
8. Update the checkpoint/regression/changelog files with the exact goal, mistake, commit, and test result.
9. Only declare a new baseline when the relevant live suite is green.
