import Phaser from 'phaser';
import './styles.css';
import { save,audio } from './game/services';
import { BootScene } from './game/scenes/BootScene';
import { ShopScene } from './game/scenes/ShopScene';
import { PlaygroundScene } from './game/scenes/PlaygroundScene';
import { RoomScene } from './game/scenes/RoomScene';
import { registerUpdates } from './updates';
import type { WorldScene } from './game/scenes/WorldScene';
async function start(){
await save.open();
const game=new Phaser.Game({type:Phaser.AUTO,parent:'game',width:1440,height:900,backgroundColor:'#244f50',transparent:false,antialias:true,roundPixels:false,powerPreference:'low-power',scale:{mode:Phaser.Scale.FIT,autoCenter:Phaser.Scale.CENTER_BOTH,width:1440,height:900},input:{activePointers:3,touch:{capture:true}},fps:{target:60,smoothStep:true},scene:[BootScene,ShopScene,PlaygroundScene,RoomScene],audio:{noAudio:true}});
let portraitDismissed=false;
const orientation=()=>{document.getElementById('rotate')!.hidden=window.innerWidth>=window.innerHeight||portraitDismissed;game.scale.refresh();};window.addEventListener('resize',orientation);document.getElementById('play-portrait')!.addEventListener('click',()=>{portraitDismissed=true;orientation();});orientation();
const warning=()=>{if(!save.warning)return;const box=document.getElementById('save-warning')!;box.hidden=false;box.textContent=save.warning;};save.addEventListener('warning',warning);warning();
window.addEventListener('pagehide',()=>save.commit());document.addEventListener('visibilitychange',()=>{if(document.hidden)save.commit();});
audio.settings(save.data.preferences.sound,save.data.preferences.music);
registerUpdates(()=>save.flush());
// Read-only test seam. Input remains real pointer/touch gestures, never game-state mutation.
if(new URLSearchParams(location.search).has('qa'))Object.defineProperty(window,'__MIA_QA__',{value:{snapshot:()=>{const scene=game.scene.getScenes(true).find(s=>s.scene.key!=='Boot') as WorldScene|undefined;return scene?.snapshot()||{scene:'Boot'};},version:'5.0.0'},writable:false});

}
void start().catch(error=>{console.error(error);const p=document.querySelector("#loading p");if(p)p.textContent="The world could not open. Please reconnect and try again.";});
