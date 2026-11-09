import {mix,clamp,txt,circle,rect,line} from './common.mjs';
import {dense,ribbon,swellW,spiral,inkLine} from './vendor/nouveau-curves.mjs';
export const C={ink:'#392b20',ivory:'#efe0b8',gold:'#b99852',green:'#284e43',coral:'#b65e45',pink:'#d59075'};
const TAU=Math.PI*2;
export function canvas(w,h){const a=document.createElement('canvas');a.width=w;a.height=h;return a;}
export function rng(seed){return ()=>{seed=(1664525*seed+1013904223)>>>0;return seed/4294967296;};}
export async function bitmap(src){return new Promise((ok,no)=>{const a=new Image();a.onload=()=>ok(a);a.onerror=no;a.src=src;});}
export function stroke(c,pts,width,col){inkLine(c,pts,width,col,1);}
export function bloom(c,x,y,r,t,col=C.coral){
 c.save();c.translate(x,y);c.rotate(Math.sin(t)*.13);
 for(let j=0;j<6;j++){c.rotate(TAU/6);c.fillStyle=j%2?col:C.pink;c.strokeStyle=C.ink;c.lineWidth=1.4;c.beginPath();c.ellipse(r*.55,0,r*.57,r*.31,.2,0,TAU);c.fill();c.stroke();stroke(c,[[r*.18,0],[r*.55,-r*.09],[r*.91,0]],1.5,C.gold);}
 circle(c,0,0,r*.21,C.green);for(let j=0;j<9;j++){let a=j/9*TAU;circle(c,Math.cos(a)*r*.3,Math.sin(a)*r*.3,r*.035,C.ivory);}c.restore();
}
export function vine(c,pts,width=10,col=C.green,flowers=false,t=0){
 const d=dense(pts,10);c.fillStyle=C.ink;c.fill(ribbon(d,swellW(width+3,1)));c.fillStyle=col;c.fill(ribbon(d,swellW(width,1)));
 for(let k=3;k<d.length-3;k+=7){const p=d[k],n=d[k+1];const a=Math.atan2(n[1]-p[1],n[0]-p[0]);c.save();c.translate(...p);c.rotate(a+(k%2?.85:-.85));c.fillStyle=k%2?'#73936b':'#b6ad6a';c.strokeStyle=C.ink;c.lineWidth=1.3;c.beginPath();c.moveTo(0,0);c.quadraticCurveTo(14,-24,48,-6);c.quadraticCurveTo(30,18,0,0);c.fill();c.stroke();stroke(c,[[0,0],[24,-1],[45,-6]],1,C.gold);c.restore();}
 if(flowers){const p=d[Math.floor(d.length*.63)];bloom(c,p[0],p[1],30,t);}
}
export function makeTag(value,label,old=false){
 const a=canvas(500,360),c=a.getContext('2d');c.translate(250,180);
 c.shadowColor='#25180b77';c.shadowBlur=16;c.shadowOffsetY=12;
 const p=new Path2D('M -210 -105 Q -210 -135 -180 -135 L 150 -135 Q 160 -135 172 -120 L 215 -70 L 215 108 Q 215 132 190 132 L -186 132 Q -210 132 -210 108 Z');
 c.fillStyle=old?'#ddcc96':'#254e45';c.fill(p);c.shadowColor='transparent';c.strokeStyle=C.ink;c.lineWidth=4;c.stroke(p);
 c.save();c.clip(p);const n=rng(old?184:52);for(let i=0;i<4200;i++){c.fillStyle=n()>.5?'#53442712':'#ffffdc18';c.fillRect(n()*440-220,n()*300-150,n()*2+1,1);}
 c.strokeStyle=old?'#947644':'#b6a15d';c.lineWidth=2;c.strokeRect(-194,-118,388,232);c.strokeRect(-188,-112,376,220);c.restore();
 for(const s of [-1,1]){c.save();c.scale(s,1);c.fillStyle=old?'#8d763c':'#c8b871';c.fill(ribbon(dense(spiral(169,92,22,Math.PI,.95,1),3),swellW(3.5,.5)));c.fill(ribbon(dense([[130,-92],[150,-80],[172,-88],[178,-62]],6),swellW(4,.5)));c.restore();}
 circle(c,180,-86,12,C.gold);circle(c,180,-86,5,C.ink);
 txt(c,label,-142,-66,28,old?'#71522e':'#dfce9e',600,'left','Serif');
 txt(c,value,0,62,134,old?C.ink:'#f5e8bf',800,'center','Serif');
 return a;
}
export function tag(c,img,x,y,scale=1,angle=0){c.save();c.translate(x,y);c.rotate(angle);c.scale(scale,scale);c.drawImage(img,-250,-180);c.restore();}
export function makeCoat(color='#31584b'){
 const a=canvas(560,820),c=a.getContext('2d');c.translate(280,110);
 const coat=new Path2D('M -55 10 L -135 54 Q -166 81 -181 130 L -238 260 L -171 298 L -117 199 L -128 573 Q 0 627 132 573 L 115 199 L 173 298 L 238 260 L 180 125 Q 158 73 133 53 L 55 10 Z');
 c.shadowColor='#17231a77';c.shadowBlur=13;c.shadowOffsetY=12;c.fillStyle=color;c.fill(coat);c.shadowColor='transparent';c.strokeStyle=C.ink;c.lineWidth=4;c.stroke(coat);
 c.save();c.clip(coat);const gr=c.createLinearGradient(-200,0,160,650);gr.addColorStop(0,'#d6c48c30');gr.addColorStop(.4,'#092e2910');gr.addColorStop(.8,'#072f3566');gr.addColorStop(1,'#d2b87c18');c.fillStyle=gr;c.fillRect(-280,0,560,680);
 const n=rng(913);for(let i=0;i<12000;i++){let x=n()*560-280,y=n()*670;c.fillStyle=i%2?'#dacc8e14':'#101c1623';c.fillRect(x,y,.6+n(),1.5+n()*3);}
 c.strokeStyle='#e5d39918';c.lineWidth=.6;for(let x=-240;x<240;x+=5){c.beginPath();c.moveTo(x,20);c.lineTo(x+14,640);c.stroke();}for(let y=15;y<650;y+=5){c.beginPath();c.moveTo(-240,y);c.lineTo(240,y+10);c.stroke();}
 // Whiplash embroidery uses the repository's variable-width curves.
 for(const s of [-1,1]){c.save();c.scale(s,1);vine(c,[[48,530],[73,470],[53,401],[83,349],[72,285]],3,'#ba9c53');for(let j=0;j<3;j++)bloom(c,70+(j%2?17:-12),415+j*56,16,j*.4,'#b68d48');c.restore();}
 c.restore();
 const collar=new Path2D('M -55 10 L -105 61 L -65 119 L -29 211 L 0 132 L 29 211 L 66 119 L 105 61 L 55 10 L 0 55 Z');c.fillStyle='#d1bb8b';c.fill(collar);c.strokeStyle='#4c3b25';c.lineWidth=3;c.stroke(collar);
 stroke(c,[[0,132],[12,293],[12,577]],3,'#1a382f');for(let y=240;y<505;y+=76){circle(c,32,y,9,C.ink);circle(c,30,y-2,6.5,C.gold);}
 for(const s of [-1,1]){c.save();c.scale(s,1);stroke(c,[[57,306],[104,300]],9,C.gold);stroke(c,[[118,214],[105,388],[118,560]],2,'#ddd49b66');c.restore();}
 stroke(c,[[-108,566],[-35,589],[50,588],[117,567]],5,C.gold);
 c.strokeStyle=C.gold;c.lineWidth=7;c.lineCap='round';c.beginPath();c.moveTo(-108,21);c.lineTo(0,-39);c.lineTo(108,21);c.closePath();c.stroke();c.beginPath();c.moveTo(0,-39);c.lineTo(0,-63);c.bezierCurveTo(-23,-70,-15,-98,5,-95);c.bezierCurveTo(26,-93,25,-72,15,-68);c.stroke();
 return a;
}
export function coat(c,img,x,y,scale=1,angle=0){c.save();c.translate(x,y);c.rotate(angle);c.drawImage(img,-280*scale,-410*scale,560*scale,820*scale);c.restore();}
export function shopper(c,img,x,foot,scale,t,lean=0,reach=0){
 c.save();c.translate(x,foot);c.rotate(lean);c.scale(scale,scale);
 // A restrained cloth wave, grounded at the feet; it does not move the whole body like a card.
 for(let y=0;y<img.height;y+=24){const v=y/img.height,dy=Math.sin(t*2.1)*2.6*(1-v);const dx=(Math.sin(t*1.55+v*5)*6+reach*6)*Math.pow(v,.9)*(1-v)*4;
  c.drawImage(img,0,y,img.width,Math.min(24,img.height-y),-512+dx,-1536+y+dy,1024,Math.min(24,img.height-y)+.5);
 }c.restore();
}
export function ornamentalTitle(c,s,x,y,size=112,color=C.ivory){
 c.save();c.font=`800 ${size}px Serif`;c.textAlign='center';c.textBaseline='alphabetic';c.lineJoin='round';c.strokeStyle='#2b3028';c.lineWidth=5;c.strokeText(s,x,y);c.fillStyle=color;c.fillText(s,x,y);c.restore();
}
export function ribbonLabel(c,s,x,y,w=600,angle=0){
 c.save();c.translate(x,y);c.rotate(angle);c.shadowColor='#29190f55';c.shadowBlur=16;c.shadowOffsetY=6;c.fillStyle=C.coral;
 const p=new Path2D();p.moveTo(-w/2,-48);p.bezierCurveTo(-w*.2,-70,w*.2,-30,w/2,-52);p.lineTo(w/2-20,54);p.bezierCurveTo(w*.2,72,-w*.2,28,-w/2,51);p.closePath();c.fill(p);c.shadowColor='transparent';c.strokeStyle='#e4bd78';c.lineWidth=3;c.stroke(p);txt(c,s,0,24,56,C.ivory,750,'center','Serif');c.restore();
}
export function lightDust(c,t,alpha=1){const r=rng(116);c.save();c.globalCompositeOperation='screen';for(let i=0;i<44;i++){const x=100+r()*860,y=(r()*1850-t*(6+r()*9)+19200)%1850;circle(c,x,y,1+r()*2.2,`rgba(255,225,154,${alpha*(.1+r()*.25)})`);}c.restore();}
