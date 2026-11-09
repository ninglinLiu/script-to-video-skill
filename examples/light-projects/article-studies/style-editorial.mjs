import {mix,clamp,ease,smooth,pop,txt,rect,circle,line,round,ring,path,paperTexture} from './common.mjs';
const paper='#eee9db',ink='#202820',orange='#f35835',blue='#3b4cc5',lime='#c5d84b';
let grain;
function message(c,x,y,w,h,s=1){
 c.save();c.translate(x,y);c.scale(s,s);
 round(c,-w/2+10,-h/2+14,w,h,45,ink);
 round(c,-w/2,-h/2,w,h,45,lime);
 path(c,[[w/2-120,h/2-20],[w/2-48,h/2+50],[w/2-48,h/2-30]],lime);
 c.restore();
}
function clock(c,x,y,t){ring(c,x,y,52,ink,10);line(c,x,y,x,y-30,ink,10);line(c,x,y,x+26*Math.cos(t),y+26*Math.sin(t),ink,10);circle(c,x,y,7,ink)}
function thought(c,x,y){for(const [dx,dy,r] of [[-37,0,28],[0,-17,35],[37,0,28]])circle(c,x+dx,y+dy,r,ink);circle(c,x+27,y+55,11,ink);circle(c,x+47,y+77,6,ink)}
function branch(c,x0,y0,x1,y1,p,col){
 c.strokeStyle=col;c.lineWidth=9;c.lineCap='round';c.beginPath();
 c.moveTo(x0,y0);c.bezierCurveTo(x0,mix(y0,y1,.55),mix(x0,x1,p),mix(y0,y1,.55),mix(x0,x1,p),mix(y0,y1,p));c.stroke();
}
export function editorial(c,t){
 rect(c,0,0,1080,1920,paper);
 txt(c,'凯撒的复利实验室',70,110,28,ink,550);txt(c,'01 / COGNITION',1010,110,25,ink,550,'right');
 line(c,70,145,1010,145,ink,2);
 const change=ease(3.05,3.55,t);
 c.save();c.beginPath();c.rect(58,200,970,240);c.clip();
 txt(c,'消息没回',63,392-change*250,184,ink,950);
 txt(c,'先别定论',63,392+(1-change)*250,184,ink,950);c.restore();
 txt(c,'认知复杂度 / 一个事实，几种解释',75,490,37,ink,500);
 const opening=pop(-.06,t,15,.8),split=ease(3.6,4.35,t),final=ease(8.1,9.15,t);
 const mx=mix(540,540,split),my=mix(945,765,split)+final*12;
 const sc=mix(1,.53,split);
 c.save();c.translate(540,950);c.rotate((1-opening)*-.16);c.scale(opening,opening);c.translate(-540,-950);
 message(c,mx,my,800,320,sc);
 txt(c,'消息已发出',mx,my-30*sc,75*sc,ink,800,'center');
 txt(c,'未回复',mx,my+73*sc,80*sc,ink,900,'center');
 c.restore();
 // A stamped inference is physically lifted away from the original message.
 const stamp=pop(1.27,t,24,.6),lift=ease(3.05,3.65,t),hide=ease(3.7,4.2,t);
 if(t>=1.27&&hide<1){
  c.save();c.translate(mix(574,890,lift)+hide*280,mix(1025,613,lift));c.rotate(mix(-.14,.13,lift));
  c.scale(mix(1.75,1,stamp)*mix(1,.57,lift),mix(1.75,1,stamp)*mix(1,.57,lift));
  rect(c,-350,-97,700,194,orange);
  c.strokeStyle=ink;c.lineWidth=5;c.strokeRect(-336,-83,672,166);
  txt(c,'不靠谱？',0,49,130,paper,900,'center');c.restore();
 }
 const nodes=[{x:225,y:1125,start:4.36,label:'可能在忙',col:orange},{x:540,y:1300,start:5.4,label:'可能忘了',col:blue},{x:855,y:1125,start:6.29,label:'可能还在想',col:lime}];
 for(const [i,n]of nodes.entries()){
  const q=ease(n.start-.13,n.start+.36,t);if(q<=0)continue;
  const x=mix(540,n.x,q),y=mix(835,n.y,q),size=180*pop(n.start-.13,t,19,.78);
  branch(c,540,845,x,y,q,ink);
  c.save();c.translate(x,y);c.rotate((1-q)*(i%2?.35:-.35));
  round(c,-size/2+9,-size/2+10,size,size,28,ink);round(c,-size/2,-size/2,size,size,28,n.col);
  if(i===0)clock(c,0,0,t*.9);
  if(i===1){txt(c,'?',0,48,145,paper,900,'center');}
  if(i===2)thought(c,0,-18);
  c.restore();
  c.save();c.globalAlpha=q;txt(c,n.label,n.x,n.y+151,43,ink,800,'center');c.restore();
 }
 if(t>7.5){
  const q=ease(7.5,7.95,t);
  c.save();c.beginPath();c.rect(70,1460,940,98);c.clip();rect(c,70,1460,940*q,98,ink);
  if(q>.5)txt(c,'解释，不止一种。',540,1531,58,lime,800,'center');c.restore();
 }
 txt(c,'事实 ≠ 推断',75,1775,51,ink,850);
 line(c,70,1815,1010,1815,ink,2);
 txt(c,'改编自《认知复杂度》 · 凯撒的复利实验室',70,1860,27,ink,450);
 if(!grain)grain=paperTexture(37);c.drawImage(grain,0,0,1080,1920);
}
