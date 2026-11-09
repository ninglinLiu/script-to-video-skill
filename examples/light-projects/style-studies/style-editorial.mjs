import {mix,clamp,smooth,ease,pop,txt,rect,circle,ring,line,path,paperTexture} from './common.mjs';
const ink='#202820',paper='#eee9db',orange='#fa5936',lime='#c2d647',blue='#3b4cc5';
let grain;
function arrow(c,x,y,s,rot,color){c.save();c.translate(x,y);c.rotate(rot);path(c,[[-s,-s*.16],[s*.4,-s*.16],[s*.4,-s*.55],[s,0],[s*.4,s*.55],[s*.4,s*.16],[-s,s*.16]],color);c.restore()}
function tile(c,x,y,w,rot=0,col=orange){c.save();c.translate(x,y);c.rotate(rot);rect(c,-w*.5+8,-w*.5+11,w,w,ink);rect(c,-w*.5,-w*.5,w,w,col);rect(c,-w*.5+8,-w*.5+8,w-16,6,'#ffffff66');c.restore()}
function eye(c,x,y,w,h,pupil,rotation=0,drawPupil=true){
 c.save();c.translate(x,y);c.rotate(rotation);
 c.beginPath();c.moveTo(-w/2,0);c.bezierCurveTo(-w*.21,-h,w*.21,-h,w/2,0);c.bezierCurveTo(w*.21,h,-w*.21,h,-w/2,0);c.closePath();c.fillStyle=paper;c.fill();c.lineWidth=20;c.strokeStyle=ink;c.stroke();
 if(drawPupil){circle(c,pupil,0,h*.68,orange);circle(c,pupil,0,h*.27,ink);circle(c,pupil-h*.16,-h*.22,h*.08,paper)}c.restore();
}
export function editorial(c,t){
 rect(c,0,0,1080,1920,paper);
 const turn=ease(2.75,3.35,t),final=ease(5.32,6.05,t);
 // Native typography remains sharp. The same orange tile becomes the eye pupil.
 txt(c,'凯撒的复利实验室',70,112,28,ink,550);
 txt(c,'01 — PERSPECTIVE',1010,112,25,ink,550,'right');
 line(c,70,145,1010,145,ink,2);
 const wordsY=430;
 c.save();c.beginPath();c.rect(55,170,980,295);c.clip();
 txt(c,'创造',67,wordsY-turn*350,256,ink,950);
 txt(c,'投资',67,wordsY+(1-turn)*350,256,ink,950);
 c.restore();
 txt(c,turn<.5?'MAKE THE VALUE':'READ THE VALUE',76,510,32,ink,700);
 // Oversized diagonal underline becomes the diagonal camera lane.
 c.save();c.beginPath();c.rect(0,565,1080,795);c.clip();c.translate(540,960);c.rotate(mix(-.11,.08,turn)-final*.08);
 const pull=mix(1,.78,final);c.scale(pull,pull);
 const tileToEye=ease(2.45,3.35,t);
 if(tileToEye<1){
  c.save();
  // Four orthogonal strips fold into a nine-cell manufactured block.
  for(let i=0;i<9;i++){
   if(i===4&&tileToEye>0)continue;
   const row=Math.floor(i/3),col=i%3,start=.10+i*.075,p=pop(start,t,19,.72);
   const x=(col-1)*174+(1-p)*(col===0?-700:col===2?700:0)+(col-1)*tileToEye*720;
   const y=(row-1)*174-(1-p)*650+(row-1)*tileToEye*920;
   tile(c,x,y,150,((i%2)*2-1)*((1-p)*1.3+tileToEye*.6),i===4?orange:(i%3===0?blue:(i%3===1?lime:orange)));
  }
  // Last tile carries a precise creation mark.
  const a=smooth(1.2,1.45,t)*(1-tileToEye);c.globalAlpha*=a;line(c,-32,3,-2,35,paper,14);line(c,-2,35,53,-39,paper,14);
  c.restore();
 }
 if(tileToEye>0){
  c.save();const k=tileToEye;
  const pupil=mix(0,mix(-115,100,ease(4.42,5.10,t)),k);
  c.save();c.globalAlpha=smooth(.05,.72,k);eye(c,0,0,mix(150,930,k),mix(60,235,k),0,0,false);c.restore();
  const size=mix(150,319.6,k),radius=size*.5*k;
  c.beginPath();c.roundRect(pupil-size/2,-size/2,size,size,radius);c.fillStyle=orange;c.fill();
  circle(c,pupil,0,235*.27*k,ink);circle(c,pupil-235*.16*k,-235*.22*k,235*.08*k,paper);
  c.restore();
 }
 c.restore();
 const shaft=smooth(1.35,1.7,t)*(1-smooth(2.4,2.65,t));
 if(shaft>0){c.save();c.globalAlpha=shaft;arrow(c,830,610,66,Math.PI*.72,orange);c.restore();}
 // Movement of the pupil precedes the whole field turning into an overview.
 if(final>0){
  const nodes=[[-290,-180],[280,-120],[310,230],[-235,250]];
  c.save();c.translate(540,960);
  nodes.forEach(([x,y],i)=>{
   const p=clamp(final*1.8-i*.12),ang=(1-p)*.9;
   c.save();c.translate(x*p,y*p);c.rotate(ang);
   c.globalAlpha=p;tile(c,0,0,94,0,[blue,lime,orange,blue][i]);
   c.restore();line(c,x*p*.4,y*p*.4,x*p*.84,y*p*.84,ink,3);
  });
  ring(c,0,0,348*final,ink,2);
  c.restore();
 }
 // Punchy caption block is a physical sliding strip, not a fading card.
 const bar=ease(4.35,4.78,t);
 c.save();c.beginPath();c.rect(70,1370,940,150);c.clip();
 rect(c,70,1370,940,150,ink);
 txt(c,'亲手搭建',108,1470-bar*150,78,paper,800);
 txt(c,'换个位置，看价值',108,1470+(1-bar)*150,78,lime,800);
 c.restore();
 txt(c,'从创造者，到观察者',75,1765,37,ink,550);
 arrow(c,960,1748,36,-Math.PI*.25,ink);
 line(c,70,1815,1010,1815,ink,2);
 txt(c,'同一个价值对象 / 不同的研究视角',70,1860,24,ink,450);
 // Restrained paper surface; no stochastic change between frames.
 if(!grain)grain=paperTexture(37);c.drawImage(grain,0,0,1080,1920);
}
