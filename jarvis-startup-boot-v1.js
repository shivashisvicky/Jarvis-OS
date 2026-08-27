/* JARVIS Startup Boot v1: readiness gate + cinematic startup */
(() => {
  'use strict';
  if (window.__JARVIS_STARTUP_BOOT__) return;
  window.__JARVIS_STARTUP_BOOT__ = true;

  const boot = document.createElement('div');
  boot.id = 'jarvis-boot';
  boot.setAttribute('role', 'status');
  boot.setAttribute('aria-label', 'JARVIS initializing');
  boot.innerHTML = `
    <div class="jarvis-boot-core">
      <div class="jarvis-reactor" aria-hidden="true">
        <div class="jarvis-reactor-ring"></div>
        <div class="jarvis-reactor-core"></div>
      </div>
      <p class="jarvis-boot-name">J.A.R.V.I.S.</p>
      <p class="jarvis-boot-subtitle">PERSONAL INTELLIGENCE SYSTEM</p>
      <div class="jarvis-boot-status" aria-hidden="true">
        <div class="jarvis-boot-row"><span>CORE SYSTEM</span><b id="boot-core">ONLINE</b></div>
        <div class="jarvis-boot-row"><span>VOICE AUTHORITY</span><b id="boot-voice">SYNCING</b></div>
        <div class="jarvis-boot-row"><span>COMMAND AUTHORITY</span><b id="boot-command">SYNCING</b></div>
        <div class="jarvis-boot-row"><span>LIBRARY CONTEXT</span><b id="boot-library">SYNCING</b></div>
      </div>
      <div class="jarvis-boot-track"><span></span></div>
      <div class="jarvis-boot-online"><strong>JARVIS</strong> &nbsp; INITIALIZING</div>
    </div>`;

  const mount = () => {
    if (!document.body.contains(boot)) document.body.appendChild(boot);
  };
  if (document.body) mount(); else document.addEventListener('DOMContentLoaded', mount, { once: true });

  const set = (id, value) => { const el = document.getElementById(id); if (el) el.textContent = value; };
  const started = performance.now();
  const minDisplay = 900;
  const timeout = 6500;

  const readiness = async () => {
    // Give the module loader a chance to expose its voice preload promise.
    await new Promise(resolve => setTimeout(resolve, 50));
    set('boot-command', 'READY');
    set('boot-library', 'READY');

    if (window.__JARVIS_VOICE_PRELOAD__) {
      try {
        await Promise.race([
          window.__JARVIS_VOICE_PRELOAD__,
          new Promise(resolve => setTimeout(resolve, 2200))
        ]);
      } catch (_) {}
    }
    set('boot-voice', 'READY');

    // Wait for the browser's initial load as well. This prevents the first
    // interaction from racing the page's deferred/module assets.
    if (document.readyState !== 'complete') {
      await new Promise(resolve => window.addEventListener('load', resolve, { once: true }));
    }
  };

  const finish = async () => {
    try { await readiness(); } catch (_) {}
    const elapsed = performance.now() - started;
    const remaining = Math.max(0, minDisplay - elapsed);
    if (remaining) await new Promise(resolve => setTimeout(resolve, remaining));
    set('boot-core', 'ONLINE');
    set('boot-voice', 'READY');
    set('boot-command', 'READY');
    set('boot-library', 'READY');
    const online = boot.querySelector('.jarvis-boot-online');
    if (online) online.innerHTML = '<strong>JARVIS ONLINE</strong> &nbsp; READY';
    await new Promise(resolve => setTimeout(resolve, 180));
    boot.classList.add('is-ready');
    window.dispatchEvent(new CustomEvent('jarvis:ready'));
    setTimeout(() => boot.remove(), 700);
  };

  setTimeout(finish, 0);
  setTimeout(() => {
    if (!boot.classList.contains('is-ready')) {
      boot.classList.add('is-ready');
      window.dispatchEvent(new CustomEvent('jarvis:ready', { detail: { timeout: true } }));
      setTimeout(() => boot.remove(), 700);
    }
  }, timeout);
})();
