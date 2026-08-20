# JARVIS OS 3.0 acceptance contract

## Command navigation
- `give me directions to GGP Colony` must open Maps and execute the destination search.
- Directional commands must not stop at merely opening the Maps module.

## News
- Only the 3.0 News authority may load the live news desk.
- A failed provider must produce a bounded degraded state, not repeated requests or console storms.
- Category changes and refresh must replace the current cards cleanly.

## Media
- Desktop layout presents the player and result queue side-by-side.
- Selecting a result and pressing the visible PLAY control use the same playback authority.
- A video must open in the in-shell YouTube player without requiring a click in the center of the iframe.

## Regression rule
- Build, unit tests, browser smoke, live media extraction/playback, and deployed feature gates must be green before promotion.
