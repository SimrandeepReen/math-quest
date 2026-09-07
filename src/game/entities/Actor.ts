import Phaser from 'phaser';
import { audio, save } from '../services';
import { burst } from '../ui/paint';
export class Actor extends Phaser.GameObjects.Container {
 private head:Phaser.GameObjects.Image;private legs:Phaser.GameObjects.Image[]=[];private arms:Phaser.GameObjects.Image[]=[];private torso:Phaser.GameObjects.Image;private accessory?:Phaser.GameObjects.Image;private walking=false;private walkTween?:Phaser.Tweens.Tween;private held?:Phaser.GameObjects.Image;
 constructor(scene:Phaser.Scene,x:number,y:number,public variant=0,public isMia=false){super(scene,x,y);scene.add.existing(this);this.add(scene.add.ellipse(0,-4,106,24,0x3c554c,.18));
  for(const pos of [-21,21]){const leg=scene.add.image(pos,-54,`leg${variant}`).setOrigin(.5,0).setDisplaySize(36,63);this.legs.push(leg);this.add(leg);}
  this.torso=scene.add.image(0,-85,`body${variant}`).setDisplaySize(83,90);this.add(this.torso);
  for(const pos of [-42,42]){const arm=scene.add.image(pos,-122,`arm${variant}`).setOrigin(.5,.1).setDisplaySize(28,76);this.arms.push(arm);this.add(arm);}
  this.head=scene.add.image(0,-174,`head${variant}`).setDisplaySize(145,135);this.add(this.head);
  this.setSize(155,245);this.setInteractive(new Phaser.Geom.Rectangle(-.5,-122.5,155,248),Phaser.Geom.Rectangle.Contains);
  this.on('pointerdown',()=>{if(isMia)this.celebrate();else{this.wave();audio.play('bird');}});
  scene.tweens.add({targets:this.head,y:-171,duration:1500+variant*130,yoyo:true,repeat:-1,ease:'Sine.InOut'});
  scene.time.addEvent({delay:3100+variant*970,loop:true,callback:()=>{if(this.active&&!this.walking){scene.tweens.add({targets:this.head,scaleY:this.head.scaleY*.96,duration:80,yoyo:true});}}});
  if(isMia)this.equip(save.data.accessory);
 }
 equip(id:string){this.accessory?.destroy();if(id==='none')return;this.accessory=this.scene.add.image(id==='bow'?-47:0,id==='bow'?-228:-244,id).setDisplaySize(id==='bow'?66:155,id==='bow'?41:85);this.add(this.accessory);}
 walkTo(x:number,y:number){this.walkTween?.stop();this.walking=true;const distance=Phaser.Math.Distance.Between(this.x,this.y,x,y);this.walkTween=this.scene.tweens.add({targets:this,x,y,duration:Math.max(200,distance*3),ease:'Sine.InOut',onComplete:()=>{this.walking=false;this.legs.forEach(l=>l.angle=0);this.arms.forEach(l=>l.angle=0);}});}
 tick(time:number){if(this.walking){this.legs.forEach((l,i)=>l.angle=Math.sin(time*.018+i*Math.PI)*18);this.arms.forEach((l,i)=>l.angle=Math.sin(time*.018+i*Math.PI)*18);this.torso.y=-85+Math.sin(time*.036)*2;}if(this.held?.active)this.held.setPosition(this.x+60,this.y-115).setDepth(this.depth+1);}
 hold(item:Phaser.GameObjects.Image){this.held=item;item.setData('held',true);this.wave();}
 release(){if(this.held)this.held.setData('held',false);this.held=undefined;}
 celebrate(){this.scene.tweens.add({targets:this,y:this.y-18,yoyo:true,duration:240,ease:'Sine.Out'});this.wave();burst(this.scene,this.x,this.y-200,6);}
 wave(){this.scene.tweens.add({targets:this.arms[1],angle:-120,duration:280,yoyo:true,repeat:1,ease:'Sine.InOut'});}
}
