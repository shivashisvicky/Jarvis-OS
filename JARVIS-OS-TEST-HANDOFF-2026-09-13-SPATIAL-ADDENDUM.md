# J.A.R.V.I.S. OS TEST Handoff Addendum: Spatial Workbench

**Date:** 2026-09-13
**Branch:** `test/jarvis-intelligence-next`
**Scope:** Spatial / Engineering Bay only

This addendum records the exact state reached during the 2026-09-13 Spatial debugging session. Preserve the existing `JARVIS-OS-TEST-HANDOFF.md`; do not rewrite it wholesale.

## 1. Current observed state

The Spatial Workbench is currently loading and has been observed working again after deployment/reload. The successful visible scene contains:

- wooden rectangular tabletop
- four rectangular metal legs rendered as `box`
- lower shelf
- centered monitor assembly

The AI-generated dimensions are dynamic. The desk geometry is **not hardcoded**.

A successful creation produced `sceneCount:8` in the trace because the monitor is represented as two objects (`monitor_stand` and `monitor_screen`).

## 2. What was actually tested

### Initial creation

User tested:

`Create a 1200mm wide, 600mm deep and 750mm high office desk with a 30mm thick wooden tabletop, four metal legs, a lower shelf and a 27 inch monitor centered on top.`

Observed successful creation with rectangular legs.

### Follow-up: widen table

A follow-up changing the table width was observed to execute successfully, proving that at least some scene modification/persistence works.

### Follow-up: move monitor

A monitor move was not consistently reliable.

One successful attempt moved only the monitor screen. The intended semantic behavior is that `monitor_stand` + `monitor_screen` move together as one logical monitor assembly.

### Follow-up: make legs black

This produced:

`All configured intelligence providers are unavailable`

This is an intelligence/provider availability failure, not evidence that the leg geometry is wrong.

### JSON parsing

The Spatial path has intermittently produced:

- `JSON Parse error: Expected ']'`
- `JSON Parse error: Expected '}'`
- `JSON Parse error: Unable to parse JSON string`

These errors occurred at the AI/plan parsing boundary and must not be treated as solved merely because one creation succeeds.

## 3. Critical recovery lesson

Do **not** assume that a Git commit that looks like a baseline is an empirically stable runtime baseline.

The following sequence caused confusion:

- a cache-bust/lifecycle change appeared to restore the UI
- the browser then sometimes loaded an older/newer Spatial loader path
- a fragile safe-loader wrapper caused `SPATIAL_AI_SAFE_LOADER_ERROR` with `find variable 'target'`
- broad rollback attempts then restored states that still contained the JSON parsing problem

The safest reference is the **observed working runtime state**, not an inferred ancestor.

## 4. Protected Spatial recovery point

A dedicated baseline branch exists:

`baseline/spatial-workbench-leg-fix-2026-09-13`

Do not delete or repoint it casually.

Important: this branch is a **reference/recovery marker**, not proof that all follow-up behavior is certified.

## 5. Spatial dependency chain

Preserve this chain:

```text
Engineering command
  -> Spatial command bridge
  -> Engineering Bay
  -> Spatial lifecycle
  -> Spatial safe loader
  -> Spatial V1 engine
  -> intelligence endpoint
  -> Spatial plan
  -> normalization
  -> Three.js scene
```

Any future failure should first identify which boundary failed before changing code.

## 6. Known architecture details

### Spatial V1

`jarvis-engineering-spatial-ai-v1.js`

It exposes:

`window.jarvisSpatial.run`

and maintains the scene locally.

### Spatial lifecycle

`jarvis-engineering-spatial-lifecycle-v1.js`

Current TEST loader URL observed during recovery:

`./jarvis-engineering-spatial-ai-v1-safe-loader.js?v=20260913-spatial-v1-safe-loader-17`

The lifecycle waits for `window.jarvisSpatial.run` and emits readiness traces.

### Safe loader

`jarvis-engineering-spatial-ai-v1-safe-loader.js`

It performs compatibility normalization because older/AI-generated plans have used:

- `x/y/z` dimensions instead of `width/height/depth`
- material objects instead of material strings
- `cylinder` labels for rectangular geometry

A rectangular create operation labelled `cylinder` with width/depth dimensions should be normalized to `box` rather than rendered as a cylinder.

This normalization is **generic**. Never hardcode the 1200x600x750 desk into the engine.

## 7. Stable semantic plan reference

The previously observed valid desk plan had seven core creates:

1. tabletop
2. leg_front_left
3. leg_front_right
4. leg_back_left
5. leg_back_right
6. lower_shelf
7. monitor

An alternate AI response produced eight creates by splitting the monitor into:

- `monitor_stand`
- `monitor_screen`

That representation is acceptable only if the two objects are treated as a logical monitor assembly for later operations.

Do not force a fixed desk plan. The AI must remain responsible for requested dimensions and components.

## 8. Current follow-up roadmap

Do these in isolation, in this order, after confirming creation remains stable:

1. **Monitor assembly targeting**
   - `move the monitor` should move the stand + screen together.
   - Prefer semantic assembly/group identity over hardcoded object names where possible.

2. **Material follow-up**
   - `make the legs black` should target all four logical leg objects.
   - Provider failure must be distinguished from targeting failure.

3. **JSON boundary hardening**
   - Prefer a single validated Spatial plan contract between gateway and browser.
   - Avoid stacked `JSON.parse()` wrappers and fragile string-replacement patches.

4. **Only then** test broader modify/rotate/scale/delete behavior.

## 9. Regression firewall

For all future Spatial work:

- TEST only.
- Do not touch PROD unless explicitly requested.
- Do not modify Books, Maps, YouTube/Video, Context Engine, entity authority, or reader modules for a Spatial problem.
- If a change touches shared command routing, inspect its impact on those surfaces before committing.
- Every browser-loaded JS/CSS change requires a cache-bust update.
- Verify the GitHub Actions deployment before user testing.
- Never claim a follow-up feature is stable from one successful run.
- If a regression appears, stop and identify the responsible layer before rollback.

## 10. Most important handoff instruction

**The user values preservation over cleverness.** Make the smallest possible change, keep the observed-good creation path intact, and never replace a working generic AI-driven implementation with hardcoded desk-specific behavior.

The current goal is not to rebuild Spatial. It is to finish the remaining follow-up semantics without disturbing the already-working creation path or any other JARVIS surface.
