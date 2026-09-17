(() => {
  'use strict';
  const STYLE_ID = 'jarvis-games-circuit-controls-fix-v1-style';
  if (document.getElementById(STYLE_ID)) return;

  const style = document.createElement('style');
  style.id = STYLE_ID;
  style.textContent = `
    .circuit-controls{display:flex;gap:10px;justify-content:center;align-items:center}
    .circuit-controls button{width:52px;height:44px;padding:0;font-size:18px;font-weight:800}
    .circuit-controls .blank{display:none}
  `;
  document.head.appendChild(style);
})();
