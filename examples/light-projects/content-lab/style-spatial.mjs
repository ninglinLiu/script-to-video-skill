import * as THREE from './vendor/three.module.min.js';
import {mix,ease,smooth,pop,txt,rect,line,round} from './common.mjs';
export async function createSpatial(tl){
 const at=s=>tl.cues.find(v=>v.text===s).start;
 const reveal=at('可同一个购物篮'),assume=at('假设物价每年上涨百分之三'),thirty=at('三十年后'),equiv=at('大约只相当于今天的四十一元'),same=at('钱的数量没变'),caution=at('这只是一个假设'),end=at('看财富');
 const canvas=document.createElement('canvas'),renderer=new THREE.WebGLRenderer({canvas,antialias:true,preserveDrawingBuffer:true});
 renderer.setSize(1080,1920);renderer.setClearColor('#0b232e');renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.15;renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;
 const scene=new THREE.Scene();scene.fog=new THREE.Fog('#0b232e',22,42);const cam=new THREE.PerspectiveCamera(35,1080/1920,.1,100);
 scene.add(new THREE.HemisphereLight('#dcffff','#152326',2.7));const key=new THREE.DirectionalLight('#ffe3a2',5);key.position.set(-4,9,6);key.castShadow=true;key.shadow.mapSize.set(1024,1024);scene.add(key);
 const rim=new THREE.PointLight('#3fc9ff',65);rim.position.set(4,3,-3);scene.add(rim);
 const mat=(c,m=.3,r=.35)=>new THREE.MeshStandardMaterial({color:c,metalness:m,roughness:r});const gold=mat('#d7b05c',.65,.2),teal=mat('#62d4cb',.3,.27),cream=mat('#cddfce',.2,.4);
 const floor=new THREE.Mesh(new THREE.PlaneGeometry(100,100),mat('#0b2e3d',.45,.3));floor.rotation.x=-Math.PI/2;floor.position.y=-2.7;floor.receiveShadow=true;scene.add(floor);
 const podium=new THREE.Mesh(new THREE.CylinderGeometry(3.8,4,.23,96),mat('#164454',.6,.28));podium.position.y=-2.5;podium.receiveShadow=true;scene.add(podium);
 const basket=new THREE.Group();scene.add(basket);
 function rod(a,b,r=.035,m=gold,parent=basket){const d=new THREE.Vector3().subVectors(b,a),o=new THREE.Mesh(new THREE.CylinderGeometry(r,r,d.length(),10),m);o.position.copy(a).add(b).multiplyScalar(.5);o.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),d.normalize());o.castShadow=true;parent.add(o);return o;}
 const V=(x,y,z)=>new THREE.Vector3(x,y,z);
 for(const y of [-1.9,.35]){for(const z of [-1.1,1.1])rod(V(-2,y,z),V(2,y,z));for(const x of [-2,2])rod(V(x,y,-1.1),V(x,y,1.1));}
 for(let i=0;i<=10;i++){const x=-2+i*.4;rod(V(x,-1.9,-1.1),V(x,.35,-1.1),.019);rod(V(x,-1.9,1.1),V(x,.35,1.1),.019);rod(V(x,-1.9,-1.1),V(x,-1.9,1.1),.019);}
 for(let i=0;i<=5;i++){const z=-1.1+i*.44;rod(V(-2,-1.9,z),V(-2,.35,z),.019);rod(V(2,-1.9,z),V(2,.35,z),.019);}
 for(const x of [-1.65,1.65]){const curve=new THREE.CatmullRomCurve3([V(x,.35,-.7),V(x,1.25,-.7),V(x,1.55,0),V(x,1.25,.7),V(x,.35,.7)]);const mesh=new THREE.Mesh(new THREE.TubeGeometry(curve,32,.05,8,false),cream);basket.add(mesh);}
 const goods=[];
 for(let i=0;i<20;i++){const mesh=new THREE.Mesh(new THREE.BoxGeometry(.64,.73,.75),i%4===0?gold:teal);mesh.position.set((i%5-2)*.74,-1.48+Math.floor(i/10)*.8,(Math.floor(i/5)%2-.5)*.9);mesh.castShadow=true;basket.add(mesh);goods.push({mesh,base:mesh.position.clone()});}
 const bill=new THREE.Group();scene.add(bill);const body=new THREE.Mesh(new THREE.BoxGeometry(2.9,1.6,.12),cream);body.castShadow=true;bill.add(body);
 const cv=document.createElement('canvas');cv.width=1024;cv.height=512;const g=cv.getContext('2d');g.fillStyle='#204850';g.fillRect(0,0,1024,512);g.strokeStyle='#b9cba9';g.lineWidth=10;g.strokeRect(28,28,968,456);g.textAlign='center';g.fillStyle='#e5dbab';g.font='900 300px Sans';g.fillText('100',512,355);g.font='500 44px Sans';g.fillText('固定金额 / 示意',512,440);const tex=new THREE.CanvasTexture(cv);tex.colorSpace=THREE.SRGBColorSpace;
 const face=new THREE.Mesh(new THREE.PlaneGeometry(2.9,1.45),new THREE.MeshBasicMaterial({map:tex}));face.position.z=.068;bill.add(face);
 const orbit=new THREE.Group();scene.add(orbit);for(let i=0;i<3;i++){const o=new THREE.Mesh(new THREE.TorusGeometry(3.2+i*.28,.012,6,96),teal);o.rotation.x=Math.PI/2;o.position.y=-2.32;orbit.add(o);}
 return(c,t)=>{
  const r=ease(reveal-.3,reveal+.8,t),p=smooth(assume+.4,equiv+.2,t),yr=p*30,qty=Math.pow(1.03,-yr),f=smooth(same,same+.9,t),z=smooth(end,end+1,t);
  const angle=-.32+.11*Math.sin(t*.33)+f*.6;const dist=15.8-z*.8;cam.position.set(Math.sin(angle)*dist,3.8,Math.cos(angle)*dist);cam.lookAt(0,-.35,0);
  const framing=smooth(assume-.4,assume+.6,t);
  bill.position.set(mix(0,-1.15,r)+z*.2,mix(.7,2.05,r)-framing*.55,.2);bill.rotation.set(.02,Math.sin(t*.7)*.06,.05*Math.sin(t*.45));bill.scale.setScalar(1.35-r*.36-framing*.08);
  basket.position.y=-4*(1-r);basket.rotation.y=.08*Math.sin(t*.5);basket.scale.setScalar(.98+z*.06);
  for(let i=0;i<20;i++){const u=Math.max(0,Math.min(1,qty*20-i));const o=goods[i];o.mesh.visible=u>.001;o.mesh.scale.y=Math.max(.001,u);o.mesh.position.copy(o.base);o.mesh.position.y=o.base.y-.365*(1-u);}
  renderer.render(scene,cam);renderer.getContext().finish();
  rect(c,0,0,1080,1920,'#0b232e');const sc=1-framing*.24;
  c.drawImage(canvas,(1080-1080*sc)/2,framing*230,1080*sc,1920*sc);
  const shade=c.createLinearGradient(0,0,0,1920);shade.addColorStop(0,'#061923dd');shade.addColorStop(.3,'#06192300');shade.addColorStop(.72,'#06192300');shade.addColorStop(1,'#061923ee');c.fillStyle=shade;c.fillRect(0,0,1080,1920);
  txt(c,'02 / 余额与购买力',65,110,28,'#cad9c8',500);line(c,65,145,1015,145,'#5a7c83',2);
  txt(c,t<assume?'钱没少，东西少了':t<same?'30 年后的 100 元':t<end?'数量 ≠ 购买力':'别只盯着余额',65,300,t<assume?82:86,'#f0e9cf',900);
  txt(c,'THE NUMBER STAYS. THE BASKET CHANGES.',68,365,22,'#a5bfc2',500);
  if(t>=assume){
   const u=smooth(assume,assume+.45,t);c.save();c.globalAlpha=u;
   round(c,68,425,944,195,22,'#061923ee');txt(c,'教学假设：每年涨价 3%',100,485,42,'#f3d795',700);txt(c,'金额不变 / 不计利息 / 不作预测',100,538,28,'#c5d5d0',500);c.restore();
   round(c,68,1255,944,162,16,'#061923ed');
   txt(c,`${Math.round(yr)} 年`,100,1330,56,'#e1c178',700);txt(c,`${(qty*100).toFixed(1)}%`,980,1330,92,'#ecedce',900,'right');
   txt(c,'同一笔钱可购买的商品量',980,1380,32,'#b9d4ce',500,'right');
   rect(c,100,1420,880,15,'#41646c');rect(c,100,1420,880*qty,15,'#daba7a');
  }
  if(t>equiv-.2){const q=smooth(equiv-.2,equiv+.5,t);c.save();c.globalAlpha=q;round(c,68,1450,944,105,16,'#061923ed');txt(c,'100 ÷ 1.03³⁰ ≈ 41.2',540,1525,58,'#f5dd9c',800,'center');c.restore();}
  if(t>caution&&t<end){txt(c,'实际物价并非每年匀速上涨',100,592,30,'#f1d6a1',650);}
  if(t<assume){txt(c,'固定预算，同一个购物篮',540,1440,50,'#f0e5bd',750,'center');}
 };}
