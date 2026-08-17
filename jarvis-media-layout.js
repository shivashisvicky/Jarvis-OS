(() => {
  const STYLE_ID = 'jarvis-media-layout-v1';

  function installStyles() {
    if (document.getElementById(STYLE_ID)) return;
    const style = document.createElement('style');
    style.id = STYLE_ID;
    style.textContent = `
      /* JARVIS Media: results first, player second. The player is the destination, not the obstacle. */
      .media-workspace.media-flow-ready {
        display: flex !important;
        flex-direction: column !important;
        gap: 10px !important;
        max-width: 1200px !important;
        margin-left: auto !important;
        margin-right: auto !important;
      }
      .media-workspace.media-flow-ready > .media-flow-search,
      .media-workspace.media-flow-ready > .media-flow-results,
      .media-workspace.media-flow-ready > .media-flow-player,
      .media-workspace.media-flow-ready > .media-flow-url {
        width: 100%;
        min-width: 0;
      }
      .media-workspace.media-flow-ready > .media-flow-search {
        padding: 13px;
        border: 1px solid var(--line);
        background: rgba(7,16,22,.76);
        border-radius: 10px;
      }
      .media-workspace.media-flow-ready > .media-flow-links {
        display: flex;
        gap: 6px;
        margin: -3px 0 0;
        order: 2;
      }
      .media-workspace.media-flow-ready > .media-flow-results {
        order: 3;
        min-height: 120px;
        max-height: 430px;
        overflow: auto;
        border: 1px solid var(--line);
        background: rgba(7,16,22,.76);
        border-radius: 10px;
      }
      .media-workspace.media-flow-ready > .media-flow-results .panel-head {
        position: sticky;
        top: 0;
        z-index: 2;
        background: rgba(7,16,22,.94);
        backdrop-filter: blur(12px);
      }
      .media-workspace.media-flow-ready > .media-flow-results .video-results {
        display: grid;
        grid-template-columns: repeat(2, minmax(0,1fr));
        gap: 8px;
        padding: 10px;
      }
      .media-workspace.media-flow-ready > .media-flow-results .jvc-card {
        min-width: 0;
        width: 100%;
        display: grid;
        grid-template-columns: 112px minmax(0,1fr) auto;
        gap: 9px;
        align-items: center;
        text-align: left;
        padding: 8px;
        border: 1px solid var(--line);
        border-radius: 9px;
        background: rgba(3,10,14,.8);
        color: var(--text);
        cursor: pointer;
      }
      .media-workspace.media-flow-ready > .media-flow-results .jvc-card:hover {
        border-color: var(--line-strong);
        background: rgba(100,220,255,.045);
      }
      .media-workspace.media-flow-ready > .media-flow-results .jvc-card img {
        width: 112px;
        height: 63px;
        object-fit: cover;
        border-radius: 6px;
        background: #020508;
      }
      .media-workspace.media-flow-ready > .media-flow-results .video-meta {
        min-width: 0;
        display: grid;
        gap: 4px;
      }
      .media-workspace.media-flow-ready > .media-flow-results .video-meta strong {
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
        font-size: 9px;
      }
      .media-workspace.media-flow-ready > .media-flow-results .video-meta small {
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
        color: #59737c;
        font-size: 7px;
      }
      .media-workspace.media-flow-ready > .media-flow-results .jvc-card > b {
        color: var(--cyan);
        font-size: 13px;
      }
      .media-workspace.media-flow-ready > .media-flow-player {
        order: 4;
        padding: 13px;
        border: 1px solid var(--line-strong);
        background: linear-gradient(180deg, rgba(9,22,29,.92), rgba(4,10,14,.94));
        border-radius: 12px;
        box-shadow: var(--shadow);
      }
      .media-workspace.media-flow-ready > .media-flow-player .player {
        width: 100%;
        min-height: 0;
        aspect-ratio: 16 / 9;
      }
      .media-workspace.media-flow-ready > .media-flow-url {
        order: 5;
        padding: 0 13px 13px;
        margin-top: -10px;
      }
      .media-workspace.media-flow-ready > .media-flow-url .request-line {
        padding: 0;
      }
      @media (max-width: 760px) {
        .media-workspace.media-flow-ready > .media-flow-results {
          max-height: 360px;
        }
        .media-workspace.media-flow-ready > .media-flow-results .video-results {
          grid-template-columns: 1fr;
        }
        .media-workspace.media-flow-ready > .media-flow-results .jvc-card {
          grid-template-columns: 96px minmax(0,1fr) auto;
        }
        .media-workspace.media-flow-ready > .media-flow-results .jvc-card img {
          width: 96px;
          height: 54px;
        }
        .media-workspace.media-flow-ready > .media-flow-player {
          padding: 8px;
        }
      }
    `;
    document.head.appendChild(style);
  }

  function arrange() {
    installStyles();
    document.querySelectorAll('.media-workspace').forEach(workspace => {
      if (!(workspace instanceof HTMLElement) || workspace.dataset.mediaLayout === '1') return;
      const main = workspace.querySelector('.media-main');
      const side = workspace.querySelector('.media-side');
      const search = main?.querySelector('.search-bar');
      const links = main?.querySelector('.media-search-links');
      const player = main?.querySelector('#jarvisPlayer');
      const url = main?.querySelector('.request-line');
      const results = side?.querySelector('#videoResults');
      if (!main || !side || !search || !player || !url || !results) return;

      const resultsPanel = document.createElement('section');
      resultsPanel.className = 'media-flow-results';
      const head = side.querySelector('.panel-head');
      if (head) resultsPanel.appendChild(head);
      resultsPanel.appendChild(results);

      const playerPanel = document.createElement('section');
      playerPanel.className = 'media-flow-player';
      playerPanel.appendChild(player);

      search.classList.add('media-flow-search');
      if (links) links.classList.add('media-flow-links');
      url.classList.add('media-flow-url');

      workspace.replaceChildren(search);
      if (links) workspace.appendChild(links);
      workspace.appendChild(resultsPanel);
      workspace.appendChild(playerPanel);
      workspace.appendChild(url);
      workspace.dataset.mediaLayout = '1';
    });
  }

  const observer = new MutationObserver(arrange);
  observer.observe(document.documentElement, { childList: true, subtree: true });
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', arrange, { once: true });
  arrange();
})();
