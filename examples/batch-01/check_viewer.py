from pathlib import Path
from playwright.sync_api import sync_playwright
from urllib.parse import unquote,urlsplit
import json,os
P=Path(__file__).resolve().parent
with sync_playwright() as pw:
 b=pw.chromium.launch(executable_path=os.environ.get('REMOTION_BROWSER'),headless=True,args=['--mute-audio'])
 page=b.new_page(viewport={'width':1440,'height':1050},device_scale_factor=1)
 errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
 page.goto((P/'index.html').as_uri(),wait_until='load');page.evaluate('document.fonts.ready')
 initial=page.locator('video').evaluate_all('(vs)=>vs.map(v=>({paused:v.paused,muted:v.muted,autoplay:v.autoplay,src:v.getAttribute("src")}))')
 assert len(initial)==6 and all(v['paused'] and v['muted'] and not v['autoplay'] for v in initial)
 missing=[]
 for u in page.locator('[href],[src],[poster]').evaluate_all('(els)=>els.flatMap(e=>[e.getAttribute("href"),e.getAttribute("src"),e.getAttribute("poster")]).filter(Boolean)'):
  if u.startswith(('#','http','data:')):continue
  if not (P/unquote(urlsplit(u).path)).exists():missing.append(u)
 assert not missing,missing
 page.screenshot(path=str(P/'qa/viewer-desktop.png'))
 page.locator('[data-target="matrix"]').click()
 page.wait_for_function('Array.from(document.querySelectorAll("[data-pair=matrix] video")).every(v=>v.currentTime>.2)')
 played=page.locator('[data-pair=matrix] video').evaluate_all('(vs)=>vs.map(v=>({muted:v.muted,currentTime:v.currentTime,paused:v.paused}))')
 assert all(v['muted'] and not v['paused'] for v in played)
 page.locator('video').evaluate_all('(vs)=>vs.forEach(v=>v.pause())')
 page.locator('[data-id="tree"] [data-value="keep"]').click()
 assert page.locator('[data-id="tree"] [data-value="keep"]').get_attribute('class')=='active'
 page.reload();assert page.locator('[data-id="tree"] [data-value="keep"]').get_attribute('class')=='active'
 page.set_viewport_size({'width':390,'height':844})
 assert not page.evaluate('document.documentElement.scrollWidth>innerWidth')
 page.screenshot(path=str(P/'qa/viewer-mobile.png'))
 assert not errors,errors
 (P/'qa/viewer-check.json').write_text(json.dumps({'initial':initial,'parallelPlayback':played,'missingLocalLinks':missing,'javascriptErrors':errors,'mobileOverflow':False,'feedbackPersistence':True,'method':'dedicated muted headless browser; does not alter user browser'},ensure_ascii=False,indent=2),encoding='utf-8')
 b.close()
print('Viewer: paused/muted default, 6 sources, A/B playback, feedback and mobile layout passed.')
