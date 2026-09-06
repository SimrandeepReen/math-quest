import Phaser from 'phaser';
import { WorldScene } from './WorldScene';
import { button,plate,text,burst,pop } from '../ui/paint';
import { audio,save } from '../services';
import { launch,advance,scored,type BallState } from '../systems/BasketPhysics';
export class PlaygroundScene extends WorldScene {
 private ball!:Phaser.GameObjects.Image;private shadow!:Phaser.GameObjects.Ellipse;private aim!:Phaser.GameObjects.Graphics;private flight:BallState|null=null;private origin={x:620,y:700};private hoop={x:1110,y:398};private previous!:BallState;private draggingBall=false;private scoredShot=false;private flightTime=0;private score=0;private goal=3;private scoreText!:Phaser.GameObjects.Text;private targetText!:Phaser.GameObjects.Text;private activeRound=false;private dx=0;private dy=0;private floorBounces=0;
 constructor(){super('Playground');}
 create(){this.setup('Playground','Sunny-side Park','Swipe the ball up toward the hoop.');this.mia.setPosition(355,731);this.score=0;this.activeRound=false;this.flight=null;this.draggingBall=false;this.goal=3+save.data.goals%3;
  const board=plate(this,762,179,306,150,0x4e7e70,29).setDepth(20);board.add(text(this,0,-43,'BASKETS',18,'#ffefc5'));this.scoreText=text(this,0,10,'0',65,'#fff2d0');board.add(this.scoreText);this.targetText=text(this,762,282,`Let's make ${this.goal} baskets`,23).setDepth(20);
  const hoop=this.add.image(1110,448,'hoop').setDisplaySize(300,460).setDepth(35); // Rim is 178 px below the 218 px top edge.
  this.hoop={x:1110,y:396};
  this.shadow=this.add.ellipse(this.origin.x,750,95,22,0x254e48,.22).setDepth(25);this.ball=this.add.image(this.origin.x,this.origin.y,'ball').setDisplaySize(106,106).setDepth(60).setInteractive(new Phaser.Geom.Circle(60,60,75),Phaser.Geom.Circle.Contains);
  this.aim=this.add.graphics().setDepth(50);
  this.ball.on('pointerdown',(p:Phaser.Input.Pointer)=>{if(this.flight)return;this.draggingBall=true;this.dx=p.x-this.origin.x;this.dy=p.y-this.origin.y;this.activeRound=true;this.say('Aim with the dots. Let go to throw!',undefined,2200);});
  this.input.on('pointermove',(p:Phaser.Input.Pointer)=>{if(!this.draggingBall)return;this.dx=p.x-this.origin.x;this.dy=p.y-this.origin.y;this.preview();});
  this.input.on('pointerup',()=>{if(!this.draggingBall)return;this.draggingBall=false;this.aim.clear();if(Math.abs(this.dx)+Math.abs(this.dy)<35){pop(this,this.ball);audio.play('bounce');return;}this.flight=this.aimedLaunch();this.flightTime=0;this.scoredShot=false;this.floorBounces=0;});
  button(this,724,779,200,'New challenge',()=>{this.score=0;this.goal=3+Math.floor(Math.random()*3);this.scoreText.setText('0');this.targetText.setText(`Let's make ${this.goal} baskets`);this.resetBall();this.activeRound=true;this.say('Your court. Your pace.');},0xf5d3a0).setDepth(90);
  // A small, repeatable visual demonstration teaches the gesture without a text screen.
  const hand=this.add.image(620,700,'hand').setDisplaySize(67,67).setDepth(63);this.tweens.add({targets:hand,x:690,y:505,duration:1300,hold:400,repeat:2,repeatDelay:400,onComplete:()=>hand.destroy()});this.ball.once('pointerdown',()=>hand.destroy());
  this.addDecor('Playground');
  const balloon=this.add.image(200,327,'balloon').setDisplaySize(77,146).setDepth(26);this.interactions.draggable(balloon,'park-toy',{onPlace:()=>{},bounds:new Phaser.Geom.Rectangle(80,150,340,510),tap:()=>{this.tweens.add({targets:balloon,y:balloon.y-100,duration:600,yoyo:true});audio.play('bird');}});
  const slide=this.add.zone(136,356,155,224).setDepth(10).setInteractive();slide.on('pointerup',()=>{this.mia.walkTo(143,632);this.time.delayedCall(850,()=>{this.tweens.add({targets:this.mia,x:200,y:524,duration:650,yoyo:true,onComplete:()=>this.mia.celebrate()});audio.play('success');});});
  hoop.setInteractive().on('pointerup',()=>{this.tweens.add({targets:hoop,angle:2,duration:180,yoyo:true});audio.play('bell');});
 }
 private aimedLaunch(){const ball=launch(this.origin.x,this.origin.y,this.dx,this.dy);const disc=ball.vy*ball.vy-2*820*(this.origin.y-this.hoop.y);
  // Modest rim assist only for already-close trajectories; wide misses stay physical.
  if(disc>=0&&ball.vx>0){const t=(-ball.vy+Math.sqrt(disc))/820;const end=ball.x+ball.vx*t;if(Math.abs(end-this.hoop.x)<95)ball.vx+=(this.hoop.x-end)/t*.72;}
  return ball;
 }
 private preview(){this.aim.clear();const sim=this.aimedLaunch();for(let i=0;i<30;i++){advance(sim,.055);if(sim.y>780)break;this.aim.fillStyle(0xfff7d7,1-i/36).fillCircle(sim.x,sim.y,Math.max(3,6-i*.12));}this.ball.setAngle(this.dx*.07);}
 private resetBall(){this.flight=null;this.draggingBall=false;this.aim.clear();this.ball.setPosition(this.origin.x,this.origin.y).setAngle(0).setDisplaySize(106,106);this.shadow.setPosition(this.origin.x,750).setScale(1);}
 update(time:number,delta:number){super.update(time);if(!this.flight)return;const ball=this.flight;let remaining=Math.min(delta/1000,.05);while(remaining>0){const dt=Math.min(remaining,1/120);remaining-=dt;this.previous={...ball};advance(ball,dt);
   if(!this.scoredShot&&scored(this.previous,ball,this.hoop.x,this.hoop.y)){this.scoredShot=true;this.score++;this.scoreText.setText(String(this.score));pop(this,this.scoreText);this.reward('basket',this.hoop.x,this.hoop.y);if(this.score>=this.goal){this.goal=this.score+3+Math.floor(Math.random()*3);this.targetText.setText(`Lovely! Next picnic goal: ${this.goal}`);this.say('Swish! Your world has a new coin.');burst(this,760,180,14);}}
   if(ball.y>742&&ball.vy>0){ball.y=742;ball.vy*=-.56;ball.vx*=.72;this.floorBounces++;audio.play('bounce');}
  }
  this.flightTime+=delta;this.ball.setPosition(ball.x,ball.y);this.ball.angle+=ball.vx*delta*.0003;this.shadow.setPosition(Phaser.Math.Clamp(ball.x,40,1400),750).setScale(Phaser.Math.Clamp(1-(742-ball.y)/1000,.25,1));
  if(this.flightTime>4600||ball.x>1500||ball.x< -100||this.floorBounces>=3){if(!this.scoredShot)this.say('Another toss? Follow the dots.',undefined,1700);this.resetBall();}
 }
 snapshot(){return{...super.snapshot(),miniGame:'basketball',activeRound:this.activeRound,score:this.score,target:this.goal,ball:{x:this.ball.x,y:this.ball.y},flying:!!this.flight};}
}
