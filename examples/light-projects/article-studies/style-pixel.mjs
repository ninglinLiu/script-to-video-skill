import {SpriteActor} from './vendor/sprite-actor.mjs';
import {drawOpenBook,drawRewardBadge} from './vendor/components.mjs';
import {mix,ease,pop,smooth,txt,rect,circle,line,path} from './common.mjs';
const font='Fusion Pixel 12px Proportional Simplified Chinese';
const ptext=(c,s,x,y,z,col='#eddfb6',align='left')=>txt(c,s,x,y,z,col,400,align,font);
function stone(c,x,y,w,h,col='#52645b'){
 rect(c,x+8,y+12,w,h,'#152a2b');rect(c,x,y,w,h,col);rect(c,x,y,w,10,'#84917a');rect(c,x+w-12,y+10,12,h-10,'#334d49');
}
function stair(c,x,y,w){stone(c,x,y,w,48);stone(c,x+28,y-44,w-28,44);stone(c,x+56,y-88,w-56,44);}
export async function createPixel(){
 const actor=await new SpriteActor({mini:'assets/sprites/manifest.json',portrait:'assets/bust/manifest.json'}).load();
 return function(c,t){
  rect(c,0,0,1080,1920,'#101d21');
  // The character runs in a repeated corridor, then stops to read a route.
  const pause=ease(5.1,5.45,t),read=ease(6.0,6.4,t),open=ease(6.8,7.45,t),walk=ease(7.5,9.4,t);
  c.save();c.beginPath();c.rect(45,555,990,990);c.clip();
  rect(c,45,555,990,990,'#203637');
  const scroll=280*(Math.min(t,5.1))*.85;
  for(let i=-1;i<6;i++){
   const x=i*350-scroll%350;rect(c,x+95,555,95,825,'#1a2d30');
   rect(c,x+104,555,12,825,'#35504b');
   rect(c,x+120,721,250,18,'#314b45');
  }
  const sun=c.createRadialGradient(775,740,30,775,950,680);sun.addColorStop(0,'#d2b16b33');sun.addColorStop(1,'#bd976200');c.fillStyle=sun;c.fillRect(45,555,990,990);
  // Broad foreground platform; slots move under the runner until the pause.
  stone(c,35,1350,1020,170,'#596957');
  for(let i=-1;i<9;i++){const x=i*165-scroll%165;rect(c,x,1368,5,121,'#3b5148');rect(c,x+22,1443,90,6,'#6d7a60')}
  const doorX=790,doorY=778;
  stone(c,doorX-146,doorY-60,292,572,'#465b51');
  rect(c,doorX-122,doorY-33,244,572,'#101f24');
  rect(c,doorX-122,doorY-33,244,572,'#a6b983');
  for(let i=0;i<6;i++)rect(c,doorX-122,doorY-33+i*95,244,10,'#839a6d');
  // Two solid door leaves retract, revealing the lit route and steps.
  const glow=c.createLinearGradient(doorX-122,0,doorX+122,0);glow.addColorStop(0,'#9eae80');glow.addColorStop(.5,'#f5dba0');glow.addColorStop(1,'#9eae80');c.fillStyle=glow;c.fillRect(doorX-122,doorY-33,244,572);
  for(let side of [-1,1]){
   const width=122*(1-open);rect(c,side<0?doorX-122:doorX+122-width,doorY-33,width,572,'#354c47');
   if(width>24)rect(c,side<0?doorX-width+4:doorX+width-20,doorY+200,16,55,'#d3ad68');
  }
  if(open>.01){c.save();c.globalAlpha=open;stair(c,doorX-80,1285,160);c.restore();}
  if(t<5.45){
   const cycle=t*.85%1;
   const x=460-30*cycle;
   c.save();c.globalAlpha=1-pause;
   ptext(c,'同一关',790,704,54,'#b7b58a','center');
   // Return arrow traces a full loop, visibly sending effort back to its start.
   c.strokeStyle='#dd984e';c.lineWidth=12;c.beginPath();c.arc(430,1000,200,-Math.PI*.9,-Math.PI*.9+Math.PI*1.75*Math.min(1,t/.5));c.stroke();
   path(c,[[600,862],[630,902],[575,903]],'#dd984e');
   c.restore();
  }
  const x=mix(390,795,walk),bob=t<5.1?Math.abs(Math.sin(t*14))*12:walk>0&&walk<1?Math.abs(Math.sin(t*14))*10:0;
  const frame=t<5.1?4+Math.floor(t*10)%4:t<6.12?12:t<7.5?15:walk<1?4+Math.floor(t*10)%4:0;
  actor.mini(c,{frame,x,foot:1350-bob-walk*88,scale:1.95});
  // The same readable route mark travels from the book into the doorway.
  if(read>0){
   const close=ease(7.1,7.5,t);
   c.save();c.translate(370,1240);c.scale(Math.max(.001,read*(1-close)),Math.max(.001,read*(1-close)));c.translate(-370,-1240);
   drawOpenBook(c,{x:185,y:1165,w:370,h:155,closed:1-read,mark:false});
   line(c,265,1225,322,1225,'#32665c',10);line(c,322,1225,365,1187,'#32665c',10);line(c,365,1187,438,1187,'#32665c',10);
   path(c,[[437,1166],[460,1187],[437,1208]],'#32665c');c.restore();
   const q=ease(6.6,7.2,t);
   const ax=mix(460,790,q),ay=mix(1187,912,q)-Math.sin(q*Math.PI)*260;
   c.save();c.globalAlpha=1-smooth(7.5,7.95,t);
   circle(c,ax,ay,26,'#f1c36c');path(c,[[ax-11,ay-13],[ax+15,ay],[ax-11,ay+13]],'#355448');c.restore();
   if(t>7.2)ptext(c,'新路径',790,708,54,'#f4d49a','center');
  }
  c.restore();
  ptext(c,'凯撒的复利实验室',70,110,30,'#cbbb92');ptext(c,'03 / 像素关卡',1010,110,30,'#cbbb92','right');
  line(c,70,145,1010,145,'#587165',3);
  const title=ease(4.75,5.3,t);c.save();c.beginPath();c.rect(65,206,950,245);c.clip();
  ptext(c,'又是同一关？',70,385-title*250,138);
  ptext(c,'换条路试试',70,385+(1-title)*250,150);c.restore();
  ptext(c,t<5?'勤奋之外，还要理解规则':'先读规则，再试新路径',74,496,45,'#c3be95');
  rect(c,45,1545,990,178,'#101d21');
  ptext(c,'重复 → 暂停 → 探索',75,1780,48,'#d9bb7e');line(c,70,1820,1010,1820,'#587165',3);
  ptext(c,'原文观点的游戏比喻 / 不代表收益',70,1865,27,'#a9bcab');
 };
}
