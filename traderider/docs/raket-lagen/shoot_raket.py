import asyncio, json, sys
from playwright.async_api import async_playwright
B='http://127.0.0.1:8815'; O='/workspace/traderider/ingang/ks-klon/traderider/docs/raket-lagen/shots/'
MODES=['niva','tid','budget','stopp','chock','spoke']
MC_T={'niva':(3,None),'tid':(3,None),'budget':(7.5,5),'stopp':(10,5),'chock':(9,6),'spoke':(3,None)}
RES={}

JS_RUN="""async ([cond,maxn,ms])=>{const T=window.__raketSpelTest; let g=T.get(); let n=0;
 const ok={
  mc:(g)=>g.margin.countdownMs!=null && g.margin.countdownMs<=3200,
  end:(g)=>g.phase!=='ride',
 };
 while(g.phase==='ride' && n<maxn){ if(cond!=='n' && ok[cond](g)) break; g=T.step(ms); n++ }
 await new Promise(r=>setTimeout(r,250));
 g=T.get(); return {n,phase:g.phase,prog:+g.desk.progress.toFixed(2),lvl:g.margin.level,cd:g.margin.countdownMs,msg:g.message&&g.message.text,end:g.end,side:g.live&&g.live.side,usedR:g.usedR,shock:g.shock}}"""

async def load(pg, mode, name):
  await pg.goto(B+f'/traderider/demo/raket/?lage={mode}',wait_until='networkidle'); await pg.wait_for_timeout(900)
  await pg.evaluate("()=>window.__raketSpelTest.freeze(true)")
  await frame(pg,name)

async def frame(pg,name):
  sel='.rs-rules' if name=='desktop' else '.rs-hud'
  await pg.evaluate(f"()=>{{const e=document.querySelector('{sel}'); window.scrollTo(0, e.getBoundingClientRect().top+window.scrollY-6)}}")
  await pg.wait_for_timeout(150)

async def shot(pg, fn, **kw):
  await pg.wait_for_timeout(200)
  await pg.screenshot(path=O+fn, **kw); return fn

async def main():
  async with async_playwright() as p:
    b=await p.chromium.launch(executable_path='/usr/bin/google-chrome',args=['--no-sandbox','--autoplay-policy=no-user-gesture-required'])
    for name,opt in [('desktop',dict(viewport={'width':1280,'height':800})),('mobil',dict(viewport={'width':390,'height':844},device_scale_factor=2,is_mobile=True,has_touch=True))]:
      ctx=await b.new_context(**opt); pg=await ctx.new_page(); errs=[]; r={}
      pg.on('pageerror',lambda e,errs=errs: errs.append(str(e)[:300]))
      pg.on('console',lambda m,errs=errs: errs.append('console:'+m.text[:200]) if m.type=='error' else None)
      E=lambda js,arg=None: pg.evaluate(js,arg) if arg is not None else pg.evaluate(js)
      # --- spöke: kör ett första varv (gas 100 %) så att spöket finns
      await load(pg,'spoke',name)
      await E("()=>{const T=window.__raketSpelTest; T.targets({tpPct:3,slPct:null}); T.gas(1); T.lev(2); T.cmd('buy')}")
      r['spoke_forsta_varv']=await E(JS_RUN,['end',4000,250])
      for m in MODES:
        # inställningsruta
        await load(pg,m,name)
        r[m+'_setup']=await E("()=>{const g=window.__raketSpelTest.get(); return {targets:g.targets, start:g.startProgress, deadline:g.deadline, ghost:!!g.ghost, shock:g.shock}}")
        await shot(pg,f'{m}-1-installning-{name}.png', full_page=(name=='desktop'))
        # under spel: TP/SL-linjer
        await E("()=>{const T=window.__raketSpelTest; T.gas(m==='spoke'?0.35:0.5); T.lev(2); T.cmd(m==='chock'?'sell':'buy')}".replace("m==='spoke'",str(m=='spoke').lower()).replace("m==='chock'",str(m=='chock').lower()))
        r[m+'_spel']=await E(JS_RUN,['n',3 if m not in ('spoke','chock') else (6 if m=='spoke' else 10),250])
        await shot(pg,f'{m}-2-spel-tp-sl-{name}.png')
        if m=='chock':
          r['chock_efter']=await E(JS_RUN,['n',14,250])
          await shot(pg,f'chock-2b-draget-kom-{name}.png')
        # margin call
        tp,sl=MC_T[m]; got=None
        for side in ['buy','sell']:
          await load(pg,m,name)
          await E("([tp,sl,side,late])=>{const T=window.__raketSpelTest; T.targets({tpPct:tp,slPct:sl}); T.lev(4); T.gas(0.35); if(late){ T.cmd('buy'); T.cmd('flat'); let g=T.get(); while(g.desk.progress<84){g=T.step(250)} } T.cmd(side)}",[tp,sl,side,m=='chock'])
          res=await E(JS_RUN,['mc',3000,250])
          res['sideTried']=side
          if res['cd'] is not None: got=res; break
        r[m+'_margin']=got or res
        await shot(pg,f'{m}-3-margin-call-{name}.png',animations='disabled')
        if got:
          # låt nedräkningen gå ut -> tvångsstängning
          r[m+'_margin_slut']=await E(JS_RUN,['end',200,250])
          if m=='niva': await shot(pg,f'{m}-4-tvangsstangd-{name}.png')
      # nivå klarad
      await load(pg,'niva',name)
      await E("()=>{const T=window.__raketSpelTest; T.targets({tpPct:2,slPct:1.3}); T.lev(2); T.gas(0.5); T.cmd('buy')}")
      r['niva_vinst']=await E(JS_RUN,['end',4000,250])
      await shot(pg,f'niva-5-niva-klarad-{name}.png')
      # SL (amber)
      await load(pg,'niva',name)
      await E("()=>{const T=window.__raketSpelTest; T.lev(2); T.gas(0.5); T.cmd('sell')}")
      r['niva_sl']=await E(JS_RUN,['end',4000,250])
      await shot(pg,f'niva-6-stop-loss-{name}.png')
      # riskbudget efter första SL
      await load(pg,'budget',name)
      await E("()=>{const T=window.__raketSpelTest; T.lev(2); T.gas(0.5); T.cmd('sell')}")
      r['budget_sl']=await E("""async ()=>{const T=window.__raketSpelTest; let g=T.get(), n=0; while(g.phase==='ride'&&g.usedR<1&&n<4000){g=T.step(250);n++} await new Promise(r=>setTimeout(r,250)); g=T.get(); return {n,phase:g.phase,usedR:g.usedR,msg:g.message&&g.message.text}}""")
      await shot(pg,f'budget-4-stop-loss-budget-kvar-{name}.png')
      # mindre rörelse: margin call utan blink/skak
      await load(pg,'niva',name)
      await pg.locator('.rs-toggles label').nth(1).click()
      await frame(pg,name)
      side=r['niva_margin'].get('sideTried','buy')
      await E("([side])=>{const T=window.__raketSpelTest; T.targets({tpPct:3,slPct:null}); T.lev(4); T.gas(0.35); T.cmd(side)}",[side])
      r['niva_margin_lugn']=await E(JS_RUN,['mc',3000,250])
      r['niva_margin_lugn']['calmClass']=await E("()=>document.querySelector('.rs-wrap').classList.contains('rs-calm')")
      r['niva_margin_lugn']['vignetteAnim']=await E("()=>{const v=document.querySelector('.rs-vignette'); return v? getComputedStyle(v).animationName : null}")
      await shot(pg,f'niva-7-margin-call-mindre-rorelse-{name}.png')
      await pg.locator('.rs-toggles label').nth(1).click()
      # gasreglage
      await load(pg,'niva',name)
      await E("()=>{const T=window.__raketSpelTest; T.lev(1); T.gas(0.8); T.cmd('buy')}")
      await E(JS_RUN,['n',6,250])
      await shot(pg,f'gas-reglage-{name}.png')
      await pg.locator('.rs-gas').screenshot(path=O+f'gas-reglage-narbild-{name}.png')
      # tangenter + dra linje (dator)
      if name=='desktop':
        await load(pg,'niva',name)
        k={}
        await pg.keyboard.press('ArrowUp'); await pg.keyboard.press('ArrowUp'); k['lev_efter_2xUpp']=await E("()=>window.__raketSpelTest.get().desk.leverage")
        await pg.keyboard.press('1'); k['lev_efter_1']=await E("()=>window.__raketSpelTest.get().desk.leverage")
        await pg.keyboard.press(']'); await pg.keyboard.press('s'); k['lev_efter_]_s']=await E("()=>window.__raketSpelTest.get().desk.leverage")
        await pg.keyboard.press('e'); await pg.keyboard.press('e'); k['gas_efter_2E']=await E("()=>window.__raketSpelTest.get().gas")
        await pg.keyboard.press('q'); k['gas_efter_Q']=await E("()=>window.__raketSpelTest.get().gas")
        await pg.keyboard.press('t'); k['tp_setup_efter_T']=await E("()=>window.__raketSpelTest.get().targets")
        await pg.keyboard.press('d'); k['efter_D']=await E("()=>{const g=window.__raketSpelTest.get(); return {phase:g.phase, side:g.live&&g.live.side}}")
        await E(JS_RUN,['n',4,250])
        tp0=await E("()=>window.__raketSpelTest.get().live.tp")
        await pg.keyboard.press('t'); k['tp_under_rond_T']=[tp0, await E("()=>window.__raketSpelTest.get().live.tp")]
        await pg.keyboard.press('Space'); k['paus']=await E("()=>window.__raketSpelTest.get().desk.paused")
        await pg.keyboard.press('Space')
        # dra TP-linjen 50 px utåt
        box=await pg.locator('.rs-canvas').bounding_box()
        x=await E("()=>{const T=window.__raketSpelTest; return T.x(T.get().live.tp)}")
        tpA=await E("()=>window.__raketSpelTest.get().live.tp")
        if x is not None and 0<x<box['width']:
          await pg.mouse.move(box['x']+x, box['y']+box['height']*0.6); await pg.mouse.down(); await pg.mouse.move(box['x']+x+50, box['y']+box['height']*0.6, steps=6); await pg.mouse.up()
        k['dra_tp']=[tpA, await E("()=>window.__raketSpelTest.get().live.tp"), x]
        await shot(pg,'dra-tp-linje-desktop.png')
        await pg.keyboard.press('a'); k['efter_A_stangt']=await E("()=>{const g=window.__raketSpelTest.get(); return {live:g.live, msg:g.message.text}}")
        await pg.keyboard.press('f')
        r['tangenter']=k
        # fri åkning (klassisk)
        await pg.goto(B+'/traderider/demo/raket/?lage=klassisk',wait_until='networkidle'); await pg.wait_for_timeout(1500)
        await shot(pg,'fri-akning-klassisk-desktop.png')
      # ingång
      await pg.goto(B+'/traderider/',wait_until='networkidle'); await pg.wait_for_timeout(700)
      await shot(pg,f'ingang-traderider-{name}.png', full_page=True)
      await pg.click('a.mode[href="/traderider/demo/raket/"]'); await pg.wait_for_load_state('networkidle'); await pg.wait_for_timeout(900)
      r['ingang_klick_raket']=pg.url.replace(B,'')
      r['errs']=errs; RES[name]=r; await ctx.close()
    json.dump(RES,open(O+'kontroll.json','w'),ensure_ascii=False,indent=1)
    print(json.dumps(RES,ensure_ascii=False)[:200000])
    await b.close()
asyncio.run(main())
