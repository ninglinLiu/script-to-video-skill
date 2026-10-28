import {g,W,H,C,clamp,mix,smooth,ease,out,range,hash,TAU,alpha,line,poly,rect,circle,dot,txt,textIn,caption,chapter,title,param,background,bracket,arrow,dashed,streak,person,math,mathWidth,frameWindow,probabilities,intervalAxis,beatPulse} from './core.js';
export function comparison(t,T){
 background(T);chapter(5,'比较同样长的未来');title('等得更久，概率会加码吗？',t,0,false,72);param();
 const x0=185,unit=370,now=x0+unit*3,end=now+unit,yt=430,yb=738,h=132;
 alpha(out(t,.15,.6),()=>{dashed(now,310,now,932,C.gold,1.7);txt('现在',now,292,35,C.ink,'center')});
 const u0=out(t,.55,1.2);
 alpha(u0,()=>{
  txt('刚开始等',575,yt+80,43,C.ink,'center');
  line(820,yt+h/2,now,yt+h/2,C.ink,1.6);
  frameWindow(now,yt,unit,h,1,C.gold,true);
  txt('未来 1 分钟',now+unit/2,yt+h+49,28,C.gold,'center','sans');
  const rv=out(t,1.45,1.9);alpha(rv,()=>txt('63.2%',now+unit/2,yt+89,73,C.gold,'center','math'));
  dot(now,yt+h/2,6,C.gold);
 });
 for(let i=0;i<3;i++){
  const a=out(t,3.65+i*.58,4.1+i*.58),x=x0+unit*i;
  alpha(a,()=>{
   frameWindow(x,yb,unit,h,1,C.dim);
   const scan=range(t,5.1+i*.25,5.6+i*.25);
   alpha(.2*(1-range(t,8,9)),()=>line(x+unit*scan,yb,x+unit*scan,yb+h,C.gold));
   txt('1 分钟',x+unit/2,yb+h+41,25,C.dim,'center','sans');
  });
 }
 alpha(out(t,3.5,4),()=>{
  bracket(x0,now,690,'已等 3 分钟，仍未到达',C.ink,true,31);
  frameWindow(now,yb,unit,h,1,C.gold,true);
  const reveal=out(t,7.25,7.65);
  alpha(1-reveal,()=>txt('?',now+unit/2,yb+93,88,C.ink,'center','math'));
  alpha(reveal,()=>txt('63.2%',now+unit/2,yb+89,73,C.gold,'center','math'));
  txt('未来 1 分钟',now+unit/2,yb+h+49,28,C.gold,'center','sans');dot(now,yb+h/2,6,C.gold);
 });
 if(t>8.6){const u=out(t,8.6,9.2);alpha(u,()=>{line(end+62,yt+h/2,end+62,yb+h/2,C.gold,1.6);line(end+48,yt+h/2,end+62,yt+h/2,C.gold);line(end+48,yb+h/2,end+62,yb+h/2,C.gold);txt('=',end+62,(yt+yb+h)/2+17,50,C.gold,'center','math')})}
 if(t<3.5)caption('刚开始等：下一分钟，至少发生一次的概率是 63.2%。',t,.2);
 else if(t<7.2)caption('已经空等三分钟，下一分钟会更容易来吗？',t,3.5);
 else if(t<10.5)caption('仍然是 63.2%。我们比较的是同样长的未来。',t,7.2);
 else caption('为什么？把过去的等待，放进公式里。',t,10.5);
}
export function proof(t,T){
 background(T,true);chapter(6,'条件概率 · 无记忆性',true);title('过去的等待，被约掉了',t,0,true,75);param(true);
 textIn('T：从起点等到下一次发生的时间',100,268,31,t,.25,C.goldDark,'left','sans');
 if(t<2.0){
  math(['P(T > t) = P(N(t) = 0) = ',{s:'e',sup:'−t'}],960,490,68,C.dark);
  caption('等到 t 分钟仍没来，就是 t 分钟内发生零次。',t,.1,true);
 }else if(t<4.0){
  math(['P(T > 3) = ',{s:'e',sup:'−3'}],660,445,63,C.dark);
  alpha(out(t,2.75,3.12),()=>math(['P(T > 4) = ',{s:'e',sup:'−4'}],1230,605,63,C.dark));
  caption('同一个公式，分别算三分钟与四分钟的空等概率。',t,2,true);
 }else{
  alpha(out(t,4,4.28),()=>math(['P(T > 4 | T > 3) = ',{frac:[[{s:'e',sup:'−4'}],[{s:'e',sup:'−3'}]]}, ...(t>9.8?[' = ',{s:'e',sup:'−1'}]:[])],960,431,71,C.dark));
  if(t>5.7){
   const a=out(t,5.7,6.05);
   alpha(a,()=>{
    const startX=806;
    const num=math([{s:'e',sup:'−3',c:C.red},' × ',{s:'e',sup:'−1'}],960,608,60,C.dark);
    const den=math([{s:'e',sup:'−3',c:C.red}],960,718,60,C.dark);
    line(810,661,1110,661,C.dark,2);
    const cancel=out(t,8,8.38);
    if(cancel>0){const a=num[0],b=den[0];line(a.x-6,638,a.x-6+(a.w+13)*cancel,638-66*cancel,C.red,2.8);line(b.x-6,750,b.x-6+(b.w+13)*cancel,750-66*cancel,C.red,2.8)}
    streak(t,8.13,num[0].x+20,615,-140,-40,C.red,65);
    streak(t,8.13,den[0].x+20,718,140,-35,C.red,65);
   });
  }
  if(t<6)caption('已经三分钟没来，再等一分钟仍没来的概率是——',t,4,true);
  else if(t<8)caption('把 e⁻⁴ 写成 e⁻³ × e⁻¹。',t,6,true);
  else if(t<10.2)caption('相同的 e⁻³，约掉。',t,8,true);
  else caption('再等 1 分钟仍没来：36.8%。',t,10.2,true);
 }
 const x=350,len=1160,y=864;
 intervalAxis(x,y,len,4,true);
 const colT=out(t,2,2.7);alpha(colT,()=>{
  bracket(x,x+len*.75,y-48,'已等 3 分钟',C.goldDark,true,25);
  alpha(out(t,2.9,3.35),()=>{bracket(x+len*.75,x+len,y-48,'再等 1 分钟',C.red,true,25);line(x+len*.75,y,x+len,y,C.red,3)});
 });
}
export function cumulative(t,T){
 background(T);chapter(7,'两个不同的问题');title('总共等得更久，累计概率会上升',t,0,false,66);param(false);
 const x0=310,y0=823,xlen=1310,yscale=485,c=1-Math.exp(-3);
 for(let i=0;i<=2;i++){const p=i*.5,y=y0-yscale*p;line(x0,y,x0+xlen,y,C.dim,.8,.23);txt(i===0?'0':i===1?'50%':'100%',x0-42,y+9,25,C.dim,'right','math')}
 intervalAxis(x0,y0,xlen,3,false);txt('分钟',x0+xlen+78,y0+45,27,C.dim,'center','sans');
 const reached=3*range(t,.4,4.3);
 g.beginPath();for(let i=0;i<=240;i++){const u=reached*i/240;const x=x0+xlen*u/3,y=y0-(1-Math.exp(-u))*yscale;i?g.lineTo(x,y):g.moveTo(x,y)}g.strokeStyle=C.gold;g.lineWidth=3.2;g.stroke();
 const endX=x0+reached*xlen/3,endY=y0-(1-Math.exp(-reached))*yscale;dot(endX,endY,5.8,C.gold,true);
 for(let i=1;i<=3;i++){
  const a=out(t,1.1+(i-1)*1.2,1.4+(i-1)*1.2),x=x0+i*xlen/3,y=y0-(1-Math.exp(-i))*yscale;
  alpha(a,()=>{dashed(x,y,x,y0,C.gold,1.2);dot(x,y,6.5,C.gold,true);txt(((1-Math.exp(-i))*100).toFixed(1)+'%',x,y-35,55,C.gold,'center','math')});
 }
 textIn('从同一个起点计算：至少发生一次',330,290,31,t,.2,C.ink,'left','sans');
 alpha(out(t,4.25,4.7),()=>math(['P(T ≤ t) = 1 − ',{s:'e',sup:'−t'}],1190,718,50,C.ink));
 if(t<4.5)caption('从起点等 1、2、3 分钟，累计概率确实在增加。',t,.2);
 else caption('无记忆性，比较的是“从现在起，同样长的未来”。',t,4.5);
 if(t>6.2){const a=out(t,6.2,6.7);alpha(a,()=>{line(1090,905,1527,905,C.gold,3);txt('同长未来：另一种比较',1310,947,25,C.gold,'center','sans')})}
}
