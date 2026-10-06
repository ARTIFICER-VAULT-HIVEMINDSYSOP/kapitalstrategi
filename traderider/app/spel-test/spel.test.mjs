// Statiska kontroller för /traderider/spel/ (NVDA Rider + Raket + Akademin), ingången /traderider/ och demo-omdirigeringarna.
// Kör: node --test traderider/docs/raket-akademin/test/
import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync, readdirSync, statSync } from 'node:fs'
import { join, relative } from 'node:path'

const TR = new URL('../../', import.meta.url).pathname // traderider/
const read = (p) => readFileSync(join(TR, p), 'utf8')
const readBin = (p) => readFileSync(join(TR, p)).toString('latin1')

function walk(dir, out = []) {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name)
    if (statSync(p).isDirectory()) walk(p, out)
    else out.push(p)
  }
  return out
}

// Ägarens spärrade texter (demoramen). Får inte finnas i något som följer med till Pages under traderider/.
const BANNED = [
  /DemoFrame/, /RiderDesk/, /FacePortrait|tr-face/, /Övningskapital/, /\$\s?100[,.\s]?000/, /100[\s\u00a0,.]000\s*USD/, /20-SMA/,
  /[Pp]aus\s*·\s*([Mm]ellanslag|Space)/, /[Aa]lla lägen/, /[Hh]ävstång\s*[–−+-]\s*(·|\[|\]|$|<|")/m, /[Hh]ävstång[^\n<]{0,12}\[\s*\]/,
  /[Kk]onduktör|\b[Cc]onductor\b/, /(?<![\wåäö])(Köp|Sälj|Platt|Övre|Undre)(?![\wåäö])/,
]
const COPY_BANNED = [/[Dd]iplom/, /[Ii]ntyg/, /godkänd för signaler/, /redo att handla/, /förstått riskerna/, /(?<![\wÅÄÖåäö])\u00d6B(?![\wÅÄÖåäö])/]

const deployed = walk(TR).filter((p) => !relative(TR, p).startsWith('app/') && /\.(html|js|mjs|css|json|md|svg)$/.test(p))

test('inga spärrade texter från demoramen under traderider/ (utom app/, som inte laddas upp)', () => {
  const hits = []
  for (const p of deployed) {
    if (p.endsWith('spel.test.mjs')) continue // den här filen listar mönstren
    const t = readFileSync(p).toString('utf8')
    for (const rx of BANNED) if (rx.test(t)) hits.push(`${relative(TR, p)}: ${rx}`)
  }
  assert.deepEqual(hits, [])
})

test('kundtext: inga förbjudna ord och inget internt kortnamn', () => {
  const ours = ['index.html', 'spel/lagen/akademin.js', 'spel/lagen/akademin-logic.js', 'spel/lagen/raket.js', 'spel/lagen/panel.js', 'docs/raket-akademin/README.md',
    ...readdirSync(join(TR, 'demo'), { recursive: true }).filter((f) => String(f).endsWith('.html')).map((f) => `demo/${f}`)]
  const hits = []
  for (const f of ours) for (const rx of COPY_BANNED) if (rx.test(read(f))) hits.push(`${f}: ${rx}`)
  assert.deepEqual(hits, [])
  assert.match(read('spel/lagen/akademin-logic.js'), /utmärkelse/)
})

test('spelet ligger under /traderider/spel/ – inga kvarvarande /nvda-rider-sökvägar', () => {
  for (const f of ['spel/index.html', 'spel/assets/index-CjseGLmu.js', 'spel/assets/routes-CbqPJAI2.js']) {
    assert.ok(!readBin(f).includes('/nvda-rider'), f)
  }
  assert.match(read('spel/assets/index-CjseGLmu.js'), /basepath:`\/traderider\/spel`/)
  assert.match(readBin('spel/index.html'), /<script type="module" src="\.\/lagen\/panel\.js"><\/script><\/head>/)
})

test('loket kör framåt: plog och skorsten fram (+x, färdriktningen), hytten bak', () => {
  const r = read('spel/assets/routes-CbqPJAI2.js')
  const train = r.slice(r.indexOf('drawTrain(){'), r.indexOf('drawWheel('))
  assert.match(train, /moveTo\(30,10\),\w\.lineTo\(42,16\)/) // plogen längst fram
  assert.match(train, /roundRect\(-36,-26,28,20,3\)/) // hytten längst bak
  assert.match(train, /fillRect\(20,-26,8,16\)/) // skorstenen i främre delen av pannan
  assert.ok(!/fillRect\(8,-26,8,16\)/.test(train))
  assert.match(train, /rotate\(e\.angle/) // följer rälsens lutning
  assert.match(r, /x:this\.train\.x\+\(24\*Math\.cos/) // röken ur skorstenen, inte ur hytten
})

test('växeln: Trade Rider | RaceX | Akademin | Rabbit Hole, hashlänkar, helskärm och väg tillbaka', () => {
  const p = read('spel/lagen/panel.js')
  assert.match(p, /MODES\.trendRider\.nameKey/)
  assert.match(p, /MODES\.raket\.nameKey/)
  assert.match(p, /MODES\.akademin\.nameKey/)
  assert.match(p, /MODES\.rabbitHole\.nameKey/)
  assert.match(p, /selectMode/)
  assert.match(p, /hashForView/)
  assert.match(p, /modeFromHash/)
  assert.match(p, /requestFullscreen/)
  assert.match(p, /webkitRequestFullscreen/)
  assert.match(p, /back\.href = '\/traderider\/'/)
})

test('ingen inloggning: sessionsfrågan besvaras lokalt och inloggningslänken är dold', () => {
  const html = readBin('spel/index.html')
  assert.match(html, /id="tr-ingen-inloggning"/)
  assert.match(read('spel/lagen/panel.js'), /a\[href="\/login"\]\{display:none !important\}/)
  assert.ok(!read('index.html').includes('/login'))
})

test('ingången /traderider/ länkar till alla fyra lägen och lovar inga fler', () => {
  const t = read('index.html')
  for (const h of ['/traderider/spel/#trade-rider', '/traderider/spel/#racex', '/traderider/spel/#tra', '/traderider/spel/#rabbit-hole']) assert.ok(t.includes(`href="${h}"`), h)
  assert.equal(t.includes('href="/traderider/spel/#academy"'), false)
  assert.ok(!t.includes('Fler lägen kommer'))
  assert.ok(!t.includes('>Raket<') && !t.includes('>Rocket<'))
})

test('gamla demoadresser leder till de nya lägena, inte till demoramen', () => {
  const map = JSON.parse(read('app/scripts/demo-redirects.json'))
  const expect = { 'index.html': '/traderider/', 'tag/index.html': '/traderider/spel/#nvda-rider', 'raket/index.html': '/traderider/spel/#racex', 'akademin/index.html': '/traderider/spel/#academy' }
  for (const [page, mal] of Object.entries(expect)) {
    assert.equal(map[page].mal, mal)
    const html = read(`demo/${page}`)
    assert.ok(html.includes(`location.replace('${mal}')`), page)
    assert.ok(html.includes(`content="0; url=${mal}"`), page)
  }
  assert.deepEqual(readdirSync(join(TR, 'demo'), { recursive: true }).filter((f) => String(f).includes('.')).sort(), Object.keys(expect).sort())
})
