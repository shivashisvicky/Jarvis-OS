# Context & Entity Intelligence Phase Status

## Current status

The Context and Entity intelligence work has moved from scaffolding into the stable Shell / Intelligence track.

### Completed

- Context Reference Authority is deployed.
- Book result context can persist across surfaces.
- Generic entity resolution distinguishes people/books without hardcoded names.
- Gutenberg author evidence is routed to the ebook authority where appropriate.
- Ebook/Gutenberg is frozen at the verified 2026-08-29 baseline.

## Current next issue

Numbered result references are the next isolated fix:

- `open result 2`
- `open number 2`
- `open no. 2`

The authority recognizes the command forms, but the fallback resolver currently resolves only first/second/third and one/two/three. Fix only this contract, then validate before proceeding.

## Engineering rule

One issue → one fix → one push → one validation. Do not combine context, entity, ebook, voice, maps or visual changes in the same fix.
