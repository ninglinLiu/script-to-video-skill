export function wrap(text:string){
 const chars=Array.from(text),n=chars.length;if(n<=18)return [text];
 const count=Math.ceil(n/18),target=n/count;let best:string[]=[],score=Infinity;
 function walk(start:number,parts:string[],cost:number){const remain=count-parts.length;
  if(remain===0){if(start===n&&cost<score){score=cost;best=parts;}return;}
  for(let len=6;len<=18;len++){const end=start+len,left=n-end;if(end>n||left<(remain-1)*6||left>(remain-1)*18)continue;
   const punct='，。；：！？'.includes(chars[end-1]),badStart=end<n&&'，。；：！？'.includes(chars[end]);
   walk(end,[...parts,chars.slice(start,end).join('')],cost+(len-target)**2+(remain>1&&!punct?12:0)+(badStart?100:0));}
 }
 walk(0,[],0);return best.length?best:[text];
}
