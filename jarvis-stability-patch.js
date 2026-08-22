(() => {
  'use strict';
  if (window.__JARVIS_STABILITY_PATCH__) return;
  window.__JARVIS_STABILITY_PATCH__ = true;

  const stopSpeech = () => {
    try {
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
        window.speechSynthesis.resume();
      }
    } catch {}
  };

  // Do not load the old engineering observer. The stable patch below owns API Lab/SFTP.
  const installLoaderGuard = () => {
    const loader = window.jarvisLoadFeature;
    if (typeof loader !== 'function' || loader.__jarvisStableGuard) return false;
    const guarded = feature => feature === 'engineering' ? Promise.resolve(true) : loader(feature);
    guarded.__jarvisStableGuard = true;
    window.jarvisLoadFeature = guarded;
    return true;
  };
  const waitForLoader = () => {
    if (!installLoaderGuard()) window.setTimeout(waitForLoader, 25);
  };
  waitForLoader();

  const style = document.createElement('style');
  style.textContent = `
    .jarvis-stability-stop{display:inline-flex;align-items:center;justify-content:center;margin:7px 0 0;padding:8px 14px;border:1px solid var(--line-strong,#23414c);border-radius:8px;background:rgba(7,18,24,.9);color:var(--muted,#78939c);font:700 10px/1 inherit;letter-spacing:.12em;cursor:pointer}
    .jarvis-stability-stop:hover{color:var(--cyan2,#dffaff);border-color:var(--cyan,#55d8ff)}
    .jarvis-stability-eng{display:grid;gap:12px}
    .jarvis-stability-eng .eng-grid{display:grid;grid-template-columns:1fr 1fr;gap:10px}
    .jarvis-stability-eng label{display:grid;gap:5px;font-size:10px;color:#718b94;text-transform:uppercase;letter-spacing:.08em}
    .jarvis-stability-eng input,.jarvis-stability-eng select,.jarvis-stability-eng textarea{width:100%;box-sizing:border-box;background:#071017;border:1px solid #17303a;border-radius:8px;color:#dffaff;padding:10px;font:inherit}
    .jarvis-stability-eng textarea{min-height:130px;resize:vertical;font-family:ui-monospace,SFMono-Regular,Consolas,monospace}
    .jarvis-stability-actions{display:flex;gap:8px;flex-wrap:wrap}
    .jarvis-stability-output{white-space:pre-wrap;overflow:auto;max-height:420px;background:#050b10;border:1px solid #142b34;border-radius:8px;padding:12px;font:12px/1.5 ui-monospace,SFMono-Regular,Consolas,monospace;color:#bfe5ed;min-height:120px}
    .jarvis-stability-status{font-size:11px;color:#78939c}
    .jarvis-stability-note{font-size:11px;line-height:1.5;color:#78939c}
    @media(max-width:760px){
      .rail{overflow-x:auto!important;overflow-y:hidden!important;-webkit-overflow-scrolling:touch!important}
      .rail .nav-group{display:flex!important;flex:0 0 max-content!important;gap:4px!important;min-width:max-content!important}
      .rail .nav{flex:0 0 64px!important;width:64px!important;min-width:64px!important}
      .rail::-webkit-scrollbar{display:none}
      .jarvis-stability-eng .eng-grid{grid-template-columns:1fr}
    }
  `;
  document.head.appendChild(style);

  const addStopButton = () => {
    const surface = document.querySelector('.command-surface');
    const reply = document.querySelector('#jarvisReply');
    if (!surface || !reply || document.querySelector('#jarvisStabilityStop')) return;
    const button = document.createElement('button');
    button.type = 'button';
    button.id = 'jarvisStabilityStop';
    button.className = 'jarvis-stability-stop';
    button.textContent = 'STOP VOICE';
    button.hidden = true;
    button.addEventListener('click', stopSpeech);
    reply.insertAdjacentElement('afterend', button);
  };

  const apiHtml = () => `
    <section class="panel jarvis-stability-eng" id="jarvisStableApiLab">
      <div class="eng-grid">
        <label>Method<select id="stableApiMethod"><option>GET</option><option>POST</option><option>PUT</option><option>PATCH</option><option>DELETE</option><option>HEAD</option></select></label>
        <label>URL<input id="stableApiUrl" placeholder="https://api.example.com/endpoint" spellcheck="false"></label>
      </div>
      <label>Headers<textarea id="stableApiHeaders" placeholder='{"Content-Type":"application/json","Authorization":"Bearer …"}'></textarea></label>
      <label>Request body<textarea id="stableApiBody" placeholder='{"hello":"world"}'></textarea></label>
      <div class="jarvis-stability-actions"><button class="primary" id="stableApiSend">SEND REQUEST</button><button class="secondary" id="stableApiTest">TEST CONNECTOR</button><button class="secondary" id="stableApiClear">CLEAR</button></div>
      <div class="jarvis-stability-status" id="stableApiStatus">READY</div>
      <pre class="jarvis-stability-output" id="stableApiOutput">Response will appear here.</pre>
      <p class="jarvis-stability-note">TEST CONNECTOR performs a lightweight GET and reports HTTP status, latency and browser CORS reachability.</p>
    </section>`;

  const sftpHtml = () => `
    <section class="panel jarvis-stability-eng" id="jarvisStableSftp">
      <div class="eng-grid">
        <label>Host<input id="stableSftpHost" placeholder="sftp.example.com"></label>
        <label>Port<input id="stableSftpPort" value="22" inputmode="numeric"></label>
        <label>Username<input id="stableSftpUser" placeholder="username"></label>
        <label>Remote path<input id="stableSftpPath" value="/" placeholder="/home/user"></label>
      </div>
      <label>Password<input id="stableSftpPass" type="password" placeholder="Not stored by JARVIS"></label>
      <div class="jarvis-stability-actions"><button class="primary" id="stableSftpPrepare">PREPARE CONNECTION</button><button class="secondary" id="stableSftpCopy">COPY COMMAND</button></div>
      <div class="jarvis-stability-status" id="stableSftpStatus">READY</div>
      <div class="jarvis-stability-output" id="stableSftpCommand">Enter a host and username to generate an SFTP command.</div>
      <p class="jarvis-stability-note">A browser cannot open arbitrary SSH/SFTP TCP sockets. This prepares the exact command/profile for a local SFTP client.</p>
    </section>`;

  const bindApi = () => {
    const url = document.querySelector('#stableApiUrl');
    if (!url || url.dataset.bound) return;
    url.dataset.bound = '1';
    const status = document.querySelector('#stableApiStatus');
    const output = document.querySelector('#stableApiOutput');
    const request = async testOnly => {
      const target = url.value.trim();
      if (!target) { if (status) status.textContent = 'ENTER A URL'; return; }
      const started = performance.now();
      if (status) status.textContent = testOnly ? 'TESTING CONNECTOR…' : 'SENDING…';
      try {
        const method = document.querySelector('#stableApiMethod')?.value || 'GET';
        const headers = (() => { const raw = document.querySelector('#stableApiHeaders')?.value?.trim(); return raw ? JSON.parse(raw) : {}; })();
        const rawBody = document.querySelector('#stableApiBody')?.value || '';
        const response = await fetch(target, { method: testOnly ? 'GET' : method, headers: testOnly ? {Accept:'application/json,text/plain,*/*'} : headers, body: !testOnly && !['GET','HEAD'].includes(method) && rawBody.trim() ? rawBody : undefined, cache:'no-store', mode:'cors' });
        const text = await response.text();
        const ms = Math.round(performance.now() - started);
        if (status) status.textContent = `${testOnly ? 'CONNECTOR' : 'HTTP'} ${response.ok ? 'ONLINE' : 'REACHABLE'} · HTTP ${response.status} · ${ms} ms`;
        if (output) {
          if (testOnly) output.textContent = `URL: ${target}\nHTTP: ${response.status} ${response.statusText}\nLatency: ${ms} ms\nContent-Type: ${response.headers.get('content-type') || 'unknown'}\nCORS: browser request succeeded`;
          else { try { output.textContent = JSON.stringify(JSON.parse(text), null, 2); } catch { output.textContent = text || '(empty response)'; } }
        }
      } catch (error) {
        if (status) status.textContent = testOnly ? 'CONNECTOR TEST FAILED' : 'REQUEST FAILED';
        if (output) output.textContent = `URL: ${target}\nElapsed: ${Math.round(performance.now() - started)} ms\nError: ${String(error?.message || error)}\n\nIf the endpoint is reachable but blocks browser CORS, use a server-side gateway.`;
      }
    };
    document.querySelector('#stableApiSend')?.addEventListener('click', () => void request(false));
    document.querySelector('#stableApiTest')?.addEventListener('click', () => void request(true));
    document.querySelector('#stableApiClear')?.addEventListener('click', () => { ['stableApiUrl','stableApiHeaders','stableApiBody'].forEach(id => { const el=document.querySelector('#'+id); if(el) el.value=''; }); if(status) status.textContent='READY'; if(output) output.textContent='Response will appear here.'; });
  };

  const bindSftp = () => {
    const host = document.querySelector('#stableSftpHost');
    if (!host || host.dataset.bound) return;
    host.dataset.bound = '1';
    const build = () => {
      const h=host.value.trim(), p=document.querySelector('#stableSftpPort')?.value||'22', u=document.querySelector('#stableSftpUser')?.value.trim(), path=document.querySelector('#stableSftpPath')?.value||'/';
      const command=h&&u?`sftp -P ${p} ${u}@${h}:${path}`:'Enter a host and username to generate an SFTP command.';
      const out=document.querySelector('#stableSftpCommand'); const status=document.querySelector('#stableSftpStatus');
      if(out) out.textContent=command; if(status) status.textContent=h&&u?'CONNECTION PROFILE READY':'READY';
    };
    ['stableSftpHost','stableSftpPort','stableSftpUser','stableSftpPath'].forEach(id=>document.querySelector('#'+id)?.addEventListener('input',build));
    document.querySelector('#stableSftpPrepare')?.addEventListener('click',()=>{build();const s=document.querySelector('#stableSftpStatus');if(s)s.textContent='COMMAND READY · OPEN WITH YOUR SFTP CLIENT';});
    document.querySelector('#stableSftpCopy')?.addEventListener('click',async()=>{try{await navigator.clipboard.writeText(document.querySelector('#stableSftpCommand')?.textContent||'');const s=document.querySelector('#stableSftpStatus');if(s)s.textContent='COMMAND COPIED';}catch{const s=document.querySelector('#stableSftpStatus');if(s)s.textContent='COPY NOT AVAILABLE';}});
  };

  const patchEngineering = () => {
    const title = document.querySelector('.page-head h1')?.textContent?.trim();
    const workspace = document.querySelector('#workspace');
    if (!workspace || !title) return;
    if (title === 'API Lab' && !document.querySelector('#jarvisStableApiLab')) {
      const old = workspace.querySelector('.info-card'); if (old) old.outerHTML = apiHtml(); bindApi();
    }
    if (title === 'SFTP' && !document.querySelector('#jarvisStableSftp')) {
      const old = workspace.querySelector('.info-card'); if (old) old.outerHTML = sftpHtml(); bindSftp();
    }
  };

  const patch = () => { addStopButton(); patchEngineering(); };
  document.addEventListener('click', event => {
    const target = event.target instanceof Element ? event.target.closest('[data-app]') : null;
    if (target) window.setTimeout(patch, 30);
    if (target?.id === 'voiceBtn') { try { window.speechSynthesis?.resume(); } catch {} }
  }, true);
  window.addEventListener('jarvis:voice-command', () => { try { window.speechSynthesis?.resume(); } catch {} });
  window.addEventListener('jarvis:speech-rate-changed', () => {});

  const prime = () => {
    patch();
    window.setTimeout(patch, 250);
    window.setTimeout(patch, 800);
  };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', prime, {once:true}); else prime();
})();
