import {g,W,H,C,clamp,mix,smooth,ease,out,range,hash,TAU,alpha,line,poly,rect,circle,dot,txt,textIn,caption,chapter,title,param,background,bracket,arrow,dashed,streak,person,math,mathWidth,frameWindow,probabilities,intervalAxis,beatPulse} from './core.js';
export function opening(t,T){
 background(T,false,.82);
 const pull=range(t,2.6,3.5), z=mix(1.82,1,pull);
 g.save();g.translate(960,710);g.scale(z,z);g.translate(-960,-710);
 for(let i=0;i<4;i++){
  const enter=out(t,i*.85,i*.85+.42);if(enter<=0)continue;
  const x=170+i*390+130*(1-enter),y=865-i*19,w=285,h=mix(460,60,range(t,5.42,6));
  const color=i===3?C.dim:C.gold,skew=55;
  alpha(enter*(i===3?.35:1),()=>{
   poly([[x,y],[x,y-h],[x+w,y-h-skew],[x+w,y-skew],[x,y]],color,1.7,'#19221b15');
   poly([[x+9,y+4],[x+9,y-h+6],[x+w+9,y-h-skew+6]],color,.7);
   for(let j=0;j<150;j++){const u=hash(j+i*77),edge=j%4;let px,py;if(edge===0){px=x;py=y-u*h}else if(edge===1){px=x+u*w;py=y-h-u*skew}else if(edge===2){px=x+w;py=y-skew-u*h}else{px=x+u*w;py=y-u*skew}alpha(.22+.38*hash(j+21),()=>dot(px+Math.sin(T*1.4+j)*2.5,py+Math.cos(T+j*2)*2,.6+hash(j+71),color,false))}
   line(x,y,x+w,y-skew,color,2.2);
   for(let j=0;j<24;j++){const u=j/24;dot(x+w*u,y-skew*u,.85,color,false)}
   const yy=y-h+(.5+.45*Math.sin(t*2-i))*h;
   line(x,yy,x+w,yy-skew,color,.65,.14);
   txt(i===3?'?':'第 '+(i+1)+' 分钟',x+w*.5,y+45,28,color,'center');
   if(i<3){circle(x+w*.5,y-h*.46,9,C.ink,1.5);line(x+w*.5-25,y-h*.46,x+w*.5+25,y-h*.46,C.gold,1,.3)}
  });
 }
 alpha(pull,()=>person(1690,890,1.1,T));
 for(let i=0;i<115;i++){const x=(hash(i+4)*2200+T*44)%2200-140,y=930-x*.045+Math.sin(i*4)*10;alpha(.07+.25*hash(i+70),()=>dot(x,y,hash(i+22)*1.5+.35,C.gold,false))}
 g.restore();
 chapter(1,'等待的错觉');
 if(t<3){const count=Math.min(3,Math.floor(t/.87)+1);alpha(1-range(t,2.6,3),()=>{txt('第 '+count+' 分钟',106,185,70,C.ink);txt('仍然，没有发生。',112,256,31,C.dim,'left','sans');txt('00',1640,193,110,C.gold,'right','math')})}
 textIn('等了这么久，',106,173,92,t,3,C.ink);
 textIn('下一个该来了？',106,278,92,t,4.12,C.gold);
 if(t>4.12)streak(t,4.12,820,276,180,-40,C.gold,85);
}
export function rate(t,T){
 background(T);chapter(2,'到达率');title('平均一次，不等于准时',t,0,false,74);param(false);
 const split=range(t,2.9,3.6);
 if(split<1)alpha(1-split,()=>{
  const xs=Array.from({length:14},(_,i)=>220+i*111);
  const irregular=[215,248,420,611,633,661,920,940,1140,1450,1470,1494,1710,1720];
  const jitter=range(t,1.05,2.5);
  line(150,630,1780,630,C.dim,1.5);
  for(let i=0;i<14;i++){const x=mix(xs[i],irregular[i],jitter);line(x,600,x,661,C.gold,1,.3);alpha(out(t,i*.058,i*.058+.24),()=>dot(x,630,5.7,C.gold,true))}
  txt('每隔一样久？',960,458,54,C.ink,'center');
  textIn('平均 ≠ 准时',960,816,64,t,1.4,C.gold,'center');
 });
 if(split>0)alpha(split,()=>{
  const x0=365,x1=1575,ys=[400,601,802],positions=[[],[.57],[.12,.43,.79]];
  const delays=[4.1,5.5,7.05];
  for(let r=0;r<3;r++){
   const e=out(t,3+r*.2,3.5+r*.2),y=ys[r]+40*(1-e);
   alpha(e,()=>{
    txt('第 '+(r+1)+' 次观察',130,y+10,26,C.dim,'left','sans');line(x0,y,x1,y,C.ink,1.7);line(x0,y-14,x0,y+14,C.ink);line(x1,y-14,x1,y+14,C.ink);
    txt('0',x0,y+47,26,C.dim,'center','math');txt('1 分钟',x1,y+47,26,C.dim,'center','sans');
    const scan=out(t,delays[r],delays[r]+1.15);
    alpha(.23,()=>line(x0+scan*(x1-x0),y-44,x0+scan*(x1-x0),y+42,C.gold,2));
    for(let j=0;j<positions[r].length;j++){
     const pos=positions[r][j],reveal=out(t,delays[r]+pos*.9,delays[r]+pos*.9+.2);
     alpha(reveal,()=>{dot(x0+pos*(x1-x0),y,7,C.gold,true);circle(x0+pos*(x1-x0),y,15+15*(1-reveal),C.gold,.8)})
    }
    alpha(out(t,delays[r]+.95,delays[r]+1.25),()=>{txt(positions[r].length+' 次',1700,y+13,56,C.gold,'center');circle(1700,y-8,60,C.gold,.7)});
   });
  }
 });
 if(t<3)caption('平均一分钟一次，并不保证每一分钟都有一次。',t,.1);
 else if(t<8.4)caption('相同的一分钟，可以出现不同次数。',t,3);
 else caption('理想模型：速率恒定 · 不同时段独立',t,8.4);
}
const sampleCounts=Array.from({length:120},(_,i)=>{const v=hash(i*2+95);let a=0;for(let k=0;k<probabilities.length;k++){a+=probabilities[k];if(v<a)return k}return 5});
export function distribution(t,T){
 background(T,true);chapter(3,'次数与分布',true);title('随机，也有分布',t,0,true,76);param(true);
 const x0=180,y0=830,dx=148,bw=101,scale=1200;
 const n=Math.max(1,Math.min(120,Math.floor((t-.7)*29)));
 const empirical=Array.from({length:6},(_,k)=>sampleCounts.slice(0,n).filter(x=>x===k).length/n);
 const theory=range(t,4.5,5.4);
 for(let p=0;p<=.4+.001;p+=.1){const y=y0-p*scale;line(x0-25,y,x0+820,y,C.goldDark,.6,.24);txt(p.toFixed(1),x0-42,y+9,24,C.goldDark,'right','math')}
 line(x0-25,y0,x0+848,y0,C.dark,1.6);txt(t<4.5?'频率':'概率',x0-52,302,24,C.goldDark,'right','sans');
 for(let k=0;k<6;k++){
  const x=x0+k*dx,h=mix(Math.min(empirical[k],.45),probabilities[k],theory)*scale*out(t,.3,.95),y=y0-h;
  const highlight=t>10?k===0:true;
  alpha(highlight?1:.25,()=>{
   const grad=g.createLinearGradient(x,y,x,y0);grad.addColorStop(0,'#bb934933');grad.addColorStop(1,'#c7a15a15');
   rect(x,y,bw,h,C.goldDark,grad,1.4);
   for(let j=0;j<Math.floor(h*bw/480);j++){const xx=x+5+hash(j+k*101)*(bw-10),yy=y+hash(j+k*199+27)*h;alpha(.28+.35*hash(j+74),()=>dot(xx,yy,.7+hash(j+6)*1.2,C.goldDark,false))}
   txt(k===5?'5+':String(k),x+bw/2,y0+43,30,C.dark,'center','math');
   if(theory>.2)alpha(theory,()=>txt((probabilities[k]*100).toFixed(1)+'%',x+bw/2,y-22,30,C.goldDark,'center','math'));
  });
 }
 textIn('发生次数 k',610,922,27,t,0,C.dark,'center','sans');
 if(t<5.2){
  for(let i=0;i<Math.min(120,n+5);i++){
   const age=t-.75-i/29;if(age<0||age>.8)continue;const u=ease(age/.8),k=sampleCounts[i],x=u<.4?mix(1570,1040,u/.4):mix(1040,x0+k*dx+bw/2,(u-.4)/.6),y=u<.4?mix(320,255,smooth(u/.4)):mix(255,y0-empirical[k]*scale-15,ease((u-.4)/.6));
   alpha(1-smooth((u-.85)/.15),()=>{rect(x-28,y-19,56,38,C.goldDark,C.paper);txt(String(k),x,y+10,27,C.dark,'center','math')});
  }
  txt('每个样本 = 一整段时间窗的总次数',1160,390,27,C.dark,'left','sans');
  const k=sampleCounts[Math.min(119,n-1)];
  frameWindow(1190,450,535,98,1,C.goldDark);
  for(let j=0;j<k;j++)dot(1240+hash(j+n*3)*400,497,5,C.goldDark,false);
  txt('计数：'+k+' 次',1457,610,44,C.goldDark,'center');
  caption('先数每个时间窗，再按“次数”归类。',t,0,true);
 }else{
  alpha(out(t,5.1,5.55),()=>{
   math(['P(N(t) = k) = ',{frac:[[{s:'e',sup:'−λt'},{s:'(λt)',sup:'k'}],['k!']]}],1450,421,45,C.dark);
   txt('λ  平均速率',1240,586,32,C.goldDark,'left','sans');
   txt('t   观察时长',1240,653,32,C.goldDark,'left','sans');
   txt('k  发生次数',1240,720,32,C.goldDark,'left','sans');
   txt('N(t)：t 分钟内发生的次数',1185,810,28,C.dark,'left','sans');
  });
  if(t>=7) {const k=Math.min(2,Math.floor((t-7)/1.3));line(1205,565+k*67,1215,565+k*67,C.red,4)}
  if(t<10)caption('发生在哪一刻不确定，发生几次的概率可以算。',t,5.1,true);
  else {caption('现在，只看“一次都没有发生”。',t,10,true);bracket(x0,x0+bw,285,'k = 0',C.red,true,27)}
 }
 if(t>4.5)textIn('λt = 1 · 理论概率',590,280,27,t,4.5,C.goldDark,'center','sans');
}
export function zero(t,T){
 background(T);chapter(4,'一次实际计算');title('平均一次，也可能零次',t,0,false,76);param(false);
 const xx=265,yy=343,ll=1375;
 line(xx,yy,xx+ll,yy,C.gold,1.7);line(xx,yy-17,xx,yy+17,C.gold);line(xx+ll,yy-17,xx+ll,yy+17,C.gold);
 txt('0',xx,yy+50,30,C.dim,'center','math');txt('1 分钟',xx+ll,yy+50,30,C.dim,'center','sans');
 txt('0 次',960,yy-23,34,C.ink,'center');
 const scan=((t*.39)%1);alpha(.14,()=>line(xx+ll*scan,yy-45,xx+ll*scan,yy+45,C.gold));
 if(t<2){math(['P(N(1) = 0) = ',{frac:[[{s:'e',sup:'−1'},{s:'1',sup:'0'}],['0!']]}],960,543,70,C.ink)}
 else if(t<4){math(['P(N(1) = 0) = ',{s:'e',sup:'−1'},' × 1 / 1'],960,543,70,C.ink);textIn('1⁰ = 1；0! = 1',960,635,29,t,2,C.gold,'center','math')}
 else{math(['P(N(1) = 0) = ',{s:'e',sup:'−1'},' ≈ 36.8%'],960,535,68,C.ink)}
 if(t>5.3){
  const x=220,y=708,w=1480,h=74,p0=probabilities[0],appear=out(t,5.3,5.9);
  alpha(appear,()=>{
   rect(x,y,w*p0,h,C.ink,'#ded6c72a',1.5);
   const a=out(t,7.65,8.45);rect(x+w*p0,y,w*(1-p0)*a,h,C.gold,'#d5b3712d',1.5);
   for(let i=0;i<210;i++){const f=hash(i+40);if(f<p0||a>(f-p0)/(1-p0)){alpha(.22+hash(i)*.3,()=>dot(x+f*w,y+7+hash(i+83)*(h-14),.9,C.gold,false))}}
   line(x+w*p0,y-14,x+w*p0,y+h+15,C.ink,1.5);
   txt('一次也没有',x+w*p0/2,837,32,C.ink,'center','sans');txt('36.8%',x+w*p0/2,911,68,C.ink,'center','math');
   alpha(a,()=>{txt('至少一次',x+w*p0+w*(1-p0)/2,837,32,C.gold,'center','sans');txt('63.2%',x+w*p0+w*(1-p0)/2,911,68,C.gold,'center','math')});
  });
 }
 if(t<2)caption('代入：λ = 1，t = 1，k = 0。',t);
 else if(t<5.3)caption('平均一分钟一次，空等的概率却有 36.8%。',t,2);
 else if(t<8.3)caption('至少一次 = 1 − 一次也没有',t,5.3);
 else caption('1 − 36.8% = 63.2%',t,8.3);
}
