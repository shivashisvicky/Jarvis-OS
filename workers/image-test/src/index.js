const ALLOWED_ORIGINS = new Set([
  'https://shivashisvicky.github.io',
  'http://localhost:5173',
  'http://127.0.0.1:5173',
]);

const MODEL = '@cf/black-forest-labs/flux-2-klein-9b';

function cors(origin) {
  const allowed = ALLOWED_ORIGINS.has(origin) ? origin : 'https://shivashisvicky.github.io';
  return {
    'Access-Control-Allow-Origin': allowed,
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Accept',
    'Access-Control-Max-Age': '86400',
    Vary: 'Origin',
  };
}

function json(data, status, origin) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json; charset=utf-8', ...cors(origin) },
  });
}

function decodeBase64(value) {
  const raw = String(value || '').replace(/^data:image\/[a-z0-9.+-]+;base64,/i, '');
  if (!raw || !/^[A-Za-z0-9+/=]+$/.test(raw)) throw new Error('Invalid image data');
  const binary = atob(raw);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

function outputImage(result) {
  const image = result?.image;
  if (!image) return null;
  if (typeof image === 'string') return image.replace(/^data:image\/[^;]+;base64,/i, '');
  if (image instanceof Uint8Array) {
    let binary = '';
    const chunk = 0x8000;
    for (let i = 0; i < image.length; i += chunk) binary += String.fromCharCode(...image.subarray(i, i + chunk));
    return btoa(binary);
  }
  return null;
}

async function runModel(env, { prompt, mode, image, mimeType, width, height }) {
  const form = new FormData();
  form.append('prompt', prompt);
  form.append('width', String(width));
  form.append('height', String(height));
  form.append('guidance', mode === 'edit' ? '2' : '3');
  if (mode === 'edit') {
    const bytes = decodeBase64(image);
    form.append('input_image_0', new Blob([bytes], { type: mimeType }), `source.${mimeType.split('/')[1] || 'jpg'}`);
  }
  const formResponse = new Response(form);
  const result = await env.AI.run(MODEL, {
    multipart: { body: formResponse.body, contentType: formResponse.headers.get('content-type') },
  });
  const data = outputImage(result);
  if (!data) throw Object.assign(new Error('Vision model returned no image'), { code: 'IMAGE_EMPTY' });
  return data;
}

async function runFaithfulEnhance(env, { image, mimeType }) {
  if (!env.IMAGES) throw Object.assign(new Error('Cloudflare Images binding is not configured'), { code: 'IMAGE_TRANSFORM_UNAVAILABLE' });
  const bytes = decodeBase64(image);
  if (bytes.byteLength > 20 * 1024 * 1024) throw Object.assign(new Error('Image is too large for faithful enhancement'), { code: 'IMAGE_TOO_LARGE' });
  const info = await env.IMAGES.info(bytes);
  if (!info?.width || !info?.height) throw Object.assign(new Error('Could not read source image dimensions'), { code: 'IMAGE_INFO_FAILED' });
  const format = mimeType === 'image/png' ? 'image/png' : mimeType === 'image/webp' ? 'image/webp' : 'image/jpeg';
  const result = (
    await env.IMAGES.input(bytes)
      .transform({ width: info.width, height: info.height, fit: 'contain', sharpen: 1.1, contrast: 1.03, saturation: 1.02 })
      .output({ format, ...(format === 'image/png' ? {} : { quality: 95 }) })
  ).response();
  const output = await result.arrayBuffer();
  let binary = '';
  const data = new Uint8Array(output);
  const chunk = 0x8000;
  for (let i = 0; i < data.length; i += chunk) binary += String.fromCharCode(...data.subarray(i, i + chunk));
  return { data: btoa(binary), mimeType: format, width: info.width, height: info.height };
}

function normalizeDimension(value, fallback) {
  const n = Number(value);
  if (!Number.isFinite(n)) return fallback;
  return Math.min(1920, Math.max(256, Math.round(n / 64) * 64));
}

export default {
  async fetch(request, env) {
    const origin = request.headers.get('Origin') || '';
    if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: cors(origin) });
    const url = new URL(request.url);
    if (url.pathname !== '/api/image' && url.pathname !== '/api/enhance') return json({ error: 'Not found' }, 404, origin);
    if (request.method !== 'POST') return json({ error: 'POST required' }, 405, origin);
    if (origin && !ALLOWED_ORIGINS.has(origin)) return json({ error: 'Origin not allowed' }, 403, origin);

    let body;
    try { body = await request.json(); } catch { return json({ error: 'Invalid JSON body' }, 400, origin); }

    const isEnhanceRoute = url.pathname === '/api/enhance';
    const mode = isEnhanceRoute ? 'edit' : (body?.mode === 'generate' ? 'generate' : 'edit');
    const operation = isEnhanceRoute ? 'enhance' : (body?.operation === 'enhance' ? 'enhance' : mode);
    const prompt = String(body?.prompt || '').trim();
    if (!isEnhanceRoute && !prompt) return json({ error: 'prompt is required' }, 400, origin);
    if (prompt.length > 1800) return json({ error: 'prompt is too long' }, 413, origin);

    const width = normalizeDimension(body?.width, 1024);
    const height = normalizeDimension(body?.height, 768);
    let image = '';
    let mimeType = 'image/jpeg';
    if (mode === 'edit' || operation === 'enhance') {
      image = String(body?.image || '');
      mimeType = String(body?.mimeType || 'image/jpeg').toLowerCase();
      if (!image) return json({ error: 'image is required for enhancement/edit mode' }, 400, origin);
      if (!/^image\/(jpeg|png|webp)$/.test(mimeType)) return json({ error: 'Unsupported image type' }, 415, origin);
      if (image.length > 28_000_000) return json({ error: 'Image is too large after encoding' }, 413, origin);
    }

    try {
      if (operation === 'enhance') {
        const result = await runFaithfulEnhance(env, { image, mimeType });
        return json({ ok: true, image: result, model: 'cloudflare-images-enhance', mode: 'enhance', provider: 'cloudflare-images', faithful: true }, 200, origin);
      }
      if (!env.AI) return json({ error: 'Vision AI binding is not configured', code: 'IMAGE_UNAVAILABLE' }, 503, origin);
      const data = await runModel(env, { prompt, mode, image, mimeType, width, height });
      return json({ ok: true, image: { data, mimeType: 'image/png' }, model: MODEL, mode, width, height, provider: 'cloudflare-workers-ai' }, 200, origin);
    } catch (error) {
      const code = String(error?.code || '');
      const message = String(error?.message || 'Vision generation failed');
      if (code === '3036' || /daily free allocation|used up.*10,000 neurons/i.test(message)) return json({ error: 'JARVIS Vision has reached today’s free Cloudflare AI allowance. Try again after the daily reset.', code: 'VISION_FREE_LIMIT' }, 429, origin);
      if (code === '5035' || /requires a Workers Paid plan/i.test(message)) return json({ error: 'The selected Vision model is not available on the current Cloudflare Free plan.', code: 'VISION_MODEL_PAID' }, 403, origin);
      if (/model agreement|terms/i.test(message)) return json({ error: 'Cloudflare requires the model terms to be accepted before Vision can use this model.', code: 'VISION_MODEL_TERMS' }, 403, origin);
      return json({ error: message, code: code || 'IMAGE_FAILED' }, 502, origin);
    }
  },
};