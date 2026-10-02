"""Playwright-verifiering av /traderider/spel/ m.fl. mot en lokal server som efterliknar GitHub Pages.
Kör: python3 verifiera.py <bas-URL> <skärmdumpsmapp> <resultat.json>
Kräver Chrome (/usr/bin/google-chrome). Den här filen ligger i traderider/app/ (laddas inte upp till Pages)."""
import asyncio, json, re, sys
from playwright.async_api import async_playwright

BASE, OUT, RES = sys.argv[1].rstrip('/'), sys.argv[2].rstrip('/') + '/', sys.argv[3]
VIEWS = {
    'desktop': dict(viewport={'width': 1280, 'height': 800}, device_scale_factor=1),
    'mobil': dict(viewport={'width': 390, 'height': 844}, device_scale_factor=2, is_mobile=True, has_touch=True),
}
# Kända fel lokalt: sajtens (SPA:ns och /nvda-rider/:s) externa API-värd (trycloudflare) svarar inte.
# Spelet under /traderider/spel/ får inte fråga någon extern värd alls (kontrolleras separat nedan).
KNOWN = [re.compile(r'trycloudflare\.com'), re.compile(r'net::ERR_NAME_NOT_RESOLVED')]
SIM = 'Simulerade kurser – inte verkliga marknadsdata'
# Påståenden om verkliga kurser som inte får synas i spelet eller på /traderider/
BADGE = 'VERKLIG · HISTORISK'
REALCLAIM = [r'[Hh]istorisk', r'[Rr]iktiga (historiska )?(NVDA-)?kurser', r'äkta historiska', r'real historical', r'live (stock )?chart', r'NVIDIA', r'LiveTrend']
# Värdar/filer som spelet aldrig får begära
FORBIDDEN_REQ = re.compile(r'(?i)trycloudflare|yahoo|query[12]\.|alpaca|paper-api|nvda-fallback|/api/nvda|/api/broker')
BANNED = [r'DemoFrame', r'RiderDesk', r'Övningskapital', r'\$\s?100[,.\s]?000', r'100[\s\u00a0,.]000\s*USD', r'20-SMA',
          r'[Pp]aus\s*·\s*([Mm]ellanslag|Space)', r'[Aa]lla lägen', r'[Hh]ävstång\s*[–−+-]\s*(·|\[|\]|$)', r'[Hh]ävstång[^\n]{0,12}\[\s*\]',
          r'[Kk]onduktör', r'(?<![\wåäö])(Köp|Sälj|Platt|Övre|Undre)(?![\wåäö])', r'Fler lägen kommer', r'[Dd]iplom', r'[Ii]ntyg',
          r'godkänd för signaler', r'redo att handla', r'förstått riskerna', r'(?<![\wÅÄÖåäö])\u00d6B(?![\wÅÄÖåäö])', r'Sign in', r'Logga in']
TRAIN = '''async()=>{const e=window.__trEngine;const s=()=>({x:e.train.x,y:e.train.y,a:e.train.angle,flat:!!e.train.flat,side:e.train.side,playing:!!e.playing});
 const a=s();await new Promise(r=>setTimeout(r,500));const b=s();
 const P=e.track.points;let i=P.findIndex(p=>p.x>=b.x);i=Math.max(1,Math.min(P.length-1,i));
 const trackSlope=Math.atan2(P[i].y-P[i-1].y,P[i].x-P[i-1].x);
 const cv=[...document.querySelectorAll('canvas')].filter(c=>c.offsetParent!==null||getComputedStyle(c).position==='fixed').sort((p,q)=>q.clientWidth*q.clientHeight-p.clientWidth*p.clientHeight)[0];
 const r=cv.getBoundingClientRect();const z=e.cam.z,w=e.w,h=e.h;
 const sx=r.left+w/2+z*(b.x-e.cam.x-w/2),sy=r.top+h/2+z*(b.y-e.cam.y-h/2);
 return {a,b,dx:b.x-a.x,cosAngle:Math.cos(b.a),angleMinusTrack:b.a-trackSlope,screen:{x:sx,y:sy,z}}}'''

def banned_hits(text):
    return [rx for rx in BANNED if re.search(rx, text, re.M)]

def real_claims(text):
    cleaned = text.replace(BADGE, '')
    return [rx for rx in REALCLAIM if re.search(rx, cleaned, re.M)]

async def run_view(b, name, opt):
    ctx = await b.new_context(**opt)
    pg = await ctx.new_page()
    log = {'console': [], 'pageerror': [], 'http': []}
    pg.on('console', lambda m: m.type == 'error' and log['console'].append(m.text))
    pg.on('pageerror', lambda e: log['pageerror'].append(str(e)[:300]))
    pg.on('response', lambda r: r.status >= 400 and log['http'].append(f'{r.status} {r.url}'))
    pg.on('requestfailed', lambda r: log['http'].append(f'FAILED {r.url} {r.failure}'))
    reqs = []
    pg.on('request', lambda r: reqs.append(r.url))
    async def sim_label():
        return await pg.evaluate('''()=>{const e=document.querySelector('.tr-sim');if(!e)return null;const r=e.getBoundingClientRect();
          const cs=getComputedStyle(e);return {text:e.textContent,x:r.left,y:r.top,w:r.width,h:r.height,vis:cs.display!=='none'&&cs.visibility!=='hidden'&&+cs.opacity>0,
          inView:r.left>=0&&r.top>=0&&r.right<=innerWidth&&r.bottom<=innerHeight}}''')
    def label_ok(lb):
        return bool(lb) and lb['text'] == SIM and lb['vis'] and lb['inView'] and lb['w'] > 100
    res = {'checks': {}, 'pages': {}}
    def ok(key, cond, detail=None):
        res['checks'][key] = {'ok': bool(cond), **({'detail': detail} if detail is not None else {})}
    async def visit(key, url, wait=2500, until='load'):
        n0 = (len(log['console']), len(log['pageerror']), len(log['http']))
        r = await pg.goto(BASE + url, wait_until=until)
        await pg.wait_for_timeout(wait)
        class R: status = None
        return (r or R()), n0
    def unexpected(n0, extra=()):
        allow = KNOWN + [re.compile(x) for x in extra]
        errs = log['console'][n0[0]:] + log['pageerror'][n0[1]:]
        http = log['http'][n0[2]:]
        bad_http = [e for e in http if not any(k.search(e) for k in allow)]
        allowed_status = len(http) - len(bad_http)
        bad = []
        for e in errs:
            if any(k.search(e) for k in allow):
                continue
            if e.startswith('Failed to load resource: the server responded with a status of') and allowed_status > 0:
                allowed_status -= 1  # konsolraden som hör till ett tillåtet HTTP-svar ovan
                continue
            bad.append(e)
        return bad + bad_http
    async def page_text():
        return await pg.evaluate('()=>document.body.innerText')
    S = lambda n: OUT + f'{n}-{name}.jpg'

    # 1. Startsidan
    r, n0 = await visit('root', '/')
    t = await page_text()
    res['pages']['/'] = {'status': r.status, 'unexpected': unexpected(n0), 'banned': banned_hits(t)}
    ok('/ laddar (200) utan JS-fel', r.status == 200 and not unexpected(n0))

    # 2. /traderider/
    r, n0 = await visit('tr', '/traderider/', 1500)
    t = await page_text()
    hrefs = await pg.eval_on_selector_all('a.mode', 'els=>els.map(e=>e.getAttribute("href"))')
    res['pages']['/traderider/'] = {'status': r.status, 'hrefs': hrefs, 'unexpected': unexpected(n0), 'banned': banned_hits(t)}
    ok('/traderider/ har fyra kort: Trade Rider, RaceX, Akademin, Rabbit Hole', hrefs == ['/traderider/spel/#nvda-rider', '/traderider/spel/#racex', '/traderider/spel/#academy', '/traderider/spel/#rabbit-hole'], hrefs)
    ok('/traderider/ utan «Fler lägen kommer.» och utan spärrade ord', not banned_hits(t), banned_hits(t))
    ok('/traderider/ utan JS-fel', not unexpected(n0), unexpected(n0))
    ok('/traderider/ visar «Simulerade kurser – inte verkliga marknadsdata» och påstår inga verkliga kurser', SIM in t and not real_claims(t), real_claims(t))
    r0 = len(reqs)
    await pg.screenshot(path=S('01-traderider'), type='jpeg', quality=85, full_page=False)
    await pg.screenshot(path=S('01-traderider-helsida'), type='jpeg', quality=80, full_page=True)

    # 3. Klick på NVDA Rider-kortet -> spelet
    await pg.click('a.mode[href="/traderider/spel/#nvda-rider"]')
    await pg.wait_for_function('()=>window.__trEngine&&window.__nvdaLineRsi', timeout=20000)
    await pg.wait_for_timeout(1500)
    n0 = (len(log['console']), len(log['pageerror']), len(log['http']))
    view = await pg.evaluate('()=>window.__nvdaLineRsi.view()')
    pressed = await pg.evaluate('()=>[...document.querySelectorAll(".nlr-toggle button")].filter(b=>b.getAttribute("aria-pressed")==="true").map(b=>b.textContent)')
    ok('Trade Rider öppnas från kortet (vy line, «Trade Rider» aktiv)', view == 'line' and 'Trade Rider' in pressed, {'view': view, 'pressed': pressed, 'url': pg.url})
    btn = pg.get_by_role('button', name='Board the train')
    if await btn.count():
        await btn.first.click()
    await pg.wait_for_timeout(300)
    await pg.keyboard.press('w')
    await pg.wait_for_timeout(3200)
    tr = await pg.evaluate(TRAIN)
    res['train'] = tr
    fwd = tr['dx'] > 0 and tr['cosAngle'] > 0 and abs(tr['angleMinusTrack']) < 0.35
    ok('Loket kör framåt (x ökar, lokets +x = plog/skorsten pekar i färdriktningen, vinkel följer rälsen)', fwd, {k: tr[k] for k in ('dx', 'cosAngle', 'angleMinusTrack')})
    await pg.evaluate('()=>window.__trEngine.pause()')
    await pg.wait_for_timeout(200)
    tr2 = await pg.evaluate(TRAIN)
    sx, sy, z = tr2['screen']['x'], tr2['screen']['y'], tr2['screen']['z']
    vw, vh = opt['viewport']['width'], opt['viewport']['height']
    w, h = 150 * z, 110 * z
    clip = {'x': max(0, sx - w / 2), 'y': max(0, sy - h * 0.62), 'width': min(w, vw - max(0, sx - w / 2)), 'height': min(h, vh - max(0, sy - h * 0.62))}
    await pg.screenshot(path=OUT + f'loket-zoom-{name}.png', clip=clip)
    await pg.screenshot(path=S('02-trade-rider'), type='jpeg', quality=85)
    t = await page_text()
    res['pages']['nvda-rider'] = {'unexpected': unexpected(n0), 'banned': banned_hits(t)}
    ok('NVDA Rider utan spärrade ord i sidtexten', not banned_hits(t), banned_hits(t))
    lb = await sim_label()
    ok('NVDA Rider visar etiketten «Simulerade kurser – inte verkliga marknadsdata»', label_ok(lb), lb)
    ok('NVDA Rider påstår inga verkliga kurser (historisk/NVIDIA/live)', not real_claims(t), real_claims(t))

    # 4. Helskärm
    await pg.click('.tr-skal button.tr-fs')
    await pg.wait_for_timeout(700)
    fs_on = await pg.evaluate('()=>({api:!!document.fullscreenElement,css:document.documentElement.classList.contains("tr-fs-css"),label:document.querySelector(".tr-skal button.tr-fs").getAttribute("aria-label")})')
    await pg.click('.tr-skal button.tr-fs')
    await pg.wait_for_timeout(700)
    fs_off = await pg.evaluate('()=>({api:!!document.fullscreenElement,css:document.documentElement.classList.contains("tr-fs-css"),label:document.querySelector(".tr-skal button.tr-fs").getAttribute("aria-label")})')
    ok('Helskärmsknappen går in och ur helskärm', (fs_on['api'] or fs_on['css']) and not (fs_off['api'] or fs_off['css']), {'på': fs_on, 'av': fs_off})

    # 5. Raket via växeln
    await pg.get_by_role('button', name='RaceX', exact=True).click()
    await pg.wait_for_timeout(1200)
    st = await pg.evaluate('()=>({view:window.__nvdaLineRsi.view(),hash:location.hash,linePaused:!window.__trEngine.playing})')
    ok('Växeln byter till RaceX (#racex, Trade Rider pausas)', st['view'] == 'raket' and st['hash'] == '#racex' and st['linePaused'], st)
    await pg.keyboard.press('r'); await pg.wait_for_timeout(200)
    await pg.keyboard.press('w'); await pg.wait_for_timeout(2600)
    rk = await pg.evaluate('()=>{const s=window.__nvdaLineRsi.raket.state();return {p:s.p,side:s.side,playing:s.playing,lev:s.lev}}')
    ok('Raket spelar (BUY, positionen rör sig)', rk['playing'] and rk['side'] == 'buy' and rk['p'] > 0, rk)
    await pg.keyboard.press('p'); await pg.wait_for_timeout(300)
    await pg.screenshot(path=S('03-raket'), type='jpeg', quality=85)
    t = await page_text()
    res['pages']['raket'] = {'banned': banned_hits(t), 'state': rk}
    ok('Raket utan spärrade ord i sidtexten', not banned_hits(t), banned_hits(t))
    lb = await sim_label()
    ok('Raket visar etiketten «Simulerade kurser – inte verkliga marknadsdata»', label_ok(lb) and not real_claims(t), {'label': lb, 'claims': real_claims(t)})

    # 6. Akademin via växeln
    await pg.get_by_role('button', name='Akademin', exact=True).click()
    await pg.wait_for_timeout(1200)
    st = await pg.evaluate('()=>({view:window.__nvdaLineRsi.view(),hash:location.hash})')
    t = await page_text()
    ok('Växeln byter till Akademin (#academy, lektioner och utmärkelser syns)', st['view'] == 'akademin' and st['hash'] == '#academy' and 'Dina utmärkelser' in t and 'Lektion 1 av 4' in t.replace('LEKTION', 'Lektion').replace(' AV ', ' av '), st)
    rd = pg.get_by_role('button', name=re.compile('Jag har läst'))
    if await rd.count():
        await rd.first.click(); await pg.wait_for_timeout(900)
    await pg.screenshot(path=S('04-akademin'), type='jpeg', quality=85)
    t = await page_text()
    res['pages']['akademin'] = {'banned': banned_hits(t)}
    ok('Akademin utan spärrade/förbjudna ord i sidtexten', not banned_hits(t), banned_hits(t))
    ok('Akademin kallar belöningen «utmärkelse»', 'utmärkelse' in t.lower())
    lb = await sim_label()
    ok('Akademin visar etiketten «Simulerade kurser – inte verkliga marknadsdata»', label_ok(lb) and not real_claims(t), {'label': lb, 'claims': real_claims(t)})

    # 7. Tillbaka till NVDA Rider via växeln
    await pg.get_by_role('button', name='Trade Rider', exact=True).click()
    await pg.wait_for_timeout(800)
    ok('Växeln tillbaka till NVDA Rider', await pg.evaluate('()=>window.__nvdaLineRsi.view()') == 'line')
    res['pages']['spel-alla-lagen'] = {'unexpected': unexpected(n0)}
    ok('Spelet (alla fyra lägen) utan oväntade JS-fel', not unexpected(n0), unexpected(n0))
    spel_reqs = reqs[r0:]
    bad_req = [u for u in spel_reqs if FORBIDDEN_REQ.search(u)]
    ext = sorted({u.split('/')[2] for u in spel_reqs if u.startswith('http') and not u.startswith(BASE)} - {'fonts.googleapis.com', 'fonts.gstatic.com'})  # bara typsnitt utifrån
    res['spel_requests'] = {'antal': len(spel_reqs), 'forbjudna': bad_req, 'externa_vardar': ext}
    ok('Spelet laddar bara simulerade kurser: simulerad-kurs.json hämtas, ingen extern kurs-API, ingen mäklar-API, ingen fil med verkliga kurser, ingen extern värd utom typsnitt',
       any(u.endswith('/traderider/spel/data/simulerad-kurs.json') for u in spel_reqs) and not bad_req and not ext, res['spel_requests'])

    # 8. Direktlänkar med hash
    for h, v in [('#nvda-rider', 'line'), ('#racex', 'raket'), ('#raket', 'raket'), ('#academy', 'akademin'), ('#akademin', 'akademin'), ('#rabbit-hole', 'rabbit')]:
        await pg.goto(BASE + '/traderider/')
        r, n0 = await visit('h', '/traderider/spel/' + h, 300)
        await pg.wait_for_function('()=>window.__nvdaLineRsi', timeout=20000)
        await pg.wait_for_timeout(900)
        got = await pg.evaluate('()=>window.__nvdaLineRsi.view()')
        ok(f'Direktlänk /traderider/spel/{h} öppnar rätt läge', got == v and not unexpected(n0), {'view': got, 'unexpected': unexpected(n0)})

    # 9. Gamla demoadresser
    for old, target, v in [('/traderider/demo/', '/traderider/', None), ('/traderider/demo/tag/', '/traderider/spel/#nvda-rider', 'line'),
                           ('/traderider/demo/raket/', '/traderider/spel/#racex', 'raket'), ('/traderider/demo/akademin/', '/traderider/spel/#academy', 'akademin')]:
        r, n0 = await visit('old', old, 600)
        if v:
            await pg.wait_for_function('()=>window.__nvdaLineRsi', timeout=20000)
            await pg.wait_for_timeout(900)
        got = await pg.evaluate('()=>window.__nvdaLineRsi?window.__nvdaLineRsi.view():null')
        path = pg.url.replace(BASE, '')
        if v is None:
            path_ok = path == target
        else:
            path_ok = path.split('#')[0] == '/traderider/spel/' and got == v
        t = await page_text()
        ok(f'{old} -> {target}', path_ok and not banned_hits(t) and not unexpected(n0), {'url': path, 'view': got, 'banned': banned_hits(t), 'unexpected': unexpected(n0)})
    # 10. SPA-rutter och /nvda-rider/
    for spa in ['/tradingskolan', '/nyheter', '/player-value', '/om-modellen/']:
        r, n0 = await visit('spa', spa, 1800)
        t = await page_text()
        bad = unexpected(n0, [re.escape(BASE + spa) + '$', r'/newsletters/\d{4}-\d{2}-\d{2}\.json'])
        ok(f'SPA-rutt {spa} renderar ({r.status}) utan JS-fel', len(t.strip()) > 50 and not bad, {'status': r.status, 'chars': len(t), 'unexpected': bad,
           'not': 'befintligt: Pages svarar 404 för okända rutter (404.html = SPA) och /nyheter frågar efter dagens nyhetsbrev-JSON'})
    r, n0 = await visit('nvda', '/nvda-rider/', 2500)
    bad = unexpected(n0, [r'/api/auth/get-session'])
    ok('/nvda-rider/ (oförändrad) laddar 200 utan oväntade JS-fel', r.status == 200 and not bad, {'unexpected': bad, 'not': 'befintligt: /nvda-rider/ frågar /api/auth/get-session (404 på Pages)'})
    res['log'] = log
    await ctx.close()
    return res

async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(executable_path='/usr/bin/google-chrome', args=['--no-sandbox'])
        out = {}
        for name, opt in VIEWS.items():
            out[name] = await run_view(b, name, opt)
        await b.close()
    json.dump(out, open(RES, 'w'), indent=1, ensure_ascii=False)
    fails = [(v, k, c.get('detail')) for v in out for k, c in out[v]['checks'].items() if not c['ok']]
    for v in out:
        n = len(out[v]['checks']); f = sum(1 for c in out[v]['checks'].values() if not c['ok'])
        print(f'{v}: {n - f}/{n} OK')
    for f in fails: print('FAIL', f)
    sys.exit(1 if fails else 0)

asyncio.run(main())
