import {beforeEach,afterEach,describe,it,expect} from 'vitest';
import 'fake-indexeddb/auto';
import {defaults,migrate,SaveStore,SAVE_KEY} from '../src/persistence/SaveStore';
const memory=new Map<string,string>();
Object.defineProperty(globalThis,'localStorage',{value:{getItem:(k:string)=>memory.get(k)||null,setItem:(k:string,v:string)=>memory.set(k,v),removeItem:(k:string)=>memory.delete(k)}});
let stores:SaveStore[]=[];
beforeEach(async()=>{memory.clear();await new Promise<void>(resolve=>{const r=indexedDB.deleteDatabase('mias-world');r.onsuccess=()=>resolve();});});
afterEach(async()=>{for(const s of stores){await s.flush();s.close();}stores=[];});
const store=()=>{const s=new SaveStore();stores.push(s);return s;};
describe('durable save and migration',()=>{
 it('restores coins, objects, preferences and independent learning through IndexedDB',async()=>{const s=store();await s.open();s.data.coins=31;s.data.unlocked.push('plant');s.data.placements.plant={x:420,y:630,location:'Shop'};s.data.preferences.music=false;s.commit();await s.flush();s.close();memory.clear();const next=store();await next.open();expect(next.data.coins).toBe(31);expect(next.data.placements.plant.location).toBe('Shop');expect(next.data.preferences.music).toBe(false);});
 it('serializes rapid saves and restores the latest revision',async()=>{const s=store();await s.open();for(let i=1;i<=30;i++){s.data.coins=i;s.commit();}await s.flush();const next=store();await next.open();expect(next.data.coins).toBe(30);});
 it('imports V4 coins and preferences without inventing per-skill results',async()=>{memory.set('miasPlaygroundWorldV4',JSON.stringify({coins:72,level:3,totalCorrect:44,sound:false}));const s=store();await s.open();expect(s.data.coins).toBe(72);expect(s.data.preferences.sound).toBe(false);expect(s.data.skills).toEqual({});expect(s.data.legacyImported).toBe(true);expect(memory.has('miasPlaygroundWorldV4')).toBe(true);});
 it('repairs malformed supported saves and never overwrites a future schema',async()=>{expect(migrate({coins:-999,unlocked:'bad',placements:{}}).coins).toBe(0);expect(migrate({coins:NaN}).coins).toBe(8);memory.set(SAVE_KEY,JSON.stringify({schema:999,coins:55}));const s=store();await s.open();expect(s.readOnly).toBe(true);s.commit();expect(JSON.parse(memory.get(SAVE_KEY)!).schema).toBe(999);});
 it('resets both storage copies after explicit request',async()=>{const s=store();await s.open();s.data.coins=888;s.commit();await s.reset();expect(s.data.coins).toBe(defaults().coins);const next=store();await next.open();expect(next.data.coins).toBe(8);});
});
