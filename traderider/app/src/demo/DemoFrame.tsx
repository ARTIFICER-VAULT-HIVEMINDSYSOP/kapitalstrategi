import type { ReactNode } from 'react'
import type { Candle } from '../lib/types'
import { DISCLAIMER_SV, demoCopy, type ModeId } from './copy'
import { useLang, type Lang } from './lang'
import { demoPath } from './paths'
import { ModeTeaser } from './Teaser'
import './demo.css'

const LANGS: Array<{ id: Lang; label: string }> = [
  { id: 'sv', label: 'SV' },
  { id: 'en', label: 'EN' },
  { id: 'uk', label: 'UA' },
]

function LangButtons() {
  const { lang, setLang } = useLang()
  const copy = demoCopy(lang)
  return (
    <div className="td-lang" role="group" aria-label={copy.langLabel}>
      {LANGS.map((item) => (
        <button key={item.id} type="button" aria-pressed={lang === item.id} onClick={() => setLang(item.id)}>
          {item.label}
        </button>
      ))}
    </div>
  )
}

export function SiteBar({ here }: { here?: ModeId }) {
  const { lang } = useLang()
  const copy = demoCopy(lang)
  return (
    <header className="td-top">
      <a className="td-brand" href={demoPath()}>
        <strong>{copy.brand}</strong>
        <span>{copy.product}</span>
      </a>
      <nav aria-label={copy.product}>
        {(Object.keys(copy.modes) as ModeId[]).map((id) => (
          <a key={id} href={demoPath(`${id}/`)} aria-current={here === id ? 'page' : undefined}>
            {copy.modes[id].title}
          </a>
        ))}
      </nav>
      <LangButtons />
    </header>
  )
}

export function Disclaimer() {
  const { lang } = useLang()
  const copy = demoCopy(lang)
  return (
    <>
      <p className="td-disclaimer" role="note">{DISCLAIMER_SV}</p>
      {lang === 'sv' ? null : <p className="td-disclaimer-tr">{copy.disclaimer}</p>}
    </>
  )
}

export function DemoIntro({ mode, candles }: { mode: ModeId; candles: Candle[] }) {
  const { lang } = useLang()
  const copy = demoCopy(lang)
  const info = copy.modes[mode]
  return (
    <section className="td-intro">
      <ModeTeaser candles={candles} mode={mode} />
      <div className="td-intro-copy">
        <p className="td-kicker">{info.kicker}</p>
        <h1>{info.title}</h1>
        {info.lines.map((line) => (
          <p key={line}>{line}</p>
        ))}
        <p className="td-controls">{info.controls}</p>
        {mode === 'akademin' && copy.lessonNote ? <p className="td-note">{copy.lessonNote}</p> : null}
        <a className="td-text-link" href={demoPath()}>{copy.back}</a>
      </div>
    </section>
  )
}

export function DemoShell({ mode, candles, children }: { mode?: ModeId; candles: Candle[]; children?: ReactNode }) {
  return (
    <div className="td-page">
      <SiteBar here={mode} />
      <Disclaimer />
      <main className="td-wrap">
        {mode ? <DemoIntro mode={mode} candles={candles} /> : children}
        {mode ? children : null}
      </main>
    </div>
  )
}
