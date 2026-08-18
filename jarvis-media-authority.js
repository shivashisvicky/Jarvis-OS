/**
 * J.A.R.V.I.S. OS 2.0 - Unified Media Authority
 * Direct element binding with capture-phase ownership and live diagnostics.
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
    const TRACE_LIMIT = 300;

    class JarvisMediaAuthority {
        constructor() {
            this.rendering = false;
            this.resultsObserver = null;
            this.domObserver = null;
            this.trace = [];
            this.sequence = 0;
            this.initSPAObserver();
            this.log('BOOT', 'Unified media authority initialized', {
                readyState: document.readyState,
                href: location.href,
                online: navigator.onLine,
                userAgent: navigator.userAgent
            });
        }

        log(event, message, data = {}) {
            const entry = { seq: ++this.sequence, at: new Date().toISOString(), event, message, data };
            this.trace.push(entry);
            if (this.trace.length > TRACE_LIMIT) this.trace.shift();
            console.info(`[JARVIS MEDIA ${entry.seq}] ${event} · ${message}`, data);
            try {
                window.__JARVIS_MEDIA_TRACE__ = this.trace.slice();
                window.__JARVIS_MEDIA_LAST_EVENT__ = entry;
            } catch (_) { /* diagnostics must never break media */ }
        }

        snapshot(label) {
            const input = this.getSearchInput();
            const results = this.getResultsContainer();
            const player = this.getPlayerContainer();
            const status = this.getStatusLabel();
            this.log('SNAPSHOT', label, {
                inputFound: Boolean(input),
                inputValue: input?.value || '',
                searchButtonFound: Boolean(document.querySelector('#videoSearch, button.search-btn, .media-search-submit')),
                resultsFound: Boolean(results),
                resultChildren: results?.children.length ?? 0,
                resultCards: results?.querySelectorAll('.jyt-card, .video-result').length ?? 0,
                playerFound: Boolean(player),
                iframeFound: Boolean(player?.querySelector('iframe')),
                iframeSrc: player?.querySelector('iframe')?.getAttribute('src') || '',
                status: status?.textContent || '',
                rendering: this.rendering
            });
        }

        initSPAObserver() {
            this.log('LIFECYCLE', 'Binding controls and starting DOM observer');
            this.bindDirectElements();
            this.domObserver = new MutationObserver(() => this.bindDirectElements());
            this.domObserver.observe(document.documentElement, { childList: true, subtree: true });
        }

        bindDirectElements() {
            const searchBtn = document.querySelector('#videoSearch, button.search-btn, .media-search-submit');
            if (searchBtn && !searchBtn.dataset.jarvisBound) {
                searchBtn.dataset.jarvisBound = 'true';
                this.log('BIND', 'Search button bound', { id: searchBtn.id, className: searchBtn.className, text: searchBtn.textContent?.trim() || '' });
                searchBtn.addEventListener('click', (event) => {
                    this.log('CLICK', 'Search button click intercepted', { defaultPrevented: event.defaultPrevented, target: event.target instanceof Element ? event.target.tagName : 'unknown' });
                    event.preventDefault();
                    event.stopImmediatePropagation();
                    void this.handleSearchTrigger();
                }, { capture: true });
            }

            const searchInput = document.querySelector('#videoQuery, input[name="videoQuery"], .media-search-input');
            if (searchInput && !searchInput.dataset.jarvisBound) {
                searchInput.dataset.jarvisBound = 'true';
                this.log('BIND', 'Search input bound', { id: searchInput.id, value: searchInput.value || '' });
                searchInput.addEventListener('keydown', (event) => {
                    if (event.key !== 'Enter') return;
                    this.log('KEY', 'Search input Enter intercepted', { value: searchInput.value || '' });
                    event.preventDefault();
                    event.stopImmediatePropagation();
                    void this.handleSearchTrigger();
                }, { capture: true });
            }

            const results = document.querySelector('#videoResults, .video-results-container, .jyt-results');
            if (results && !results.dataset.jarvisBound) {
                results.dataset.jarvisBound = 'true';
                this.log('BIND', 'Results container bound', { id: results.id, className: results.className });
                this.observeResults(results);
                results.addEventListener('click', (event) => {
                    const target = event.target instanceof Element ? event.target : null;
                    const card = target?.closest('.jyt-card, .video-result');
                    if (!card) return;
                    const embedUrl = card.getAttribute('data-embed-url');
                    this.log('CARD_CLICK', 'Video card clicked', {
                        id: card.getAttribute('data-id'),
                        provider: card.getAttribute('data-provider'),
                        title: card.getAttribute('data-title'),
                        embedUrl
                    });
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
                this.log('LEGACY_MUTATION', 'Legacy media card detected and removed', { count: legacyCards.length });
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
            if (!input) {
                this.log('ERROR', 'Search trigger fired but input was not found');
                return;
            }
            const query = input.value.trim();
            this.log('SEARCH_TRIGGER', 'Search trigger received', { query, length: query.length, inputConnected: input.isConnected });
            if (!query) return;
            const youtubeId = this.extractYouTubeId(query);
            if (youtubeId) {
                this.log('YOUTUBE_DIRECT', 'Direct YouTube URL detected', { youtubeId });
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
            this.log('STATUS', text, { statusElementFound: Boolean(label) });
        }

        clearElement(element) { while (element && element.firstChild) element.removeChild(element.firstChild); }

        setLoadingState(query) {
            const results = this.getResultsContainer();
            if (!results) {
                this.log('ERROR', 'Cannot enter loading state: results container missing', { query });
                return;
            }
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
            this.snapshot('after loading state');
        }

        safeUrl(path, base) { if (!path) return ''; try { return new URL(path, base).href; } catch { return ''; } }

        async executeSearch(query) {
            this.log('SEARCH_START', 'Provider race started', { query, providers: PEERTUBE_PROVIDERS.map(p => p.name) });
            this.setLoadingState(query);
            try {
                const result = await Promise.any(PEERTUBE_PROVIDERS.map(provider => this.fetchProvider(provider, query)));
                this.log('SEARCH_WIN', 'Provider returned usable results', { provider: result.providerName, count: result.results.length, first: result.results[0] ? { id: result.results[0].id, title: result.results[0].title, embedUrl: result.results[0].embedUrl } : null });
                this.renderResults(result.results, result.providerName);
            } catch (error) {
                const details = error?.errors ? error.errors.map(item => item?.message || String(item)).join(' | ') : (error?.message || 'All video providers failed');
                this.log('SEARCH_FAIL', 'All providers failed', { details });
                console.warn('[JARVIS Media] Providers failed:', details);
                this.renderDegradedState(query, details);
            }
        }

        async fetchProvider(provider, query) {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
            const endpoint = `${provider.baseUrl}/api/v1/search/videos?search=${encodeURIComponent(query)}&count=12`;
            const started = performance.now();
            this.log('PROVIDER_REQUEST', `${provider.name} request started`, { endpoint, query });
            try {
                const response = await fetch(endpoint, { signal: controller.signal, headers: { Accept: 'application/json' } });
                this.log('PROVIDER_RESPONSE', `${provider.name} response received`, { status: response.status, ok: response.ok, elapsedMs: Math.round(performance.now() - started), url: response.url });
                if (!response.ok) throw new Error(`HTTP ${response.status}`);
                const data = await response.json();
                this.log('PROVIDER_JSON', `${provider.name} JSON parsed`, { hasData: Boolean(data), isArray: Array.isArray(data?.data), count: Array.isArray(data?.data) ? data.data.length : 0, sampleKeys: data?.data?.[0] ? Object.keys(data.data[0]) : [] });
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
                this.log('NORMALIZED', `${provider.name} results normalized`, { count: results.length, first: results[0] || null });
                return { providerName: provider.name, results };
            } catch (error) {
                const message = error?.name === 'AbortError' ? 'Timeout' : (error?.message || String(error));
                this.log('PROVIDER_FAIL', `${provider.name} failed`, { message, elapsedMs: Math.round(performance.now() - started) });
                throw new Error(message);
            } finally { clearTimeout(timeoutId); }
        }

        renderResults(results, providerName) {
            const container = this.getResultsContainer();
            if (!container) {
                this.log('ERROR', 'Cannot render results: results container missing', { providerName, count: results.length });
                return;
            }
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
            this.snapshot('after render results');
        }

        renderDegradedState(query, errorReason = 'Timeout') {
            const container = this.getResultsContainer();
            if (!container) {
                this.log('ERROR', 'Cannot render degraded state: results container missing', { query, errorReason });
                return;
            }
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
            this.snapshot('after degraded state');
        }

        playVideo(embedUrl, provider, title = '') {
            this.log('PLAY_START', 'Playback requested', { embedUrl, provider, title });
            const container = this.getPlayerContainer();
            if (!container) {
                this.log('PLAY_FAIL', 'Player container missing', { embedUrl, provider });
                return;
            }
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
            this.log('PLAY_COMMIT', 'Iframe inserted', { connected: frame.isConnected, src: frame.getAttribute('src'), playerChildren: container.children.length });
            this.snapshot('after play');
        }
    }

    const boot = () => {
        const instance = new JarvisMediaAuthority();
        window.JarvisMedia = instance;
        window.JarvisMediaDebug = {
            getTrace: () => instance.trace.slice(),
            dump: () => console.table(instance.trace),
            snapshot: (label = 'manual') => instance.snapshot(label),
            clear: () => { instance.trace.length = 0; },
            last: () => instance.trace.at(-1) || null
        };
        instance.log('READY', 'Live media diagnostics enabled', { commands: 'JarvisMediaDebug.dump(), JarvisMediaDebug.getTrace(), JarvisMediaDebug.snapshot()' });
    };
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot, { once: true });
    else boot();
})();
