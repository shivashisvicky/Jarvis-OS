(() => {
  'use strict';
  if (window.__JARVIS_IMAGE_SAVE_PATCH__) return;
  window.__JARVIS_IMAGE_SAVE_PATCH__ = true;
  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  async function saveImage(button) {
    const img = document.querySelector('#visionResult img.vision-preview');
    if (!img?.src) return;
    button.disabled = true;
    button.textContent = 'OPENING…';
    try {
      const response = await fetch(img.src);
      const blob = await response.blob();
      const type = blob.type || 'image/png';
      const ext = type.split('/')[1]?.replace('jpeg', 'jpg') || 'png';
      const url = URL.createObjectURL(blob);
      if (isIOS) {
        const opened = window.open(url, '_blank');
        if (!opened) window.location.href = url;
        const status = document.querySelector('#visionStatus');
        if (status) status.textContent = 'IMAGE OPENED · TAP SHARE → SAVE IMAGE';
        setTimeout(() => URL.revokeObjectURL(url), 120000);
      } else {
        const link = document.createElement('a');
        link.href = url;
        link.download = `jarvis-vision-result.${ext}`;
        link.rel = 'noopener';
        document.body.appendChild(link);
        link.click();
        link.remove();
        const status = document.querySelector('#visionStatus');
        if (status) status.textContent = 'IMAGE SAVED';
        setTimeout(() => URL.revokeObjectURL(url), 60000);
      }
    } catch (error) {
      const status = document.querySelector('#visionStatus');
      if (status) status.textContent = 'SAVE FAILED · TAP IMAGE THEN SHARE → SAVE IMAGE';
    } finally {
      button.disabled = false;
      button.textContent = 'SAVE';
    }
  }
  function bind() {
    const original = document.querySelector('#visionSave');
    if (!original || original.dataset.visionSavePatch) return;
    const button = original.cloneNode(true);
    button.dataset.visionSavePatch = '1';
    original.replaceWith(button);
    button.addEventListener('click', () => void saveImage(button));
  }
  const observer = new MutationObserver(bind);
  const boot = () => { bind(); observer.observe(document.body, { childList: true, subtree: true }); };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot, { once: true }); else boot();
})();
