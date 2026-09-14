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
    spatial ? 'For Spatial Planner requests, return only the requested JSON object. The renderer supports primitive geometry, but you are responsible for semantic decomposition of real-world objects and assemblies. First understand what the user asked for, then construct it from multiple appropriately named primitive parts. Structural rectangular parts such as tabletops, shelves, cabinet panels, wardrobe panels, frames and table legs use type box. Wheels, axles, pipes, handles and other genuinely cylindrical parts use cylinder. Rounded bodies may use sphere only when appropriate. Never represent an entire real-world assembly as one giant box merely because its outer envelope is rectangular. For a wardrobe or cabinet, decompose the carcass into left/right/top/bottom/back panels plus each requested shelf and other explicitly requested structural components. For a bike/bicycle, decompose at minimum into a recognizable frame, two wheels, front fork, handlebar and seat; add crank/pedals when the request is a normal bicycle and dimensions permit. Keep parts spatially arranged so the assembly is visually recognizable. Use semantic names and consistent relative positions. Do not add decorative or functional components the user did not request unless they are essential to make the named object recognizable. For ordinary named objects such as chair, desk, table, cabinet, wardrobe, bicycle/bike, monitor and shelf, prefer a plausible multi-part construction over a single primitive. Use the simplest geometry that preserves the object's identity. All dimensions and positions must remain numeric SI metres. Return only the allowed operations and do not output executable code. If the request modifies an existing scene, preserve existing objects and target the relevant logical part(s) rather than rebuilding unrelated geometry. Keep the existing primitive operation contract intact.' : ''
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
