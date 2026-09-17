(() => {
  'use strict';
  if (window.__JARVIS_GAMES_CIRCUIT_V1__) return;
  window.__JARVIS_GAMES_CIRCUIT_V1__ = true;

  const STYLE_ID = 'jarvis-games-circuit-v1-style';
  const CARD_ID = 'jarvisCircuitGame';
  let activeCard = null;
  let activeDestroy = null;
  let gridObserver = null;

  const addStyle = () => {
    if (document.getElementById(STYLE_ID)) return;
    const style = document.createElement('style');
    style.id = STYLE_ID;
    style.textContent = `
      .circuit-card{border-color:#28546a;box-shadow:0 16px 48px rgba(0,0,0,.22)}
      .circuit-wrap{display:grid;gap:9px;justify-items:center}
      .circuit-canvas{display:block;width:min(100%,320px);height:auto;aspect-ratio:2/3;border:1px solid #1e536a;border-radius:14px;background:#02070a;touch-action:none;box-shadow:inset 0 0 28px rgba(53,201,239,.05),0 10px 28px rgba(0,0,0,.18)}
      .circuit-hud{width:min(100%,320px);display:grid;grid-template-columns:repeat(3,1fr);gap:6px}
      .circuit-hud b{display:block;padding:7px 5px;text-align:center;border:1px solid #173b4d;border-radius:9px;background:linear-gradient(180deg,#0a202b,#071923);color:#71ddff;font-size:.74rem;letter-spacing:.04em;box-shadow:inset 0 1px rgba(255,255,255,.04)}
      .circuit-controls{display:flex;gap:10px;justify-content:center;align-items:center}
      .circuit-controls button{width:52px;height:44px;padding:0;font-size:18px;font-weight:800}
      .circuit-controls button:not(.blank):active{transform:translateY(1px);background:#0d2b38}
      .circuit-controls .blank{display:none}
      .circuit-status{min-height:18px;color:#7894a0;font-size:.78rem;text-align:center;letter-spacing:.03em}
      .circuit-card .game-bar{width:min(100%,320px)}
      @media(max-width:600px){.circuit-canvas{width:min(100%,300px)}.circuit-hud,.circuit-card .game-bar{width:min(100%,300px)}}
    `;
    document.head.appendChild(style);
  };

  const makeCard = () => {
    const existing = document.getElementById(CARD_ID);
    if (existing) return existing;
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
    const controls = [...card.querySelectorAll('[data-circuit]')];
    const W = canvas.width, H = canvas.height, lanes = 4, laneW = W / lanes;
    let raf = 0, last = 0, running = false, gameOver = false, destroyed = false, playerLane = 1, score = 0, distance = 0, speed = 0.32, roadOffset = 0, spawnClock = 0, pickupClock = 0, flash = 0, obstacles = [], pickups = [];
    let best = Number(localStorage.getItem('jarvis-circuit-best') || 0);
    bestEl.textContent = `BEST ${best}`;

    const laneX = lane => lane * laneW + laneW / 2;
    const player = () => ({x:laneX(playerLane), y:H-72, w:34, h:48});
    const move = dir => { if (destroyed || !running) return; playerLane = Math.max(0, Math.min(lanes-1, playerLane + dir)); };
    const rectHit = (a,b) => Math.abs(a.x-b.x) < (a.w+b.w)/2 && Math.abs(a.y-b.y) < (a.h+b.h)/2;

    const drawRoad = now => {
      ctx.clearRect(0,0,W,H);
      const bg=ctx.createLinearGradient(0,0,0,H); bg.addColorStop(0,'#010509'); bg.addColorStop(.55,'#06151d'); bg.addColorStop(1,'#02080d');
      ctx.fillStyle=bg; ctx.fillRect(0,0,W,H);
      ctx.fillStyle='#061821'; ctx.fillRect(28,0,W-56,H);
      ctx.strokeStyle='#1a4d62'; ctx.lineWidth=3; ctx.strokeRect(28,0,W-56,H);
      ctx.fillStyle='rgba(53,201,239,.035)'; ctx.fillRect(30,0,10,H); ctx.fillRect(W-40,0,10,H);
      ctx.strokeStyle='rgba(113,221,255,.38)'; ctx.lineWidth=3;
      for(let i=1;i<lanes;i++){const x=i*laneW;for(let y=-50+(roadOffset%70);y<H;y+=70){ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(x,y+34);ctx.stroke();}}
      ctx.strokeStyle='rgba(240,196,92,.18)'; ctx.lineWidth=2;
      const pulse=(Math.sin(now*.004)+1)*.5;
      ctx.beginPath();ctx.moveTo(28,0);ctx.lineTo(28,H);ctx.moveTo(W-28,0);ctx.lineTo(W-28,H);ctx.stroke();
      ctx.fillStyle=`rgba(53,201,239,${.025+.02*pulse})`;ctx.fillRect(28,0,W-56,3);
    };

    const drawCar = (x,y,w,h,kind) => {
      ctx.save(); ctx.translate(x,y);
      const playerCar=kind==='player';
      ctx.shadowBlur=playerCar?16:9; ctx.shadowColor=playerCar?'#35c9ef':'#ef8c5a';
      ctx.fillStyle=playerCar?'#35c9ef':'#ef8c5a';
      ctx.beginPath();ctx.roundRect(-w/2,-h/2,w,h,6);ctx.fill();
      ctx.fillStyle='#071923';ctx.beginPath();ctx.roundRect(-w*.29,-h*.25,w*.58,h*.22,3);ctx.fill();
      ctx.fillStyle='#0b3342';ctx.beginPath();ctx.roundRect(-w*.29,h*.03,w*.58,h*.2,3);ctx.fill();
      ctx.fillStyle='#02070a';ctx.fillRect(-w*.58,-h*.31,5,12);ctx.fillRect(w*.58-5,-h*.31,5,12);ctx.fillRect(-w*.58,h*.07,5,12);ctx.fillRect(w*.58-5,h*.07,5,12);
      ctx.fillStyle=playerCar?'#dffbff':'#ffd0b8';ctx.fillRect(-w*.29,-h*.46,w*.2,3);ctx.fillRect(w*.09,-h*.46,w*.2,3);
      ctx.fillStyle=playerCar?'#0a566d':'#7b321f';ctx.fillRect(-w*.26,h*.39,w*.52,3);
      ctx.restore();
    };

    const drawPickup = (p,now) => {
      ctx.save();ctx.translate(p.x,p.y);ctx.rotate(Math.PI/4);const pulse=1+Math.sin(now*.007+p.y*.02)*.12;
      ctx.scale(pulse,pulse);ctx.fillStyle='#f0c45c';ctx.shadowBlur=14;ctx.shadowColor='#f0c45c';ctx.fillRect(-7,-7,14,14);ctx.fillStyle='#fff1ad';ctx.fillRect(-3,-3,6,6);ctx.restore();
    };

    const drawOverlay = (title,subtitle) => {
      ctx.fillStyle='rgba(1,7,11,.62)';ctx.fillRect(28,0,W-56,H);
      ctx.strokeStyle='rgba(113,221,255,.24)';ctx.strokeRect(48,150,W-96,180);
      ctx.textAlign='center';ctx.fillStyle='#dffbff';ctx.font='800 25px system-ui';ctx.fillText(title,W/2,218);
      ctx.fillStyle='#7894a0';ctx.font='600 12px system-ui';ctx.fillText(subtitle,W/2,246);
      ctx.fillStyle='#71ddff';ctx.font='800 10px system-ui';ctx.fillText('JARVIS ARCADE // CIRCUIT',W/2,286);
    };

    const draw = now => {
      drawRoad(now);
      pickups.forEach(p=>drawPickup(p,now));
      obstacles.forEach(o=>drawCar(o.x,o.y,o.w,o.h,'traffic'));
      const p=player(); drawCar(p.x,p.y,p.w,p.h,'player');
      if(flash>0){ctx.fillStyle=`rgba(255,110,70,${Math.min(.3,flash*.02)})`;ctx.fillRect(28,0,W-56,H);flash=Math.max(0,flash-1);}
      if(!running && !gameOver) drawOverlay('READY','PRESS START / RESTART');
      if(gameOver) drawOverlay('RUN COMPLETE',`${score} POINTS  ·  ${Math.floor(distance)}M  ·  BEST ${best}`);
      scoreEl.textContent=`SCORE ${score}`; distanceEl.textContent=`DIST ${Math.floor(distance)}M`; bestEl.textContent=`BEST ${best}`;
    };

    const finish = () => {
      if(destroyed || gameOver)return;
      running=false;gameOver=true;cancelAnimationFrame(raf);raf=0;flash=8;
      if(score>best){best=score;localStorage.setItem('jarvis-circuit-best',String(best));}
      statusEl.textContent=`RUN COMPLETE · ${score} POINTS · ${Math.floor(distance)}M`;
      draw(performance.now());
    };
    const spawn = () => { const lane=Math.floor(Math.random()*lanes); obstacles.push({x:laneX(lane),y:-35,w:32,h:48,speed:0.75+Math.random()*.25}); };
    const spawnPickup = () => { const lane=Math.floor(Math.random()*lanes); pickups.push({x:laneX(lane),y:-20,w:16,h:16,speed:0.82}); };
    const tick = now => {
      if(destroyed || !running){raf=0;return;}
      const dt=Math.min(34,now-last||16);last=now;
      speed=Math.min(.72,speed+dt*.000006);roadOffset=(roadOffset+dt*speed)%70;distance+=dt*speed*.12;spawnClock+=dt;pickupClock+=dt;
      if(spawnClock>Math.max(430,900-speed*600)){spawn();spawnClock=0;}
      if(pickupClock>1200){spawnPickup();pickupClock=0;}
      obstacles.forEach(o=>o.y+=dt*speed);pickups.forEach(p=>p.y+=dt*p.speed);
      const p=player();
      if(obstacles.some(o=>rectHit(p,o))){finish();return;}
      pickups=pickups.filter(x=>{if(rectHit(p,x)){score+=25;return false;}return x.y<H+30;});
      obstacles=obstacles.filter(o=>{if(o.y>H+50){score+=10;return false;}return true;});
      draw(now);raf=requestAnimationFrame(tick);
    };
    const start = () => {
      if(destroyed)return;
      cancelAnimationFrame(raf);raf=0;playerLane=1;score=0;distance=0;speed=.32;roadOffset=0;spawnClock=0;pickupClock=0;flash=0;obstacles=[];pickups=[];running=true;gameOver=false;statusEl.textContent='RACING · DODGE + COLLECT';last=performance.now();draw(last);raf=requestAnimationFrame(tick);
    };
    const key = e => {
      if(destroyed || !card.isConnected)return;
      const k=e.key.toLowerCase();
      if(k==='arrowleft'||k==='a'){e.preventDefault();move(-1);} else if(k==='arrowright'||k==='d'){e.preventDefault();move(1);} else if(k===' '&&(!running||gameOver)){e.preventDefault();start();}
    };
    const pointer = e => move(e.currentTarget.dataset.circuit==='left'?-1:1);
    const on = (target,event,handler,options) => target?.addEventListener(event,handler,options);
    const off = (target,event,handler,options) => target?.removeEventListener(event,handler,options);
    const destroy = () => {
      if(destroyed)return;
      destroyed=true;running=false;gameOver=true;cancelAnimationFrame(raf);raf=0;
      off(window,'keydown',key);
      controls.forEach(btn=>off(btn,'pointerdown',pointer));
      off(resetBtn,'click',start);
      if(card.__jarvisCircuitDestroy===destroy)delete card.__jarvisCircuitDestroy;
      if(activeCard===card){activeCard=null;activeDestroy=null;}
    };

    window.addEventListener('keydown',key);
    controls.forEach(btn=>on(btn,'pointerdown',pointer));
    on(resetBtn,'click',start);
    card.__jarvisCircuitDestroy=destroy;
    activeCard=card;activeDestroy=destroy;
    draw(performance.now());
  };

  const disconnectGridObserver = () => { if(gridObserver){gridObserver.disconnect();gridObserver=null;} };
  const watchGrid = grid => {
    disconnectGridObserver();
    if(!grid)return;
    gridObserver=new MutationObserver(()=>sync());
    gridObserver.observe(grid,{childList:true});
  };
  const sync = () => {
    if(activeCard && !activeCard.isConnected)activeDestroy?.();
    const grid=document.querySelector('.arcade-grid');
    if(!grid){disconnectGridObserver();return;}
    if(!gridObserver)watchGrid(grid);
    if(!activeCard || !activeCard.isConnected){
      const card=makeCard();
      if(card)init(card);
    }
  };

  addStyle();
  const waitForWorkspace = new MutationObserver(()=>{
    const workspace=document.querySelector('.workspace');
    if(!workspace)return;
    waitForWorkspace.disconnect();
    const workspaceObserver=new MutationObserver(()=>sync());
    workspaceObserver.observe(workspace,{childList:true});
    sync();
  });
  waitForWorkspace.observe(document.body,{childList:true,subtree:true});
  if(document.querySelector('.workspace')){
    waitForWorkspace.disconnect();
    const workspace=document.querySelector('.workspace');
    const workspaceObserver=new MutationObserver(()=>sync());
    workspaceObserver.observe(workspace,{childList:true});
    sync();
  }
})();
