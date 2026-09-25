import type { Lang } from './lang'

const EXACT: Record<string, Record<Lang, string>> = {
  'Flat on the 20-SMA. No position.': {
    sv: 'Platt på mittfilen (20-SMA). Ingen position.',
    en: 'Flat on the middle rail (20-SMA). No position.',
    uk: 'Без позиції на середній рейці (20-SMA).',
  },
  'Not enough candles for the 20-period band.': {
    sv: 'För få candles för ett 20-perioders band.',
    en: 'Not enough candles for a 20-period band.',
    uk: 'Замало свічок для смуги з 20 періодів.',
  },
  'Long. Train on the upper rail. Filled at the offer plus slippage.': {
    sv: 'Köp (long). Fylld på säljkurs plus slippage i övningsboken.',
    en: 'Buy (long). Filled at the offer plus slippage in the practice book.',
    uk: 'Купівля (long). Виконано за ціною продажу плюс slippage у тренувальній книзі.',
  },
  'Short. Train on the lower rail. Filled at the bid minus slippage.': {
    sv: 'Sälj (short). Fylld på köpkurs minus slippage i övningsboken.',
    en: 'Sell (short). Filled at the bid minus slippage in the practice book.',
    uk: 'Продаж (short). Виконано за ціною купівлі мінус slippage у тренувальній книзі.',
  },
  'Closed only. No implicit reverse — send the order again to open the other side.': {
    sv: 'Stängd. Ingen automatisk vändning. Tryck igen för att öppna andra sidan.',
    en: 'Closed. No automatic reversal. Press again to open the other side.',
    uk: 'Закрито. Без автоматичного розвороту. Натисніть ще раз, щоб відкрити інший бік.',
  },
  'Flat. Position closed at the touch plus slippage.': {
    sv: 'Platt. Positionen stängd.',
    en: 'Flat. Position closed.',
    uk: 'Без позиції. Позицію закрито.',
  },
  'Liquidated. Equity breached maintenance.': {
    sv: 'Stoppad: simulerat kapital under underhållsgränsen. Övningen fortsätter platt.',
    en: 'Stopped: simulated capital is under the maintenance line. Practice continues flat.',
    uk: 'Зупинено: змодельований капітал нижче межі утримання. Тренування триває без позиції.',
  },
  'No new order. Already on that side, or already flat.': {
    sv: 'Ingen ny order. Redan på den sidan, eller redan platt.',
    en: 'No new order. Already on that side, or already flat.',
    uk: 'Нового ордера немає. Уже на цьому боці або вже без позиції.',
  },
  'Rejected. Buying power does not cover one whole share.': {
    sv: 'Avvisad: övningskapitalet räcker inte till en hel aktie.',
    en: 'Rejected: practice capital does not cover one whole share.',
    uk: 'Відхилено: тренувального капіталу не вистачає на одну цілу акцію.',
  },
  'End of the candle series. Paused.': {
    sv: 'Slut på den historiska serien. Pausad.',
    en: 'End of the historical series. Paused.',
    uk: 'Кінець історичної серії. Пауза.',
  },
}

const LEVERAGE = /^Leverage (\d+)×/

export function statusLabel(lang: Lang, status: string): string {
  const known = EXACT[status]
  if (known) return known[lang]
  const lev = LEVERAGE.exec(status)
  if (lev) {
    const n = lev[1]
    if (lang === 'en') return `Leverage ${n}×. Speed and simulated size follow the factor. Maximum 4×.`
    if (lang === 'uk') return `Плече ${n}×. Швидкість і змодельований розмір ідуть за множником. Максимум 4×.`
    return `Hävstång ${n}×. Fart och simulerad storlek följer faktorn. Högst 4×.`
  }
  if (lang === 'en') return 'Practice session updated.'
  if (lang === 'uk') return 'Тренування оновлено.'
  return 'Övningen uppdaterades.'
}

export function statusStrings(): string[] {
  const out: string[] = []
  for (const row of Object.values(EXACT)) out.push(row.sv, row.en, row.uk)
  return out
}
