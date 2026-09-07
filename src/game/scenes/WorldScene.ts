import Phaser from 'phaser';
import { Actor } from '../entities/Actor';
import { InteractionSystem } from '../interactions/InteractionSystem';
import { audio,save } from '../services';
import { button,plate,text,burst,tag } from '../ui/paint';
import { openParent } from '../ui/ParentSettings';
import { earn } from '../systems/Rewards';
import type { Location } from '../../persistence/SaveStore';
export abstract class WorldScene extends Phaser.Scene {
 mia!:Actor;interactions!:InteractionSystem;protected wallet!:Phaser.GameObjects.Text;protected bubble?:Phaser.GameObjects.Container;protected actors:Actor[]=[];protected transitioning=false;
 setup(location:Location,title:string,subtitle:string){this.transitioning=false;this.actors=[];this.add.image(720,450,location.toLowerCase()).setDisplaySize(1440,900);this.interactions=new InteractionSystem(this);
  const plaque=plate(this,211,69,348,90,0xffefd0,30).setDepth(1000);plaque.add(text(this,0,-17,"MIA'S WORLD",15,'#947251'));plaque.add(text(this,0,15,title,29));
  const purse=plate(this,1200,65,149,66,0xffe2a0,28).setDepth(1000);purse.add(this.add.image(-43,0,'coin').setDisplaySize(39,39));this.wallet=text(this,15,0,String(save.data.coins),27);purse.add(this.wallet);
  button(this,1370,65,66,'',()=>openParent(this),0xffefce,'lock').setDepth(1000);
  const mute=button(this,1290,65,64,'',()=>{save.data.preferences.sound=!save.data.preferences.sound;save.data.preferences.music=save.data.preferences.sound;save.commit();audio.settings(save.data.preferences.sound,save.data.preferences.music);this.say(save.data.preferences.sound?'Sound is on':'Quiet play',undefined,1700);},0xffefd0,'sound').setDepth(1000);
  mute.setAlpha(save.data.preferences.sound?1:.65);
  const nav=plate(this,720,844,420,86,0xf9e5bd,38).setDepth(1100);const names:Location[]=['Shop','Playground','Room'];
  names.forEach((name,i)=>{const active=name===location,x=580+i*140;const c=button(this,x,839,126,'',()=>this.go(name),active?0x88b6a3:0xffefd0,name==='Shop'?'shop-icon':name==='Playground'?'park-icon':'room-icon').setDepth(1102);const icon=c.list[1]as Phaser.GameObjects.Image;icon.setPosition(0,-6).setDisplaySize(43,43);c.add(text(this,0,24,name==='Room'?'My room':name,14));});
  this.mia=new Actor(this,340,760,0,true).setDepth(80);this.actors.push(this.mia);
  this.input.on('pointerdown',(p:Phaser.Input.Pointer,objects:Phaser.GameObjects.GameObject[])=>{audio.unlock();if(objects.length===0&&p.y>540&&p.y<795){this.mia.walkTo(Phaser.Math.Clamp(p.x,90,1350),Phaser.Math.Clamp(p.y,590,780));const ring=this.add.ellipse(p.x,p.y,32,14).setStrokeStyle(3,0xfff6cf,.8);this.tweens.add({targets:ring,scale:2,alpha:0,duration:500,onComplete:()=>ring.destroy()});}});
  this.events.on('settings-changed',()=>{this.mia.equip(save.data.accessory);this.onSettings();});
  const sync=()=>{if(this.wallet?.active)this.wallet.setText(String(save.data.coins));};save.addEventListener('change',sync);this.events.once('shutdown',()=>{save.removeEventListener('change',sync);this.input.removeAllListeners();this.events.removeAllListeners('settings-changed');});
  save.data.location=location;save.commit();audio.settings(save.data.preferences.sound,save.data.preferences.music);
  this.cameras.main.fadeIn(350,255,238,209);this.say(subtitle,undefined,5000);
  // Slow drifting motes give depth without a heavy particle emitter.
  for(let i=0;i<9;i++){const p=this.add.image(150+Math.random()*1140,140+Math.random()*480,'spark').setDisplaySize(5,5).setAlpha(.3).setDepth(2);this.tweens.add({targets:p,y:p.y-60,x:p.x+30,alpha:0,duration:5000+Math.random()*5000,delay:i*550,repeat:-1,yoyo:true});}
 }
 protected onSettings(){}
 go(name:Location){if(name===this.scene.key||this.transitioning)return;this.transitioning=true;save.commit();this.cameras.main.fadeOut(260,255,238,209);this.cameras.main.once('camerafadeoutcomplete',()=>this.scene.start(name));}
 say(message:string,x=720,duration=3500){this.bubble?.destroy();const w=Math.min(850,Math.max(280,message.length*13));const c=plate(this,x,746,w,61,0xfff4dd,27).setDepth(1200);c.add(text(this,0,0,message,23));this.bubble=c;this.tweens.add({targets:c,y:738,duration:250,ease:'Back.Out'});this.time.delayedCall(duration,()=>{if(c.active)this.tweens.add({targets:c,alpha:0,y:730,duration:250,onComplete:()=>c.destroy()});});}
 reward(reason:'serve'|'learning'|'basket',x:number,y:number){const count=earn(save.data,reason);save.commit();audio.play(reason==='basket'?'coin':'success');burst(this,x,y,reason==='basket'?7:16);this.mia.celebrate();for(let i=0;i<count;i++){const coin=this.add.image(x,y,'coin').setDisplaySize(35,35).setDepth(1800);this.tweens.add({targets:coin,x:1158,y:65,scale:.3,delay:i*100,duration:700,ease:'Cubic.In',onComplete:()=>{coin.destroy();audio.play('coin');}});}return count;}
 addDecor(location:Location){for(const[id,pos]of Object.entries(save.data.placements)){if(pos.location!==location||!this.textures.exists(id))continue;const prop=this.add.image(pos.x,pos.y,id).setDisplaySize(id==='rainbow'?165:100,id==='balloon'?190:id==='plant'?145:115).setDepth(86);this.interactions.draggable(prop,`decor:${id}`,{onStart:()=>this.mia.release(),onPlace:(x,y)=>{save.data.placements[id]={x,y,location};save.commit();},bounds:new Phaser.Geom.Rectangle(90,470,1250,300),tap:()=>{if(id==='rocket'){this.tweens.add({targets:prop,y:prop.y-190,duration:600,yoyo:true,ease:'Cubic.Out'});burst(this,prop.x,prop.y,8);}else if(id==='cat'){this.say('Prrrr…',undefined,1300);this.tweens.add({targets:prop,angle:8,duration:400,yoyo:true});}else if(id==='balloon'){this.tweens.add({targets:prop,y:prop.y-70,duration:800,yoyo:true,ease:'Sine.InOut'});}else {burst(this,prop.x,prop.y,5);audio.play('place');}}});}
  this.interactions.zone({id:'mia-hands',bounds:()=>new Phaser.Geom.Rectangle(this.mia.x-75,this.mia.y-180,150,140),accepts:k=>k.startsWith('decor:'),drop:(o)=>{this.mia.hold(o as Phaser.GameObjects.Image);return true;}});
 }
 update(time:number,_delta=0){this.actors.forEach(a=>a.active&&a.tick(time));}
 snapshot(){return{scene:this.scene.key,coins:save.data.coins,served:save.data.served,goals:save.data.goals,unlocked:save.data.unlocked,placements:save.data.placements,mia:{x:this.mia.x,y:this.mia.y}};}
}
