import {g,W,H,C,setContext,initPlate,background,chapter,title,txt,rect,smooth} from './core.js';
import {drawRecipe,setCarry} from './recipes.js';
const canvas=document.querySelector('canvas');setContext(canvas.getContext('2d',{alpha:false}));
let film;
function caption(text){
 // Actual glyph layout, shared by the trace and the burned-in pixels.
 g.font='500 38px FilmSans';const lines=[],limit=1530;let row='';
 for(const char of text){if(g.measureText(row+char).width>limit){lines.push(row);row=char}else row+=char;}if(row)lines.push(row);
 if(lines.length>2)throw new Error('Caption exceeds two lines; split the authored cue');
 rect(150,924,1620,128,null,'#101918ef');lines.forEach((s,i)=>txt(s,960,lines.length===1?1003:975+i*49,38,C.ink,'center','sans'));
 return {text,visible:true,lines};
}
window.renderFrame=(t,{captions=true,subjectOnly=false}={})=>{
 t=Math.min(Math.max(0,t),film.duration-1/film.fps);
 const i=film.shots.findIndex(s=>t>=s.start&&t<s.end),s=film.shots[i];if(!s)throw new Error('Uncovered frame '+t);
 g.setTransform(1,0,0,1,0,0);g.globalAlpha=1;g.clearRect(0,0,W,H);
 setCarry();
 if(i>0&&s.transition.mode==='carry'&&t<s.start+s.transition.seconds){
  g.save();g.beginPath();g.rect(0,0,0,0);g.clip();const prev=drawRecipe(film.shots[i-1],s.start-1/film.fps);g.restore();
  setCarry(prev.objects,smooth((t-s.start)/s.transition.seconds));
 }
 if(subjectOnly){rect(0,0,W,H,null,'#000');}else{
  background(t,s.surface==='paper',.40);chapter(i+1,s.label,s.surface==='paper');title(s.headline,1,0,s.surface==='paper',66,174);
  txt(film.title,1828,71,20,s.surface==='paper'?C.goldDark:C.gold,'right','sans');
 }
 const state=drawRecipe(s,t);
 let cap={text:'',visible:false};const sub=film.subtitles.find(c=>c.start<=t&&t<c.end);
 if(sub&&captions&&!subjectOnly)cap=caption(sub.text);
 window.lastFrame={frame:Math.round(t*film.fps),time:t,shot:s.id,recipe:s.recipe,progress:state.progress,objects:state.objects,...cap};
 return window.lastFrame;
};
try{
 const r=await fetch('film.compiled.json');if(!r.ok)throw new Error('Run cinema.py compile before preview');film=await r.json();
 await Promise.all([document.fonts.load('500 38px FilmSans'),document.fonts.load('500 66px FilmSerif'),initPlate()]);
 window.meta=film;window.renderFrame(0);window.ready=true;
}catch(e){window.bootError=String(e);throw e;}
