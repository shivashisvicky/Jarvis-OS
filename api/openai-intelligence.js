export default async function handler(req, res) {
  const key = process.env.GEMINI_API_KEY;
  if (!key) return res.status(503).json({ error: 'Gemini API key is not configured', code: 'INTELLIGENCE_UNAVAILABLE' });
  if (req.method && req.method !== 'POST') return res.status(405).json({ error: 'POST required' });

  const body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : (req.body || {});
  const query = String(body.query || '').trim();
  if (!query) return res.status(400).json({ error: 'query is required' });
  if (query.length > 4000) return res.status(413).json({ error: 'query is too long' });

  const model = 'gemini-2.5-flash';
  const spatial = body.mode === 'spatial' || /^You are JARVIS Spatial Planner\./i.test(query);
  const system = [
    'You are JARVIS, the intelligence layer of a personal operating system.',
    'Be concise, useful and truthful. Do not invent sources or facts.',
    'Use Google Search grounding when current information, recent events, recommendations or verification would improve the answer.',
    'Prefer direct answers, then a short explanation or next action.',
    'Do not claim to have performed an action unless the application explicitly did it.',
    'For media requests, identify useful video candidates or explain what to search; do not fabricate video IDs.',
    spatial ? 'For Spatial Planner requests, act as a semantic 3D scene planner. Understand the real-world object first, then express it using only the primitive operation contract supplied by the user prompt. The renderer supports box, cylinder, sphere and cone, so assemblies must be decomposed into multiple primitives when that is required for recognition. Never collapse a multi-part real-world object into one large box merely because its overall envelope is rectangular.' : '',
    spatial ? 'Renderer convention: box dimensions are width on X, height on Y, depth on Z. CylinderGeometry uses Y as its native axis, so a wheel whose axle runs along Z must use a 90-degree X rotation. Keep wheel thickness small relative to wheel radius. For side-profile assemblies, keep the meaningful structure in the X-Y plane and use Z mainly for axle/thickness separation.' : '',
    spatial ? 'Use box for panels, boards, shelves, tabletops, cabinet/wardrobe sides, tops, bottoms, backs, frames and other rectangular structural parts. Use cylinder for wheels, axles, rods, pipes, handles and genuinely cylindrical parts. Use sphere or cone only when physically appropriate.' : '',
    spatial ? 'Wardrobe reference pattern: a carcass is separate left side + right side + top + bottom + back panels, with each requested shelf as a separate horizontal box inside the opening. Preserve an actual open interior instead of filling the envelope with one box.' : '',
    spatial ? 'Desk reference pattern: a tabletop is a separate horizontal box, with four separate legs/supports and any lower shelf as another box. A monitor may be one screen plus one stand, but both belong to the same logical monitor assembly.' : '',
    spatial ? 'Bicycle reference pattern: use TWO thin wheel cylinders of equal radius at the same ground height, with their axes along Z. Connect the wheel centers using separate thin box members forming a triangular bicycle frame: rear chainstay/seatstay, seat tube, top tube and down tube. Add a separate front fork from the front frame area to the front wheel, a handlebar above the fork, a seat above the seat tube, and a crank/pedal assembly near the lower frame junction. The frame members should meet or nearly meet at meaningful joints. Do not substitute a single diagonal bar for the frame. A bicycle should normally require roughly 10 or more semantic parts, not five generic shapes.' : '',
    spatial ? 'Bicycle reference coordinates: use a side profile with front wheel around x=-0.66, rear wheel around x=0.52, wheel centers around y=-0.28, and frame bottom bracket around x=-0.02,y=-0.24. These are construction references, not fixed dimensions. Scale them coherently if the user requests a different bicycle size.' : '',
    spatial ? 'For bicycle frame members, boxes must use dimensions {width,height,depth}; if a member connects two points, size it to the segment length on X/Y and rotate it so its long local axis follows the segment. Do not emit dimensions named x/y/height or other unsupported dimension keys.' : '',
    spatial ? 'Bicycle recognition check before returning JSON: there must be two distinct wheels, a connected multi-member frame between them, a front fork, handlebar, seat, and a crank/pedal area. Wheel radius should be substantially larger than wheel thickness. The two wheel centers must be separated horizontally and aligned at the same ground level. Avoid giant cylinders, vertical posts, disconnected bars, or parts floating far from the assembly.' : '',
    spatial ? 'Simple-object reference pattern: if the user asks for a box or cube, a single box is correct. If the user asks for a cylinder, create one cylinder with requested radius/height. Do not over-decompose simple primitives.' : '',
    spatial ? 'Few-shot principle: these are semantic construction references, not fixed dimensions. Infer dimensions from the actual user request and preserve requested quantities exactly. If the user says two shelves, create exactly two shelf parts unless the user explicitly asks for more.' : '',
    spatial ? 'For modifications, preserve unrelated existing objects and change only the requested logical part. Keep parts spatially coherent, semantically named, proportionate and positioned relative to the object they form.' : '',
    spatial ? 'Return only the requested JSON object. Use only the allowed operations and fields. All dimensions and positions must be numeric SI metres. Never output markdown, prose outside the JSON object, executable code or unsupported geometry types.' : ''
  ].filter(Boolean).join(' ');

  const isBicycleRequest = /\b(bicycle|bike)\b/i.test(query);
  const hasName = (plan, pattern) => plan?.operations?.some(o => o?.op === 'create' && pattern.test(String(o.name || '')));
  const bicyclePlanValid = (plan) => {
    if (!plan || !Array.isArray(plan.operations)) return false;
    const creates = plan.operations.filter(o => o?.op === 'create');
    if (creates.length < 10) return false;
    if (!hasName(plan, /front[_ -]?wheel/i) || !hasName(plan, /rear[_ -]?wheel/i)) return false;
    if (!hasName(plan, /frame|top[_ -]?tube|down[_ -]?tube|seat[_ -]?tube|chainstay|seatstay/i)) return false;
    if (!hasName(plan, /fork/i) || !hasName(plan, /handlebar/i) || !hasName(plan, /seat|saddle/i)) return false;
    if (!hasName(plan, /crank|pedal/i)) return false;
    const wheels = creates.filter(o => /wheel/i.test(String(o.name || '')) && o.type === 'cylinder');
    if (wheels.length < 2) return false;
    return wheels.every(o => Number(o.dimensions?.radius) > Number(o.dimensions?.height || 0) * 2);
  };

  const parseSpatialText = (text) => {
    let clean = String(text || '').trim().replace(/^```(?:json)?/i, '').replace(/```$/,'').trim();
    const a = clean.indexOf('{'), b = clean.lastIndexOf('}');
    if (a >= 0 && b > a) clean = clean.slice(a, b + 1);
    const plan = JSON.parse(clean);
    if (!plan || !Array.isArray(plan.operations)) throw new Error('Spatial plan must contain an operations array');
    return plan;
  };

  const requestGemini = async (userText, temperature = 0) => {
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-goog-api-key': key },
      body: JSON.stringify({
        system_instruction: { parts: [{ text: system }] },
        contents: [{ role: 'user', parts: [{ text: userText }] }],
        ...(spatial ? {} : { tools: [{ google_search: {} }] }),
        generationConfig: spatial
          ? { temperature, maxOutputTokens: 2400, responseMimeType: 'application/json' }
          : { temperature: 0.2, maxOutputTokens: 900 }
      })
    });
    const data = await response.json();
    if (!response.ok) return { response, data };
    return { response, data };
  };

  try {
    const first = await requestGemini(query, spatial ? 0 : 0.2);
    const data = first.data;
    if (!first.response.ok) return res.status(first.response.status).json({ error: data?.error?.message || 'Gemini request failed' });
    const candidate = data?.candidates?.[0];
    const finishReason = String(candidate?.finishReason || '');
    const text = String(candidate?.content?.parts?.map(part => part?.text || '').join('') || '').trim();
    if (!text) return res.status(502).json({ error: finishReason === 'MAX_TOKENS' ? 'Gemini spatial plan was truncated' : 'Gemini returned no text' });
    if (spatial && finishReason === 'MAX_TOKENS') return res.status(502).json({ error: 'Gemini spatial plan was truncated' });

    let plan = null;
    if (spatial) {
      try {
        plan = parseSpatialText(text);
      } catch (error) {
        return res.status(502).json({ error: `Gemini returned invalid Spatial JSON: ${error instanceof Error ? error.message : 'parse failed'}` });
      }

      if (isBicycleRequest && !bicyclePlanValid(plan)) {
        const repairPrompt = `The previous bicycle Spatial plan failed the JARVIS geometry validation. Repair it rather than simplifying it. Return ONLY a complete JSON object with an operations array. Keep the user's bicycle request: ${query}. Previous plan: ${JSON.stringify(plan)}. Requirements: at least 10 meaningful create operations; two thin equal-radius cylinder wheels with radius much larger than height, same ground height and separated along X; a connected multi-member triangular frame using boxes with width/height/depth; front fork; handlebar; seat; crank and pedals. Keep all parts in one coherent side-profile bicycle assembly. Do not use unsupported dimension keys such as x, y, z for box dimensions.`;
        const repaired = await requestGemini(repairPrompt, 0);
        const repairedData = repaired.data;
        if (!repaired.response.ok) return res.status(502).json({ error: repairedData?.error?.message || 'Gemini bicycle repair failed' });
        const repairedCandidate = repairedData?.candidates?.[0];
        const repairedText = String(repairedCandidate?.content?.parts?.map(part => part?.text || '').join('') || '').trim();
        try {
          plan = parseSpatialText(repairedText);
        } catch (error) {
          return res.status(502).json({ error: `Gemini bicycle repair returned invalid Spatial JSON: ${error instanceof Error ? error.message : 'parse failed'}` });
        }
        if (!bicyclePlanValid(plan)) return res.status(502).json({ error: 'Gemini could not produce a valid bicycle assembly plan.' });
      }
    }

    const chunks = candidate?.groundingMetadata?.groundingChunks || [];
    const sources = chunks.filter(chunk => chunk?.web?.uri).slice(0, 6).map(chunk => ({ title: String(chunk.web.title || chunk.web.uri), uri: String(chunk.web.uri) }));
    return res.status(200).json({ text: spatial ? JSON.stringify(plan) : text, ...(spatial ? { plan } : {}), model, provider: 'gemini', grounded: sources.length > 0, sources });
  } catch (error) {
    return res.status(502).json({ error: error instanceof Error ? error.message : 'Intelligence gateway failed' });
  }
}
