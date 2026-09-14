# JARVIS Spatial TEST Handoff — 2026-09-14

## Mission

Continue JARVIS Spatial work conservatively. The user tests primarily on iPhone/Safari and expects production-grade behavior. **Never fix one Spatial behavior by destabilizing another working behavior.** TEST only unless the user explicitly requests promotion to PROD.

Repository: `shivashisvicky/Jarvis-OS`
Branch: `test/jarvis-intelligence-next`
TEST URL: `https://shivashisvicky.github.io/Jarvis-OS/test/`

Known-good Spatial baseline: `c3f0a455becc20231211ed52877f778a153be64c`

The user explicitly validated that baseline for:
- desk creation;
- make desk 20% wider;
- move monitor slightly left;
- make legs black;
- rotate monitor 15 degrees;
- delete monitor.

Do not casually roll back to the baseline because later non-Spatial project work would be lost. Use it as the behavioral reference.

## Non-negotiable rules

1. Do not modify `main`/PROD during TEST work.
2. Inspect the current TEST code before changing it.
3. Prefer a small additive patch over rewriting mature Spatial modules.
4. Preserve existing desk creation, follow-up modification, Maps, Books, YouTube, Context and Reader behavior.
5. Every browser-loaded JS change requires a cache-bust in `index.html`.
6. Verify the actual TEST deployment before asking the user to test. Never call a deployment green without Actions success.
7. If a regression appears, identify the responsible layer from traces before changing code.
8. Do not broaden a targeted fix into a general router/context rewrite.
9. The user wants exact, deterministic engineering, not speculative refactors.

## Spatial architecture

```text
User command
  -> Spatial command bridge
  -> Engineering Bay / Spatial lifecycle
  -> Spatial AI loader
  -> local Spatial planner / intelligence gateway
  -> JSON scene plan
  -> local Three.js primitive renderer
```

Core files:
- `jarvis-engineering-spatial-command-bridge-v1.js`
- `jarvis-engineering-spatial-lifecycle-v1.js`
- `jarvis-engineering-spatial-ai-v1.js`
- `jarvis-engineering-spatial-ai-v1-safe-loader.js`
- `api/openai-intelligence.js`

Patch layer currently relevant to Spatial:
- `jarvis-engineering-spatial-semantic-patch-v1.js`
- `jarvis-engineering-spatial-command-center-patch-v1.js`
- `jarvis-engineering-spatial-geometry-patch-v1.js`
- `jarvis-engineering-spatial-precision-patch-v1.js`
- `jarvis-engineering-spatial-curved-objects-patch-v1.js`
- `jarvis-engineering-spatial-motorcycle-patch-v1.js`

Current index cache-bust versions include:
- semantic `v4`
- command center `v3`
- geometry `v2`
- precision `v4`

## Enter / ASK JARVIS behavior

The Spatial Command input is `#jbaiCommand` and the button is `#jbaiRun`.

Enter must behave exactly like ASK JARVIS. The proven safe pattern is a single delegated `keydown` handler that:
- only handles Enter on `#jbaiCommand`;
- calls `preventDefault()`;
- calls `stopImmediatePropagation()`;
- calls `#jbaiRun.click()`.

Do NOT add document keydown + keypress + keyup + beforeinput handlers. A previous over-engineered implementation caused one bicycle command to execute twice, producing `sceneCount:62` from a 31-operation bicycle.

## Selection

Objects in the Spatial viewport are now clickable. Selection is viewport/raycast based and updates the existing selected-object state.

Expected UX:
- tap/click an object in the viewport;
- it becomes the selected object;
- commands containing `selected`, `current`, or `it` may operate on that selected object.

Do not introduce a second selection authority.

## Precise selected-object resizing

The intended operation is:

```json
{
  "op":"resizeSelected",
  "delta":{"height":-0.020}
}
```

for `Make the selected leg 20mm shorter`.

Percentage form:

```json
{
  "op":"resizeSelected",
  "percent":{"height":-0.20}
}
```

for `Make the selected leg 20% shorter`.

Rules:
- `shorter/taller` changes height only.
- `thinner/thicker` changes width and depth only.
- `wider/narrower` changes width only.
- `deeper/shallower` changes depth only.
- Preserve unrelated dimensions.
- Preserve position unless an attachment anchor requires a controlled position correction.
- If the selected object is a leg, shortening must keep the **top of the leg attached to the tabletop**. In the Y-up coordinate system, reducing leg height requires moving the leg center upward by half the height reduction; increasing leg height moves its center downward by half the increase.
- Do not reinterpret “selected leg” as another leg or as the whole desk.

A previous implementation shortened the leg but moved the wrong anchor, leaving it floating. The current precision patch contains a leg-aware anchor correction.

## Important user-command interpretation

The user's command:

> `Make the selected leg 20% shorter`

is valid and should not be rejected as bad wording.

The earlier failure produced a plan similar to:

```json
{
  "op":"resizeSelected",
  "percent":{"height":-0.2}
}
```

but the geometry anchor was wrong. The command itself was correct.

## Desk creation regression

Observed TEST regression:

```text
Create a desk
```

returned:

```text
JSON Parse error: Expected '}'
```

with `sceneBefore:0` and `sceneCount:0`.

This was not a selection problem. It occurred during Spatial plan acquisition/parsing.

The user previously had a working desk implementation. Do not make the user change the wording to compensate.

### Current targeted desk protection

Commit `e305e59779f9c26d4f8c42c6919905529a44ea09` adds a deterministic local fallback inside the already-loaded precision patch for **simple desk-only requests** such as:
- `Create a desk`
- `Build a desk`
- `Make a desk`

It creates exactly five semantic parts:
- one wooden tabletop: 1.20m × 0.05m × 0.60m;
- four metal legs: 0.05m × 0.70m × 0.05m;
- legs are positioned so their top faces attach to the underside of the tabletop.

This fallback only intercepts simple desk creation. Detailed desk requests must continue through the normal Spatial planner.

Do not expand this fallback casually to every furniture word. If another simple assembly needs deterministic handling, diagnose it first.

## Curved-object behavior

Simple requests for bowl, wine glass, glass, lampshade, plate and cup have a dedicated curved-object path using lathe geometry. Do not replace these with generic cylinders.

Example: a bowl should be a rotationally symmetric open curved body, not a cylinder.

## Bicycle behavior

Bicycle work is TEST-only and intentionally isolated. A simple bicycle uses torus tires plus semantic frame members, fork, handlebar, seat, crank/pedals and hubs/spokes. A previous double-submit bug was identified by `sceneBefore:31` followed by `sceneCount:62`.

Do not modify bicycle geometry while fixing desk/selection unless the evidence directly points there.

## Intelligence gateway

`api/openai-intelligence.js` uses Gemini for Spatial planning. Spatial prompts request JSON only and use `responseMimeType:'application/json'`.

The renderer supports box, cylinder, sphere, cone, torus and lathe through the patch/loader architecture.

Important: the browser endpoint is the configured intelligence Worker. A repository edit to `api/openai-intelligence.js` is not automatically proof that the deployed Worker changed. Do not claim a gateway fix is live unless the actual deployment path confirms it.

## Diagnostic interpretation

Useful trace fields:

```text
ENGINE_CALL query:"..." sceneBefore:N
ENGINE_RETURN success:true/false sceneCount:N normalized:true/false
```

Examples:
- `sceneBefore:0` + `sceneCount:5` = a normal fresh five-part desk.
- `sceneBefore:31` + `sceneCount:62` for one bicycle = duplicate execution, not a 62-part planner.
- `sceneCount:0` + JSON parse error = plan acquisition/parsing failed before scene application.

Always distinguish:
1. command routing;
2. selection;
3. planner JSON;
4. plan validation;
5. geometry application;
6. viewport rendering.

Do not repair layer 6 when the trace proves the failure is layer 3.

## Current TEST changes after the known-good Spatial baseline

The cumulative TEST diff contains targeted Spatial patches for:
- object routing keywords such as wardrobe/shelf/bicycle;
- Spatial Gemini mode;
- stronger semantic assembly planning;
- semantic selected-object operations;
- bicycle geometry;
- viewport selection;
- precise selected-object resizing;
- curved objects;
- motorcycle work;
- Enter/ASK JARVIS parity.

Keep all of these isolated from mature non-Spatial surfaces.

## Mandatory test matrix after Spatial changes

At minimum, test in this order:

1. `Clear Scene`
2. `Create a desk`
3. tap a leg to select it
4. `Make the selected leg 20% shorter`
5. verify the leg remains attached to the tabletop
6. `Make the selected leg 20% thicker`
7. verify width/depth change only
8. create a fresh desk and test `Make the selected leg 20mm shorter`
9. create a bicycle and press iPhone Return once
10. create a bowl
11. create a wine glass

For every command, inspect the trace before changing code.

## Golden principle for the next AI

**Do not infer that a natural-language command is wrong merely because the implementation failed. First determine whether the command, planner, operation contract, geometry transform, or anchor math is wrong. Preserve the user's intent and repair the smallest responsible layer.**

The user's highest priority is stability: **never submit a change that compromises an already-working feature.**
