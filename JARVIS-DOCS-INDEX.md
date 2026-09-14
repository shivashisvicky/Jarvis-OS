# J.A.R.V.I.S. OS — Documentation Index

**Last updated:** 2026-09-14

This index is intentionally small. A new AI agent should start with `JARVIS-AI-START-HERE.md`, then use the documents below according to the task.

## Start here

| Document | Purpose |
|---|---|
| `JARVIS-AI-START-HERE.md` | Mandatory first read for a new AI agent. Current project contract and verified anchors. |
| `JARVIS-ARCHITECTURE.md` | Architectural ownership, invariants, deployment boundaries and recovery rules. |
| `JARVIS-FUTURE-ROADMAP-2026.md` | Long-term product direction, priorities, new modules and cross-module experiences. |
| `JARVIS-BASELINES.md` | Protected recovery anchors and behavioral baseline rules. |
| `JARVIS-CHANGELOG.md` | Chronological engineering decisions and recent changes. |
| `JARVIS-OS-TEST-HANDOFF.md` | Detailed TEST continuation history and subsystem behavior. |

## Specialized handoffs

| Document | Purpose |
|---|---|
| `JARVIS-IMAGE-TEST-HANDOFF-20260914.md` | Vision Lab TEST architecture and provider/deployment boundaries. |
| Spatial-specific handoff(s) | Spatial 3D architecture, known-good desk behavior, geometry, selection and precision rules. Read before changing Spatial. |
| Context/Books handoffs | Reader, entity, command-chain and context continuity details. Read before changing Books/Context. |

## Current verified contracts

### TEST/PROD

- TEST development: `test/jarvis-intelligence-next`
- PROD: `prod/2026-09-06-stable`
- `main`: production source
- Never promote solely because CI is green.

### Spatial

Known-good behavioral reference:

`c3f0a455becc20231211ed52877f778a153be64c`

### Vision

User-verified on 2026-09-14:

- faithful Enhance preserves 4032×2268 dimensions and framing;
- Save works on iPhone;
- faithful Enhance uses `/api/enhance` and Cloudflare Images;
- generative Edit/Generate remain separate.

## Documentation maintenance rule

Whenever a significant change is made, update at least:

1. the relevant subsystem handoff;
2. `JARVIS-BASELINES.md` if a new behavioral baseline is verified;
3. `JARVIS-CHANGELOG.md` for an architectural/engineering decision;
4. `JARVIS-AI-START-HERE.md` only when the durable project contract changes;
5. `JARVIS-FUTURE-ROADMAP-2026.md` when priorities or future architecture change.

Do not turn the documentation into a diary. Record **decisions, contracts, verified behavior, known failures, and exact recovery information**.
