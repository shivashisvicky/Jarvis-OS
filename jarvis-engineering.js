(() => {
  'use strict';
  if (window.__JARVIS_ENGINEERING__) return;
  window.__JARVIS_ENGINEERING__ = true;

  const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]));
  const endpoint = () => document.querySelector('meta[name="jarvis-intelligence-endpoint"]')?.content || '';
  const gateway = () => endpoint().replace(/\/api\/(?:openai-intelligence|intelligence)\/?$/, '');

  const css = () => {
    if (document.querySelector('#jarvis-engineering-style')) return;
    const s = document.createElement('style'); s.id = 'jarvis-engineering-style';
    s.textContent = `
      .eng-panel{display:grid;gap:12px}.eng-grid{display:grid;grid-template-columns:1fr 1fr;gap:10px}.eng-grid label{display:grid;gap:5px;font-size:10px;color:#718b94;text-transform:uppercase;letter-spacing:.08em}.eng-panel input,.eng-panel select,.eng-panel textarea{width:100%;box-sizing:border-box;background:#071017;border:1px solid #17303a;border-radius:8px;color:#dffaff;padding:10px;font:inherit}.eng-panel textarea{min-height:150px;resize:vertical;font-family:ui-monospace,SFMono-Regular,Consolas,monospace}.eng-actions{display:flex;gap:8px;flex-wrap:wrap}.eng-output{white-space:pre-wrap;overflow:auto;max-height:420px;background:#050b10;border:1px solid #142b34;border-radius:8px;padding:12px;font:12px/1.5 ui-monospace,SFMono-Regular,Consolas,monospace;color:#bfe5ed}.eng-status{font-size:11px;color:#78939c}.eng-tabs{display:flex;gap:7px}.eng-tab{padding:8px 12px;border:1px solid #17303a;background:#071017;color:#8ca6ae;border-radius:8px;cursor:pointer}.eng-tab.active{color:#dffaff;border-color:#3a8294}.sftp-note{font-size:11px;line-height:1.5;color:#78939c}.sftp-command{white-space:pre-wrap;background:#050b10;border:1px solid #142b34;border-radius:8px;padding:12px;font:12px/1.5 ui-monospace,SFMono-Regular,Consolas,monospace;color:#bfe5ed}@media(max-width:700px){.eng-grid{grid-template-columns:1fr}}
    `; document.head.appendChild(s);
  };

  const apiLab = () => `
    <section class="panel eng-panel" id="jarvisApiLab">
      <div class="eng-grid">
        <label>Method<select id="apiMethod"><option>GET</option><option>POST</option><option>PUT</option><option>PATCH</option><option>DELETE</option><option>HEAD</option></select></label>
        <label>URL<input id="apiUrl" placeholder="https://api.example.com/endpoint" spellcheck="false"></label>
      </div>
      <label>Headers<textarea id="apiHeaders" placeholder='{"Content-Type":"application/json","Authorization":"Bearer …"}'></textarea></label>
      <label>Request body<textarea id="apiBody" placeholder='{"hello":"world"}'></textarea></label>
      <div class="eng-actions"><button class="primary" id="apiSend">SEND REQUEST</button><button class="secondary" id="apiTestConnector">TEST CONNECTOR</button><button class="secondary" id="apiClear">CLEAR</button></div>
      <div class="eng-status" id="apiStatus">READY</div>
      <pre class="eng-output" id="apiOutput">Response will appear here.</pre>
      <p class="sftp-note">TEST CONNECTOR performs a lightweight GET against the URL above and reports reachability, HTTP status and latency. Browser CORS rules still apply.</p>
    </section>`;

  const sftp = () => `
    <section class="panel eng-panel" id="jarvisSftp">
      <div class="eng-grid">
        <label>Host<input id="sftpHost" placeholder="sftp.example.com"></label>
        <label>Port<input id="sftpPort" value="22" inputmode="numeric"></label>
        <label>Username<input id="sftpUser" placeholder="username"></label>
        <label>Remote path<input id="sftpPath" value="/" placeholder="/home/user"></label>
      </div>
      <label>Password<input id="sftpPass" type="password" placeholder="Only used to generate a local command"></label>
      <div class="eng-actions"><button class="primary" id="sftpConnect">PREPARE CONNECTION</button><button class="secondary" id="sftpCopy">COPY COMMAND</button></div>
      <div class="eng-status" id="sftpStatus">READY</div>
      <div class="sftp-command" id="sftpCommand">Enter a host and username to generate an SFTP command.</div>
      <p class="sftp-note">Browser security does not allow a normal web page to open arbitrary SSH/SFTP TCP connections. JARVIS prepares the exact command/profile for your local SFTP client. A future secure gateway can provide browser-native transfers without exposing SSH credentials to the browser.</p>
    </section>`;

  async function sendApi() {
    const method = document.querySelector('#apiMethod')?.value || 'GET';
    const url = document.querySelector('#apiUrl')?.value.trim();
    const status = document.querySelector('#apiStatus'); const output = document.querySelector('#apiOutput');
    if (!url) { status.textContent='ENTER A URL'; return; }
    let headers = {}; let body;
    try { const raw = document.querySelector('#apiHeaders')?.value.trim(); if (raw) headers = JSON.parse(raw); } catch { status.textContent='INVALID JSON HEADERS'; return; }
    const rawBody = document.querySelector('#apiBody')?.value || '';
    if (!['GET','HEAD'].includes(method) && rawBody.trim()) body = rawBody;
    status.textContent='SENDING…'; output.textContent=''; const started=performance.now();
    try {
      const r=await fetch(url,{method,headers,body,cache:'no-store'});
      const text=await r.text(); const elapsed=Math.round(performance.now()-started);
      status.textContent=`HTTP ${r.status} · ${elapsed} ms · ${r.headers.get('content-type')||'response'}`;
      try { output.textContent=JSON.stringify(JSON.parse(text),null,2); } catch { output.textContent=text || '(empty response)'; }
    } catch(e) { status.textContent='REQUEST FAILED'; output.textContent=String(e?.message||e)+'\n\nIf this is a CORS error, the target API must permit browser requests or be routed through an approved server-side gateway.'; }
  }

  async function testConnector() {
    const url=document.querySelector('#apiUrl')?.value.trim();
    const status=document.querySelector('#apiStatus'); const output=document.querySelector('#apiOutput');
    if(!url){status.textContent='ENTER A URL';return;}
    status.textContent='TESTING CONNECTOR…'; output.textContent=''; const started=performance.now();
    try{
      const r=await fetch(url,{method:'GET',headers:{Accept:'application/json,text/plain,*/*'},cache:'no-store',mode:'cors'});
      const elapsed=Math.round(performance.now()-started);
      const contentType=r.headers.get('content-type')||'unknown';
      status.textContent=`CONNECTOR ${r.ok?'ONLINE':'REACHABLE'} · HTTP ${r.status} · ${elapsed} ms`;
      output.textContent=`URL: ${url}\nHTTP: ${r.status} ${r.statusText}\nLatency: ${elapsed} ms\nContent-Type: ${contentType}\nCORS: browser request succeeded`;
    }catch(e){
      const elapsed=Math.round(performance.now()-started);
      status.textContent='CONNECTOR TEST FAILED';
      output.textContent=`URL: ${url}\nElapsed: ${elapsed} ms\nError: ${String(e?.message||e)}\n\nIf the endpoint is reachable but does not permit browser CORS, use a server-side gateway or configure Access-Control-Allow-Origin on the target.`;
    }
  }

  function setupApi() {
    const host=document.querySelector('#apiUrl'); if(!host || host.dataset.bound) return; host.dataset.bound='1';
    document.querySelector('#apiSend')?.addEventListener('click',sendApi);
    document.querySelector('#apiTestConnector')?.addEventListener('click',testConnector);
    document.querySelector('#apiClear')?.addEventListener('click',()=>{['apiUrl','apiHeaders','apiBody'].forEach(id=>{const e=document.querySelector('#'+id);if(e)e.value=''});document.querySelector('#apiStatus').textContent='READY';document.querySelector('#apiOutput').textContent='Response will appear here.'});
  }
  function setupSftp(){
    const host=document.querySelector('#sftpHost'); if(!host || host.dataset.bound)return; host.dataset.bound='1';
    const build=()=>{const h=host.value.trim(),p=document.querySelector('#sftpPort')?.value||'22',u=document.querySelector('#sftpUser')?.value.trim(),path=document.querySelector('#sftpPath')?.value||'/';const cmd=h&&u?`sftp -P ${p} ${u}@${h}:${path}`:'Enter a host and username to generate an SFTP command.';document.querySelector('#sftpCommand').textContent=cmd;document.querySelector('#sftpStatus').textContent=h&&u?'CONNECTION PROFILE READY':'READY'};
    ['sftpHost','sftpPort','sftpUser','sftpPath'].forEach(id=>document.querySelector('#'+id)?.addEventListener('input',build));
    document.querySelector('#sftpConnect')?.addEventListener('click',()=>{build();document.querySelector('#sftpStatus').textContent='COMMAND READY · OPEN WITH YOUR SFTP CLIENT'});
    document.querySelector('#sftpCopy')?.addEventListener('click',async()=>{try{await navigator.clipboard.writeText(document.querySelector('#sftpCommand').textContent||'');document.querySelector('#sftpStatus').textContent='COMMAND COPIED'}catch{document.querySelector('#sftpStatus').textContent='COPY NOT AVAILABLE'}});
  }

  const render = () => {
    const title=document.querySelector('.page-head h1')?.textContent?.trim(); const ws=document.querySelector('#workspace'); if(!ws||!title)return;
    if(title==='API Lab' && !document.querySelector('#jarvisApiLab')) { const old=ws.querySelector('.info-card'); if(old) old.outerHTML=apiLab(); setupApi(); }
    if(title==='SFTP' && !document.querySelector('#jarvisSftp')) { const old=ws.querySelector('.info-card'); if(old) old.outerHTML=sftp(); setupSftp(); }
  };
  css(); render(); new MutationObserver(()=>render()).observe(document.documentElement,{childList:true,subtree:true});
})();
