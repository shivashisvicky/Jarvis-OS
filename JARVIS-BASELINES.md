# J.A.R.V.I.S. OS Baselines

## Historical known-good reference

`f6b43298ff823dc0420ba6cbdce9274afba7baab`

Use this as a comparison point. Do not casually reset the repository to it.

## Current best working reference

The user-confirmed stable Ebook/context behavior was restored before the ordinal follow-up change. The latest main commit is `efadc12ec24f01617b5a41dabd6a73d8cfe989f2` (`fix: sanitize malformed Gutenberg book titles in reader`).

This is **not yet a new baseline** because the relevant live Ebook/Entity gates have not been proven green on this exact head.

## Verified user-facing goals achieved

- Beowulf routes to the Ebook surface and can return the expected Gutenberg results.
- John Henry Newman routes through Ebook/author handling in the restored stable build.
- `open the third one` works against the preserved John Henry Newman result context.
- Reader pagination/content loading works in the restored stable build.
- Reader title/metadata sanitation is now isolated to the Ebook command/reader layer.

## Protected subsystems

Voice, Time Now, Maps, YouTube, News, Search Hub, Command Center, and unrelated domain routers are frozen boundaries for Ebook work. Any change touching them requires a demonstrated cross-domain regression and explicit documentation.

## Baseline rule

A commit becomes the new baseline only after the relevant live regression suite is green. A successful build or Pages deployment alone is not sufficient.

## Current status

- `f8f9ba7...` introduced the ordinal-context handoff but its live run `33514203915` was red in Ebook and Entity gates.
- `efadc12...` adds reader title sanitization only. A fresh live deploy/regression run is required before calling it stable.
