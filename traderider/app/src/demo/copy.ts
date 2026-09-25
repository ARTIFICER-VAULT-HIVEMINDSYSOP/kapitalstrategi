import type { RideLabels } from '../lib/drawRide'
import type { Lang } from './lang'

/** Always shown, in this exact wording. */
export const DISCLAIMER_SV = 'Övningsläge med historiska kurser. Inga riktiga pengar. Ingen rådgivning.'

export type ModeId = 'tag' | 'akademin' | 'raket'

type ModeCopy = {
  kicker: string
  title: string
  lines: [string, string, string, string]
  controls: string
  open: string
}

type RocketCopy = {
  kicker: string
  title: string
  sub: string
  close: string
  vs: string
  position: string
  leverage: string
  equity: string
  unreal: string
  long: string
  short: string
  flat: string
  sell: string
  buy: string
  next: string
  status: string
  aboutTitle: string
  about: string
  flatKey: string
  levDown: string
  levUp: string
  pause: string
  run: string
  restart: string
  endTitle: string
  endBody: (equity: string, start: string) => string
  restartPractice: string
  overbought: string
  oversold: string
  neutral: string
  waiting: string
  paused: string
  riding: string
  perSec: string
  series: string
  hintWait: string
  hintUpperHot: string
  hintLowerHot: string
  hintUpper: string
  hintLower: string
  hintAbove: string
  hintBelow: string
}

export type DemoCopy = {
  brand: string
  product: string
  overviewTitle: string
  overviewLead: string
  disclaimer: string
  back: string
  sameSeries: string
  openRider: string
  lessonNote: string
  loading: string
  langLabel: string
  modes: Record<ModeId, ModeCopy>
  rocket: RocketCopy
  ride: RideLabels
}

const SV: DemoCopy = {
  brand: 'Kapital och Strategi',
  product: 'Traderider',
  overviewTitle: 'Tre övningar',
  overviewLead:
    'Varje läge är en egen övning på medföljande historiska NVDA-timmar från augusti och september 2026. Saldot är påhittat. Inget lämnar webbläsaren.',
  disclaimer: DISCLAIMER_SV,
  back: 'Alla lägen',
  sameSeries: 'Läge 1 använder samma Bollinger-räls (20 perioder, 2 standardavvikelser) och samma medföljande NVDA-serie som NVDA Rider på den här sajten. Den sidan är oförändrad.',
  openRider: 'Öppna NVDA Rider',
  lessonNote: '',
  loading: 'Laddar historiska NVDA-candles…',
  langLabel: 'Språk',
  modes: {
    tag: {
      kicker: 'Läge 1 · tåg',
      title: 'NVDA Rider',
      lines: [
        'Tåget åker på Bollingerbanden som räls, över riktiga historiska NVDA-timmar.',
        'Övre räls är köp (long), undre räls är sälj (short), mittfilen är platt.',
        'Hävstång 1–4× ändrar både farten och den simulerade storleken.',
        'Porträttet i hörnet reagerar på simulerat resultat, RSI och bandbredd.',
      ],
      controls: 'Knapparna på skärmen räcker på mobil. Tangentbord: W eller pil upp köp, S eller pil ner sälj, F platt, [ ] hävstång, mellanslag paus.',
      open: 'Prova tåget',
    },
    akademin: {
      kicker: 'Läge 2 · lektioner',
      title: 'Akademin',
      lines: [
        'Fyra steg på samma NVDA-graf: risk, stop-loss och take-profit, Bollinger, sedan RSI.',
        'Nästa lektion låses upp när uppgiften är gjord, inte när ett simulerat resultat ser bra ut.',
        'Porträttet är ryttaren i marinblått och guld, och det följer läget i lektionen.',
        'Övningssaldo visas i USD. Inget konto behövs.',
      ],
      controls: 'Alla val är knappar. Mellanslag pausar grafen. På en smal skärm ligger lektionerna ovanför grafen.',
      open: 'Prova lektionerna',
    },
    raket: {
      kicker: 'Läge 3 · fart',
      title: 'Raket',
      lines: [
        'Samma NVDA-historia, vänd på höjden: tiden går uppåt och priset går i sidled.',
        'Bollingerbanden är korridorväggar. RSI visar hur sträckt läget är.',
        'Hävstång gör farten och den simulerade risken synliga samtidigt.',
        'Shiba-kosmonautens porträtt reagerar på simulerat resultat och på risken.',
      ],
      controls: 'Sälj och köp är stora knappar. Tangentbord: vänsterpil eller A sälj, högerpil eller D köp, F platt, [ ] hävstång, mellanslag paus.',
      open: 'Prova raketen',
    },
  },
  rocket: {
    kicker: 'Läge 3 · Raket · övning på historiska NVDA-priser',
    title: 'Raket',
    sub: 'Samma graf och samma motor, vänd på höjden. Tiden rinner uppåt, priset går i sidled. Bollingerbanden är korridorväggar, RSI visar hur sträckt läget är.',
    close: 'NVDA stängning',
    vs: 'Mot föregående',
    position: 'Position',
    leverage: 'Hävstång',
    equity: 'Övningskapital (sim.)',
    unreal: 'Orealiserat (sim.)',
    long: 'Köp (long)',
    short: 'Sälj (short)',
    flat: 'Platt',
    sell: 'Sälj',
    buy: 'Köp',
    next: 'Nästa steg',
    status: 'Status',
    aboutTitle: 'Om övningen',
    about:
      'Historiska NVDA-timcandles. Ingen mäklare, inga riktiga pengar, ingen inloggning. Alla utfall är simuleringar och inget löfte om avkastning. Bollinger 20 / 2 och RSI 14 (70/30) från den delade motorn.',
    flatKey: 'Platt · F',
    levDown: 'Hävstång − · [',
    levUp: 'Hävstång + · ]',
    pause: 'Paus · mellanslag',
    run: 'Kör · mellanslag',
    restart: 'Starta om',
    endTitle: 'Sessionen slut — simulerat utfall',
    endBody: (equity, start) =>
      `Övningskapital ${equity} (start ${start}). Utfallet är en simulering på historiska priser och säger ingenting om ett senare resultat.`,
    restartPractice: 'Starta om övningen',
    overbought: 'Överköpt',
    oversold: 'Översålt',
    neutral: 'Neutral',
    waiting: 'Väntar',
    paused: 'pausad',
    riding: 'åker',
    perSec: 'candles/s',
    series: 'medföljande historiska candles',
    hintWait: 'Väntar på band och RSI.',
    hintUpperHot: 'Nära högerväggen och RSI över 70: läget är sträckt. Öva: vänta eller stäng.',
    hintLowerHot: 'Nära vänsterväggen och RSI under 30: läget är sträckt nedåt. Öva: stå platt i stället för att jaga.',
    hintUpper: 'Kursen pressar högerväggen (övre bandet) utan RSI över 70. Öva: följ med eller vänta.',
    hintLower: 'Kursen pressar vänsterväggen (undre bandet) utan RSI under 30. Öva: följ med nedåt eller stå platt.',
    hintAbove: 'Höger om mittfilen: kursen över 20-SMA. Håll koll på RSI mot 70.',
    hintBelow: 'Vänster om mittfilen: kursen under 20-SMA. Håll koll på RSI mot 30.',
  },
  ride: {
    vsPrevious: 'mot föregående',
    long: 'KÖP · övre räls',
    short: 'SÄLJ · undre räls',
    flat: 'PLATT · mittfil',
    paused: 'PAUS',
    upper: 'Övre',
    mid: '20-SMA',
    lower: 'Undre',
  },
}

const EN: DemoCopy = {
  brand: 'Kapital och Strategi',
  product: 'Traderider',
  overviewTitle: 'Three practice modes',
  overviewLead:
    'Each mode is its own practice on the bundled historical NVDA hours from August and September 2026. The balance is fictional. Nothing leaves the browser.',
  disclaimer: 'Practice mode with historical prices. No real money. No advice.',
  back: 'All modes',
  sameSeries:
    'Mode 1 uses the same Bollinger rails (20 periods, 2 standard deviations) and the same bundled NVDA series as NVDA Rider on this site. That page is unchanged.',
  openRider: 'Open NVDA Rider',
  lessonNote: 'The lesson text on this page is in Swedish.',
  loading: 'Loading historical NVDA candles…',
  langLabel: 'Language',
  modes: {
    tag: {
      kicker: 'Mode 1 · train',
      title: 'NVDA Rider',
      lines: [
        'The train rides the Bollinger bands as rails, on real historical NVDA hours.',
        'The upper rail is a buy (long), the lower rail is a sell (short), and the middle is flat.',
        'Leverage from 1× to 4× changes both speed and the simulated size.',
        'The corner portrait reacts to the simulated result, RSI and bandwidth.',
      ],
      controls: 'On-screen buttons are enough on a phone. Keyboard: W or up arrow buys, S or down arrow sells, F flattens, [ ] changes leverage, space pauses.',
      open: 'Try the train',
    },
    akademin: {
      kicker: 'Mode 2 · lessons',
      title: 'Akademin',
      lines: [
        'Four steps on the same NVDA chart: risk, stop-loss and take-profit, Bollinger, then RSI.',
        'The next lesson opens when the task is done, not when a simulated result looks good.',
        'The portrait is the rider in navy and gold, and it follows the lesson.',
        'The practice balance is shown in USD. No account is required.',
      ],
      controls: 'Every choice is a button. Space pauses the chart. On a narrow screen the lessons sit above the chart.',
      open: 'Try the lessons',
    },
    raket: {
      kicker: 'Mode 3 · speed',
      title: 'Raket',
      lines: [
        'The same NVDA history, turned upright: time runs upward and price runs sideways.',
        'The Bollinger bands are corridor walls. RSI shows how stretched the level is.',
        'Leverage makes speed and simulated risk visible at the same time.',
        'The Shiba cosmonaut portrait reacts to the simulated result and to risk.',
      ],
      controls: 'Sell and buy are large buttons. Keyboard: left arrow or A sells, right arrow or D buys, F flattens, [ ] changes leverage, space pauses.',
      open: 'Try the rocket',
    },
  },
  rocket: {
    kicker: 'Mode 3 · Rocket · practice on historical NVDA prices',
    title: 'Raket',
    sub: 'Same chart and same engine, turned upright. Time runs upward, price runs sideways. The Bollinger bands are corridor walls, and RSI shows how stretched the level is.',
    close: 'NVDA close',
    vs: 'Versus previous',
    position: 'Position',
    leverage: 'Leverage',
    equity: 'Practice capital (sim.)',
    unreal: 'Unrealized (sim.)',
    long: 'Buy (long)',
    short: 'Sell (short)',
    flat: 'Flat',
    sell: 'Sell',
    buy: 'Buy',
    next: 'Next step',
    status: 'Status',
    aboutTitle: 'About this practice',
    about:
      'Historical NVDA hour candles. No brokerage, no real money, no sign-in. Every outcome is a simulation and not a promise of a later result. Bollinger 20 / 2 and RSI 14 (70/30) come from the shared engine.',
    flatKey: 'Flat · F',
    levDown: 'Leverage − · [',
    levUp: 'Leverage + · ]',
    pause: 'Pause · space',
    run: 'Run · space',
    restart: 'Restart',
    endTitle: 'Session over — simulated outcome',
    endBody: (equity, start) =>
      `Practice capital ${equity} (start ${start}). The outcome is a simulation on historical prices and says nothing about a later result.`,
    restartPractice: 'Restart practice',
    overbought: 'Overbought',
    oversold: 'Oversold',
    neutral: 'Neutral',
    waiting: 'Waiting',
    paused: 'paused',
    riding: 'riding',
    perSec: 'candles/s',
    series: 'bundled historical candles',
    hintWait: 'Waiting for the bands and RSI.',
    hintUpperHot: 'Near the right wall and RSI above 70: the level is stretched. Practice: wait or close.',
    hintLowerHot: 'Near the left wall and RSI below 30: the level is stretched downward. Practice: stay flat instead of chasing.',
    hintUpper: 'Price is pressing the right wall (upper band) without RSI above 70. Practice: follow or wait.',
    hintLower: 'Price is pressing the left wall (lower band) without RSI below 30. Practice: follow down or stay flat.',
    hintAbove: 'Right of the middle: price is above the 20-SMA. Watch RSI toward 70.',
    hintBelow: 'Left of the middle: price is below the 20-SMA. Watch RSI toward 30.',
  },
  ride: {
    vsPrevious: 'vs previous close',
    long: 'BUY · upper rail',
    short: 'SELL · lower rail',
    flat: 'FLAT · mid rail',
    paused: 'PAUSED',
    upper: 'Upper',
    mid: '20-SMA',
    lower: 'Lower',
  },
}

const UK: DemoCopy = {
  brand: 'Kapital och Strategi',
  product: 'Traderider',
  overviewTitle: 'Три тренування',
  overviewLead:
    'Кожен режим — окреме тренування на вкладених історичних годинах NVDA за серпень і вересень 2026. Баланс вигаданий. Нічого не виходить з браузера.',
  disclaimer: 'Тренувальний режим з історичними курсами. Без справжніх грошей. Без порад.',
  back: 'Усі режими',
  sameSeries:
    'Режим 1 використовує ті самі рейки Боллінджера (20 періодів, 2 стандартні відхилення) і ту саму вкладену серію NVDA, що й NVDA Rider на цьому сайті. Ту сторінку не змінено.',
  openRider: 'Відкрити NVDA Rider',
  lessonNote: 'Текст уроків на цій сторінці шведською.',
  loading: 'Завантаження історичних свічок NVDA…',
  langLabel: 'Мова',
  modes: {
    tag: {
      kicker: 'Режим 1 · потяг',
      title: 'NVDA Rider',
      lines: [
        'Потяг їде рейками Боллінджера на справжніх історичних годинах NVDA.',
        'Верхня рейка — купівля (long), нижня — продаж (short), середня — без позиції.',
        'Плече 1–4× змінює і швидкість, і змодельований розмір.',
        'Портрет у куті реагує на змодельований результат, RSI і ширину смуг.',
      ],
      controls: 'Кнопок на екрані достатньо на телефоні. Клавіатура: W або стрілка вгору — купівля, S або стрілка вниз — продаж, F — закрити, [ ] — плече, пробіл — пауза.',
      open: 'Спробувати потяг',
    },
    akademin: {
      kicker: 'Режим 2 · уроки',
      title: 'Akademin',
      lines: [
        'Чотири кроки на тому самому графіку NVDA: ризик, stop-loss і take-profit, Боллінджер, потім RSI.',
        'Наступний урок відкривається, коли завдання зроблено, а не коли змодельований результат виглядає добре.',
        'Портрет — вершник у темно-синьому і золотому, і він стежить за уроком.',
        'Тренувальний баланс показано в USD. Обліковий запис не потрібен.',
      ],
      controls: 'Усі вибори — це кнопки. Пробіл ставить графік на паузу. На вузькому екрані уроки стоять над графіком.',
      open: 'Спробувати уроки',
    },
    raket: {
      kicker: 'Режим 3 · швидкість',
      title: 'Raket',
      lines: [
        'Та сама історія NVDA, повернута сторч: час іде вгору, ціна — вбік.',
        'Смуги Боллінджера — це стіни коридору. RSI показує, наскільки рівень розтягнутий.',
        'Плече робить швидкість і змодельований ризик видимими одночасно.',
        'Портрет сіби-космонавта реагує на змодельований результат і на ризик.',
      ],
      controls: 'Продаж і купівля — великі кнопки. Клавіатура: стрілка вліво або A — продаж, стрілка вправо або D — купівля, F — закрити, [ ] — плече, пробіл — пауза.',
      open: 'Спробувати ракету',
    },
  },
  rocket: {
    kicker: 'Режим 3 · Ракета · тренування на історичних цінах NVDA',
    title: 'Raket',
    sub: 'Той самий графік і той самий рушій, повернуті сторч. Час тече вгору, ціна йде вбік. Смуги Боллінджера — стіни коридору, RSI показує, наскільки рівень розтягнутий.',
    close: 'Закриття NVDA',
    vs: 'До попереднього',
    position: 'Позиція',
    leverage: 'Плече',
    equity: 'Тренувальний капітал (сим.)',
    unreal: 'Нереалізоване (сим.)',
    long: 'Купівля (long)',
    short: 'Продаж (short)',
    flat: 'Без позиції',
    sell: 'Продаж',
    buy: 'Купівля',
    next: 'Наступний крок',
    status: 'Статус',
    aboutTitle: 'Про тренування',
    about:
      'Історичні годинні свічки NVDA. Без брокера, без справжніх грошей, без входу. Усі результати — симуляція і не обіцянка подальшого результату. Боллінджер 20 / 2 і RSI 14 (70/30) з спільного рушія.',
    flatKey: 'Закрити · F',
    levDown: 'Плече − · [',
    levUp: 'Плече + · ]',
    pause: 'Пауза · пробіл',
    run: 'Їхати · пробіл',
    restart: 'Спочатку',
    endTitle: 'Сесію завершено — змодельований результат',
    endBody: (equity, start) =>
      `Тренувальний капітал ${equity} (старт ${start}). Результат — симуляція на історичних цінах і нічого не каже про подальший підсумок.`,
    restartPractice: 'Почати тренування знову',
    overbought: 'Перекуплено',
    oversold: 'Перепродано',
    neutral: 'Нейтрально',
    waiting: 'Очікування',
    paused: 'пауза',
    riding: 'рух',
    perSec: 'свічок/с',
    series: 'вкладені історичні свічки',
    hintWait: 'Очікування на смуги і RSI.',
    hintUpperHot: 'Біля правої стіни і RSI понад 70: рівень розтягнутий. Тренування: зачекати або закрити.',
    hintLowerHot: 'Біля лівої стіни і RSI нижче 30: рівень розтягнутий униз. Тренування: лишатися без позиції.',
    hintUpper: 'Ціна тисне на праву стіну (верхня смуга) без RSI понад 70. Тренування: іти слідом або чекати.',
    hintLower: 'Ціна тисне на ліву стіну (нижня смуга) без RSI нижче 30. Тренування: іти вниз або лишатися без позиції.',
    hintAbove: 'Праворуч від середини: ціна вище 20-SMA. Стежте за RSI до 70.',
    hintBelow: 'Ліворуч від середини: ціна нижче 20-SMA. Стежте за RSI до 30.',
  },
  ride: {
    vsPrevious: 'до попереднього',
    long: 'КУПІВЛЯ · верхня рейка',
    short: 'ПРОДАЖ · нижня рейка',
    flat: 'БЕЗ ПОЗИЦІЇ · середина',
    paused: 'ПАУЗА',
    upper: 'Верх',
    mid: '20-SMA',
    lower: 'Низ',
  },
}

const PACK: Record<Lang, DemoCopy> = { sv: SV, en: EN, uk: UK }

export function demoCopy(lang: Lang): DemoCopy {
  return PACK[lang]
}

export function collectCopyStrings(): string[] {
  const out: string[] = [DISCLAIMER_SV]
  for (const pack of Object.values(PACK)) {
    out.push(
      pack.brand,
      pack.product,
      pack.overviewTitle,
      pack.overviewLead,
      pack.disclaimer,
      pack.back,
      pack.sameSeries,
      pack.openRider,
      pack.lessonNote,
      pack.loading,
      pack.langLabel,
    )
    for (const mode of Object.values(pack.modes)) {
      out.push(mode.kicker, mode.title, mode.controls, mode.open, ...mode.lines)
    }
    const r = pack.rocket
    out.push(
      r.kicker,
      r.title,
      r.sub,
      r.close,
      r.vs,
      r.position,
      r.leverage,
      r.equity,
      r.unreal,
      r.long,
      r.short,
      r.flat,
      r.sell,
      r.buy,
      r.next,
      r.status,
      r.aboutTitle,
      r.about,
      r.flatKey,
      r.levDown,
      r.levUp,
      r.pause,
      r.run,
      r.restart,
      r.endTitle,
      r.endBody('$100,000.00', '$100,000.00'),
      r.restartPractice,
      r.overbought,
      r.oversold,
      r.neutral,
      r.waiting,
      r.paused,
      r.riding,
      r.perSec,
      r.series,
      r.hintWait,
      r.hintUpperHot,
      r.hintLowerHot,
      r.hintUpper,
      r.hintLower,
      r.hintAbove,
      r.hintBelow,
      pack.ride.vsPrevious,
      pack.ride.long,
      pack.ride.short,
      pack.ride.flat,
      pack.ride.paused,
      pack.ride.upper,
      pack.ride.mid,
      pack.ride.lower,
    )
  }
  return out
}
