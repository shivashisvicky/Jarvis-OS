(() => {
  'use strict';
  if (window.__JARVIS_GAMES_CIRCUIT_V1__) return;
  window.__JARVIS_GAMES_CIRCUIT_V1__ = true;

  const STYLE_ID = 'jarvis-games-circuit-v1-style';
  const CARD_ID = 'jarvisCircuitGame';

  const addStyle = () => {
    if (document.getElementById(STYLE_ID)) return;
    const style = document.createElement('style');
    style.id = STYLE_ID;
    style.textContent = `
      .circuit-card{border-color:#28546a;box-shadow:0 16px 48px rgba(0,0,0,.22)}
      .circuit-wrap{display:grid;gap:9px;justify-items:center}
      .circuit-canvas{display:block;width:min(100%,320px);height:auto;aspect-ratio:2/3;border:1px solid #173b4d;border-radius:14px;background:#02070a;touch-action:none}
      .circuit-hud{width:min(100%,320px);display:grid;grid-template-columns:repeat(3,1fr);gap:6px}
      .circuit-hud b{display:block;padding:7px 5px;text-align:center;border:1px solid #173b4d;border-radius:9px;background:#071923;color:#71ddff;font-size:.74rem;letter-spacing:.04em}
      .circuit-controls{display:grid;grid-template-columns:repeat(3,46px);gap:6px;justify-content:center}
      .circuit-controls button{width:46px;height:40px;padding:0;font-size:18px;font-weight:800}
      .circuit-controls .blank{visibility:hidden}
      .circuit-status{min-height:18px;color:#7894a0;font-size:.78rem;text-align:center}
      .circuit-card .game-bar{width:min(100%,320px)}
      @media(max-width:600px){.circuit-canvas{width:min(100%,300px)}.circuit-hud,.circuit-card .game-bar{width:min(100%,300px)}}
    `;
    document.head.appendChild(style);
  };

  const makeCard = () => {
    if (document.getElementById(CARD_ID)) return document.getElementById(CARD_ID);
    const grid = document.querySelector('.arcade-grid');
    if (!grid) return null;
    const card = document.createElement('section');
    card.id = CARD_ID;
    card.className = 'game-card circuit-card';
    card.innerHTML = `
      <h3>🏎️ JARVIS Circuit</h3>
      <p>Thread the neon circuit, dodge traffic, collect energy, and push your run as far as you can.</p>
      <div class="circuit-wrap">
        <canvas id="circuitCanvas" class="circuit-canvas" width="320" height="480" aria-label="JARVIS Circuit racing game"></canvas>
        <div class="circuit-hud" aria-live="polite">
          <b id="circuitScore">SCORE 0</b><b id="circuitDistance">DIST 0M</b><b id="circuitBest">BEST 0</b>
        </div>
        <div class="circuit-status" id="circuitStatus">PRESS START TO RACE</div>
        <div class="circuit-controls" aria-label="Circuit controls">
          <button class="blank" type="button">·</button><button type="button" data-circuit="left" aria-label="Move left">◀</button><button class="blank" type="button">·</button>
          <button class="blank" type="button">·</button><button type="button" data-circuit="right" aria-label="Move right">▶</button><button class="blank" type="button">·</button>
        </div>
        <div class="game-bar"><span>← → / A D</span><button id="circuitReset" type="button">START / RESTART</button></div>
      </div>`;
    const tetris = document.getElementById('tetrisGame')?.closest('.game-card');
    if (tetris?.parentElement === grid) tetris.insertAdjacentElement('afterend', card);
    else grid.appendChild(card);
    return card;
  };

  const init = card => {
    if (!card || card.dataset.circuitReady === '1') return;
    card.dataset.circuitReady = '1';
    addStyle();

    const canvas = card.querySelector('#circuitCanvas');
    const ctx = canvas.getContext('2d');
    const scoreEl = card.querySelector('#circuitScore');
    const distanceEl = card.querySelector('#circuitDistance');
    const bestEl = card.querySelector('#circuitBest');
    const statusEl = card.querySelector('#circuitStatus');
    const resetBtn = card.querySelector('#circuitReset');
    const controls = card.querySelectorAll('[data-circuit]');
    const W = canvas.width, H = canvas.height, lanes = 4, laneW = W / lanes;
    let raf = 0, last = 0, running = false, gameOver = false, playerLane = 1, score = 0, distance = 0, speed = 0.32, roadOffset = 0, spawnClock = 0, pickupClock = 0, obstacles = [], pickups = [];
    let best = Number(localStorage.getItem('jarvis-circuit-best') || 0);
    bestEl.textContent = `BEST ${best}`;

    const laneX = lane => lane * laneW + laneW / 2;
    const player = () => ({x:laneX(playerLane), y:H-72, w:34, h:48});
    const move = dir => { if (!running) return; playerLane = Math.max(0, Math.min(lanes-1, playerLane + dir)); };
    const rectHit = (a,b) => Math.abs(a.x-b.x) < (a.w+b.w)/2 && Math.abs(a.y-b.y) < (a.h+b.h)/2;
    const drawRoad = () => {
      ctx.clearRect(0,0,W,H);
      ctx.fillStyle = '#02070a'; ctx.fillRect(0,0,W,H);
      ctx.fillStyle = '#071923'; ctx.fillRect(28,0,W-56,H);
      ctx.strokeStyle = '#173b4d'; ctx.lineWidth = 3; ctx.strokeRect(28,0,W-56,H);
      ctx.strokeStyle = 'rgba(113,221,255,.34)'; ctx.lineWidth = 3;
      for (let i=1;i<lanes;i++) { const x=i*laneW; for(let y=-50+(roadOffset%70);y<H;y+=70){ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(x,y+34);ctx.stroke();} }
    };
    const drawCar = (x,y,w,h,kind) => {
      ctx.save(); ctx.translate(x,y); ctx.fillStyle = kind === 'player' ? '#35c9ef' : '#ef8c5a'; ctx.shadowBlur = kind === 'player' ? 14 : 7; ctx.shadowColor = ctx.fillStyle;
      ctx.fillRect(-w/2,-h/2,w,h); ctx.fillStyle = '#071923'; ctx.fillRect(-w*.28,-h*.22,w*.56,h*.25); ctx.fillRect(-w*.28,h*.04,w*.56,h*.2); ctx.restore();
    };
    const draw = () => {
      drawRoad();
      pickups.forEach(p=>{ctx.save();ctx.translate(p.x,p.y);ctx.rotate(Math.PI/4);ctx.fillStyle='#f0c45c';ctx.shadowBlur=12;ctx.shadowColor='#f0c45c';ctx.fillRect(-8,-8,16,16);ctx.restore();});
      obstacles.forEach(o=>drawCar(o.x,o.y,o.w,o.h,'traffic'));
      const p=player(); drawCar(p.x,p.y,p.w,p.h,'player');
      scoreEl.textContent=`SCORE ${score}`; distanceEl.textContent=`DIST ${Math.floor(distance)}M`; bestEl.textContent=`BEST ${best}`;
    };
    const finish = () => {
      running=false; gameOver=true; cancelAnimationFrame(raf); if(score>best){best=score;localStorage.setItem('jarvis-circuit-best',String(best));}
      statusEl.textContent=`RUN COMPLETE · ${score} POINTS · ${Math.floor(distance)}M`;
      draw();
    };
    const spawn = () => { const lane=Math.floor(Math.random()*lanes); obstacles.push({x:laneX(lane),y:-35,w:32,h:48,speed:0.75+Math.random()*.25}); };
    const spawnPickup = () => { const lane=Math.floor(Math.random()*lanes); pickups.push({x:laneX(lane),y:-20,w:16,h:16,speed:0.82}); };
    const tick = now => {
      if(!running)return;
      const dt=Math.min(34,now-last||16); last=now;
      speed=Math.min(.72,speed+dt*.000006); roadOffset=(roadOffset+dt*speed)%70; distance+=dt*speed*.12; spawnClock+=dt; pickupClock+=dt;
      if(spawnClock>Math.max(430,900-speed*600)){spawn();spawnClock=0;}
      if(pickupClock>1200){spawnPickup();pickupClock=0;}
      obstacles.forEach(o=>o.y+=dt*speed); pickups.forEach(p=>p.y+=dt*p.speed);
      const p=player();
      if(obstacles.some(o=>rectHit(p,o))){finish();return;}
      pickups=pickups.filter(x=>{if(rectHit(p,x)){score+=25;return false;}return x.y<H+30;});
      obstacles=obstacles.filter(o=>{if(o.y>H+50){score+=10;return false;}return true;});
      draw(); raf=requestAnimationFrame(tick);
    };
    const start = () => { cancelAnimationFrame(raf); playerLane=1;score=0;distance=0;speed=.32;roadOffset=0;spawnClock=0;pickupClock=0;obstacles=[];pickups=[];running=true;gameOver=false;statusEl.textContent='RACING · DODGE + COLLECT';last=performance.now();draw();raf=requestAnimationFrame(tick); };
    const key = e => { if(!document.getElementById(CARD_ID))return; const k=e.key.toLowerCase(); if(k==='arrowleft'||k==='a'){e.preventDefault();move(-1);} else if(k==='arrowright'||k==='d'){e.preventDefault();move(1);} else if(k===' '&&(!running||gameOver)){e.preventDefault();start();} };
    window.addEventListener('keydown',key);
    controls.forEach(btn=>btn.addEventListener('pointerdown',()=>move(btn.dataset.circuit==='left'?-1:1)));
    resetBtn.addEventListener('click',start);
    draw();
  };

  const enhance = () => { const card=makeCard(); if(!card)return false; init(card); return true; };
  if(!enhance()){
    const observer=new MutationObserver(()=>{if(enhance())observer.disconnect();});
    observer.observe(document.body,{childList:true,subtree:true});
  }
})();
