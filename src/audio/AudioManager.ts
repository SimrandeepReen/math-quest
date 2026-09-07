export class AudioManager {
  private ctx:AudioContext|null=null;private bus:GainNode|null=null;private musicBus:GainNode|null=null;private timer:number|undefined;private next=0;private beat=0;private musicOn=true;private soundOn=true;
  constructor(){document.addEventListener('visibilitychange',()=>{if(document.hidden){void this.ctx?.suspend();}else if(this.ctx){void this.ctx.resume();this.next=this.ctx.currentTime+.12;}});}
  unlock(){if(!this.ctx){const C=window.AudioContext||(window as any).webkitAudioContext;if(!C)return;this.ctx=new C();this.bus=this.ctx!.createGain();this.musicBus=this.ctx!.createGain();this.bus.connect(this.ctx!.destination);this.musicBus.connect(this.ctx!.destination);this.next=this.ctx!.currentTime+.15;this.timer=window.setInterval(()=>this.schedule(),100);this.apply();}if(this.ctx?.state==='suspended'){void this.ctx.resume();this.next=this.ctx.currentTime+.1;}}
  settings(sound:boolean,music:boolean){this.soundOn=sound;this.musicOn=music;this.apply();}
  private apply(){if(this.ctx){this.bus?.gain.setTargetAtTime(this.soundOn?0.45:0,this.ctx.currentTime,.06);this.musicBus?.gain.setTargetAtTime(this.musicOn?0.22:0,this.ctx.currentTime,.3);}}
  private note(freq:number,time:number,length:number,volume=.15,type:OscillatorType='sine',music=false){if(!this.ctx)return;const osc=this.ctx.createOscillator(),env=this.ctx.createGain();osc.type=type;osc.frequency.value=freq;env.gain.setValueAtTime(.0001,time);env.gain.exponentialRampToValueAtTime(volume,time+.018);env.gain.exponentialRampToValueAtTime(.0001,time+length);osc.connect(env);env.connect((music?this.musicBus:this.bus)!);osc.start(time);osc.stop(time+length+.05);}
  play(name:'place'|'success'|'coin'|'retry'|'bell'|'bounce'|'open'|'bird'){this.unlock();if(!this.ctx||!this.soundOn)return;const t=this.ctx.currentTime;const notes={place:[380,520],success:[523,659,784,1047],coin:[987,1318],retry:[330,294],bell:[1175,1568],bounce:[130,95],open:[260,340],bird:[1568,1976,1760]}[name];notes.forEach((f,i)=>this.note(f,t+i*.085,name==='success'?.3:.18,.10,name==='bounce'?'sine':'triangle'));}
  private schedule(){if(!this.ctx||this.ctx.state!=='running')return;if(this.next<this.ctx.currentTime)this.next=this.ctx.currentTime+.12;
    // Original 32-beat melody, a quiet music-box lead over four soft chords.
    const melody=[72,0,76,79,0,76,74,0,72,0,69,72,0,76,0,0,71,0,74,77,0,74,72,0,67,0,71,74,0,72,0,0];
    const roots=[48,45,53,43];
    while(this.next<this.ctx.currentTime+.25){const idx=this.beat%32,n=melody[idx];if(n)this.note(440*2**((n-69)/12),this.next,.62,.12,'sine',true);if(idx%8===0){const root=roots[Math.floor(idx/8)];[0,7,16].forEach((interval,i)=>this.note(440*2**((root+interval-69)/12),this.next+i*.05,2.9,.045,'sine',true));}this.beat++;this.next+=.44;}
  }
  destroy(){clearInterval(this.timer);void this.ctx?.close();}
}
