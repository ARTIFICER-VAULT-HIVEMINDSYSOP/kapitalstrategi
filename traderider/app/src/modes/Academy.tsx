/**
 * Läge 2 — Traderider Academy. Guided lessons on the SAME chart and shared engine
 * (useDeskEngine → deskState/bollinger(20,2), rsi(14), market quotes, same NVDA historical candles).
 * XP rewards learning actions only. Practice only; not a licence/certificate/authorisation.
 */
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  advancePractice, correctRead, isTouch, lessonDone, lessonUnlocked, levelFor, openPractice, positionSize,
  PRACTICE_BALANCE, READ_TEXT, riskAllowed, RISK_CHOICES, rsiExtreme, squeezeThreshold, stopPrice, STOP_SIGMAS,
  takeProfitPrice, TP_R_MULTIPLES, XP_MAX, XP_TABLE, bandwidthPct, percentB, MAX_RISK_PCT,
  type LessonId, type MarketRead, type PracticeTrade, type Side, type XpKey,
} from '../lib/academy'
import { drawAcademy, type AcademyOverlay } from '../lib/drawAcademy'
import { markFromCandles, sampleBand, type DeskState } from '../lib/deskState'
import { money, px } from '../lib/format'
import type { Command } from '../lib/keys'
import { rsi, sampleRsi } from '../lib/rsi'
import type { Candle } from '../lib/types'
import { useDeskEngine } from '../lib/useDeskEngine'
import { FacePortrait } from '../face/FacePortrait'
import { LEVERAGE_MAX } from '../lib/market'
import './academy.css'

const STORE = 'traderider-academy-v1'

const LESSONS: Record<LessonId, { title: string; text: string; task: string }> = {
  1: {
    title: 'Risk och positionsstorlek',
    text:
      'Innan du tänker på vinst bestämmer du hur mycket du högst får förlora på en affär. En vanlig tumregel är att aldrig riskera mer än 1–2 % av saldot per affär. Risken per aktie är avståndet mellan ingång och stopp; positionsstorleken blir riskbudgeten delad med risken per aktie. Då blir en förlust hanterbar, oavsett hur säker du känner dig.',
    task: `Välj en risk på högst ${MAX_RISK_PCT} % av övningssaldot, välj stoppavstånd och räkna fram positionsstorleken.`,
  },
  2: {
    title: 'Stop-loss och take-profit',
    text:
      'En stop-loss är kursen där du i förväg bestämt att affären var fel och ska stängas. En take-profit är kursen där du tar hem. Båda sätts innan du öppnar — inte när känslorna tagit över. Förhållandet mellan mål och risk (R) visar om upplägget är rimligt: 2R betyder att målet ligger dubbelt så långt bort som stoppet.',
    task: 'Välj riktning, sätt både stop-loss och take-profit, öppna övningsaffären och låt simuleringen köra tills en av dem träffas.',
  },
  3: {
    title: 'Bollingerband',
    text:
      'Bollingerbanden (20 perioder, 2 standardavvikelser) bildar en korridor runt kursen. Mittfilen är 20-perioders glidande medelvärde. Övre och undre räls visar när kursen rört sig ovanligt långt från medel. När banden drar ihop sig — en squeeze — är rörelsen ovanligt lugn; ofta följer en större rörelse, men banden säger inte åt vilket håll.',
    task: 'Pausa (Space) och markera 1) en rälsberöring — kursen vid övre eller undre bandet, och 2) en squeeze — de lila zonerna där bandbredden är som smalast.',
  },
  4: {
    title: 'RSI',
    text:
      'RSI (14) jämför styrkan i de senaste uppgångarna med nedgångarna på en skala 0–100. Över 70 kallas överköpt, under 30 översålt. RSI ensamt är inget köp- eller säljbesked — det blir användbart tillsammans med banden: kurs vid övre räls och RSI över 70 är ett sträckt läge där nästa steg ofta är vila eller återgång mot mittfilen.',
    task: "Vänta tills RSI går över 70 eller under 30, tryck 'Läs läget' och välj tolkningen som stämmer med både band och RSI.",
  },
}

const KEYS = (key: string): Command | null => (key === ' ' || key === 'Spacebar' ? 'pause' : null)

function loadEarned(): Set<XpKey> {
  try {
    const raw = localStorage.getItem(STORE)
    return new Set(raw ? (JSON.parse(raw) as XpKey[]) : [])
  } catch {
    return new Set()
  }
}

function Pill({ children, onClick, disabled, ghost }: { children: React.ReactNode; onClick: () => void; disabled?: boolean; ghost?: boolean }) {
  return (
    <button type="button" className={`ac-pill ${ghost ? 'ac-ghost' : ''}`} onClick={onClick} disabled={disabled}>
      <span>{children}</span>
      <span className="ac-pill-arrow" aria-hidden="true">
        <svg viewBox="0 0 24 24" width="16" height="16"><path d="M5 12h13M13 6l6 6-6 6" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" /></svg>
      </span>
    </button>
  )
}

function Choice<T extends string | number>({ label, options, value, onPick, fmt }: { label: string; options: readonly T[]; value: T | null; onPick: (v: T) => void; fmt: (v: T) => string }) {
  return (
    <div className="ac-choice">
      <span className="ac-choice-label">{label}</span>
      <div className="ac-seg">
        {options.map((o) => (
          <button key={String(o)} type="button" className={value === o ? 'on' : ''} onClick={() => onPick(o)}>{fmt(o)}</button>
        ))}
      </div>
    </div>
  )
}

export function Academy({ candles }: { candles: Candle[] }) {
  const [earned, setEarned] = useState<Set<XpKey>>(loadEarned)
  const firstOpen = ([1, 2, 3, 4] as LessonId[]).find((l) => !lessonDone(l, earned)) ?? 4
  const [lesson, setLesson] = useState<LessonId>(firstOpen)
  const [note, setNote] = useState<string>('')
  // lesson 1
  const [riskPct, setRiskPct] = useState<number | null>(null)
  const [sigma, setSigma] = useState<number>(1.5)
  const [sizeCalc, setSizeCalc] = useState<ReturnType<typeof positionSize> & { entry: number; stop: number } | null>(null)
  // lesson 2
  const [side, setSide] = useState<Side>('long')
  const [rMult, setRMult] = useState<number>(2)
  const [slSet, setSlSet] = useState(false)
  const [tpSet, setTpSet] = useState(false)
  const [trade, setTrade] = useState<PracticeTrade | null>(null)
  // lesson 4
  const [quiz, setQuiz] = useState<{ answer: MarketRead; rsi: number; pb: number } | null>(null)

  const rsiSeries = useMemo(() => rsi(candles.map((c) => c.c)), [candles])
  const overlayRef = useRef<AcademyOverlay>({ lesson, rsi: rsiSeries, squeezeThr: 0, trade: null, preview: null })
  const draw = useCallback((canvas: HTMLCanvasElement | null, s: DeskState) => drawAcademy(canvas, s, overlayRef.current), [])
  const { snap, canvasRef, run, reset } = useDeskEngine(candles, draw, KEYS)
  const squeezeThr = useMemo(() => squeezeThreshold(snap.bands), [snap.bands])

  const idx = Math.min(snap.candles.length - 1, Math.floor(snap.progress))
  const candle = snap.candles[idx]
  const band = sampleBand(snap.bands, snap.progress)
  const mark = markFromCandles(snap.candles, snap.progress).close
  const r = sampleRsi(rsiSeries, snap.progress)
  const read = earned.has(`l${lesson}_read` as XpKey)

  // lesson-2 preview lines derived from current quote
  const l2Stop = band && mark != null && slSet ? stopPrice(mark, band, sigma, side) : null
  const l2Target = l2Stop != null && mark != null && tpSet ? takeProfitPrice(mark, l2Stop, rMult, side) : null
  const l1Stop = band && mark != null ? stopPrice(mark, band, sigma, 'long') : null
  const preview =
    lesson === 1 && read && mark != null ? { entry: mark, stop: l1Stop, target: null } :
    lesson === 2 && !trade && mark != null ? { entry: mark, stop: l2Stop, target: l2Target } : null
  overlayRef.current = { lesson, rsi: rsiSeries, squeezeThr, trade: lesson === 2 ? trade : null, preview }

  const earn = useCallback((...keys: XpKey[]) => {
    setEarned((prev) => {
      const next = new Set(prev)
      keys.forEach((k) => next.add(k))
      try { localStorage.setItem(STORE, JSON.stringify([...next])) } catch { /* ignore */ }
      return next
    })
  }, [])

  // advance the practice trade with the engine's candles
  useEffect(() => {
    if (!trade || trade.closed) return
    const next = advancePractice(trade, snap.candles, snap.progress)
    if (next !== trade && (next.closed || next.checkedTo !== trade.checkedTo)) setTrade(next)
    if (next.closed) {
      earn('l2_closed')
      setNote(next.closed.reason === 'stop'
        ? 'Stop-loss träffades — förlusten stannade där du bestämt i förväg. Det är processen som ger XP.'
        : next.closed.reason === 'target'
          ? 'Take-profit träffades enligt plan. XP ges för att du följde processen, inte för utfallet.'
          : 'Den historiska serien tog slut; affären stängdes på sista kursen.')
    }
  }, [snap.progress, snap.candles, trade, earn])

  useEffect(() => {
    ;(window as unknown as { __academyTest?: object }).__academyTest = {
      earn: (...k: XpKey[]) => earn(...k),
      setLesson: (n: LessonId) => setLesson(n),
    }
  }, [earn])

  const xp = [...earned].reduce((a, k) => a + XP_TABLE[k], 0)
  const lv = levelFor(xp)
  const lvPct = lv.to == null ? 100 : ((xp - lv.from) / (lv.to - lv.from)) * 100
  const allDone = ([1, 2, 3, 4] as LessonId[]).every((l) => lessonDone(l, earned))

  function pick(l: LessonId) {
    if (!lessonUnlocked(l, earned)) return
    setLesson(l)
    setNote('')
    setQuiz(null)
  }

  function computeSize() {
    if (riskPct == null || mark == null || l1Stop == null) return setNote('Välj först en riskprocent.')
    if (!riskAllowed(riskPct)) return setNote(`${riskPct} % är mer än regeln tillåter (högst ${MAX_RISK_PCT} %). Välj en lägre risk.`)
    const s = positionSize(PRACTICE_BALANCE, riskPct, mark, l1Stop)
    setSizeCalc({ ...s, entry: mark, stop: l1Stop })
    earn('l1_risk', 'l1_size')
    setNote(`Bra. Med ${riskPct} % risk och stopp ${px(l1Stop)} blir det ${s.qty} aktier. Träffas stoppet förlorar du högst ${money(s.maxLoss)} av ${money(PRACTICE_BALANCE)}.`)
  }

  function openL2() {
    if (!candle || !band || mark == null) return
    const stop = l2Stop
    const target = l2Target
    const qty = stop != null ? positionSize(PRACTICE_BALANCE, 1, mark, stop).qty : 0
    const t = openPractice(candle, idx, side, qty, stop, target)
    if ('error' in t) return setNote(t.error)
    setTrade(t)
    earn('l2_open')
    setNote(`Övningsaffär öppnad: ${side === 'long' ? 'köp' : 'sälj'} ${t.qty} aktier (1 % risk) på ${px(t.entry)}. Låt simuleringen köra.`)
    if (snap.paused) run('pause')
  }

  function markTouch() {
    if (!band || mark == null) return
    if (isTouch(mark, band)) {
      earn('l3_touch')
      setNote(`Rätt — %B ${percentB(mark, band)?.toFixed(2)}: kursen står vid ${percentB(mark, band)! >= 0.5 ? 'övre' : 'undre'} rälsen.`)
    } else setNote(`Inte än — %B är ${percentB(mark, band)?.toFixed(2)}. En beröring är %B ≥ 0,95 eller ≤ 0,05.`)
  }

  function markSqueeze() {
    if (!band) return
    const bw = bandwidthPct(band)
    if (bw <= squeezeThr) {
      earn('l3_squeeze')
      setNote(`Rätt — bandbredden ${bw.toFixed(1)} % är bland de smalaste i serien (gräns ${squeezeThr.toFixed(1)} %).`)
    } else setNote(`Inte en squeeze — bandbredden är ${bw.toFixed(1)} % (gräns ${squeezeThr.toFixed(1)} %). Leta efter lila zoner.`)
  }

  function readMarket() {
    if (!band || mark == null || r == null) return
    if (!rsiExtreme(r)) return setNote(`RSI är ${r.toFixed(1)} — vänta tills den är över 70 eller under 30.`)
    if (!snap.paused) run('pause')
    earn('l4_extreme')
    setQuiz({ answer: correctRead(mark, band, r), rsi: r, pb: percentB(mark, band) ?? 0.5 })
    setNote('')
  }

  function answer(a: MarketRead) {
    if (!quiz) return
    if (a === quiz.answer) {
      earn('l4_read_ok')
      setNote('Rätt tolkning. Band och RSI tillsammans ger en bild av läget — inte ett löfte om nästa rörelse.')
      setQuiz(null)
    } else setNote(`Inte riktigt: %B ${quiz.pb.toFixed(2)} och RSI ${quiz.rsi.toFixed(1)}. Titta på både korridoren och RSI.`)
  }

  const L = LESSONS[lesson]
  const ended = snap.progress >= snap.candles.length - 1

  return (
    <div className="ac-page" data-mode="academy">
      <div className="ac-bg" aria-hidden="true" />
      <div className="ac-inner">
        <aside className="ac-side">
          <div className="ac-glass ac-brand">
            <p className="ac-kicker">Läge 2</p>
            <h1>Akademin</h1>
            <p className="ac-muted">Guidade lektioner på samma NVDA-graf och samma motor.</p>
          </div>
          <div className="ac-glass ac-xp">
            <div className="ac-xp-row"><b>Nivå {lv.level}</b><span>{xp} / {XP_MAX} XP</span></div>
            <div className="ac-xp-bar"><i style={{ width: `${lvPct}%` }} /></div>
            <p className="ac-muted ac-small">XP ges bara för lärande — läsa, sätta risk, stopp och mål, markera band och RSI. Aldrig för simulerad vinst.</p>
          </div>
          <ol className="ac-lessons">
            {([1, 2, 3, 4] as LessonId[]).map((l) => {
              const open = lessonUnlocked(l, earned)
              const done = lessonDone(l, earned)
              return (
                <li key={l}>
                  <button type="button" className={`ac-glass ac-lesson ${lesson === l ? 'on' : ''} ${open ? '' : 'locked'}`} onClick={() => pick(l)} disabled={!open}>
                    <span className={`ac-dot ${done ? 'done' : open ? 'open' : ''}`}>{done ? '✓' : open ? l : '🔒'}</span>
                    <span><small>Lektion {l} av 4</small>{LESSONS[l].title}</span>
                  </button>
                </li>
              )
            })}
          </ol>
          <p className="ac-muted ac-small ac-legal">
            Adaptiva övningsverktyg i Tradingskolan — inte en officiell licens, certifiering eller behörighet. Riktiga historiska
            priser, simulerade utfall, inget löfte om avkastning.
          </p>
        </aside>

        <main className="ac-main">
          <section className="ac-glass ac-head">
            <div className="ac-head-top">
              <p className="ac-kicker">Lektion {lesson} av 4</p>
              <div className="ac-steps">{([1, 2, 3, 4] as LessonId[]).map((l) => <i key={l} className={lessonDone(l, earned) ? 'done' : l === lesson ? 'cur' : ''} />)}</div>
            </div>
            <h2>{L.title}</h2>
            <p className="ac-text">{L.text}</p>
            {!read ? (
              <div className="ac-start">
                <Pill onClick={() => earn(`l${lesson}_read` as XpKey)}>Jag har läst — starta övningen (+10 XP)</Pill>
              </div>
            ) : null}
          </section>

          <section className="ac-glass ac-chart">
            <div className="ac-chart-head">
              <span>NVDA · 1h · historiska candles · {candle ? new Date(candle.t * 1000).toISOString().slice(0, 16).replace('T', ' ') + ' UTC' : '—'}</span>
              <span>
                Kurs {px(mark)} · RSI {r == null ? '—' : r.toFixed(1)} · %B {band && mark != null ? percentB(mark, band)?.toFixed(2) : '—'}
              </span>
            </div>
            <canvas ref={canvasRef} className="ac-canvas" aria-label="NVDA-graf med Bollingerband och RSI. Lektionens element är markerat." />
            <FacePortrait
              theme="akademin"
              className="ac-face"
              size={72}
              input={{
                pnl: trade?.closed
                  ? trade.closed.pnl
                  : trade && mark != null
                    ? (trade.side === 'long' ? mark - trade.entry : trade.entry - mark) * trade.qty
                    : 0,
                basis: PRACTICE_BALANCE,
                side: trade && !trade.closed ? trade.side : 'flat',
                leverage: 1,
                maxLeverage: LEVERAGE_MAX,
                closes: snap.candles.map((c) => c.c),
                index: Math.floor(snap.progress),
                price: mark ?? 0,
                phase: ended ? 'done' : read ? 'ride' : 'idle',
              }}
            />
            <div className="ac-transport">
              <button type="button" className="ac-chip" onClick={() => run('pause')}>{snap.paused ? 'Kör' : 'Paus'} · Space</button>
              <button type="button" className="ac-chip" onClick={() => run('lev_down')}>Tempo −</button>
              <button type="button" className="ac-chip" onClick={() => run('lev_up')}>Tempo +</button>
              <span className="ac-muted ac-small">Tempo {snap.leverage}× · {snap.paused ? 'pausad' : 'spelas'}{ended ? ' · serien slut' : ''}</span>
              <button type="button" className="ac-chip" onClick={() => { reset(); setTrade(null); setQuiz(null) }}>Spola tillbaka</button>
            </div>
          </section>

          <section className={`ac-glass ac-task ${read ? '' : 'ac-dim'}`}>
            <div className="ac-task-head">
              <h3>Övningsuppgift</h3>
              <span className={`ac-badge ${lessonDone(lesson, earned) ? 'done' : ''}`}>{lessonDone(lesson, earned) ? 'Klar' : read ? 'Pågår' : 'Läs först'}</span>
            </div>
            <p className="ac-text">{L.task}</p>

            {read && lesson === 1 ? (
              <div className="ac-row">
                <Choice label="Risk av saldot" options={RISK_CHOICES} value={riskPct as (typeof RISK_CHOICES)[number] | null} onPick={(v) => { setRiskPct(v); setSizeCalc(null) }} fmt={(v) => `${v} %`} />
                <Choice label="Stopp (band-σ)" options={STOP_SIGMAS} value={sigma as (typeof STOP_SIGMAS)[number]} onPick={(v) => { setSigma(v); setSizeCalc(null) }} fmt={(v) => `${v}σ`} />
                <Pill onClick={computeSize}>Beräkna positionsstorlek</Pill>
                <div className="ac-facts">
                  <span>Övningssaldo <b>{money(PRACTICE_BALANCE)}</b></span>
                  <span>Riskbudget <b>{riskPct == null ? '—' : money((PRACTICE_BALANCE * riskPct) / 100)}</b></span>
                  <span>Stopp <b>{px(l1Stop)}</b></span>
                  <span>Storlek <b>{sizeCalc ? `${sizeCalc.qty} aktier` : '—'}</b></span>
                </div>
              </div>
            ) : null}

            {read && lesson === 2 ? (
              <div className="ac-row">
                <Choice label="Riktning" options={['long', 'short'] as const} value={side} onPick={(v) => { if (!trade || trade.closed) { setSide(v); } }} fmt={(v) => (v === 'long' ? 'Köp (long)' : 'Sälj (short)')} />
                <Choice label="Stopp (band-σ)" options={STOP_SIGMAS} value={sigma as (typeof STOP_SIGMAS)[number]} onPick={setSigma} fmt={(v) => `${v}σ`} />
                <Choice label="Mål (R)" options={TP_R_MULTIPLES} value={rMult as (typeof TP_R_MULTIPLES)[number]} onPick={setRMult} fmt={(v) => `${v}R`} />
                <div className="ac-toggles">
                  <button type="button" className={`ac-chip ${slSet ? 'on-red' : ''}`} onClick={() => { setSlSet(true); if (tpSet) earn('l2_bracket') }}>{slSet ? `Stop-loss ${px(trade && !trade.closed ? trade.stop : l2Stop)}` : 'Sätt stop-loss'}</button>
                  <button type="button" className={`ac-chip ${tpSet ? 'on-cyan' : ''}`} onClick={() => { setTpSet(true); if (slSet) earn('l2_bracket') }} disabled={!slSet}>{tpSet ? `Take-profit ${px(trade && !trade.closed ? trade.target : l2Target)}` : 'Sätt take-profit'}</button>
                </div>
                <Pill onClick={openL2} disabled={!slSet || !tpSet || (!!trade && !trade.closed)}>Öppna övningsaffär</Pill>
                {!slSet || !tpSet ? <span className="ac-muted ac-small">Öppna-knappen är låst tills både stop-loss och take-profit är satta.</span> : null}
                {trade ? (
                  <div className="ac-facts">
                    <span>Ingång <b>{px(trade.entry)}</b></span>
                    <span>Stop-loss <b>{px(trade.stop)}</b></span>
                    <span>Take-profit <b>{px(trade.target)}</b></span>
                    <span>Status <b>{trade.closed ? (trade.closed.reason === 'stop' ? 'stoppad' : trade.closed.reason === 'target' ? 'mål nått' : 'serien slut') : 'öppen'}</b></span>
                    {trade.closed ? <span>Simulerat utfall <b>{money(trade.closed.pnl)}</b></span> : null}
                  </div>
                ) : null}
              </div>
            ) : null}

            {read && lesson === 3 ? (
              <div className="ac-row">
                <Pill onClick={markTouch} ghost={earned.has('l3_touch')}>{earned.has('l3_touch') ? '✓ Rälsberöring' : 'Markera rälsberöring'}</Pill>
                <Pill onClick={markSqueeze} ghost={earned.has('l3_squeeze')}>{earned.has('l3_squeeze') ? '✓ Squeeze' : 'Markera squeeze'}</Pill>
                <div className="ac-facts">
                  <span>%B <b>{band && mark != null ? percentB(mark, band)?.toFixed(2) : '—'}</b></span>
                  <span>Bandbredd <b>{band ? `${bandwidthPct(band).toFixed(1)} %` : '—'}</b></span>
                  <span>Squeeze-gräns <b>{squeezeThr.toFixed(1)} %</b></span>
                </div>
              </div>
            ) : null}

            {read && lesson === 4 ? (
              <div className="ac-row">
                <Pill onClick={readMarket}>Läs läget</Pill>
                <div className="ac-facts">
                  <span>RSI 14 <b>{r == null ? '—' : r.toFixed(1)}</b></span>
                  <span>%B <b>{band && mark != null ? percentB(mark, band)?.toFixed(2) : '—'}</b></span>
                </div>
                {quiz ? (
                  <div className="ac-quiz">
                    {(['stretched_up', 'stretched_down', 'rsi_only'] as MarketRead[]).map((k) => (
                      <button key={k} type="button" className="ac-glass ac-option" onClick={() => answer(k)}>{READ_TEXT[k]}</button>
                    ))}
                  </div>
                ) : null}
              </div>
            ) : null}

            {note ? <p className="ac-note">{note}</p> : null}
            {read && lessonDone(lesson, earned) && lesson < 4 ? (
              <div className="ac-next"><Pill onClick={() => pick((lesson + 1) as LessonId)}>Lektion {lesson + 1} är upplåst — fortsätt</Pill></div>
            ) : null}
            {allDone ? (
              <p className="ac-note">Alla fyra lektioner klara. Detta är ett adaptivt övningsverktyg — inte en officiell licens, certifiering eller behörighet.</p>
            ) : null}
          </section>
        </main>
      </div>
    </div>
  )
}
