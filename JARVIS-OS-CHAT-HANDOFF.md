# JARVIS OS Chat Handoff

> Purpose: use this file when a JARVIS conversation reaches its context limit. It is a durable continuation pointer, not a replacement for subsystem handoffs.

## Current project state

- Repo: `shivashisvicky/Jarvis-OS`
- Active development: `test/jarvis-intelligence-next`
- PROD: `prod/2026-09-06-stable`
- `main`: production source; never use it as an experiment branch.
- TEST URL: `https://shivashisvicky.github.io/Jarvis-OS/test/`
- User tests primarily on iOS Safari.

## Mandatory first reads

1. `JARVIS-AI-START-HERE.md`
2. `JARVIS-ARCHITECTURE.md`
3. `JARVIS-BASELINES.md`
4. `JARVIS-FUTURE-ROADMAP-2026.md`
5. `JARVIS-DOCS-INDEX.md`
6. Relevant subsystem handoff.

## Non-negotiable engineering behavior

- Never modify PROD/main for TEST work.
- Never call a deployment green without checking Actions.
- Never assume green CI means behavioral correctness.
- Prefer small, reversible changes.
- Identify the authoritative owner before editing.
- Do not stack global interceptors to solve local failures.
- Do not casually roll back to historical commits.
- Cache-bust changed browser assets in `index.html`.
- Preserve user-verified behavior.

## Current verified feature state

### Maps

Maps has surface-specific authority and result-set/ordinal handling. Preserve the rule that fresh Maps-owned results outrank stale generic context. Known regression history includes Delhi location freshness and terminal punctuation in chain commands.

### Books / Reader

Books/Reader has mature entity, Gutenberg, context and reader handoff logic. Preserve exact BookRecord/Gutenberg identity across the search-to-reader handoff. Do not create a second Reader owner or let background hydration race an active command chain.

### Media / YouTube

Media search and ordinal follow-ups are part of the protected cross-surface behavior. Avoid unrelated routing changes when fixing other surfaces.

### Voice

Voice is an explicit lifecycle authority. Do not tie speech activation to text submission. Success/error/timeout/cancellation paths must release recognition/microphone state and return the UI to idle.

### Spatial 3D

Known-good behavioral reference:

`c3f0a455becc20231211ed52877f778a153be64c`

User-verified desk behavior includes creation and follow-up move/resize/material/rotate/delete commands. Later TEST work added deterministic desk fallback, selection/precision resizing, torus/lathe geometry, bicycle, motorcycle and curved-object support.

Read `JARVIS-SPATIAL-TEST-HANDOFF-20260914.md` before changing Spatial.

### Vision Lab

As of 2026-09-14 the user has verified:

- faithful Enhance;
- exact 4032×2268 output for a 4032×2268 source;
- preserved framing/composition;
- working iPhone Save.

Architecture:

```text
Enhance -> /api/enhance -> Cloudflare Images
Edit/Generate -> /api/image -> isolated TEST Workers AI
```

Do not merge these paths.

Read `JARVIS-IMAGE-TEST-HANDOFF-20260914.md` before changing Vision.

### Engineering Bay

Legacy Engineering Bay Image Intelligence has been retired from the visible TEST surface because Vision Lab is the canonical image-intelligence surface. Underlying legacy code was intentionally not deleted yet.

## Product direction

JARVIS is evolving toward one intelligent operating environment rather than a launcher of mini-apps.

The most important future primitives are:

- Command
- Context
- Result Set
- Action

The most important future experiences are cross-module continuity, e.g. Maps result -> task, Vision result -> file, Books -> voice, or a Spatial object -> follow-up manipulation.

Do not optimize for feature count. Optimize for continuity of intent.

## Current roadmap priority

### P0

- unified command lifecycle;
- unified result-set/context contract;
- cross-surface ordinal framework;
- command observability;
- regression gate.

### P1

- deepen Maps, Books/Reader, Media, Vision and Spatial;
- validate remaining Vision modes;
- stabilize current Spatial matrix;
- improve voice lifecycle.

### P2

- Personal Memory/Knowledge;
- Workbench/Tasks;
- Automations/Watchers;
- intelligent Files;
- Device/Remote control;
- camera/vision awareness;
- unified personal dashboard.

See `JARVIS-FUTURE-ROADMAP-2026.md` for the detailed plan.

## How to continue after context loss

Start with:

```text
Continue JARVIS OS from JARVIS-AI-START-HERE.md.
Read JARVIS-ARCHITECTURE.md, JARVIS-BASELINES.md and JARVIS-FUTURE-ROADMAP-2026.md first.
Inspect the current TEST branch and GitHub Actions state before changing anything.
Preserve user-verified behavior and never touch PROD/main unless explicitly requested.
```

Then inspect the relevant subsystem handoff before acting.
