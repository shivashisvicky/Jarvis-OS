const ALLOWED_ORIGINS = new Set([
  'https://shivashisvicky.github.io',
  'https://jarvis-intelligence.shivashisvicky112.workers.dev',
  'http://localhost:5173',
  'http://127.0.0.1:5173',
]);

const GEMINI_MODEL = 'gemini-3.5-flash-lite';
const GEMINI_TTS_MODEL = 'gemini-3.1-flash-tts-preview';
const GROQ_MODEL = 'llama-3.3-70b-versatile';
const GEMINI_API = 'https://generativelanguage.googleapis.com/v1beta/models';
const INTERACTIONS_API = 'https://generativelanguage.googleapis.com/v1beta/interactions';
const INTELLIGENCE_PATHS = new Set(['/api/intelligence', '/api/openai-intelligence']);
const TTS_PATHS = new Set(['/api/tts', '/api/jarvis-tts']);

function corsHeaders(origin) {
  const allowed = ALLOWED_ORIGINS.has(origin) ? origin : 'https://shivashisvicky.github.io';
  return {
    'Access-Control-Allow-Origin': allowed,
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Accept, X-JARVIS-TTS-Mode',
    'Access-Control-Max-Age': '86400',
    Vary: 'Origin',
  };
}

function json(data, status, origin) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json; charset=utf-8', ...corsHeaders(origin) },
  });
}

function audio(bytes, origin) {
  return new Response(bytes, {
    status: 200,
    headers: {
      'Content-Type': 'audio/wav',
      'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
      'Accept-Ranges': 'bytes',
      'X-JARVIS-TTS': `${GEMINI_TTS_MODEL};mode=wav`,
      ...corsHeaders(origin),
    },
  });
}

function pcmToWav(pcm, sampleRate = 24000, channels = 1) {
  const bits = 16;
  const blockAlign = channels * bits / 8;
  const byteRate = sampleRate * blockAlign;
  const buffer = new ArrayBuffer(44 + pcm.byteLength);
  const view = new DataView(buffer);
  const write = (offset, value) => { for (let i = 0; i < value.length; i += 1) view.setUint8(offset + i, value.charCodeAt(i)); };
  write(0, 'RIFF');
  view.setUint32(4, 36 + pcm.byteLength, true);
  write(8, 'WAVE');
  write(12, 'fmt ');
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, channels, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, byteRate, true);
  view.setUint16(32, blockAlign, true);
  view.setUint16(34, bits, true);
  write(36, 'data');
  view.setUint32(40, pcm.byteLength, true);
  new Uint8Array(buffer, 44).set(pcm);
  return new Uint8Array(buffer);
}

function base64ToBytes(value) {
  const binary = atob(value);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

const SYSTEM = 'You are JARVIS, the intelligence layer of a personal operating system. Be concise, useful and truthful. Do not invent facts or sources. Prefer a direct answer followed by a short explanation or next action. Do not claim to have performed an action unless the application explicitly did it. For media requests, identify useful candidates or explain what to search; never fabricate video IDs.';

async function callGemini(query, apiKey) {
  const endpoint = `${GEMINI_API}/${GEMINI_MODEL}:generateContent?key=${encodeURIComponent(apiKey)}`;
  const response = await fetch(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      system_instruction: { parts: [{ text: SYSTEM }] },
      contents: [{ role: 'user', parts: [{ text: query }] }],
      generationConfig: { temperature: 0.2, maxOutputTokens: 700 },
    }),
  });
  const data = await response.json();
  if (!response.ok) throw Object.assign(new Error(data?.error?.message || 'Gemini request failed'), { status: response.status, provider: 'gemini' });
  const text = String(data?.candidates?.[0]?.content?.parts?.map(part => part?.text || '').join('') || '').trim();
  if (!text) throw Object.assign(new Error('Gemini returned no text'), { status: 502, provider: 'gemini' });
  return { text, model: GEMINI_MODEL, provider: 'gemini', grounded: false, sources: [] };
}

function ttsPrompt(text, rate) {
  const safeRate = Math.min(1.2, Math.max(0.8, Number(rate) || 0.92));
  const pace = safeRate < 0.87 ? 'deliberate and slightly slow' : safeRate < 0.97 ? 'calm and measured' : safeRate < 1.08 ? 'natural conversational' : 'brisk but clear';
  return [
    'You are the permanent JARVIS voice for a personal intelligence system.',
    'Use one consistent polished adult voice with restrained British English / neutral RP-style delivery.',
    'Deep, composed, intelligent, cinematic but natural. Crisp articulation, controlled breath, no exaggerated acting.',
    `Delivery pace: ${pace}. Target rate: ${safeRate.toFixed(2)}x.`,
    'Speak only the transcript. Do not add words, commentary, greetings, sound effects, or quotation marks.',
    `TRANSCRIPT:\n${text.slice(0, 6000)}`,
  ].join('\n');
}

async function streamGeminiTTS(text, rate, apiKey) {
  const response = await fetch(INTERACTIONS_API, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'text/event-stream',
      'x-goog-api-key': apiKey,
      'Api-Revision': '2026-05-20',
    },
    body: JSON.stringify({
      model: GEMINI_TTS_MODEL,
      input: ttsPrompt(text, rate),
      response_format: { type: 'audio' },
      generation_config: { speech_config: [{ voice: 'Kore' }] },
      stream: true,
    }),
  });
  if (!response.ok) {
    const detail = await response.text().catch(() => '');
    throw Object.assign(new Error(detail || `Gemini TTS stream failed with HTTP ${response.status}`), { status: response.status, provider: 'gemini-3.1-tts' });
  }
  return response;
}

async function callGeminiTTSFallback(text, rate, apiKey) {
  const response = await fetch(INTERACTIONS_API, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-goog-api-key': apiKey,
      'Api-Revision': '2026-05-20',
    },
    body: JSON.stringify({
      model: GEMINI_TTS_MODEL,
      input: ttsPrompt(text, rate),
      response_format: { type: 'audio', mime_type: 'audio/l16', delivery: 'inline' },
      generation_config: { speech_config: [{ voice: 'Kore' }] },
    }),
  });
  const data = await response.json();
  if (!response.ok) throw Object.assign(new Error(data?.error?.message || 'Gemini TTS request failed'), { status: response.status, provider: 'gemini-3.1-tts' });
  const encoded = data?.output_audio?.data;
  if (!encoded) throw Object.assign(new Error('Gemini TTS returned no audio'), { status: 502, provider: 'gemini-3.1-tts' });
  const sampleRate = Number(data?.output_audio?.sample_rate) || 24000;
  const channels = Number(data?.output_audio?.channels) || 1;
  return pcmToWav(base64ToBytes(encoded), sampleRate, channels);
}

async function searchGdelt(query) {
  const target = new URL('https://api.gdeltproject.org/api/v2/doc/doc');
  target.searchParams.set('query', query);
  target.searchParams.set('mode', 'artlist');
  target.searchParams.set('maxrecords', '12');
  target.searchParams.set('timespan', '3months');
  target.searchParams.set('format', 'json');
  target.searchParams.set('sort', 'HybridRel');
  const response = await fetch(target.toString(), { headers: { Accept: 'application/json' } });
  if (!response.ok) throw new Error(`GDELT search failed with HTTP ${response.status}`);
  const data = await response.json();
  const articles = Array.isArray(data?.articles) ? data.articles : [];
  return articles.slice(0, 10).map(article => ({
    title: String(article?.title || '').trim(),
    link: String(article?.url || '').trim(),
    source: String(article?.domain || 'GDELT').trim(),
    snippet: '',
    published: String(article?.seendate || '').trim(),
  })).filter(article => article.title && article.link);
}

async function callGroq(query, apiKey) {
  const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify({ model: GROQ_MODEL, temperature: 0.2, max_tokens: 700, messages: [{ role: 'system', content: SYSTEM }, { role: 'user', content: query }] }),
  });
  const data = await response.json();
  if (!response.ok) throw Object.assign(new Error(data?.error?.message || 'Groq request failed'), { status: response.status, provider: 'groq' });
  const text = String(data?.choices?.[0]?.message?.content || '').trim();
  if (!text) throw Object.assign(new Error('Groq returned no text'), { status: 502, provider: 'groq' });
  return { text, model: GROQ_MODEL, provider: 'groq', grounded: false, sources: [] };
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const origin = request.headers.get('Origin') || '';

    if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: corsHeaders(origin) });
    if (request.method === 'GET' && url.pathname === '/') {
      return json({ ok: true, service: 'JARVIS Intelligence Gateway', providers: { gemini: Boolean(env.GEMINI_API_KEY), groq: Boolean(env.GROQ_API_KEY) }, model: GEMINI_MODEL, tts: GEMINI_TTS_MODEL, ttsStreaming: true, search: 'gdelt' }, 200, origin);
    }

    if (request.method === 'GET' && url.pathname === '/api/search') {
      if (origin && !ALLOWED_ORIGINS.has(origin)) return json({ error: 'Origin not allowed' }, 403, origin);
      const query = String(url.searchParams.get('q') || '').trim();
      if (!query) return json({ error: 'q is required', results: [] }, 400, origin);
      if (query.length > 300) return json({ error: 'q is too long', results: [] }, 413, origin);
      try {
        const results = await searchGdelt(query);
        return json({ results, provider: 'gdelt', query }, 200, origin);
      } catch (error) {
        return json({ error: error?.message || 'Search failed', code: 'SEARCH_FAILED', results: [] }, 502, origin);
      }
    }

    if (!INTELLIGENCE_PATHS.has(url.pathname) && !TTS_PATHS.has(url.pathname)) return json({ error: 'Not found' }, 404, origin);
    if (request.method !== 'POST') return json({ error: 'POST required' }, 405, origin);
    if (origin && !ALLOWED_ORIGINS.has(origin)) return json({ error: 'Origin not allowed' }, 403, origin);

    let body;
    try { body = await request.json(); } catch { return json({ error: 'Invalid JSON body' }, 400, origin); }

    if (TTS_PATHS.has(url.pathname)) {
      const text = String(body?.text || '').trim();
      const rate = Number(body?.rate ?? 0.92);
      if (!text) return json({ error: 'text is required' }, 400, origin);
      if (text.length > 6000) return json({ error: 'text is too long' }, 413, origin);
      if (!env.GEMINI_API_KEY) return json({ error: 'Gemini API key is not configured', code: 'TTS_UNAVAILABLE' }, 503, origin);
      const forceWav = url.searchParams.get('format') === 'wav' || request.headers.get('X-JARVIS-TTS-Mode') === 'wav' || body?.stream === false;
      try {
        if (!forceWav) {
          const stream = await streamGeminiTTS(text, rate, env.GEMINI_API_KEY);
          return new Response(stream.body, {
            status: 200,
            headers: {
              'Content-Type': 'text/event-stream; charset=utf-8',
              'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
              'X-Accel-Buffering': 'no',
              'X-JARVIS-TTS': GEMINI_TTS_MODEL,
              ...corsHeaders(origin),
            },
          });
        }
        return audio(await callGeminiTTSFallback(text, rate, env.GEMINI_API_KEY), origin);
      } catch (streamError) {
        try {
          const wav = await callGeminiTTSFallback(text, rate, env.GEMINI_API_KEY);
          return audio(wav, origin);
        } catch (fallbackError) {
          return json({ error: streamError?.message || fallbackError?.message || 'TTS request failed', code: 'TTS_FAILED', provider: streamError?.provider || fallbackError?.provider || 'gemini-3.1-tts' }, streamError?.status || fallbackError?.status || 502, origin);
        }
      }
    }

    const query = String(body?.query || '').trim();
    if (!query) return json({ error: 'query is required' }, 400, origin);
    if (query.length > 4000) return json({ error: 'query is too long' }, 413, origin);

    const errors = [];
    if (env.GEMINI_API_KEY) {
      try { return json(await callGemini(query, env.GEMINI_API_KEY), 200, origin); }
      catch (error) {
        errors.push({ provider: 'gemini', status: error?.status || 502, error: error?.message || 'request failed' });
        if (error?.status && ![401, 403, 429].includes(error.status)) return json({ error: error.message, code: 'GEMINI_REQUEST_FAILED' }, error.status, origin);
      }
    }

    if (env.GROQ_API_KEY) {
      try { return json({ ...(await callGroq(query, env.GROQ_API_KEY)), fallback: true, fallbackFrom: 'gemini' }, 200, origin); }
      catch (error) { errors.push({ provider: 'groq', status: error?.status || 502, error: error?.message || 'request failed' }); }
    }

    if (!env.GEMINI_API_KEY && !env.GROQ_API_KEY) return json({ error: 'No intelligence provider is configured', code: 'INTELLIGENCE_UNAVAILABLE' }, 503, origin);
    return json({ error: 'All configured intelligence providers are unavailable', code: 'INTELLIGENCE_RATE_LIMITED', providers: errors }, 429, origin);
  },
};
