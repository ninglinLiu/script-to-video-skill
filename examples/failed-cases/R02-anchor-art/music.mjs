// Original 60-second score using the reference repository's MIT synthesis tools.
// Generates files only. This script never opens an audio playback device.
import fs from 'node:fs';
import {SR,setSeed,mixInto,mtof,pluck,reverb,encodeWav} from './vendor/audio/synth.mjs';
import {pad,mbox,tick,swell,boom,CH} from './vendor/audio/score.mjs';
import {readWavMono,voiceEnvelope,applyDuck} from './vendor/audio/bgm.mjs';
setSeed(261021);
const timeline=JSON.parse(fs.readFileSync('assets/timeline-anchor.json','utf8'));
const at=text=>timeline.cues.find(c=>c.text===text).start;
const release=at('试着把旧价签拿走'),ending=at('先看东西，再看数字');
const n=SR*60,music=new Float32Array(n),fx=new Float32Array(n),events=[];
const beat=.625;
const sections=[
  [0,11.0875,['Dm','F','C','A'],.74],
  [11.0875,27.925,['Dm','Dsus','Bb','A'],.52],
  [27.925,release,['Bb','A'],.46],
  [release,ending,['Dadd9','G','Bm','A'],.8],
  [ending,60,['Dadd9'],.82]
];
for(const [start,end,chords,energy] of sections){
  let bar=0;
  for(let t=start;t<end-.2;t+=beat*6,bar++){
    const notes=CH[chords[bar%chords.length]],dur=Math.min(beat*6+1.2,60-t);
    mixInto(music,pad(notes,dur,{atk:.65,rel:1.25,cut:780,det:.002}),t,.23*energy);
    for(let k=0;k<6;k++){
      const nt=t+k*beat;if(nt>=end-.15)break;
      const midi=notes[[0,2,3,1,2,3][k]]+12;
      mixInto(music,pluck(mtof(midi),1.35,.17),nt,.13*energy*(k===0?1:.62));
      if(k===1||k===4)mixInto(music,mbox(midi+12,1.8),nt,.032*energy);
    }
  }
}
// A small descending motif becomes an ascending resolution after the old tag leaves.
for(const [start,notes] of [[.2,[81,77,74]],[9.75,[84,81,77]],[release+.2,[74,78,81]],[ending+.2,[78,81,86]]]){
  notes.forEach((m,k)=>mixInto(music,mbox(m,2.4),start+k*.32,.055));
}
const add=(time,name,buf,gain)=>{mixInto(fx,buf,time,gain);events.push({time,name,gain});};
add(at('现在只要一百九十九'),'现价落点：轻木响',tick(false),.16);
add(at('赚了三百'),'发现折扣：短铃',mbox(86,.8),.065);
add(at('那个先出现的数字')-.65,'价签扩张：低频气流',swell(1.25,{from:140,to:1300}),.065);
add(at('这就是锚定效应'),'参照形成：柔和低音',boom(.9,93,55),.065);
for(let t=at('判断围着第一个参照转'),k=0;t<27.5;t+=1.25,k++)add(t,'参照摆动：钟表',tick(k%2===0),.07);
add(release-.45,'旧价签移走：纸张掠过',swell(.65,{from:500,to:2800}),.1);
add(release+.18,'空间松开：透明音',mbox(86,1.6),.055);
add(at('看看布料和做工')-.3,'细节推近：柔软气流',swell(.45,{from:180,to:900}),.045);
add(at('比较同类商品的价格'),'比较对象落位',tick(false),.11);
add(ending,'结句：和弦落点',mbox(74,2.8),.05);
const wet=reverb(music,.25,.72),wetFx=reverb(fx,.12,.58);
let acc=0;for(const v of wet)acc+=v*v;
const gain=.043/Math.sqrt(acc/n);
for(let i=0;i<n;i++){
  const t=i/SR,fade=Math.min(1,t/.5,(60-t)/1.7);
  // A brief breath before removal makes the visual release audible without a loud impact.
  const breath=t>release-.22&&t<release?.25:1;
  wet[i]*=gain*fade*breath;wetFx[i]*=Math.min(1,(60-t)/1.5);
}
const voice=readWavMono(fs.readFileSync('assets/voice-mix.wav'));
applyDuck(wet,voiceEnvelope(voice.samples,voice.sr),.62);
fs.writeFileSync('assets/music-original.wav',encodeWav(wet,SR));
fs.writeFileSync('assets/sound-design.wav',encodeWav(wetFx,SR));
fs.writeFileSync('source/music-cues.json',JSON.stringify({tempo:96,meter:'6/8-like six-beat phrase',duration:60,sections,events,originalComposition:true,engine:'weilanx synth + score + bgm, MIT',previewPlayback:'never'},null,2));
console.log(JSON.stringify({duration:60,sampleRate:SR,sfxEvents:events.length,musicPeak:Math.max(...wet.filter((_,i)=>i%100===0))}));
