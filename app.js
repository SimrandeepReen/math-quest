(() => {
  const KEY='miasPlaygroundWorldV4';
  const legacyKeys=['mathQuestV2','mathQuestV3'];
  const treasures=['🛴','🧸','🎈','🪁','🛝','⚽','🐰','🎨','🛹','🦄','🍦','🌟'];
  const roomMeta={
    home:{name:'HOME',title:'Home',decor:[['🛏️',8,42],['🪟',78,14],['🪴',70,53],['🧸',27,58],['🎒',48,58]]},
    shop:{name:'CANDY SHOP',title:'Candy Shop',decor:[['🍭',8,18],['🍬',22,48],['🧁',72,52],['🏪',45,16],['🛒',82,55]]},
    park:{name:'PLAYGROUND',title:'Playground',decor:[['🌳',7,25],['🛝',29,38],['⚽',66,62],['🧺',80,58],['🌼',53,68]]}
  };
  const activityNames={home:['Backpack Builder','Toy Tidy'],shop:['Candy Basket','Share the Treats'],park:['Score the Goals','Picnic Helper']};
  const defaults={level:1,coins:0,treasures:[],adventures:0,tasks:{home:false,shop:false,park:false},sound:true,adaptive:true,equations:true,totalAnswered:0,totalCorrect:0,recent:[],lastActivities:{},adventureSeed:Date.now()};
  let state=loadState(),room=null,current=null,answerText='',audioCtx=null,drag=null,freePlay=false;
  const $=id=>document.getElementById(id);
  const screens=['worldScreen','roomScreen','treasureScreen','settingsScreen'];

  function loadState(){
    try{const raw=localStorage.getItem(KEY);if(raw)return {...defaults,...JSON.parse(raw)};}catch{}
    let migrated={...defaults};
    for(const k of legacyKeys){try{const v=JSON.parse(localStorage.getItem(k)||'null');if(v){migrated.level=Math.max(1,Math.min(3,v.level||1));migrated.totalAnswered=v.totalAnswered||0;migrated.totalCorrect=v.totalCorrect||0;break;}}catch{}}
    return migrated;
  }
  function save(){localStorage.setItem(KEY,JSON.stringify(state));}
  function show(id){screens.forEach(s=>$(s).classList.toggle('active',s===id));window.scrollTo({top:0,behavior:'instant'});}
  const rand=(a,b)=>Math.floor(Math.random()*(b-a+1))+a;
  const pick=a=>a[Math.floor(Math.random()*a.length)];
  const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
  function levelText(l=state.level){return ['Two-digit ± single-digit','Crossing ten','Two-step mixed + and −'][clamp(l,1,3)-1];}

  function ensureAudio(){if(!audioCtx){const C=window.AudioContext||window.webkitAudioContext;if(C)audioCtx=new C();}if(audioCtx?.state==='suspended')audioCtx.resume();}
  function tone(f,d,t=0,type='sine',vol=.04){if(!state.sound)return;ensureAudio();if(!audioCtx)return;const n=audioCtx.currentTime+t,o=audioCtx.createOscillator(),g=audioCtx.createGain();o.type=type;o.frequency.setValueAtTime(f,n);g.gain.setValueAtTime(.001,n);g.gain.linearRampToValueAtTime(vol,n+.015);g.gain.exponentialRampToValueAtTime(.001,n+d);o.connect(g);g.connect(audioCtx.destination);o.start(n);o.stop(n+d+.02);}
  function goodSound(){tone(523,.1);tone(659,.12,.08);tone(784,.16,.17);}
  function coinSound(){tone(880,.07,0,'triangle',.035);tone(1175,.1,.07,'triangle',.04);}
  function treasureSound(){[523,659,784,1047].forEach((f,i)=>tone(f,.18,i*.12,'triangle',.05));}
  function sparks(){for(let i=0;i<12;i++){const e=document.createElement('div');e.className='spark';e.textContent=pick(['✨','⭐','🎉']);e.style.left=(45+Math.random()*10)+'vw';e.style.top=(45+Math.random()*10)+'vh';e.style.setProperty('--dx',(Math.random()*220-110)+'px');e.style.setProperty('--dy',(Math.random()*-180-30)+'px');document.body.appendChild(e);setTimeout(()=>e.remove(),900);}}

  function updateHud(){
    $('coinHud').textContent=`🪙 ${state.coins}`;
    const done=Object.values(state.tasks).filter(Boolean).length;$('adventureHud').textContent=`🗺️ ${done}/3`;
    ['home','shop','park'].forEach(r=>$(r+'TaskMark').textContent=state.tasks[r]?'✓':'○');
    $('collection').innerHTML=state.treasures.length?state.treasures.map(x=>`<div class="collect-item">${x}</div>`).join(''):'<span>No treasures yet — finish an adventure!</span>';
    $('levelDescription').textContent=levelText();$('levelSelect').value=String(state.level);
  }
  function world(){room=null;freePlay=false;updateHud();show('worldScreen');}
  function newAdventure(){state.tasks={home:false,shop:false,park:false};state.adventureSeed=Date.now();save();updateHud();$('adventureTitle').textContent='A fresh adventure!';$('adventureText').textContent='Help once at home, once at the shop and once at the playground to unlock a treasure.';}

  function renderScene(r){const meta=roomMeta[r];$('roomScene').className='room-scene '+r;let html=meta.decor.map(([e,x,y])=>`<span class="scene-decor" style="left:${x}%;top:${y}%">${e}</span>`).join('');state.treasures.slice(-3).forEach((e,i)=>{html+=`<span class="scene-decor" style="left:${42+i*10}%;top:62%;font-size:42px">${e}</span>`;});$('roomScene').innerHTML=html;}
  function enterRoom(r){room=r;freePlay=false;const meta=roomMeta[r];$('roomName').textContent=meta.name;$('roomTitle').textContent=meta.title;renderScene(r);show('roomScreen');startActivity(r);}

  function mathProblem(){
    const l=clamp(state.level,1,3);
    if(l===1){
      if(Math.random()<.5){const a=rand(10,18),b=rand(1,Math.min(7,20-a));return {steps:[{op:'+',amount:b}],start:a,answer:a+b};}
      const a=rand(12,20),b=rand(1,Math.min(8,a-10));return {steps:[{op:'-',amount:b}],start:a,answer:a-b};
    }
    if(l===2){
      if(Math.random()<.5){const ans=rand(2,9),b=rand(Math.max(1,10-ans),Math.min(9,20-ans)),a=ans+b;return {steps:[{op:'-',amount:b}],start:a,answer:ans};}
      const a=rand(2,9),b=rand(Math.max(1,10-a),9);return {steps:[{op:'+',amount:b}],start:a,answer:a+b};
    }
    for(let i=0;i<100;i++){
      const a=rand(7,18),op1=pick(['+','-']),op2=pick(['+','-']),b=rand(2,7),c=rand(2,7);const mid=op1==='+'?a+b:a-b,ans=op2==='+'?mid+c:mid-c;if(mid>=0&&mid<=20&&ans>=0&&ans<=20)return {steps:[{op:op1,amount:b},{op:op2,amount:c}],start:a,answer:ans};
    }
    return {steps:[{op:'+',amount:3},{op:'-',amount:5}],start:14,answer:12};
  }

  function chooseActivity(r){const names=activityNames[r],last=state.lastActivities[r];let options=names.filter(x=>x!==last);if(!options.length)options=names;const name=pick(options);state.lastActivities[r]=name;save();return name;}
  function activityConfig(r,name,p){
    const plus=p.steps[0].op==='+';
    if(r==='home'&&name==='Backpack Builder')return {emoji:'🍎',sourceLabel:plus?'Snack tray':'Backpack',targetLabel:plus?'Backpack':'Friend',title:'Pack for the day',prompt:plus?`Mia already has ${p.start} snack pieces. Add ${p.steps[0].amount} more to her backpack.`:`Mia has ${p.start} snack pieces. Give ${p.steps[0].amount} to her friend before leaving.`,verb:plus?'add':'remove'};
    if(r==='home')return {emoji:'🧸',sourceLabel:plus?'Toy shelf':'Toy box',targetLabel:plus?'Toy box':'Play mat',title:'Tidy the toys',prompt:plus?`There are ${p.start} toys in the box. Put ${p.steps[0].amount} more away.`:`There are ${p.start} toys in the box. Take ${p.steps[0].amount} out for playtime.`,verb:plus?'add':'remove'};
    if(r==='shop'&&name==='Candy Basket')return {emoji:'🍬',sourceLabel:plus?'Candy shelf':'Basket',targetLabel:plus?'Basket':'Share bag',title:'Fill the candy basket',prompt:plus?`The basket has ${p.start} candies. Choose ${p.steps[0].amount} more.`:`The basket has ${p.start} candies. Move ${p.steps[0].amount} into the share bag.`,verb:plus?'add':'remove'};
    if(r==='shop')return {emoji:'🍓',sourceLabel:plus?'Treat counter':'Mia’s bag',targetLabel:plus?'Mia’s bag':'Friend’s plate',title:'Share the treats',prompt:plus?`Mia has ${p.start} treats. The shopkeeper gives her ${p.steps[0].amount} more.`:`Mia has ${p.start} treats. Share ${p.steps[0].amount} with a friend.`,verb:plus?'add':'remove'};
    if(r==='park'&&name==='Score the Goals')return {emoji:'⚽',sourceLabel:plus?'Ball rack':'Score board',targetLabel:plus?'Goal':'Bonus box',title:'Score the goals',prompt:plus?`Mia’s team has ${p.start} points. Score ${p.steps[0].amount} more goals.`:`Mia’s team has ${p.start} points. Use ${p.steps[0].amount} points for a super move.`,verb:plus?'add':'remove'};
    return {emoji:'🧁',sourceLabel:plus?'Picnic basket':'Picnic plate',targetLabel:plus?'Picnic plate':'Friend’s plate',title:'Set up the picnic',prompt:plus?`There are ${p.start} snacks on the picnic plate. Add ${p.steps[0].amount} more.`:`There are ${p.start} snacks. Give ${p.steps[0].amount} to friends.`,verb:plus?'add':'remove'};
  }

  function startActivity(r){
    current={room:r,name:chooseActivity(r),problem:mathProblem(),stepIndex:0,moves:0,mistakes:0,answered:false};
    const cfg=activityConfig(r,current.name,current.problem);current.cfg=cfg;$('activityTitle').textContent=cfg.title;$('activityPrompt').textContent=cfg.prompt;$('feedback').textContent='';$('feedback').className='feedback';$('answerPanel').classList.add('hidden');answerText='';renderManipulation();
  }
  function renderManipulation(){
    const p=current.problem,step=p.steps[current.stepIndex],cfg=current.cfg;current.moves=0;
    const isAdd=step.op==='+';const baseCount=current.stepIndex===0?p.start:(p.steps[0].op==='+'?p.start+p.steps[0].amount:p.start-p.steps[0].amount);
    const leftCount=isAdd?step.amount:baseCount;const rightCount=isAdd?baseCount:0;
    const sourceLabel=isAdd?cfg.sourceLabel:cfg.sourceLabel,targetLabel=isAdd?cfg.targetLabel:cfg.targetLabel;
    $('activityArea').innerHTML=`
      <div class="play-zone source-zone drop-zone" data-zone="source"><div class="zone-title"><span>${sourceLabel}</span><span class="counter-badge" id="sourceCount">${leftCount}</span></div><div id="sourceTokens" class="token-grid"></div><div class="instruction-chip">${isAdd?'Drag '+step.amount+' over →':'Drag '+step.amount+' out →'}</div></div>
      <div class="play-zone target-zone drop-zone" data-zone="target"><div class="zone-title"><span>${targetLabel}</span><span class="counter-badge" id="targetCount">${rightCount}</span></div><div id="targetTokens" class="token-grid"></div></div>`;
    const src=$('sourceTokens'),tgt=$('targetTokens');
    if(isAdd){for(let i=0;i<step.amount;i++)src.appendChild(token(cfg.emoji,'source'));for(let i=0;i<baseCount;i++)tgt.appendChild(token(cfg.emoji,'target',false));}
    else{for(let i=0;i<baseCount;i++)src.appendChild(token(cfg.emoji,'source'));}
    bindDropZones();
  }
  function token(emoji,zone,draggable=true){const e=document.createElement('div');e.className='token';e.textContent=emoji;e.dataset.zone=zone;if(draggable){e.addEventListener('pointerdown',beginDrag);}else{e.style.cursor='default';}return e;}
  function beginDrag(ev){
    if(freePlay)return;ensureAudio();const el=ev.currentTarget;
    const ghost=el.cloneNode(true);ghost.classList.remove('dragging');ghost.style.position='fixed';ghost.style.zIndex='120';ghost.style.pointerEvents='none';ghost.style.width='58px';ghost.style.height='58px';ghost.style.margin='0';ghost.style.transform='translate(-50%,-50%) scale(1.08)';ghost.style.left=ev.clientX+'px';ghost.style.top=ev.clientY+'px';ghost.style.boxShadow='0 14px 30px rgba(30,50,80,.22)';document.body.appendChild(ghost);
    drag={el,origin:el.parentElement,from:el.dataset.zone,pid:ev.pointerId,ghost};el.classList.add('dragging');el.setPointerCapture?.(ev.pointerId);
    const move=e=>{if(drag?.ghost){drag.ghost.style.left=e.clientX+'px';drag.ghost.style.top=e.clientY+'px';document.querySelectorAll('.drop-zone').forEach(z=>z.classList.toggle('drop-highlight',!!document.elementFromPoint(e.clientX,e.clientY)?.closest('.drop-zone')&&document.elementFromPoint(e.clientX,e.clientY)?.closest('.drop-zone')===z));}};
    drag.move=move;el.addEventListener('pointermove',move);el.addEventListener('pointerup',endDrag,{once:true});el.addEventListener('pointercancel',cancelDrag,{once:true});
  }
  function endDrag(ev){if(!drag)return;const d=drag,el=d.el;el.classList.remove('dragging');el.removeEventListener('pointermove',d.move);d.ghost?.remove();document.querySelectorAll('.drop-zone').forEach(z=>z.classList.remove('drop-highlight'));const hit=document.elementFromPoint(ev.clientX,ev.clientY)?.closest('.drop-zone');drag=null;if(hit&&hit.dataset.zone!==d.from)performMove(hit.dataset.zone);}
  function cancelDrag(){if(!drag)return;drag.el.classList.remove('dragging');drag.el.removeEventListener('pointermove',drag.move);drag.ghost?.remove();document.querySelectorAll('.drop-zone').forEach(z=>z.classList.remove('drop-highlight'));drag=null;}
  function bindDropZones(){document.querySelectorAll('.drop-zone').forEach(z=>{z.addEventListener('pointerenter',()=>z.classList.add('drop-highlight'));z.addEventListener('pointerleave',()=>z.classList.remove('drop-highlight'));});}
  function performMove(to){
    const step=current.problem.steps[current.stepIndex],isAdd=step.op==='+';if((isAdd&&to!=='target')||(!isAdd&&to!=='target'))return;
    if(current.moves>=step.amount)return;
    const src=$('sourceTokens'),tgt=$('targetTokens');let el=src.querySelector('.token');if(!el)return;src.removeChild(el);el.dataset.zone='target';el.removeEventListener('pointerdown',beginDrag);el.style.cursor='default';tgt.appendChild(el);current.moves++;updateCounts();coinSound();
    if(current.moves===step.amount)setTimeout(manipulationComplete,350);
  }
  function updateCounts(){$('sourceCount').textContent=$('sourceTokens').children.length;$('targetCount').textContent=$('targetTokens').children.length;}
  function manipulationComplete(){
    if(current.stepIndex<current.problem.steps.length-1){current.stepIndex++;const s=current.problem.steps[current.stepIndex];current.cfg={...current.cfg,prompt:`Great. Now ${s.op==='+'?'add':'move away'} ${s.amount} more.`};$('activityPrompt').textContent=current.cfg.prompt;renderManipulation();return;}
    showAnswer();
  }
  function showAnswer(){current.answered=true;$('answerQuestion').textContent='How many are there now?';$('answerHintText').textContent='Use the number buttons — no guessing choices.';$('answerPanel').classList.remove('hidden');answerText='';renderAnswer();buildKeypad();}
  function buildKeypad(){const box=$('keypad');box.innerHTML='';[0,1,2,3,4,5,6,7,8,9].forEach(n=>{const b=document.createElement('button');b.className='key';b.textContent=n;b.onclick=()=>{if(answerText.length<2){answerText+=n;renderAnswer();}};box.appendChild(b)});const del=document.createElement('button');del.className='key';del.textContent='⌫';del.onclick=()=>{answerText=answerText.slice(0,-1);renderAnswer();};box.appendChild(del);const go=document.createElement('button');go.className='key go';go.textContent='Check';go.onclick=checkAnswer;box.appendChild(go);}
  function renderAnswer(){$('answerDisplay').textContent=answerText||'?';}
  function equation(){const p=current.problem;let s=String(p.start);p.steps.forEach(x=>s+=` ${x.op==='+'?'+':'−'} ${x.amount}`);return s+' = ?';}
  function checkAnswer(){if(!answerText)return;ensureAudio();const ok=Number(answerText)===current.problem.answer;state.totalAnswered++;if(ok){state.totalCorrect++;state.recent.push(1);completeActivity();}else{state.recent.push(0);current.mistakes++;$('feedback').textContent='Almost — look at the objects and try again.';$('feedback').className='feedback bad';if(state.equations)$('answerHintText').textContent='Hint: '+equation();answerText='';renderAnswer();tone(294,.12,0,'sine',.02);}if(state.recent.length>12)state.recent.shift();save();}
  function completeActivity(){
    goodSound();sparks();state.coins+=3;state.tasks[room]=true;adapt();save();$('feedback').textContent='You did it! +3 coins';$('feedback').className='feedback good';updateHud();setTimeout(()=>{if(Object.values(state.tasks).every(Boolean))show('treasureScreen');else world();},950);
  }
  function adapt(){if(!state.adaptive||state.recent.length<8)return;const a=state.recent.reduce((x,y)=>x+y,0)/state.recent.length;if(a>=.85&&state.level<3){state.level++;state.recent=[];}else if(a<=.5&&state.level>1){state.level--;state.recent=[];}}

  function showHelp(){if(freePlay){$('feedback').textContent='Drag your toys anywhere you like. Free play has no maths.';$('feedback').className='feedback';return;}if(!current)return;const p=current.problem,s=p.steps[current.stepIndex];$('feedback').textContent=state.equations?`Try this clue: ${equation()}`:`Count what you started with, then ${s.op==='+'?'add':'take away'} ${s.amount}.`;$('feedback').className='feedback';}
  function startFreePlay(){freePlay=true;$('activityTitle').textContent='Free play time';$('activityPrompt').textContent='Move your treasures and toys around. Nothing to solve here.';$('answerPanel').classList.add('hidden');$('feedback').textContent='';const toys=(state.treasures.length?state.treasures:['🧸','⚽','🎈','🪁']).slice(-6);$('activityArea').innerHTML=`<div id="freeCanvas" class="freeplay"><div class="freeplay-note">Drag things around — this part is just for fun.</div></div>`;const c=$('freeCanvas');toys.forEach((e,i)=>{const t=token(e,'free');t.style.left=(12+(i%3)*27)+'%';t.style.top=(15+Math.floor(i/3)*38)+'%';t.addEventListener('pointerdown',freeDrag);c.appendChild(t);});}
  function freeDrag(ev){const el=ev.currentTarget,c=$('freeCanvas'),r=c.getBoundingClientRect(),startX=ev.clientX,startY=ev.clientY,startL=parseFloat(el.style.left),startT=parseFloat(el.style.top);el.setPointerCapture?.(ev.pointerId);const move=e=>{const dx=(e.clientX-startX)/r.width*100,dy=(e.clientY-startY)/r.height*100;el.style.left=clamp(startL+dx,0,88)+'%';el.style.top=clamp(startT+dy,0,82)+'%';};const up=()=>{el.removeEventListener('pointermove',move);el.removeEventListener('pointerup',up);};el.addEventListener('pointermove',move);el.addEventListener('pointerup',up);}

  function openTreasure(){if(!$('treasureReveal').classList.contains('hidden'))return;ensureAudio();let options=treasures.filter(t=>!state.treasures.includes(t));if(!options.length)options=treasures;const prize=pick(options);state.treasures.push(prize);state.coins+=10;state.adventures++;save();treasureSound();sparks();$('treasureReveal').textContent=`${prize}  +10 🪙`;$('treasureReveal').classList.remove('hidden');$('treasureWorldBtn').classList.remove('hidden');$('treasureChest').textContent='🎊';}
  function treasureBack(){state.tasks={home:false,shop:false,park:false};save();$('treasureReveal').classList.add('hidden');$('treasureWorldBtn').classList.add('hidden');$('treasureChest').textContent='🎁';world();}

  function syncSettings(){$('soundToggle').classList.toggle('on',state.sound);$('adaptiveToggle').classList.toggle('on',state.adaptive);$('equationToggle').classList.toggle('on',state.equations);$('levelSelect').value=String(state.level);$('levelDescription').textContent=levelText();}
  function toggle(key,id){state[key]=!state[key];$(id).classList.toggle('on',state[key]);save();}

  document.querySelectorAll('.place-card').forEach(b=>b.onclick=()=>enterRoom(b.dataset.room));
  $('worldBtn').onclick=world;$('backToWorld').onclick=world;$('newAdventureBtn').onclick=newAdventure;$('shuffleActivityBtn').onclick=()=>{freePlay=false;startActivity(room)};$('freePlayBtn').onclick=startFreePlay;$('helpBtn').onclick=showHelp;
  $('treasureChest').onclick=openTreasure;$('treasureWorldBtn').onclick=treasureBack;
  $('settingsBtn').onclick=()=>{syncSettings();show('settingsScreen')};$('settingsClose').onclick=world;
  $('soundToggle').onclick=()=>toggle('sound','soundToggle');$('adaptiveToggle').onclick=()=>toggle('adaptive','adaptiveToggle');$('equationToggle').onclick=()=>toggle('equations','equationToggle');
  $('levelSelect').onchange=e=>{state.level=Number(e.target.value);state.recent=[];save();syncSettings();};
  $('resetBtn').onclick=()=>{if(confirm('Reset Mia’s whole world?')){state={...defaults,tasks:{home:false,shop:false,park:false},lastActivities:{},adventureSeed:Date.now()};save();syncSettings();world();}};

  updateHud();
  if('serviceWorker' in navigator){window.addEventListener('load',()=>navigator.serviceWorker.register('./sw.js?v=4').then(r=>r.update()).catch(()=>{}));}
})();