# Next Phase: Context & Entity Memory v1

Goal: make JARVIS retain structured conversational context across a short command chain without changing working domain routers.

Examples:
- Show me restaurants in Jagannath Nagar -> remember domain/location/results
- Which one is nearest? -> resolve against remembered results
- Take me there -> resolve selected entity, canonicalize the place name, navigate
- Find Beowulf -> remember BOOK entity
- Open the first one -> resolve ordinal against remembered results

Guardrail: additive layer only. Do not rewrite stable map/search/media routers unless tests demonstrate a concrete regression.
