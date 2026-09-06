import {describe,it,expect} from 'vitest';
import {defaults} from '../src/persistence/SaveStore';
import {purchase,earn,CATALOG} from '../src/game/systems/Rewards';
import {advance,launch,scored} from '../src/game/systems/BasketPhysics';
describe('world rewards',()=>{
 it('gives usable items and prevents duplicate charges',()=>{const s=defaults();expect(purchase(s,'plant')).toBe('bought');expect(s.coins).toBe(0);expect(s.placements.plant.location).toBe('Room');expect(purchase(s,'plant')).toBe('owned');expect(purchase(s,'rocket')).toBe('funds');expect(purchase(s,'invalid')).toBe('unknown');});
 it('awards one defined reward per gameplay outcome',()=>{const s=defaults();expect(earn(s,'serve')).toBe(3);expect(earn(s,'learning')).toBe(5);expect(earn(s,'basket')).toBe(1);expect(s.earned).toBe(9);expect(s.served).toBe(2);expect(s.goals).toBe(1);});
 it('equips accessories and makes new flavours usable',()=>{const s=defaults();s.coins=200;for(const item of CATALOG)expect(purchase(s,item.id)).toBe('bought');expect(s.unlocked).toContain('mint');expect(s.accessory).toBe('hat');expect(s.coins).toBeGreaterThanOrEqual(0);});
});
describe('basketball physics',()=>{
 it('scores descending rim crossings only, including high delta segments',()=>{expect(scored({x:1070,y:370,vx:200,vy:200},{x:1150,y:420,vx:200,vy:300},1110,396)).toBe(true);expect(scored({x:1110,y:420,vx:0,vy:-300},{x:1110,y:370,vx:0,vy:-200},1110,396)).toBe(false);expect(scored({x:800,y:370,vx:0,vy:200},{x:800,y:420,vx:0,vy:300},1110,396)).toBe(false);});
 it('a real upward swipe can score under gravity at different frame rates',()=>{for(const dt of [1/30,1/60,1/120]){const b=launch(620,700,66,-190);let hit=false;for(let i=0;i<3/dt;i++){const prev={...b};advance(b,dt);if(scored(prev,b,1110,396))hit=true;}expect(hit).toBe(true);}});
 it('bounds velocities for extreme gestures',()=>{const b=launch(600,700,99999,-99999);expect(b.vx).toBe(720);expect(b.vy).toBe(-1120);});
});
