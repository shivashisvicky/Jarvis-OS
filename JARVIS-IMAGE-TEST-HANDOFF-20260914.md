# JARVIS Vision Lab TEST Handoff — 2026-09-14

## Mission
Add an isolated AI image workspace without modifying the production intelligence worker or Spatial 3D path.

## Safety boundary
- Branch: `test/jarvis-intelligence-next`
- Spatial 3D is frozen. Do not modify Spatial files while validating Vision Lab.
- Production intelligence worker remains untouched.
- Vision uses a separate TEST Cloudflare Worker: `jarvis-image-test`.
- Vision does **not** require Gemini billing. The current backend is Cloudflare Workers AI using `@cf/black-forest-labs/flux-2-klein-4b`.
- Cloudflare Workers AI currently provides 10,000 free Neurons per day on the Free Workers plan. Do not enable paid billing for Vision as part of this TEST work.

## User-facing feature
The JARVIS rail and home module surface expose **Vision Lab**.

Vision Lab supports:
- Enhance / Edit an uploaded JPG, PNG or WebP image.
- Generate an image from a text prompt.
- Presets: Enhance, Restore, Portrait, Product, Cinematic.
- Source images are resized client-side to below 512px on their longest dimension because FLUX.2 Klein 4B requires reference images smaller than 512x512.
- The requested output is generated at a larger normalized size, up to 1024px on the longest dimension.
- Result is kept in the browser as a data URL and can be saved locally.

Default enhancement behavior explicitly preserves subject identity, composition and important objects while improving detail, exposure, color, noise and compression artifacts.

## Architecture
```text
Vision Lab UI
  -> jarvis-image-studio.js
  -> isolated TEST worker /api/image
  -> Cloudflare Workers AI / FLUX.2 Klein 4B
  -> base64 image response
  -> browser preview / save
```

## Files
- `jarvis-image-shell-patch-v1.js`
- `jarvis-image-studio.js`
- `jarvis-image-studio.css`
- `workers/image-test/src/index.js`
- `workers/image-test/wrangler.toml`
- `.github/workflows/deploy-image-test.yml`

## Validation
1. Verify the Vision Worker workflow is green after the Cloudflare migration.
2. Open TEST and confirm a `Vision` rail item and `Vision Lab` home card appear.
3. Open Vision Lab.
4. Choose `Enhance / Edit`.
5. Upload a non-sensitive test image.
6. Use default `ENHANCE` preset and run `ENHANCE IMAGE`.
7. Confirm a result appears and `SAVE` works.
8. Test `GENERATE` with a simple prompt.
9. Test one edit such as `Make this a warm cinematic evening photograph while preserving the exact subject and composition.`
10. Regression-check Home, Maps, Books/Reader, Media and Spatial entry only. Do not perform Spatial modifications unless a regression is observed.
11. If Cloudflare reports the daily free allocation is exhausted, stop testing for the day. Do not upgrade billing.

## Important
- Do not put any provider API key in browser code.
- Do not point the Vision UI at the shared intelligence Worker.
- Do not promote the image worker to production as part of this TEST work.
- Keep Gemini support out of the active TEST path unless explicitly reintroduced as an optional future provider.
