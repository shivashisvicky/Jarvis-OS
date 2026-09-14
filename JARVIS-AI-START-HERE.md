# J.A.R.V.I.S. OS — AI Agent Start Here

**Purpose:** This file is the first document a new AI agent should read before changing JARVIS OS. It is intentionally short enough to locate quickly and links the deeper project memory stored in the repository.

**Last updated:** 2026-09-14
**Repository:** `shivashisvicky/Jarvis-OS`
**Active development branch:** `test/jarvis-intelligence-next`
**TEST URL:** `https://shivashisvicky.github.io/Jarvis-OS/test/`

## 0. The rule above all rules

JARVIS is a serious, long-lived system. **Never fix one feature by casually breaking another.** Treat every existing user-verified behavior as a contract.

Before editing code:

1. Read this file.
2. Read `JARVIS-ARCHITECTURE.md`.
3. Read `JARVIS-BASELINES.md`.
4. Read `JARVIS-FUTURE-ROADMAP-2026.md`.
5. Read the most relevant subsystem handoff before touching that subsystem.
6. Inspect the current TEST branch, not an old chat snippet.
7. Identify the authoritative owner of the behavior.
8. Prefer the smallest reversible change.
9. Never use PROD/main as an experimental workspace.
10. Deploy TEST and verify the actual Actions run before asking the user to test.

## 1. Environment contract

- TEST: `test/jarvis-intelligence-next`
- PROD: `prod/2026-09-06-stable`
- `main`: production GitHub Pages source; do not experiment here.
- TEST deployment publishes beneath `/test/`.
- A green GitHub Actions run proves deployment/build success, not behavioral correctness.
- User testing is primarily on iOS Safari. Mobile timing, touch behavior and cache-busting are first-class concerns.
- Any browser-loaded JS/CSS change must receive an appropriate cache-bust update in `index.html`.
- Never expose provider API keys in browser code.

## 2. Product north star

JARVIS should feel like **one intelligent operating environment**, not a launcher containing unrelated mini-apps.

The user should be able to move naturally between capabilities:

```text
ask -> search -> see results -> refer to one -> open/use it -> continue talking
```

The user should not need to know which internal module owns the request.

The long-term differentiator is not the number of modules. It is **continuity of intent across modules while each module retains authoritative ownership of its own state**.

## 3. Current capability families

- Maps
- Books / Ebook search / Reader
- YouTube / Media
- Web/Search
- News
- Weather
- Calculator
- Notes
- Games
- Files
- API Lab / integration workspace
- Voice / command lifecycle
- Context Engine / ordinal follow-ups
- Engineering Bay
- Spatial 3D
- Vision Lab
- Settings / diagnostics

Treat these as capability surfaces, not isolated products.

## 4. Known behavioral anchors

### Spatial

User-verified known-good Spatial behavior is anchored at:

`c3f0a455becc20231211ed52877f778a153be64c`

Verified behavior included:

- Create a 1200mm × 600mm × 750mm office desk with 30mm tabletop, four metal legs, lower shelf and centered 27-inch monitor.
- Make desk 20% wider.
- Move monitor slightly left.
- Make legs black.
- Rotate monitor 15 degrees.
- Delete monitor.

Later TEST work added bicycle/curved-object/motorcycle/precision capabilities. Do not casually reset to the old anchor because later work may be lost. Use it as a behavioral reference.

### Vision

As of 2026-09-14, user has verified the Vision faithful Enhance path with a 4032×2268 source/result and confirmed Save works on iPhone.

Required Enhance contract:

- same dimensions
- same aspect ratio
- same framing
- same meaningful objects and positions
- conservative image-quality improvement
- no generative reconstruction

Enhance and generative Edit/Generate must remain architecturally separate.

## 5. Current Vision architecture

```text
Vision Lab UI
  -> jarvis-image-studio.js
  -> POST /api/enhance for faithful Enhance
  -> Cloudflare Images transformation

Vision Lab UI
  -> jarvis-image-studio.js
  -> POST /api/image for generative Edit/Generate
  -> isolated TEST Cloudflare Workers AI
```

Do not merge these paths again merely for convenience.

## 6. Current Spatial architecture

```text
User command
  -> spatial command bridge
  -> Engineering Bay / spatial lifecycle
  -> spatial intelligence gateway
  -> Gemini JSON plan
  -> safe loader / local Three.js renderer
```

Spatial is intentionally isolated. Selection, geometry, semantic assembly and deterministic fallbacks are layered. Do not rebuild the renderer to solve a narrow semantic or routing issue.

## 7. Context and chain invariant

A fresh surface-owned result set outranks stale generic context.

Do not make generic Context Engine routing depend on:

```js
window.__JARVIS_LAST_CONTEXT_SURFACE__
```

A surface may publish ownership/context signals for its own authority. Generic routing must not use those globals as a universal authority.

Desired chain:

```text
first command
 -> authoritative surface search/resolution
 -> result set exists
 -> exact ordinal/context reference
 -> atomic open/select/play/read
```

Avoid intermediate wrong-result flashes and duplicate dispatch.

## 8. Regression discipline

When something breaks:

1. Stop.
2. Capture the exact user command and visible symptom.
3. Identify the first failing layer.
4. Compare against the last user-verified behavior.
5. Inspect deployment/cache state.
6. Change only the responsible owner when possible.
7. Add a targeted regression check.
8. Deploy TEST.
9. Verify Actions.
10. Run the smallest relevant user test.
11. Re-test protected surfaces.
12. Document the result.

Do not respond to an intermittent bug by stacking more global interceptors, retries or command rewrites before identifying the failing boundary.

## 9. Definition of done

A feature is not done because code exists or CI is green.

It is done when:

- architecture is explicit;
- the authoritative owner is clear;
- the change is isolated;
- TEST deployment is green;
- user-visible behavior is verified;
- protected behavior has not regressed;
- the relevant handoff/baseline/changelog documentation is updated;
- the next agent can understand the decision without reconstructing the entire chat.

## 10. Read next

1. `JARVIS-ARCHITECTURE.md`
2. `JARVIS-BASELINES.md`
3. `JARVIS-FUTURE-ROADMAP-2026.md`
4. `JARVIS-OS-TEST-HANDOFF.md`
5. `JARVIS-IMAGE-TEST-HANDOFF-20260914.md`
6. The relevant subsystem-specific handoff before making a subsystem change.
