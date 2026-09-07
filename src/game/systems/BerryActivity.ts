import Phaser from 'phaser';
import type { Challenge } from '../../learning/types';
import { evaluate } from '../../learning/generators';
import { InteractionSystem } from '../interactions/InteractionSystem';
import { audio,learning,save } from '../services';
import { button,plate,text,burst } from '../ui/paint';
import type { WorldScene } from '../scenes/WorldScene';
export class BerryActivity {
 private objects:Phaser.GameObjects.GameObject[]=[];private berries:Phaser.GameObjects.Image[]=[];private supply:Phaser.GameObjects.Image[]=[];private count:number;private step=0;private phase:'move'|'count'='move';private retries=0;private hints=0;private started:number;private dial=0;private instruction!:Phaser.GameObjects.Text;private counter!:Phaser.GameObjects.Text;private dialRoot?:Phaser.GameObjects.Container;private live=true;private interactions:InteractionSystem;private previousTopOnly:boolean;
 constructor(private scene:WorldScene,private challenge:Challenge,private done:(ok:boolean)=>void){this.count=challenge.start;this.started=Date.now();this.interactions=new InteractionSystem(scene);this.previousTopOnly=scene.input.topOnly;
  const shade=scene.add.rectangle(720,450,1440,900,0x244c47,.58).setDepth(2000).setInteractive();this.keep(shade);
  const board=plate(scene,720,455,1200,683,0xd3ac78,38).setDepth(2001);this.keep(board);
  const inlay=scene.add.graphics().setDepth(2002);inlay.lineStyle(3,0xf1d3a0,.8).strokeRoundedRect(142,139,1156,626,28);for(let y=184;y<750;y+=96)inlay.lineStyle(2,0xa47d52,.16).lineBetween(150,y,1288,y);this.keep(inlay);
  this.keep(text(scene,720,167,'A little berry picnic',32).setDepth(2003));
  this.instruction=text(scene,720,229,'',29).setDepth(2003);this.keep(this.instruction);
  this.keep(scene.add.image(844,533,'tray').setDisplaySize(600,268).setDepth(2003));this.keep(scene.add.image(364,508,'tray').setDisplaySize(320,186).setDepth(2003));
  this.keep(text(scene,354,622,'Pantry',22).setDepth(2003));this.keep(text(scene,844,658,'Picnic bowl',22).setDepth(2003));
  this.counter=text(scene,720,700,'',22).setDepth(2003);this.keep(this.counter);
  this.keep(button(scene,1210,175,70,'×',()=>this.finish(false),0xf7dfb7).setDepth(2004));
  this.keep(button(scene,248,699,155,'Show me',()=>this.hint(),0xf6d89c,'help').setDepth(2004));
  this.keep(button(scene,1146,700,170,'Ready',()=>this.check(),0xa8c6a4,'bell').setDepth(2004));
  this.interactions.zone({id:'picnic',bounds:()=>new Phaser.Geom.Rectangle(560,320,560,290),accepts:k=>k==='supply',drop:()=>{if(this.phase!=='move')return false;if(this.count<20){this.count++;this.renderBerries();return true;}return false;}});
  this.interactions.zone({id:'pantry',bounds:()=>new Phaser.Geom.Rectangle(194,330,320,280),accepts:k=>k==='bowl',drop:()=>{if(this.phase!=='move')return false;if(this.count>0){this.count--;this.renderBerries();return true;}return false;}});
  this.renderBerries();this.prompt();
 }
 private keep<T extends Phaser.GameObjects.GameObject>(o:T){this.objects.push(o);return o;}
 private prompt(){if(this.challenge.inverse)this.instruction.setText(`There are ${this.challenge.start}. Make ${this.challenge.answer} berries.`);else{const s=this.challenge.steps[this.step];this.instruction.setText(`${this.step===0?'There are '+this.challenge.start+'. ':''}${s.op==='+'?'Add':'Take away'} ${s.amount} berries.`);}
  this.counter.setText('Drag berries between the pantry and the bowl.');}
 private renderBerries(){this.berries.forEach(b=>b.destroy());this.supply.forEach(b=>b.destroy());this.berries=[];this.supply=[];
  for(let i=0;i<this.count;i++){const x=624+(i%5)*91+(Math.floor(i/5)%2)*8,y=360+Math.floor(i/5)*52;const b=this.scene.add.image(x,y,'berry').setDisplaySize(49,54).setDepth(2010);this.keep(b);this.berries.push(b);this.interactions.draggable(b,'bowl',{source:true,tap:()=>{if(this.phase==='move'&&this.count>0){this.count--;this.renderBerries();audio.play('place');}}});}
  for(let i=0;i<6;i++){const b=this.scene.add.image(270+(i%3)*79,407+Math.floor(i/3)*66,'berry').setDisplaySize(53,58).setDepth(2010);this.keep(b);this.supply.push(b);this.interactions.draggable(b,'supply',{source:true,tap:()=>{if(this.phase==='move'&&this.count<20){this.count++;this.renderBerries();audio.play('place');}}});}
 }
 private expected(){return this.challenge.inverse?this.challenge.answer:evaluate(this.challenge.start,this.challenge.steps.slice(0,this.step+1));}
 private check(){if(!this.live)return;
  if(this.phase==='move'){
   if(this.count!==this.expected()){this.retries++;this.counter.setText('Look at the berries. You can move some back.');audio.play('retry');this.scene.tweens.add({targets:this.berries,alpha:.6,duration:300,yoyo:true});return;}
   audio.play('success');burst(this.scene,850,467,8);
   if(!this.challenge.inverse&&this.step<this.challenge.steps.length-1){this.step++;this.prompt();return;}
   if(this.challenge.inverse){this.complete();return;}
   this.phase='count';this.instruction.setText('How many berries are in the bowl?');this.counter.setText('Turn the picnic label, then ring the bell.');
   this.dialRoot=plate(this.scene,843,632,248,67,0xffe7b7,24).setDepth(2014);this.keep(this.dialRoot);const number=text(this.scene,0,0,'0',35);this.dialRoot.add(number);
   for(const[sign,dx]of [['−',-91],['+',91]] as const){const b=button(this.scene,843+dx,632,60,sign,()=>{this.dial=Phaser.Math.Clamp(this.dial+(sign==='+'?1:-1),0,20);number.setText(String(this.dial));audio.play('place');},0xf4d292).setDepth(2015);this.keep(b);}
   return;
  }
  if(this.dial!==this.challenge.answer){this.retries++;this.counter.setText('Count the berries. Take your time.');audio.play('retry');return;}
  this.complete();
 }
 private hint(){this.hints++;audio.play('place');if(this.phase==='move'){const difference=this.expected()-this.count;this.counter.setText(difference===0?'The bowl is ready. Ring the bell.':`${difference>0?'Move':'Take'} ${Math.abs(difference)} ${difference>0?'more into':'out of'} the bowl.`);}else{this.counter.setText('Touch and count each berry.');this.berries.forEach((b,i)=>{this.scene.time.delayedCall(i*400,()=>{if(this.live&&b.active){const label=text(this.scene,b.x,b.y-39,String(i+1),25).setDepth(2020);this.keep(label);this.scene.tweens.add({targets:b,angle:10,duration:160,yoyo:true});}});});}}
 private complete(){learning().record(this.challenge.skill,{firstTry:this.retries===0&&this.hints===0,retries:this.retries,hints:this.hints,seconds:(Date.now()-this.started)/1000});save.commit();this.finish(true);}
 private finish(ok:boolean){if(!this.live)return;this.destroy();this.done(ok);}
 destroy(){this.live=false;this.objects.forEach(o=>{if(o.active)o.destroy();});this.objects=[];this.interactions.zones=[];this.scene.input.topOnly=this.previousTopOnly;}
 snapshot(){return{challenge:this.challenge,count:this.count,step:this.step,phase:this.phase,dial:this.dial,retries:this.retries,hints:this.hints};}
}
