import { parseTopics, type TopicConfig } from '../learning/config';
import { blankSkill, SKILLS, type Progress, type Stage } from '../learning/types';
export const SAVE_KEY='mias-world-save';
export const VERSION='5.0.0';
export type Location='Shop'|'Playground'|'Room';
export type Placement={x:number;y:number;location:Location};
export interface SaveData {schema:5;updatedAt:number;coins:number;earned:number;served:number;goals:number;visits:number;shopStyle:number;unlocked:string[];placements:Record<string,Placement>;accessory:string;location:Location;preferences:{sound:boolean;music:boolean;adaptive:boolean;stage:Stage;freePlay:boolean};topics:TopicConfig;skills:Progress;onboarded:boolean;legacyImported:boolean}
export const defaults=():SaveData=>({schema:5,updatedAt:Date.now(),coins:8,earned:0,served:0,goals:0,visits:0,shopStyle:0,unlocked:['plush'],placements:{plush:{x:620,y:655,location:'Room'}},accessory:'none',location:'Shop',preferences:{sound:true,music:true,adaptive:true,stage:'auto',freePlay:false},topics:parseTopics(null),skills:{},onboarded:false,legacyImported:false});
const number=(v:unknown,fallback=0,max=999999)=>typeof v==='number'&&Number.isFinite(v)?Math.min(max,Math.max(0,Math.floor(v))):fallback;
export function migrate(input:unknown):SaveData {
  const base=defaults();if(!input||typeof input!=='object') return base;
  const raw=input as Record<string,any>;
  if(raw.schema>5)throw new Error('This save belongs to a newer release. Reconnect to update the game.');
  for(const key of ['coins','earned','served','goals','visits','shopStyle'] as const)base[key]=number(raw[key],base[key]);
  base.updatedAt=number(raw.updatedAt,base.updatedAt,Number.MAX_SAFE_INTEGER);
  base.unlocked=Array.isArray(raw.unlocked)?[...new Set(['plush',...raw.unlocked.filter((v:unknown)=>typeof v==='string')])]:base.unlocked;
  base.accessory=['none','bow','hat'].includes(raw.accessory)?raw.accessory:'none';
  if(['Shop','Playground','Room'].includes(raw.location))base.location=raw.location;
  if(raw.preferences)for(const key of ['sound','music','adaptive','freePlay'] as const)if(typeof raw.preferences[key]==='boolean')base.preferences[key]=raw.preferences[key];
  if(['auto','A','B','C'].includes(raw.preferences?.stage))base.preferences.stage=raw.preferences.stage;
  if(typeof raw.sound==='boolean')base.preferences.sound=raw.sound;
  if(typeof raw.adaptive==='boolean')base.preferences.adaptive=raw.adaptive;
  base.topics=parseTopics(raw.topics);base.onboarded=raw.onboarded===true;base.legacyImported=raw.legacyImported===true;
  for(const skill of SKILLS){const old=raw.skills?.[skill];if(!old)continue;const p=blankSkill();for(const key of ['attempts','firstTry','retries','hints','totalSeconds'] as const)p[key]=number(old[key]);p.firstTry=Math.min(p.attempts,p.firstTry);p.difficulty=Math.max(1,number(old.difficulty,1,3));p.recent=Array.isArray(old.recent)?old.recent.slice(-6).map((a:any)=>({firstTry:a.firstTry===true,retries:number(a.retries),hints:number(a.hints),seconds:number(a.seconds,0,3600)})):[];base.skills[skill]=p;}
  if(raw.placements&&typeof raw.placements==='object')for(const [id,v]of Object.entries(raw.placements) as [string,any][]){if(base.unlocked.includes(id)&&v&&['Shop','Playground','Room'].includes(v.location))base.placements[id]={x:number(v.x,600,1370),y:number(v.y,650,780),location:v.location};}
  return base;
}
export class SaveStore extends EventTarget {
  data=defaults();private db:IDBDatabase|null=null;private queue:Promise<void>=Promise.resolve();warning='';readOnly=false;
  async open(){
    let candidates:unknown[]=[];
    try{const raw=localStorage.getItem(SAVE_KEY);if(raw)candidates.push(JSON.parse(raw));}catch{}
    try{
      this.db=await new Promise<IDBDatabase>((resolve,reject)=>{const r=indexedDB.open('mias-world',1);r.onupgradeneeded=()=>r.result.createObjectStore('save');r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error);r.onblocked=()=>reject(new Error('Save database is busy'));});
      const old=await new Promise<unknown>((resolve,reject)=>{const r=this.db!.transaction('save').objectStore('save').get('world');r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error);});if(old)candidates.push(old);
    }catch{this.warning='Browser storage is limited. Keep this tab open to preserve your play.';}
    if(!candidates.length)for(const key of ['miasPlaygroundWorldV4','mathQuestV3','mathQuestV2']){try{const v=JSON.parse(localStorage.getItem(key)||'null');if(v){candidates.push({...v,legacyImported:true});break;}}catch{}}
    candidates.sort((a:any,b:any)=>(b.updatedAt||0)-(a.updatedAt||0));
    if(candidates.length){try{this.data=migrate(candidates[0]);}catch(error){this.readOnly=true;this.warning=(error as Error).message;}}
    if(!this.readOnly){this.data.visits++;this.commit();}
    return this.data;
  }
  commit(){
    if(this.readOnly)return;
    this.data.updatedAt=Date.now();const snapshot=structuredClone(this.data);
    try{localStorage.setItem(SAVE_KEY,JSON.stringify(snapshot));}catch{this.warning='Storage is full. Progress may not survive closing this browser.';}
    if(this.db)this.queue=this.queue.then(()=>new Promise<void>((resolve,reject)=>{const tx=this.db!.transaction('save','readwrite');tx.objectStore('save').put(snapshot,'world');tx.oncomplete=()=>resolve();tx.onerror=()=>reject(tx.error);})).catch(()=>{this.warning='Saving is unavailable. Please keep this tab open.';this.dispatchEvent(new Event('warning'));});
    this.dispatchEvent(new Event('change'));if(this.warning)this.dispatchEvent(new Event('warning'));
  }
  async flush(){await this.queue;}
  async reset(){this.readOnly=false;this.data=defaults();this.commit();await this.flush();}
  close(){this.db?.close();}
}
