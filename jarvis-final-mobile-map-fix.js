(() => {
  'use strict';
  if (window.__JARVIS_FINAL_MOBILE_MAP_FIX__) return;
  window.__JARVIS_FINAL_MOBILE_MAP_FIX__ = true;

  const mobile = () => window.matchMedia?.('(max-width:760px)').matches || window.innerWidth <= 760;

  const css = () => {
    if (document.querySelector('#jarvis-final-mobile-map-style')) return;
    const s = document.createElement('style');
    s.id = 'jarvis-final-mobile-map-style';
    s.textContent = `
      @media(max-width:760px){
        .rail .nav.jarvis-final-hidden{display:none!important}
        .rail .nav.mobile-overflow-hidden{display:none!important}
        .rail .nav.jarvis-recovery-hidden{display:none!important}
        .jarvis-final-more-toggle{display:none!important;flex:1 1 0;min-width:0;min-height:50px;height:50px;padding:5px 2px;border:1px solid var(--line,#17303a);background:rgba(5,16,22,.78);color:var(--muted,#8ca6ae);border-radius:10px;justify-items:center;align-content:center;gap:3px;font:inherit;cursor:pointer}
        .jarvis-final-more-toggle.visible{display:grid!important}
        .jarvis-final-more-toggle b{font-size:17px;line-height:1}.jarvis-final-more-toggle span{font-size:6px;line-height:1}
        .jarvis-final-more-drawer{position:fixed;left:10px;right:10px;bottom:calc(82px + env(safe-area-inset-bottom));z-index:150;padding:10px;display:none;grid-template-columns:repeat(3,1fr);gap:8px;border:1px solid var(--line-strong,#17303a);border-radius:14px;background:rgba(2,8,12,.98);box-shadow:0 18px 50px rgba(0,0,0,.62);backdrop-filter:blur(20px)}
        .jarvis-final-more-drawer.open{display:grid}
        .jarvis-final-more-drawer button{min-height:58px;border:1px solid var(--line,#17303a);background:rgba(7,18,24,.92);color:var(--muted,#8ca6ae);border-radius:10px;display:grid;justify-items:center;align-content:center;gap:4px;font:inherit}
        .jarvis-final-more-drawer button b{font-size:18px}.jarvis-final-more-drawer button span{font-size:8px;letter-spacing:.05em}
      }
    `;
    document.head.appendChild(s);
  };

  const ensureMore = () => {
    const rail = document.querySelector('.rail');
    if (!rail) return;
    const navs = [...rail.querySelectorAll('.nav[data-app]')];
    if (!navs.length) return;
    let toggle = rail.querySelector('.jarvis-final-more-toggle');
    let drawer = document.querySelector('.jarvis-final-more-drawer');

    if (!mobile()) {
      navs.forEach(n => n.classList.remove('jarvis-final-hidden'));
      toggle?.remove();
      drawer?.remove();
      return;
    }

    navs.forEach(n => n.classList.remove('mobile-overflow-hidden', 'jarvis-recovery-hidden'));
    const keep = 6;
    navs.forEach((n, i) => n.classList.toggle('jarvis-final-hidden', i >= keep));

    if (!toggle) {
      toggle = document.createElement('button');
      toggle.type = 'button';
      toggle.className = 'jarvis-final-more-toggle';
      toggle.innerHTML = '<b>⋯</b><span>MORE</span>';
      rail.appendChild(toggle);
    }
    toggle.classList.add('visible');

    if (!drawer) {
      drawer = document.createElement('div');
      drawer.className = 'jarvis-final-more-drawer';
      document.body.appendChild(drawer);
    }

    const hidden = navs.slice(keep);
    const html = hidden.map(nav => {
      const id = nav.dataset.app || '';
      const icon = nav.querySelector('b')?.textContent || '•';
      const label = nav.querySelector('span')?.textContent || id;
      return `<button type="button" data-final-target="${CSS.escape(id)}"><b>${icon}</b><span>${label}</span></button>`;
    }).join('');

    if (drawer.innerHTML !== html) {
      drawer.innerHTML = html;
      drawer.querySelectorAll('[data-final-target]').forEach(btn => btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-final-target');
        const target = rail.querySelector(`.nav[data-app="${CSS.escape(id || '')}"]`);
        target?.click();
        drawer.classList.remove('open');
        toggle?.classList.remove('active');
      }));
    }
    toggle.onclick = () => {
      drawer.classList.toggle('open');
      toggle.classList.toggle('active', drawer.classList.contains('open'));
    };
  };

  const bindDynamicNavigation = () => {
    const root = document.querySelector('#app');
    if (!root || root.dataset.finalNavBound) return;
    root.dataset.finalNavBound = '1';
    root.addEventListener('click', event => {
      const target = event.target instanceof Element ? event.target.closest('[data-app]') : null;
      if (!(target instanceof HTMLElement)) return;
      const id = target.getAttribute('data-app');
      if (!id) return;
      const nav = root.querySelector(`.nav[data-app="${CSS.escape(id)}"]`);
      if (target.classList.contains('nav') || target.classList.contains('module-card')) {
        if (target === nav) return;
        nav?.click();
      }
    });
  };

  const setupMaps = () => {
    const input = document.querySelector('#mapQuery');
    const button = document.querySelector('#mapSearch');
    const results = document.querySelector('#mapResults');
    const frame = document.querySelector('#mapFrame');
    if (!(input instanceof HTMLInputElement) || !(button instanceof HTMLButtonElement) || !results || !frame || button.dataset.finalMapBound) return;
    button.dataset.finalMapBound = '1';

    let status = results.querySelector('.jarvis-final-map-status');
    if (!status) {
      status = document.createElement('div');
      status.className = 'jarvis-final-map-status';
      status.style.cssText = 'margin:7px 2px;color:var(--muted,#78939c);font-size:11px';
      results.prepend(status);
    }

    const showMap = (lat, lon) => {
      const d = 0.018;
      const bbox = `${lon-d},${lat-d},${lon+d},${lat+d}`;
      frame.innerHTML = `<iframe title="Map result" loading="lazy" style="border:0;width:100%;height:100%;min-height:280px" src="https://www.openstreetmap.org/export/embed.html?bbox=${encodeURIComponent(bbox)}&layer=mapnik&marker=${encodeURIComponent(`${lat},${lon}`)}"></iframe>`;
    };

    const normalize = q => {
      const raw = q.trim();
      if (!raw) return '';
      if (/bhubaneswar|odisha|india/i.test(raw)) return raw;
      return `${raw}, Bhubaneswar, Odisha, India`;
    };

    const nominatim = async q => {
      const u = new URL('https://nominatim.openstreetmap.org/search');
      u.searchParams.set('format', 'jsonv2');
      u.searchParams.set('q', q);
      u.searchParams.set('limit', '8');
      u.searchParams.set('addressdetails', '1');
      u.searchParams.set('countrycodes', 'in');
      u.searchParams.set('accept-language', 'en');
      const r = await fetch(u.toString(), { cache:'no-store', headers:{Accept:'application/json'} });
      if (!r.ok) throw new Error(`Nominatim HTTP ${r.status}`);
      return await r.json();
    };

    const photon = async q => {
      const u = new URL('https://photon.komoot.io/api/');
      u.searchParams.set('q', q);
      u.searchParams.set('limit', '8');
      const r = await fetch(u.toString(), { cache:'no-store', headers:{Accept:'application/json'} });
      if (!r.ok) throw new Error(`Photon HTTP ${r.status}`);
      const d = await r.json();
      return (Array.isArray(d?.features) ? d.features : []).map(f => ({
        name: f?.properties?.name || f?.properties?.city || 'Location',
        display_name: [f?.properties?.name, f?.properties?.street, f?.properties?.district, f?.properties?.city, f?.properties?.state, f?.properties?.country].filter(Boolean).join(', '),
        lat: f?.geometry?.coordinates?.[1],
        lon: f?.geometry?.coordinates?.[0]
      }));
    };

    const search = async () => {
      const q = normalize(input.value);
      if (!q) { status.textContent = 'ENTER A PLACE TO SEARCH'; return; }
      status.textContent = 'SEARCHING GLOBAL MAPS…';
      results.querySelectorAll('.jarvis-final-map-result').forEach(x => x.remove());
      frame.innerHTML = '<div class="empty">Searching map services…</div>';
      try {
        let data = await nominatim(q);
        if (!Array.isArray(data) || !data.length) data = await photon(q);
        data = (Array.isArray(data) ? data : []).filter(p => Number.isFinite(Number(p?.lat)) && Number.isFinite(Number(p?.lon)));
        if (!data.length) {
          status.textContent = 'NO MATCHES FOUND';
          frame.innerHTML = '<div class="empty">No map match found. Try a fuller place name, city or PIN code.</div>';
          return;
        }
        status.textContent = `${data.length} LOCATION${data.length === 1 ? '' : 'S'} FOUND`;
        data.forEach((place, index) => {
          const b = document.createElement('button');
          b.type = 'button';
          b.className = 'jarvis-final-map-result';
          b.style.cssText = 'display:block;width:100%;box-sizing:border-box;text-align:left;padding:11px 13px;margin:6px 0;border:1px solid var(--line,#17303a);border-radius:10px;background:rgba(5,16,22,.78);color:var(--text,#dffaff);font:inherit;cursor:pointer';
          b.innerHTML = `<b>${index+1}. ${String(place.name || place.display_name?.split(',')[0] || 'Location')}</b><small style="display:block;margin-top:4px;color:var(--muted,#78939c);font-size:10px;line-height:1.35">${String(place.display_name || '')}</small>`;
          b.addEventListener('click', () => showMap(Number(place.lat), Number(place.lon)));
          results.appendChild(b);
          if (index === 0) showMap(Number(place.lat), Number(place.lon));
        });
      } catch (error) {
        status.textContent = 'MAP SEARCH UNAVAILABLE';
        frame.innerHTML = '<div class="empty">The map providers could not be reached. Please try again in a moment.</div>';
      }
    };

    button.addEventListener('click', search);
    input.addEventListener('keydown', e => { if (e.key === 'Enter') { e.preventDefault(); search(); } });
  };

  const boot = () => {
    css();
    bindDynamicNavigation();
    ensureMore();
    setupMaps();
  };

  new MutationObserver(boot).observe(document.documentElement, { childList:true, subtree:true });
  window.addEventListener('resize', boot, { passive:true });
  boot();
})();
