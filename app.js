(() => {
  const KEY='mathQuestV3';
  const old=JSON.parse(localStorage.getItem('mathQuestV2')||'{}');
  const defaults={level:1,totalBadges:0,totalAnswered:0,totalCorrect:0,recent:[],addition:true,subtraction:true,adaptive:true,sound:true,timer:0,roundSize:8};
  const saved=JSON.parse(localStorage.getItem(KEY)||'null');
  let state=saved?{...defaults,...saved}:{...defaults,level:old.level||1,totalAnswered:old.totalAnswered||0,totalCorrect:old.totalCorrect||0,addition:old.addition!==false,subtraction:old.subtraction!==false,adaptive:old.adaptive!==false,timer:Number(old.timer)||0};
  let mission=null,timerId=null,locked=false,startedAt=0,answerText='',audioCtx=null;
  const $=id=>document.getElementById(id);
  const screens=['homeScreen','gameScreen','completeScreen','settingsScreen'];
  const stages=[
    {name:'Home',icon:'🏠',object:'🎒'},
    {name:'Candy Shop',icon:'🍬',object:'🍬'},
    {name:'Bus Stop',icon:'🚌',object:'🧒'},
    {name:'Park Path',icon:'🌳',object:'🌼'},
    {name:'Playground',icon:'⚽',object:'⭐'},
    {name:'Treasure',icon:'🏆',object:'🔑'}
  ];
  function save(){localStorage.setItem(KEY,JSON.stringify(state));}
  function show(id){screens.forEach(s=>$(s).classList.toggle('active',s===id));}
  function clamp(v,a,b){return Math.max(a,Math.min(b,v));}
  function randInt(a,b){return Math.floor(Math.random()*(b-a+1))+a;}
  function choice(a){return a[Math.floor(Math.random()*a.length)];}
  function levelInfo(l=state.level){return [{name:'Two-Digit Builder'},{name:'Crossing Ten'},{name:'Mixed Three-Step'}][clamp(l,1,3)-1];}
  function updateHome(){
    $('homeLevel').textContent=`Level ${state.level} · ${levelInfo().name}`;
    $('homeBadges').textContent=`🏅 ${state.totalBadges} mission${state.totalBadges===1?'':'s'}`;
    $('homeAccuracy').textContent=state.totalAnswered?`${Math.round(100*state.totalCorrect/state.totalAnswered)}% accuracy`:'No missions yet';
  }
  function ensureAudio(){if(!audioCtx){const C=window.AudioContext||window.webkitAudioContext;if(C)audioCtx=new C();}if(audioCtx?.state==='suspended')audioCtx.resume();}
  function tone(freq,duration,delay=0,type='sine',volume=.045){if(!state.sound)return;ensureAudio();if(!audioCtx)return;const now=audioCtx.currentTime+delay;const osc=audioCtx.createOscillator();const gain=audioCtx.createGain();osc.type=type;osc.frequency.setValueAtTime(freq,now);gain.gain.setValueAtTime(0,now);gain.gain.linearRampToValueAtTime(volume,now+.015);gain.gain.exponentialRampToValueAtTime(.001,now+duration);osc.connect(gain);gain.connect(audioCtx.destination);osc.start(now);osc.stop(now+duration+.03);}
  function successSound(){tone(523,.11,0,'sine',.045);tone(659,.13,.08,'sine',.045);tone(784,.16,.17,'sine',.05);}
  function retrySound(){tone(330,.12,0,'sine',.025);tone(294,.14,.08,'sine',.02);}
  function missionSound(){tone(523,.15,0,'triangle',.05);tone(659,.15,.12,'triangle',.05);tone(784,.18,.24,'triangle',.055);tone(1047,.28,.38,'triangle',.06);}

  function makeQuestion(){
    const level=clamp(state.level,1,3),allowAdd=state.addition,allowSub=state.subtraction;
    if(level===1){
      const ops=[];if(allowAdd)ops.push('+');if(allowSub)ops.push('-');if(!ops.length)ops.push('+');const op=choice(ops);
      if(op==='+'){const a=randInt(10,19),b=randInt(1,Math.min(9,20-a));return {a,b,ops:['+'],answer:a+b};}
      const a=randInt(11,20),b=randInt(1,Math.min(9,a-10));return {a,b,ops:['-'],answer:a-b};
    }
    if(level===2){
      let mode;if(allowAdd&&allowSub)mode=choice(['crossSub','inverseAdd']);else mode=allowSub?'crossSub':'inverseAdd';
      if(mode==='crossSub'){const answer=randInt(1,9),minB=Math.max(1,10-answer),maxB=Math.min(9,20-answer),b=randInt(minB,maxB),a=answer+b;return {a,b,ops:['-'],answer};}
      const a=randInt(1,9),minB=Math.max(1,10-a),b=randInt(minB,9);return {a,b,ops:['+'],answer:a+b};
    }
    let pairs=[];if(allowAdd&&allowSub)pairs=['++','+-','-+','--'];else if(allowAdd)pairs=['++'];else pairs=['--'];
    for(let tries=0;tries<250;tries++){
      const pair=choice(pairs),a=randInt(5,20),b=randInt(1,9),c=randInt(1,9);const first=pair[0]==='+'?a+b:a-b;if(first<0||first>20)continue;const answer=pair[1]==='+'?first+c:first-c;if(answer<0||answer>20)continue;return {a,b,c,ops:[pair[0],pair[1]],answer};
    }
    return {a:14,b:3,c:5,ops:['+','-'],answer:12};
  }

  function currentStageIndex(index=mission?.index||0){return Math.min(stages.length-1,Math.floor(index*(stages.length-1)/Math.max(1,state.roundSize-1)));}
  function storyFor(q,stageIndex){
    const s=stages[stageIndex],op1=q.ops[0],op2=q.ops[1];
    if(stageIndex===0){
      if(!op2){return op1==='+'?{title:'Pack the backpack',scene:'🎒',story:`Mia packed ${q.a} stickers and adds ${q.b} more.`,ask:'How many stickers are in the backpack now?',object:'⭐'}:{title:'Pack the backpack',scene:'🎒',story:`Mia has ${q.a} stickers and gives ${q.b} to a friend before leaving.`,ask:'How many stickers are left?',object:'⭐'};}
      return {title:'Pack the backpack',scene:'🎒',story:`Mia starts with ${q.a} stickers, ${op1==='+'?'adds':'gives away'} ${q.b}, then ${op2==='+'?'adds':'gives away'} ${q.c}.`,ask:'How many stickers does she have now?',object:'⭐'};
    }
    if(stageIndex===1){
      if(!op2)return op1==='+'?{title:s.name,scene:'🍬',story:`There are ${q.a} candies in Mia’s bag. The shopkeeper adds ${q.b} more.`,ask:'How many candies are there now?',object:'🍬'}:{title:s.name,scene:'🍬',story:`Mia has ${q.a} candies and shares ${q.b} with her friends.`,ask:'How many candies are left?',object:'🍬'};
      return {title:s.name,scene:'🍬',story:`Mia has ${q.a} candies, ${op1==='+'?'gets':'shares'} ${q.b}${op1==='+'?' more':''}, then ${op2==='+'?'gets':'shares'} ${q.c}${op2==='+'?' more':''}.`,ask:'How many candies does she have now?',object:'🍬'};
    }
    if(stageIndex===2){
      if(!op2)return op1==='+'?{title:s.name,scene:'🚌',story:`There are ${q.a} children on the bus. ${q.b} more get on.`,ask:'How many children are on the bus now?',object:'🧒'}:{title:s.name,scene:'🚌',story:`There are ${q.a} children on the bus. ${q.b} get off.`,ask:'How many children stay on the bus?',object:'🧒'};
      return {title:s.name,scene:'🚌',story:`The bus starts with ${q.a} children. ${q.b} ${op1==='+'?'get on':'get off'}, then ${q.c} ${op2==='+'?'get on':'get off'}.`,ask:'How many children are on the bus now?',object:'🧒'};
    }
    if(stageIndex===3){
      if(!op2)return op1==='+'?{title:s.name,scene:'🌳',story:`Mia spots ${q.a} flowers, then finds ${q.b} more along the path.`,ask:'How many flowers has she spotted?',object:'🌼'}:{title:s.name,scene:'🌳',story:`Mia collected ${q.a} flowers and gives ${q.b} to her friends.`,ask:'How many flowers does she still have?',object:'🌼'};
      return {title:s.name,scene:'🌳',story:`Mia has ${q.a} flowers, ${op1==='+'?'finds':'gives away'} ${q.b}, then ${op2==='+'?'finds':'gives away'} ${q.c}.`,ask:'How many flowers does she have now?',object:'🌼'};
    }
    if(stageIndex===4){
      if(!op2)return op1==='+'?{title:s.name,scene:'⚽',story:`Mia’s team has ${q.a} points and scores ${q.b} more.`,ask:'What is the team’s score now?',object:'⭐'}:{title:s.name,scene:'⚽',story:`Mia’s team has ${q.a} points and spends ${q.b} points on a bonus move.`,ask:'How many points remain?',object:'⭐'};
      return {title:s.name,scene:'⚽',story:`The team starts with ${q.a} points, ${op1==='+'?'scores':'uses'} ${q.b}, then ${op2==='+'?'scores':'uses'} ${q.c}.`,ask:'What is the final score?',object:'⭐'};
    }
    if(!op2)return op1==='+'?{title:s.name,scene:'🏆',story:`Mia has ${q.a} treasure keys and finds ${q.b} more.`,ask:'How many keys does she have?',object:'🔑'}:{title:s.name,scene:'🏆',story:`Mia has ${q.a} treasure keys and uses ${q.b} to open a gate.`,ask:'How many keys are left?',object:'🔑'};
    return {title:s.name,scene:'🏆',story:`Mia starts with ${q.a} keys, ${op1==='+'?'finds':'uses'} ${q.b}, then ${op2==='+'?'finds':'uses'} ${q.c}.`,ask:'How many keys does she have at the end?',object:'🔑'};
  }
  function equation(q){return q.ops.length===1?`${q.a} ${q.ops[0]==='+'?'+':'−'} ${q.b} = ?`:`${q.a} ${q.ops[0]==='+'?'+':'−'} ${q.b} ${q.ops[1]==='+'?'+':'−'} ${q.c} = ?`;}
  function renderObjects(q,obj){const count=Math.min(20,q.a);$('objects').innerHTML=Array.from({length:count},()=>`<span>${obj}</span>`).join('');}
  function renderJourney(){
    const idx=currentStageIndex();const progress=100*mission.index/state.roundSize;let html=`<div class="journey-fill" style="width:${Math.max(0,Math.min(86,progress*.86))}%"></div>`;
    html+=stages.map((s,i)=>`<div class="stop ${i<idx?'done':''} ${i===idx?'active':''}"><div class="bubble">${s.icon}</div><span>${s.name}</span></div>`).join('');$('journey').innerHTML=html;
  }
  function buildKeypad(){
    const box=$('keypad');box.innerHTML='';[1,2,3,4,5,6,7,8,9,0].forEach(n=>{const b=document.createElement('button');b.className='key';b.textContent=n;b.onclick=()=>enterDigit(n);box.appendChild(b)});
    const del=document.createElement('button');del.className='key action';del.textContent='⌫';del.onclick=backspace;box.appendChild(del);
    const go=document.createElement('button');go.className='key go';go.textContent='Check';go.onclick=checkAnswer;box.appendChild(go);
  }
  function enterDigit(n){if(locked)return;ensureAudio();if(answerText.length>=2)return;answerText+=String(n);renderAnswer();}
  function backspace(){if(locked)return;answerText=answerText.slice(0,-1);renderAnswer();}
  function renderAnswer(){const el=$('answerDisplay');el.className='answer-display'+(answerText?'':' empty');el.textContent=answerText||'Your answer';}
  function showHint(){if(!mission?.q)return;$('hint').classList.add('show');$('hintEquation').textContent=equation(mission.q);renderObjects(mission.q,mission.story.object);}
  function startMission(){clearInterval(timerId);mission={index:0,correct:0,pieces:0,attempts:0,responses:[]};locked=false;show('gameScreen');buildKeypad();nextQuestion();}
  function nextQuestion(){
    clearInterval(timerId);locked=false;answerText='';renderAnswer();$('feedback').textContent='';$('feedback').className='feedback';$('hint').classList.remove('show');
    if(mission.index>=state.roundSize){finishMission();return;}
    const q=makeQuestion(),stageIdx=currentStageIndex(mission.index),story=storyFor(q,stageIdx);mission.q=q;mission.story=story;mission.attempts=0;startedAt=performance.now();
    $('scene').textContent=story.scene;$('storyTitle').textContent=story.title;$('story').textContent=story.story;$('ask').textContent=story.ask;$('levelTag').textContent=`Level ${state.level} · ${levelInfo().name}`;
    $('progressBar').style.width=`${100*mission.index/state.roundSize}%`;$('scoreText').textContent=`🧩 ${mission.pieces}`;renderJourney();startTimer();
  }
  function startTimer(){const el=$('timer');clearInterval(timerId);if(!state.timer){el.textContent='';return;}let left=state.timer;el.textContent=`⏱ ${left}s`;el.className='timer';timerId=setInterval(()=>{left--;el.textContent=`⏱ ${left}s`;el.classList.toggle('urgent',left<=5);if(left<=0){clearInterval(timerId);handleWrong(true);}},1000);}
  function checkAnswer(){if(locked||!answerText)return;ensureAudio();const value=Number(answerText);if(value===mission.q.answer)handleCorrect();else handleWrong(false);}
  function handleCorrect(){
    if(locked)return;locked=true;clearInterval(timerId);const firstTry=mission.attempts===0;mission.correct++;mission.pieces++;state.totalCorrect++;state.totalAnswered++;state.recent.push(1);if(state.recent.length>10)state.recent.shift();mission.responses.push({correct:true,firstTry,ms:performance.now()-startedAt});save();
    const el=$('answerDisplay');el.className='answer-display good';el.textContent=mission.q.answer;$('feedback').textContent=firstTry?'Yes! The path is open!':'You got it!';$('feedback').className='feedback good';successSound();mission.index++;$('progressBar').style.width=`${100*mission.index/state.roundSize}%`;$('scoreText').textContent=`🧩 ${mission.pieces}`;setTimeout(nextQuestion,850);
  }
  function handleWrong(timedOut=false){
    if(locked)return;clearInterval(timerId);mission.attempts++;retrySound();
    if(mission.attempts===1&&!timedOut){state.totalAnswered++;state.recent.push(0);if(state.recent.length>10)state.recent.shift();save();$('answerDisplay').className='answer-display bad';$('feedback').textContent='Not quite — use the hint and try once more.';$('feedback').className='feedback bad';showHint();setTimeout(()=>{answerText='';renderAnswer();startTimer();},650);return;}
    locked=true;if(timedOut){state.totalAnswered++;state.recent.push(0);if(state.recent.length>10)state.recent.shift();save();}
    showHint();$('answerDisplay').className='answer-display bad';$('answerDisplay').textContent=mission.q.answer;$('feedback').textContent=`The answer is ${mission.q.answer}. We’ll keep moving.`;$('feedback').className='feedback bad';mission.responses.push({correct:false,ms:performance.now()-startedAt});mission.index++;setTimeout(nextQuestion,1350);
  }
  function adapt(){if(!state.adaptive||state.recent.length<8)return null;const acc=state.recent.reduce((a,b)=>a+b,0)/state.recent.length,before=state.level;if(acc>=.85&&state.level<3)state.level++;else if(acc<=.55&&state.level>1)state.level--;if(state.level!==before){state.recent=[];return state.level>before?'up':'down';}return null;}
  function finishMission(){clearInterval(timerId);state.totalBadges++;const shift=adapt();save();missionSound();let msg=`You solved ${mission.correct} of ${state.roundSize} problems without needing the answer and collected ${mission.pieces} path piece${mission.pieces===1?'':'s'}.`;
    if(shift==='up')msg+=` Next mission unlocks Level ${state.level}: ${levelInfo().name}.`;if(shift==='down')msg+=` Next mission gives a little more practice at Level ${state.level}.`;$('completeText').textContent=msg;updateHome();show('completeScreen');}
  function syncSettings(){$('soundToggle').classList.toggle('on',state.sound);$('addToggle').classList.toggle('on',state.addition);$('subToggle').classList.toggle('on',state.subtraction);$('adaptiveToggle').classList.toggle('on',state.adaptive);$('timerSelect').value=String(state.timer);$('roundSelect').value=String(state.roundSize);}
  function toggle(key,id){state[key]=!state[key];$(id).classList.toggle('on',state[key]);if(!state.addition&&!state.subtraction){state.addition=true;$('addToggle').classList.add('on');}}
  $('startBtn').onclick=startMission;$('againBtn').onclick=startMission;$('homeBtn').onclick=()=>{updateHome();show('homeScreen')};$('settingsBtn').onclick=()=>{syncSettings();show('settingsScreen')};$('hintBtn').onclick=showHint;
  $('soundToggle').onclick=()=>{toggle('sound','soundToggle');if(state.sound)successSound();};$('addToggle').onclick=()=>toggle('addition','addToggle');$('subToggle').onclick=()=>toggle('subtraction','subToggle');$('adaptiveToggle').onclick=()=>toggle('adaptive','adaptiveToggle');
  $('saveSettingsBtn').onclick=()=>{state.timer=Number($('timerSelect').value);state.roundSize=Number($('roundSelect').value);save();updateHome();show('homeScreen')};
  $('resetBtn').onclick=()=>{if(confirm('Reset all Math Quest progress?')){state={...defaults};save();syncSettings();updateHome();}};
  updateHome();
  if('serviceWorker' in navigator){window.addEventListener('load',()=>navigator.serviceWorker.register('./sw.js').catch(()=>{}));}
})();
