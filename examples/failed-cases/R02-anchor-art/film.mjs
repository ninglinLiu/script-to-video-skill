import {mix,clamp,smooth,ease,pop,txt,rect,circle,line,paperTexture} from './common.mjs';
import {dense,ribbon,swellW,spiral} from './vendor/nouveau-curves.mjs';
import {C,canvas,rng,bitmap,stroke,bloom,vine,makeTag,tag,makeCoat,coat,shopper,ornamentalTitle,ribbonLabel,lightDust} from './art.mjs';
const TAU=Math.PI*2;
function range(a,b,t){return smooth(a,a+.4,t)*(1-smooth(b-.4,b,t));}
function camera(keys,t){for(let i=1;i<keys.length;i++){if(t<=keys[i][0]){const a=keys[i-1],b=keys[i],p=ease(a[0],b[0],t);return a.slice(1).map((v,k)=>mix(v,b[k+1],p));}}return keys.at(-1).slice(1);}
export async function createFilm(tl){
 const [bg,person,garment]=await Promise.all([bitmap('assets/shop.png'),bitmap('assets/shopper.png'),bitmap('assets/coat.png')]);
 const old=makeTag('499','原价',true),now=makeTag('199','现价'),other=makeTag('229','比较价'),coatA=garment,coatB=garment;const grain=paperTexture(94);
 const at=s=>tl.cues.find(x=>x.text===s).start;
 const sale=at('现在只要一百九十九'),win=at('赚了三百'),first=at('那个先出现的数字'),measure=at('悄悄变成了衡量一切的尺子'),term=at('这就是锚定效应'),pivot=at('判断围着第一个参照转'),value=at('它值不值一百九十九'),difference=at('而是比原来便宜了多少'),boundary=at('这不代表原价一定是假的'),key=at('关键是，别让一个数字'),remove=at('试着把旧价签拿走'),quality=at('看看布料和做工'),compare=at('比较同类商品的价格'),need=at('再想想，你真的需要吗'),conclusion=at('折扣能告诉你价格变了'),end=at('先看东西，再看数字');
 const keys=[[0,775,430,2.2],[1.7,540,960,1],[6.6,590,970,1.06],[win+.4,540,940,1.1],[first+2,540,960,1],[term+1,540,960,1],[remove-.3,540,960,1],[remove+1.5,580,965,1.02],[quality-.6,700,1030,1.18],[quality+.25,780,1020,3.1],[compare-.1,540,960,1],[need+1.6,540,960,1],[end,540,970,1.04],[60,540,960,.99]];
 function backdrop(c,t,pressure){
  const z=1.06+.035*Math.sin(t*.13);c.drawImage(bg,-100-(z-1)*640,-(z-1)*960,1280*z,1920*z);
  // Physical side-wall planes slide inward, leaving the window legible in the middle.
  if(pressure>.001){c.save();c.globalAlpha=pressure*.92;c.drawImage(bg,0,0,220,1536,-155+pressure*145,0,275,1920);c.drawImage(bg,820,0,204,1536,970-pressure*145,0,255,1920);c.restore();}
  const shade=c.createLinearGradient(0,0,1080,1920);shade.addColorStop(0,`rgba(31,40,32,${.12+pressure*.18})`);shade.addColorStop(.52,`rgba(14,36,31,${pressure*.38})`);shade.addColorStop(1,'#37291313');c.fillStyle=shade;c.fillRect(-200,-200,1480,2320);
  c.save();c.globalCompositeOperation='screen';c.globalAlpha=.055*(1-pressure*.6);const beam=c.createLinearGradient(100,150,850,1600);beam.addColorStop(0,'#ffda89');beam.addColorStop(1,'#ffda8900');c.fillStyle=beam;c.beginPath();c.moveTo(230,180);c.lineTo(610,180);c.lineTo(1200,1800);c.lineTo(620,1800);c.fill();c.restore();
 }
 function dial(c,t,p,off){
  if(p<.001)return;c.save();c.globalAlpha=p*(1-off);const cy=950;
  c.fillStyle='#163f36c9';c.beginPath();c.ellipse(540,cy,485,495,0,0,TAU);c.fill();
  for(let n=0;n<3;n++){c.strokeStyle=n%2?'#d6bd7c99':'#efdcb488';c.lineWidth=n===0?3:1.5;c.beginPath();c.ellipse(540,cy,425+n*14,438+n*14,.07*Math.sin(t*.4),0,TAU);c.stroke();}
  for(let i=0;i<55;i++){const a=i/55*TAU+Math.sin(t*.15)*.13;const r=i%5===0?402:416;line(c,540+Math.cos(a)*r,cy+Math.sin(a)*r,540+Math.cos(a)*429,cy+Math.sin(a)*429,'#ceb26c',i%5===0?3:1.5);}
  const a=-.9+Math.sin((t-pivot)*1.2)*.24;const x=540+Math.sin(a)*270,y=cy+Math.cos(a)*270;
  stroke(c,[[540,580],[552,780],[x,y]],10,C.gold);circle(c,540,580,20,C.ink);circle(c,540,580,12,C.gold);
  vine(c,[[125,1360],[160,1000],[90,800],[220,510],[430,590]],8,'#8a9f68',true,t*.7);
  vine(c,[[970,1390],[940,1050],[1020,810],[900,470],[640,585]],8,'#8a9f68',true,-t*.6);
  c.restore();
 }
 function figureShadow(c,x,y,s){c.save();c.translate(x,y);c.scale(s,s);c.fillStyle='#252b1d55';c.beginPath();c.ellipse(80,0,210,30,-.13,0,TAU);c.fill();c.restore();}
 return(c,t)=>{
  const pressure=smooth(first-.8,first+1.5,t)*(1-smooth(remove,remove+1.1,t));
  const mechanism=smooth(term-.5,term+.7,t)*(1-smooth(boundary,boundary+.8,t));
  const release=smooth(remove,remove+1.15,t),comp=range(compare-.2,need+.2,t),finish=smooth(end-.3,end+.8,t);
  const [cx,cy,zoom]=camera(keys,t);c.save();c.translate(540,960);c.scale(zoom,zoom);c.translate(-cx,-cy);
  backdrop(c,t,pressure);
  // A single actor and coat retain their identity through every change of scale and reference.
  const fx=310-pressure*110-mechanism*40,fy=1665+pressure*22,fs=.72-pressure*.03;
  figureShadow(c,fx,fy,fs);shopper(c,person,fx,fy,fs,t,-pressure*.06,release);
  dial(c,t,mechanism,release);
  const coatX=mix(780,590,mechanism)-comp*265,coatY=mix(1070,1125,mechanism),coatScale=.83-mechanism*.05;
  const swing=Math.sin(t*.85)*.028+pressure*Math.sin(t*1.1)*.06;
  c.save();c.globalAlpha=1;coat(c,coatA,coatX,coatY,coatScale,swing);c.restore();
  if(comp>.005){c.save();c.globalAlpha=comp;coat(c,coatB,810+(1-comp)*400,1085,.72,-.035);tag(c,other,820,1470,.5,.04);c.restore();}
  // Both price labels belong to the same physical garment, not to slide containers.
  const ns=pop(sale-.15,t,14,.8);if(ns>.001){let nx=mix(860,695,mechanism)-comp*260,ny=mix(1420,1450,mechanism);
   c.save();c.globalAlpha=Math.min(1,ns);stroke(c,[[coatX+80,coatY+100],[nx-30,ny-135],[nx,ny-85]],2,C.gold);tag(c,now,nx,ny,.58*ns,.04+Math.sin(t*.7)*.025);c.restore();}
  // Before the reveal the old tag becomes a ceiling. It then becomes the pivot of a measuring world.
  let ox=mix(775,540,pressure),oy=mix(425,650,pressure),os=mix(.94,2.12,pressure);
  ox=mix(ox,540,mechanism);oy=mix(oy,530,mechanism);os=mix(os,1.22,mechanism);
  const breathe=1+pressure*.018*Math.sin(t*1.7);let oa=Math.sin(t*.8)*.045;
  if(t>=remove){ox=mix(ox,-650,release);oy=mix(oy,-550,release)-Math.sin(release*Math.PI)*160;oa-=release*1.5;os*=1-release*.18;}
  if(release<1){
   stroke(c,[[ox+120*os,-160],[ox+140*os,oy-200*os],[ox+170*os,oy-86*os]],4,C.gold);
   tag(c,old,ox,oy,os*breathe,oa);
   if(t>sale+.4){c.save();c.translate(ox,oy);c.rotate(oa);c.scale(os,os);const p=smooth(sale+.3,sale+.8,t);stroke(c,[[-146,30],[-146+285*p,30+38*p]],9,'#9d3a2e');c.restore();}
  }
  if(t>win-.1&&t<first+1){const w=smooth(win-.1,win+.3,t)*(1-smooth(first+.4,first+1,t));c.save();c.globalAlpha=w;ribbonLabel(c,'省了 300？',535,1125,690,-.1);c.restore();}
  if(t>=measure&&t<term+.5){const p=smooth(measure,measure+.7,t)*(1-smooth(term,term+.5,t));c.save();c.globalAlpha=p;const rr=345;for(let i=0;i<31;i++){const a=-Math.PI+i/30*Math.PI;line(c,540+Math.cos(a)*rr,1160+Math.sin(a)*rr,540+Math.cos(a)*(rr-(i%5?14:28)),1160+Math.sin(a)*(rr-(i%5?14:28)),C.ivory,3);}c.restore();}
  if(t>=term-.15&&t<pivot+1.3){const a=range(term-.15,pivot+1.3,t);c.save();c.globalAlpha=a;ribbonLabel(c,'锚 定 效 应',540,295,730,-.035);c.restore();}
  if(t>value&&t<difference+.1){const q=range(value,difference+.1,t);c.save();c.globalAlpha=q;ornamentalTitle(c,'值不值？',540,285,84);c.restore();}
  if(t>difference&&t<boundary+.1){const q=range(difference,boundary+.1,t);c.save();c.globalAlpha=q;ribbonLabel(c,'便宜了多少？',540,270,650,.025);c.restore();}
  if(t>boundary&&t<remove){const q=smooth(boundary,boundary+.7,t);c.save();c.globalAlpha=q*.9;
   // Leaves become ties that visually bind the garment to its first reference.
   vine(c,[[530,760],[360,920],[600,1080],[780,1090]],7,'#a8a46a',false,t);
   if(t>key){const b=smooth(key,key+.8,t);c.globalAlpha=b;ornamentalTitle(c,'谁在替你判断？',540,270,77);}
   c.restore();}
  if(t>=remove&&t<remove+1.2){const p=clamp((t-remove)/1.2);const r=rng(421);for(let k=0;k<26;k++){const a=r()*TAU,dd=(30+r()*240)*p;const x=520+Math.cos(a)*dd,y=880+Math.sin(a)*dd+p*p*180;c.save();c.globalAlpha=(1-p)*.85;c.translate(x,y);c.rotate(a+p*3);rect(c,-5,-12,10,24,k%2?C.gold:C.ivory);c.restore();}}
  if(t>=need+.15&&t<conclusion+.7){const q=range(need+.15,conclusion+.7,t);c.save();c.globalAlpha=q;
   // A reflection of the same garment asks about need; no invented third price.
   const p=new Path2D();p.ellipse(205,1100,180,315,-.04,0,TAU);c.fillStyle='#183d35e8';c.fill(p);c.strokeStyle=C.gold;c.lineWidth=9;c.stroke(p);c.clip(p);coat(c,coatA,220,1135,.58,.035);c.restore();c.save();c.globalAlpha=q;ornamentalTitle(c,'已经有了？',205,815,40);c.restore();}
  lightDust(c,t,1-pressure*.7);
  // Live botanical foreground: the same variable-width strokes as the selected art recipe.
  for(const side of [-1,1]){c.save();if(side<0){c.translate(1080,0);c.scale(-1,1);}const sw=Math.sin(t*.75+side)*14;
   vine(c,[[5,1930],[85,1730],[55+sw,1500],[110+sw,1300]],14,'#385f45',false,t);
   vine(c,[[0,1860],[160,1700],[225+sw*.5,1590]],10,'#496d4e');c.restore();}
  c.restore();
  // Only the ending takes over the composition with words; all earlier meaning happens in the scene.
  if(finish>.001){c.save();c.globalAlpha=finish;const g=c.createLinearGradient(0,0,0,700);g.addColorStop(0,'#122e2bec');g.addColorStop(1,'#122e2b00');c.fillStyle=g;c.fillRect(0,0,1080,700);
   txt(c,'价 签 之 外',540,190,41,C.ivory,500,'center','Serif');ornamentalTitle(c,'先看东西',540,340,115);ornamentalTitle(c,'再看数字',540,475,115);stroke(c,[[300,520],[420,540],[540,527],[660,540],[780,520]],4,C.gold);c.restore();}
  // Burn-in captions follow the actual whole-paragraph voice boundaries.
  const cue=tl.cues.find(v=>t>=v.start&&t<Math.min(60,v.end+.12));
  const foot=c.createLinearGradient(0,1600,0,1920);foot.addColorStop(0,'#12231c00');foot.addColorStop(.48,'#12231cbb');foot.addColorStop(1,'#12231cf0');c.fillStyle=foot;c.fillRect(0,1600,1080,320);
  if(cue&&t<end){c.save();c.font='600 58px Sans';const size=Math.min(58,930/c.measureText(cue.text).width*58);c.font=`600 ${size}px Sans`;c.textAlign='center';c.textBaseline='alphabetic';c.lineJoin='round';c.lineWidth=5;c.strokeStyle='#17382a';c.strokeText(cue.text,540,1750);c.fillStyle='#f9edcf';c.fillText(cue.text,540,1750);c.restore();}
  txt(c,'凯撒的复利实验室',64,1845,27,'#ddd2ae',500,'left','Serif');txt(c,'原创情境 · 价格为示意',1016,1845,25,'#c7bba0',400,'right');
  c.save();c.globalAlpha=.35;c.globalCompositeOperation='soft-light';c.drawImage(grain,0,0,1080,1920);c.restore();
 };
}
