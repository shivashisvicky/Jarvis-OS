# JARVIS OS Chat Handoff

> Purpose: paste this file/link into a new ChatGPT conversation when the previous chat becomes too long. This is the working context for the Jarvis OS project, not a generic README.

## Project
- Repo: `shivashisvicky/Jarvis-OS`
- Deployment: GitHub Pages / `shivashisvicky.github.io`
- Current priority: preserve the stable cross-device baseline and make one controlled improvement at a time.
- User prefers actual code changes + GitHub push + CI verification, not repeated theoretical explanations.

## Stable baseline status
The app is currently in a good usable state across iOS, Android, Moto/Samsung, and Windows.

Confirmed working recently:
- App opens on iOS and Android without freezing at startup.
- Voice input works.
- Spoken JARVIS responses work on iOS after the latest voice lifecycle fix.
- Orange microphone/dynamic-island stuck state was fixed in the latest stable baseline.
- After a bad/noisy voice transcription, the app no longer permanently dies and can accept another command.
- Text field clears after commands.
- Videos/media search works.
- Books load correctly and without noticeable delays.
- Maps routing/search is working, although earlier UI glitches around the transient map view were fixed.
- `take me to Jagannath nagar` has worked in the stable baseline.
- `show me restaurants in Jagannath nagar` works.
- `what time is it` returns the correct written + spoken response.
- Conversational color-choice prompts such as `pick red or blue` / `black or blue` were improved so they no longer have to be exact hardcoded phrases.
- Search Hub query handling was fixed so phrases such as `search the internet for black or yellow` are treated as the intended query rather than searching for the literal phrase `the internet`.
- Search Hub returned relevant results for `cabs` after the last search fix.

## Important voice-history finding
There was a recurring iOS issue where:
- first voice command could produce a written response but no spoken response;
- typing one command manually could activate the speech path, after which voice responses worked;
- in some revisions the microphone remained active/orange and required a browser refresh.

The eventual stable fix was to treat voice/speech lifecycle as an explicit authority and preload the voice feature before the first microphone gesture, while correctly stopping recognition after each voice interaction. Do NOT regress this by tying speech activation to text submission.

A temporary activation/control button was experimented with. It proved useful for diagnosis but was not intended as the final UI. The stable baseline eventually worked without requiring the user to press that button.

## Voice/device observations
- iOS and Windows voices currently sound best.
- Samsung sometimes used a female voice; this may be Android/system persona/TTS selection rather than an app bug.
- Moto has shown different voices at different times.
- Do not add an in-app accent/speech-rate selector unless there is a strong technical reason. The current goal is stable global TTS behavior, not UI controls.

## Command routing philosophy
JARVIS should behave like an intent-aware assistant, not a pile of exact string matches.

Examples:
- `pick red or blue`
- `pick black or white`
- `black or yellow`
- `choose black or blue`

These should remain conversational Command Center interactions and should NOT fall through to Search Hub merely because wording changed slightly.

Search Hub should primarily handle actual web-search intent, e.g.:
- `search the internet for ...`
- `search the web for ...`
- `find ... online`

Do not route ordinary conversational requests to Search Hub as a fallback just because the parser is uncertain. Prefer Command Center conversational handling where the request is clearly non-search.

## Search Hub recent fix
The Search Hub previously produced unrelated results for `search the internet for black or yellow`, including Internet/WhatsApp/provider pages. The likely issue was query normalization/provider parameter handling.

The working direction is:
1. strip search wrapper language (`search`, `search the internet for`, `search the web for`, etc.)
2. send only the semantic query to the backend/search provider
3. preserve the selected provider identity in the UI
4. never let a backend fallback/source label overwrite the user's selected provider label

Do not casually rewrite the entire search stack. Keep changes isolated.

## Maps
Known earlier failure mode:
- voice command `take me to Jagannath nagar` displayed `opening map...`, briefly showed the map, then disappeared.
- a direct Maps page search was working correctly with Jagannath Nagar / Bhubaneswar and OpenStreetMap rendering.

Routing was subsequently fixed. Preserve the existing map behavior and do not regress it while changing Command Center routing.

## UI notes
- The floating `STOP VOICE` control can overlap lower content on some viewport sizes. This was observed as a small UI glitch, not a core functional failure.
- The command input field should clear after every submitted command so follow-up questions can be entered immediately.
- Avoid adding diagnostic controls to the final UI unless they are truly needed.

## Development strategy
The user explicitly wants a disciplined baseline strategy:
1. Freeze a known-good baseline.
2. Make one narrowly scoped change.
3. Push to GitHub.
4. Let GitHub Actions build/deploy.
5. Test on iOS first, then Android/Moto/Samsung/Windows where relevant.
6. If it fails, compare with the last known-good revision rather than stacking another speculative fix.
7. Never replace a stable subsystem with a broad rewrite just to solve one symptom.

## Current phase direction
The next work should improve command/intention handling and overall polish while preserving voice stability, search, maps, media, books, and cross-device startup.

The user has described the next phase as making JARVIS feel more furnished and less hardcoded, especially around conversational follow-ups and routing.

## Recent commits / useful evidence
- A recent stable search-related deployment successfully handled `cabs` in Search Hub.
- A recent voice lifecycle deployment successfully removed the persistent orange mic state and restored spoken responses without requiring a text command first.
- When a CI run fails, inspect the exact GitHub Actions job before making another change. Do not assume rate limiting or quota is the cause without evidence.

## How to continue in a new ChatGPT conversation
Start with:

`Continue JARVIS OS from JARVIS-OS-CHAT-HANDOFF.md. Treat the current GitHub main branch as the frozen baseline unless I explicitly say otherwise. Do not repeat old plans. First inspect the current repo/Actions state, then work on the next narrowly scoped fix.`

Then provide the newest failing GitHub Actions URL or screenshot if one exists.
