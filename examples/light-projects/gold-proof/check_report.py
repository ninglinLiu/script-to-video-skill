from pathlib import Path
from playwright.sync_api import sync_playwright
from urllib.parse import urlsplit,unquote
import json
P=Path(__file__).resolve().parent
with sync_playwright() as pw:
    browser=pw.chromium.launch(executable_path='<home>/.cache/hyperframes/chrome/chrome-headless-shell/win64-152.0.7977.30/chrome-headless-shell-win64/chrome-headless-shell.exe',headless=True,args=['--mute-audio'])
    page=browser.new_page(viewport={'width':1440,'height':1100},device_scale_factor=1)
    errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
    page.goto((P/'五步执行报告.html').as_uri(),wait_until='load')
    page.evaluate('document.fonts.ready')
    page.screenshot(path=str(P/'qa/report-desktop.png'))
    info=page.locator('video').evaluate('(v)=>({paused:v.paused,muted:v.muted,autoplay:v.autoplay,duration:v.duration,readyState:v.readyState,currentTime:v.currentTime})')
    assert info['paused'] and info['muted'] and not info['autoplay'] and info['currentTime']==0
    missing=[]
    for href in page.locator('a').evaluate_all('(aa)=>aa.map(a=>a.getAttribute("href"))'):
        if not href or href.startswith(('#','http')):continue
        if not (P/unquote(urlsplit(href).path)).exists():missing.append(href)
    assert not missing,missing
    page.set_viewport_size({'width':390,'height':844})
    page.screenshot(path=str(P/'qa/report-mobile.png'))
    overflow=page.evaluate('document.documentElement.scrollWidth>window.innerWidth')
    assert not overflow,'Report horizontally overflows'
    (P/'qa/report-check.json').write_text(json.dumps({'javascriptErrors':errors,'missingLocalLinks':missing,'video':info,'mobileOverflow':overflow,'method':'headless browser on authored local HTML; never played video','userBrowserControlled':False},ensure_ascii=False,indent=2),encoding='utf-8')
    browser.close()
print('Report desktop/mobile layout and paused silent video verified')
