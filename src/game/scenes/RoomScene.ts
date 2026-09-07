import Phaser from 'phaser';
import { WorldScene } from './WorldScene';
import { button,plate,text,burst } from '../ui/paint';
import { CATALOG,purchase } from '../systems/Rewards';
import { audio,save } from '../services';
export class RoomScene extends WorldScene {
 private page=0;private shelf:Phaser.GameObjects.GameObject[]=[];private placed:Phaser.GameObjects.GameObject[]=[];private selected='';private action?:Phaser.GameObjects.Container;
 constructor(){super('Room');}
 create(){this.setup('Room','My little room','A little something to make this world yours.');this.mia.setPosition(362,755);this.shelf=[];this.placed=[];this.selected='';
  const plaque=plate(this,969,268,365,79,0xe5bd84,27).setDepth(19);plaque.add(text(this,0,-12,'The little collection',27,'#685846'));plaque.add(text(this,0,19,'earn · choose · play',17,'#806743'));
  this.drawShelf();this.drawProps();
  button(this,649,451,62,'‹',()=>{this.page=(this.page+2)%3;this.drawShelf();},0xf5dfb6).setDepth(28);button(this,1322,451,62,'›',()=>{this.page=(this.page+1)%3;this.drawShelf();},0xf5dfb6).setDepth(28);
  const flower=this.add.image(405,361,'flower').setDisplaySize(64,64).setDepth(8).setInteractive();flower.on('pointerup',()=>{audio.play('bird');this.tweens.add({targets:flower,angle:flower.angle+180,duration:800,ease:'Sine.InOut'});});
  const bed=this.add.zone(130,508,200,210).setDepth(6).setInteractive();bed.on('pointerup',()=>{this.mia.walkTo(220,667);this.time.delayedCall(850,()=>{this.mia.celebrate();this.say('Boing! A pillow-cloud landing.',undefined,2000);audio.play('bounce');});});
  if(!save.data.onboarded){save.data.onboarded=true;save.commit();this.say('A welcome purse: 8 coins. Pick your first treasure!',undefined,5500);}
 }
 private drawShelf(){this.shelf.forEach(o=>o.destroy());this.shelf=[];
  CATALOG.slice(this.page*3,this.page*3+3).forEach((item,i)=>{const x=766+i*188,owned=save.data.unlocked.includes(item.id);const image=this.add.image(x,424,item.id==='mint'?'scoop-mint':item.id).setDisplaySize(item.id==='rainbow'?121:96,item.id==='plant'||item.id==='balloon'?128:108).setDepth(25).setInteractive({useHandCursor:true});image.on('pointerup',()=>this.choose(item.id));this.shelf.push(image);
   const name=text(this,x,506,item.label,19).setDepth(27);this.shelf.push(name);
   const control=button(this,x,559,160,owned?'Yours':`${item.cost} coins`,()=>this.choose(item.id),owned?0xb9cfac:0xffe1a8,owned?undefined:'coin').setDepth(29);this.shelf.push(control);
  });
 }
 private choose(id:string){const result=purchase(save.data,id);if(result==='funds'){this.say('Make ice cream or shoot hoops to collect more coins.');audio.play('retry');return;}if(result==='unknown')return;
  this.selected=id;save.commit();const item=CATALOG.find(i=>i.id===id)!;
  if(result==='bought'){audio.play('success');burst(this,963,432,16);this.say(`${item.label}! It's yours to play with.`);this.drawProps();}
  if(item.kind==='accessory'){save.data.accessory=save.data.accessory===id&&result==='owned'?'none':id;this.mia.equip(save.data.accessory);save.commit();this.say(save.data.accessory==='none'?'A fresh look.':`${item.label} suits you, Mia!`);}
  if(item.kind==='flavour')this.say('Mint is waiting in the ice-cream shop.');
  this.action?.destroy();if(item.kind==='decoration'||item.kind==='toy'){this.action=button(this,1025,773,305,'Take it to the shop',()=>{save.data.placements[id]={x:id==='balloon'?1140:468,y:id==='balloon'?614:649,location:'Shop'};save.commit();this.go('Shop');},0xb0c7a2).setDepth(1201);}
  this.drawShelf();
 }
 private drawProps(){this.placed.forEach(o=>o.destroy());this.placed=[];this.interactions.zones=[];
  const before=new Set(this.children.list);this.addDecor('Room');this.placed=this.children.list.filter(o=>!before.has(o));
 }
 protected onSettings(){this.drawShelf();this.drawProps();}
 snapshot(){return{...super.snapshot(),catalogPage:this.page,selected:this.selected};}
}
