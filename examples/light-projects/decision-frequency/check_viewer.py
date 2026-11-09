from pathlib import Path
from playwright.sync_api import sync_playwright
from urllib.parse import urlsplit,unquote
import json,os
P=Path(__file__).resolve().parent
with sync_playwright() as pw:
 browser=pw.chromium.launch(executable_path=os.environ.get('REMOTION_BROWSER','<home>/.cache/hyperframes/chrome/chrome-headless-shell/win64-152.0.7977.30/chrome-headless-shell-win64/chrome-headless-shell.exe'),headless=True,args=['--mute-audio'])
 page=browser.new_page(viewport={'width':1440,'height':1100},device_scale_factor=1)
 errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
 page.goto((P/'watch.html').as_uri(),wait_until='load');page.evaluate('document.fonts.ready')
 page.screenshot(path=str(P/'qa/viewer-desktop.png'))
 info=page.locator('video').evaluate('(v)=>({paused:v.paused,muted:v.muted,autoplay:v.autoplay,currentTime:v.currentTime,preload:v.preload,source:v.querySelector("source").getAttribute("src")})')
 assert info['paused'] and info['muted'] and not info['autoplay'] and info['currentTime']==0
 assert info['source']=='out/final-silent.mp4' and info['preload']=='none'
 missing=[]
 for href in page.locator('a').evaluate_all('(aa)=>aa.map(a=>a.getAttribute("href"))'):
  if not href or href.startswith(('#','http')):continue
  # ZIP is built after the viewer check so that this QA record can be included.
  if href.endswith('.zip'):continue
  if not (P/unquote(urlsplit(href).path)).exists():missing.append(href)
 assert not missing,missing
 page.set_viewport_size({'width':390,'height':844})
 page.screenshot(path=str(P/'qa/viewer-mobile.png'))
 overflow=page.evaluate('document.documentElement.scrollWidth>window.innerWidth')
 assert not overflow
 page.locator('details').evaluate_all('(dd)=>dd.forEach(d=>d.open=true)')
 expandedOverflow=page.evaluate('document.documentElement.scrollWidth>window.innerWidth')
 assert not expandedOverflow
 page.locator('#cover').click()
 page.wait_for_function('document.querySelector("video").currentTime > 0.1',timeout=30000)
 played=page.locator('video').evaluate('(v)=>({paused:v.paused,muted:v.muted,currentTime:v.currentTime,duration:v.duration})')
 assert not played['paused'] and played['muted']
 page.locator('.chapter').nth(5).click()
 page.wait_for_function('document.querySelector("video").currentTime > 93',timeout=15000)
 seek=page.locator('video').evaluate('(v)=>{v.pause();return {currentTime:v.currentTime,muted:v.muted,paused:v.paused}}')
 assert seek['muted'] and seek['paused']
 assert not errors,errors
 (P/'qa/viewer-check.json').write_text(json.dumps({'javascriptErrors':errors,'missingLocalLinks':missing,'initialVideo':info,'mutedHeadlessPlayback':played,'mutedHeadlessSeek':seek,'mobileOverflow':overflow,'expandedOverflow':expandedOverflow,'method':'dedicated muted headless browser on locally authored viewer; silent MP4 playback and chapter seek checked','userBrowserControlled':False},ensure_ascii=False,indent=2),encoding='utf-8')
 browser.close()
print('Viewer: desktop/mobile, initial pause, audio-free playback and chapter seek passed')

