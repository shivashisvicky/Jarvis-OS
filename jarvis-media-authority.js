/**
 * J.A.R.V.I.S. OS 2.0 - Unified Media Authority
 * Direct element binding with capture-phase ownership.
 *
 * The SPA still renders the Media Center, but this module is the sole media
 * interaction authority. Capture-phase handlers on the exact controls run
 * before any legacy bubble listeners can mutate the same UI.
 */
(() => {
    'use strict';

    if (window.__JARVIS_ACTIVE_MEDIA_AUTHORITY__) return;
    window.__JARVIS_ACTIVE_MEDIA_AUTHORITY__ = true;

    const PEERTUBE_PROVIDERS = [
        { name: 'SepiaSearch', baseUrl: 'https://sepiasearch.org' },
        { name: 'PeerTube TV', baseUrl: 'https://peertube.tv' },
        { name: 'FramaTube', baseUrl: 'https://framatube.org' }
    ];
    const FETCH_TIMEOUT_MS = 6000;

    class JarvisMediaAuthority {
        constructor() {
            this.rendering = false;
            this.resultsObserver = null;
            this.domObserver = null;
            this.initSPAObserver();
        }

        initSPAObserver() {
            this.bindDirectElements();
            this.domObserver = new MutationObserver(() => this.bindDirectElements());
            this.domObserver.observe(document.documentElement, { childList: true, subtree: true });
        }

        bindDirectElements() {
            const searchBtn = document.querySelector('#videoSearch, button.search-btn, .media-search-submit');
            if (searchBtn && !searchBtn.dataset.jarvisBound) {
                searchBtn.dataset.jarvisBound = 'true';
                searchBtn.addEventListener('click', (event) => {
                    event.preventDefault();
                    event.stopImmediatePropagation();
                    void this.handleSearchTrigger();
                }, { capture: true });
            }

            const searchInput = document.querySelector('#videoQuery, input[name="videoQuery"], .media-search-input');
            if (searchInput && !searchInput.dataset.jarvisBound) {
                searchInput.dataset.jarvisBound = 'true';
                searchInput.addEventListener('keydown', (event) => {
                    if (event.key !== 'Enter') return;
                    event.preventDefault();
                    event.stopImmediatePropagation();
                    void this.handleSearchTrigger();
                }, { capture: true });
            }

            const results = document.querySelector('#videoResults, .video-results-container, .jyt-results');
            if (results && !results.dataset.jarvisBound) {
                results.dataset.jarvisBound = 'true';
                this.observeResults(results);
                results.addEventListener('click', (event) => {
                    const target = event.target instanceof Element ? event.target : null;
                    const card = target?.closest('.jyt-card, .video-result');
                    if (!card) return;
                    const embedUrl = card.getAttribute('data-embed-url');
                    if (!embedUrl) return;
                    event.preventDefault();
                    event.stopImmediatePropagation();
                    this.playVideo(embedUrl, card.getAttribute('data-provider') || 'peertube', card.getAttribute('data-title') || '');
                }, { capture: true });
            }
        }

        observeResults(results) {
            if (this.resultsObserver) this.resultsObserver.disconnect();
            this.resultsObserver = new MutationObserver(() => {
                if (this.rendering) return;
                const legacyCards = results.querySelectorAll('.video-result[data-video-id]:not([data-embed-url])');
                if (!legacyCards.length) return;
                this.rendering = true;
                this.clearElement(results);
                this.rendering = false;
                this.setStatus('READY · UNIFIED MEDIA AUTHORITY');
            });
            this.resultsObserver.observe(results, { childList: true, subtree: true });
        }

        getSearchInput() { return document.querySelector('#videoQuery, input[name="videoQuery"], .media-search-input'); }
        getResultsContainer() { return document.querySelector('#videoResults, .video-results-container, .jyt-results'); }
        getPlayerContainer() { return document.querySelector('#jarvisPlayer, .video-player-container, .jyt-player'); }
        getStatusLabel() { return document.querySelector('#mediaState, .video-status, .media-status, #videoStatus'); }

        async handleSearchTrigger() {
            const input = this.getSearchInput();
            if (!input) return;
            const query = input.value.trim();
            if (!query) return;
            const youtubeId = this.extractYouTubeId(query);
            if (youtubeId) {
                this.playVideo(`https://www.youtube-nocookie.com/embed/${encodeURIComponent(youtubeId)}`, 'youtube', `YouTube Video (${youtubeId})`);
                return;
            }
            await this.executeSearch(query);
        }

        extractYouTubeId(value) {
            const match = String(value).match(/(?:youtu\.be\/|youtube(?:-nocookie)?\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([\w-]{11})/);
            return match ? match[1] : null;
        }

        setStatus(text) {
            const label = this.getStatusLabel();
            if (label) label.textContent = text;
        }

        clearElement(element) {
            while (element && element.firstChild) element.removeChild(element.firstChild);
        }

        setLoadingState(query) {
            const results = this.getResultsContainer();
            if (!results) return;
            this.rendering = true;
            this.clearElement(results);
            const loading = document.createElement('div');
            loading.className = 'media-loading-indicator';
            const text = document.createElement('span');
            text.textContent = `JARVIS LIVE VIDEO INDEX · RACING PROVIDERS FOR: "${query}"...`;
            loading.appendChild(text);
            results.appendChild(loading);
            this.rendering = false;
            this.setStatus(`SEARCHING · LIVE VIDEO INDEXES · ${query.toUpperCase()}`);
        }

        safeUrl(path, base) {
            if (!path) return '';
            try { return new URL(path, base).href; } catch { return ''; }
        }

        async executeSearch(query) {
            this.setLoadingState(query);
            try {
                const result = await Promise.any(PEERTUBE_PROVIDERS.map(provider => this.fetchProvider(provider, query)));
                this.renderResults(result.results, result.providerName);
            } catch (error) {
                const details = error?.errors
                    ? error.errors.map(item => item?.message || String(item)).join(' | ')
                    : (error?.message || 'All video providers failed');
                console.warn('[JARVIS Media] Providers failed:', details);
                this.renderDegradedState(query, details);
            }
        }

        async fetchProvider(provider, query) {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
            try {
                const endpoint = `${provider.baseUrl}/api/v1/search/videos?search=${encodeURIComponent(query)}&count=12`;
                const response = await fetch(endpoint, { signal: controller.signal, headers: { Accept: 'application/json' } });
                if (!response.ok) throw new Error(`HTTP ${response.status}`);
                const data = await response.json();
                if (!data || !Array.isArray(data.data) || data.data.length === 0) throw new Error('Zero results returned');
                const results = data.data.map(item => ({
                    id: String(item.uuid || item.id),
                    title: item.name || 'Untitled Video',
                    author: item.channel ? (item.channel.displayName || item.channel.name) : 'Unknown',
                    thumbnailUrl: this.safeUrl(item.thumbnailPath || item.thumbnailUrl, provider.baseUrl),
                    pageUrl: this.safeUrl(item.url || `/w/${item.uuid || item.id}`, provider.baseUrl),
                    embedUrl: this.safeUrl(item.embedPath || item.embedUrl || `/videos/embed/${item.uuid || item.id}`, provider.baseUrl),
                    provider: 'peertube'
                }));
                return { providerName: provider.name, results };
            } catch (error) {
                if (error?.name === 'AbortError') throw new Error('Timeout');
                throw error;
            } finally {
                clearTimeout(timeoutId);
            }
        }

        renderResults(results, providerName) {
            const container = this.getResultsContainer();
            if (!container) return;
            this.rendering = true;
            this.clearElement(container);
            results.forEach(item => {
                const card = document.createElement('div');
                card.className = 'jyt-card video-result';
                card.dataset.id = item.id;
                card.dataset.provider = item.provider;
                card.dataset.embedUrl = item.embedUrl;
                card.dataset.title = item.title;
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
                container.appendChild(card);
            });
            this.rendering = false;
            this.setStatus(`ONLINE · ${results.length} RESULTS VIA ${providerName.toUpperCase()}`);
        }

        renderDegradedState(query, errorReason = 'Timeout') {
            const container = this.getResultsContainer();
            if (!container) return;
            this.rendering = true;
            this.clearElement(container);
            this.setStatus('VIDEO INDEX DEGRADED - NO REDIRECT');
            const wrapper = document.createElement('div');
            wrapper.className = 'media-degraded-state';
            const message = document.createElement('p');
            message.textContent = 'No video index responded. JARVIS will not redirect you. Try SEARCH again or paste a video URL.';
            const diagnostic = document.createElement('span');
            diagnostic.className = 'diagnostic-text';
            diagnostic.textContent = `NETWORK DIAGNOSTIC: ${errorReason}`;
            wrapper.append(message, document.createElement('br'), document.createElement('br'), diagnostic);
            container.appendChild(wrapper);
            this.rendering = false;
        }

        playVideo(embedUrl, provider, title = '') {
            const container = this.getPlayerContainer();
            if (!container) return;
            this.clearElement(container);
            const frame = document.createElement('iframe');
            frame.className = 'jarvis-video-frame';
            frame.title = title || 'JARVIS video player';
            frame.src = embedUrl;
            frame.setAttribute('allowfullscreen', 'true');
            frame.setAttribute('allow', 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture');
            frame.setAttribute('frameborder', '0');
            container.appendChild(frame);
            this.setStatus(`PLAYING · ${provider.toUpperCase()}`);
        }
    }

    const boot = () => { window.JarvisMedia = new JarvisMediaAuthority(); };
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot, { once: true });
    else boot();
})();
