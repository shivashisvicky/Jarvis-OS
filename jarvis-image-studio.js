(() => {
  'use strict';
  if (window.__JARVIS_IMAGE_STUDIO__) return;
  window.__JARVIS_IMAGE_STUDIO__ = true;

  const ENDPOINT = 'https://jarvis-image-test.shivashisvicky112.workers.dev/api/image';
  const ENHANCE_ENDPOINT = 'https://jarvis-image-test.shivashisvicky112.workers.dev/api/enhance';
  const state = { file: null, mimeType: 'image/jpeg', base64: '', originalBase64: '', originalMimeType: 'image/jpeg', mode: 'edit', operation: 'enhance', result: null, resultMimeType: 'image/png', sourceWidth: 0, sourceHeight: 0 };
  const esc = value => String(value ?? '').replace(/[&<>\"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;',"'":'&#039;'}[c]));
  const presets = {
    enhance: 'Enhance this image while preserving the exact subject, identity, composition, framing, and important details. Improve clarity, fine detail, dynamic range, exposure, natural color, and realistic lighting. Reduce noise and compression artifacts. Keep the result photorealistic and do not invent or remove meaningful objects.',
    restore: 'Restore this photograph carefully. Remove scratches, dust, noise, blur, and obvious compression damage while preserving the original people, faces, clothing, architecture, composition, and historical character. Recover natural detail and balanced color without making it look artificial.',
    portrait: 'Turn this into a polished professional portrait. Preserve the person exactly, including identity, facial structure, skin tone, hair, and expression. Improve lighting, skin detail, sharpness, depth, and background separation naturally. Avoid plastic skin or identity changes.',
    product: 'Create a premium product photograph from this image. Preserve the exact product design, proportions, branding, and important markings. Improve lighting, material detail, reflections, sharpness, color accuracy, and background cleanliness while keeping the product truthful.',
    cinematic: 'Give this image a refined cinematic photographic grade. Preserve the exact subject and composition. Improve lighting, contrast, color separation, atmospheric depth, and fine detail with a realistic high-end film look. Do not change the subject or add objects.',
  };

  function compress(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onerror = () => reject(new Error('Could not read the image.'));
      reader.onload = () => {
        const originalUrl = String(reader.result);
        const img = new Image();
        img.onerror = () => reject(new Error('Unsupported image.'));
        img.onload = () => {
          const max = 480;
          const scale = Math.min(1, max / Math.max(img.naturalWidth, img.naturalHeight));
          const canvas = document.createElement('canvas');
          canvas.width = Math.max(1, Math.round(img.naturalWidth * scale));
          canvas.height = Math.max(1, Math.round(img.naturalHeight * scale));
          const ctx = canvas.getContext('2d', { alpha: false });
          if (!ctx) return reject(new Error('Image canvas unavailable.'));
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
          const mime = file.type === 'image/png' ? 'image/png' : 'image/jpeg';
          const quality = mime === 'image/jpeg' ? 0.88 : undefined;
          const packedUrl = canvas.toDataURL(mime, quality);
          resolve({ originalUrl, originalBase64: originalUrl.split(',')[1], originalMimeType: file.type || 'image/jpeg', url: packedUrl, base64: packedUrl.split(',')[1], mimeType: mime, width: img.naturalWidth, height: img.naturalHeight });
        };
        img.src = originalUrl;
      };
      reader.readAsDataURL(file);
    });
  }

  function outputDimensions(width, height) {
    if (!width || !height) return { width: 1024, height: 768 };
    const max = 1024;
    const scale = Math.min(1, max / Math.max(width, height));
    const scaledWidth = width * scale;
    const scaledHeight = height * scale;
    let outWidth, outHeight;
    if (scaledWidth >= scaledHeight) {
      outWidth = Math.max(256, Math.min(1024, Math.round(scaledWidth / 64) * 64));
      outHeight = Math.max(256, Math.min(1024, Math.round((outWidth * height / width) / 64) * 64));
    } else {
      outHeight = Math.max(256, Math.min(1024, Math.round(scaledHeight / 64) * 64));
      outWidth = Math.max(256, Math.min(1024, Math.round((outHeight * width / height) / 64) * 64));
    }
    return { width: outWidth, height: outHeight };
  }

  function render() {
    const host = document.querySelector('#visionLab');
    if (!host) return;
    host.innerHTML = `<div class="vision-toolbar" role="tablist" aria-label="Vision mode"><button type="button" class="vision-chip ${state.mode === 'edit' ? 'active' : ''}" data-mode="edit">ENHANCE / EDIT</button><button type="button" class="vision-chip ${state.mode === 'generate' ? 'active' : ''}" data-mode="generate">GENERATE</button></div>
    <div class="vision-grid"><section class="vision-card"><h3>${state.mode === 'edit' ? 'Source image' : 'Creative brief'}</h3>
    ${state.mode === 'edit' ? `<label class="vision-drop" id="visionDrop"><input id="visionFile" type="file" accept="image/jpeg,image/png,image/webp"><span><strong>${state.file ? esc(state.file.name) : 'DROP AN IMAGE OR TAP TO CHOOSE'}</strong><small>${state.file ? `${state.file.type || 'image'} · ready for JARVIS Vision` : 'JPG, PNG or WebP · processed in memory only'}</small></span></label><div id="visionSourcePreview" style="margin-top:10px"></div>` : `<div class="vision-empty"><div><strong>Describe what you want JARVIS to create.</strong><br><small>No source image required.</small></div></div>`}
    <div style="margin-top:12px"><textarea id="visionPrompt" class="vision-prompt" placeholder="Tell JARVIS what to change…">${esc(state.prompt || (state.mode === 'edit' ? presets.enhance : 'A cinematic, photorealistic scene of a futuristic personal AI workspace at night, subtle blue interface glow, premium industrial design, wide composition.'))}</textarea></div>
    ${state.mode === 'edit' ? `<div class="vision-toolbar" style="margin-top:10px">${Object.keys(presets).map(key => `<button type="button" class="vision-chip" data-preset="${key}">${key.toUpperCase()}</button>`).join('')}</div>` : ''}
    <div class="vision-actions"><button type="button" class="primary" id="visionRun">${state.mode === 'generate' ? 'GENERATE IMAGE' : state.operation === 'enhance' ? 'ENHANCE IMAGE' : 'EDIT IMAGE'}</button><button type="button" class="secondary" id="visionClear">CLEAR</button></div>
    <div class="vision-status" id="visionStatus">${state.file ? 'SOURCE READY' : state.mode === 'edit' ? 'WAITING FOR IMAGE' : 'READY'}</div>
    <div class="vision-note">ENHANCE uses a dedicated faithful Cloudflare Images pipeline. It does not invoke the generative model. EDIT / GENERATE use the isolated TEST Workers AI model.</div></section>
    <section class="vision-card vision-result-wrap"><h3>JARVIS result</h3><div id="visionResult">${state.result ? `<img class="vision-preview" src="${state.result}" alt="JARVIS generated result"><button type="button" class="secondary vision-download" id="visionSave">SAVE</button>` : '<div class="vision-empty">Your enhanced or generated image will appear here.</div>'}</div></section></div>`;
    bind();
    if (state.file && state.sourceUrl) {
      const el = document.querySelector('#visionSourcePreview');
      if (el) el.innerHTML = `<img class="vision-preview" src="${state.sourceUrl}" alt="Selected source image">`;
    }
  }

  function setStatus(text) { const el = document.querySelector('#visionStatus'); if (el) el.textContent = text; }

  async function chooseFile(file) {
    if (!file || !/^image\/(jpeg|png|webp)$/i.test(file.type)) { setStatus('USE JPG, PNG OR WEBP'); return; }
    if (file.size > 15 * 1024 * 1024) { setStatus('IMAGE TOO LARGE'); return; }
    try {
      setStatus('PREPARING IMAGE…');
      const packed = await compress(file);
      state.file = file; state.sourceUrl = packed.originalUrl; state.base64 = packed.base64; state.mimeType = packed.mimeType; state.originalBase64 = packed.originalBase64; state.originalMimeType = packed.originalMimeType; state.sourceWidth = packed.width; state.sourceHeight = packed.height; state.operation = 'enhance'; state.result = null;
      render();
    } catch (error) { setStatus(error?.message || 'IMAGE PREPARATION FAILED'); }
  }

  function dataUrlToBlob(dataUrl) {
    const match = String(dataUrl).match(/^data:([^;,]+);base64,(.*)$/s);
    if (!match) throw new Error('Invalid image data.');
    const bytes = atob(match[2]);
    const out = new Uint8Array(bytes.length);
    for (let i = 0; i < bytes.length; i++) out[i] = bytes.charCodeAt(i);
    return new Blob([out], { type: match[1] || 'image/png' });
  }

  function saveResult() {
    if (!state.result) return;
    const button = document.querySelector('#visionSave');
    if (button) { button.disabled = true; button.textContent = 'SAVING…'; }
    try {
      const blob = dataUrlToBlob(state.result);
      const type = state.resultMimeType || blob.type || 'image/png';
      const ext = type.split('/')[1]?.replace('jpeg', 'jpg') || 'png';
      const file = new File([blob], `jarvis-vision-result.${ext}`, { type });

      if (navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
        navigator.share({ files: [file], title: 'JARVIS Vision result' })
          .then(() => setStatus('SHARE COMPLETE · CHOOSE SAVE IMAGE'))
          .catch(error => { if (error?.name !== 'AbortError') openImageFallback(blob); else setStatus('SAVE CANCELLED'); })
          .finally(() => { if (button) { button.disabled = false; button.textContent = 'SAVE'; } });
        return;
      }

      openImageFallback(blob);
    } catch (error) {
      setStatus(error?.message || 'SAVE FAILED');
      if (button) { button.disabled = false; button.textContent = 'SAVE'; }
    }
  }

  function openImageFallback(blob) {
    const url = URL.createObjectURL(blob);
    const opened = window.open(url, '_blank');
    if (!opened) {
      window.location.href = url;
      setStatus('IMAGE OPENED · USE SHARE → SAVE IMAGE');
    } else {
      setStatus('IMAGE OPENED · USE SHARE → SAVE IMAGE');
      setTimeout(() => URL.revokeObjectURL(url), 120000);
    }
    const button = document.querySelector('#visionSave');
    if (button) { button.disabled = false; button.textContent = 'SAVE'; }
  }

  async function run() {
    const prompt = document.querySelector('#visionPrompt')?.value.trim() || '';
    state.prompt = prompt;
    if (!prompt) { setStatus('ADD A PROMPT'); return; }
    if (state.mode !== 'generate' && !state.originalBase64) { setStatus('SELECT AN IMAGE FIRST'); return; }
    const button = document.querySelector('#visionRun');
    if (button) { button.disabled = true; button.textContent = 'PROCESSING…'; }
    setStatus(state.mode === 'generate' ? 'JARVIS IS CREATING…' : state.operation === 'enhance' ? 'JARVIS IS ENHANCING…' : 'JARVIS IS EDITING…');
    try {
      let payload, endpoint = ENDPOINT;
      if (state.mode === 'generate') {
        payload = { mode: 'generate', prompt, width: 1024, height: 768 };
      } else if (state.operation === 'enhance') {
        endpoint = ENHANCE_ENDPOINT;
        payload = { prompt, image: state.originalBase64, mimeType: state.originalMimeType };
      } else {
        const dimensions = outputDimensions(state.sourceWidth, state.sourceHeight);
        const targetAspect = state.sourceWidth && state.sourceHeight ? (state.sourceWidth / state.sourceHeight).toFixed(4) : '';
        const effectivePrompt = `${prompt}\n\nPreserve the original aspect ratio (${targetAspect}:1) exactly. Do not crop, reframe, zoom, rotate, or change the camera composition unless explicitly requested. Keep the positions of all meaningful objects unchanged.`;
        payload = { mode: 'edit', prompt: effectivePrompt, ...dimensions, image: state.base64, mimeType: state.mimeType };
      }
      const response = await fetch(endpoint, { method: 'POST', headers: { 'Content-Type': 'application/json', Accept: 'application/json' }, body: JSON.stringify(payload) });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data?.error || `Vision service returned HTTP ${response.status}`);
      if (!data?.image?.data) throw new Error('JARVIS returned no image.');
      state.resultMimeType = data.image.mimeType || 'image/png';
      state.result = `data:${state.resultMimeType};base64,${data.image.data}`;
      render();
      setStatus(data?.faithful ? `ENHANCE COMPLETE · ${data.image.width}×${data.image.height} · FAITHFUL` : 'VISION COMPLETE');
    } catch (error) {
      setStatus(error?.message || 'VISION FAILED');
      if (button) { button.disabled = false; button.textContent = state.mode === 'generate' ? 'GENERATE IMAGE' : state.operation === 'enhance' ? 'ENHANCE IMAGE' : 'EDIT IMAGE'; }
    }
  }

  function bind() {
    document.querySelectorAll('[data-mode]').forEach(button => button.addEventListener('click', () => { state.mode = button.dataset.mode === 'generate' ? 'generate' : 'edit'; state.operation = state.mode === 'edit' ? 'enhance' : 'generate'; state.result = null; state.prompt = ''; render(); }));
    document.querySelectorAll('[data-preset]').forEach(button => button.addEventListener('click', () => { const key = button.dataset.preset; const prompt = document.querySelector('#visionPrompt'); if (prompt) prompt.value = presets[key] || presets.enhance; state.prompt = prompt?.value || ''; state.operation = key === 'enhance' ? 'enhance' : 'edit'; const runButton = document.querySelector('#visionRun'); if (runButton) runButton.textContent = state.operation === 'enhance' ? 'ENHANCE IMAGE' : 'EDIT IMAGE'; }));
    document.querySelector('#visionPrompt')?.addEventListener('input', event => { if (state.mode !== 'edit') return; state.operation = event.currentTarget.value.trim() === presets.enhance ? 'enhance' : 'edit'; const runButton = document.querySelector('#visionRun'); if (runButton) runButton.textContent = state.operation === 'enhance' ? 'ENHANCE IMAGE' : 'EDIT IMAGE'; });
    document.querySelector('#visionFile')?.addEventListener('change', event => chooseFile(event.target.files?.[0]));
    const drop = document.querySelector('#visionDrop');
    if (drop) { ['dragenter','dragover'].forEach(type => drop.addEventListener(type, e => { e.preventDefault(); drop.classList.add('drag'); })); ['dragleave','drop'].forEach(type => drop.addEventListener(type, e => { e.preventDefault(); drop.classList.remove('drag'); })); drop.addEventListener('drop', e => chooseFile(e.dataTransfer?.files?.[0])); }
    document.querySelector('#visionRun')?.addEventListener('click', () => void run());
    document.querySelector('#visionSave')?.addEventListener('click', saveResult);
    document.querySelector('#visionClear')?.addEventListener('click', () => { state.file = null; state.base64 = ''; state.originalBase64 = ''; state.sourceUrl = ''; state.result = null; state.prompt = ''; state.sourceWidth = 0; state.sourceHeight = 0; state.operation = 'enhance'; render(); });
  }

  window.jarvisInitImageStudio = () => render();
})();