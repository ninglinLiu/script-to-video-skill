// Executable adaptations of the film's actual explanatory shots, not style-only cards.
// Every moving semantic object is both drawn here and recorded in the returned trace.
import {g,C,clamp,mix,smooth,alpha,line,rect,dot,txt,person,frameWindow,arrow} from './core.js';
const states=[];
let carry=null,carryProgress=1;
export function setCarry(objects=null,p=1){carry=objects?new Map(objects.map(v=>[v.id,v])):null;carryProgress=p;}
function mark(id,kind,x,y,value){const p=g.getTransform().transformPoint({x,y});states.push({id,kind,x:+p.x.toFixed(3),y:+p.y.toFixed(3),value});}
function point(id,x,y,value,color=C.gold,r=6){const old=carry?.get(id);if(old){x=mix(old.x,x,carryProgress);y=mix(old.y,y,carryProgress);}dot(x,y,r,color);mark(id,'point',x,y,value);}
function box(id,x,y,w,h,value,light){frameWindow(x,y,w,h,1,light?C.goldDark:C.gold,true);mark(id,'window',x,y,{width:w,height:h,value});}
const ink=s=>s.surface==='paper'?C.dark:C.ink;
const gold=s=>s.surface==='paper'?C.goldDark:C.gold;
function label(s,text,x,y,size=32){txt(text,x,y,size,ink(s),'center','sans');}
export function progress(shot,t){return smooth((t-shot.actionStart)/(shot.actionEnd-shot.actionStart));}
function spatial(s,p,t){
 const d=s.data,n=d.labels.length,scale=mix(1.3,1,p);
 g.save();g.translate(960,570);g.scale(scale,scale);g.translate(-960,-570);
 for(let i=n-1;i>=0;i--){const depth=i/(n-1||1),w=mix(1000,340,depth),h=w*.48;
  const x=960-w/2+depth*95,y=580-h/2-depth*35;
  alpha(.25+.75*(1-depth),()=>{box(s.object+':'+i,x,y,w,h,d.labels[i],false);label(s,d.labels[i],x+w/2,y+h+42,28)});}
 person(480,880,.85,t);g.restore();
}
function events(s,p){
 const d=s.data,n=d.positions.length;
 line(210,560,1710,560,gold(s),2);
 d.positions.forEach((v,i)=>{const x=mix(240+i*1440/(n-1),240+v*1440,p);point(s.object+':'+i,x,560,v,gold(s));});
 label(s,d.before,580,715);label(s,d.after,1340,715);
 arrow(810,700,1110,700,gold(s));
}
function histogram(s,p){
 const d=s.data,n=d.labels.length,counts=d.labels.map((_,i)=>d.samples.filter(v=>v===i).length);
 const max=Math.max(...counts,1),gap=1380/n,w=Math.min(100,gap*.62),base=820;
 const motion=d.samples.map((_,i)=>smooth(clamp((p-i/d.samples.length*.4)/.6)));
 const arrived=d.labels.map((_,bin)=>d.samples.filter((v,i)=>v===bin&&motion[i]>=.999).length);
 line(260,base,1700,base,gold(s),2);
 d.labels.forEach((v,i)=>{
  const x=300+i*gap,h=arrived[i]/max*360;
  rect(x,base-h,w,h,null,gold(s));mark(s.object+':bin:'+i,'bar',x,base-h,arrived[i]);
  label(s,v,x+w/2,868,28);alpha(p,()=>label(s,String(arrived[i])+d.unit,x+w/2,base-h-23,32));
 });
 const used=d.labels.map(()=>0);
 d.samples.forEach((bin,i)=>{
  const rank=used[bin]++,u=motion[i],x=mix(300+i%20*65,300+bin*gap+w/2,u);
  const y=mix(300+Math.floor(i/20)*38,base-(rank+.5)*360/max,u);
  alpha(1-.8*u,()=>point(s.object+':'+i,x,y,bin,gold(s),4));
 });
}
function windows(s,p){
 const d=s.data,scale=620/Math.max(...d.values),phase=p<.42?smooth(p/.42):p<.64?1:1-smooth((p-.64)/.36);
 const rows=[400,710],center=555;
 rows.forEach((y,i)=>{
  label(s,d.labels[i],330,y+45,36);line(510,y+60,1630,y+60,gold(s),1.3,.4);
  const yy=mix(y,center,phase),x=mix(850,800,phase),w=d.values[i]*scale;
  alpha(.38,()=>rect(550,y,240,120,gold(s),null));
  box(s.object+':'+i,x,yy,w,120,d.values[i],s.surface==='paper');
  label(s,String(d.values[i])+d.unit,x+w/2,yy+75,42);
 });
 // The overlap is a visible comparison action. It is not evidence of equal values.
}
function tokenLayout(tokens){let x=960-tokens.reduce((v,z)=>v+z.text.length*36+26,0)/2;return tokens.map(z=>{const o={...z,x,y:555};x+=z.text.length*36+26;return o});}
function formula(s,p){
 const a=tokenLayout(s.data.before),b=tokenLayout(s.data.after),left=new Map(a.map(v=>[v.id,v])),right=new Map(b.map(v=>[v.id,v]));
 for(const id of new Set([...left.keys(),...right.keys()])){
  const x0=left.get(id),x1=right.get(id),u=p;
  const x=mix(x0?.x??x1.x,x1?.x??x0.x,u),y=mix(x0?.y??650,x1?.y??460,u),v=x1||x0;
  const opacity=x0&&x1?1:x0?1-u:u;
  alpha(opacity,()=>{txt(v.text,x,y,58,ink(s),'left','serif');mark(s.object+':'+id,'token',x,y,v.text);
   if(x0&&!x1&&u>.1)line(x,y-20,x+v.text.length*36*clamp(u*2),y-20,C.red,3);});
 }
 label(s,s.data.explanation,960,760,34);
}
function curve(s,p){
 const d=s.data,pts=d.points,xmin=pts[0][0],xmax=pts.at(-1)[0],ymax=d.yMax;
 const xy=v=>[290+(v[0]-xmin)/(xmax-xmin)*1340,820-v[1]/ymax*490];
 line(290,820,1650,820,gold(s),2);line(290,820,290,300,gold(s),2);
 const k=p*(pts.length-1),last=Math.floor(k);
 for(let i=1;i<=last;i++)line(...xy(pts[i-1]),...xy(pts[i]),gold(s),4);
 if(last<pts.length-1){const a=xy(pts[last]),b=xy(pts[last+1]);line(...a,mix(a[0],b[0],k-last),mix(a[1],b[1],k-last),gold(s),4);}
 pts.forEach((v,i)=>{const [x,y]=xy(v);if(i<=k){point(s.object+':'+i,x,y,v,gold(s));label(s,String(v[1])+d.unit,x,y-28,30);}label(s,String(v[0]),x,866,28);});
 label(s,d.xLabel,1510,920,28);
}
function filters(s,p){
 const d=s.data,xs=d.stages.map((_,i)=>650+i*360),levels=d.items;
 d.stages.forEach((v,i)=>{box(s.object+':gate:'+i,xs[i],320,110,470,v,false);label(s,v,xs[i]+55,283,32);});
 levels.forEach((passed,i)=>{
  const limit=passed<d.stages.length?xs[passed]+44:1770;
  const travel=clamp((p*1.35-i/levels.length*.28)),x=Math.min(mix(220,1830,travel),limit),y=390+(i%7)*48;
  point(s.object+':'+i,x,y,{passed,stopped:x===limit&&passed<d.stages.length},gold(s),4);
  if(x===limit&&passed<d.stages.length)line(x-6,y-6,x+6,y+6,C.red,2);
 });
}
const recipes={spatial,events,histogram,windows,formula,curve,filters};
export function drawRecipe(s,t){states.length=0;const p=progress(s,t);recipes[s.recipe](s,p,t);return {progress:p,objects:states.map(x=>({...x}))};}
