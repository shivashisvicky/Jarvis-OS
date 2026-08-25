(()=>{
'use strict';
if(window.__JARVIS_TASK_INTELLIGENCE_RESET_V1__)return;
window.__JARVIS_TASK_INTELLIGENCE_RESET_V1__=true;
window.addEventListener('jarvis:task-context-switched',event=>{
 try{window.jarvisIntelligence?.clearConversation?.()}catch{}
 try{window.__JARVIS_COMMAND_ROUTE__=null}catch{}
},true);
})();
