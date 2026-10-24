import React from 'react';
import {rand} from '../../upstream/anim';
import {project, R, RF, rotate, V3} from './theme';

const path = (v: V3[], ay:number,ax:number,az:number) => v.map((p,i)=>{const q=project(rotate(p,ay,ax,az));return `${i?'L':'M'}${q.x.toFixed(2)},${q.y.toFixed(2)}`;}).join(' ');

/** 透视文字带：每个字块取局部切线，近景放大，远景收小，不是平面转盘。 */
export const TypeOrbit: React.FC<{f:number;radius?:number;tilt?:number;roll?:number;color?:string;density?:number;spread?:number;words?:string[];accent?:string}> = ({f,radius=380,tilt=.8,roll=0,color=R.paper,density=34,spread=0,words=['RIGHT','WRONG','TRUE','FALSE','WHY?','LABEL','对','错'],accent=R.red}) => {
  const items=Array.from({length:density},(_,i)=>{
    const a=i/density*Math.PI*6+f*.014;
    const rr=radius+Math.sin(i*1.91)*70+spread*(80+rand(i+41)*520);
    const y=(i/density-.5)*650;
    const p:V3=[Math.cos(a)*rr,y,Math.sin(a)*rr];
    const tangent:V3=[p[0]-Math.sin(a)*20,p[1],p[2]+Math.cos(a)*20];
    const up:V3=[p[0],p[1]+20,p[2]];
    const q=project(rotate(p,f*.004,tilt,roll)),u=project(rotate(tangent,f*.004,tilt,roll)),v=project(rotate(up,f*.004,tilt,roll));
    return {i,q,m:`matrix(${(u.x-q.x)/20} ${(u.y-q.y)/20} ${(v.x-q.x)/20} ${(v.y-q.y)/20} ${q.x} ${q.y})`};
  }).sort((a,b)=>b.q.z-a.q.z);
  return <g>{items.map(({i,q,m})=><g key={i} transform={m} opacity={Math.max(.18,Math.min(1,1-q.z/1700))}>
    <text textAnchor="middle" fontSize={i%7===0?78:46} fontFamily={i%8>5?RF.cn:RF.en} fill={i%4===0?accent:color} letterSpacing="1">{words[i%words.length]}</text>
    {i%3===0&&<path d="M-100,12 H100" stroke={color} strokeWidth=".8"/>}
  </g>)}</g>;
};

/** 经线与纬线球体：同一个主体在红色实体、银色实体和空心线框之间转换。 */
export const Core: React.FC<{f:number;r?:number;wire?:number;red?:boolean}> = ({f,r=140,wire=0,red=true}) => {
  const ay=f*.013,ax=.35+Math.sin(f*.009)*.5;
  const curves:V3[][]=[];
  for(let j=0;j<14;j++) curves.push(Array.from({length:65},(_,k)=>{const a=k/64*Math.PI*2,b=j/14*Math.PI;return [r*Math.cos(a)*Math.sin(b),r*Math.sin(a),r*Math.cos(a)*Math.cos(b)];}));
  for(let j=-4;j<=4;j++){const y=j*r/5,rr=Math.sqrt(r*r-y*y);curves.push(Array.from({length:65},(_,k)=>[rr*Math.cos(k/64*Math.PI*2),y,rr*Math.sin(k/64*Math.PI*2)]));}
  return <g>
    <defs>
      <radialGradient id={`orb${red?'red':'silver'}`} cx="30%" cy="22%" r="83%"><stop offset="0" stopColor={red?'#ffcfce':'#ffffff'}/><stop offset=".18" stopColor={red?'#ff536b':'#a2b7c4'}/><stop offset=".43" stopColor={red?'#c60c38':'#141e27'}/><stop offset=".53" stopColor={red?'#6f001d':'#050a10'}/><stop offset=".64" stopColor={red?'#dd1945':'#dbe9ee'}/><stop offset=".82" stopColor={red?'#a80529':'#425864'}/><stop offset="1" stopColor="#08060c"/></radialGradient>
      <radialGradient id="halo"><stop stopColor={R.red} stopOpacity=".28"/><stop offset="1" stopColor={R.red} stopOpacity="0"/></radialGradient>
    </defs>
    <circle r={r*2.15} fill="url(#halo)" opacity={red?.7:.15}/>
    <circle r={r} fill={`url(#orb${red?'red':'silver'})`} opacity={1-wire*.96}/>
    <g stroke={red?R.pink:R.silver} fill="none" strokeWidth={wire>.5?1.5:.85} opacity={.14+.78*wire}>
      {curves.map((c,i)=><path key={i} d={path(c,ay,ax,0)}/>)}
    </g>
    <circle r={r} fill="none" stroke={red?'#ffb5c3':'white'} strokeWidth="1" opacity=".6"/>
  </g>;
};

/** 轨道与方形门：可穿越的三维空间结构，z 深度产生遮挡与视差。 */
export const Gates:React.FC<{f:number;travel?:number;color?:string;count?:number;twist?:number}> = ({f,travel=0,color=R.paper,count=20,twist=0}) => <g fill="none" stroke={color}>
  {Array.from({length:count},(_,i)=>{
    const depth=((i*180-travel)%3600+3600)%3600-800;
    const a=i*.14+f*.004+twist;
    const size=280+(Math.sin(i*.9)+1)*85;
    const v:V3[]=Array.from({length:5},(_,j)=>{const n=j%4,ang=n*Math.PI/2+Math.PI/4;return [Math.cos(ang)*size,Math.sin(ang)*size,depth];});
    const d=path(v,.12*Math.sin(f*.01),.08,a);
    return <path key={i} d={d} strokeWidth={i%4===0?3:1.2} opacity={.15+.6*(1-(depth+800)/3600)}/>;
  })}
</g>;

/** 轨道细线只衬托形体，不承载解释文字。 */
export const OrbitLines:React.FC<{f:number;color?:string;radius?:number}> = ({f,color=R.paper,radius=400}) => <g fill="none" stroke={color} strokeWidth="1.2" opacity=".6">
  {Array.from({length:7},(_,i)=>{const c:V3[]=Array.from({length:129},(_,j)=>{const a=j/128*Math.PI*2;return [radius*Math.cos(a),radius*Math.sin(a),0];});return <path key={i} d={path(c,f*.003+i*.41,.5+i*.25,f*.002)}/>;})}
</g>;
