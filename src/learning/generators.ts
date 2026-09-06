import type { Challenge, Skill, Step } from './types';
export const evaluate = (start:number,steps:Step[]) => steps.reduce((v,s)=>s.op==='+'?v+s.amount:v-s.amount,start);
export function generate(skill:Skill,difficulty=1,rng:()=>number=Math.random):Challenge {
  const level=Math.min(3,Math.max(1,Math.floor(difficulty)));
  const choices: Array<{start:number;steps:Step[]}> = [];
  const max=level===1?4:level===2?7:9;
  for(let a=1;a<=19;a++) for(let b=1;b<=max;b++) {
    if(skill==='addition' && a>=10 && a+b<=19) choices.push({start:a,steps:[{op:'+',amount:b}]});
    if(skill==='subtraction' && a>=11 && a-b>=10) choices.push({start:a,steps:[{op:'-',amount:b}]});
    if(skill==='crossing_addition' && a<=9 && a+b>10 && a+b<=18) choices.push({start:a,steps:[{op:'+',amount:b}]});
    if(skill==='crossing_subtraction' && a>=11 && a-b>0 && a-b<10) choices.push({start:a,steps:[{op:'-',amount:b}]});
    if(skill==='inverse' && a>=6 && a+b<=20) choices.push({start:a,steps:[{op:'+',amount:b}]},{start:a+b,steps:[{op:'-',amount:b}]});
    if(skill==='mixed' && a>=10) for(let c=1;c<=max;c++) for(const sign of ['+','-'] as const){
      const steps:Step[]=[{op:sign,amount:b},{op:sign==='+'?'-':'+',amount:c}];
      const middle=evaluate(a,[steps[0]]),answer=evaluate(a,steps);
      if(middle>=1 && middle<=20 && answer>=1 && answer<=20 && answer!==a) choices.push({start:a,steps});
    }
  }
  if(!choices.length) throw new Error(`No valid generator for ${skill}`);
  const selected=choices[Math.min(choices.length-1,Math.floor(Math.max(0,rng())*choices.length))];
  return {id:`${skill}-${Math.floor(rng()*1e9)}-${selected.start}`,skill,difficulty:level,...selected,answer:evaluate(selected.start,selected.steps),inverse:skill==='inverse'};
}
