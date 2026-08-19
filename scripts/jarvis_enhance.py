"""Deterministic JARVIS application enhancement pass.

Media has exactly one browser authority: jarvis-media-authority.js.
This pass permanently removes the old in-browser Piped/trending runtime from
src/main.ts, keeps the news setup idempotent, and repairs index.html so the
canonical media authority is loaded exactly once.
"""
from pathlib import Path
import re

MAIN = Path("src/main.ts")
INDEX = Path("index.html")
AUTHORITY = "jarvis-media-authority.js"

s = MAIN.read_text(encoding="utf-8")

# Retire the entire legacy browser media implementation, regardless of the
# exact formatting used by the older generated revision.
s, removed = re.subn(
    r"\nasync function setupMedia\(\)\{[\s\S]*?\n\}\n(?=\nfunction setupSettings|\nasync function setupSettings)",
    "\n",
    s,
    count=1,
)

# Remove every legacy invocation, including awaited/void variants and spacing.
s = re.sub(
    r"\s*if\(active\s*===\s*['\"]media['\"]\)\s*(?:await\s+|void\s+)?setupMedia\(\);?",
    "",
    s,
)

# Fail closed. We never want the retired browser media implementation to ship.
if re.search(r"\bsetupMedia\s*\(", s) or "pipedapi" in s.lower():
    raise SystemExit("Legacy media runtime/provider reference still present in src/main.ts")
if removed not in (0, 1):
    raise SystemExit(f"Unexpected setupMedia removal count: {removed}")

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

MAIN.write_text(s, encoding="utf-8")

# Repair the HTML entrypoint deterministically. Remove both the canonical
# authority tag and any obsolete direct live-v2 tag before inserting exactly
# one canonical authority tag. This prevents duplicate media controllers.
index = INDEX.read_text(encoding="utf-8")
index = re.sub(
    r"\s*<script[^>]+src=[\"'][^\"']*(?:jarvis-media-authority|jarvis-media-live-v2)\.js[^\"']*[\"'][^>]*>\s*</script>",
    "",
    index,
    flags=re.I,
)

if "</body>" not in index:
    raise SystemExit("index.html has no </body> insertion point")

script_tag = f'  <script src="./{AUTHORITY}?v=20260820-2"></script>\n'
if '<script type="module"' in index:
    index = re.sub(
        r'\n\s*<script type="module"',
        '\n' + script_tag + '  <script type="module"',
        index,
        count=1,
    )
elif "</head>" in index:
    index = index.replace("</head>", script_tag + "</head>", 1)
else:
    index = index.replace("</body>", script_tag + "</body>", 1)

if len(re.findall(r"jarvis-media-authority\.js", index)) != 1:
    raise SystemExit("Expected exactly one jarvis-media-authority.js script reference in index.html")
if re.search(r"jarvis-media-live-v2\.js", index):
    raise SystemExit("Obsolete direct jarvis-media-live-v2.js script reference remains in index.html")

INDEX.write_text(index, encoding="utf-8")
print(f"Legacy setupMedia removed: {removed == 1}")
print("Media authority injected exactly once into index.html")
