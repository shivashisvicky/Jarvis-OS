(()=>{
'use strict';
// Reader enhancement layer. Canonical Gutenberg search remains owned by
// jarvis-ebook-authority-v2.js. This file owns the reader click path and a
// small background preformat cache for the first visible result.
if(window.__JARVIS_EBOOK_READER_V3__)return;
window.__JARVIS_EBOOK_READER_V3__=true;
const API='https://gutendex.com/books/',G='https://www.gutenberg.org';
const clean=s=>String(s??'').replace(/\r/g,'').replace(/[ \t]+$/gm,'').trim();
const norm=s=>clean(s).toLowerCase().normalize('NFKD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9]+/g,' ').trim();
const esc=s=>String(s??'').replace(/[&<>\"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;',"'":'&#39;'}[c]));
const readable=b=>Object.keys(b?.formats||{}).some(k=>/^text\/(plain|html)/i.test(k));
const textUrl=b=>b?.formats?.['text/plain; charset=utf-8']||b?.formats?.['text/plain']||b?.formats?.['text/html; charset=utf-8']||b?.formats?.['text/html']||'';
const json=async(url,ms=15000)=>{const c=new AbortController(),t=setTimeout(()=>c.abort(),ms);try{const r=await fetch(url,{signal:c.signal,cache:'no-store',headers:{Accept:'application/json'}});if(!r.ok)throw Error(`HTTP ${r.status}`);return await r.json()}finally{clearTimeout(t)}};
const fetchOne=async(url,ms=18000)=>{const c=new AbortController(),t=setTimeout(()=>c.abort(),ms);try{const r=await fetch(url,{signal:c.signal,cache:'no-store',headers:{Accept:'text/plain,text/html;q=0.9,*/*;q=0.1'}});if(!r.ok)throw Error(`HTTP ${r.status}`);const body=await r.text();if(body.trim().length<200)throw Error('Short ebook response');return body}finally{clearTimeout(t)}};
const sourceCandidates=(url,id)=>{const out=[];const add=u=>{if(u&&!out.includes(u))out.push(u)};add(url);try{const u=new URL(url);add(`https://r.jina.ai/http://${u.host}${u.pathname}${u.search||''}`);add(`https://r.jina.ai/https://${u.host}${u.pathname}${u.search||''}`)}catch{};if(id){add(`${G}/cache/epub/${id}/pg${id}.txt`);add(`${G}/files/${id}/${id}-8.txt`);add(`${G}/files/${id}/${id}.txt`);add(`${G}/files/${id}/${id}-0.txt`)}return out};
const source=async(url,id)=>{let last;for(const u of sourceCandidates(url,id)){try{return await fetchOne(u)}catch(e){last=e}}throw last||Error('No ebook source returned')};
const parser=raw=>{
 let text=String(raw||'').replace(/\r/g,'');
 if(/<(?:html|body|div|p|h[1-6]|pre)\b/i.test(text)){const d=new DOMParser().parseFromString(text,'text/html');d.querySelectorAll('script,style,noscript,iframe,object,embed,nav,form').forEach(x=>x.remove());text=d.body?.innerText||d.body?.textContent||text}
 text=text.replace(/\u00a0/g,' ').replace(/^.*?\*\*\* START OF (?:THE )?PROJECT GUTENBERG EBOOK[^\n]*\n/i,'').replace(/\n\*\*\* END OF (?:THE )?PROJECT GUTENBERG EBOOK[^\n]*[\s\S]*$/i,'').trim();
 let lines=text.split('\n').map(x=>x.replace(/[ \t]+$/,'').trim()).filter(Boolean);
 const isContents=s=>/^(?:#{0,3}\s*)?(?:table\s+of\s+)?contents\s*[:.]?$/i.test(s);
 const isHead=s=>/^(?:chapter|book|part|section|prologue|epilogue|appendix|introduction|preface)\b/i.test(s)||/^(?:chapter|book|part)\s+[ivxlcdm0-9]+\b/i.test(s)||/^\(?[ivxlcdm]{1,8}\)?[.:-]?\s+\S+/i.test(s)&&s.length<100||/^\(?\d{1,3}\)?[.:-]\s+\S+/i.test(s)&&s.length<100;
 const ci=lines.findIndex(isContents);
 if(ci>=0){let end=-1;for(let i=ci+1;i<Math.min(lines.length,ci+400);i++){if(isHead(lines[i])){end=i;break}}if(end>ci+1)lines=lines.slice(0,ci).concat(lines.slice(end));}
 const sections=[];let cur={label:'Front matter',lines:[]};
 for(const line of lines){if(isHead(line)){if(cur.lines.length)sections.push(cur);cur={label:line,lines:[line]}}else cur.lines.push(line)}
 if(cur.lines.length)sections.push(cur);
 const useful=sections.filter(s=>s.lines.join(' ').length>80);
 return useful.length?useful:[{label:'Book',lines}];
};
const pages=sections=>{const out=[],map=[];for(const s of sections){const start=out.length;let cur='';for(const block of s.lines.join('\n').split(/\n\s*\n/).map(x=>x.trim()).filter(Boolean)){const x=cur?`${cur}\n\n${block}`:block;if(cur&&x.length>4800){out.push(cur);cur=block}else cur=x}if(cur)out.push(cur);map.push({label:s.label,page:Math.max(0,start)})}return {pages:out.length?out:['No readable text returned.'],sections:map}};
const prepare=async(id)=>{const key=String(id);if(window.__JARVIS_EBOOK_PREFORMAT__?.[key])return window.__JARVIS_EBOOK_PREFORMAT__[key];window.__JARVIS_EBOOK_PREFORMAT__=window.__JARVIS_EBOOK_PREFORMAT__||{};try{let b=await json(`${API}${encodeURIComponent(id)}`);if(!readable(b)){const d=await json(`${API}?search=${encodeURIComponent(b.title||'')}&languages=en&page=1`);b=(d.results||[]).find(readable)||b}const u=textUrl(b);if(!u)throw Error('No readable text format');const raw=await source(u,b.id||id);const built=pages(parser(raw));const pack={id:b.id||id,title:b.title||'',pages:built.pages,sections:built.sections,readyAt:Date.now()};window.__JARVIS_EBOOK_PREFORMAT__[key]=pack;return pack}catch(e){console.warn('[JARVIS ebook preformat]',e);return null}};
const progress=(text,active=true)=>{const p=document.querySelector('#jbe6Panel'),line=p?.querySelector('#jbe6StatusLine');if(!line)return;line.textContent=text;if(active)line.setAttribute('data-preformat','active');else line.removeAttribute('data-preformat')};
const preformatVisible=()=>{const first=document.querySelector('#jbe6Results .jbe6-book');if(!first)return;const id=first.getAttribute('data-book-id')||first.querySelector('[data-read]')?.getAttribute('data-read');if(!id)return;if(window.__JARVIS_EBOOK_PREFORMAT__?.[id])return;progress('RESULTS READY · PREFORMATTING 30%');setTimeout(async()=>{const pack=await prepare(id);if(pack)progress('RESULTS READY · PREFORMATTED 100%',false);else progress('RESULTS READY · GUTENBERG',false)},30)};
const observer=new MutationObserver(()=>{if(document.querySelector('#jbe6Results .jbe6-book'))preformatVisible()});
const startObserver=()=>{const box=document.querySelector('#jbe6Results');if(box&&!box.__jvObserved){box.__jvObserved=true;observer.observe(box,{childList:true,subtree:true});preformatVisible()}};
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',startObserver,{once:true});else startObserver();
setTimeout(startObserver,500);setTimeout(startObserver,1500);setTimeout(startObserver,3000);
const reader=(id,title)=>{
 document.querySelector('.jbe2-reader')?.remove();
 const r=document.createElement('div');r.className='jbe2-reader';
 r.innerHTML=`<style>.jbe2-reader{position:fixed;inset:0;z-index:999999;background:#061018;display:flex;flex-direction:column}.jbe2-reader *{box-sizing:border-box}.jbe2-head,.jbe2-nav,.jbe2-foot{display:flex;gap:7px;align-items:center;padding:9px;background:#061018;color:#dffaff;font:800 9px system-ui;border-bottom:1px solid #23404a}.jbe2-title{flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.jbe2-btn,.jbe2-jump,.jbe2-select{background:#061018;color:#dffaff;border:1px solid #315763;border-radius:7px;padding:8px;font:800 8px system-ui}.jbe2-select{flex:1;min-width:0}.jbe2-body{flex:1;overflow:auto;background:#fff;color:#172126}.jbe2-page{max-width:820px;margin:auto;padding:26px 20px 90px;white-space:pre-wrap;overflow-wrap:anywhere;font:18px/1.72 Georgia,serif}.jbe2-foot{justify-content:center}.jbe2-count{min-width:80px;text-align:center;color:#8ca9b0}</style><div class="jbe2-head"><strong class="jbe2-title">${esc(title||'JARVIS READER')}</strong><button class="jbe2-btn" id="jbe2Minus">A−</button><button class="jbe2-btn" id="jbe2Plus">A+</button><button class="jbe2-btn" id="jbe2Close">CLOSE</button></div><div class="jbe2-nav"><span>PAGE</span><input class="jbe2-jump" id="jbe2Jump" type="number" min="1" value="1"><button class="jbe2-btn" id="jbe2Go">GO</button><select class="jbe2-select" id="jbe2Section"><option value="">CHAPTER / SECTION</option></select></div><main class="jbe2-body"><article class="jbe2-page" id="jbe2Page">Preparing ebook…</article></main><div class="jbe2-foot"><button class="jbe2-btn" id="jbe2Prev">PREVIOUS</button><span class="jbe2-count" id="jbe2Count">1 / …</span><button class="jbe2-btn" id="jbe2Next">NEXT</button></div>`;
 document.body.appendChild(r);
 let ps=[],at=0,size=18,sections=[];const p=r.querySelector('#jbe2Page'),count=r.querySelector('#jbe2Count'),jump=r.querySelector('#jbe2Jump'),sel=r.querySelector('#jbe2Section');
 const draw=()=>{p.style.fontSize=size+'px';p.textContent=ps[at]||'';count.textContent=`${at+1} / ${Math.max(1,ps.length)}`;jump.value=at+1;r.querySelector('#jbe2Prev').disabled=at===0;r.querySelector('#jbe2Next').disabled=at>=ps.length-1};
 const go=n=>{const x=Math.max(1,Math.min(ps.length,Number(n)||1));at=x-1;draw();p.parentElement.scrollTop=0};
 r.querySelector('#jbe2Close').onclick=()=>r.remove();r.querySelector('#jbe2Minus').onclick=()=>{size=Math.max(14,size-1);draw()};r.querySelector('#jbe2Plus').onclick=()=>{size=Math.min(28,size+1);draw()};r.querySelector('#jbe2Go').onclick=()=>go(jump.value);r.querySelector('#jbe2Prev').onclick=()=>go(at);r.querySelector('#jbe2Next').onclick=()=>go(at+2);sel.onchange=()=>go(sel.value);
 const load=async()=>{try{const pack=window.__JARVIS_EBOOK_PREFORMAT__?.[String(id)]||await prepare(id);if(!pack)throw Error('The ebook could not be preformatted');ps=pack.pages;sections=pack.sections||[];sel.innerHTML='<option value="">CHAPTER / SECTION</option>'+sections.map(s=>`<option value="${Math.max(1,s.page+1)}">${esc(s.label)}</option>`).join('');r.querySelector('.jbe2-title').textContent=pack.title||title||'JARVIS READER';draw()}catch(e){p.innerHTML=`<div style="font:16px/1.6 system-ui;color:#23363c;max-width:620px;margin:18vh auto;padding:24px"><strong>JARVIS could not load this ebook.</strong><br><span>${esc(e?.message||'The ebook source could not be fetched in this browser session.')}</span><br><button id="jbe2Retry" class="jbe2-btn" style="margin-top:16px">RETRY</button></div>`;r.querySelector('#jbe2Retry').onclick=load}};
 load();
};
const intercept=e=>{const b=e.target?.closest?.('#jbe6Results [data-read],#jbe6Results [data-jbe2-read]');if(!b)return;const id=b.getAttribute('data-read')||b.getAttribute('data-jbe2-read');if(!id)return;e.preventDefault();e.stopImmediatePropagation();reader(id,b.getAttribute('data-title')||'JARVIS READER')};
window.addEventListener('click',intercept,true);
window.jarvisEbookReaderOpenV3=reader;
})();