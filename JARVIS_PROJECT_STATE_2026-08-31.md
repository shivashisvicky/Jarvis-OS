# JARVIS OS PROJECT STATE / HANDOFF

Date: 2026-08-31
Repository: https://github.com/shivashisvicky/Jarvis-OS

## Purpose of this file
Persistent handoff for continuing Jarvis OS development in a new ChatGPT conversation. This records the current architecture direction, validated behavior, recent regressions, and the debugging rules agreed with the developer.

## Current product direction
Jarvis OS is a browser/PWA shell with an intelligence/command layer. The goal is not merely to add isolated commands, but to give Jarvis entity-aware, context-aware command authority without breaking already-working domains.

Core domains currently include:
- Home / shell intelligence
- Internet/web search, kept in-shell
- Media / YouTube search and playback
- Maps / place search and contextual follow-ups
- Gutenberg ebooks / ebook reader
- Voice bridge and spoken responses
- Gemini intelligence gateway
- Local media contract

## Important recent validated behavior
- Web search works in-shell.
- Video/media keyword extraction and browser playback gates have passed.
- Maps contextual follow-ups have worked in manual testing: commands such as "show me restaurants in Jagannath nagar" followed by "open the third one" can resolve against the active Maps result set. "take me to Jagannath nagar" also works as a direct place/navigation-style request.
- Follow-up selection can take some time but has worked for second/third/etc. results.
- Voice on iOS was restored in recent work.
- Gutenberg ebook deployment had previously passed its live gate, although the reader/content display had been reported as visually broken/frozen in manual testing.
- Entity Intelligence had previously passed before the latest regression.

## Latest CI state
Target run: GitHub Actions run 33315005559.

Successful jobs:
- Build Pages artifact
- Deploy production Pages
- Live / Media Search
- Live / In-Shell Web Search
- Live / Gemini Intelligence

Failed jobs:
- Live / Entity Intelligence
- Live / Home + News + Voice
- Live / Gutenberg Ebooks

This is significant because an earlier run (33309283055) had:
- Entity Intelligence: SUCCESS
- Gutenberg Ebooks: SUCCESS
- Home + News + Voice: FAILURE
- In-Shell Web Search: SUCCESS
- Media Search: SUCCESS
- Gemini Intelligence: SUCCESS

Therefore the latest failures are not evidence that the entire stack is broken. The build/deployment, web search, media, and Gemini paths remain green. The regression is concentrated in the live verification surfaces that depend on shared intelligence/entity/home/ebook behavior.

## Latest Maps-related code change
Recent change added a Maps-only follow-up authority loader to `jarvis-map-absolute-authority-v25.js`:
`./jarvis-map-followup-authority-v1.js?v=20260830-map-followup-v8`

The intended design was explicitly isolation-first: load the already-tested Maps follow-up authority from the Maps authority only, so central/search/media behavior remains untouched while enabling contextual Maps follow-ups such as "open the third one" and "take me there".

A recent diff also removed the old explanatory comment around exact-name mode. The actual named-search logic remains separate from category mode. Exact-name place/entity queries must NOT be treated as nearest/category searches.

## Key architectural rule going forward
DO NOT fix one failing gate by globally changing the command router, intent precedence, response bridge, or shared entity classifier unless the failing trace proves the shared component is the root cause.

Use domain-local authority first:
- MAPS owns Maps result context and Maps follow-ups.
- MEDIA owns media result context/playback.
- WEB owns web-search result context.
- EBOOK owns Gutenberg search/open/reader context.
- HOME/VOICE owns home response and speech lifecycle.
- ENTITY owns generic named-entity resolution only when no more specific domain has claimed the intent.

Specific-domain context must have precedence over generic entity interpretation for follow-ups.

## Debugging methodology agreed
No hit-and-trial patches.

For every regression:
1. Reproduce the exact failing gate.
2. Capture the actual assertion/error and relevant runtime trace.
3. Compare with the immediately preceding green run.
4. Diff only the code paths that changed between those runs.
5. Identify the shared dependency or authority boundary responsible.
6. Add a deterministic regression test/trace before changing behavior.
7. Make the smallest scoped fix possible.
8. Run the affected gate plus all previously-green neighboring gates.
9. Only then push/deploy.

Never assume that because multiple gates fail, multiple independent bugs exist. First look for a common dependency or common runtime artifact/configuration.

## Important regression pattern
The latest run shows a classic possibility: a Maps/entity authority change may have altered shared runtime initialization or authority precedence. However, this MUST be proven from the failing logs/traces before reverting or modifying anything. Do not blindly revert the Maps work because Maps itself has been manually validated.

The correct next investigation is to inspect the exact failure output for:
- Live / Entity Intelligence
- Live / Home + News + Voice
- Live / Gutenberg Ebooks

Then compare their first failing assertion and runtime state against the previous run where Entity + Gutenberg passed.

## Ebook-specific context
The user previously reported:
- Ebook search for Beowulf and John Henry Newman had failed even though Project Gutenberg lists those works.
- Ebook list could take around a minute to load and first search could fail before later starting to work.
- Ebook reader content/contents display had become messed up/frozen.
- There was concern that a freeze/reader rendering problem might be separate from command routing.
- A previous live Gutenberg gate had passed, so a green gate does not necessarily prove the manual reader UX is perfect.

Do not hardcode book names. The system needs entity-aware routing that can infer a book query from evidence/context rather than maintaining a Beowulf-specific exception.

## Maps-specific context
Useful intended interaction:
1. "Show me restaurants in Jagannath nagar"
2. Jarvis returns a result list.
3. "Open the third one"
4. Jarvis should resolve #3 from the active Maps result set, not run a fresh generic entity search.

Likewise, "take me there" should use the active selected Maps result where context exists.

A single place request such as "take me to Jagannath nagar" is fundamentally different from category search + follow-up. Keep direct named-place resolution separate from category-result context.

## CI interpretation rule
A green Build Pages artifact and Deploy job mean the generated site artifact is buildable/deployable, not that every runtime surface is behaviorally correct.

A failed live verification job should be treated as a behavioral contract failure until the actual assertion is inspected.

## New-chat continuation instructions
When starting a new conversation, first read this file and inspect the latest Actions run linked by the user. Then inspect the relevant source/diff and failing gate logs before making any code changes.

Current immediate objective:
- Diagnose run 33315005559 rigorously.
- Determine whether the new Maps follow-up authority caused a shared-runtime regression or whether the three failures have independent causes.
- Preserve all currently-green media, web, Gemini, and deployment behavior.
- Restore Entity Intelligence, Home + News + Voice, and Gutenberg without breaking Maps contextual follow-ups.
- Add regression coverage that prevents the same cross-domain breakage from returning.

## Baseline philosophy
Jarvis should gain authority by adding scoped intelligence, not by making the central router increasingly fragile. Every new capability must have an explicit ownership boundary and a deterministic fallback path.
