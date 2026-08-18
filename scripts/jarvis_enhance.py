"""Deterministic JARVIS application enhancement pass.

Media has one browser authority: jarvis-media-authority.js -> local media service.
This pass permanently removes the old in-browser Piped/trending runtime from
src/main.ts and keeps the news setup idempotent.
"""
from pathlib import Path
import re

main = Path("src/main.ts")
s = main.read_text(encoding="utf-8")

# Retire the entire legacy browser media implementation, regardless of the
# exact formatting used by the older generated revision.
s, removed = re.subn(
    r"\nasync function setupMedia\(\)\{[\s\S]*?\n\}\n(?=\nasync function setupSettings)",
    "\n",
    s,
    count=1,
)

# Remove every legacy invocation. The unified authority owns the controls and
# delegates actual search/extraction/playback to the local service.
s = re.sub(r"if\(active==='media'\)setupMedia\(\);", "", s)
s = re.sub(r"if\(active==='media'\)await setupMedia\(\);", "", s)

# Older generated revisions accidentally duplicated the home news bootstrap.
s = re.sub(
    r"(?:if\(active==='home'\)await setupNews\(\);\s*){2,}",
    "if(active==='home')await setupNews();",
    s,
)

# The home screen owns the news surface. Add it exactly once if an older
# revision omitted it.
if 'id="newsDesk"' not in s:
    hs = s.index("function home(){")
    he = s.index("\nfunction moduleDescription", hs)
    h = s[hs:he]
    h = h.replace('</section><section class="telemetry-grid">', '</section>${newsDesk()}<section class="telemetry-grid">', 1)
    s = s[:hs] + h + s[he:]

if "function newsDesk()" not in s:
    marker = "\nfunction calculator(){"
    news = '''
function newsDesk(){return `<section class="news-desk panel" id="newsDesk"><div class="news-head"><div><p class="eyebrow">INTELLIGENCE / LIVE BRIEF</p><h2>World signal</h2><p class="sub">JARVIS reads the current news stream, clusters the headlines and gives you the short version.</p></div><div class="news-controls"><span class="news-live"><i></i> LIVE</span><select id="newsGenre"><option value="AI OR technology">AI / TECH</option><option value="business OR markets">BUSINESS</option><option value="science OR space">SCIENCE / SPACE</option><option value="India OR Indian">INDIA</option><option value="world OR geopolitics">WORLD</option></select><button class="ghost" id="refreshNews">REFRESH</button></div></div><div class="news-ticker"><div class="news-track" id="newsTicker"><span>JARVIS IS CONNECTING TO THE GLOBAL NEWS STREAM…</span></div></div><div class="news-grid" id="newsCards"><div class="news-loading"><span></span><span></span><span></span></div></div></section>`}
'''
    s = s.replace(marker, news + marker, 1)

if "async function setupNews()" not in s:
    news_setup = '''
async function setupNews(){
 const ticker=document.querySelector('#newsTicker')!,cards=document.querySelector('#newsCards')!,genre=document.querySelector<HTMLSelectElement>('#newsGenre')!,refresh=document.querySelector('#refreshNews');
 const summarize=async(title:string)=>{try{const q=encodeURIComponent(title.split(/\\s+/).slice(0,8).join(' '));const r=await fetch(`https://api.gdeltproject.org/api/v2/context/context?query=${q}&mode=artlist&format=json&maxrecords=1&timespan=24h`);if(r.ok){const d=await r.json();const a=d.articles?.[0];if(a?.context)return String(a.context).replace(/<[^>]+>/g,' ').replace(/\\s+/g,' ').trim()}}catch{}return `JARVIS brief: ${title}. Open the source for the full report.`};
 const load=async()=>{ticker.innerHTML='<span>JARVIS IS SCANNING THE GLOBAL NEWS STREAM…</span>';cards.innerHTML='<div class="news-loading"><span></span><span></span><span></span></div>';try{const q=encodeURIComponent(genre.value);const r=await fetch(`https://api.gdeltproject.org/api/v2/doc/doc?query=(${q})&mode=artlist&format=json&maxrecords=8&timespan=24h&sort=datedesc`);if(!r.ok)throw new Error('News service unavailable');const d=await r.json();const items=(d.articles||[]).slice(0,6);if(!items.length)throw new Error('No current stories');const summaries=await Promise.all(items.slice(0,4).map((a:any)=>summarize(a.title||'')));const enriched=items.map((a:any,i:number)=>({...a,summary:summaries[i]||`JARVIS brief: ${a.title}`}));ticker.innerHTML=[...enriched,...enriched].map((a:any)=>`<a href="${attr(a.url)}" target="_blank" rel="noopener noreferrer">● ${esc(a.title)}</a>`).join('');cards.innerHTML=enriched.slice(0,4).map((a:any)=>`<article class="news-card"><img loading="lazy" src="${attr(a.socialimage||'')}" alt=""><div class="news-card-body"><div class="news-meta"><span>${esc(a.domain||'NEWS')}</span><span>${esc(a.sourcecountry||'GLOBAL')}</span></div><h3><a href="${attr(a.url)}" target="_blank" rel="noopener noreferrer"><strong>${esc(a.title)}</strong></a></h3><p>${esc(a.summary)}</p><a class="news-read" href="${attr(a.url)}" target="_blank" rel="noopener noreferrer">READ SOURCE ↗</a></div></article>`).join('');}catch(e){ticker.innerHTML='<span>NEWS FEED DEGRADED · RETRY AVAILABLE</span>';cards.innerHTML=`<div class="empty">${esc(e instanceof Error?e.message:'News feed unavailable')}</div>`}};
 genre.addEventListener('change',load);refresh?.addEventListener('click',load);await load();
}

'''
    s = s.replace("async function setupNotes(){", news_setup + "async function setupNotes(){", 1)

main.write_text(s, encoding="utf-8")
print(f"Legacy setupMedia removed: {removed == 1}")
