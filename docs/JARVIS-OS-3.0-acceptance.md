# JARVIS OS 3.0 acceptance contract

## Baseline protection
- The verified 2026-08-29 Ebook/Gutenberg baseline is `ede622c6e7f35dbd67f2007806122116d724dcb5`.
- Ebook changes are allowed only for a demonstrated Ebook regression.
- Unrelated changes must not alter Ebook, Voice/iOS, Time Now, Maps, News, Media, Command Center, Games, Notes/Calculator or core navigation.

## Command navigation
- `give me directions to GGP Colony` must open Maps and execute the destination search.
- Directional commands must not stop at merely opening the Maps module.

## Intelligence / context
- `open the first one`, `open the second one`, and `open the third one` resolve the active result context.
- `open result 2`, `open number 2`, and `open no. 2` resolve the requested result index when that result exists.
- Contextual references must remain domain-aware and must not steal explicit search/map/media commands.
- Missing or expired context must produce a controlled clarification rather than an unrelated action.

## Ebook / Gutenberg
- Beowulf and John Henry Newman return readable Gutenberg results.
- Audio/MP3/non-text records are excluded from ebook results.
- Gutenberg 404 records are rejected before they become reader targets.
- `READ IN JARVIS` opens the reader and reader pagination remains functional.

## News
- Only the 3.0 News authority may load the live news desk.
- A failed provider must produce a bounded degraded state, not repeated requests or console storms.
- Category changes and refresh must replace the current cards cleanly.

## Media
- Desktop layout presents the player and result queue side-by-side.
- Selecting a result and pressing the visible PLAY control use the same playback authority.
- A video must open in the in-shell YouTube player without requiring a click in the center of the iframe.

## Regression rule
- Build, unit tests, browser smoke, live-provider tests, and deployed feature gates must be green before promotion.
- Every change follows one issue → one fix → one push → one validation cycle.
