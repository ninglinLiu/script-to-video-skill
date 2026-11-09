import {SpriteActor} from './vendor/sprite-actor.mjs';
import {drawOpenBook,drawPaper,drawRewardBadge} from './vendor/components.mjs';
import {mix,smooth,ease,pop,txt,rect,circle,line,ring,path} from './common.mjs';
const px='Fusion Pixel 12px Proportional Simplified Chinese';
const pal={ink:'#111d20',wall:'#273c40',dark:'#1b2c31',cream:'#edddaf',orange:'#e29042',gold:'#b9a16b',teal:'#7da99d'};
function ptext(c,s,x,y,size,col=pal.cream,align='left'){txt(c,s,x,y,size,col,400,align,px)}
function block(c,x,y,w,h,col){
 rect(c,x+7,y+9,w,h,'#101c20');rect(c,x,y,w,h,col);rect(c,x,y,w,7,'#ecc58d');rect(c,x+w-8,y+7,8,h-7,'#6f482d');
}
function building(c,x,foot,scale=1,build=1){
 c.save();c.translate(x,foot);c.scale(scale,scale);
 block(c,-125,-190,250,190,'#8b7660');rect(c,-140,-212,280,26,'#c9b185');
 for(let i=0;i<3;i++){rect(c,-93+i*77,-155,45,67,'#293b3d');rect(c,-89+i*77,-151,36,18,'#ddab60')}
 rect(c,-27,-70,54,70,'#2d3e3c');rect(c,-20,-65,7,59,'#a8a083');
 const y=-212-125*build;block(c,-60,y,120,125*build,'#cf7939');rect(c,-72,y-15,144,21,'#e9b46b');rect(c,-23,y+30,46,42,'#2b4344');rect(c,-16,y+37,32,12,'#f0d397');
 c.restore();
}
function room(c,t){
 rect(c,0,0,1080,1920,'#0f1b20');
 rect(c,48,175,984,1260,pal.dark);rect(c,78,206,924,1198,pal.wall);
 // Three broad architectural planes, one main light source.
 rect(c,78,206,65,1198,'#1e3239');rect(c,933,206,69,1198,'#1a2d33');
 rect(c,113,324,315,440,'#15292f');rect(c,130,342,280,402,'#778f83');
 rect(c,145,357,250,367,'#9fa88a');rect(c,256,348,20,390,'#3b534e');rect(c,134,526,268,18,'#3b534e');
 path(c,[[148,720],[240,618],[318,664],[393,581],[393,722]],'#607d76');
 rect(c,540,296,330,48,'#182b2f');rect(c,570,260,96,36,'#56766b');rect(c,678,244,58,52,'#ae8c56');rect(c,749,275,87,21,'#d1b582');
 rect(c,760,430,112,152,'#1a2c31');rect(c,771,442,90,130,'#a9ac8d');line(c,815,458,815,505,'#344e4a',7);line(c,815,505,848,517,'#344e4a',7);
 rect(c,532,175,13,77,'#121e22');path(c,[[502,249],[577,249],[608,285],[472,285]],'#be9560');rect(c,480,285,120,12,'#f4dba1');
 const light=c.createRadialGradient(540,305,10,540,775,670);light.addColorStop(0,'#ffe5aa24');light.addColorStop(1,'#ffe5aa00');c.fillStyle=light;c.fillRect(80,300,920,1100);
 for(let i=0;i<6;i++)rect(c,155+(i%2)*180,830+i*77,220,5,'#48605a30');
}
export async function createPixel(){
 const actor=await new SpriteActor({mini:'assets/sprites/manifest.json',portrait:'assets/bust/manifest.json'}).load();
 return function pixel(c,t){
  room(c,t);
  const pull=ease(1.78,2.95,t),step=ease(3.2,4.94,t),inspect=ease(5.13,6.18,t);
  // One stage, two actor scales; the actor ducks behind the desk then jumps up.
  c.save();
  const zoom=mix(1,.96,pull);c.translate(540,880);c.scale(zoom,zoom);c.translate(-540,-880);
  const bX=mix(760,475,pull),bFoot=mix(1270,1260,pull),bS=mix(.5,.96,pull);
  const placing=ease(1.28,1.78,t);
  building(c,bX,bFoot,bS,placing);
  // A cube leaves the actor's extended hand, follows an arc, and becomes the top storey.
  if(t>.30&&t<1.78){
   const q=ease(.3,.56,t),x=mix(655,760,placing),y=mix(1144,1101,placing)-Math.sin(placing*Math.PI)*116;
   c.save();c.translate(x,y);c.rotate((1-placing)*-.20);c.scale(q,q);block(c,-31,-60,62,60,pal.orange);c.restore();
  }
  if(t<2.62){
   const match=ease(0,.70,pull);
   const scale=mix(1.62,.60,match),x=mix(430,250,match),waist=mix(1280,1258,match)+420*ease(2.28,2.61,t);
   c.save();c.beginPath();c.rect(0,0,1080,mix(1265,1330,pull));c.clip();
   const frame=t<.23?0:(t>1.05&&t<1.15?2:Math.floor(t*9)%3===0?0:1);
   actor.portrait(c,{frame,x,waist,scale});c.restore();
  }
  if(t>=2.62){
   c.save();c.beginPath();c.rect(0,0,1080,mix(1265,1330,pull));c.clip();
   const rise=pop(2.62,t,17,.71);
   const x=mix(250,815,step),foot=1284+360*(1-rise)-(step>0&&step<1?Math.abs(Math.sin(t*13))*9:0);
   let frame=0;if(t>3.2&&t<4.94)frame=4+Math.floor(t*10)%4;else if(t>=4.94)frame=t<5.35?12:15;
   actor.mini(c,{frame,x,foot,scale:1.45});c.restore();
  }
  // The foreground desk retracts into the workshop floor, without a dissolve.
  const deskY=mix(1265,1330,pull);
  rect(c,96,deskY,888,mix(59,28,pull),'#a38a5d');rect(c,96,deskY+10,888,12,'#d0b57e');rect(c,124,deskY+mix(59,28,pull),835,22,'#26392f');
  rect(c,146,deskY+44,34,140,'#4b5946');rect(c,902,deskY+44,34,140,'#4b5946');
  if(t<2.3){c.save();c.globalAlpha=1-smooth(1.8,2.3,t);drawPaper(c,{x:150,y:1220,w:170,h:48});c.restore()}
  // Research lens: reveal a magnified crop of the SAME structure.
  if(inspect>0){
   const x=468,y=960,r=220*inspect;
   c.save();c.beginPath();c.arc(x,y,r,0,Math.PI*2);c.clip();rect(c,x-r,y-r,2*r,2*r,'#203c3e');building(c,x,y+275,1.45,1);c.restore();
   ring(c,x,y,r,'#101f23',24);ring(c,x,y,r,pal.gold,12);
   const a=.84;line(c,x+r*Math.cos(a),y+r*Math.sin(a),x+(r+130*inspect)*Math.cos(a),y+(r+130*inspect)*Math.sin(a),'#101f23',33);
   line(c,x+r*Math.cos(a),y+r*Math.sin(a),x+(r+130*inspect)*Math.cos(a),y+(r+130*inspect)*Math.sin(a),pal.gold,17);
   c.save();c.globalAlpha=inspect;drawOpenBook(c,{x:120,y:1373,w:400,h:150,closed:1-inspect,mark:true});c.restore();
  }
  c.restore();
  // Pixel title and navigation are independent of the moving stage.
  ptext(c,'凯撒的复利实验室',72,108,30,'#d3c299');
  ptext(c,'03 / 像素工坊',1008,108,30,'#d3c299','right');
  const title=t<2.85?'价值创造':'价值投资';
  rect(c,194,470,692,143,'#16292ddd');rect(c,194,470,692,6,pal.gold);rect(c,194,607,692,6,pal.gold);
  ptext(c,title,540,571,96,pal.cream,'center');
  if(t>4.93){const a=smooth(4.93,5.2,t);c.save();c.globalAlpha=a;ptext(c,'换个位置',814,870,48,pal.cream,'center');line(c,814,889,814,966,pal.gold,4);c.restore()}
  if(t>6.35){c.save();c.globalAlpha=smooth(6.35,6.67,t);drawRewardBadge(c,{x:640,y:1420,label:'研究价值'});c.restore()}
  rect(c,0,1570,1080,170,'#101d20');
  ptext(c,'搭建 → 观察 → 研究',540,1785,48,pal.gold,'center');
  line(c,72,1820,1008,1820,'#39534f',3);
  ptext(c,'原创角色演绎 / 非作者肖像',72,1870,24,'#9caf9c');
 };
}
