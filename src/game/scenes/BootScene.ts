import Phaser from 'phaser';
import { ASSET_KEYS } from '../assets';
import { save } from '../services';
export class BootScene extends Phaser.Scene {
 constructor(){super('Boot');}
 preload(){const base=import.meta.env.BASE_URL;this.load.on('progress',(value:number)=>{const bar=document.querySelector('progress');if(bar)bar.value=value;});
  for(const key of ASSET_KEYS)this.load.svg(key,`${base}assets/${key}.svg`);
  for(const key of ['shop','playground','room'])this.load.image(key,`${base}assets/${key}.webp`);
  this.load.on('loaderror',(file:Phaser.Loader.File)=>{console.error('Asset failed:',file.key);const status=document.querySelector('#loading p');if(status)status.textContent='A little hiccup loading the world. Try reopening when online.';});
 }
 create(){const loading=document.getElementById('loading');if(loading)loading.remove();this.scene.start(save.data.location);}
}
