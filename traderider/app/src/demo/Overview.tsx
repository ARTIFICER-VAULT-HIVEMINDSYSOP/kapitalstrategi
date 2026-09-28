import type { Candle } from '../lib/types'
import { demoCopy, type ModeId } from './copy'
import { DemoShell } from './DemoFrame'
import { useLang } from './lang'
import { demoPath } from './paths'
import { ModeTeaser } from './Teaser'

const ORDER: ModeId[] = ['tag', 'akademin', 'raket']

export function Overview({ candles }: { candles: Candle[] }) {
  const { lang } = useLang()
  const copy = demoCopy(lang)
  return (
    <DemoShell candles={candles}>
      <p className="td-kicker">{copy.product}</p>
      <h1>{copy.overviewTitle}</h1>
      <p className="td-lead">{copy.overviewLead}</p>
      <p className="td-note">
        {copy.sameSeries}{' '}
        <a href="/nvda-rider/">{copy.openRider}</a>
      </p>
      <div className="td-grid">
        {ORDER.map((id) => {
          const info = copy.modes[id]
          return (
            <article className="td-card" key={id}>
              <ModeTeaser candles={candles} mode={id} />
              <div className="td-card-body">
                <p className="td-kicker">{info.kicker}</p>
                <h2>{info.title}</h2>
                {info.lines.map((line) => (
                  <p key={line}>{line}</p>
                ))}
                <a className="td-go" href={demoPath(`${id}/`)}>{info.open}</a>
              </div>
            </article>
          )
        })}
      </div>
    </DemoShell>
  )
}
