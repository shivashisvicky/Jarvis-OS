const browserOnly = (): void => {
  const escapeHtml = (value: unknown): string => String(value ?? '').replace(/[&<>\"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;',"'":'&#039;'}[c] ?? c));
  const withTimeout = <T>(promise: Promise<T>, ms: number): Promise<T> => Promise.race([promise, new Promise<T>((_, reject) => window.setTimeout(() => reject(new Error('timeout')), ms))]);

  const nativeFetch = window.fetch.bind(window);
  window.fetch = (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
    const headers = new Headers(init?.headers ?? (input instanceof Request ? input.headers : undefined));
    if (headers.has('X-JARVIS-Trace')) headers.delete('X-JARVIS-Trace');
    return nativeFetch(input, {...init, headers});
  };

  type MapPlace = {
    lat:number;
    lon:number;
    label:string;
    name:string;
    importance:number;
    rank:number;
  };

  const normalize = (value:string) => value.toLocaleLowerCase().replace(/[^\p{L}\p{N}]+/gu,' ').trim();
  const scorePlace = (term:string, place:MapPlace) => {
    const q=normalize(term);
    const name=normalize(place.name);
    const label=normalize(place.label);
    const tokens=q.split(/\s+/).filter(Boolean);
    let score=place.importance*10 + Math.max(0,40-place.rank);
    if(name===q) score+=160;
    else if(name.includes(q)) score+=100;
    else if(label.includes(q)) score+=70;
    const matched=tokens.filter(t=>name.includes(t)||label.includes(t)).length;
    score+=matched*25;
    if(tokens.length && matched===tokens.length) score+=60;
    return score;
  };

  const renderPlaces = (term:string, places:MapPlace[], results:HTMLElement, frame:HTMLElement) => {
    if(!places.length){
      results.innerHTML='<div class="empty">No places found for that keyword.</div>';
      frame.innerHTML='<div class="empty">No map result for that place.</div>';
      return;
    }
    const ranked=places.map(p=>({p,score:scorePlace(term,p)})).sort((a,b)=>b.score-a.score).map(x=>x.p).slice(0,6);
    const show=(p:MapPlace)=>{
      const d=.035;
      frame.innerHTML=`<iframe title="Map" src="https://www.openstreetmap.org/export/embed.html?bbox=${p.lon-d},${p.lat-d},${p.lon+d},${p.lat+d}&layer=mapnik&marker=${p.lat},${p.lon}"></iframe>`;
    };
    results.innerHTML=ranked.map((p,i)=>`<button class="place-result" data-live-map-index="${i}"><strong>${escapeHtml(p.name||p.label.split(',')[0])}</strong><small>${escapeHtml(p.label)}</small></button>`).join('');
    results.querySelectorAll<HTMLButtonElement>('[data-live-map-index]').forEach(b=>b.addEventListener('click',()=>show(ranked[Number(b.dataset.liveMapIndex)])));
    show(ranked[0]);
  };

  const searchNominatim = async (term:string):Promise<MapPlace[]> => {
    const u=new URL('https://nominatim.openstreetmap.org/search');
    u.searchParams.set('q',term);
    u.searchParams.set('format','jsonv2');
    u.searchParams.set('addressdetails','1');
    u.searchParams.set('namedetails','1');
    u.searchParams.set('dedupe','1');
    u.searchParams.set('limit','12');
    u.searchParams.set('accept-language','en');
    const response=await withTimeout(fetch(u.toString(),{cache:'no-store',headers:{Accept:'application/json'}}),8000);
    if(!response.ok) throw new Error('nominatim');
    const data=await response.json() as Array<{lat?:string;lon?:string;display_name?:string;name?:string;importance?:number;place_rank?:number}>;
    return data.map(x=>({lat:Number(x.lat),lon:Number(x.lon),label:String(x.display_name||x.name||''),name:String(x.name||x.display_name||''),importance:Number(x.importance)||0,rank:Number(x.place_rank)||30})).filter(x=>Number.isFinite(x.lat)&&Number.isFinite(x.lon)&&x.label);
  };

  const searchPhoton = async (term:string):Promise<MapPlace[]> => {
    const response=await withTimeout(fetch(`https://photon.komoot.io/api/?limit=12&q=${encodeURIComponent(term)}`,{cache:'no-store'}),8000);
    if(!response.ok) throw new Error('photon');
    const data=await response.json() as {features?:Array<{properties?:Record<string,unknown>;geometry?:{coordinates?:number[]}}>};
    return (data.features??[]).map(f=>{
      const p=f.properties??{};const c=f.geometry?.coordinates??[];const name=String(p.name||'');
      return {lat:Number(c[1]),lon:Number(c[0]),name,label:[name,p.street,p.city??p.locality,p.state,p.country].filter(Boolean).join(', '),importance:0,rank:30};
    }).filter(x=>Number.isFinite(x.lat)&&Number.isFinite(x.lon)&&x.label);
  };

  const searchMaps = async (term:string):Promise<void> => {
    const results=document.querySelector<HTMLElement>('#mapResults');
    const frame=document.querySelector<HTMLElement>('#mapFrame');
    if(!results||!frame||!term)return;
    results.innerHTML='<div class="empty">SEARCHING…</div>';
    try{
      let places:MapPlace[]=[];
      try{places=await searchNominatim(term);}catch{}
      if(!places.length) places=await searchPhoton(term);
      renderPlaces(term,places,results,frame);
    }catch{
      results.innerHTML='<div class="empty">Map search is temporarily unavailable. Try again.</div>';
      frame.innerHTML='<div class="empty">Map provider unavailable.</div>';
    }
  };

  const wire=():void=>{
    const mb=document.querySelector<HTMLButtonElement>('#mapSearch');
    if(mb&&!mb.dataset.liveRecovery){
      mb.dataset.liveRecovery='1';
      mb.addEventListener('click',e=>{
        e.preventDefault();
        e.stopImmediatePropagation();
        void searchMaps(document.querySelector<HTMLInputElement>('#mapQuery')?.value.trim()??'');
      },true);
    }
  };

  window.addEventListener('jarvis:maps',e=>{
    const destination=String((e as CustomEvent<{place?:string}>).detail?.place??'').trim();
    if(!destination)return;
    let attempts=0;
    const timer=window.setInterval(()=>{
      attempts++;
      const input=document.querySelector<HTMLInputElement>('#mapQuery');
      if(input){
        window.clearInterval(timer);
        input.value=destination;
        void searchMaps(destination);
      }else if(attempts>=50)window.clearInterval(timer);
    },60);
  });

  new MutationObserver(wire).observe(document.documentElement,{childList:true,subtree:true});
  wire();
};

if(typeof window!=='undefined'&&typeof document!=='undefined'&&typeof MutationObserver!=='undefined')browserOnly();
