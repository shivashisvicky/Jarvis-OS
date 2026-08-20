export default async function handler(req, res) {
  const key = process.env.GEMINI_API_KEY;
  if (!key) return res.status(503).json({ error: 'Gemini API key is not configured', code: 'INTELLIGENCE_UNAVAILABLE' });
  if (req.method && req.method !== 'POST') return res.status(405).json({ error: 'POST required' });

  const body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : (req.body || {});
  const query = String(body.query || '').trim();
  if (!query) return res.status(400).json({ error: 'query is required' });
  if (query.length > 4000) return res.status(413).json({ error: 'query is too long' });

  const model = 'gemini-2.5-flash';
  const system = [
    'You are JARVIS, the intelligence layer of a personal operating system.',
    'Be concise, useful and truthful. Do not invent sources or facts.',
    'Use Google Search grounding when current information, recent events, recommendations or verification would improve the answer.',
    'Prefer direct answers, then a short explanation or next action.',
    'Do not claim to have performed an action unless the application explicitly did it.',
    'For media requests, identify useful video candidates or explain what to search; do not fabricate video IDs.'
  ].join(' ');

  try {
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-goog-api-key': key },
      body: JSON.stringify({
        system_instruction: { parts: [{ text: system }] },
        contents: [{ role: 'user', parts: [{ text: query }] }],
        tools: [{ google_search: {} }],
        generationConfig: { temperature: 0.2, maxOutputTokens: 900 }
      })
    });
    const data = await response.json();
    if (!response.ok) return res.status(response.status).json({ error: data?.error?.message || 'Gemini request failed' });
    const text = String(data?.candidates?.[0]?.content?.parts?.map(part => part?.text || '').join('') || '').trim();
    if (!text) return res.status(502).json({ error: 'Gemini returned no text' });
    const chunks = data?.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
    const sources = chunks.filter(chunk => chunk?.web?.uri).slice(0, 6).map(chunk => ({ title: String(chunk.web.title || chunk.web.uri), uri: String(chunk.web.uri) }));
    return res.status(200).json({ text, model, provider: 'gemini', grounded: sources.length > 0, sources });
  } catch (error) {
    return res.status(502).json({ error: error instanceof Error ? error.message : 'Intelligence gateway failed' });
  }
}
