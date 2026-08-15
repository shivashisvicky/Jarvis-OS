export type AppId = 'home'|'calculator'|'snake'|'files'|'notes'|'settings'|'api'|'remote'|'web'|'maps'|'media';
export interface Note { id:number; text:string; created:number }

const dbName='jarvis-os';
const ensure=(db:IDBDatabase)=>{if(!db.objectStoreNames.contains('kv'))db.createObjectStore('kv');if(!db.objectStoreNames.contains('notes'))db.createObjectStore('notes',{keyPath:'id',autoIncrement:true})};
const request=(store:string, mode:IDBTransactionMode, fn:(s:IDBObjectStore)=>void)=>new Promise<void>((resolve,reject)=>{const open=indexedDB.open(dbName,1);open.onupgradeneeded=()=>ensure(open.result);open.onsuccess=()=>{const db=open.result;const tx=db.transaction(store,mode);fn(tx.objectStore(store));tx.oncomplete=()=>{db.close();resolve()};tx.onerror=()=>reject(tx.error)};open.onerror=()=>reject(open.error)});
export async function getSetting<T>(key:string, fallback:T):Promise<T>{return new Promise(resolve=>{const o=indexedDB.open(dbName,1);o.onupgradeneeded=()=>ensure(o.result);o.onsuccess=()=>{const db=o.result;const tx=db.transaction('kv','readonly');const q=tx.objectStore('kv').get(key);q.onsuccess=()=>{db.close();resolve(q.result??fallback)};q.onerror=()=>{db.close();resolve(fallback)}};o.onerror=()=>resolve(fallback)})}
export async function setSetting(key:string,value:unknown){await request('kv','readwrite',s=>s.put(value,key))}
export async function addNote(text:string){await request('notes','readwrite',s=>s.add({text,created:Date.now()}))}
export async function notes():Promise<Note[]>{return new Promise(resolve=>{const o=indexedDB.open(dbName,1);o.onupgradeneeded=()=>ensure(o.result);o.onsuccess=()=>{const db=o.result;const q=db.transaction('notes','readonly').objectStore('notes').getAll();q.onsuccess=()=>{db.close();resolve(q.result as Note[])};q.onerror=()=>resolve([])}})}
export async function pushRecentTab(title:string,url:string){const current=await getSetting<{title:string;url:string;time:number}[]>('recentTabs',[]);const next=[{title,url,time:Date.now()},...current.filter(x=>x.url!==url)].slice(0,12);await setSetting('recentTabs',next)}
export async function getRecentTabs(){return getSetting<{title:string;url:string;time:number}[]>('recentTabs',[])}
