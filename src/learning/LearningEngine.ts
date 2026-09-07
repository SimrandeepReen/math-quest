import { generate } from './generators';
import { enabledSkills, type TopicConfig } from './config';
import { blankSkill, type Attempt, type Challenge, type Progress, type Skill, type Stage } from './types';
export class LearningEngine {
  constructor(public progress:Progress,public topics:TopicConfig,public adaptive=true,public stage:Stage='auto',private rng:()=>number=Math.random){}
  request(_mechanic:'quantity_change'|'quantity_difference'):Challenge|null {
    const attempts=Object.values(this.progress).reduce((n,p)=>n+(p?.attempts||0),0);
    let skills=enabledSkills(this.topics);
    const preferred=this.stage==='A'?['addition','subtraction','inverse']:this.stage==='B'?['crossing_addition','crossing_subtraction']:this.stage==='C'?['mixed']:attempts<3?['addition','subtraction']:attempts<6?['addition','subtraction','inverse','crossing_addition','crossing_subtraction']:skills;
    const filtered=skills.filter(s=>preferred.includes(s)); if(filtered.length) skills=filtered;
    if(!skills.length) return null;
    // Favour less-practised, less-confident skills, while keeping variety.
    const weights=skills.map(s=>{const p=this.progress[s]||blankSkill();return 1+(1-p.firstTry/Math.max(1,p.attempts))*2+1/(p.attempts+1);});
    let pick=this.rng()*weights.reduce((a,b)=>a+b,0),skill=skills[skills.length-1];
    for(let i=0;i<skills.length;i++){pick-=weights[i];if(pick<=0){skill=skills[i];break;}}
    return generate(skill,this.progress[skill]?.difficulty||1,this.rng);
  }
  record(skill:Skill,attempt:Attempt) {
    const p=this.progress[skill]??=blankSkill();
    const safe={firstTry:attempt.firstTry && attempt.retries===0 && attempt.hints===0,retries:Math.max(0,attempt.retries),hints:Math.max(0,attempt.hints),seconds:Math.min(3600,Math.max(0,attempt.seconds))};
    p.attempts++; p.firstTry+=Number(safe.firstTry); p.retries+=safe.retries; p.hints+=safe.hints; p.totalSeconds+=safe.seconds; p.recent.push(safe);
    if(p.recent.length>6) p.recent.shift();
    if(this.adaptive && p.recent.length===6){
      const confident=p.recent.filter(a=>a.firstTry).length;
      if(confident>=5 && p.difficulty<3){p.difficulty++;p.recent=[];}
      else if(confident<=2 && p.difficulty>1){p.difficulty--;p.recent=[];}
    }
    return p;
  }
}
