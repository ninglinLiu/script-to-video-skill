import {createFilm} from './film.mjs';
window.ready=false;
const tl=await(await fetch('assets/timeline-anchor.json')).json();
const glyphs=tl.text+'价签之外锚定效应原价现价参照省了值得吗质量同类价格需要先看东西再看数字原创情境示意凯撒的复利实验室';
await Promise.all([document.fonts.load('700 160px Serif',glyphs),document.fonts.load('700 100px Sans',glyphs)]);await document.fonts.ready;
const draw=await createFilm(tl),c=document.querySelector('#film').getContext('2d',{alpha:false});
window.render=t=>{c.reset();draw(c,Math.max(0,Math.min(60,t)));};
window.meta={width:1080,height:1920,duration:60,fps:30,title:'价签之外',engine:'Poisson renderer + weilanx Nouveau curves + original illustration layers',audioPlayback:'disabled'};
window.__player={total:60000,set:ms=>window.render(ms/1000)};window.render(0);window.ready=true;
