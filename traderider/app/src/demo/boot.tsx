import { createRoot } from 'react-dom/client'
import type { ReactNode } from 'react'
import { loadNvdaOffline } from '../lib/loadNvda'
import type { Candle } from '../lib/types'
import { demoCopy } from './copy'
import { LangProvider, readLang } from './lang'

export function boot(render: (candles: Candle[]) => ReactNode) {
  const el = document.getElementById('root')
  if (!el) throw new Error('missing root')
  const root = createRoot(el)
  root.render(<p className="td-loading">{demoCopy(readLang()).loading}</p>)
  void loadNvdaOffline().then((data) => {
    root.render(<LangProvider>{render(data.candles)}</LangProvider>)
  })
}
