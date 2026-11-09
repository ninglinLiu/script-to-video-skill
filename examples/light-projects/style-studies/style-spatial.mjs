import * as THREE from './vendor/three.module.min.js';
import {mix,smooth,ease,pop,txt,rect,line,circle,ring} from './common.mjs';
export async function createSpatial(){
 const webgl=document.createElement('canvas');
 const renderer=new THREE.WebGLRenderer({canvas:webgl,antialias:true,preserveDrawingBuffer:true,alpha:false});
 renderer.setSize(1080,1920);renderer.setPixelRatio(1);
 renderer.setClearColor('#101c27');renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.2;
 renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;
 const scene=new THREE.Scene();scene.fog=new THREE.Fog('#101c27',17,34);
 const camera=new THREE.PerspectiveCamera(38,1080/1920,.1,80);
 scene.add(new THREE.HemisphereLight('#d4e6ef','#15272b',2.3));
 const key=new THREE.DirectionalLight('#ffe1af',4.5);key.position.set(-4,9,7);key.castShadow=true;key.shadow.mapSize.set(1024,1024);key.shadow.camera.left=-8;key.shadow.camera.right=8;key.shadow.camera.top=8;key.shadow.camera.bottom=-8;key.shadow.bias=-.001;scene.add(key);
 const rim=new THREE.DirectionalLight('#5cbbdb',4);rim.position.set(5,3,-5);scene.add(rim);
 const amber=new THREE.PointLight('#f8a04b',18,10);amber.position.set(-2,2,3);scene.add(amber);
 const ground=new THREE.Mesh(new THREE.PlaneGeometry(200,200),new THREE.MeshStandardMaterial({color:'#142830',roughness:.64,metalness:.23}));
 ground.rotation.x=-Math.PI/2;ground.position.y=-.11;ground.receiveShadow=true;scene.add(ground);
 const group=new THREE.Group();scene.add(group);
 const shape=new THREE.Shape();shape.moveTo(-.44,-.44);shape.lineTo(.44,-.44);shape.lineTo(.44,.44);shape.lineTo(-.44,.44);shape.closePath();
 const geo=new THREE.ExtrudeGeometry(shape,{depth:.88,bevelEnabled:true,bevelThickness:.06,bevelSize:.06,bevelSegments:3,steps:1});geo.translate(0,0,-.44);
 const mats=[
  new THREE.MeshStandardMaterial({color:'#e77a33',metalness:.32,roughness:.27}),
  new THREE.MeshStandardMaterial({color:'#d8e2da',metalness:.16,roughness:.28}),
  new THREE.MeshStandardMaterial({color:'#527f87',metalness:.6,roughness:.23})];
 const blocks=[];
 for(let i=0;i<9;i++){const m=new THREE.Mesh(geo,mats[i===4?0:i%3===0?2:1]);m.castShadow=true;m.receiveShadow=true;group.add(m);blocks.push(m)}
 const base=new THREE.Mesh(new THREE.CylinderGeometry(2.65,2.74,.16,96),new THREE.MeshStandardMaterial({color:'#253d45',roughness:.33,metalness:.68}));base.position.y=-.015;scene.add(base);
 const gold=new THREE.MeshStandardMaterial({color:'#e8b36c',emissive:'#8f4c16',emissiveIntensity:.25,metalness:.75,roughness:.25});
 const aperture=new THREE.Group();const torus=new THREE.Mesh(new THREE.TorusGeometry(2.12,.055,10,128),gold);aperture.add(torus);
 const inner=new THREE.Mesh(new THREE.TorusGeometry(1.99,.018,6,128),new THREE.MeshBasicMaterial({color:'#c8e5e3'}));aperture.add(inner);
 for(let i=0;i<12;i++){const a=i*Math.PI/6,mark=new THREE.Mesh(new THREE.BoxGeometry(i%3===0?.14:.07,.017,.024),gold);mark.position.set(2.23*Math.cos(a),2.23*Math.sin(a),0);mark.rotation.z=a;aperture.add(mark)}
 scene.add(aperture);
 const tracks=[];
 for(let j=0;j<3;j++){
  const pts=[];for(let i=0;i<=128;i++){const a=i/128*Math.PI*2;pts.push(new THREE.Vector3(Math.cos(a)*(1+j*.72),.08,Math.sin(a)*(1+j*.72)))}
  const l=new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts),new THREE.LineBasicMaterial({color:'#799194',transparent:true,opacity:.3}));scene.add(l);tracks.push(l);
 }
 const connectors=[];
 for(let i=0;i<8;i++){const g=new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(),new THREE.Vector3()]);const l=new THREE.Line(g,new THREE.LineBasicMaterial({color:'#bcceb9',transparent:true,opacity:.8}));scene.add(l);connectors.push(l)}
 const project=v=>{const p=v.clone().project(camera);return[(p.x+1)*540,(1-p.y)*960]};
 return function spatial(c,t){
  const orbit=ease(2.63,4.4,t),spread=ease(5.18,6.23,t),intro=ease(0,.9,t);
  const distance=mix(12.1,14.5,spread);
  const az=mix(-.62,.92,orbit)+.10*smooth(6.25,8,t),el=mix(.33,.70,spread);
  camera.position.set(Math.sin(az)*distance*Math.cos(el),distance*Math.sin(el)+.5,Math.cos(az)*distance*Math.cos(el));
  camera.lookAt(0,mix(1.02,.58,spread),0);
  group.rotation.y=-.12*smooth(.1,2.6,t);
  blocks.forEach((m,i)=>{
   const x=(i%3-1)*.94,z=(Math.floor(i/3)-1)*.94,h=[1.05,1.50,.76,1.72,2.25,1.32,.73,1.21,1.75][i];
   const arrive=pop(i*.055-.08,t,16,.8),angle=(i>4?i-1:i)*Math.PI/4;
   const target=i===4?[0,.62,0]:[Math.cos(angle)*2.02,.48,Math.sin(angle)*2.02];
   const small=i===4?1.12:.68;
   m.scale.set(mix(.77,small,spread),mix(h,small,spread)*Math.max(.01,arrive),mix(.77,small,spread));
   m.position.set(mix(x,target[0],spread),mix(h/2,target[1],spread)+(1-arrive)*3.1,mix(z,target[2],spread));
   m.rotation.y=mix((1-arrive)*.9,(i%2?1:-1)*Math.PI*.12,spread);
   m.rotation.z=(1-arrive)*.35;
  });
  const lensIn=ease(2.45,3.48,t),lensOut=ease(5.0,6.0,t);
  aperture.visible=lensIn>.001;
  aperture.position.set(mix(-5.4,0,lensIn),mix(1.5,.42,lensOut),mix(.5,0,lensOut));
  aperture.rotation.set(mix(0,-Math.PI*.5,lensOut),mix(-.65,.3,orbit)*(1-lensOut),.12*(1-lensOut));
  aperture.scale.setScalar(mix(.72,1.14,lensOut));base.scale.setScalar(mix(1,1.14,spread));
  connectors.forEach((l,i)=>{
   l.visible=spread>.01;const idx=i>=4?i+1:i;const p=blocks[idx].position;const a=l.geometry.attributes.position.array;a.set([0,.69,0,p.x*spread,p.y,p.z*spread]);l.geometry.attributes.position.needsUpdate=true;
  });
  renderer.render(scene,camera);renderer.getContext().finish();
  c.drawImage(webgl,0,0);
  const head=c.createLinearGradient(0,0,0,610);head.addColorStop(0,'#101c27');head.addColorStop(.78,'#101c27');head.addColorStop(1,'#101c2700');c.fillStyle=head;c.fillRect(0,0,1080,610);
  // Editorial annotations stay in screen space; they never imply financial numbers.
  txt(c,'凯撒的复利实验室',72,112,28,'#c3d3d5',500);
  txt(c,'02 / SPATIAL STUDY',1008,112,23,'#c3d3d5',500,'right');
  line(c,72,145,1008,145,'#6c858a',1);
  const k=ease(2.85,3.35,t);
  c.save();c.beginPath();c.rect(65,190,950,200);c.clip();
  txt(c,'价值创造',69,342-k*230,170,'#ede6d7',750);
  txt(c,'价值投资',69,342+(1-k)*230,170,'#ede6d7',750);c.restore();
  txt(c,t<4.55?'从内部搭建，向外部观察':'对象没变，观察的位置变了',76,452,41,'#d2b68e',500);
  if(t>5.7){
   const a=smooth(5.7,6.12,t);c.save();c.globalAlpha=a;
   rect(c,337,1460,406,96,'#101c27');txt(c,'研究价值',540,1530,64,'#f0d5ad',650,'center');c.restore();
  }
  txt(c,'CREATE  →  OBSERVE',76,1770,32,'#b8c8c9',500);
  txt(c,'同一对象 · 视角转换',1007,1770,30,'#b8c8c9',500,'right');
  line(c,72,1815,1008,1815,'#6c858a',1);
  txt(c,'角色转变的视觉比喻',72,1860,25,'#b8c8c9',400);
 };
}
