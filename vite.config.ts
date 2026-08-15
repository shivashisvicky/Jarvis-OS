import { defineConfig, type Plugin } from 'vite';

/**
 * JARVIS browser bridge.
 *
 * The current web build cannot embed a complete Chromium process, but it can
 * provide a browser-like workspace without forcing normal navigation out of
 * the JARVIS shell. This transform keeps the implementation local and avoids
 * adding a large browser dependency to the lightweight build.
 */
function jarvisBrowserBridge(): Plugin {
  return {
    name: 'jarvis-browser-bridge',
    transform(code, id) {
      if (!id.endsWith('/src/main.ts')) return null;

      let out = code;

      out = out.replace(
        /function openExternal\(url:string,title:string\)\{[\s\S]*?\}\nfunction searchUrl/,
        `function openExternal(url:string,title:string){
  try{
    const u=new URL(url,location.href);
    if(!/^https?:$/.test(u.protocol))return;
    void pushRecentTab(title,u.toString());
    recent.unshift({title,url:u.toString(),time:Date.now()});
    recent=recent.filter((x,i,a)=>a.findIndex(y=>y.url===x.url)===i).slice(0,12);
    if(active!=='web'){active='web';render();setTimeout(()=>loadBrowserUrl(u.toString(),title),0)}else{loadBrowserUrl(u.toString(),title)}
  }catch{}
}
function loadBrowserUrl(url:string,title='Web page'){
  const frame=document.querySelector<HTMLIFrameElement>('#browserFrame');
  const address=document.querySelector<HTMLInputElement>('#browserAddress');
  const status=document.querySelector<HTMLElement>('#browserStatus');
  if(address)address.value=url;
  if(status)status.textContent='LOADING // '+title.toUpperCase();
  if(frame){frame.src=url;frame.onload=()=>{if(status)status.textContent='PAGE READY // EMBEDDED WEBVIEW'};frame.onerror=()=>{if(status)status.textContent='EMBED BLOCKED // USE OPEN IN SYSTEM BROWSER'}}
}
function searchUrl`
      );

      out = out.replace(
        /function web\(\)\{[\s\S]*?\}\nfunction maps/,
        `function web(){return \`<div class="apphead"><div><p class="eyebrow">INTERNET / BROWSER</p><h2>JARVIS Browser</h2><p class="sub">A browser workspace inside the JARVIS shell. Tabs, search, history and web content stay in the command center.</p></div></div><div class="browser-shell"><div class="browser-toolbar"><button id="browserBack" title="Back">‹</button><button id="browserForward" title="Forward">›</button><button id="browserReload" title="Reload">↻</button><input id="browserAddress" value="https://search.brave.com" placeholder="Search or enter address"><button class="primary" id="browserGo">GO</button></div><div class="browser-tabs"><button class="browser-tab active">＋ New tab</button><span class="browser-engine">SEARCH: ${searchEngine.toUpperCase()}</span></div><div id="browserStatus" class="browser-status">READY // JARVIS EMBEDDED WEBVIEW</div><iframe id="browserFrame" title="JARVIS Browser" src="https://search.brave.com" loading="eager" referrerpolicy="no-referrer" allow="fullscreen; autoplay; picture-in-picture"></iframe><div class="browser-fallback"><span>Some sites intentionally refuse iframe embedding for security.</span><button id="browserSystemOpen">OPEN IN SYSTEM BROWSER</button></div></div>\`}
function maps`
      );

      out = out.replace(
        /function setupWeb\(\)\{[\s\S]*?\}\nfunction setupMaps/,
        `function setupWeb(){
  const address=()=> (document.querySelector('#browserAddress') as HTMLInputElement).value.trim();
  const go=()=>{let u=address();if(!u)return;if(!/^https?:\\/\\//i.test(u)){u=searchUrl(u)}loadBrowserUrl(u,'Address navigation')};
  document.querySelector('#browserGo')?.addEventListener('click',go);
  document.querySelector('#browserAddress')?.addEventListener('keydown',e=>{if(e.key==='Enter')go()});
  document.querySelector('#browserReload')?.addEventListener('click',()=>{const f=document.querySelector<HTMLIFrameElement>('#browserFrame');if(f)f.src=f.src});
  document.querySelector('#browserBack')?.addEventListener('click',()=>{try{document.querySelector<HTMLIFrameElement>('#browserFrame')?.contentWindow?.history.back()}catch{}});
  document.querySelector('#browserForward')?.addEventListener('click',()=>{try{document.querySelector<HTMLIFrameElement>('#browserFrame')?.contentWindow?.history.forward()}catch{}});
  document.querySelector('#browserSystemOpen')?.addEventListener('click',()=>{const u=address();if(/^https?:\\/\\//i.test(u))window.open(u,'_blank','noopener,noreferrer')});
  document.querySelectorAll<HTMLButtonElement>('[data-provider]').forEach(b=>b.onclick=()=>{const q=(document.querySelector('#browserAddress') as HTMLInputElement).value.trim();loadBrowserUrl(searchUrl(q,b.dataset.provider!),b.dataset.provider!+' search')});
}
function setupMaps`
      );

      return { code: out, map: null };
    }
  };
}

export default defineConfig({
  base: './',
  plugins: [jarvisBrowserBridge()]
});
