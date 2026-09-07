import { describe,it,expect } from 'vitest';
import { generate,evaluate } from '../src/learning/generators';
import { SKILLS,blankSkill } from '../src/learning/types';
import { LearningEngine } from '../src/learning/LearningEngine';
import { parseTopics,enabledSkills } from '../src/learning/config';
const random=()=>{let s=91823;return()=>((s=(s*1664525+1013904223)>>>0)/2**32);};
describe('18,000 seeded arithmetic challenges',()=>{
 for(const skill of SKILLS)for(const level of [1,2,3])it(`${skill}, confidence band ${level}: 1000 valid problems`,()=>{
  const rng=random();for(let i=0;i<1000;i++){
   const p=generate(skill,level,rng);expect(p.answer).toBe(evaluate(p.start,p.steps));expect(p.answer).toBeGreaterThanOrEqual(1);expect(p.answer).toBeLessThanOrEqual(20);
   let value=p.start;for(const s of p.steps){expect(s.amount).toBeGreaterThanOrEqual(1);expect(s.amount).toBeLessThanOrEqual(level===1?4:level===2?7:9);value=s.op==='+'?value+s.amount:value-s.amount;expect(value).toBeGreaterThanOrEqual(1);expect(value).toBeLessThanOrEqual(20);}
   if(skill==='addition'){expect(p.start).toBeGreaterThanOrEqual(10);expect(p.steps[0].op).toBe('+');expect(p.answer).toBeLessThan(20);}
   if(skill==='subtraction'){expect(p.start).toBeGreaterThanOrEqual(11);expect(p.answer).toBeGreaterThanOrEqual(10);}
   if(skill==='crossing_addition'){expect(p.start).toBeLessThan(10);expect(p.answer).toBeGreaterThan(10);}
   if(skill==='crossing_subtraction'){expect(p.start).toBeGreaterThan(10);expect(p.answer).toBeLessThan(10);}
   if(skill==='mixed'){expect(p.steps).toHaveLength(2);expect(p.steps[0].op).not.toBe(p.steps[1].op);}
   expect(p.inverse).toBe(skill==='inverse');
  }
 });
});
describe('learning configuration and adaptation',()=>{
 it('accepts booleans only, preserves future domains without activating unimplemented skills',()=>{const topics=parseTopics({math:{addition_to_20:false,subtraction_to_20:'yes',money:true},german:{articles:true},science:{plants:true}});expect(topics.math.addition_to_20).toBe(false);expect(topics.math.subtraction_to_20).toBe(true);expect(topics.science.plants).toBe(true);expect(enabledSkills(topics)).not.toContain('money');});
 it('returns no challenge when supported topics are all disabled',()=>{const t=parseTopics(null);Object.keys(t.math).forEach(k=>t.math[k]=false);expect(new LearningEngine({},t).request('quantity_change')).toBe(null);});
 it('respects stage focus and enabled topic overrides',()=>{const e=new LearningEngine({},parseTopics(null),true,'B',random());for(let i=0;i<30;i++)expect(e.request('quantity_change')?.skill).toMatch(/crossing/);e.stage='C';expect(e.request('quantity_change')?.skill).toBe('mixed');});
 it('adapts each skill independently without rewarding speed',()=>{const progress={addition:blankSkill(),subtraction:blankSkill()};const e=new LearningEngine(progress,parseTopics(null));for(let i=0;i<6;i++)e.record('addition',{firstTry:true,retries:0,hints:0,seconds:400});expect(progress.addition.difficulty).toBe(2);expect(progress.subtraction.difficulty).toBe(1);expect(progress.addition.firstTry).toBe(6);for(let i=0;i<6;i++)e.record('addition',{firstTry:false,retries:3,hints:1,seconds:10});expect(progress.addition.difficulty).toBe(1);});
 it('does not promote hinted, retried or non-adaptive answers',()=>{const e=new LearningEngine({},parseTopics(null),true);for(let i=0;i<6;i++)e.record('mixed',{firstTry:true,retries:0,hints:1,seconds:1});expect(e.progress.mixed?.difficulty).toBe(1);expect(e.progress.mixed?.firstTry).toBe(0);e.adaptive=false;for(let i=0;i<12;i++)e.record('mixed',{firstTry:true,retries:0,hints:0,seconds:1});expect(e.progress.mixed?.difficulty).toBe(1);});
});
