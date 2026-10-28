import {g,W,H,C,clamp,mix,smooth,ease,out,range,hash,TAU,alpha,line,poly,rect,circle,dot,txt,textIn,caption,chapter,title,param,background,bracket,arrow,dashed,streak,person,math,mathWidth,frameWindow,probabilities,intervalAxis,beatPulse} from './core.js';
function gate(x,y,w,h,label,t,open){
 g.save();g.translate(x,y);g.transform(1,.08,-.18,1,0,0);
 poly([[0,0],[0,-h],[w,-h],[w,0],[0,0]],C.gold,1.45,'#1a211712',true);
 poly([[10,-12],[10,-h+12],[w-10,-h+12],[w-10,-12]],C.gold,.7);
 rect(w*.07,-h-57,w*.86,49,C.gold,'#0b1010',1);
 txt(label,w*.5,-h-20,30,C.ink,'center');
 const mesh=label==='估值'?9:label==='风险'?6:5;
 for(let i=1;i<mesh;i++){line(w*i/mesh,-h+12,w*i/mesh,-12,C.gold,.75,.24);if(label!=='流动性')line(10,-h+h*i/mesh,w-10,-h+h*i/mesh,C.gold,.75,.24)}
 const scan=((t*.35)%1)*h;alpha(.35*open,()=>line(10,-h+scan,w-10,-h+scan,C.gold,2));
 for(const [xx,yy]of[[0,0],[w,0],[0,-h],[w,-h]])circle(xx,yy,3,C.gold);
 g.restore();
}
export function investment(t,T){
 background(T,false,.24);chapter(8,'投资类比');title('到达 ≠ 值得出手',t,0,false,91);
 textIn('等待时间，不能代替判断。',96,266,38,t,.3,C.gold);
 const planes=[{x:660,y:700,w:220,h:320,label:'估值',in:1.4},{x:1030,y:728,w:220,h:320,label:'风险',in:3},{x:1400,y:756,w:220,h:320,label:'流动性',in:4.5}];
 const vanishx=1860;
 for(let lane=0;lane<8;lane++){
  const sy=358+lane*44,ey=570+lane*18;
  line(-80,sy,vanishx,ey,C.gold,.8,.10);
 }
 // Each event is tracked through three different checks; failed events stop and fade.
 for(let i=0;i<105;i++){
  const lane=Math.floor(hash(i+11)*8),sy=358+lane*44,ey=570+lane*18;
  const cycle=6+hash(i+82)*5,phase=hash(i+37)*cycle,age=((t+phase)%cycle);
  let x=-100+age*240;
  const quality=hash(i+901),stop=quality<.48?660:quality<.79?1030:quality<.94?1400:2000;
  const active=planes.filter(p=>t>p.in+.3);
  const threshold=active.filter(p=>p.x>=stop).map(p=>p.x)[0];
  let fade=1;if(threshold&&x>threshold){fade=1-clamp((x-threshold)/135);x=threshold+(x-threshold)*.05}
  if(x>1860||fade<=0)continue;
  const y=mix(sy,ey,(x+80)/1940);
  const gold=quality>.94&&x>1400;
  alpha(fade*.8,()=>{line(x-14,y-1,x,y,gold?C.gold:C.ink,1.2,.3);dot(x,y,gold?4.5:2.7,gold?C.gold:C.ink,gold)});
 }
 planes.forEach(p=>{const a=out(t,p.in,p.in+.45);alpha(a,()=>gate(p.x,p.y+65*(1-a),p.w,p.h,p.label,T,a))});
 alpha(out(t,5.85,6.45),()=>{
  person(1575,938,1.04,T,C.ink);
  const inspect=out(t,6.4,7.0);
  dot(1603,790,6*inspect,C.gold,true);circle(1603,790,23,C.gold,.8);
  const bx=1210,by=912;
  poly([[bx,by],[bx+70,by-25],[bx+160,by-8],[bx+90,by+18],[bx,by],[bx,by-37],[bx+90,by-18],[bx+160,by-44],[bx+160,by-8]],C.gold,1.2);
  line(bx+90,by-18,bx+90,by+18,C.gold,1.2);
  txt('保留行动空间',bx+80,966,23,C.gold,'center','sans');
 });
 if(t>7.7)alpha(out(t,7.7,8.1),()=>{rect(92,804,1020,100,null,'#0a0e0dee');txt('泊松描述到达，判断决定行动。',104,866,43,C.ink)});
 if(t<5.6)caption('到达之后，还要看估值、风险和流动性。',t,.3);
 else caption('投资仅作类比，真实市场未必满足模型假设。',t,5.6);
}
export function ending(t,T){
 background(T,false,.92);chapter(9,'关于等待的数学');
 const p=out(t,0,.8);
 alpha(p,()=>{
  g.save();g.translate(0,7*Math.sin(T*.35));
  const start=[86,924],end=[1800,649];
  line(...start,...end,C.gold,1.3,.6);
  for(let i=0;i<15;i++){
   const u=i/14,x=mix(start[0],end[0],u),y=mix(start[1],end[1],u);
   if(i<3)dot(x,y,3.3,C.gold,true);else circle(x,y,3.7,C.gold,1);
  }
  person(478,867,1.35,T,C.ink);
  circle(631,835,27,C.gold,1.9);circle(631,835,31+beatPulse(T)*4,C.gold,.55);
  const arcs=[{x:640,w:280,h:115,phase:.1},{x:917,w:243,h:163,phase:1.4},{x:1160,w:343,h:252,phase:2.2},{x:1505,w:278,h:357,phase:3.3}];
  for(let k=0;k<arcs.length;k++){
   const a=arcs[k],show=out(t,a.phase,a.phase+.5);alpha(show*.65,()=>{
    g.save();g.setLineDash([3,7]);g.beginPath();for(let i=0;i<=70;i++){const u=i/70,x=a.x+a.w*u,y=mix(833-k*46,787-k*46,u)-Math.sin(u*Math.PI)*a.h;i?g.lineTo(x,y):g.moveTo(x,y)}g.strokeStyle=C.gold;g.lineWidth=1;g.stroke();g.restore();
    const u=((t-a.phase)*.37)%1;
    if(u>=0){const x=a.x+a.w*u,y=mix(833-k*46,787-k*46,u)-Math.sin(u*Math.PI)*a.h;dot(x,y,3.8,C.gold,true)}
   })
  }
  txt('此刻',632,916,28,C.gold,'center','sans');
  g.restore();
 });
 textIn('不因久等，降低标准。',96,196,92,t,.2,C.ink);
 textIn('机会到来时，仍有能力行动。',101,305,57,t,2.1,C.gold);
 alpha(out(t,5.0,5.45),()=>{txt('凯撒的复利实验室',1796,951,37,C.ink,'right');txt('人生哲学 & 投资修行',1796,1005,23,C.gold,'right','sans')});
}
