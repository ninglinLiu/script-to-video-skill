import {readFileSync,writeFileSync} from 'node:fs';
import {wrap} from './src/caption-layout.ts';
import assert from 'node:assert/strict';
const timeline=JSON.parse(readFileSync('src/timing.json','utf8'));
const groups=timeline.subtitles.map(s=>{const rows=wrap(s.text);assert.equal(rows.join(''),s.text);assert(rows.length<=3);assert(rows.every(r=>Array.from(r).length<=18));if(rows.length>1)assert(rows.every(r=>Array.from(r).length>=6));return {...s,rows};});
writeFileSync('../qa/subtitle-layout.json',JSON.stringify({count:groups.length,maxLineChars:18,noOrphanRows:true,groups},null,2));
console.log(`Validated ${groups.length} subtitle groups: complete text, 1–3 rows, no orphan rows.`);
