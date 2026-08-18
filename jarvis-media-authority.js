/**
 * J.A.R.V.I.S. OS 2.0 - Unified Media Authority
 * Architecture: Direct Element Binding via MutationObserver.
 * Satisfies strict rule: "Attach handlers directly to media controls" without global capture.
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
            this.initSPAObserver();
        }

        initSPAObserver() {
            this.bindDirectElements();
            const observer = new MutationObserver(() => this.bindDirectElements());
            observer.observe(document.body, { childList: true, subtree: true });
        }

        // Bind directly to the exact controls rendered by the SPA.
        bindDirectElements() {
            const searchBtn = document.querySelector('#videoSearch, button.search-btn, .media-search-submit');
            if (searchBtn && !searchBtn.dataset.jarvisBound) {
                searchBtn.dataset.jarvisBound = 'true';
                searchBtn.addEventListener('click', (e) => {
                    e.preventDefault();
                    this.handleSearchTrigger();
                });
            }

            const searchInput = document.querySelector('#videoQuery, input[name="videoQuery"], .media-search-input');
            if (searchInput && !searchInput.dataset.jarvisBound) {
                searchInput.dataset.jarvisBound = 'true';
                searchInput.addEventListener('keydown', (e) => {
                    if (e.key === 'Enter') {
                        e.preventDefault();
                        this.handleSearchTrigger();
                    }
                });
            }

            const results = document.querySelector('#videoResults, .video-results-container, .jyt-results');
            if (results && !results.dataset.jarvisBound) {
                results.dataset.jarvisBound = 'true';
                results.addEventListener('click', (e) => {
                    const card = e.target.closest('.jyt-card, .video-result');
                    if (!card) return;
                    const embedUrl = card.getAttribute('data-embed-url');
                    if (embedUrl) {
                        this.playVideo(
                            embedUrl,
                            card.getAttribute('data-provider') || 'peertube',
                            card.getAttribute('data-title') || ''
                        );
                    }
                });
            }
        }

        getSearchInput() {
            return document.querySelector('#videoQuery, input[name="videoQuery"], .media-search-input');
        }

        getResultsContainer() {
            return document.querySelector('#videoResults, .video-results-container, .jyt-results');
        }

        getPlayerContainer() {
            return document.querySelector('#jarvisPlayer, .video-player-container, .jyt-player');
        }

        getStatusLabel() {
            return document.querySelector('#mediaState, .video-status, .media-status, #videoStatus');
        }

        handleSearchTrigger() {
            const input = this.getSearchInput();
            if (!input) return;

            const query = input.value.trim();
            if (!query) return;

            const ytMatch = this.extractYouTubeId(query);
            if (ytMatch) {
                const embedUrl = `https://www.youtube-nocookie.com/embed/${encodeURIComponent(ytMatch)}`;
                this.playVideo(embedUrl, 'youtube', `YouTube Video (${ytMatch})`);
                return;
            }

            this.executeSearch(query);
        }

        extractYouTubeId(url) {
            const regExp = /(?:youtu\.be\/|youtube(?:-nocookie)?\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([\w-]{11})/;
            const match = url.match(regExp);
            return match ? match[1] : null;
        }

        setStatus(text) {
            const label = this.getStatusLabel();
            if (label) label.textContent = text;
        }

        clearElement(el) {
            while (el && el.firstChild) el.removeChild(el.firstChild);
        }

        setLoadingState(query) {
            const results = this.getResultsContainer();
            if (!results) return;

            this.clearElement(results);
            const loadingCard = document.createElement('div');
            loadingCard.className = 'media-loading-indicator';

            const text = document.createElement('span');
            text.textContent = `JARVIS LIVE VIDEO INDEX · RACING PROVIDERS FOR: "${query}"...`;

            loadingCard.appendChild(text);
            results.appendChild(loadingCard);
            this.setStatus(`SEARCHING · LIVE VIDEO INDEXES · ${query.toUpperCase()}`);
        }

        safeUrl(path, base) {
            if (!path) return '';
            try {
                return new URL(path, base).href;
            } catch {
                return '';
            }
        }

        async executeSearch(query) {
            this.setLoadingState(query);

            try {
                const winningResponse = await Promise.any(
                    PEERTUBE_PROVIDERS.map(provider => this.fetchProvider(provider, query))
                );
                this.renderResults(winningResponse.results, winningResponse.providerName);
            } catch (aggregateError) {
                const errorDetails = aggregateError?.errors
                    ? aggregateError.errors.map(e => e?.message || String(e)).join(' | ')
                    : (aggregateError?.message || 'All video providers failed');
                console.warn('[JARVIS Media] Providers failed:', errorDetails);
                this.renderDegradedState(query, errorDetails);
            }
        }

        async fetchProvider(provider, query) {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
            const endpoint = `${provider.baseUrl}/api/v1/search/videos?search=${encodeURIComponent(query)}&count=12`;

            try {
                const response = await fetch(endpoint, {
                    signal: controller.signal,
                    headers: { 'Accept': 'application/json' }
                });

                if (!response.ok) throw new Error(`HTTP ${response.status}`);
                const data = await response.json();

                if (!data || !Array.isArray(data.data) || data.data.length === 0) {
                    throw new Error('Zero results returned');
                }

                const normalizedResults = data.data.map(item => ({
                    id: String(item.uuid || item.id),
                    title: item.name || 'Untitled Video',
                    author: item.channel ? (item.channel.displayName || item.channel.name) : 'Unknown',
                    thumbnailUrl: this.safeUrl(item.thumbnailPath || item.thumbnailUrl, provider.baseUrl),
                    pageUrl: this.safeUrl(item.url || `/w/${item.uuid || item.id}`, provider.baseUrl),
                    embedUrl: this.safeUrl(item.embedPath || `/videos/embed/${item.uuid || item.id}`, provider.baseUrl),
                    provider: 'peertube',
                    playable: true
                }));

                return { providerName: provider.name, results: normalizedResults };
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

            this.clearElement(container);
            this.setStatus(`ONLINE · ${results.length} RESULTS VIA ${providerName.toUpperCase()}`);

            results.forEach(item => {
                const card = document.createElement('div');
                card.className = 'jyt-card video-result';
                card.setAttribute('data-id', item.id);
                card.setAttribute('data-provider', item.provider);
                card.setAttribute('data-embed-url', item.embedUrl);
                card.setAttribute('data-title', item.title);

                if (item.thumbnailUrl) {
                    const img = document.createElement('img');
                    img.className = 'card-thumb';
                    img.src = item.thumbnailUrl;
                    img.alt = item.title;
                    img.loading = 'lazy';
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

                meta.appendChild(title);
                meta.appendChild(author);
                card.appendChild(meta);
                container.appendChild(card);
            });
        }

        renderDegradedState(query, errorReason = 'Timeout') {
            const container = this.getResultsContainer();
            if (!container) return;

            this.clearElement(container);
            this.setStatus('VIDEO INDEX DEGRADED - NO REDIRECT');

            const wrapper = document.createElement('div');
            wrapper.className = 'media-degraded-state';

            const msg = document.createElement('p');
            msg.innerHTML = `No video index responded. JARVIS will not redirect you. Try SEARCH again or paste a video URL.<br><br><span class="diagnostic-text">NETWORK DIAGNOSTIC: ${errorReason}</span>`;

            wrapper.appendChild(msg);
            container.appendChild(wrapper);
        }

        playVideo(embedUrl, provider, title = '') {
            const container = this.getPlayerContainer();
            if (!container) return;

            this.clearElement(container);

            const frame = document.createElement('iframe');
            frame.setAttribute('allowfullscreen', 'true');
            frame.setAttribute('allow', 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture');
            frame.setAttribute('frameborder', '0');
            frame.className = 'jarvis-video-frame';
            frame.src = embedUrl;
            if (title) frame.title = title;

            container.appendChild(frame);
            this.setStatus(`PLAYING · ${provider.toUpperCase()}`);
        }
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            window.JarvisMedia = new JarvisMediaAuthority();
        });
    } else {
        window.JarvisMedia = new JarvisMediaAuthority();
    }
})();