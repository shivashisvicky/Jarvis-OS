export default async function handler(req, res) {
  const key = process.env.YOUTUBE_API_KEY;
  const q = String(req.query?.q || '').trim();
  if (!key) return res.status(500).json({ error: 'YOUTUBE_API_KEY is not configured' });
  if (!q) return res.status(400).json({ error: 'q is required' });

  const url = new URL('https://www.googleapis.com/youtube/v3/search');
  url.searchParams.set('part', 'snippet');
  url.searchParams.set('type', 'video');
  url.searchParams.set('maxResults', '8');
  url.searchParams.set('q', q);
  url.searchParams.set('key', key);

  try {
    const response = await fetch(url);
    const data = await response.json();
    if (!response.ok) return res.status(response.status).json({ error: data?.error?.message || 'YouTube search failed' });

    const results = (data.items || []).map(item => ({
      id: item.id?.videoId,
      title: item.snippet?.title || 'Untitled video',
      channel: item.snippet?.channelTitle || 'YouTube',
      thumbnail: item.snippet?.thumbnails?.medium?.url || item.snippet?.thumbnails?.default?.url || ''
    })).filter(item => item.id);

    return res.status(200).json({ results });
  } catch (error) {
    return res.status(502).json({ error: error instanceof Error ? error.message : 'YouTube request failed' });
  }
}
