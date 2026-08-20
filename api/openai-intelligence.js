export default async function handler(req, res) {
  const key = process.env.OPENAI_API_KEY;
  if (!key) return res.status(503).json({ error: 'OPENAI_API_KEY is not configured', code: 'INTELLIGENCE_UNAVAILABLE' });
  if (req.method && req.method !== 'POST') return res.status(405).json({ error: 'POST required' });

  const body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : (req.body || {});
  const query = String(body.query || '').trim();
  if (!query) return res.status(400).json({ error: 'query is required' });
  if (query.length > 4000) return res.status(413).json({ error: 'query is too long' });

  const system = [
    'You are JARVIS, the intelligence layer of a personal operating system.',
    'Be concise, useful and truthful. Do not invent sources or facts.',
    'When current information is needed, use web search.',
    'Prefer direct answers, then a short explanation or next action.',
    'Do not claim to have performed an action unless the application explicitly did it.',
    'For media requests, identify useful video candidates or explain what to search; do not fabricate video IDs.'
  ].join(' ');

  try {
    const response = await fetch('https://api.openai.com/v1/responses', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${key}` },
      body: JSON.stringify({
        model: process.env.OPENAI_MODEL || 'gpt-5.6-luna',
        input: [{ role: 'system', content: system }, { role: 'user', content: query }],
        tools: [{ type: 'web_search' }],
        max_output_tokens: 900
      })
    });
    const data = await response.json();
    if (!response.ok) return res.status(response.status).json({ error: data?.error?.message || 'OpenAI request failed' });
    const text = String(data?.output_text || '').trim();
    if (!text) return res.status(502).json({ error: 'OpenAI returned no text' });
    return res.status(200).json({ text, model: process.env.OPENAI_MODEL || 'gpt-5.6-luna' });
  } catch (error) {
    return res.status(502).json({ error: error instanceof Error ? error.message : 'Intelligence gateway failed' });
  }
}
