/**
 * J.A.R.V.I.S. OS 2.0 - Unified Media Authority
 * Scoped, provider-racing media controller with a normalized result contract.
 */
(() => {
  'use strict';

  const PEERTUBE_PROVIDERS = [
    { name: 'SepiaSearch', baseUrl: 'https://sepiasearch.org' },
    { name: 'PeerTube TV', baseUrl: 'https://peertube.tv' },
    { name: 'FramaTube', baseUrl: 'https://framatube.org' }
  ];

  const FETCH_TIMEOUT_MS = 6000;

  class JarvisMediaAuthority {
    constructor() {
      this.container = null;
      this.searchInput = null;
      this.searchButton = null;
      this.resultsContainer = null;
      this.playerContainer = null;
      this.statusLabel = null;
      this.init();
    }

    init() {
      this.container = this.resolveElement([
        '#media-center',
        '[data-app-container="media"]',
        '.media-center-root',
        '#media',
        'section[data-app="media"]'
      ]);

      if (!this.container) {
        console.error('[JARVIS Media] Media Center root not found.');
        return;
      }

      this.searchInput = this.resolveElement([
        '#videoQuery',
        'input[name="videoQuery"]',
        '.media-search-input',
        'input[type="text"]'
      ], this.container);

      this.searchButton = this.resolveElement([
        '#videoSearch',
        'button.search-btn',
        'button.media-search-btn',
        '.media-search-submit',
        'button[type="submit"]'
      ], this.container);

      this.resultsContainer = this.resolveElement([
        '.video-results-container',
        '#videoResults',
        '.jyt-results',
        '.media-results'
      ], this.container) || this.createZone('video-results-container');

      this.playerContainer = this.resolveElement([
        '.video-player-container',
        '#videoPlayer',
        '.jyt-player',
        '.media-player'
      ], this.container) || this.createZone('video-player-container');

      this.statusLabel = this.resolveElement([
        '.video-status',
        '.media-status',
        '#videoStatus'
      ], this.container);

      if (!this.searchButton || !this.searchInput) {
        console.error('[JARVIS Media] Search controls not found.');
        return;
      }

      this.bindEvents();
      console.info('[JARVIS Media] Unified authority initialized.');
    }

    resolveElement(selectors, parent = document) {
      for (const selector of selectors) {
        const element = parent.querySelector(selector);
        if (element) return element;
      }
      return null;
    }

    createZone(className) {
      const element = document.createElement('div');
      element.className = className;
      this.container.appendChild(element);
      return element;
    }

    bindEvents() {
      this.searchButton.addEventListener('click', (event) => {
        event.preventDefault();
        this.handleSearchTrigger();
      });

      this.searchInput.addEventListener('keydown', (event) => {
        if (event.key !== 'Enter') return;
        event.preventDefault();
        this.handleSearchTrigger();
      });

      this.resultsContainer.addEventListener('click', (event) => {
        const card = event.target.closest('.jyt-card, .video-result');
        if (!card || !this.resultsContainer.contains(card)) return;
        const embedUrl = card.getAttribute('data-embed-url');
        if (!embedUrl) return;
        this.playVideo(
          embedUrl,
          card.getAttribute('data-provider') || 'video',
          card.getAttribute('data-title') || 'JARVIS Video'
        );
      });
    }

    handleSearchTrigger() {
      const query = this.searchInput.value.trim();
      if (!query) return;

      const youtubeId = this.extractYouTubeId(query);
      if (youtubeId) {
        this.playVideo(
          `https://www.youtube-nocookie.com/embed/${encodeURIComponent(youtubeId)}`,
          'youtube',
          `YouTube Video (${youtubeId})`
        );
        return;
      }

      void this.executeSearch(query);
    }

    extractYouTubeId(value) {
      const match = String(value).match(
        /(?:youtu\.be\/|youtube(?:-nocookie)?\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([\w-]{11})/
      );
      return match ? match[1] : null;
    }

    safeUrl(value, base) {
      if (!value) return '';
      try {
        const url = new URL(value, base);
        return /^https?:$/.test(url.protocol) ? url.href : '';
      } catch {
        return '';
      }
    }

    async executeSearch(query) {
      this.setLoadingState(query);

      try {
        const winner = await Promise.any(
          PEERTUBE_PROVIDERS.map((provider) => this.fetchProvider(provider, query))
        );
        this.renderResults(winner.results, winner.providerName);
      } catch (error) {
        console.warn('[JARVIS Media] All providers failed.', error);
        this.renderDegradedState(query);
      }
    }

    async fetchProvider(provider, query) {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
      const endpoint = `${provider.baseUrl}/api/v1/search/videos?search=${encodeURIComponent(query)}&count=12`;

      try {
        const response = await fetch(endpoint, {
          signal: controller.signal,
          headers: { Accept: 'application/json' }
        });
        if (!response.ok) throw new Error(`HTTP ${response.status}`);

        const data = await response.json();
        if (!data || !Array.isArray(data.data) || data.data.length === 0) {
          throw new Error('Provider returned no results');
        }

        const results = data.data
          .map((item) => {
            const id = String(item.uuid || item.id || '');
            if (!id || !item.name) return null;
            const pageUrl = this.safeUrl(item.url || `/w/${id}`, provider.baseUrl);
            const embedUrl = this.safeUrl(
              item.embedUrl || item.embedPath || `/videos/embed/${id}`,
              provider.baseUrl
            );
            if (!embedUrl) return null;

            return {
              id,
              title: String(item.name),
              author: String(item.channel?.displayName || item.channel?.name || 'Unknown Author'),
              thumbnailUrl: this.safeUrl(item.thumbnailPath || item.thumbnailUrl, provider.baseUrl),
              pageUrl,
              embedUrl,
              provider: 'peertube',
              playable: true
            };
          })
          .filter(Boolean);

        if (!results.length) throw new Error('Provider returned unusable results');
        return { providerName: provider.name, results };
      } finally {
        clearTimeout(timeoutId);
      }
    }

    setLoadingState(query) {
      this.clearElement(this.resultsContainer);
      const loading = document.createElement('div');
      loading.className = 'media-loading-indicator';
      loading.textContent = `JARVIS LIVE VIDEO INDEX · RACING PROVIDERS FOR: "${query}"...`;
      this.resultsContainer.appendChild(loading);
      this.setStatus(`SEARCHING · LIVE VIDEO INDEXES · ${query.toUpperCase()}`);
    }

    renderResults(results, providerName) {
      this.clearElement(this.resultsContainer);
      this.setStatus(`ONLINE · ${results.length} RESULTS VIA ${providerName.toUpperCase()}`);

      for (const item of results) {
        const card = document.createElement('div');
        card.className = 'jyt-card video-result';
        card.setAttribute('data-id', item.id);
        card.setAttribute('data-provider', item.provider);
        card.setAttribute('data-embed-url', item.embedUrl);
        card.setAttribute('data-title', item.title);

        if (item.thumbnailUrl) {
          const image = document.createElement('img');
          image.className = 'card-thumb';
          image.src = item.thumbnailUrl;
          image.alt = item.title;
          image.loading = 'lazy';
          card.appendChild(image);
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
        this.resultsContainer.appendChild(card);
      }
    }

    renderDegradedState(query) {
      this.clearElement(this.resultsContainer);
      this.setStatus('STANDBY · PROVIDERS OFFLINE');

      const wrapper = document.createElement('div');
      wrapper.className = 'media-degraded-state';

      const message = document.createElement('p');
      message.textContent = 'LIVE VIDEO PROVIDERS UNAVAILABLE. OPENING AUTHORITATIVE SEARCH FALLBACK:';

      const link = document.createElement('a');
      link.className = 'fallback-external-btn';
      link.href = `https://www.youtube.com/results?search_query=${encodeURIComponent(query)}`;
      link.target = '_blank';
      link.rel = 'noopener noreferrer';
      link.textContent = `SEARCH YOUTUBE FOR "${query.toUpperCase()}" ↗`;

      wrapper.append(message, link);
      this.resultsContainer.appendChild(wrapper);
    }

    playVideo(embedUrl, provider, title) {
      if (!this.playerContainer) return;
      this.clearElement(this.playerContainer);

      const frame = document.createElement('iframe');
      frame.className = 'jarvis-video-frame';
      frame.src = embedUrl;
      frame.title = title || 'JARVIS Video Player';
      frame.allowFullscreen = true;
      frame.setAttribute('allow', 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture');
      frame.setAttribute('referrerpolicy', 'strict-origin-when-cross-origin');

      this.playerContainer.appendChild(frame);
      this.setStatus(`PLAYING · ${String(provider).toUpperCase()}`);
    }

    setStatus(value) {
      if (this.statusLabel) this.statusLabel.textContent = value;
    }

    clearElement(element) {
      while (element?.firstChild) element.removeChild(element.firstChild);
    }
  }

  const bootstrap = () => {
    window.JarvisMedia = new JarvisMediaAuthority();
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', bootstrap, { once: true });
  } else {
    bootstrap();
  }
})();
