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
      .jbay-backdrop{position:fixed;inset:0;z-index:500;background:rgba(0,4,8,.78);backdrop-filter:blur(12px);display:none;padding:18px;box-sizing:border-box;overflow:auto}
      .jbay-backdrop.open{display:block}.jbay-shell{max-width:900px;margin:0 auto;border:1px solid #17303a;border-radius:16px;background:#020a10;box-shadow:0 24px 80px rgba(0,0,0,.7);overflow:hidden}.jbay-top{display:flex;align-items:center;justify-content:space-between;gap:10px;padding:14px 16px;border-bottom:1px solid #17303a}.jbay-title{font-size:12px;font-weight:800;letter-spacing:.12em;color:#dffaff}.jbay-close{border:1px solid #17303a;background:#071017;color:#8ca6ae;border-radius:8px;padding:7px 10px;cursor:pointer}.jbay{display:grid;gap:12px;padding:16px}.jbay-tools{display:flex;gap:7px;flex-wrap:wrap}.jbay-tool{border:1px solid #17303a;background:#071017;color:#8ca6ae;border-radius:8px;padding:8px 12px;cursor:pointer}.jbay-tool.active{color:#dffaff;border-color:#3a8294}.jbay-pane{display:none;gap:10px}.jbay-pane.active{display:grid}.jbay-pane textarea{width:100%;min-height:170px;box-sizing:border-box;background:#050b10;border:1px solid #17303a;border-radius:8px;color:#dffaff;padding:11px;font:12px/1.5 ui-monospace,SFMono-Regular,Consolas,monospace;resize:vertical}.jbay-output{white-space:pre-wrap;overflow:auto;max-height:360px;background:#050b10;border:1px solid #142b34;border-radius:8px;padding:12px;font:12px/1.5 ui-monospace,SFMono-Regular,Consolas,monospace;color:#bfe5ed}.jbay-status{font-size:11px;color:#78939c}
      @media(max-width:760px){.jbay-backdrop{padding:8px}.jbay-shell{border-radius:12px}.jbay{padding:12px}.jbay-pane textarea{min-height:145px}}
    `;
    document.head.appendChild(s);
  };

  const bay = () => `
    <div class="jbay-backdrop" id="jarvisEngineeringBayOverlay" role="dialog" aria-modal="true" aria-label="Engineering Bay">
      <section class="jbay-shell">
        <div class="jbay-top"><span class="jbay-title">ENGINEERING BAY / INTELLIGENCE TOOLS</span><button type="button" class="jbay-close" id="jbayClose">CLOSE</button></div>
        <section class="jbay">
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
        </section>
      </section>
    </div>`;

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

  function bindOverlay(){
    const overlay=document.querySelector('#jarvisEngineeringBayOverlay');
    if(!overlay || overlay.dataset.bound) return;
    overlay.dataset.bound='1';
    overlay.addEventListener('click',event=>{if(event.target===overlay) overlay.classList.remove('open');});
    document.querySelector('#jbayClose')?.addEventListener('click',()=>overlay.classList.remove('open'));
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

  function open(){
    let overlay=document.querySelector('#jarvisEngineeringBayOverlay');
    if(!overlay){document.body.insertAdjacentHTML('beforeend',bay());bindOverlay();overlay=document.querySelector('#jarvisEngineeringBayOverlay');}
    overlay?.classList.add('open');
  }

  style();
  window.addEventListener('jarvis:open-engineering-bay',open);
})();