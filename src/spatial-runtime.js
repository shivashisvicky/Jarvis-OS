// Lightweight spatial interaction layer. Keeps Jarvis in one browser surface.
(() => {
  const root = document.documentElement;
  let raf = 0;
  const update = (x, y) => {
    cancelAnimationFrame(raf);
    raf = requestAnimationFrame(() => {
      const nx = Math.max(-1, Math.min(1, x / innerWidth * 2 - 1));
      const ny = Math.max(-1, Math.min(1, y / innerHeight * 2 - 1));
      root.style.setProperty('--sp-x', `${(nx * 4).toFixed(2)}deg`);
      root.style.setProperty('--sp-y', `${(-ny * 3).toFixed(2)}deg`);
    });
  };
  addEventListener('pointermove', e => update(e.clientX, e.clientY), { passive:true });
  addEventListener('pointerleave', () => {
    root.style.setProperty('--sp-x','0deg');
    root.style.setProperty('--sp-y','0deg');
  });
  addEventListener('keydown', e => {
    if(e.key === 'Escape'){
      root.style.setProperty('--sp-x','0deg');
      root.style.setProperty('--sp-y','0deg');
    }
  });
})();
