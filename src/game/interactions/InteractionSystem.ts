import Phaser from 'phaser';
import { audio } from '../services';
export type Movable=Phaser.GameObjects.Image|Phaser.GameObjects.Container;
export interface DropZone {id:string;bounds:()=>Phaser.Geom.Rectangle;accepts:(kind:string)=>boolean;drop:(object:Movable,kind:string)=>boolean;highlight?:Phaser.GameObjects.Graphics}
export class InteractionSystem {
 zones:DropZone[]=[];dragging=false;
 constructor(private scene:Phaser.Scene){scene.input.dragDistanceThreshold=8;scene.events.once('shutdown',()=>{this.zones=[];});}
 zone(zone:DropZone){this.zones.push(zone);return zone;}
 draggable(object:Movable,kind:string,options:{source?:boolean;onPlace?:(x:number,y:number)=>void;onStart?:()=>void;bounds?:Phaser.Geom.Rectangle;tap?:()=>void}={}){
  if(!object.input)object.setInteractive({useHandCursor:true});this.scene.input.setDraggable(object);object.setData('kind',kind);
  let homeX=object.x,homeY=object.y,depth=object.depth,sx=object.scaleX,sy=object.scaleY,moved=false;
  object.on('pointerdown',()=>{moved=false;});
  object.on('pointerup',()=>{if(!moved)options.tap?.();});
  object.on('dragstart',()=>{homeX=object.x;homeY=object.y;depth=object.depth;sx=object.scaleX;sy=object.scaleY;moved=true;this.dragging=true;options.onStart?.();this.scene.tweens.killTweensOf(object);object.setDepth(Math.max(1400,depth+100));object.setScale(sx*1.08,sy*1.08);audio.play('place');});
  object.on('drag',(_p:Phaser.Input.Pointer,x:number,y:number)=>{object.setPosition(x,y);for(const zone of this.zones){if(zone.highlight)zone.highlight.setAlpha(zone.accepts(kind)&&zone.bounds().contains(x,y)?.7:0);}});
  object.on('dragend',(pointer:Phaser.Input.Pointer)=>{
   this.dragging=false;for(const zone of this.zones)zone.highlight?.setAlpha(0);
   const zone=[...this.zones].reverse().find(z=>z.accepts(kind)&&z.bounds().contains(pointer.x,pointer.y));
   const accepted=zone?.drop(object,kind)??false;if(!object.active)return;
   let x=object.x,y=object.y;
   if(options.source || (!accepted&&!options.onPlace)){x=homeX;y=homeY;}
   else if(options.bounds){x=Phaser.Math.Clamp(x,options.bounds.left,options.bounds.right);y=Phaser.Math.Clamp(y,options.bounds.top,options.bounds.bottom);}
   object.setDepth(depth);this.scene.tweens.add({targets:object,x,y,scaleX:sx,scaleY:sy,duration:260,ease:'Back.Out'});if(!options.source)options.onPlace?.(x,y);if(accepted)audio.play('place');
  });
  return object;
 }
}
