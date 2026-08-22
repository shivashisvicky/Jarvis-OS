(()=>{
'use strict';
if(window.__JARVIS_SFTP_TEST_CONNECTION__)return;
window.__JARVIS_SFTP_TEST_CONNECTION__=true;
const install=()=>{
 const panel=document.querySelector('#jarvisSftp'),actions=panel?.querySelector('.eng-actions');
 if(!panel||!actions||panel.querySelector('#sftpTestConnection'))return;
 const b=document.createElement('button');b.type='button';b.className='secondary';b.id='sftpTestConnection';b.textContent='TEST CONNECTION';
 actions.insertBefore(b,actions.querySelector('#sftpCopy')||null);
 b.addEventListener('click',async()=>{
  const host=panel.querySelector('#sftpHost')?.value.trim()||'';
  const port=Number(panel.querySelector('#sftpPort')?.value||22);
  const status=panel.querySelector('#sftpStatus');const output=panel.querySelector('#sftpCommand');
  if(!host){if(status)status.textContent='ENTER SFTP HOST';return}
  if(!Number.isInteger(port)||port<1||port>65535){if(status)status.textContent='INVALID PORT';return}
  if(status)status.textContent='TESTING HOST…';
  const started=performance.now();
  try{
   const u=`https://dns.google/resolve?name=${encodeURIComponent(host)}&type=A`;
   const r=await fetch(u,{cache:'no-store',headers:{Accept:'application/dns-json'}});const d=await r.json();
   const addresses=Array.isArray(d?.Answer)?d.Answer.filter(x=>x.type===1).map(x=>x.data):[];const ms=Math.round(performance.now()-started);
   if(addresses.length){
    if(status)status.textContent=`HOST RESOLVED · ${addresses[0]} · ${ms} ms`;
    if(output)output.textContent=`SFTP HOST REACHABILITY CHECK\n\nHost: ${host}\nPort: ${port}\nDNS: RESOLVED\nAddress: ${addresses.join(', ')}\nTime: ${ms} ms\n\nBrowser limitation: a GitHub Pages web app cannot open a raw SSH/SFTP TCP connection. This confirms the hostname resolves, but it does not claim that SSH authentication or port ${port} is reachable.`;
   }else{
    if(status)status.textContent='HOST NOT RESOLVED';
    if(output)output.textContent=`Host: ${host}\nPort: ${port}\nDNS: no A record returned.\n\nCheck the hostname and try again.`;
   }
  }catch(e){if(status)status.textContent='CONNECTION TEST UNAVAILABLE';if(output)output.textContent=`Host: ${host}\nPort: ${port}\nError: ${String(e?.message||e)}\n\nDNS lookup could not be completed from the browser.`}
 });
};
install();new MutationObserver(install).observe(document.documentElement,{childList:true,subtree:true});
})();
