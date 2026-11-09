import {bundle} from '@remotion/bundler';
import {selectComposition,renderStill,openBrowser} from '@remotion/renderer';
import path from 'node:path';
const serveUrl=await bundle({entryPoint:path.resolve('src/entry.tsx'),publicDir:path.resolve('public')});
const browser=await openBrowser('chrome',{browserExecutable:'C:/Program Files/Google/Chrome/Application/chrome.exe'});
try{
 const composition=await selectComposition({serveUrl,id:'missing25',puppeteerInstance:browser});
 for(const sec of [1.5,4.3,17.5,23.9,26.0,29.2,31.5,33.5,41.5,45.2,49,55]){
  await renderStill({serveUrl,composition,puppeteerInstance:browser,output:`../qa/v2-${sec}.png`,frame:Math.round(sec*30),scale:.5});
  console.log('still',sec);
 }
}finally{await browser.close({silent:true});}
