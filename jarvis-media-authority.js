(() => {
  'use strict';

  if (window.__JARVIS_ACTIVE_MEDIA_AUTHORITY__) return;
  window.__JARVIS_ACTIVE_MEDIA_AUTHORITY__ = true;

  const PROVIDERS = [
    { name: 'SepiaSearch', baseUrl: 'https://sepiasearch.org' },
    { name: 'PeerTube TV', baseUrl: 'https://peertube.tv' },
    { name: 'FramaTube', baseUrl: 'https://framatube.org' }
  ];
  const TIMEOUT_MS = 6000;
  const MEDIA_ROOTS = ['#media-center','[data-app-container="media"]','.media-center-root','section[data-app="media"]','#media'];
  const SEARCH_INPUTS = ['#videoQuery','input[name="videoQuery"]','.media-search-input'];
  const SEARCH_BUTTONS = ['#videoSearch','button.search-btn','.media-search-submit'];

  class JarvisMediaAuthority {
    constructor() {
      this.host = null;
      this.bindToPersistentRoot();
    }

    bindToPersistentRoot() {
      const host = document.querySelector('#app');
      if (!host) {
        const observer = new MutationObserver(() => {
          const root = document.querySelector('#app');
          if (root) {
            observer.disconnect();
            this.bindToPersistentRoot();
          }
        });
        observer.observe(document.documentElement, { childList: true, subtree: true });
        return;
      }
      this.host = host;
      this.bindEvents();
      console.log('[JARVIS Media Authority] Persistent SPA delegation active.');
    }

    resolve(selectors, parent = document) {
      for (const selector of selectors) {
        const el = parent.querySelector(selector);
        if (el) return el;
      }
      return null;
    }

    getMediaRoot() { return this.resolve(MEDIA_ROOTS); }
    getSearchInput() { const root = this.getMediaRoot(); return root ? this.resolve(SEARCH_INPUTS, root) : null; }
    getResultsContainer() { const root = this.getMediaRoot(); return root ? this.resolve(['#videoResults','.video-results-container','.jyt-results'], root) : null; }
    getPlayerContainer() { const root = this.getMediaRoot(); return root ? this.resolve(['#jarvisPlayer','.video-player-container','.jyt-player'], root) : null; }
    getStatusLabel() { const root = this.getMediaRoot(); return root ? this.resolve(['#mediaState','.video-status','.media-status','#videoStatus'], root) : null; }

    eventInsideMedia(target) {
      const root = this.getMediaRoot();
      return !!(root && target instanceof Node && root.contains(target));
    }

    bindEvents() {
      this.host.addEventListener('click', e => {
        if (!this.eventInsideMedia(e.target)) return;
        const search = e.target.closest(SEARCH_BUTTONS.join(','));
        if (search) {
          e.preventDefault();
          this.handleSearchTrigger();
          return;
        }
        const card = e.target.closest('.jyt-card, .video-result');
        if (card) {
          const embedUrl = card.getAttribute('data-embed-url');
          if (embedUrl) this.playVideo(embedUrl, card.getAttribute('data-provider') || 'peertube', card.getAttribute('data-title') || '');
        }
      });

      this.host.addEventListener('keydown', e => {
        if (!this.eventInsideMedia(e.target)) return;
        const input = e.target.closest(SEARCH_INPUTS.join(','));
        if (input && e.key === 'Enter') {
          e.preventDefault();
          this.handleSearchTrigger();
        }
      });
    }

    handleSearchTrigger() {
      const input = this.getSearchInput();
      if (!input) return;
      const query = input.value.trim();
      if (!query) return;
      const ytId = this.extractYouTubeId(query);
      if (ytId) {
        this.playVideo(`https://www.youtube-nocookie.com/embed/${encodeURIComponent(ytId)}`, 'youtube', `YouTube Video (${ytId})`);
        return;
      }
      this.executeSearch(query);
    }

    extractYouTubeId(value) {
      const match = value.match(/(?:youtu\.be\/|youtube(?:-nocookie)?\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([\w-]{11})/);
      return match ? match[1] : null;
    }

    safeUrl(path, base) {
      if (!path) return '';
      try { return new URL(path, base).href; } catch { return ''; }
    }

    clear(el) { while (el && el.firstChild) el.removeChild(el.firstChild); }

    setStatus(text) {
      const el = this.getStatusLabel();
      if (el) el.textContent = text;
    }

    setLoading(query) {
      const results = this.getResultsContainer();
      if (!results) return;
      this.clear(results);
      const box = document.createElement('div');
      box.className = 'media-loading-indicator';
      const text = document.createElement('span');
      text.textContent = `JARVIS LIVE VIDEO INDEX · RACING PROVIDERS FOR: "${query}"...`;
      box.appendChild(text);
      results.appendChild(box);
      this.setStatus(`SEARCHING · LIVE VIDEO INDEXES · ${query.toUpperCase()}`);
    }

    async executeSearch(query) {
      this.setLoading(query);
      try {
        const result = await Promise.any(PROVIDERS.map(provider => this.fetchProvider(provider, query)));
        this.renderResults(result.results, result.providerName);
      } catch (error) {
        console.warn('[JARVIS Media] All providers failed.', error);
        this.renderDegradedState(query);
      }
    }

    async fetchProvider(provider, query) {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS);
      try {
        const url = `${provider.baseUrl}/api/v1/search/videos?search=${encodeURIComponent(query)}&count=12`;
        const response = await fetch(url, { signal: controller.signal, headers: { Accept: 'application/json' } });
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const data = await response.json();
        if (!data || !Array.isArray(data.data) || !data.data.length) throw new Error('Zero results');
        const results = data.data.map(item => {
          const id = String(item.uuid || item.id || '');
          return {
            id,
            title: item.name || 'Untitled Video',
            author: item.channel ? (item.channel.displayName || item.channel.name) : (item.videoChannel?.displayName || 'Unknown'),
            thumbnailUrl: this.safeUrl(item.thumbnailPath || item.thumbnailUrl, provider.baseUrl),
            pageUrl: this.safeUrl(item.url || `/w/${id}`, provider.baseUrl),
            embedUrl: this.safeUrl(item.embedUrl || item.embedPath || `/videos/embed/${id}`, provider.baseUrl),
            provider: 'peertube',
            playable: true
          };
        });
        return { providerName: provider.name, results };
      } finally { clearTimeout(timeout); }
    }

    renderResults(results, providerName) {
      const container = this.getResultsContainer();
      if (!container) return;
      this.clear(container);
      this.setStatus(`ONLINE · ${results.length} RESULTS VIA ${providerName.toUpperCase()}`);
      for (const item of results) {
        const card = document.createElement('div');
        card.className = 'jyt-card video-result';
        card.dataset.id = item.id;
        card.dataset.provider = item.provider;
        card.dataset.embedUrl = item.embedUrl;
        card.dataset.title = item.title;
        if (item.thumbnailUrl) {
          const img = document.createElement('img');
          img.className = 'card-thumb'; img.src = item.thumbnailUrl; img.alt = item.title; img.loading = 'lazy';
          card.appendChild(img);
        }
        const meta = document.createElement('div'); meta.className = 'card-meta';
        const title = document.createElement('h4'); title.className = 'card-title'; title.textContent = item.title;
        const author = document.createElement('span'); author.className = 'card-author'; author.textContent = item.author;
        meta.append(title, author); card.appendChild(meta); container.appendChild(card);
      }
    }

    renderDegradedState(query) {
      const container = this.getResultsContainer();
      if (!container) return;
      this.clear(container); this.setStatus('STANDBY · PROVIDERS OFFLINE');
      const wrapper = document.createElement('div'); wrapper.className = 'media-degraded-state';
      const msg = document.createElement('p'); msg.textContent = 'PRIMARY VIDEO PROVIDERS UNAVAILABLE. FALLBACK READY:';
      const link = document.createElement('a');
      link.className = 'fallback-external-btn';
      link.href = `https://www.youtube.com/results?search_query=${encodeURIComponent(query)}`;
      link.target = '_blank'; link.rel = 'noopener noreferrer';
      link.textContent = `SEARCH YOUTUBE FOR "${query.toUpperCase()}" ↗`;
      wrapper.append(msg, link); container.appendChild(wrapper);
    }

    playVideo(embedUrl, provider, title = '') {
      const container = this.getPlayerContainer();
      if (!container || !embedUrl) return;
      this.clear(container);
      const frame = document.createElement('iframe');
      frame.className = 'jarvis-video-frame';
      frame.src = embedUrl;
      frame.allowFullscreen = true;
      frame.allow = 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture';
      frame.title = title || `${provider} video`;
      container.appendChild(frame);
      this.setStatus(`PLAYING · ${String(provider || 'video').toUpperCase()}`);
    }
  }

  const start = () => { window.JarvisMedia = new JarvisMediaAuthority(); };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start, { once: true });
  else start();
})();
