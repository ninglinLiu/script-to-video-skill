import {mix,ease,pop,smooth,txt,rect,circle,line,path,round,paperTexture} from './common.mjs';
const C={paper:'#f2efd9',ink:'#152c2a',lime:'#c3dc67',red:'#e3654b',soft:'#b8c4a9'};
function shirt(c,x,y,s,rot=0){c.save();c.translate(x,y);c.rotate(rot);c.scale(s,s);
 path(c,[[-95,-260],[-230,-210],[-315,-70],[-205,-8],[-160,-75],[-160,270],[160,270],[160,-75],[205,-8],[315,-70],[230,-210],[95,-260]],'#2c5650',C.ink,7);
 c.save();c.beginPath();c.rect(-155,-190,310,450);c.clip();for(let i=-8;i<8;i++)line(c,i*26,-210,i*26+95,320,'#54736a',3);c.restore();
 c.beginPath();c.arc(0,-270,90,0,Math.PI);c.lineWidth=15;c.strokeStyle='#b8c4a9';c.stroke();
 line(c,-150,235,150,235,'#a4b28c',5);line(c,-210,-13,-276,-52,'#a4b28c',4);line(c,210,-13,276,-52,'#a4b28c',4);
 c.restore();}
function tag(c,x,y,w,h,col,rot=0){c.save();c.translate(x,y);c.rotate(rot);rect(c,-w/2+14,-h/2+18,w,h,'#102b2522');path(c,[[-w/2,-h/2],[w/2-45,-h/2],[w/2,-h/2+45],[w/2,h/2],[-w/2,h/2]],col,C.ink,3);circle(c,w/2-48,-h/2+52,10,C.paper);c.restore();}
function anchor(c,x,y,s){c.save();c.translate(x,y);c.scale(s,s);c.lineWidth=13;c.strokeStyle=C.ink;c.lineCap='round';c.beginPath();c.arc(0,-100,24,0,Math.PI*2);c.moveTo(0,-75);c.lineTo(0,125);c.moveTo(-72,-30);c.lineTo(72,-30);c.moveTo(-115,55);c.bezierCurveTo(-90,160,90,160,115,55);c.stroke();path(c,[[-137,83],[-116,35],[-80,75]],C.ink);path(c,[[137,83],[116,35],[80,75]],C.ink);c.restore();}
export async function createEditorial(tl){const texture=paperTexture();const at=s=>tl.cues.find(v=>v.text===s).start;
 const sell=at('现在只要一百九十九'),gain=at('赚了三百'),doubt=at('但你省下的钱'),anch=at('那个先出现的数字'),remove=at('把原价拿掉'),compare=at('只看质量、同类价格'),need=at('和你是否真的需要'),end=at('折扣很大');
 return(c,t)=>{rect(c,0,0,1080,1920,C.paper);c.drawImage(texture,0,0,1080,1920);
 txt(c,'01 / 价格的第一印象',65,110,27,C.ink,500);line(c,65,145,1015,145,C.ink,2);
 const a=smooth(doubt,doubt+.8,t),b=smooth(remove,remove+.7,t),k=smooth(compare,compare+.8,t),z=smooth(end,end+.7,t);
 const h=t<doubt?'便宜了？':t<remove?'谁定的参照？':t<compare?'去掉原价后':t<end?'重新比较':'折扣 ≠ 值得';
 txt(c,h,65,335,h.length>6?106:127,C.ink,900);txt(c,t<remove?'THE PRICE YOU SEE FIRST':'WHAT ARE YOU REALLY BUYING?',68,399,25,C.ink,500);
 // 同一件衣服和价签持续变形，保留主体身份。
 const sx=mix(400,300,a),sy=mix(910,1030,a),ss=mix(1.08,.74,a)*(1-.56*k);
 shirt(c,mix(sx,540,k),mix(sy,635,k)-z*65,ss,-.07+Math.sin(t*.8)*.018);
 if(t<compare){
  const ox=mix(760,640,a),oy=mix(730,690,a)-b*1400;
  const oldIn=Math.max(0,pop(at('标价四百九十九')-.18,t,16,.85));
  c.save();c.globalAlpha=1-b;c.translate(ox,oy);c.scale(oldIn,oldIn);tag(c,0,0,320,260,C.lime,.08-a*.08);txt(c,'原价',-110,-60,37,C.ink,600);txt(c,'499',0,60,126,C.ink,900,'center');
  const cut=ease(sell,sell+.34,t);line(c,-130,-12,-130+cut*260,55,C.red,12);c.restore();
  if(t>sell-.1){const p=pop(sell-.1,t,18,.8);const nx=mix(760,650,a),ny=mix(1120,1160,a)-b*180;
   tag(c,nx,ny,380*p,290*p,C.red,-.06*(1-a));c.save();c.globalAlpha=Math.min(1,p);txt(c,'199',nx,ny+42,155,C.paper,900,'center');txt(c,'现在',nx,ny-70,34,C.paper,600,'center');c.restore();
   if(t<remove){c.beginPath();c.moveTo(ox,oy+120);c.bezierCurveTo(ox+90,900,nx-100,1010,nx,ny-145);c.strokeStyle=C.ink;c.lineWidth=4;c.setLineDash([8,9]);c.stroke();c.setLineDash([]);}
  }
  const g=pop(gain-.2,t,18,.75)*(1-smooth(doubt,doubt+.5,t));if(g>.001){c.save();c.translate(325,1315);c.scale(g,g);circle(c,0,0,163,C.lime);txt(c,'省300？',0,22,65,C.ink,900,'center');c.restore();}
  if(t>anch&&t<remove+.8){const q=ease(anch,anch+.6,t)*(1-b);anchor(c,650,930,q*.72);}
  if(t>remove&&t<remove+.6){const q=(t-remove)/.6;for(let i=0;i<7;i++){c.save();c.translate(650+Math.cos(i)*q*300,850+Math.sin(i)*q*250);c.rotate(i+q*4);rect(c,-5,-20,10,40,C.red);c.restore();}}
  if(b>.7){txt(c,'还会买吗？',540,1400,83,C.ink,900,'center');}
 }else{
  // 质量、同类价格、需求成为新的比较依据。
  const labels=['质量','同类价格','需求'];for(let i=0;i<3;i++){
   const start=i<2?compare+i*.28:need;const q=pop(start,t,17,.8);if(q<=0)continue;
   const x=220+i*320,y=1090-z*90;c.save();c.translate(x,y);c.scale(q,q);circle(c,0,0,136,i===1?C.lime:'#d9dec3');
   if(i===0){for(let u=-2;u<=2;u++){line(c,-85,u*24,85,u*24,C.ink,7);line(c,u*24,-85,u*24,85,C.ink,4);}}
   if(i===1){line(c,-85,-20,85,-20,C.ink,8);line(c,0,-70,0,75,C.ink,7);path(c,[[-85,-20],[-115,40],[-55,40]],null,C.ink,5);path(c,[[85,-20],[55,40],[115,40]],null,C.ink,5);}
   if(i===2){c.beginPath();c.moveTo(0,75);c.bezierCurveTo(-150,-15,-50,-125,0,-48);c.bezierCurveTo(50,-125,150,-15,0,75);c.fillStyle=C.red;c.fill();}
   txt(c,labels[i],0,205,47,C.ink,800,'center');c.restore();
  }
  if(z>.01){rect(c,60,1340,960,130,C.ink);txt(c,'先问需要，再看折扣。',540,1428,58,C.paper,800,'center');}
 }
 txt(c,'原创购物情境 · 非真实商品报价',65,1520,26,'#6c7867',500);
 };}
