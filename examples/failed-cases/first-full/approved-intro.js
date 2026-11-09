/* Sample composition. Assets generated as separate layers. Existing Poisson renderer handles capture. */
(async function(){
'use strict';
const W=1080,H=1920;
const canvas=document.getElementById('film'),g=canvas.getContext('2d',{alpha:false});
const scene=document.createElement('canvas');scene.width=W;scene.height=H;
const q=scene.getContext('2d',{alpha:false});
const art={};
await Promise.all(['background','body','roof','observer','lens'].map(async name=>{
 const im=new Image();im.src='assets/'+name+'.png';await im.decode();art[name]=im;
}));
await Promise.all([document.fonts.load('500 88px FilmSerif'),document.fonts.load('450 44px FilmSans')]);
await document.fonts.ready;
const clamp=x=>Math.max(0,Math.min(1,x));
const smoother=x=>{x=clamp(x);return x*x*x*(x*(x*6-15)+10)};
const ease=(t,a,b)=>smoother((t-a)/(b-a));
const mix=(a,b,t)=>a+(b-a)*t;
function text(ctx,s,x,y,size,color='#f0e7d6',font='FilmSans',weight=450,align='left'){
 ctx.save();ctx.font=weight+' '+size+'px '+font;ctx.textAlign=align;ctx.textBaseline='alphabetic';ctx.fillStyle=color;ctx.fillText(s,x,y);ctx.restore();
}
function cover(ctx,im,cx,cy,scale=1){
 const s=Math.max(W/im.width,H/im.height)*scale,ww=im.width*s,hh=im.height*s;
 ctx.drawImage(im,cx-ww/2,cy-hh/2,ww,hh);
}
function stage(t){
 const pull=ease(t,1.75,4.6);
 const slow=ease(t,0,8);
 const zoom=mix(1.13,.80,pull)-.015*slow;
 const anchorX=mix(565,492,pull)-4*slow;
 const anchorY=mix(1480,1365,pull);
 // Different depth layers travel at different speeds; no change of viewing angle.
 cover(q,art.background,W/2+mix(-12,7,pull),H/2+mix(-32,14,pull),mix(1.055,1.005,pull));
 const veil=q.createLinearGradient(0,0,0,H);
 veil.addColorStop(0,'rgba(4,5,5,.20)');veil.addColorStop(.45,'rgba(5,5,5,.06)');veil.addColorStop(1,'rgba(4,4,4,.16)');
 q.fillStyle=veil;q.fillRect(0,0,W,H);
 q.save();q.translate(anchorX,anchorY);q.scale(zoom,zoom);
 // Contact shadow ties the independently composited model to the workbench.
 q.save();q.translate(0,0);q.scale(1,.19);
 const sh=q.createRadialGradient(0,0,90,0,0,515);sh.addColorStop(0,'rgba(0,0,0,.82)');sh.addColorStop(.65,'rgba(0,0,0,.38)');sh.addColorStop(1,'rgba(0,0,0,0)');
 q.fillStyle=sh;q.fillRect(-540,-540,1080,1080);q.restore();
 q.drawImage(art.body,-500,-902,1000,1000);
 const settle=1.95, descend=ease(t,-.3,settle);
 const offset=-230*(1-descend);
 const drift=-14*(1-descend);
 // A short, restrained settling motion carries the perceived weight.
 const age=t-settle;
 const weight=age>0&&age<.6 ? 1.2*Math.sin(age*22)*Math.exp(-age*13) : 0;
 // Roof dimensions aligned to the source model's upper seat.
 q.drawImage(art.roof,-163.5+drift,-733+offset+weight,423,160);
 // Two delicate construction guides fade before contact; not a permanent infographic.
 if(t<1.8){
  const a=.12*(1-ease(t,1.2,1.8));q.strokeStyle='rgba(233,201,146,'+a+')';q.lineWidth=1;q.setLineDash([3,10]);
  for(const xx of [-100,165]){q.beginPath();q.moveTo(xx,-650+offset);q.lineTo(xx,-650);q.stroke()}q.setLineDash([]);
 }
 q.restore();
 return {pull,zoom,anchorX,anchorY,roofOffset:offset};
}
function lens(t,s){
 const progress=ease(t,3.05,4.85);
 if(progress<=0)return null;
 const focus=ease(t,5.35,6.5);
 const cx=mix(-780,478,progress)-10*focus;
 const cy=1055-10*focus;
 const scale=mix(1.20,.96,progress)+.055*focus;
 const tilt=mix(-.065,-.012,progress);
 const ellipse=mix(.86,1,progress);
 // Transparent center has an optical treatment generated from this very same frame.
 // No alternate building or model is substituted inside the lens.
 g.save();g.translate(cx,cy);g.rotate(tilt);g.scale(ellipse,1);
 g.beginPath();g.arc(0,0,369*scale,0,Math.PI*2);g.clip();
 g.setTransform(1,0,0,1,0,0);
 const mag=mix(1.025,1.075,focus);
 g.drawImage(scene,cx-cx*mag,cy-cy*mag,W*mag,H*mag);
 const reflection=g.createLinearGradient(cx-350,cy-380,cx+250,cy+340);
 reflection.addColorStop(0,'rgba(235,224,191,.055)');reflection.addColorStop(.4,'rgba(199,211,199,.012)');reflection.addColorStop(1,'rgba(13,20,21,.045)');
 g.fillStyle=reflection;g.fillRect(cx-500,cy-500,1000,1000);g.restore();
 // Photographic brass rim and pedestal. Interior alpha preserves model identity.
 g.save();g.translate(cx,cy);g.rotate(tilt);g.scale(scale*ellipse,scale);
 g.drawImage(art.lens,-513,-471);g.restore();
 return {cx,cy,scale};
}
function foreground(t){
 const pull=ease(t,2.9,5.2);
 if(pull<=0)return;
 const x=mix(1280,410,pull),y=mix(705,790,pull);
 const w=mix(810,790,pull),h=w*1.5;
 g.save();g.filter='blur('+mix(5.5,2.5,pull)+'px)';g.drawImage(art.observer,x,y,w,h);g.restore();
}
function typography(t){
 const toResearch=ease(t,3.05,3.45);
 const mask=g.createLinearGradient(0,0,0,590);mask.addColorStop(0,'rgba(7,8,8,.72)');mask.addColorStop(.65,'rgba(7,8,8,.36)');mask.addColorStop(1,'rgba(7,8,8,0)');
 g.fillStyle=mask;g.fillRect(0,0,W,590);
 text(g,'凯撒的复利实验室',82,120,27,'#c7bda9','FilmSans',450);
 g.strokeStyle='rgba(213,179,113,.55)';g.lineWidth=1;g.beginPath();g.moveTo(82,153);g.lineTo(998,153);g.stroke();
 g.save();g.globalAlpha=1-toResearch;g.translate(0,-22*toResearch);
 text(g,'创造价值',78,296,100,'#eee7d5','FilmSerif',500);
 text(g,'从企业内部，参与创造。',84,356,31,'#c0ad8b','FilmSans',400);g.restore();
 g.save();g.globalAlpha=toResearch;g.translate(0,22*(1-toResearch));
 text(g,'观察价值',78,296,100,'#eee7d5','FilmSerif',500);
 text(g,'换一个位置，继续研究。',84,356,31,'#c0ad8b','FilmSans',400);g.restore();
 const bottom=g.createLinearGradient(0,1520,0,H);
 bottom.addColorStop(0,'rgba(7,8,8,0)');bottom.addColorStop(.46,'rgba(7,8,8,.66)');bottom.addColorStop(1,'rgba(7,8,8,.92)');
 g.fillStyle=bottom;g.fillRect(0,1520,W,H-1520);
 const cue=window.AUDIO.cues.find(c=>t>=c.start&&t<=c.end+.035);
 if(cue){text(g,cue.text,W/2,1737,45,'#f1eadd','FilmSans',450,'center')}
 text(g,'作者自述 · 场景示意',W/2,1830,27,'#b4a995','FilmSans',400,'center');
}
window.render=function(t){
 t=Math.max(0,Math.min(7.999,t));
 q.setTransform(1,0,0,1,0,0);q.globalAlpha=1;q.filter='none';
 const state=stage(t);
 g.setTransform(1,0,0,1,0,0);g.globalAlpha=1;g.filter='none';
 g.drawImage(scene,0,0);const ls=lens(t,state);foreground(t);
 // Restrained optical vignette keeps attention on the model.
 const vig=g.createRadialGradient(510,1010,420,540,980,1170);vig.addColorStop(0,'rgba(0,0,0,0)');vig.addColorStop(1,'rgba(0,0,0,.28)');
 g.fillStyle=vig;g.fillRect(0,0,W,H);
 typography(t);
 window.currentFrameInfo={t,...state,lens:ls};
};
window.renderFrame=window.render;
window.meta={duration:8,width:W,height:H,fps:30,technique:'Layered image assets + continuous 2.5D camera, deterministic Canvas composition',cuts:[],actions:{roofSeated:1.95,cameraPullback:[1.75,4.6],lensEnter:[3.05,4.85],observerReveal:[2.9,5.2],focus:[5.35,6.5]}};
window.ready=true;window.render(0);
})().catch(e=>{window.productionError=String(e);console.error(e)});

