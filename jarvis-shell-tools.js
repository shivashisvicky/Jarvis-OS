(() => {
  'use strict';
  if (window.__JARVIS_SHELL_TOOLS__) return;
  window.__JARVIS_SHELL_TOOLS__ = true;

  // Home/Command must render immediately. News is fetched only after REFRESH.
  const nativeFetch = window.fetch.bind(window);
  let allowNewsFetch = false;
  const newsUrl = url => /api\.gdeltproject\.org\/api\/v2\/doc\/doc|news\.google\.com\/rss\/search|api\.rss2json\.com/i.test(url);
  window.fetch = (input, init) => {
    const url = typeof input === 'string' ? input : input?.url || '';
    if (!allowNewsFetch && newsUrl(url)) {
      if (/api\.rss2json\.com/i.test(url)) return Promise.resolve(new Response(JSON.stringify({ items: [] }), { status: 200, headers: { 'Content-Type': 'application/json' } }));
      return Promise.resolve(new Response(JSON.stringify({ articles: [] }), { status: 200, headers: { 'Content-Type': 'application/json' } }));
    }
    return nativeFetch(input, init);
  };

  const esc = s => String(s ?? '').replace(/[&<>\"']/g, c => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '\"':'&quot;', "'":'&#039;' }[c]));
  const decorateApi = () => {
    const host = document.querySelector('#workspace');
    if (!host || host.dataset.jarvisApi === '1') return;
    if (!host.querySelector('.info-card h3')?.textContent?.includes('Request client')) return;
    host.dataset.jarvisApi = '1';
    host.innerHTML = `<div class="page-head"><div><p class="eyebrow">ENGINEERING / API LAB</p><h1>API Lab</h1><p class="sub">Fast REST request console. Runs directly from your browser.</p></div></div><section class="panel api-lab"><div class="search-row"><select id="apiMethod"><option>GET</option><option>POST</option><option>PUT</option><option>PATCH</option><option>DELETE</option><option>HEAD</option></select><input id="apiUrl" placeholder="https://api.example.com/resource" autocomplete="off"><button class="primary" id="apiSend">SEND</button></div><div class="api-grid"><label>Headers<textarea id="apiHeaders" spellcheck="false" placeholder='{"Accept":"application/json","Content-Type":"application/json"}'></textarea></label><label>Body<textarea id="apiBody" spellcheck="false" placeholder='{"hello":"world"}'></textarea></label></div><div class="panel-head"><span>RESPONSE</span><span id="apiStatus" class="live">READY</span></div><pre id="apiResponse" class="api-response">Send a request to see the response.</pre></section>`;
    document.querySelector('#apiSend').addEventListener('click', async () => {
      const url=document.querySelector('#apiUrl').value.trim(), method=document.querySelector('#apiMethod').value, status=document.querySelector('#apiStatus'), out=document.querySelector('#apiResponse');
      if(!url){status.textContent='URL REQUIRED';return;} let headers={},body;
      try{if(document.querySelector('#apiHeaders').value.trim())headers=JSON.parse(document.querySelector('#apiHeaders').value)}catch{status.textContent='INVALID HEADERS';return;}
      if(!['GET','HEAD','DELETE'].includes(method))body=document.querySelector('#apiBody').value;
      status.textContent='SENDING'; const started=performance.now();
      try{const response=await nativeFetch(url,{method,headers,body:body||undefined,cache:'no-store'});const text=await response.text();status.textContent=`${response.status} · ${Math.round(performance.now()-started)} MS`;try{out.textContent=JSON.stringify(JSON.parse(text),null,2)}catch{out.textContent=text||'(empty response)'}}catch(error){status.textContent='NETWORK / CORS ERROR';out.textContent=String(error?.message||error)+'\n\nIf the target blocks browser CORS, use its API gateway/proxy or enable CORS on the target.'}
    });
  };
  const decorateSftp = () => {
    const host=document.querySelector('#workspace');
    if(!host||host.dataset.jarvisSftp==='1')return;
    if(!host.querySelector('.info-card h3')?.textContent?.includes('Remote transfer'))return;
    host.dataset.jarvisSftp='1';
    host.innerHTML=`<div class="page-head"><div><p class="eyebrow">ENGINEERING / SECURE TRANSFER</p><h1>SFTP</h1><p class="sub">Connection profile and ready-to-run commands.</p></div></div><section class="panel sftp-panel"><div class="api-grid"><label>Host<input id="sftpHost" placeholder="sftp.example.com"></label><label>Port<input id="sftpPort" value="22" inputmode="numeric"></label><label>Username<input id="sftpUser" placeholder="username"></label><label>Remote path<input id="sftpPath" value="/home/username"></label></div><div class="search-row"><button class="primary" id="sftpCommand">GENERATE COMMAND</button><button class="secondary" id="sftpCopy">COPY</button></div><pre id="sftpOutput" class="api-response">Enter the host and username.</pre><p class="sub">Browser pages cannot open arbitrary SSH/SFTP TCP sockets directly. This console generates the native SFTP command without pretending a connection exists.</p></section>`;
    const command=()=>{const h=document.querySelector('#sftpHost').value.trim(),p=document.querySelector('#sftpPort').value.trim()||'22',u=document.querySelector('#sftpUser').value.trim(),path=document.querySelector('#sftpPath').value.trim()||'/';document.querySelector('#sftpOutput').textContent=h&&u?`sftp -P ${p} ${u}@${h}:${path}`:'Enter the host and username.'};
    document.querySelector('#sftpCommand').addEventListener('click',command);document.querySelector('#sftpCopy').addEventListener('click',async()=>{command();try{await navigator.clipboard.writeText(document.querySelector('#sftpOutput').textContent);document.querySelector('#sftpCopy').textContent='COPIED';setTimeout(()=>document.querySelector('#sftpCopy').textContent='COPY',1000)}catch{}});
  };
  const decorate=()=>{decorateApi();decorateSftp()};
  document.addEventListener('click',event=>{const app=event.target?.closest?.('[data-app]')?.getAttribute('data-app');if(app==='api'||app==='remote')setTimeout(decorate,0);if(event.target?.closest?.('#refreshNews'))allowNewsFetch=true},true);
  window.addEventListener('jarvis:news-updated',()=>{allowNewsFetch=true});
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>setTimeout(decorate,0),{once:true});else setTimeout(decorate,0);
})();
