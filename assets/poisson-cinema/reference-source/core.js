import {timing} from './timing.js';
export const W=1920,H=1080;
export const C={bg:'#0b0e0f',ink:'#eee7d5',gold:'#d5b371',dim:'#85887f',red:'#bd493d',paper:'#eee8da',dark:'#202924',goldDark:'#937240'};
export const clamp=(x,a=0,b=1)=>Math.max(a,Math.min(b,x));
export const mix=(a,b,t)=>a+(b-a)*t;
export const smooth=x=>{x=clamp(x);return x*x*(3-2*x)};
export const ease=x=>1-Math.pow(1-clamp(x),3);
export const out=(t,a,b)=>ease((t-a)/(b-a));
export const range=(t,a,b)=>smooth((t-a)/(b-a));
export const hash=n=>{let x=Math.sin(n*127.1+311.7)*43758.5453;return x-Math.floor(x)};
export const TAU=Math.PI*2;
export let g;
export const setContext=c=>g=c;
export function alpha(a,fn){if(a<=.0001)return;g.save();g.globalAlpha*=clamp(a);fn();g.restore()}
export function line(x1,y1,x2,y2,color=C.gold,width=1.5,a=1){g.save();g.globalAlpha*=a;g.strokeStyle=color;g.lineWidth=width;g.beginPath();g.moveTo(x1,y1);g.lineTo(x2,y2);g.stroke();g.restore()}
export function poly(points,color=C.gold,width=1.5,fill=null,close=false){g.beginPath();points.forEach((p,i)=>i?g.lineTo(...p):g.moveTo(...p));if(close)g.closePath();if(fill){g.fillStyle=fill;g.fill()}if(color){g.strokeStyle=color;g.lineWidth=width;g.stroke()}}
export function rect(x,y,w,h,stroke=C.gold,fill=null,width=1.5){if(fill){g.fillStyle=fill;g.fillRect(x,y,w,h)}if(stroke){g.strokeStyle=stroke;g.lineWidth=width;g.strokeRect(x,y,w,h)}}
export function circle(x,y,r,color=C.gold,width=1.5,fill=null){g.beginPath();g.arc(x,y,r,0,TAU);if(fill){g.fillStyle=fill;g.fill()}if(color){g.strokeStyle=color;g.lineWidth=width;g.stroke()}}
const glowCache={};
function sprite(color){if(glowCache[color])return glowCache[color];const c=document.createElement('canvas');c.width=c.height=64;const q=c.getContext('2d');const grad=q.createRadialGradient(32,32,0,32,32,32);grad.addColorStop(0,'#fff2d8');grad.addColorStop(.12,color);grad.addColorStop(.36,color+'55');grad.addColorStop(1,color+'00');q.fillStyle=grad;q.fillRect(0,0,64,64);glowCache[color]=c;return c}
export function dot(x,y,r=3,color=C.gold,glow=true){if(glow)g.drawImage(sprite(color),x-r*4,y-r*4,r*8,r*8);circle(x,y,r,null,0,color)}
export function txt(s,x,y,size=40,color=C.ink,align='left',font='serif',weight=500,maxWidth=null){
 g.font=weight+' '+size+'px '+(font==='math'?'"Cambria Math",Cambria,"Times New Roman"':font==='sans'?'FilmSans,sans-serif':'FilmSerif,serif');g.textAlign=align;g.textBaseline='alphabetic';g.fillStyle=color;
 if(maxWidth)g.fillText(s,x,y,maxWidth);else g.fillText(s,x,y);
}
export function textIn(s,x,y,size,t,start,color=C.ink,align='left',font='serif'){
 const u=out(t,start,start+.4);alpha(u,()=>txt(s,x,y+18*(1-u),size,color,align,font));
}
export function caption(s,t,start=0,light=false){
 const u=out(t,start,start+.35);alpha(u,()=>txt(s,W/2,1010+12*(1-u),34,light?C.dark:C.ink,'center','sans',450));
}
export function chapter(n,label,light=false){const c=light?C.goldDark:C.gold;txt(String(n).padStart(2,'0')+'  /  '+label,92,71,20,c,'left','sans',500);txt('泊 松 过 程',1828,71,20,c,'right','sans',450)}
export function title(s,t,start=0,light=false,size=74,y=170){textIn(s,92,y,size,t,start,light?C.dark:C.ink)}
export function param(light=false,y=242){txt('λ = 1 次/分钟',1828,y,30,light?C.goldDark:C.gold,'right','math')}
let plate=null,observer=null;
export async function initPlate(){plate=new Image();plate.src='assets/environment.png';observer=new Image();observer.src='assets/observer.png';await Promise.all([plate.decode(),observer.decode()])}
const grainCanvas=document.createElement('canvas');grainCanvas.width=grainCanvas.height=512;
const grain=grainCanvas.getContext('2d');const gi=grain.createImageData(512,512);for(let i=0;i<gi.data.length;i+=4){const v=hash(i)*255;gi.data[i]=gi.data[i+1]=gi.data[i+2]=v;gi.data[i+3]=17}grain.putImageData(gi,0,0);
export function background(t,light=false,atmosphere=.17){
 g.fillStyle=light?C.paper:C.bg;g.fillRect(0,0,W,H);
 if(!light&&plate&&atmosphere){alpha(atmosphere,()=>{const s=1.02+.008*Math.sin(t*.12);g.drawImage(plate,(W-W*s)/2,(H-H*s)/2,W*s,H*s)})}
 g.save();g.globalAlpha*=light?.23:.08;g.fillStyle=g.createPattern(grainCanvas,'repeat');g.fillRect(0,0,W,H);g.restore();
 const v=g.createRadialGradient(W*.5,H*.42,H*.12,W*.5,H*.5,W*.68);v.addColorStop(0,'#00000000');v.addColorStop(1,light?'#37280e15':'#00000088');g.fillStyle=v;g.fillRect(0,0,W,H);
 if(!light)for(let i=0;i<42;i++){const x=hash(i+27)*W, y=(hash(i+194)*H+t*(3+hash(i)*7))%H;alpha(.1+.1*Math.sin(t+i)**2,()=>dot(x,y,.5+hash(i+75),C.gold,false))}
}
export function bracket(x1,x2,y,label,color=C.gold,up=true,size=24){line(x1,y,x2,y,color);line(x1,y,x1,y+(up?13:-13),color);line(x2,y,x2,y+(up?13:-13),color);txt(label,(x1+x2)/2,y+(up?-16:40),size,color,'center','sans')}
export function arrow(x1,y1,x2,y2,color=C.gold,width=1.8){line(x1,y1,x2,y2,color,width);let a=Math.atan2(y2-y1,x2-x1);poly([[x2-12*Math.cos(a-.43),y2-12*Math.sin(a-.43)],[x2,y2],[x2-12*Math.cos(a+.43),y2-12*Math.sin(a+.43)]],color,width)}
export function dashed(x1,y1,x2,y2,color=C.dim,width=1.2){g.save();g.setLineDash([7,8]);line(x1,y1,x2,y2,color,width);g.restore()}
export function streak(t,start,x,y,dx=100,dy=-50,color=C.gold,count=75){
 const age=t-start;if(age<0||age>1.8)return;
 for(let i=0;i<count;i++){const u=clamp(age/(.4+hash(i+4)*1.1));const xx=x+dx*u+(hash(i+33)-.5)*120*u,yy=y+dy*u+(hash(i+92)-.5)*100*u;alpha((1-u)*.75,()=>dot(xx,yy,.7+hash(i)*1.1,color,false))}
}
export function person(x,y,s=1,t=0,color=C.ink){
 if(observer){const h=220*s,w=h*observer.width/observer.height;g.save();g.translate(x,y+Math.sin(t*1.2)*1.25);g.rotate(Math.sin(t*.55)*.003);g.drawImage(observer,-w*.5,-h,w,h);g.restore();return}
 g.save();g.translate(x,y);g.scale(s,s);g.translate(0,Math.sin(t*1.2)*1.4);g.lineJoin='round';g.lineCap='round';
 const shift=Math.sin(t*.8)*1.6;
 g.fillStyle='#131918';g.strokeStyle=color;g.lineWidth=1.35;
 g.beginPath();g.moveTo(-12,-131);g.bezierCurveTo(-19,-153,-2,-166,12,-151);g.bezierCurveTo(19,-146,19,-134,12,-127);g.lineTo(6,-119);g.lineTo(-7,-120);g.closePath();g.fill();g.stroke();
 poly([[-9,-120],[-26,-109],[-35,-64],[-47,-7],[-17,-11],[-7,-61],[7,-63],[16,-10],[36,-8],[23,-68],[17,-114],[8,-122]],color,1.4,'#111817',true);
 poly([[-24,-105],[-31,-70],[-17,-47],[-12,-57],[-18,-77],[-10,-99]],color,1.2,null);
 poly([[15,-107],[29,-88],[46+shift,-76],[49+shift,-83],[34,-99],[25,-119]],color,1.2,null);
 poly([[-15,-12],[-12,5],[-26,7],[-28,3],[-22,-12]],color,1.4,'#111817',true);
 poly([[16,-10],[23,6],[39,7],[40,3],[31,-10]],color,1.4,'#111817',true);
 for(let i=0;i<7;i++)line(-17+i*5,-96+i*3,-29+i*8,-20,color,.7,.32);
 line(-11,-145,8,-151,color,.8,.7);line(6,-139,18,-139,color,.7,.6);
 g.restore();
}
function tokenWidth(tok,size){if(typeof tok==='string')tok={s:tok};if(tok.frac){return Math.max(mathWidth(tok.frac[0],size*.73),mathWidth(tok.frac[1],size*.73))+size*.3}g.font=size+'px "Cambria Math",Cambria,"Times New Roman"';let w=g.measureText(tok.s).width;if(tok.sup){g.font=size*.6+'px "Cambria Math",Cambria';w+=g.measureText(tok.sup).width+2}return w}
export function mathWidth(tokens,size){return tokens.reduce((a,b)=>a+tokenWidth(b,size),0)}
export function math(tokens,x,y,size=56,color=C.ink,align='center'){
 if(align==='center')x-=mathWidth(tokens,size)/2;else if(align==='right')x-=mathWidth(tokens,size);
 const boxes=[];
 for(let tok of tokens){if(typeof tok==='string')tok={s:tok};let w=tokenWidth(tok,size),cc=tok.c||color;
  if(tok.frac){math(tok.frac[0],x+w/2,y-size*.54,size*.73,cc);math(tok.frac[1],x+w/2,y+size*.54,size*.73,cc);line(x+5,y,x+w-5,y,cc,Math.max(1.3,size*.035))}
  else{txt(tok.s,x,y+size*.32,size,cc,'left','math',400);if(tok.sup){g.font=size+'px "Cambria Math",Cambria,"Times New Roman"';const bw=g.measureText(tok.s).width;txt(tok.sup,x+bw+2,y-size*.33,size*.60,cc,'left','math',400)}}
  boxes.push({x,y,w,h:size*1.4,tok});x+=w;
 }return boxes;
}
export function frameWindow(x,y,w,h,a=1,color=C.gold,filled=false){
 alpha(a,()=>{rect(x,y,w,h,color,filled?'#c9a56910':null);for(const [xx,yy]of[[x,y],[x+w,y],[x,y+h],[x+w,y+h]])circle(xx,yy,3,color,1,'#101514')});
}
export const probabilities=[Math.exp(-1),Math.exp(-1),Math.exp(-1)/2,Math.exp(-1)/6,Math.exp(-1)/24,1-Math.exp(-1)*(1+1+.5+1/6+1/24)];
export function intervalAxis(x,y,length,units,light=false){const c=light?C.goldDark:C.gold;line(x,y,x+length,y,c,1.5);for(let i=0;i<=units;i++){const xx=x+i*length/units;line(xx,y-8,xx,y+8,c,1.5);txt(''+i,xx,y+44,28,light?C.dark:C.ink,'center','math')} }
export function beatPulse(t){const q=((t-timing.beat_phase)%timing.beat_period+timing.beat_period)%timing.beat_period;return Math.exp(-q*14)}
