/* Content composition; rendered by unmodified xilo render.py.
 * Time helpers follow the existing Poisson core.js convention.
 * Every state is determined from t; no accumulated simulation or live network.
 */
const canvas=document.getElementById('film'),g=canvas.getContext('2d');
const W=1080,H=1920,PI=Math.PI;
const C={paper:'#f4efe5',ink:'#1d352d',dim:'#73796d',gold:'#c17c32',pale:'#e6dbc5',blue:'#4c7782',red:'#a64c39'};
const clamp=(v,a=0,b=1)=>Math.max(a,Math.min(b,v));
const mix=(a,b,u)=>a+(b-a)*u;
const smooth=x=>{x=clamp(x);return x*x*(3-2*x)};
const range=(t,a,b)=>smooth((t-a)/(b-a));
const ease=x=>1-Math.pow(1-clamp(x),3);
const variant=new URLSearchParams(location.search).get('variant')||'a';
function save(fn){g.save();fn();g.restore()}
function alpha(v,fn){if(v<=0)return;save(()=>{g.globalAlpha*=clamp(v);fn()})}
function line(x1,y1,x2,y2,c=C.ink,w=3){g.beginPath();g.moveTo(x1,y1);g.lineTo(x2,y2);g.lineWidth=w;g.strokeStyle=c;g.stroke()}
function poly(p,c){g.beginPath();p.forEach(([x,y],i)=>i?g.lineTo(x,y):g.moveTo(x,y));g.closePath();g.fillStyle=c;g.fill()}
function rect(x,y,w,h,c,r=0,stroke=null){g.beginPath();g.roundRect(x,y,w,h,r);if(c){g.fillStyle=c;g.fill()}if(stroke){g.strokeStyle=stroke;g.lineWidth=3;g.stroke()}}
function circle(x,y,r,c,stroke=null,w=3){g.beginPath();g.arc(x,y,r,0,2*PI);if(c){g.fillStyle=c;g.fill()}if(stroke){g.strokeStyle=stroke;g.lineWidth=w;g.stroke()}}
function txt(s,x,y,size=48,c=C.ink,align='left',font='sans',weight=500){g.font=`${weight} ${size}px ${font==='serif'?'FilmSerif':'FilmSans'}`;g.textAlign=align;g.textBaseline='alphabetic';g.fillStyle=c;g.fillText(s,x,y)}
function textReveal(s,x,y,size,t,a,c=C.ink,font='serif'){const u=ease((t-a)/.7);save(()=>{g.beginPath();g.rect(0,y-size-10,W,size+40);g.clip();txt(s,x,y+size*(1-u),size,c,'left',font,600)})}
function arrow(x1,y1,x2,y2,c=C.gold,w=4){line(x1,y1,x2,y2,c,w);const a=Math.atan2(y2-y1,x2-x1);poly([[x2,y2],[x2-18*Math.cos(a-.45),y2-18*Math.sin(a-.45)],[x2-18*Math.cos(a+.45),y2-18*Math.sin(a+.45)]],c)}
function cube(x,y,s=72,col=C.gold){const h=s*.52;save(()=>{g.shadowColor='#49331a18';g.shadowBlur=18;g.shadowOffsetY=18;poly([[x,y-h],[x+s,y],[x,y+h],[x-s,y]],col)});poly([[x-s,y],[x,y+h],[x,y+h+s],[x-s,y+s]],col===C.gold?'#a56827':'#26493f');poly([[x,y+h],[x+s,y],[x+s,y+s],[x,y+h+s]],col===C.gold?'#d5964c':'#406757');poly([[x,y-h],[x+s,y],[x,y+h],[x-s,y]],col===C.gold?'#e4b469':'#6c9381');line(x,y+h,x,y+h+s,'#f7efd660',2)}
function paper(x,y,w,h,label,rot=0,color=C.ink){save(()=>{g.translate(x,y);g.rotate(rot);g.shadowColor='#273c2520';g.shadowBlur=20;g.shadowOffsetY=12;rect(-w/2,-h/2,w,h,'#fffdf8',3);g.shadowColor='transparent';rect(-w/2,-h/2,9,h,color);txt(label,-w/2+30,-h/2+57,Math.min(46,(w-70)/label.length),color,'left','sans',600);for(let i=0;i<3;i++)line(-w/2+30,-h/2+88+i*23,w/2-35-(i===2?50:0),-h/2+88+i*23,'#d9dccf',3)})}
function header(n,k){txt('凯撒的复利实验室',72,105,27,C.ink,'left','sans',600);txt(String(n).padStart(2,'0')+' / '+k,1008,105,25,C.dim,'right');line(72,143,1008,143,'#cbc9ba',2)}
function footer(t){const cue=FILM.cues.find(c=>t>=c.start&&t<c.end);if(cue){const text=cue.text;g.font='500 46px FilmSans';let parts=[text];if(g.measureText(text).width>930){let best=null;for(let k=5;k<text.length-4;k++){if('，；：、。'.includes(text[k]))continue;const l=text.slice(0,k),r=text.slice(k),lw=g.measureText(l).width,rw=g.measureText(r).width;const score=Math.abs(lw-rw)+(('，；：、'.includes(text[k-1]))?-180:0);if(Math.max(lw,rw)<=930&&(!best||score<best.score))best={score,l,r}}if(best)parts=[best.l,best.r]}const y=1642+(parts.length===1?35:0);parts.forEach((s,i)=>txt(s,W/2,y+i*70,46,C.ink,'center','sans',500))}txt('据原文改编 · 作者自述 / 观点',72,1840,26,C.dim);txt('从价值创造到价值投资',1008,1840,26,C.dim,'right');rect(72,1882,936,3,'#dcd9cc');rect(72,1882,936*clamp(t/FILM.duration),3,C.gold)}
function opening(t,b=false){
 header(1,'共同框架');textReveal('从价值创造',72,318,94,t,0);textReveal('到价值投资',72,443,94,t,.45,C.gold);
 const transfer=range(t,2.3,4.9),frame=range(t,5,6.1),toLine=range(t,7.35,8.17);
 save(()=>{
  if(!b){
   alpha(1-frame*.7,()=>{line(120,1205,430,1205,C.ink,5);line(650,1205,960,1205,C.ink,5);txt('创业',275,1310,48,C.ink,'center');txt('投资',805,1310,48,C.ink,'center')});
   const blocks=[[-1,0],[0,0],[1,0],[-.5,-1],[.5,-1],[0,-2]];
   blocks.forEach(([dx,dy],i)=>{const a=ease((t-.12-i*.12)/.65);const u=range(t,2.3+i*.13,4.3+i*.13);const x=mix(275+dx*92,805+dx*92,u);const y=1080+dy*120-180*Math.sin(PI*u);const xx=mix(mix(x,540+dx*110,frame),180,toLine),yy=mix(mix(y,1040+dy*130,frame),660,toLine);alpha(a*(i===0?1:1-toLine),()=>cube(xx,yy+(1-a)*220,mix(100,40,toLine),C.gold))});
   alpha(range(t,1.6,2.2)*(1-frame),()=>arrow(440,1020,640,1020,C.gold,5));
  }else{
   alpha(1-toLine,()=>paper(540,985,780,610,'专访 / 从价值创造，到价值投资',-.035,C.ink));
   const u=range(t,2.4,4.9);alpha(1-toLine,()=>{paper(mix(320,310,u),960,360,220,'创造价值',mix(-.08,0,u),C.ink);paper(mix(710,770,u),mix(1140,960,u),360,220,'理解价值',mix(.07,0,u),C.gold)});
  }
  alpha(frame,()=>{rect(mix(132,180,toLine),mix(710,660,toLine),816*(1-toLine),mix(670,45,toLine),null,18*(1-toLine),C.ink);alpha(1-range(t,7.35,7.6),()=>{rect(350,675,380,75,C.paper);txt('同一套认知框架',540,724,40,C.ink,'center','sans',600)})});
 });
 alpha(toLine,()=>{line(180,660,180,690,C.gold,5);if(b)cube(180,660,40)});alpha(range(t,7.85,8.1666667),()=>txt('2022 年底',280,705,65,C.ink,'left','serif',600));
}
function timeline(t){
 const s=t-8.1666667;header(2,'职业经历');textReveal('一条线，两种角色',72,315,75,s,0);txt('原文自述 · 节点间距不代表时间比例',72,391,32,C.dim);
 const pts=[{y:690,label:'2022 年底',sub:'创业，同时布局投资',a:0},{y:1010,label:'2023 年初',sub:'试探性布局美股',a:4.05},{y:1330,label:'2025 年 9–12 月',sub:'向美股战略转型',a:7.25}];
 line(180,660,180,1405,'#d9d7c8',7);const yy=mix(690,1010,range(s,3.45,4.2))+320*range(s,6.8,7.5);line(180,660,180,yy,C.gold,7);
 pts.forEach((p,i)=>{const u=ease((s-p.a)/.65);alpha(u,()=>{circle(180,p.y,18,C.paper,C.gold,5);txt(p.label,280,p.y+15,65,C.ink,'left','serif',600);txt(p.sub,280,p.y+90,40,C.dim)});if(i===0)alpha(u,()=>{line(281,805,880,805,C.pale,3);txt('创业',330,862,36,C.ink);txt('投资',650,862,36,C.gold);arrow(420,850,600,850,C.gold,3)})});
 cube(180,yy-30,40);alpha(range(s,10.6,11.96),()=>{circle(180,1330,80*range(s,10.6,11.96),null,C.gold,6)});
}
function globe(x,y,r,t){save(()=>{g.translate(x,y);circle(0,0,r,'#e5e8d9',C.ink,4);for(let j=-2;j<=2;j++){const yy=j*r*.28,rr=Math.sqrt(r*r-yy*yy);g.beginPath();g.ellipse(0,yy,rr,rr*.22,0,0,PI*2);g.strokeStyle='#afbcaa';g.lineWidth=2;g.stroke()}for(let i=0;i<7;i++){const a=i*PI/7+t*.22;g.beginPath();g.ellipse(0,0,Math.abs(Math.cos(a))*r,r,0,0,2*PI);g.strokeStyle='#8fa48e';g.lineWidth=2;g.stroke()}const pts=[[.2,-.55],[-.55,-.05],[.45,.35],[-.2,.6]];pts.forEach(([xx,yy],i)=>{const u=range(t,.2+i*.28,1+i*.28);line(0,0,xx*r*u,yy*r*u,C.gold,5);circle(xx*r,yy*r,9,C.gold)});cube(0,-20,36)})}
function allocation(t){const s=t-20.1333333;header(3,'配置理念');textReveal('把视野展开',72,315,94,s,0);txt('作者提出的配置目标 · 概念示意',72,395,34,C.dim);
 const u=range(s,3,4.5);globe(mix(540,340,u),mix(870,870,u),mix(320,210,u),s);
 alpha(1-u,()=>txt('全球化',540,1350,64,C.ink,'center','serif',600));
 alpha(u,()=>{txt('全球化',340,1200,46,C.ink,'center');g.beginPath();g.arc(745,830,125,-PI/2,-PI/2+PI*2*range(s,3.5,4.8));g.strokeStyle=C.gold;g.lineWidth=12;g.stroke();arrow(745,705,790,715,C.gold,6);txt('跨周期',745,1050,46,C.ink,'center');const q=range(s,5.2,6.3);line(640,1330,900,1330,C.ink,3);rect(680,1330-75*q,65,75*q,C.blue);rect(790,1330-180*q,65,180*q,C.gold);txt('非对称',765,1420,46,C.ink,'center');txt('形态示意 / 非收益数据',765,1480,27,C.dim,'center')});
 alpha(range(s,7,8),()=>{line(540,870,610,870,C.gold,4);line(540,950,610,1290,C.gold,4);txt('全球复利包',72,545,56,C.gold,'left','serif',600)});
}
function criteria(t){const s=t-29.7;header(4,'公司筛选');textReveal('让标准成为筛选器',72,315,75,s,0);txt('深度价值  +  高增长科技',72,405,44,C.gold,'left','serif',600);
 const gates=[{y:770,label:'高毛利率',at:1.1},{y:1000,label:'潜在市场',at:3.2},{y:1230,label:'护城河',at:5.4}];
 gates.forEach((p,i)=>{line(180,p.y,450,p.y,C.ink,8);line(630,p.y,900,p.y,C.ink,8);txt(p.label,180,p.y-36,43,C.ink,'left','sans',600);alpha(range(s,p.at,p.at+.4),()=>{circle(870,p.y-55,23,C.gold);txt('✓',870,p.y-40,31,C.paper,'center')})});
 for(let i=0;i<6;i++){const u=range(s,.1+i*.15,7+i*.12);const y=mix(570,1430,u);const reject=i>2&&u>.42;const x=reject?mix(540+(i-2.5)*50,970,range(u,.42,.62)):540+(i-2.5)*30*(1-u);alpha(reject?1-range(u,.45,.65):1,()=>cube(x,y,28,i<3?C.gold:C.ink))}
 alpha(range(s,7,7.7),()=>{rect(370,1370,340,105,C.ink,7);txt('继续研究',540,1440,45,C.paper,'center')});txt('筛选思路示意 · 不代表企业实际评分',72,1530,29,C.dim);
}
function companies(t){const s=t-38.6666667;header(5,'原文举例');textReveal('例子，放回上下文',72,315,76,s,0);txt('原文提及',72,402,36,C.dim);
 const u=range(s,3.35,4.7);['Meta','谷歌','特斯拉'].forEach((name,i)=>{const a=ease((s-i*.3)/.7);alpha(a,()=>paper(mix(300+i*240,540,u),mix(800+i*170,840+i*190,u)+(1-a)*150,mix(370,720,u),170,name,mix((i-1)*.07,0,u),i===0?C.gold:C.ink))});
 alpha(u,()=>{rect(100,610,880,870,null,22,C.gold);rect(260,573,560,80,C.paper);txt('观点分享的边界',540,630,43,C.gold,'center');txt('仅观点分享',540,1370,58,C.ink,'center','serif',600);txt('非投资建议',540,1440,47,C.gold,'center')});
}
function network(t){const s=t-46.5333333;header(6,'研究协作');textReveal('信息汇入，判断留下',72,315,72,s,0);txt('分布式实验室 · 流程示意',72,402,36,C.dim);
 const nodes=[[250,690,'信息源'],[830,690,'外部大脑'],[540,1030,'AI Agent'],[540,1380,'判断记录']];
 [[0,2],[1,2],[2,3]].forEach(([i,j],k)=>{const a=nodes[i],b=nodes[j],u=range(s,.4+k*.6,1.6+k*.6);line(a[0],a[1]+50,mix(a[0],b[0],u),mix(a[1]+50,b[1]-70,u),C.pale,10);if(s>1+k){const q=((s-1-k)*.38)%1;cube(mix(a[0],b[0],q),mix(a[1]+70,b[1]-95,q),20,C.gold)}});
 nodes.forEach(([x,y,label],i)=>{const u=ease((s-i*.4)/.65);alpha(u,()=>{circle(x,y,90,i===2?C.ink:C.paper,C.ink,4);txt(label,x,y+15,i===2?35:36,i===2?C.paper:C.ink,'center','sans',600)})});
 alpha(range(s,5.7,6.5),()=>{txt('压缩信息处理成本',540,1215,37,C.gold,'center');line(300,1505,780,1505,C.ink,3)});
}
function closing(t){const s=t-55.3333333;header(7,'带走方法');textReveal('保持独立思考',72,315,90,s,0);textReveal('进行自主逻辑校验',72,429,69,s,.4,C.gold);
 const u=range(s,2,3.7);for(let i=0;i<3;i++)paper(mix(320+i*220,450+i*24,u),mix(750+i*100,970+i*20,u),340,215,['例子','观点','信息'][i],mix((i-1)*.09,-.07+i*.04,u),C.dim);
 alpha(range(s,3.5,4.4),()=>{paper(600,1060,570,480,'我的判断记录',0,C.ink);txt('来源',400,1000,38,C.ink);txt('条件',400,1070,38,C.ink);txt('待验证',400,1140,38,C.gold);line(400,1190,800,1190,C.pale,3)});
 txt('仅供复盘参考 · 不具实操指向',540,1440,38,C.ink,'center');txt('市场运行受多重复杂变量影响',540,1505,34,C.dim,'center');
}
window.ready=false;
window.render=function(t){t=clamp(t,0,FILM.duration);g.clearRect(0,0,W,H);g.fillStyle=C.paper;g.fillRect(0,0,W,H);
 // A fixed editorial paper texture, deterministic and subordinate to content.
 for(let y=18;y<H;y+=8){g.fillStyle=y%24===0?'#78684905':'#78684902';g.fillRect(0,y,W,1)}
 if(t<8.1666667)opening(t,variant==='b');else if(t<20.1333333)timeline(t);else if(t<29.7)allocation(t);else if(t<38.6666667)criteria(t);else if(t<46.5333333)companies(t);else if(t<55.3333333)network(t);else closing(t);
 footer(t);
};
document.fonts.ready.then(async()=>{await document.fonts.load('600 94px FilmSerif');await document.fonts.load('500 46px FilmSans');window.render(0);window.ready=true});
