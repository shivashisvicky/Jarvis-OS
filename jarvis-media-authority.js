(() => {
  'use strict';

  if (window.__JARVIS_ACTIVE_MEDIA_AUTHORITY__) return;
  window.__JARVIS_ACTIVE_MEDIA_AUTHORITY__ = true;

  const PROVIDERS = [
    { name: 'SepiaSearch', baseUrl: 'https://sepiasearch.org' },
    { name: 'PeerTube TV', baseUrl: 'https://peertube.tv' },
    { name: 'FramaTube', baseUrl: 'https://framatube.org' }
  ];

  const CORS_PROXIES = [
    {
      name: 'AllOrigins',
      buildUrl: url => `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`
    },
    {
      name: 'CorsProxy',
      buildUrl: url => `https://corsproxy.io/?url=${encodeURIComponent(url)}`
    }
  ];

  const DIRECT_TIMEOUT_MS = 5000;
  const PROXY_TIMEOUT_MS = 7000;
  const MEDIA_ROOTS = ['#media-center','[data-app-container="media"]','.media-center-root','section[data-app="media"]','#media'];
  const SEARCH_INPUTS = ['#videoQuery','input[name="videoQuery"]','.media-search-input'];
  const SEARCH_BUTTONS = ['#videoSearch','button.search-btn','.media-search-submit'];

  class JarvisMediaAuthority {
    constructor() {
      this.host = null;
      this.activeSearch = 0;
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

    getMediaRoot() {
      return this.resolve(MEDIA_ROOTS);
    }

    getSearchInput() {
      const root = this.getMediaRoot();
      return root ? this.resolve(SEARCH_INPUTS, root) : null;
    }

    getResultsContainer() {
      const root = this.getMediaRoot();
      return root ? this.resolve(['#videoResults','.video-results-container','.jyt-results'], root) : null;
    }

    getPlayerContainer() {
      const root = this.getMediaRoot();
      return root ? this.resolve(['#jarvisPlayer','.video-player-container','.jyt-player'], root) : null;
    }

    getStatusLabel() {
      const root = this.getMediaRoot();
      return root ? this.resolve(['#mediaState','.video-status','.media-status','#videoStatus'], root) : null;
    }

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
          if (embedUrl) {
            this.playVideo(
              embedUrl,
              card.getAttribute('data-provider') || 'peertube',
              card.getAttribute('data-title') || ''
            );
          }
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
        this.playVideo(
          `https://www.youtube-nocookie.com/embed/${encodeURIComponent(ytId)}`,
          'youtube',
          `YouTube Video (${ytId})`
        );
        return;
      }

      this.executeSearch(query);
    }

    extractYouTubeId(value) {
      const match = value.match(
        /(?:youtu\.be\/|youtube(?:-nocookie)?\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([\w-]{11})/
      );
      return match ? match[1] : null;
    }

    safeUrl(path, base) {
      if (!path) return '';
      try {
        return new URL(path, base).href;
      } catch {
        return '';
      }
    }

    clear(el) {
      while (el && el.firstChild) el.removeChild(el.firstChild);
    }

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
      const searchId = ++this.activeSearch;

      try {
        const result = await Promise.any(
          PROVIDERS.map(provider => this.fetchProvider(provider, query))
        );

        if (searchId !== this.activeSearch) return;
        this.renderResults(result.results, result.providerName);
      } catch (aggregateError) {
        if (searchId !== this.activeSearch) return;

        const errorDetails = aggregateError?.errors?.length
          ? aggregateError.errors
              .map(error => error?.message || String(error))
              .join('\n')
          : (aggregateError?.message || 'All video providers failed');

        console.warn('[JARVIS Media] All providers failed.', errorDetails);
        this.renderDegradedState(query, errorDetails);
      }
    }

    async fetchJson(url, timeoutMs) {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

      try {
        const response = await fetch(url, {
          signal: controller.signal,
          headers: { Accept: 'application/json' },
          cache: 'no-store'
        });

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }

        const text = await response.text();
        if (!text.trim()) {
          throw new Error('Empty response');
        }

        try {
          return JSON.parse(text);
        } catch {
          throw new Error('Invalid JSON response');
        }
      } catch (error) {
        if (error?.name === 'AbortError') {
          throw new Error('Timeout');
        }
        throw error;
      } finally {
        clearTimeout(timeoutId);
      }
    }

    async fetchProvider(provider, query) {
      const targetUrl =
        `${provider.baseUrl}/api/v1/search/videos` +
        `?search=${encodeURIComponent(query)}&count=12`;

      const errors = [];

      // First attempt: direct PeerTube API. This is the fastest path when the
      // provider exposes CORS correctly in the user's browser.
      try {
        const data = await this.fetchJson(targetUrl, DIRECT_TIMEOUT_MS);
        return this.normalizeProviderResults(data, provider, 'direct');
      } catch (error) {
        errors.push(`${provider.name}: direct ${this.errorMessage(error)}`);
      }

      // Second attempt: independent public CORS relays. A failure of one relay
      // must never make the other relay or providers appear unavailable.
      for (const proxy of CORS_PROXIES) {
        try {
          const data = await this.fetchJson(
            proxy.buildUrl(targetUrl),
            PROXY_TIMEOUT_MS
          );
          return this.normalizeProviderResults(data, provider, proxy.name);
        } catch (error) {
          errors.push(`${provider.name}: ${proxy.name} ${this.errorMessage(error)}`);
        }
      }

      throw new Error(errors.join(' | '));
    }

    normalizeProviderResults(data, provider, route) {
      if (!data || !Array.isArray(data.data) || data.data.length === 0) {
        throw new Error(`${provider.name}: zero results via ${route}`);
      }

      const results = data.data
        .map(item => {
          const id = String(item.uuid || item.id || '');
          return {
            id,
            title: item.name || 'Untitled Video',
            author:
              item.channel?.displayName ||
              item.channel?.name ||
              item.videoChannel?.displayName ||
              'Unknown',
            thumbnailUrl: this.safeUrl(
              item.thumbnailPath || item.thumbnailUrl,
              provider.baseUrl
            ),
            pageUrl: this.safeUrl(
              item.url || `/w/${id}`,
              provider.baseUrl
            ),
            embedUrl: this.safeUrl(
              item.embedUrl ||
              item.embedPath ||
              `/videos/embed/${id}`,
              provider.baseUrl
            ),
            provider: 'peertube',
            playable: true,
            route
          };
        })
        .filter(item => item.id && item.embedUrl);

      if (!results.length) {
        throw new Error(`${provider.name}: unusable results via ${route}`);
      }

      return {
        providerName: provider.name,
        results
      };
    }

    errorMessage(error) {
      return error?.message || 'Network failure';
    }

    renderResults(results, providerName) {
      const container = this.getResultsContainer();
      if (!container) return;

      this.clear(container);
      this.setStatus(
        `ONLINE · ${results.length} RESULTS VIA ${providerName.toUpperCase()}`
      );

      for (const item of results) {
        const card = document.createElement('div');
        card.className = 'jyt-card video-result';
        card.dataset.id = item.id;
        card.dataset.provider = item.provider;
        card.dataset.embedUrl = item.embedUrl;
        card.dataset.title = item.title;

        if (item.thumbnailUrl) {
          const img = document.createElement('img');
          img.className = 'card-thumb';
          img.src = item.thumbnailUrl;
          img.alt = item.title;
          img.loading = 'lazy';
          img.referrerPolicy = 'no-referrer';
          card.appendChild(img);
        }

        const meta = document.createElement('div');
        meta.className = 'card-meta';

        const title = document.createElement('h4');
        title.className = 'card-title';
        title.textContent = item.title;

        const author = document.createElement('span');
        author.className = 'card-author';
        author.textContent = item.author;

        meta.append(title, author);
        card.appendChild(meta);
        container.appendChild(card);
      }
    }

    renderDegradedState(query, errorReason = 'Unknown network failure') {
      const container = this.getResultsContainer();
      if (!container) return;

      this.clear(container);
      this.setStatus('VIDEO INDEX DEGRADED · NO REDIRECT');

      const wrapper = document.createElement('div');
      wrapper.className = 'media-degraded-state';

      const msg = document.createElement('p');
      msg.textContent =
        'No video index responded. JARVIS will not redirect you. ' +
        'Try SEARCH again or paste a video URL.';

      const diagnostic = document.createElement('pre');
      diagnostic.className = 'media-network-diagnostic';
      diagnostic.textContent = `NETWORK DIAGNOSTIC\n${errorReason}`;

      wrapper.append(msg, diagnostic);
      container.appendChild(wrapper);
    }

    playVideo(embedUrl, provider, title = '') {
      const container = this.getPlayerContainer();
      if (!container || !embedUrl) return;

      this.clear(container);

      const frame = document.createElement('iframe');
      frame.className = 'jarvis-video-frame';
      frame.src = embedUrl;
      frame.allowFullscreen = true;
      frame.allow =
        'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture';
      frame.title = title || `${provider} video`;
      frame.loading = 'lazy';
      frame.referrerPolicy = 'no-referrer';

      container.appendChild(frame);
      this.setStatus(`PLAYING · ${String(provider || 'video').toUpperCase()}`);
    }
  }

  const start = () => {
    window.JarvisMedia = new JarvisMediaAuthority();
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', start, { once: true });
  } else {
    start();
  }
})();
