import {timing} from './timing.js';
import {W,H,setContext,clamp} from './core.js';
import {initPlate} from './core.js';
import {opening,rate,distribution,zero} from './scenes-a.js';
import {comparison,proof,cumulative} from './scenes-b.js';
import {investment,ending} from './scenes-c.js';
const canvas=document.getElementById('film'),ctx=canvas.getContext('2d',{alpha:false});
const scenes=[opening,rate,distribution,zero,comparison,proof,cumulative,investment,ending];
const plannedStarts=[0,6,16,28,39,52,65,73,83,90];
const knots=[{time:0,planned:0},...timing.events,{time:90,planned:90}].sort((a,b)=>a.time-b.time);
function planTime(t){let i=0;while(i<knots.length-2&&t>=knots[i+1].time)i++;const a=knots[i],b=knots[i+1];return a.planned+(b.planned-a.planned)*clamp((t-a.time)/(b.time-a.time))}
window.renderFrame=t=>{
 t=clamp(t,0,89.99999);let s=0;while(s<8&&t>=timing.cuts[s+1])s++;
 const local=clamp(planTime(t)-plannedStarts[s],0,plannedStarts[s+1]-plannedStarts[s]);
 setContext(ctx);ctx.setTransform(1,0,0,1,0,0);ctx.globalAlpha=1;ctx.shadowBlur=0;ctx.setLineDash([]);scenes[s](local,t);
 const fade=t<.13?1-t/.13:t>89.57?(t-89.57)/.43:0;
 if(fade>0){ctx.fillStyle='rgba(7,9,9,'+clamp(fade)+')';ctx.fillRect(0,0,W,H)}
 window.currentFrameInfo={t,scene:s+1,local,planned:planTime(t)};
};
await Promise.all([document.fonts.load('500 70px FilmSerif'),document.fonts.load('450 30px FilmSans'),initPlate()]);
await document.fonts.ready;
window.ready=true;
window.meta={duration:90,width:W,height:H,fps:30,cuts:timing.cuts,actionCount:53,voice:'no added narration'};
window.renderFrame(0);
