# J.A.R.V.I.S. OS — Documentation Index

**Last updated:** 2026-09-14

This index is intentionally small. A new AI agent should start with `JARVIS-AI-START-HERE.md`, then use the documents below according to the task.

## Start here

| Document | Purpose |
|---|---|
| `JARVIS-AI-START-HERE.md` | Mandatory first read for a new AI agent. Current project contract and verified anchors. |
| `JARVIS-ARCHITECTURE.md` | Architectural ownership, invariants, deployment boundaries and recovery rules. |
| `JARVIS-FUTURE-ROADMAP-2026.md` | Long-term product direction, priorities, future modules and cross-module experiences. |
| `JARVIS-BASELINES.md` | Protected recovery anchors and user-verified behavioral baselines. |
| `JARVIS-CHANGELOG.md` | Chronological engineering decisions and recent changes. |
| `JARVIS-OS-CHAT-HANDOFF.md` | Short continuation pointer for a new ChatGPT conversation. |
| `JARVIS-OS-TEST-HANDOFF.md` | Deep TEST continuation history and subsystem behavior. |

## Specialized handoffs

| Document | Purpose |
|---|---|
| `JARVIS-IMAGE-TEST-HANDOFF-20260914.md` | Vision Lab architecture, faithful Enhance contract, generative separation and iOS Save behavior. |
| `JARVIS-SPATIAL-TEST-HANDOFF-20260914.md` | Spatial 3D architecture, known-good desk behavior, geometry, selection and precision rules. |
| `JARVIS-OS-TEST-HANDOFF-2026-09-13-SPATIAL-ADDENDUM.md` | Additional Spatial history and regression context. |
| `JARVIS-REGRESSIONS.md` | Historical regression ledger and lessons. |

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
- meaningful object placement remains intact;
- Save works on iPhone;
- faithful Enhance uses `/api/enhance` and Cloudflare Images;
- generative Edit/Generate remain separate on `/api/image`.

## Documentation maintenance rule

Whenever a significant change is made, update at least:

1. the relevant subsystem handoff;
2. `JARVIS-BASELINES.md` if a new behavioral baseline is verified;
3. `JARVIS-CHANGELOG.md` for an architectural/engineering decision;
4. `JARVIS-AI-START-HERE.md` only when the durable project contract changes;
5. `JARVIS-FUTURE-ROADMAP-2026.md` when priorities or future architecture change;
6. `JARVIS-OS-CHAT-HANDOFF.md` when the continuation state changes materially.

Do not turn documentation into a diary. Record **decisions, contracts, verified behavior, known failures, and exact recovery information**.
