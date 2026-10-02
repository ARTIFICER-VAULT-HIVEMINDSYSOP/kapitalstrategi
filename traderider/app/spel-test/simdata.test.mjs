// Simulerade kurser och ingen order: statiska kontroller för allt som Pages laddar upp (repot utom traderider/app).
// Kör: node --test traderider/app/spel-test/
import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync, readdirSync, statSync, existsSync } from 'node:fs'
import { join, relative } from 'node:path'
import { allaSerier, SEED } from '../scripts/simulerad-kurs.mjs'

const REPO = new URL('../../../', import.meta.url).pathname
const TR = join(REPO, 'traderider')
const SPEL = join(TR, 'spel')
const txt = (p) => readFileSync(p).toString('utf8')

function walk(dir, out = []) {
  for (const name of readdirSync(dir)) {
    if (name === '.git' || name === 'node_modules') continue
    const p = join(dir, name)
    if (statSync(p).isDirectory()) walk(p, out)
    else out.push(p)
  }
  return out
}

// Det Pages laddar upp: hela repot utom .git och traderider/app (pages.yml tar bort den katalogen före uppladdning).
const upload = walk(REPO).filter((p) => !relative(REPO, p).startsWith('traderider/app/') && !relative(REPO, p).startsWith('shots/') && !relative(REPO, p).startsWith('PR-BODY'))
const spelFiles = walk(SPEL)

test('spelet: ingen Yahoo-, real-data- eller mäklarkod under traderider/spel/', () => {
  const rx = /yahoo|query1|query2|finance\.yahoo|alpaca|api\.alpaca|paper-api|trycloudflare|nvda-fallback|\/api\/nvda|\/api\/broker|broker/i
  const hits = spelFiles.filter((p) => /\.(html|js|json|css)$/.test(p) && rx.test(txt(p))).map((p) => relative(REPO, p))
  assert.deepEqual(hits, [])
  assert.ok(!existsSync(join(SPEL, 'data/nvda-fallback.json')))
})

test('spelet laddar bara den simulerade serien, utan extern värd', () => {
  const routes = txt(join(SPEL, 'assets/routes-CbqPJAI2.js'))
  assert.match(routes, /fetch\(`\/traderider\/spel\/data\/simulerad-kurs\.json`\)/)
  assert.match(routes, /async function U\(e\)\{let t=ie\(await re\(\),e\);/)
  const fetches = [...routes.matchAll(/fetch\(([^)]{0,80})\)/g)].map((m) => m[1])
  assert.deepEqual(fetches.filter((f) => /https?:/.test(f)), [])
})

test('den simulerade serien är deterministisk, märkt och inte verklig', () => {
  const fil = JSON.parse(txt(join(SPEL, 'data/simulerad-kurs.json')))
  assert.deepEqual(fil, JSON.parse(JSON.stringify(allaSerier()))) // genereras om exakt från fröet
  for (const [k, s] of Object.entries(fil)) {
    assert.equal(s.simulerad, true, k)
    assert.equal(s.symbol, 'SIM', k)
    assert.match(s.kalla, new RegExp(`Simulerade kurser – inte verkliga marknadsdata \\(GBM, frö ${SEED}\\)`))
    assert.ok(s.candles.length >= 60, k)
    assert.ok(s.candles[0].t < 86400 * 365 * 40, `${k}: fiktiva tidsstämplar från dag 1, inga riktiga datum`)
    for (const c of s.candles) assert.ok(c.l <= Math.min(c.o, c.c) && c.h >= Math.max(c.o, c.c) && c.l > 0, k)
  }
})

test('synlig etikett i alla lägen och inga påståenden om verkliga kurser', () => {
  const SIM = 'Simulerade kurser – inte verkliga marknadsdata'
  assert.ok(txt(join(SPEL, 'lagen/i18n.js')).includes(SIM))
  assert.match(txt(join(SPEL, 'lagen/panel.js')), /el\('div', 'tr-sim', t\('sim\.label'\)\)/)
  assert.ok(txt(join(TR, 'index.html')).includes(SIM))
  const claim = /[Hh]istorisk|[Rr]iktiga (historiska )?(NVDA-)?kurser|äkta historiska|real historical|live (stock )?chart|LiveTrend|NVIDIA/
  const files = [join(TR, 'index.html'), join(REPO, 'assets/traderider-demo-nav.js'), ...spelFiles.filter((p) => /\.(html|js)$/.test(p))]
  const hits = []
  for (const p of files) {
    // bara synlig text: hoppa över kommentarer i våra egna moduler
    const t = txt(p).replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '')
    if (claim.test(t)) hits.push(relative(REPO, p))
  }
  assert.deepEqual(hits, [])
})

test('Pages-uppladdningen i den här grenen: ingen mäklarkod i det som grenen publicerar under traderider/', () => {
  const rx = /alpaca|paper-api|\/api\/broker|BrokerPanel/i
  const hits = upload.filter((p) => relative(REPO, p).startsWith('traderider/') && /\.(html|js|json|css|md)$/.test(p) && rx.test(txt(p))).map((p) => relative(REPO, p))
  assert.deepEqual(hits, [])
})

test('appkällan (laddas inte upp): mäklarkoden är borttagen, bara lokal övning', () => {
  const APP = join(TR, 'app/src')
  for (const f of ['components/BrokerPanel.tsx', 'lib/brokerProxy.ts', 'lib/brokerSession.ts', 'routes/api/broker.ts']) assert.ok(!existsSync(join(APP, f)), f)
  const src = walk(APP).filter((p) => /\.(ts|tsx)$/.test(p) && !/\.test\.tsx?$/.test(p))
  const hits = src.filter((p) => /alpaca|paper-api|api\/broker|APCA-API/i.test(txt(p))).map((p) => relative(REPO, p))
  assert.deepEqual(hits, [])
})
