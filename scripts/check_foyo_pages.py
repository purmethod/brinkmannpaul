# every page, every state, every language: no "[object", no "null", no "undefined" on screen
import asyncio, http.server, threading, functools, json
from playwright.async_api import async_playwright
import os, sys
root=os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'somaflow')
class Q(http.server.SimpleHTTPRequestHandler):
    def log_message(self,*a): pass
srv=http.server.ThreadingHTTPServer(('127.0.0.1',8766),functools.partial(Q,directory=root)); threading.Thread(target=srv.serve_forever,daemon=True).start()
SESS={"places":7,"sessions":[{"id":"s1","when":"2026-11-20T09:00","place":"creative hub, sidi bou said","map":"https://maps.google.com","price":50,"left":3},{"id":"s2","when":"2026-11-27","place":"","price":50,"left":0}]}
BAD=['[object','undefined','null','NaN']
async def main():
    async with async_playwright() as p:
        b=await p.chromium.launch(executable_path='/usr/bin/google-chrome',args=['--no-sandbox'])
        problems=[]
        for lang in ['en','de','fr','es','ar','ru']:
            for path in ['/','/paul/','/nafisa/','/yury/','/judit/','/apply/']:
                for state in (['fresh','booked','done'] if path=='/' else ['fresh']):
                    ctx=await b.new_context(viewport={'width':390,'height':844})
                    pg=await ctx.new_page()
                    await pg.route('https://brinkmannpaul.com/api/soma**', lambda r: r.fulfill(status=200, content_type='application/json', body=json.dumps(SESS), headers={'access-control-allow-origin':'*'}))
                    errs=[]; pg.on('pageerror', lambda e: errs.append(str(e)))
                    init=f"sessionStorage.setItem('soma-flow-club-lang','{lang}');"
                    if state!='fresh': init+="localStorage.setItem('soma-flow-club', JSON.stringify({booking:{id:'x',name:'paul',when:'2026-11-20T09:00',place:'creative hub, sidi bou said',map:'https://maps.google.com',price:50,group:'https://chat.whatsapp.com/x'}}));"
                    await pg.add_init_script(init)
                    await pg.goto('http://127.0.0.1:8766'+path); await pg.wait_for_timeout(700)
                    if state=='done':
                        btn=pg.locator('.mine button'); 
                        if await btn.count(): await btn.first.click(); await pg.wait_for_timeout(300)
                    txt=await pg.inner_text('body')
                    hits=[w for w in BAD if w in txt.split() or (w=='[object' and w in txt)]
                    if hits or errs: problems.append((lang,path,state,hits,errs[:2]))
                    await ctx.close()
        await b.close()
        print('problems:', problems if problems else 'none')
asyncio.run(main())
