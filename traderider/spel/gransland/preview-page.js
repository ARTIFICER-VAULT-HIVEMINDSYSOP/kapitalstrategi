import { createGransland } from './session.js'
import { mountView } from './view.js'
import { HISTORIA } from '../lagen/historia-data.js'
import { setLang } from '../lagen/i18n.js'

const params = new URLSearchParams(location.search)
const variant = params.get('variant') || 'trade-rider'
const shot = params.get('shot') || 'choice'
const players = shot === 'duo' ? 2 : 1
setLang('sv')
document.body.dataset.variant = variant
document.body.dataset.shot = shot

const liveShot = shot === 'live' || shot === 'duo'
const session = createGransland({
  variant,
  players,
  history: HISTORIA.bars,
  instrument: liveShot ? 'BTC-USD' : 'NVDA',
  course: 'historia',
  poll: false,
  decisions: players === 2
    ? [{ side: 'buy', leverage: 2, entry: HISTORIA.bars.at(-1).c }, { side: 'sell', leverage: 1, entry: HISTORIA.bars.at(-1).c }]
    : [{ side: 'buy', leverage: 1, entry: HISTORIA.bars.at(-1).c }],
})
session.endRace()
const view = mountView(document.body, session, { shot: shot === 'frozen' ? 'frozen' : '' })
view.root.dataset.shot = shot

if (liveShot) {
  try {
    await session.switchCrypto()
  } catch {
    /* OKÄND om nätet inte svarar */
  }
}
await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)))
view.paint()
view.markReady()
