import * as THREE from './vendor/three.module.min.js';
import {mix,ease,smooth,pop,txt,rect,line} from './common.mjs';
export async function createSpatial(){
 const webgl=document.createElement('canvas');
 const renderer=new THREE.WebGLRenderer({canvas:webgl,antialias:true,preserveDrawingBuffer:true});
 renderer.setSize(1080,1920);renderer.setClearColor('#10232b');renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.2;
 renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;
 const scene=new THREE.Scene();scene.fog=new THREE.Fog('#10232b',17,35);
 const camera=new THREE.PerspectiveCamera(38,1080/1920,.1,80);
 scene.add(new THREE.HemisphereLight('#dcebf0','#192f30',2.4));
 const key=new THREE.DirectionalLight('#ffe5bb',4.7);key.position.set(-4,9,7);key.castShadow=true;key.shadow.mapSize.set(1024,1024);key.shadow.camera.left=-9;key.shadow.camera.right=9;key.shadow.camera.top=9;key.shadow.camera.bottom=-9;key.shadow.bias=-.001;scene.add(key);
 const rim=new THREE.DirectionalLight('#67dcd8',4);rim.position.set(5,5,-6);scene.add(rim);
 const mat=(col,m=.3,r=.3)=>new THREE.MeshStandardMaterial({color:col,metalness:m,roughness:r});
 const cream=mat('#e3dac2'),gold=mat('#d69a4e',.72,.24),teal=mat('#4a9d9a',.5,.27);
 const floor=new THREE.Mesh(new THREE.PlaneGeometry(200,200),mat('#173c43',.4,.36));floor.rotation.x=-Math.PI/2;floor.position.y=-2.5;floor.receiveShadow=true;scene.add(floor);
 const disc=new THREE.Mesh(new THREE.CylinderGeometry(3.25,3.4,.18,96),mat('#24525c',.6,.27));disc.position.y=-2.35;disc.receiveShadow=true;scene.add(disc);
 function tag(label,col){
  const g=new THREE.Group(),s=new THREE.Shape();s.moveTo(-1.6,-.9);s.lineTo(1.1,-.9);s.lineTo(1.65,0);s.lineTo(1.1,.9);s.lineTo(-1.6,.9);s.closePath();
  const geo=new THREE.ExtrudeGeometry(s,{depth:.14,bevelEnabled:true,bevelThickness:.065,bevelSize:.065,bevelSegments:3});
  const m=new THREE.Mesh(geo,mat(col,.23,.3));m.castShadow=true;g.add(m);
  const cv=document.createElement('canvas');cv.width=768;cv.height=384;const ctx=cv.getContext('2d');
  ctx.fillStyle='#162f35';ctx.font='900 240px Sans';ctx.textAlign='center';ctx.fillText(label,360,282);
  const tex=new THREE.CanvasTexture(cv);tex.colorSpace=THREE.SRGBColorSpace;
  const text=new THREE.Mesh(new THREE.PlaneGeometry(2.8,1.4),new THREE.MeshBasicMaterial({map:tex,transparent:true,depthWrite:false}));text.position.set(-.1,0,.225);g.add(text);
  const eye=new THREE.Mesh(new THREE.TorusGeometry(.12,.035,8,36),gold);eye.position.set(1.2,0,.26);g.add(eye);
  scene.add(g);return g;
 }
 const old=tag('500','#d6d1b6'),now=tag('200','#f7a24d');
 const anchor=new THREE.Group();scene.add(anchor);
 function bar(w,h,x,y,z=0,rot=0){const m=new THREE.Mesh(new THREE.BoxGeometry(w,h,.16),gold);m.position.set(x,y,z);m.rotation.z=rot;m.castShadow=true;anchor.add(m)}
 bar(.17,1.9,0,-.1);bar(1.1,.14,0,.38);
 const armCurve=new THREE.CatmullRomCurve3([new THREE.Vector3(-.78,-.35,0),new THREE.Vector3(-.65,-.8,0),new THREE.Vector3(0,-1.02,0),new THREE.Vector3(.65,-.8,0),new THREE.Vector3(.78,-.35,0)]);
 const arms=new THREE.Mesh(new THREE.TubeGeometry(armCurve,48,.085,12,false),gold);arms.castShadow=true;anchor.add(arms);
 for(const sign of [-1,1]){
  const fluke=new THREE.Shape();fluke.moveTo(sign*.79,-.22);fluke.lineTo(sign*.46,-.55);fluke.lineTo(sign*.94,-.64);fluke.closePath();
  const m=new THREE.Mesh(new THREE.ExtrudeGeometry(fluke,{depth:.15,bevelEnabled:true,bevelThickness:.018,bevelSize:.018,bevelSegments:2}),gold);m.position.z=-.075;anchor.add(m);
 }
 const hoop=new THREE.Mesh(new THREE.TorusGeometry(.25,.075,10,48),gold);hoop.position.y=1;anchor.add(hoop);
 const chain=[];
 for(let i=0;i<8;i++){const a=new THREE.Mesh(new THREE.TorusGeometry(.14,.035,8,24),gold);scene.add(a);chain.push(a)}
 const values=new THREE.Group();scene.add(values);
 const bars=[];
 for(let i=0;i<5;i++){const m=new THREE.Mesh(new THREE.BoxGeometry(.5,1,.65),i===2?gold:teal);m.castShadow=true;values.add(m);bars.push(m)}
 const uncertainty=new THREE.Mesh(new THREE.ConeGeometry(1.65,3.4,64,1,true),new THREE.MeshPhysicalMaterial({color:'#7ed1c2',transparent:true,opacity:.12,side:THREE.DoubleSide,roughness:.4,depthWrite:false}));uncertainty.rotation.z=-Math.PI/2;uncertainty.position.set(0,-.2,0);values.add(uncertainty);
 const project=(x,y,z)=>{const p=new THREE.Vector3(x,y,z).project(camera);return [(p.x+1)*540,(1-p.y)*960]};
 return function(c,t){
  const orbit=ease(2.9,4.4,t),release=ease(5.25,6.55,t),show=ease(5.65,6.85,t);
  const az=mix(-.22,.52,orbit)*(1-release)+.13*release;
  const dist=mix(15.5,16.3,show);camera.position.set(Math.sin(az)*dist,3.2,Math.cos(az)*dist);camera.lookAt(0,-.2,0);
  old.position.set(mix(-.35,-.68,orbit)-release*2, mix(1.62,1.9,orbit)+release*8,0);old.rotation.set(0,mix(-.07,.1,orbit),-.08-release*.7);old.scale.setScalar(Math.max(.01,pop(-.05,t,14,.85)));
  const n=pop(1.23,t,17,.8);now.visible=t>=1.23;now.rotation.set(.02,-.08,-.04+(1-n)*.4);now.scale.setScalar(mix(mix(1,.82,orbit),.53,release));now.position.x=mix(mix(.4,1.2,orbit)+(1-n)*5,-1.45,release);now.position.y=mix(-.45,-1.5,release);now.position.z=mix(1.1,1.3,release);
  anchor.position.set(-1.35, mix(-2.0,-.6,orbit)+release*8,1.35);anchor.rotation.set(.04,-.12,-.08-release*.7);anchor.scale.setScalar(.92);anchor.visible=t>2.7&&release<1;
  chain.forEach((m,i)=>{m.visible=t>2.7&&release<1;const p=i/7;m.position.set(mix(old.position.x+.1,anchor.position.x,p),mix(old.position.y-.6,anchor.position.y+1,p),mix(0,1.35,p));m.rotation.set(i%2?Math.PI/2:0,.1,-.1-release*.7)});
  values.position.set(mix(1.7,.65,show),-.3,0);values.scale.setScalar(Math.max(.001,show));values.visible=show>0;
  bars.forEach((m,i)=>{const h=[.9,1.65,1.35,2.15,1.8][i];const q=pop(5.8+i*.11,t,17,.85);m.position.set((i-2)*.65,-1.4+h*q/2,.45);m.scale.y=Math.max(.001,h*q)});
  uncertainty.scale.set(1,1+.12*Math.sin(t),1);
  renderer.render(scene,camera);renderer.getContext().finish();c.drawImage(webgl,0,0);
  const head=c.createLinearGradient(0,0,0,590);head.addColorStop(0,'#10232b');head.addColorStop(.72,'#10232b');head.addColorStop(1,'#10232b00');c.fillStyle=head;c.fillRect(0,0,1080,590);
  txt(c,'凯撒的复利实验室',70,110,28,'#cadcda',500);txt(c,'02 / ANCHORING',1010,110,25,'#cadcda',500,'right');line(c,70,145,1010,145,'#7a9a9c');
  const title=ease(5.15,5.65,t);c.save();c.beginPath();c.rect(60,185,960,245);c.clip();
  txt(c,'便宜了吗？',70,374-title*260,163,'#f8e6c7',850);txt(c,'价格≠价值',70,374+(1-title)*260,163,'#f8e6c7',850);c.restore();
  txt(c,t<5.4?'旧价格，牵着判断走':'把目光移向未来',77,480,43,'#d2b88e',550);
  if(t>3.45&&t<5.8){const [x,y]=project(-.4,-.3,-1);txt(c,'旧价格的锚',540,1445,54,'#eec895',650,'center');}
  if(show>.3){
   const q=smooth(.3,1,show);c.save();c.globalAlpha=q;
   const [x,y]=project(.7,.85,0);line(c,650,610,x,y-35,'#85c8b9',3);
   txt(c,'未来现金流',650,585,51,'#dfc89f',700,'center');
   txt(c,'＋ 风险',760,1470,55,'#a5d9ca',700,'center');c.restore();
  }
  txt(c,'参照，不等于结论',76,1775,48,'#d9c6a6',700);line(c,70,1815,1010,1815,'#7a9a9c');
  txt(c,'锚定效应 · 假设情境 / 非证券报价',70,1860,27,'#bbd1cc',450);
 };
}
