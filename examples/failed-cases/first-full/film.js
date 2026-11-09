/* Article-specific composition. Approved sample assets and deterministic Canvas technique retained. */
(async function(){
'use strict';
const W=1080,H=1920,F=window.FILM;
const canvas=document.getElementById('film'),g=canvas.getContext('2d',{alpha:false});
const scene=document.createElement('canvas');scene.width=W;scene.height=H;
const q=scene.getContext('2d',{alpha:false});
const art={};
await Promise.all(['background','body','roof','observer','lens','notebook'].map(async n=>{const i=new Image();i.src='assets/'+n+'.png';await i.decode();art[n]=i}));
await Promise.all([document.fonts.load('500 100px FilmSerif'),document.fonts.load('450 44px FilmSans')]);await document.fonts.ready;
const C=Object.fromEntries(F.chapters.map(c=>[c.id,c]));
const cue=id=>F.cues.find(c=>c.id===id);
const clamp=x=>Math.max(0,Math.min(1,x));
const smooth=x=>{x=clamp(x);return x*x*x*(x*(x*6-15)+10)};
const ease=(t,a,b)=>smooth((t-a)/(b-a));
const mix=(a,b,p)=>a+(b-a)*p;
const gold='#d5b371',ivory='#eee7d5';
function text(ctx,s,x,y,size,color=ivory,font='FilmSans',weight=450,align='left'){
 ctx.save();ctx.font=weight+' '+size+'px '+font;ctx.textAlign=align;ctx.textBaseline='alphabetic';ctx.fillStyle=color;ctx.fillText(s,x,y);ctx.restore();
}
function cover(ctx,im,cx,cy,scale=1){const s=Math.max(W/im.width,H/im.height)*scale;ctx.drawImage(im,cx-im.width*s/2,cy-im.height*s/2,im.width*s,im.height*s)}
function line(ctx,points,progress=1,color=gold,width=2){
 if(progress<=0)return;ctx.save();ctx.strokeStyle=color;ctx.lineWidth=width;ctx.lineCap='round';ctx.beginPath();ctx.moveTo(...points[0]);
 const n=(points.length-1)*clamp(progress);
 for(let i=1;i<=Math.floor(n);i++)ctx.lineTo(...points[i]);
 const i=Math.floor(n);if(i<points.length-1){const p=n-i;ctx.lineTo(mix(points[i][0],points[i+1][0],p),mix(points[i][1],points[i+1][1],p))}ctx.stroke();ctx.restore();
}
function ring(ctx,x,y,rx,ry,p=1,alpha=1){ctx.save();ctx.globalAlpha=alpha;ctx.strokeStyle=gold;ctx.lineWidth=2.4;ctx.beginPath();ctx.ellipse(x,y,rx,ry,0,Math.PI,Math.PI+2*Math.PI*clamp(p));ctx.stroke();ctx.restore()}
function rounded(ctx,x,y,w,h,r){ctx.beginPath();ctx.roundRect(x,y,w,h,r)}
function model(ctx,x,y,z,roofOffset=0,shadow=1){
 ctx.save();ctx.translate(x,y);ctx.scale(z,z);
 ctx.save();ctx.scale(1,.19);const sh=ctx.createRadialGradient(0,0,90,0,0,515);sh.addColorStop(0,'rgba(0,0,0,'+.82*shadow+')');sh.addColorStop(.65,'rgba(0,0,0,'+.38*shadow+')');sh.addColorStop(1,'rgba(0,0,0,0)');ctx.fillStyle=sh;ctx.fillRect(-540,-540,1080,1080);ctx.restore();
 ctx.drawImage(art.body,-500,-902,1000,1000);ctx.drawImage(art.roof,-163.5+roofOffset*.06,-733+roofOffset,423,160);ctx.restore();
}
function modelState(t){
 const u=t*8/C.intro.end;
 if(t<C.intro.end){const p=ease(u,1.75,4.6),slow=ease(u,0,8);const drop=ease(u,-.3,1.95);return {x:mix(565,492,p)-4*slow,y:mix(1480,1365,p),z:mix(1.13,.80,p)-.015*slow,roof:-230*(1-drop),pull:p}}
 const keys=[
  [C.intro.end,488,1365,.785],
  [C.history.start+2.5,540,1395,1.0],
  [C.history.end-1.8,540,1395,1.0],
  [C.framework.start+1.6,540,1465,.70],
  [C.boundary.start+2.8,540,1465,.70],
  [C.sources.start+1.6,810,930,.39],
  [C.return.start,810,930,.39],
  [C.return.start+3.8,510,1395,.81],
  [C.limits.start,510,1395,.81],
  [F.duration,525,1395,.85]
 ];
 let a=keys[0],b=keys[keys.length-1];for(let i=0;i<keys.length-1;i++){if(t>=keys[i][0]&&t<keys[i+1][0]){a=keys[i];b=keys[i+1];break}}
 const p=ease(t,a[0],b[0]);return {x:mix(a[1],b[1],p),y:mix(a[2],b[2],p),z:mix(a[3],b[3],p),roof:0,pull:1};
}
function lenses(t){
 const u=t*8/C.intro.end;
 if(t<C.history.start+2.4){
  const enter=ease(u,3.05,4.85),focus=ease(u,5.35,6.5),leave=ease(t,C.history.start+.15,C.history.start+2.4);
  if(enter<=0||leave>=1)return null;
  return {x:mix(-780,478,enter)-10*focus+1550*leave,y:1055-10*focus-110*leave,s:mix(1.2,.96,enter)+.055*focus,tilt:mix(-.065,-.012,enter)+.03*leave,ellipse:mix(.86,1,enter),mag:mix(1.025,1.075,focus)};
 }
 if(t>=C.verify.start-.65&&t<C.return.start+1.2){
  const e=ease(t,C.verify.start-.65,C.verify.start+1.0),p=ease(t,C.verify.start+1.0,C.verify.end-.6),leave=ease(t,C.return.start,C.return.start+1.2);
  return {x:mix(-600,315,e)+430*p-1100*leave,y:mix(1220,1290,p),s:.55,tilt:-.04+.04*p,ellipse:1,mag:1.08};
 }
 if(t>=C.return.start+1.8){const e=ease(t,C.return.start+1.8,C.return.end-.1),leave=ease(t,C.limits.start+2.3,C.limits.start+5.2);if(leave>=1)return null;return {x:mix(-720,478,e)-1400*leave,y:1055,s:.95,tilt:-.012,ellipse:1,mag:1.035}}
 return null;
}
function drawLens(l){
 if(!l)return;
 g.save();g.translate(l.x,l.y);g.rotate(l.tilt);g.scale(l.ellipse,1);g.beginPath();g.arc(0,0,369*l.s,0,Math.PI*2);g.clip();g.setTransform(1,0,0,1,0,0);g.drawImage(scene,l.x-l.x*l.mag,l.y-l.y*l.mag,W*l.mag,H*l.mag);
 const shine=g.createLinearGradient(l.x-350,l.y-380,l.x+250,l.y+340);shine.addColorStop(0,'rgba(235,224,191,.055)');shine.addColorStop(.4,'rgba(199,211,199,.012)');shine.addColorStop(1,'rgba(13,20,21,.045)');g.fillStyle=shine;g.fillRect(l.x-500,l.y-500,1000,1000);g.restore();
 g.save();g.translate(l.x,l.y);g.rotate(l.tilt);g.scale(l.s*l.ellipse,l.s);g.drawImage(art.lens,-513,-471);g.restore();
}
function observer(t){
 const u=t*8/C.intro.end;let p=ease(u,2.9,5.2),out=ease(t,C.history.start,C.history.start+1.8);
 if(t>=C.return.start){p=ease(t,C.return.start+2.1,C.return.end);out=0}
 if(!p||out>=1)return;
 const x=mix(1280,410,p)+900*out,y=mix(705,790,p),w=mix(810,790,p);g.save();g.filter='blur('+mix(5.5,2.5,p)+'px)';g.drawImage(art.observer,x,y,w,w*1.5);g.restore();
}
function history(t){
 const a=ease(t,cue('history_3').start-.3,cue('history_3').start+.4)*(1-ease(t,C.framework.start-.6,C.framework.start+.3));if(!a)return;
 q.save();q.globalAlpha=a;const bg=q.createLinearGradient(0,470,0,750);bg.addColorStop(0,'rgba(8,9,8,0)');bg.addColorStop(.4,'rgba(8,9,8,.85)');bg.addColorStop(1,'rgba(8,9,8,0)');q.fillStyle=bg;q.fillRect(80,470,920,280);text(q,'价值投资',160,620,58,'#ead7aa','FilmSerif',500);text(q,'成长投资',660,620,58,'#ead7aa','FilmSerif',500);text(q,'+',525,620,46,'#d0c2a6','FilmSans',400,'center');
 line(q,[[260,650],[390,740],[470,860]],ease(t,cue('history_3').start,cue('history_4').start+.6),'rgba(213,179,113,.7)');line(q,[[780,650],[670,740],[610,860]],ease(t,cue('history_4').start,cue('history_4').end),'rgba(213,179,113,.7)');q.restore();
}
function research(t,m){
 const open=ease(t,C.framework.start+.1,C.framework.start+1.4),close=ease(t,C.boundary.start-.25,C.boundary.start+.3);if(!open||close>=1)return;
 q.save();q.globalAlpha=open*(1-close);
 const scrim=q.createLinearGradient(0,480,0,850);scrim.addColorStop(0,'rgba(8,9,8,0)');scrim.addColorStop(.35,'rgba(8,9,8,.86)');scrim.addColorStop(.7,'rgba(8,9,8,.72)');scrim.addColorStop(1,'rgba(8,9,8,0)');q.fillStyle=scrim;q.fillRect(65,480,950,370);
 const split=ease(t,C.dimensions.start-.8,C.dimensions.start+.4);
 // A single brass rail divides into three lenses of inquiry, with no invented data.
 line(q,[[140,565],[940,565]],open,'rgba(213,179,113,.6)',1.5);
 if(split<1){q.save();q.globalAlpha*=1-split;text(q,'深度价值',150,665,58,'#ead7aa','FilmSerif',500);text(q,'×',540,665,40,ivory,'FilmSans',400,'center');text(q,'高增长科技',625,665,54,'#ead7aa','FilmSerif',500);q.restore()}
 const labels=['高毛利率','潜在市场','护城河'];
 for(let i=0;i<3;i++){
  const c=cue('dimensions_'+i),focus=ease(t,c.start-.2,c.start+.4)*(1-ease(t,c.end+.05,c.end+.4));
  const x=225+i*315,y=mix(690,645,split)-10*focus;
  q.save();q.globalAlpha*=split;
  const grad=q.createLinearGradient(x-135,y-60,x+135,y+80);grad.addColorStop(0,'rgba(208,170,94,.23)');grad.addColorStop(1,'rgba(30,27,22,.88)');q.fillStyle=grad;q.strokeStyle=focus>.2?'#e8c77f':'#7c6845';q.lineWidth=1.5+focus;
  rounded(q,x-138,y-54,276,106,8);q.fill();q.stroke();text(q,labels[i],x,y+14,40+focus*2,focus>.2?ivory:'#bdb09a','FilmSerif',500,'center');
  const py=m.y-430*m.z,px=m.x+(i-1)*170*m.z;line(q,[[x,y+55],[x,y+140],[px,py]],ease(t,c.start-.3,c.start+.7),'rgba(213,179,113,'+(.23+.42*focus)+')',1.4);
  q.restore();
 }
 // An expanding area expresses a research scope; no plotted series, scale, or returns.
 const market=ease(t,cue('dimensions_1').start,cue('dimensions_1').start+.85);
 if(market){const fade=1-ease(t,C.boundary.start+.4,C.boundary.start+2.1);for(let i=0;i<8;i++){const angle=i*Math.PI/4;const xx=m.x+Math.cos(angle)*(300+170*market),yy=m.y-240+Math.sin(angle)*210;line(q,[[m.x,m.y-320],[xx,yy]],market,'rgba(213,179,113,'+.25*fade+')',1);q.fillStyle='rgba(223,193,131,'+.65*fade+')';q.beginPath();q.arc(xx,yy,4,0,Math.PI*2);q.fill()}}
 const moat=ease(t,cue('dimensions_2').start,cue('dimensions_2').start+1.0);if(moat)ring(q,m.x,m.y+12,425,82,moat,.7);
 const glow=ease(t,cue('dimensions_0').start,cue('dimensions_0').start+.45)*(1-ease(t,cue('dimensions_1').start,cue('dimensions_1').start+.4));
 if(glow){q.strokeStyle='rgba(246,213,146,'+glow*.85+')';q.lineWidth=2.5;q.beginPath();q.ellipse(m.x+65,m.y-350*m.z,150,180,0,0,Math.PI*2);q.stroke()}
 q.restore();
}
function boundary(t){
 const a=ease(t,C.boundary.start+.25,C.boundary.start+1)*(1-ease(t,C.sources.start-.8,C.sources.start+.3));if(!a)return;
 q.save();q.globalAlpha=a;const shade=q.createLinearGradient(0,480,0,945);shade.addColorStop(0,'rgba(8,9,8,0)');shade.addColorStop(.35,'rgba(8,9,8,.9)');shade.addColorStop(.7,'rgba(8,9,8,.8)');shade.addColorStop(1,'rgba(8,9,8,0)');q.fillStyle=shade;q.fillRect(130,480,820,465);text(q,'研究维度',540,650,57,ivory,'FilmSerif',500,'center');
 const p=ease(t,cue('boundary_1').start,cue('boundary_1').start+.7);text(q,'≠',540,755,64,gold,'FilmSans',400,'center');
 q.globalAlpha*=p;text(q,'投资结果保证',540,850,49,'#d2bd96','FilmSerif',500,'center');q.restore();
}
function paper(ctx,x,y,w,angle,title,small='研究线索',alpha=1){
 ctx.save();ctx.globalAlpha*=alpha;ctx.translate(x,y);ctx.rotate(angle);ctx.shadowColor='rgba(0,0,0,.4)';ctx.shadowBlur=25;ctx.shadowOffsetY=12;
 const gr=ctx.createLinearGradient(-w/2,-w*.5,w/2,w*.5);gr.addColorStop(0,'#f0e3c9');gr.addColorStop(1,'#bca783');ctx.fillStyle=gr;rounded(ctx,-w/2,-w*.52,w,w*1.04,5);ctx.fill();ctx.shadowBlur=0;ctx.shadowOffsetY=0;ctx.strokeStyle='#8b7048';ctx.lineWidth=1;ctx.stroke();
 text(ctx,title,0,-w*.18,w*.123,'#322b21','FilmSerif',500,'center');line(ctx,[[-w*.34,0],[w*.34,0]],1,'#a68b61',1);
 text(ctx,small,0,w*.17,w*.085,'#6d5b41','FilmSans',450,'center');
 for(let i=0;i<3;i++)line(ctx,[[-w*.29,w*(.27+i*.065)],[w*(.27-i*.055),w*(.27+i*.065)]],1,'rgba(90,70,40,.25)',1);ctx.restore();
}
function pedestal(t,m){
 const a=ease(t,C.sources.start-2.3,C.sources.start+1.6)*(1-ease(t,C.return.start,C.return.start+3.5));if(!a)return;
 q.save();q.globalAlpha=a;
 const rx=210,ry=32,top=m.y-12,base=Math.max(top+20,1290);
 const grad=q.createLinearGradient(m.x-rx,0,m.x+rx,0);grad.addColorStop(0,'#171714');grad.addColorStop(.25,'#353329');grad.addColorStop(.7,'#111210');grad.addColorStop(1,'#302b20');
 q.fillStyle=grad;q.beginPath();q.moveTo(m.x-rx,top);q.lineTo(m.x-rx,base);q.ellipse(m.x,base,rx,ry,0,Math.PI,0,true);q.lineTo(m.x+rx,top);q.closePath();q.fill();
 q.fillStyle='#292a22';q.beginPath();q.ellipse(m.x,top,rx,ry,0,0,Math.PI*2);q.fill();q.strokeStyle='#8d7447';q.lineWidth=2;q.stroke();
 q.strokeStyle='rgba(165,139,81,.22)';for(let i=-2;i<=2;i++){q.beginPath();q.moveTo(m.x+i*65,top+ry);q.lineTo(m.x+i*65,base);q.stroke()}q.restore();
}
function bookState(t){
 const enter=ease(t,C.sources.start-1,C.sources.start+1.6);if(enter<=0)return null;
 const leave=ease(t,C.return.start,C.return.start+3.5);return {x:mix(540,265,leave),y:mix(1790,1300,enter)+205*leave,w:mix(980,425,leave),a:mix(-.075,0,enter)-.06*leave,enter,leave};
}
function notebook(t){
 const b=bookState(t);if(!b)return;
 q.save();q.translate(b.x,b.y);q.rotate(b.a);q.scale(b.w/980,b.w/980);q.drawImage(art.notebook,-490,-326.667,980,653.333);
 const ink='#443323';
 text(q,'研究笔记',-318,-135,44,ink,'FilmSerif',500);text(q,'问题与依据',64,-135,42,ink,'FilmSerif',500);
 const p=ease(t,C.organize.start+.3,C.organize.start+2.3),check=ease(t,C.verify.start,C.verify.start+2.0);
 const rows=[['来源',-70],['线索',10],['待核验',90]];
 for(let i=0;i<rows.length;i++){const amount=clamp(p*3-i);if(amount){q.save();q.globalAlpha=amount;text(q,rows[i][0],-325,rows[i][1],35,ink);line(q,[[-200,rows[i][1]-8],[-65,rows[i][1]-8]],amount,'#947449',1.6);q.restore()}}
 if(t>=C.organize.start+2.4){q.save();q.globalAlpha=ease(t,C.organize.start+2.4,C.organize.start+3.4);text(q,'仍待验证',75,-25,40,'#79562e','FilmSerif',500);q.restore()}
 q.save();q.globalAlpha=check;text(q,'独立思考',75,68,40,ink,'FilmSerif',500);text(q,'自主逻辑校验',75,132,40,ink,'FilmSerif',500);line(q,[[75,145],[315,145]],check,'#a57b39',2);q.restore();q.restore();
}
function information(t){
 if(t<C.sources.start||t>C.return.start+1)return;
 const gate=ease(t,C.sources.start,C.sources.start+.9)*(1-ease(t,C.verify.start-.5,C.verify.start+.6));
 const ingest=ease(t,C.organize.start+.25,C.organize.start+2.0);
 const names=['外部大脑','信息源'];
 for(let i=0;i<2;i++){
  const e=ease(t,C.sources.start+.45+i*.65,C.sources.start+1.8+i*.65),p=ease(t,C.organize.start+i*.55,C.organize.start+2.1+i*.55);
  if(e>0&&p<1){paper(q,mix(i?1280:-260,i?560:225,e)+mix(0,i?145:95,p),mix(765,1260,p),mix(260,155,p),mix(i?.08:-.09,0,p),names[i],'来源线索',1-p*.92)}
 }
 const ai=ease(t,cue('sources_3').start-.3,cue('sources_3').start+.7)*(1-ease(t,C.verify.start-1,C.verify.start));
 if(ai){q.save();q.globalAlpha=ai;const y=mix(905,925,ingest);q.strokeStyle=gold;q.fillStyle='rgba(16,17,15,.92)';q.lineWidth=2;rounded(q,405,y-48,270,100,50);q.fill();q.stroke();text(q,'AI Agent',540,y+15,42,ivory,'FilmSans',450,'center');
 line(q,[[250,880],[250,925],[395,925]],ai,'#b89b64',2);line(q,[[560,880],[560,885]],ai,'#b89b64',2);line(q,[[540,975],[540,1070],[385,1135]],ease(t,cue('sources_4').start,cue('sources_4').end),'#b89b64',2);
 const flow=clamp((t-cue('sources_4').start)/Math.max(.1,cue('sources_4').end-cue('sources_4').start));q.fillStyle='#e6c88e';q.beginPath();q.arc(540,975+90*flow,5,0,Math.PI*2);q.fill();q.restore()}
 if(t>=C.organize.start+2.0&&t<C.verify.start+.4){const a=ease(t,C.organize.start+2,C.organize.start+3)*(1-ease(t,C.verify.start-.2,C.verify.start+.4));q.save();q.globalAlpha=a;text(q,'整理信息  ≠  验证结论',540,680,48,gold,'FilmSerif',500,'center');q.restore()}
}
function typography(t){
 let ch=F.chapters.find(c=>t>=c.start&&t<c.end)||F.chapters.at(-1);
 let title=ch.title,sub='',size=86;
 if(ch.id==='intro'){title=t*8/C.intro.end<3.25?'创造价值':'观察价值';sub=title==='创造价值'?'从企业内部，参与创造。':'换一个位置，继续研究。';size=100}
 else if(ch.id==='history')sub='经历与体系 · 作者自述';
 else if(['framework','dimensions','boundary'].includes(ch.id))sub='研究维度示意 · 不代表企业数据';
 else if(['sources','organize','verify'].includes(ch.id))sub='信息处理流程示意';
 else if(ch.id==='return')sub='视角改变，企业仍是研究对象。';
 else if(ch.id==='limits'){
   if(t<cue('limits_2').start){title='仅观点分享';sub='非投资建议'}
   else if(t<cue('limits_4').start){title='仅供复盘参考';sub='不具实操指向';size=82}
   else{title='理解复杂变量';sub='保持独立思考与自主逻辑校验';size=82}
 }
 const mask=g.createLinearGradient(0,0,0,570);mask.addColorStop(0,'rgba(7,8,8,.76)');mask.addColorStop(.65,'rgba(7,8,8,.4)');mask.addColorStop(1,'rgba(7,8,8,0)');g.fillStyle=mask;g.fillRect(0,0,W,570);
 text(g,'凯撒的复利实验室',82,120,27,'#c7bda9');line(g,[[82,153],[998,153]],1,'rgba(213,179,113,.55)',1);
 // A brief travel, not a long fade, accompanies each chapter boundary.
 const titleIn=ease(t,ch.start,ch.start+.28);g.save();g.globalAlpha=.75+.25*titleIn;g.translate(0,10*(1-titleIn));text(g,title,78,296,size,ivory,'FilmSerif',500);text(g,sub,84,356,30,'#c0ad8b','FilmSans',400);g.restore();
 const bottom=g.createLinearGradient(0,1520,0,H);bottom.addColorStop(0,'rgba(7,8,8,0)');bottom.addColorStop(.46,'rgba(7,8,8,.66)');bottom.addColorStop(1,'rgba(7,8,8,.92)');g.fillStyle=bottom;g.fillRect(0,1520,W,H-1520);
 const c=F.cues.find(c=>t>=c.start&&t<=c.end+.025);
 if(c&&!new URLSearchParams(location.search).has('clean')){let fs=45;g.font='450 '+fs+'px FilmSans';while(g.measureText(c.text).width>930){fs--;g.font='450 '+fs+'px FilmSans'}text(g,c.text,540,1737,fs,'#f1eadd','FilmSans',450,'center')}
 text(g,'作者观点 · 场景示意',540,1830,27,'#b4a995','FilmSans',400,'center');
}
window.render=function(t){
 t=Math.max(0,Math.min(F.duration-.001,t));
 q.setTransform(1,0,0,1,0,0);q.globalAlpha=1;q.filter='none';
 const m=modelState(t);const drift=Math.sin(t/F.duration*Math.PI)*12;
 cover(q,art.background,540+drift,960+mix(-32,14,m.pull),mix(1.055,1.005,m.pull));
 const veil=q.createLinearGradient(0,0,0,H);veil.addColorStop(0,'rgba(4,5,5,.20)');veil.addColorStop(.45,'rgba(5,5,5,.06)');veil.addColorStop(1,'rgba(4,4,4,.16)');q.fillStyle=veil;q.fillRect(0,0,W,H);
 pedestal(t,m);model(q,m.x,m.y,m.z,m.roof);history(t);research(t,m);boundary(t);notebook(t);information(t);
 g.setTransform(1,0,0,1,0,0);g.globalAlpha=1;g.filter='none';g.drawImage(scene,0,0);drawLens(lenses(t));observer(t);
 const vig=g.createRadialGradient(510,1010,420,540,980,1170);vig.addColorStop(0,'rgba(0,0,0,0)');vig.addColorStop(1,'rgba(0,0,0,.28)');g.fillStyle=vig;g.fillRect(0,0,W,H);typography(t);
 window.currentFrameInfo={t,model:m,lens:lenses(t),chapter:F.chapters.find(c=>t>=c.start&&t<c.end)?.id};
};
window.renderFrame=window.render;
window.meta={duration:F.duration,width:W,height:H,fps:30,technique:'Approved layered photographic assets, continuous 2.5D motion, deterministic Canvas',chapters:F.chapters.map(c=>({id:c.id,start:c.start,end:c.end})),cuts:[]};
window.ready=true;window.render(0);
})().catch(e=>{window.productionError=String(e);console.error(e)});
