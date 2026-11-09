import {SpriteActor} from './vendor/sprite-actor.mjs';
import {mix,ease,pop,smooth,txt,rect,circle,line,path} from './common.mjs';
const F='Fusion Pixel 12px Proportional Simplified Chinese';
const text=(c,s,x,y,z,col='#eddfb6',align='left')=>txt(c,s,x,y,z,col,400,align,F);
function block(c,x,y,w,h,col='#4d6a5f'){rect(c,x+10,y+12,w,h,'#0b1c23');rect(c,x,y,w,h,col);rect(c,x,y,w,10,'#8c9b79');rect(c,x+w-12,y+10,12,h-10,'#29473f');}
function page(c,x,y,s=1,col='#e6d9ae'){c.save();c.translate(Math.round(x),Math.round(y));c.scale(s,s);rect(c,-45,-55,90,110,'#172c2c');rect(c,-39,-51,78,98,col);rect(c,-22,-30,45,7,'#58766b');rect(c,-22,-8,45,7,'#58766b');rect(c,-22,14,29,7,'#58766b');c.restore();}
function gear(c,x,y,t,s=1){c.save();c.translate(x,y);c.rotate(t);c.scale(s,s);for(let i=0;i<8;i++){c.save();c.rotate(i*Math.PI/4);rect(c,-12,-70,24,33,'#d2b86f');c.restore();}circle(c,0,0,48,'#a38549');circle(c,0,0,21,'#173535');c.restore();}
function check(c,x,y){path(c,[[x-32,y],[x-12,y+22],[x+38,y-36]],null,'#cfe5a3',13);}
export async function createPixel(tl){const actor=await new SpriteActor({mini:'assets/sprites/manifest.json',portrait:'assets/bust/manifest.json'}).load();const at=s=>tl.cues.find(v=>v.text===s).start;
 const reset=at('明天又从零开始'),question=at('你的努力'),manual=at('同样是整理资料'),build=at('把步骤做成模板'),again=at('下次就不用重新搭一遍'),maintain=at('工具也要维护'),process=at('把常做的事'),less=at('但重复工作可以少一点'),end=at('今天不只问'),last=at('我留下了什么');
 return(c,t)=>{rect(c,0,0,1080,1920,'#091d24');text(c,'03 / 复用工坊',65,110,30,'#cabb91');line(c,65,145,1015,145,'#4b685f',3);
 const heading=t<question?'又要重做一遍？':t<build?'努力留下了什么':t<end?'把步骤留下来':'明天，不必从零';text(c,heading,62,340,heading.length>7?94:106);text(c,'THE WORK ENDS. THE TOOL STAYS.',68,414,29,'#a5b5a0');
 c.save();c.beginPath();c.rect(45,500,990,1030);c.clip();
 rect(c,45,500,990,1030,'#173338');rect(c,66,523,950,965,'#244444');
 // 一间有明确前后景的资料工坊；日夜改变，桌面工具保留。
 const day=smooth(reset-.1,reset+.55,t)*(1-smooth(manual-.7,manual,t));
 block(c,90,568,252,320,'#476359');rect(c,110,590,212,278,day>.7?'#203743':'#8ca99a');circle(c,225,670,48,day>.7?'#e6dcb5':'#e5c776');rect(c,210,590,12,278,'#42584a');rect(c,110,720,212,14,'#42584a');
 for(let i=0;i<4;i++){rect(c,430+i*135,576,82,36,i%2?'#9c8b56':'#668977');rect(c,440+i*135,612,64,27,'#18332f');}rect(c,400,643,590,23,'#112c30');
 const glow=c.createRadialGradient(680,740,30,680,930,600);glow.addColorStop(0,'#ead48c32');glow.addColorStop(1,'#ead48c00');c.fillStyle=glow;c.fillRect(45,500,990,1030);
 const b=smooth(build-.2,build+1,t),e=smooth(end,end+.7,t),m=smooth(maintain,maintain+.35,t)*(1-smooth(process,process+.4,t));
 // 工作桌与传送面先出现，后续机器直接搭在同一桌面上。
 block(c,90,1360,910,90,'#8e895c');rect(c,126,1450,30,140,'#526350');rect(c,920,1450,30,140,'#526350');
 const actorX=mix(240,-240,smooth(end,end+.3,t))+(t<build?Math.sin(t*5)*22:m*140);const frame=t<question?4+Math.floor(t*8)%4:t<build?12:t<again?14:t<process?13:15;
 if(t<end+.3)actor.mini(c,{frame,x:actorX,foot:1360,scale:1.8});
 if(t>=end+.25)actor.portrait(c,{frame:Math.floor(t*2)%2,x:mix(-310,235,smooth(end+.25,end+.85,t)),waist:1370,scale:1.65});
 if(t<build){
  let count=Math.min(10,Math.floor(Math.max(0,t-.15)*8));if(t>reset)count=Math.min(10,Math.floor(Math.max(0,t-manual)*1.8));
  const done=t<reset?count:t<manual?0:count;
  text(c,t<reset?'今日交付':'新的任务',700,755,53,'#e6c987','center');text(c,`${done} / 10`,700,860,75,'#d9e3ad','center');
  block(c,600,1115,310,240,'#3c5a4f');text(c,'交付箱',755,1298,42,'#d5c38c','center');
  for(let i=0;i<Math.min(6,done);i++)page(c,720+i*13,1128-i*19,.9);
  const cyc=((t<reset?t*4:t>question?t*1.7:0)%1),x=mix(370,760,cyc),y=1090-Math.sin(cyc*Math.PI)*170;page(c,x,y,.85);
  if(t>reset&&t<question+.2){const p=smooth(reset,reset+.5,t);text(c,'DAY 02',700,983,60,'#e9ab69','center');for(let i=0;i<4;i++)page(c,440+i*100,985-(1-p)*650-i*14,.66);}
  if(t>=manual){const labels=['复制','整理','交付'];for(let i=0;i<3;i++){const x=450+i*200;const active=Math.floor((t-manual)*2)%3===i;rect(c,x-75,900,155,65,active?'#c9be79':'#37534b');text(c,labels[i],x,945,33,active?'#122c30':'#dfd6ad','center');}}
 }else{
  // 手动步骤变成机器的三个模块，不从无关画面硬切。
  const cx=mix(630,720,e),cy=1080;const bw=480*(1-e*.12);
  c.save();c.translate(cx,cy+(1-b)*90);c.scale(.55+b*.45,.55+b*.45);
  block(c,-bw/2,-225,bw,400,'#3a6156');rect(c,-bw/2+25,-200,bw-50,74,'#132e31');text(c,'可复用模板',0,-148,46,'#e9d092','center');
  const run=t>again&&!(t>maintain&&t<process);gear(c,-85,-25,run?t*2:maintain*2,.9);gear(c,62,-22,run?-t*2:-maintain*2,1.05);
  rect(c,-bw/2-60,90,100,38,'#b3b58a');rect(c,bw/2-40,90,100,38,'#b3b58a');
  const steps=['输入','整理','检查'];for(let i=0;i<3;i++){const sp=pop(build+i*.25,t,16,.85);rect(c,-175+i*122,-340*sp,104,72,'#b4be85');text(c,steps[i],-123+i*122,-340*sp+49,30,'#244139','center');}
  if(run){const cycle=(t-again)*.72%1;page(c,mix(-bw/2-100,bw/2+115,cycle),95,.6,cycle>.55?'#c3db9c':'#e6d9ae');if(cycle>.7)check(c,bw/2+104,30);}
  if(m>.01){text(c,'维护中',0,235,39,'#efbc77','center');c.save();c.translate(120,-30);c.rotate(Math.sin(t*8)*.25);rect(c,-14,-65,28,120,'#e6c676');path(c,[[-43,-77],[-43,-30],[43,-30],[43,-77],[14,-60],[-14,-60]],'#e6c676');c.restore();}
  c.restore();
  if(t>less&&t<end){text(c,'同类任务 · 复用步骤',650,700,34,'#e0cf93','center');}
  if(e>.3){text(c,'工具留下，继续改进',650,700,34,'#e4d39b','center');}
 }
 c.restore();
 if(t>last){const p=pop(last,t,12,.9);c.save();c.translate(540,1505);c.scale(p,p);text(c,'今天，留下一个可复用的步骤。',0,0,46,'#e8cb86','center');c.restore();}
 else text(c,'原创工作情境 / 模板仍需维护',65,1530,28,'#a2b6a6');
 };}
