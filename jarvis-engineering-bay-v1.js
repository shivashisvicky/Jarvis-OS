(() => {
  'use strict';
  if (window.__JARVIS_ENGINEERING_BAY_V1__) return;
  window.__JARVIS_ENGINEERING_BAY_V1__ = true;

  const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]));
  const style = () => {
    if (document.querySelector('#jarvis-engineering-bay-style')) return;
    const s = document.createElement('style');
    s.id = 'jarvis-engineering-bay-style';
    s.textContent = `
      .jbay{display:grid;gap:12px}.jbay-tools{display:flex;gap:7px;flex-wrap:wrap}.jbay-tool{border:1px solid #17303a;background:#071017;color:#8ca6ae;border-radius:8px;padding:8px 12px;cursor:pointer}.jbay-tool.active{color:#dffaff;border-color:#3a8294}.jbay-pane{display:none;gap:10px}.jbay-pane.active{display:grid}.jbay-pane textarea{width:100%;min-height:170px;box-sizing:border-box;background:#050b10;border:1px solid #17303a;border-radius:8px;color:#dffaff;padding:11px;font:12px/1.5 ui-monospace,SFMono-Regular,Consolas,monospace;resize:vertical}.jbay-output{white-space:pre-wrap;overflow:auto;max-height:360px;background:#050b10;border:1px solid #142b34;border-radius:8px;padding:12px;font:12px/1.5 ui-monospace,SFMono-Regular,Consolas,monospace;color:#bfe5ed}.jbay-status{font-size:11px;color:#78939c}
    `;
    document.head.appendChild(s);
  };

  const bay = () => `
    <section class="panel jbay" id="jarvisEngineeringBay">
      <div class="panel-head"><span>ENGINEERING BAY / INTELLIGENCE TOOLS</span><span class="live">READY</span></div>
      <div class="jbay-tools">
        <button class="jbay-tool active" data-jbay-tool="json">JSON</button>
        <button class="jbay-tool" data-jbay-tool="jwt">JWT</button>
        <button class="jbay-tool" data-jbay-tool="diff">DIFF</button>
      </div>
      <div class="jbay-pane active" data-jbay-pane="json">
        <textarea id="jbayJson" spellcheck="false" placeholder='Paste JSON here…'></textarea>
        <div class="jbay-tools"><button class="primary" id="jbayFormat">FORMAT JSON</button><button class="secondary" id="jbayMinify">MINIFY</button></div>
        <div class="jbay-status" id="jbayJsonStatus">READY</div>
      </div>
      <div class="jbay-pane" data-jbay-pane="jwt">
        <textarea id="jbayJwt" spellcheck="false" placeholder="Paste a JWT here. This decodes locally in your browser."></textarea>
        <button class="primary" id="jbayDecode">DECODE JWT</button>
        <pre class="jbay-output" id="jbayJwtOutput">Decoded header and payload will appear here.</pre>
      </div>
      <div class="jbay-pane" data-jbay-pane="diff">
        <textarea id="jbayLeft" spellcheck="false" placeholder="Original text / payload"></textarea>
        <textarea id="jbayRight" spellcheck="false" placeholder="New text / payload"></textarea>
        <button class="primary" id="jbayCompare">COMPARE</button>
        <pre class="jbay-output" id="jbayDiffOutput">Comparison will appear here.</pre>
      </div>
    </section>`;

  const decodePart = part => {
    try { const normalized = part.replace(/-/g,'+').replace(/_/g,'/').padEnd(Math.ceil(part.length/4)*4,'='); return JSON.parse(decodeURIComponent(Array.from(atob(normalized), c => '%' + c.charCodeAt(0).toString(16).padStart(2,'0')).join(''))); }
    catch { return null; }
  };

  const lineDiff = (a,b) => {
    const left = String(a ?? '').split('\n'); const right = String(b ?? '').split('\n');
    const max = Math.max(left.length,right.length); const out=[];
    for(let i=0;i<max;i++){
      const l=left[i],r=right[i];
      if(l===r) out.push(`  ${String(i+1).padStart(4,' ')}  ${l ?? ''}`);
      else { if(l!==undefined) out.push(`- ${String(i+1).padStart(4,' ')}  ${l}`); if(r!==undefined) out.push(`+ ${String(i+1).padStart(4,' ')}  ${r}`); }
    }
    return out.join('\n') || '(empty)';
  };

  function bind(){
    const host=document.querySelector('#jarvisApiLab');
    if(!host || document.querySelector('#jarvisEngineeringBay')) return;
    host.parentElement?.insertBefore(document.createRange().createContextualFragment(bay()), host);
    document.querySelectorAll('[data-jbay-tool]').forEach(btn=>btn.addEventListener('click',()=>{
      const name=btn.getAttribute('data-jbay-tool');
      document.querySelectorAll('[data-jbay-tool]').forEach(x=>x.classList.toggle('active',x===btn));
      document.querySelectorAll('[data-jbay-pane]').forEach(x=>x.classList.toggle('active',x.getAttribute('data-jbay-pane')===name));
    }));
    document.querySelector('#jbayFormat')?.addEventListener('click',()=>{
      const e=document.querySelector('#jbayJson'); const st=document.querySelector('#jbayJsonStatus');
      try{e.value=JSON.stringify(JSON.parse(e.value),null,2);st.textContent='VALID JSON · FORMATTED'}catch(err){st.textContent=`INVALID JSON · ${err.message||err}`}
    });
    document.querySelector('#jbayMinify')?.addEventListener('click',()=>{
      const e=document.querySelector('#jbayJson'); const st=document.querySelector('#jbayJsonStatus');
      try{e.value=JSON.stringify(JSON.parse(e.value));st.textContent='VALID JSON · MINIFIED'}catch(err){st.textContent=`INVALID JSON · ${err.message||err}`}
    });
    document.querySelector('#jbayDecode')?.addEventListener('click',()=>{
      const raw=document.querySelector('#jbayJwt').value.trim(); const out=document.querySelector('#jbayJwtOutput');
      const parts=raw.split('.'); if(parts.length!==3){out.textContent='Invalid JWT: expected header.payload.signature';return;}
      const header=decodePart(parts[0]),payload=decodePart(parts[1]);
      out.textContent=header&&payload?JSON.stringify({header,payload,signaturePresent:Boolean(parts[2])},null,2):'Unable to decode JWT header/payload as JSON.';
    });
    document.querySelector('#jbayCompare')?.addEventListener('click',()=>{
      const l=document.querySelector('#jbayLeft').value,r=document.querySelector('#jbayRight').value; document.querySelector('#jbayDiffOutput').textContent=lineDiff(l,r);
    });
  }
  style();
  new MutationObserver(bind).observe(document.documentElement,{childList:true,subtree:true});
  bind();
})();
