export default async function handler(req, res) {
  const key = process.env.GEMINI_API_KEY;
  if (!key) return res.status(503).json({ error: 'Gemini API key is not configured', code: 'INTELLIGENCE_UNAVAILABLE' });
  if (req.method && req.method !== 'POST') return res.status(405).json({ error: 'POST required' });

  const body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : (req.body || {});
  const query = String(body.query || '').trim();
  if (!query) return res.status(400).json({ error: 'query is required' });
  if (query.length > 4000) return res.status(413).json({ error: 'query is too long' });

  const model = 'gemini-2.5-flash';
  const spatial = body.mode === 'spatial';
  const system = [
    'You are JARVIS, the intelligence layer of a personal operating system.',
    'Be concise, useful and truthful. Do not invent sources or facts.',
    'Use Google Search grounding when current information, recent events, recommendations or verification would improve the answer.',
    'Prefer direct answers, then a short explanation or next action.',
    'Do not claim to have performed an action unless the application explicitly did it.',
    'For media requests, identify useful video candidates or explain what to search; do not fabricate video IDs.',
    spatial ? 'For Spatial Planner requests, act as a semantic 3D scene planner. Understand the real-world object first, then express it using only the primitive operation contract supplied by the user prompt. The renderer supports box, cylinder, sphere and cone, so assemblies must be decomposed into multiple primitives when that is required for recognition. Never collapse a multi-part real-world object into one large box merely because its overall envelope is rectangular.' : '',
    spatial ? 'Use box for panels, boards, shelves, tabletops, cabinet/wardrobe sides, tops, bottoms, backs, frames and other rectangular structural parts. Use cylinder for wheels, axles, rods, pipes, handles and genuinely cylindrical parts. Use sphere or cone only when physically appropriate.' : '',
    spatial ? 'Wardrobe example: if the user asks for a wardrobe with two shelves, the plan MUST contain distinct create operations for a left side panel, right side panel, top panel, bottom panel, back panel when appropriate, shelf 1 and shelf 2. The two shelves must be separate horizontal parts positioned inside the wardrobe at different heights. Do not create one solid wardrobe box. The shelves must remain usable open spaces within the carcass.' : '',
    spatial ? 'Bicycle example: if the user asks for a bicycle or bike, the plan MUST contain distinct create operations for a recognizable frame, two wheels, front fork, handlebar and seat. Add crank/pedals when appropriate. Do not create a box plus two wheels and call it a bicycle.' : '',
    spatial ? 'Desk example: create a tabletop and meaningful supports/legs as separate primitives. Do not replace a desk with one solid box.' : '',
    spatial ? 'Simple-object example: if the user asks for a box or cube, a single box is correct. Do not over-decompose simple primitives.' : '',
    spatial ? 'Few-shot principle: examples above describe the intended semantic decomposition, not literal dimensions. Infer dimensions from the actual user request and preserve requested quantities exactly. If the user says two shelves, create exactly two shelf parts unless the user explicitly asks for more.' : '',
    spatial ? 'For modifications, preserve unrelated existing objects and change only the requested logical part. Keep parts spatially coherent, semantically named, proportionate and positioned relative to the object they form.' : '',
    spatial ? 'Return only the requested JSON object. Use only the allowed operations and fields. All dimensions and positions must be numeric SI metres. Never output markdown, prose outside the JSON object, executable code or unsupported geometry types.' : ''
  ].filter(Boolean).join(' ');

  try {
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-goog-api-key': key },
      body: JSON.stringify({
        system_instruction: { parts: [{ text: system }] },
        contents: [{ role: 'user', parts: [{ text: query }] }],
        ...(spatial ? {} : { tools: [{ google_search: {} }] }),
        generationConfig: spatial
          ? { temperature: 0, maxOutputTokens: 2400, responseMimeType: 'application/json' }
          : { temperature: 0.2, maxOutputTokens: 900 }
      })
    });
    const data = await response.json();
    if (!response.ok) return res.status(response.status).json({ error: data?.error?.message || 'Gemini request failed' });
    const candidate = data?.candidates?.[0];
    const finishReason = String(candidate?.finishReason || '');
    const text = String(candidate?.content?.parts?.map(part => part?.text || '').join('') || '').trim();
    if (!text) return res.status(502).json({ error: finishReason === 'MAX_TOKENS' ? 'Gemini spatial plan was truncated' : 'Gemini returned no text' });
    if (spatial && finishReason === 'MAX_TOKENS') return res.status(502).json({ error: 'Gemini spatial plan was truncated' });

    let plan = null;
    if (spatial) {
      try {
        plan = JSON.parse(text);
        if (!plan || !Array.isArray(plan.operations)) throw new Error('Spatial plan must contain an operations array');
      } catch (error) {
        return res.status(502).json({ error: `Gemini returned invalid Spatial JSON: ${error instanceof Error ? error.message : 'parse failed'}` });
      }
    }

    const chunks = candidate?.groundingMetadata?.groundingChunks || [];
    const sources = chunks.filter(chunk => chunk?.web?.uri).slice(0, 6).map(chunk => ({ title: String(chunk.web.title || chunk.web.uri), uri: String(chunk.web.uri) }));
    return res.status(200).json({ text, ...(spatial ? { plan } : {}), model, provider: 'gemini', grounded: sources.length > 0, sources });
  } catch (error) {
    return res.status(502).json({ error: error instanceof Error ? error.message : 'Intelligence gateway failed' });
  }
}
