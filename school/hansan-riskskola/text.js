/**
 * Hansan – köpmännens riskskola, för Akademin.
 * Synliga texter på sv/en/uk. Källor ligger bara som dold kommentar i kallor.md.
 * Inga länkar till kurser som saknas i det här trädet.
 */
export const CHAPTER_ID = 'hansan-riskskola'

const L = (sv, en, uk) => ({ sv, en, uk })
const claim = (source, sv, en, uk) => ({ source, text: L(sv, en, uk) })

const BRIDGE_HREF = '/tradingskolan?lesson=hist-02-guld-korsfarare'

export const CHAPTER = {
  id: CHAPTER_ID,
  title: L(
    'Hansan – köpmännens riskskola',
    "The Hansa – the merchants' school of risk",
    'Ганза – школа ризику купців',
  ),
  bridgeSource: 'src-tempel-bro',
  bridge: L(
    'Tempelherrarnas förvaring, före Hansan, står i Marknadens historia, lektionen om guld och korsfarare.',
    'The Templars’ safekeeping, before the Hanse, is the lesson on gold and crusaders in the History of the market.',
    'Сховища тамплієрів, до Ганзи, – це урок про золото і хрестоносців в історії ринку.',
  ),
  lead: L(
    'Sex steg genom Hansan, och en liggare efteråt. Exemplen är historiska och säger inget om framtida utfall.',
    'Six steps through the Hanse, and a ledger afterwards. The examples are historical and say nothing about future outcomes.',
    'Шість кроків через Ганзу, і книга обліку наприкінці. Приклади історичні і нічого не кажуть про майбутні результати.',
  ),
  lessons: [
    {
      id: '1',
      title: L('Saltet från Brygge', 'Salt from Bruges', 'Сіль із Брюгге'),
      claims: [
        claim(
          'src-salt-brygge',
          'Hansans köpmän köpte billigt franskt och portugisiskt havssalt i Brygge, mycket efterfrågat i Östersjön.',
          'Hanse merchants bought cheap French and Portuguese sea salt in Bruges, much in demand in the Baltic.',
          'Купці Ганзи купували дешеву французьку й португальську морську сіль у Брюгге, дуже потрібну на Балтиці.',
        ),
        claim(
          'src-wittenborg',
          'Johann Wittenborg bytte flamländskt kläde mot pälsar och vax i Livland och Ryssland och sålde i Brygge.',
          'Johann Wittenborg exchanged Flemish cloth for furs and wax in Livonia and Russia and sold in Bruges.',
          'Йоганн Віттенборг міняв фламандське сукно на хутро й віск у Лівонії та Росії і продавав у Брюгге.',
        ),
        claim(
          'src-salt-brygge',
          'En prisskillnad ger en möjlig vinst, och samma resa bär risk för storm, kapare, kostnader och prisrörelser innan lasten är såld.',
          'A price gap gives a possible gain, and the same journey carries the risk of storm, privateers, costs and price moves before the cargo is sold.',
          'Різниця цін дає можливий прибуток, і та сама подорож несе ризик шторму, каперів, витрат і руху цін, поки вантаж не продано.',
        ),
      ],
      quiz: [
        {
          source: 'src-salt-brygge',
          q: L(
            'Vilken risk följer med samma resa som en prisskillnad kan ge vinst?',
            'What risk travels with the same journey on which a price gap can give a gain?',
            'Який ризик їде разом із подорожжю, де різниця цін може дати прибуток?',
          ),
          options: [
            L('Risk för storm, kapare, kostnader och prisrörelser', 'The risk of storm, privateers, costs and price moves', 'Ризик шторму, каперів, витрат і руху цін'),
            L('En garanterad vinst utan risk när saltet är lastat', 'A guaranteed gain with no risk once the salt is loaded', 'Гарантований прибуток без ризику, щойно сіль завантажено'),
            L('En fast kurs som inte kan röra sig', 'A fixed price that cannot move', 'Фіксована ціна, яка не може зрушити'),
          ],
          correct: 0,
        },
      ],
    },
    {
      id: '2',
      title: L('Fyra kölar', 'Four hulls', 'Чотири кілі'),
      claims: [
        claim(
          'src-fyra-agare',
          'Köpmännen spred lasten på flera skepp.',
          'Merchants spread the cargo across several ships.',
          'Купці розкладали вантаж на кілька кораблів.',
        ),
        claim(
          'src-fyra-agare',
          'Snittantalet ägare per skepp växte från två till fyra mellan sent 1200-tal och tidigt 1300-tal.',
          'The average number of owners per ship grew from two to four between the late 1200s and the early 1300s.',
          'Середня кількість власників на корабель виросла з двох до чотирьох між кінцем XIII і початком XIV століття.',
        ),
        claim(
          'src-fyra-agare',
          'Spridning kan lämna en vinst kvar när ett skepp går förlorat, och samma hav och väder är fortfarande en gemensam risk.',
          'Spreading can leave a gain when one ship is lost, and the same sea and weather are still a shared risk.',
          'Розподіл може лишити прибуток, коли один корабель втрачено, і те саме море й погода лишаються спільним ризиком.',
        ),
      ],
      quiz: [
        {
          source: 'src-fyra-agare',
          q: L(
            'Vad gör spridning på flera skepp med en enskild förlust?',
            'What does spreading across several ships do to a single loss?',
            'Що розподіл на кілька кораблів робить з однією втратою?',
          ),
          options: [
            L('Kan lämna en vinst kvar, medan havet fortfarande är en gemensam risk', 'Can leave a gain, while the sea is still a shared risk', 'Може лишити прибуток, хоча море лишається спільним ризиком'),
            L('Tar bort allt väder för flottan', 'Removes all weather for the fleet', 'Прибирає всю погоду для флоту'),
            L('Gör varje skepp ägt av en enda person', 'Makes every ship owned by one person', 'Робить кожен корабель власністю однієї людини'),
          ],
          correct: 0,
        },
      ],
    },
    {
      id: '3',
      title: L('Nattkonvojen', 'The night convoy', 'Нічний конвой'),
      claims: [
        claim(
          'src-gemensamt-haveri',
          'Vid gemensamt haveri bär ägarna av skeppet och den räddade lasten proportionella andelar av förlusten.',
          'In a general average, the owners of the ship and of the saved cargo bear proportional shares of the loss.',
          'При загальній аварії власники корабля і врятованого вантажу несуть пропорційні частки втрати.',
        ),
        claim(
          'src-sjoforsakring',
          'Premiebaserad sjöförsäkring utvecklades i Italien på 1300-talet och nådde Antwerpen, Amsterdam och London på 1500-talet.',
          'Premium-based marine insurance developed in Italy in the 1300s and reached Antwerp, Amsterdam and London in the 1500s.',
          'Морське страхування з премією виникло в Італії в XIV столітті і дійшло до Антверпена, Амстердама й Лондона в XVI.',
        ),
        claim(
          'src-sjoforsakring',
          'Riskdelning kan skydda en del av en vinst efter en skada, och varje skydd har ett pris.',
          'Sharing risk can protect part of a gain after a damage, and every protection has a price.',
          'Розподіл ризику може зберегти частину прибутку після шкоди, і кожен захист має ціну.',
        ),
      ],
      quiz: [
        {
          source: 'src-sjoforsakring',
          q: L(
            'Vad har varje skydd som kan lämna kvar en del av en vinst, när risken finns kvar?',
            'What does every protection have when it can leave part of a gain while the risk remains?',
            'Що має кожен захист, який може лишити частину прибутку, коли ризик лишається?',
          ),
          options: [
            L('Ett pris', 'A price', 'Ціну'),
            L('Ingen kostnad alls', 'No cost at all', 'Жодної вартості'),
            L('En rätt att slippa andelen vid haveri', 'A right to skip the share in a casualty', 'Право не платити частку при аварії'),
          ],
          correct: 0,
        },
        {
          source: 'src-gemensamt-haveri',
          q: L(
            'Hur delas förlusten vid gemensamt haveri?',
            'How is the loss shared in a general average?',
            'Як ділиться втрата при загальній аварії?',
          ),
          options: [
            L('Proportionellt mellan skepp och räddad last', 'Proportionally between ship and saved cargo', 'Пропорційно між кораблем і врятованим вантажем'),
            L('Bara av den som seglade sist', 'Only by whoever sailed last', 'Лише тим, хто плив останнім'),
            L('Den försvinner om natten', 'It disappears at night', 'Вона зникає вночі'),
          ],
          correct: 0,
        },
      ],
    },
    {
      id: '4',
      title: L('Växeln', 'The bill of exchange', 'Вексель'),
      claims: [
        claim(
          'src-vaxel',
          'Växeln fick bred användning på 1200-talet bland lombarderna.',
          'The bill of exchange came into wide use in the 1200s among the Lombards.',
          'Вексель широко ввійшов у вжиток у XIII столітті серед ломбардців.',
        ),
        claim(
          'src-vaxel',
          'En bankir kunde köpa en växel till diskont före förfallodagen.',
          'A banker could buy a bill at a discount before it fell due.',
          'Банкір міг купити вексель з дисконтом до строку.',
        ),
        claim(
          'src-vaxel',
          'Italienska köpmän gjorde Brygge till ett centrum för valuta och kredit.',
          'Italian merchants made Bruges a centre for currency and credit.',
          'Італійські купці зробили Брюгге центром валюти й кредиту.',
        ),
        claim(
          'src-veckinchusen-1418',
          'Sivert Veckinchusen drog en växel på brodern Hildebrand 1418.',
          'Sivert Veckinchusen drew a bill on his brother Hildebrand in 1418.',
          'Сіверт Феккінхузен виписав вексель на брата Гільдебранда 1418 року.',
        ),
        claim(
          'src-vaxel',
          'Kredit kan flytta en möjlig vinst i tid och rum, diskonten är priset för tid och motpartsrisk, och skulden ligger kvar tills den är betald.',
          'Credit can move a possible gain in time and place, the discount is the price of time and counterparty risk, and the debt remains until it is paid.',
          'Кредит може перенести можливий прибуток у часі й просторі, дисконт – це ціна часу і ризику контрагента, і борг лишається, доки його не сплачено.',
        ),
      ],
      quiz: [
        {
          source: 'src-vaxel',
          q: L(
            'Vad är diskonten ett pris för?',
            'What is the discount a price for?',
            'Ціною чого є дисконт?',
          ),
          options: [
            L('Tid och motpartsrisk', 'Time and counterparty risk', 'Часу і ризику контрагента'),
            L('Bara saltets vikt', 'Only the weight of the salt', 'Лише ваги солі'),
            L('En skuld som försvinner vid köpet', 'A debt that vanishes at purchase', 'Боргу, який зникає при купівлі'),
          ],
          correct: 0,
        },
      ],
    },
    {
      id: '5',
      title: L('Vändpunkten', 'The turning point', 'Поворот'),
      claims: [
        claim(
          'src-vinteruppehall',
          'Hansans kontorsregler begränsade vintersegling på Östersjön med ett vinteruppehåll för att minska olycksrisken.',
          'Hanse office rules limited winter sailing on the Baltic with a winter break in order to reduce the risk of accident.',
          'Правила контор Ганзи обмежували зимове плавання на Балтиці зимовою перервою, щоб зменшити ризик аварії.',
        ),
        claim(
          'src-skuldfangelse',
          'Hildebrand Veckinchusens förluster växte genom egna felbeslut, stort risktagande och uteblivna betalningar, och 1422–1425 satt han fängslad för skulder i Brygge.',
          'Hildebrand Veckinchusen’s losses grew through his own bad decisions, large risk-taking and payments that did not arrive, and in 1422–1425 he was imprisoned for debt in Bruges.',
          'Втрати Гільдебранда Феккінхузена росли через власні хибні рішення, великий ризик і платежі, які не прийшли, і в 1422–1425 він сидів у борговій в’язниці в Брюгге.',
        ),
        claim(
          'src-stop-loss',
          'En stop-loss är en i förväg bestämd nivå där en position stängs; den begränsar förlusten per affär och lämnar en möjlig vinst om kursen går åt andra hållet, och risken vid snabba kursrörelser är att stängningen sker på en sämre nivå.',
          'A stop-loss is a level chosen in advance where a position is closed; it limits the loss per trade and leaves a possible gain if the price goes the other way, and the risk in fast price moves is that the close happens at a worse level.',
          'Стоп-лосс – це заздалегідь обраний рівень, де позицію закривають; він обмежує втрату на угоду і лишає можливий прибуток, якщо ціна піде в інший бік, і ризик при швидкому русі ціни в тому, що закриття стається на гіршому рівні.',
        ),
        claim(
          'src-stop-loss',
          'I Tradingskolan är säkerhetsbältet stop-loss och flytvästen take-profit tillsammans med förhållandet mellan vinst och risk.',
          'In the trading school the seatbelt is the stop-loss and the life vest is take-profit together with the relation of gain and risk.',
          'У торговій школі пасок – це стоп-лосс, а рятувальний жилет – тейк-профіт разом із співвідношенням прибутку і ризику.',
        ),
      ],
      link: '/tradingskolan',
      quiz: [
        {
          source: 'src-stop-loss',
          q: L(
            'Vad gör en stop-loss med förlusten per affär?',
            'What does a stop-loss do to the loss per trade?',
            'Що стоп-лосс робить із втратою на угоду?',
          ),
          options: [
            L(
              'Begränsar den och lämnar en möjlig vinst, men risken är att stängningen blir sämre om kursen rör sig snabbt',
              'Limits it and leaves a possible gain, but the risk is that the close is worse if the price moves fast',
              'Обмежує її і лишає можливий прибуток, але ризик у тому, що закриття буде гіршим, якщо ціна рухається швидко',
            ),
            L('Tar bort varje möjlighet till förlust', 'Removes every chance of a loss', 'Прибирає будь-яку можливість втрати'),
            L('Ökar vinsten utan att ändra risken', 'Raises the gain without changing the risk', 'Збільшує прибуток, не змінюючи ризик'),
          ],
          correct: 0,
        },
      ],
    },
    {
      id: '6',
      title: L('Kontoret i Bergen', 'The office in Bergen', 'Контора в Бергені'),
      claims: [
        claim(
          'src-bryggen',
          'Bryggen var ett av Hansans fyra kontor utomlands och styrde handeln med stockfisk.',
          'Bryggen was one of the Hanse’s four offices abroad and ran the stockfish trade.',
          'Брюгген була однією з чотирьох закордонних контор Ганзи і вела торгівлю тріскою.',
        ),
        claim(
          'src-bryggen',
          'Brandsäkra stenförråd användes som enskilda eller gemensamma lager.',
          'Fire-safer stone stores were used as private or shared warehouses.',
          'Вогнестійкі кам’яні склади були приватними або спільними.',
        ),
        claim(
          'src-bryggen',
          'Ett lager kan ge en vinst när det säljs, och samma lager är en risk för likviditeten eftersom kapitalet är bundet tills försäljningen.',
          'A stock can give a gain when it is sold, and the same stock is a risk to liquidity because the capital stays tied up until the sale.',
          'Запас може дати прибуток, коли його продають, і той самий запас є ризиком для ліквідності, бо капітал зв’язаний до продажу.',
        ),
      ],
      quiz: [
        {
          source: 'src-bryggen',
          q: L(
            'När kan kapital som ligger i ett stort lager ge en vinst, och vilken risk bär lagret innan dess?',
            'When can capital that sits in a large stock give a gain, and what risk does the stock carry until then?',
            'Коли капітал у великому запасі може дати прибуток, і який ризик несе запас до того?',
          ),
          options: [
            L('Vid försäljning, medan lagret dessförinnan binder kapital och bär likviditetsrisk', 'When it is sold, while until then the stock ties up capital and carries liquidity risk', 'При продажу, а до того запас зв’язує капітал і несе ризик ліквідності'),
            L('Så fort varan är inlagd', 'As soon as the goods are stored', 'Щойно товар покладено'),
            L('Det är redan lika lätt att betala med som mynt', 'It is already as easy to pay with as coins', 'Ним уже так само легко платити, як монетою'),
          ],
          correct: 0,
        },
      ],
    },
    {
      id: '7',
      title: L('Liggare efter Hansan', 'The ledger after the Hanse', 'Книга обліку після Ганзи'),
      claims: [
        claim(
          'src-veckinchusen-arkiv',
          'Veckinchusens arkiv – tolv kontoböcker och omkring 600 brev från 1398 till 1428 i Tallinns stadsarkiv – fördes 2023 in i Unescos Memory of the World.',
          'The Veckinchusen archive – twelve account books and about 600 letters from 1398 to 1428 in the Tallinn city archive – was entered in 2023 into Unesco’s Memory of the World.',
          'Архів Феккінхузенів – дванадцять конторських книг і близько 600 листів 1398–1428 у міському архіві Таллінна – у 2023 році внесли до Unesco Memory of the World.',
        ),
        claim(
          'src-pacioli',
          'Paciolis Summa de arithmetica, tryckt i Venedig 1494, innehåller dubbel bokföring.',
          'Pacioli’s Summa de arithmetica, printed in Venice in 1494, contains double-entry bookkeeping.',
          'Summa de arithmetica Пачолі, надрукована у Венеції 1494 року, містить подвійний запис.',
        ),
        claim(
          'src-voc',
          'VOC grundades 1602 i Nederländska republiken.',
          'The VOC was founded in 1602 in the Dutch Republic.',
          'VOC засновано 1602 року в Нідерландській республіці.',
        ),
        claim(
          'src-pacioli',
          'En liggare visar vad som hänt, och samma bok kan både göra en vinst synlig och visa risken i en förlust.',
          'A ledger shows what has happened, and the same book can both make a gain visible and show the risk of a loss.',
          'Книга обліку показує, що сталося, і та сама книга може і показати прибуток, і показати ризик збитку.',
        ),
      ],
      quiz: [
        {
          source: 'src-pacioli',
          q: L(
            'Vad kan samma liggare visa?',
            'What can the same ledger show?',
            'Що може показати та сама книга обліку?',
          ),
          options: [
            L('Både en vinst och risken i en förlust', 'Both a gain and the risk of a loss', 'І прибуток, і ризик збитку'),
            L('Bara kommande kurser', 'Only future prices', 'Лише майбутні ціни'),
            L('Att skulden försvinner av sig själv', 'That a debt disappears by itself', 'Що борг зникає сам'),
          ],
          correct: 0,
        },
        {
          source: 'src-veckinchusen-arkiv',
          q: L(
            'Var förvaras Veckinchusens kontoböcker och brev?',
            'Where are the Veckinchusen account books and letters kept?',
            'Де зберігаються конторські книги і листи Феккінхузенів?',
          ),
          options: [
            L('I Tallinns stadsarkiv', 'In the Tallinn city archive', 'У міському архіві Таллінна'),
            L('Bara ombord på ett skepp', 'Only on board a ship', 'Лише на борту корабля'),
            L('I ett bolag som grundades 1602', 'In a company founded in 1602', 'У компанії, заснованій 1602 року'),
          ],
          correct: 0,
        },
      ],
    },
  ],
}

export function chapterLang(lang) {
  return lang === 'en' || lang === 'uk' ? lang : 'sv'
}

function esc(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

export function chapterView(lang) {
  const l = chapterLang(lang)
  return {
    id: CHAPTER.id,
    title: CHAPTER.title[l],
    bridge: CHAPTER.bridge[l],
    bridgeHref: BRIDGE_HREF,
    lead: CHAPTER.lead[l],
    lessons: CHAPTER.lessons.map((lesson) => ({
      id: lesson.id,
      title: lesson.title[l],
      body: lesson.claims.map((c) => c.text[l]).join(' '),
      link: lesson.link || '',
      quiz: lesson.quiz.map((q, i) => ({
        i,
        q: q.q[l],
        options: q.options.map((o) => o[l]),
      })),
    })),
  }
}

export function chapterHtml(lang) {
  const view = chapterView(lang)
  const lessons = view.lessons
    .map((lesson) => {
      const link = lesson.link
        ? `<p><a href="${esc(lesson.link)}">${esc(lesson.link)}</a></p>`
        : ''
      const quiz = lesson.quiz
        .map(
          (q) =>
            `<fieldset><legend>${esc(q.q)}</legend>${q.options
              .map(
                (o, n) =>
                  `<button type="button" data-act="hansa" data-lesson="${esc(lesson.id)}" data-qi="${q.i}" data-v="${n}">${esc(o)}</button>`,
              )
              .join('')}</fieldset>`,
        )
        .join('')
      return `<section data-lesson="${esc(lesson.id)}"><h3>${esc(lesson.title)}</h3><p>${esc(lesson.body)}</p>${link}${quiz}</section>`
    })
    .join('')
  return `<article data-chapter="${esc(view.id)}"><h2>${esc(view.title)}</h2><p class="bridge"><a href="${esc(view.bridgeHref)}">${esc(view.bridge)}</a></p><p>${esc(view.lead)}</p>${lessons}</article>`
}

export function gradeAnswer(lessonId, quizIndex, choice) {
  const lesson = CHAPTER.lessons.find((x) => x.id === String(lessonId))
  const q = lesson?.quiz[quizIndex]
  if (!q) return false
  return Number(choice) === q.correct
}

export function gradeLabel(lang, ok) {
  const l = chapterLang(lang)
  const right = L(
    'Rätt. Exemplen säger inget om framtida utfall.',
    'Right. The examples say nothing about future outcomes.',
    'Правильно. Приклади нічого не кажуть про майбутні результати.',
  )
  const again = L(
    'Försök igen. Exemplen säger inget om framtida utfall.',
    'Try again. The examples say nothing about future outcomes.',
    'Спробуйте ще. Приклади нічого не кажуть про майбутні результати.',
  )
  return (ok ? right : again)[l]
}
