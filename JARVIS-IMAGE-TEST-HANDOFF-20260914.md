# JARVIS Vision Lab TEST Handoff — 2026-09-14

## Mission
Add an isolated AI image workspace without modifying the production intelligence worker or Spatial 3D path.

## Current status

**User-verified:** the faithful Enhance flow works and the Save button works on iPhone.

A 4032×2268 source was enhanced to 4032×2268 with the same 16:9 framing and meaningful object placement. The user explicitly confirmed that the saved result was obtained through the Save button.

This is the current behavioral baseline for Vision Enhance.

## Safety boundary

- Branch: `test/jarvis-intelligence-next`
- Spatial 3D is frozen while Vision is being validated.
- Production intelligence worker remains untouched by Vision work.
- Vision uses a separate TEST Cloudflare Worker: `jarvis-image-test`.
- No provider API key belongs in browser code.
- Do not promote the image worker to production as part of this TEST work.
- Do not merge faithful Enhance and generative Edit/Generate into one endpoint again.

## User-facing feature

Vision Lab exposes:

- Enhance / Edit uploaded JPG, PNG or WebP.
- Generate from a text prompt.
- Presets: Enhance, Restore, Portrait, Product, Cinematic.
- Save result locally.

## Architecture

### Faithful Enhance

```text
Vision UI
  -> jarvis-image-studio.js
  -> POST /api/enhance
  -> Cloudflare Images binding
  -> exact source width/height
  -> conservative transforms
  -> base64 image response
  -> browser preview
  -> Save
```

Enhance does **not** invoke the generative model.

The Worker reads source dimensions and applies conservative transformations while preserving the exact source dimensions. Current transforms are intentionally mild: sharpen, contrast and saturation adjustments. Do not make these aggressive merely to produce a larger visible difference.

### Generative Edit / Generate

```text
Vision UI
  -> jarvis-image-studio.js
  -> POST /api/image
  -> isolated TEST Workers AI
  -> FLUX.2 Klein 9B
  -> base64 image response
  -> browser preview
  -> Save
```

Generative paths are allowed to change pixels and scene content according to the requested operation.

## Important historical failure

The first Vision implementation used a shared `/api/image` route for both Enhance and generative Edit. A supposed Enhance result became a 1024×768 generative reconstruction even though the source was 1536×864.

The fix was architectural, not prompt tuning:

1. create `/api/enhance`;
2. force faithful processing by route identity;
3. remove the AI-binding dependency from Enhance;
4. send the original full-resolution source to `/api/enhance`;
5. preserve exact source dimensions;
6. keep `/api/image` exclusively for generative work.

Never regress to the shared-route model.

## Current browser state model

`jarvis-image-studio.js` keeps both:

- compressed reference image for generative Edit;
- original base64 + MIME type for faithful Enhance.

The original source dimensions are tracked as `sourceWidth` and `sourceHeight`.

Enhance payload must use:

```text
image = originalBase64
mimeType = originalMimeType
```

not the compressed generative reference.

## iOS Save

The Save button has been hardened after an earlier failure.

Historical failure:

- A dynamically loaded Save patch was introduced.
- The Vision shell then reported `Vision Save script failed to load` and the entire Vision Lab became unavailable.
- That separate loader dependency was removed.

Current rule:

**Do not introduce a separate dynamically loaded Save dependency for a small UX fix.** Keep Save behavior inside the existing Vision client path unless there is a compelling architectural reason otherwise.

User has now confirmed Save works on iPhone.

## Current important files

- `jarvis-image-shell-patch-v1.js`
- `jarvis-image-studio.js`
- `jarvis-image-studio.css`
- `workers/image-test/src/index.js`
- `workers/image-test/wrangler.toml`
- `.github/workflows/deploy-image-test.yml`
- `JARVIS-IMAGE-TEST-HANDOFF-20260914.md`

The temporary `jarvis-image-save-patch-v1.js` was removed. Do not recreate it casually.

## Provider boundary

The active generative provider is Cloudflare Workers AI using FLUX.2 Klein 9B in the isolated TEST Worker.

Faithful Enhance uses Cloudflare Images rather than Workers AI.

Do not add Gemini billing or move Vision onto the production intelligence provider as part of this work.

## Validation matrix

### Completed

- Vision Lab loads on iOS.
- Enhance route is isolated from generative route.
- 4032×2268 faithful Enhance preserves 4032×2268.
- Framing/composition remain intact.
- Save works on iPhone.

### Next tests

1. Enhance portrait photo.
2. Enhance landscape/architecture photo.
3. Enhance a smaller image and verify dimensions remain unchanged.
4. Restore an older/damaged image.
5. Test localized Edit such as removing one object.
6. Test Portrait.
7. Test Product with branding/text.
8. Test Cinematic.
9. Test Generate with simple and complex prompts.
10. Test mode switching and Clear/re-upload state on iOS.

For faithful Enhance, always verify:

```text
input dimensions == output dimensions
input aspect ratio == output aspect ratio
meaningful objects preserved
no crop/reframe
no silent generative fallback
```

For generative Edit/Generate, evaluate visual quality and requested semantic change rather than pixel identity.

## Deployment

Vision Worker deployment is independent of the Pages deployment.

After any Vision code change:

1. inspect the changed files;
2. run/verify the Worker Actions workflow;
3. verify its smoke tests;
4. verify TEST Pages deployment if browser code changed;
5. only then ask the user to test.

Never call a deployment green without checking Actions.

## Hard prohibitions

- Do not modify Spatial to fix Vision.
- Do not modify the production intelligence worker to fix Vision.
- Do not expose provider secrets in browser code.
- Do not merge `/api/enhance` back into `/api/image`.
- Do not silently add upscaling to faithful Enhance.
- Do not increase Enhance aggressiveness merely because the visual delta is subtle.
- Do not add global interceptors to solve a Vision-local bug.
