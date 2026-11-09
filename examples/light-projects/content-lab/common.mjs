export const W=1080,H=1920;
export const clamp=v=>Math.min(1,Math.max(0,v));
export const mix=(a,b,p)=>a+(b-a)*p;
export const smooth=(a,b,t)=>{const p=clamp((t-a)/(b-a));return p*p*(3-2*p)};
export const ease=(a,b,t)=>{const p=clamp((t-a)/(b-a));return p<.5?4*p*p*p:1-Math.pow(-2*p+2,3)/2};
export const pop=(a,t,w=18,z=.68)=>{if(t<=a)return 0;const d=t-a,k=w*Math.sqrt(1-z*z);return 1-Math.exp(-z*w*d)*(Math.cos(k*d)+z*w/k*Math.sin(k*d))};
export function txt(c,s,x,y,size,color,weight=700,align='left',font='Sans'){
 c.fillStyle=color;c.textAlign=align;c.textBaseline='alphabetic';c.font=`${weight} ${size}px "${font}"`;c.fillText(s,x,y);
}
export function line(c,x1,y1,x2,y2,color,width=2){c.strokeStyle=color;c.lineWidth=width;c.beginPath();c.moveTo(x1,y1);c.lineTo(x2,y2);c.stroke()}
export function rect(c,x,y,w,h,col){c.fillStyle=col;c.fillRect(x,y,w,h)}
export function circle(c,x,y,r,col){c.fillStyle=col;c.beginPath();c.arc(x,y,Math.max(.01,r),0,Math.PI*2);c.fill()}
export function path(c,points,col,stroke=null,width=1){c.beginPath();c.moveTo(...points[0]);for(const p of points.slice(1))c.lineTo(...p);c.closePath();if(col){c.fillStyle=col;c.fill()}if(stroke){c.strokeStyle=stroke;c.lineWidth=width;c.stroke()}}
export function round(c,x,y,w,h,r,col){c.beginPath();c.roundRect(x,y,w,h,r);c.fillStyle=col;c.fill()}
export function ring(c,x,y,r,col,width=2){c.beginPath();c.arc(x,y,Math.max(.01,r),0,2*Math.PI);c.lineWidth=width;c.strokeStyle=col;c.stroke()}
export function iso(c,x,y,w,h,col=['#ec8842','#ad472b','#ffd69c']){
 path(c,[[x,y],[x+w,y+w*.45],[x+w,y+w*.45-h],[x,y-h]],col[0]);
 path(c,[[x,y],[x-w,y+w*.45],[x-w,y+w*.45-h],[x,y-h]],col[1]);
 path(c,[[x,y-h-w*.45],[x+w,y-h],[x,y-h+w*.45],[x-w,y-h]],col[2]);
}
export function subtitle(c,t,cues,{color='#eee9de',font='Sans',shadow=true,baseline=1650}={}){
 const cue=cues.find(v=>t>=v.start&&t<v.end+.18);if(!cue)return;
 c.save();c.font=`650 60px "${font}"`;c.textAlign='center';c.textBaseline='alphabetic';
 if(shadow){c.lineJoin='round';c.lineWidth=9;c.strokeStyle='#0b1313';c.strokeText(cue.text,540,baseline)}
 c.fillStyle=color;c.fillText(cue.text,540,baseline);c.restore();
}
export function paperTexture(seed=9){
 const a=document.createElement('canvas');a.width=360;a.height=640;const g=a.getContext('2d');const d=g.createImageData(360,640);
 let n=seed;for(let i=0;i<d.data.length;i+=4){n=(n*1664525+1013904223)>>>0;d.data[i]=d.data[i+1]=d.data[i+2]=n%2?25:255;d.data[i+3]=n%12}g.putImageData(d,0,0);return a;
}
