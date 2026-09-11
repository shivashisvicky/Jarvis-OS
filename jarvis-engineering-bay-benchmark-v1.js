(() => {
  'use strict';
  if (window.__JARVIS_ENGINEERING_BAY_BENCHMARK_V1__) return;
  window.__JARVIS_ENGINEERING_BAY_BENCHMARK_V1__ = true;

  const $ = (root, sel) => root.querySelector(sel);
  const button = (id, text, cls='secondary') => `<button type="button" class="${cls}" id="${id}">${text}</button>`;

  function style() {
    if (document.querySelector('#jbay-benchmark-style-v1')) return;
    const s = document.createElement('style'); s.id='jbay-benchmark-style-v1';
    s.textContent=`
      .jbay-bench-row{display:flex;gap:7px;flex-wrap:wrap;align-items:center}
      .jbay-bench-meta{display:grid;grid-template-columns:repeat(4,1fr);gap:7px;margin-top:8px}
      .jbay-bench-meta div{border:1px solid #17303a;border-radius:8px;padding:8px;background:#03090d}
      .jbay-bench-meta b{display:block;color:#dffaff;font-size:12px}.jbay-bench-meta span{font-size:8px;color:#78939c}
      .jbay-bench-note{font-size:9px;line-height:1.45;color:#78939c;margin:0}
      .jbay-bench-3d{width:100%;height:100%;min-height:280px;display:block;touch-action:none}
      .jbay-bench-3d canvas{display:block;width:100%;height:100%;touch-action:none}
      @media(max-width:760px){.jbay-bench-meta{grid-template-columns:1fr 1fr}.jbay-bench-3d{min-height:250px}}
    `; document.head.appendChild(s);
  }

  function enhancePayload(root) {
    const transform=$('#jbTransform',root), out=$('#jbTransformOut',root);
    if(transform&&out&&!$('#jbXmlJson',root)){
      $('#jbJsonXml',root)?.insertAdjacentHTML('afterend',button('jbXmlJson','XML → JSON'));
      $('#jbXmlJson',root)?.addEventListener('click',()=>{
        try{
          const xml=new DOMParser().parseFromString(transform.value,'application/xml');
          if(xml.querySelector('parsererror'))throw new Error('Invalid XML');
          const convert=node=>{const kids=[...node.children];if(!kids.length)return node.textContent??'';const obj={};kids.forEach(k=>{const v=convert(k);if(obj[k.tagName]===undefined)obj[k.tagName]=v;else obj[k.tagName]=Array.isArray(obj[k.tagName])?[...obj[k.tagName],v]:[obj[k.tagName],v]});return obj};
          out.textContent=JSON.stringify(convert(xml.documentElement),null,2);
        }catch(e){out.textContent='INVALID XML · '+(e?.message||e)}
      });
    }
    const jwtOut=$('#jbJwtOut',root);
    if(jwtOut&&!jwtOut.dataset.benchmark){jwtOut.dataset.benchmark='1';const note=document.createElement('p');note.className='jbay-bench-note';note.textContent='Decoded locally only. Signature and claims are not verified.';jwtOut.parentElement?.appendChild(note)}
    const regex=$('#jbRegex',root), regexOut=$('#jbRegexOut',root);
    if(regex&&regexOut&&!$('#jbRegexFlags',root)){
      regex.insertAdjacentHTML('afterend','<input class="jbay2-input" id="jbRegexFlags" value="g" placeholder="Flags: g i m u s y">');
      $('#jbRegexRun',root)?.addEventListener('click',()=>{try{const flags=($('#jbRegexFlags',root).value||'').trim();const r=new RegExp(regex.value,flags.includes('g')?flags:flags+'g');const t=$('#jbRegexText',root).value;regexOut.textContent=JSON.stringify([...t.matchAll(r)].map(m=>({match:m[0],index:m.index,groups:m.slice(1)})),null,2)||'(no matches)'}catch(e){regexOut.textContent='REGEX ERROR · '+(e?.message||e)}});
    }
    const transformCard=transform?.closest('.jbay2-card');
    if(transformCard&&!$('#jbBase64Utf8',transformCard)){
      transformCard.insertAdjacentHTML('beforeend','<p class="jbay-bench-note" id="jbBase64Utf8">Base64 uses UTF-8 bytes, so Unicode payloads remain round-trippable.</p>');
      const enc=$('#jbBase64e',root),dec=$('#jbBase64d',root);
      enc?.addEventListener('click',()=>{try{const bytes=new TextEncoder().encode(transform.value);let bin='';bytes.forEach(b=>bin+=String.fromCharCode(b));out.textContent=btoa(bin)}catch(e){out.textContent='BASE64 ERROR · '+(e?.message||e)}});
      dec?.addEventListener('click',()=>{try{const bin=atob(transform.value.trim());const bytes=Uint8Array.from(bin,c=>c.charCodeAt(0));out.textContent=new TextDecoder().decode(bytes)}catch(e){out.textContent='INVALID BASE64 · '+(e?.message||e)}});
    }
  }

  function enhanceApi(root){
    const card=$('#jbApiSend',root)?.closest('.jbay2-card');if(!card||card.dataset.benchmark)return;card.dataset.benchmark='1';
    $('#jbApiStatus',root)?.insertAdjacentHTML('afterend','<div class="jbay-bench-meta" id="jbApiMeta"><div><b id="jbApiCode">—</b><span>STATUS</span></div><div><b id="jbApiTime">—</b><span>TIME</span></div><div><b id="jbApiSize">—</b><span>BYTES</span></div><div><b id="jbApiType">—</b><span>CONTENT TYPE</span></div></div>');
    $('#jbApiOut',root)?.insertAdjacentHTML('afterend','<div class="jbay-bench-row" style="margin-top:8px">'+button('jbApiCopy','COPY RESPONSE')+'</div><pre class="jbay2-output" id="jbApiHeadersOut">Response headers will appear here.</pre>');
    $('#jbApiSend',root)?.addEventListener('click',async()=>{
      const url=$('#jbApiUrl',root).value.trim(),status=$('#jbApiStatus',root),out=$('#jbApiOut',root);if(!url)return;let headers={};
      try{const raw=$('#jbApiHeaders',root).value.trim();if(raw)headers=JSON.parse(raw);if(!headers||Array.isArray(headers)||typeof headers!=='object')throw new Error('Headers must be a JSON object')}catch(e){status.textContent='INVALID HEADERS · '+(e?.message||e);return}
      const method=$('#jbApiMethod',root).value,body=$('#jbApiBody',root).value;status.textContent='SENDING…';const t=performance.now();
      try{const r=await fetch(url,{method,headers,body:['GET','HEAD'].includes(method)?undefined:body,cache:'no-store'}),text=await r.text(),elapsed=Math.round(performance.now()-t);$('#jbApiCode',root).textContent=String(r.status);$('#jbApiTime',root).textContent=elapsed+' ms';$('#jbApiSize',root).textContent=String(new TextEncoder().encode(text).byteLength);$('#jbApiType',root).textContent=r.headers.get('content-type')||'unknown';$('#jbApiHeadersOut',root).textContent=[...r.headers.entries()].map(([k,v])=>k+': '+v).join('\n')||'(none exposed)';status.textContent=`HTTP ${r.status} · ${elapsed} ms · ${r.headers.get('content-type')||'response'}`;try{out.textContent=JSON.stringify(JSON.parse(text),null,2)}catch{out.textContent=text||'(empty response)'}}catch(e){status.textContent='REQUEST FAILED';out.textContent=String(e?.message||e)+'\n\nBrowser CORS rules may require an approved server-side gateway.'}
    });
    $('#jbApiCopy',root)?.addEventListener('click',async()=>{try{await navigator.clipboard.writeText($('#jbApiOut',root).textContent||'');$('#jbApiStatus',root).textContent='RESPONSE COPIED'}catch{$('#jbApiStatus',root).textContent='COPY FAILED'}});
    const apiPane=$('#jbApiSend',root).closest('.jbay2-pane');
    if(apiPane&&!$('#jbOpenApiInspect',apiPane)){
      apiPane.insertAdjacentHTML('beforeend',`<div class="jbay2-card"><h3>OPENAPI / SWAGGER INSPECTOR</h3><textarea class="jbay2-textarea" id="jbOpenApi" placeholder='Paste an OpenAPI JSON document…'></textarea><div class="jbay-bench-row">${button('jbOpenApiInspect','INSPECT','primary')}</div><pre class="jbay2-output" id="jbOpenApiOut">Routes and operations will appear here.</pre></div>`);
      $('#jbOpenApiInspect',root)?.addEventListener('click',()=>{try{const doc=JSON.parse($('#jbOpenApi',root).value),paths=doc.paths||{},rows=[];Object.entries(paths).forEach(([path,item])=>Object.keys(item||{}).filter(k=>['get','post','put','patch','delete','head','options','trace'].includes(k)).forEach(method=>rows.push(method.toUpperCase()+' '+path)));$('#jbOpenApiOut',root).textContent=JSON.stringify({openapi:doc.openapi||'unknown',title:doc.info?.title||'untitled',version:doc.info?.version||'unknown',routes:rows.length,operations:rows},null,2)}catch(e){$('#jbOpenApiOut',root).textContent='OPENAPI ERROR · '+(e?.message||e)}});
    }
  }

  function enhanceDev(root){
    const run=$('#jbPathRun',root),out=$('#jbPathOut',root);if(!run||!out||run.dataset.benchmark)return;run.dataset.benchmark='1';
    run.addEventListener('click',()=>{try{const rootValue=JSON.parse($('#jbPathJson',root).value),expr=$('#jbPath',root).value.trim();if(!expr.startsWith('$'))throw new Error('Path must start with $');const tokens=expr.match(/(?:^\$)|(?:\.([A-Za-z_$][\w$-]*))|(?:\[\"([^\"]+)\"\])|(?:\['([^']+)'\])|(?:\[(\d+)\])|(?:\[\*\])/g)||[];if(!tokens.length||tokens[0]!=='$')throw new Error('Unsupported JSONPath expression');let values=[rootValue];for(const token of tokens.slice(1)){if(token==='[*]')values=values.flatMap(v=>Array.isArray(v)?v:Object.values(v||{}));else if(/^\[\d+\]$/.test(token))values=values.map(v=>v?.[Number(token.slice(1,-1))]).filter(v=>v!==undefined);else{const key=(token.match(/^\.([\w$-]+)$/)||token.match(/^\[['\"](.+?)['\"]\]$/))?.[1];if(!key)throw new Error('Unsupported token '+token);values=values.flatMap(v=>Array.isArray(v)?v.map(x=>x?.[key]).filter(x=>x!==undefined):v?.[key]===undefined?[]:[v[key]])}}out.textContent=JSON.stringify(values.length===1?values[0]:values,null,2)}catch(e){out.textContent='JSONPATH ERROR · '+(e?.message||e)}});
  }

  function enhanceImage(root){
    const card=$('#jbImageFile',root)?.closest('.jbay2-card');if(!card||card.dataset.benchmark)return;card.dataset.benchmark='1';const controls=document.createElement('div');controls.className='jbay-bench-row';controls.innerHTML='<input class="jbay2-input" id="jbImgResizeW" type="number" min="1" placeholder="Width px" style="max-width:130px"><input class="jbay2-input" id="jbImgResizeH" type="number" min="1" placeholder="Height px" style="max-width:130px">'+button('jbImgResize','RESIZE','primary')+button('jbImgReset','RESET');$('#jbImageStatus',root)?.before(controls);
    $('#jbImgResize',root)?.addEventListener('click',()=>{const c=$('#jbImageCanvas',root),w=Math.max(1,Number($('#jbImgResizeW',root).value)||c.width),h=Math.max(1,Number($('#jbImgResizeH',root).value)||c.height),copy=document.createElement('canvas');copy.width=c.width;copy.height=c.height;copy.getContext('2d').drawImage(c,0,0);c.width=w;c.height=h;c.getContext('2d').drawImage(copy,0,0,w,h);$('#jbImageStatus',root).textContent=`RESIZED · ${w} × ${h}`});
    $('#jbImgReset',root)?.addEventListener('click',()=>{$('#jbImageFile',root).value='';$('#jbImageStatus',root).textContent='Choose an image. Processing stays in the browser.';$('#jbImgW',root).textContent='—';$('#jbImgH',root).textContent='—';$('#jbImgType',root).textContent='—';const c=$('#jbImageCanvas',root);c.width=640;c.height=360;c.getContext('2d').clearRect(0,0,c.width,c.height)});
  }

  let threePromise=null;
  async function loadThree(){if(threePromise)return threePromise;threePromise=Promise.all([import('https://esm.sh/three@0.186.0'),import('https://esm.sh/three@0.186.0/examples/jsm/controls/OrbitControls.js'),import('https://esm.sh/three@0.186.0/examples/jsm/exporters/OBJExporter.js'),import('https://esm.sh/three@0.186.0/examples/jsm/exporters/GLTFExporter.js')]).then(([THREE,controls,obj,gltf])=>({THREE,OrbitControls:controls.OrbitControls,OBJExporter:obj.OBJExporter,GLTFExporter:gltf.GLTFExporter}));return threePromise}
  async function init3D(root){
    const model=$('#jb3Model',root);if(!model||model.dataset.webgl)return;model.dataset.webgl='loading';model.innerHTML='<div class="jbay-bench-note">Loading WebGL 3D engine…</div>';
    try{
      const {THREE,OrbitControls,OBJExporter,GLTFExporter}=await loadThree();model.classList.add('jbay-bench-3d');model.innerHTML='';
      const scene=new THREE.Scene();scene.background=new THREE.Color(0x01070b);const camera=new THREE.PerspectiveCamera(42,1,.01,1000);camera.position.set(3.6,3.1,4.4);const renderer=new THREE.WebGLRenderer({antialias:true,alpha:true,powerPreference:'low-power'});renderer.setPixelRatio(Math.min(2,window.devicePixelRatio||1));renderer.outputColorSpace=THREE.SRGBColorSpace;model.appendChild(renderer.domElement);
      scene.add(new THREE.HemisphereLight(0xbfefff,0x10232a,2.1));const key=new THREE.DirectionalLight(0xffffff,2.2);key.position.set(4,6,5);scene.add(key);const grid=new THREE.GridHelper(8,16,0x23505d,0x10252c);grid.position.y=-.01;scene.add(grid);
      let mesh=null;const controls=new OrbitControls(camera,renderer.domElement);controls.enableDamping=true;controls.dampingFactor=.08;controls.minDistance=1;controls.maxDistance=30;controls.target.set(0,0,0);controls.saveState();
      const resize=()=>{const r=model.getBoundingClientRect();renderer.setSize(Math.max(240,r.width),Math.max(220,r.height),false);camera.aspect=Math.max(.5,r.width)/Math.max(220,r.height);camera.updateProjectionMatrix()};
      const build=()=>{const w=Math.max(.01,Number($('#jb3w',root).value)||2);const h=Math.max(.01,Number($('#jb3h',root).value)||2);const d=Math.max(.01,Number($('#jb3d',root).value)||2);if(mesh){scene.remove(mesh);mesh.geometry.dispose();mesh.material.dispose()}mesh=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),new THREE.MeshStandardMaterial({color:0x4c9bad,metalness:.18,roughness:.42,transparent:true,opacity:.86}));scene.add(mesh);const max=Math.max(w,h,d);camera.position.set(max*1.8,max*1.55,max*2.1);controls.target.set(0,0,0);controls.update();resize();$('#jb3Status',root).textContent=`${w} × ${h} × ${d} ${$('#jb3u',root).value} · ${Number((w*h*d).toFixed(3))} ${$('#jb3u',root).value}³ · WebGL`};
      build();$('#jb3Build',root).addEventListener('click',build);$('#jb3w',root).addEventListener('input',build);$('#jb3h',root).addEventListener('input',build);$('#jb3d',root).addEventListener('input',build);
      $('#jb3Obj',root).onclick=()=>{if(!mesh)return;const text=new OBJExporter().parse(mesh),a=document.createElement('a');a.href=URL.createObjectURL(new Blob([text],{type:'text/plain'}));a.download='jarvis-object.obj';a.click();setTimeout(()=>URL.revokeObjectURL(a.href),1000)};
      $('#jb3ResetBench',root)?.addEventListener('click',()=>controls.reset());
      $('#jb3Glb',root)?.addEventListener('click',async()=>{try{const data=await new GLTFExporter().parseAsync(mesh,{binary:true});const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([data],{type:'model/gltf-binary'}));a.download='jarvis-object.glb';a.click();setTimeout(()=>URL.revokeObjectURL(a.href),1000)}catch(e){$('#jb3Status',root).textContent='GLB EXPORT FAILED · '+(e?.message||e)}});
      new ResizeObserver(resize).observe(model);model.dataset.webgl='ready';const tick=()=>{if(!document.contains(model)||!root.classList.contains('open')){renderer.dispose();return}controls.update();renderer.render(scene,camera);requestAnimationFrame(tick)};requestAnimationFrame(tick);
    }catch(e){model.dataset.webgl='fallback';model.innerHTML='<div class="jbay-bench-note">WebGL enhancement unavailable. The dependency-light CSS 3D preview remains available.</div>';console.warn('[JARVIS Engineering Bay 3D]',e)}
  }
  function enhanceSpatial(root){const pane=$('[data-pane="spatial"]',root);if(!pane||pane.dataset.benchmark)return;pane.dataset.benchmark='1';const actions=$('#jb3Build',root)?.parentElement;if(actions)actions.insertAdjacentHTML('beforeend',button('jb3Glb','EXPORT GLB')+button('jb3ResetBench','RESET VIEW'));root.querySelectorAll('[data-jbay2="spatial"]').forEach(b=>b.addEventListener('click',()=>setTimeout(()=>init3D(root),0)));if(pane.classList.contains('active'))setTimeout(()=>init3D(root),0)}
  function enhance(root){if(!root||root.dataset.jbayBenchmarkBound)return;root.dataset.jbayBenchmarkBound='1';enhancePayload(root);enhanceApi(root);enhanceDev(root);enhanceImage(root);enhanceSpatial(root)}
  style();const scan=()=>{const root=document.querySelector('#jarvisEngineeringBay');if(root)enhance(root)};new MutationObserver(scan).observe(document.documentElement,{childList:true,subtree:true});scan();
})();