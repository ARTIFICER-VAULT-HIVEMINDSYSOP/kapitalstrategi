/**
 * Bank map education block. Strings use bankMap.moneyExplainer.* keys.
 * Mounts only while .bank-map-disclaimer is on the page, directly after it.
 * Does not change bankMap.disclaimer.
 */
(function () {
  "use strict";

  var HOST_ID = "bankmap-money-explainer";

  var SRC = {
    ecbFaq: "https://www.ecb.europa.eu/euro/digital_euro/faqs/html/ecb.faq_digital_euro.en.html",
    ecbBitcoin: "https://www.ecb.europa.eu/ecb-and-you/explainers/tell-me/html/what-is-bitcoin.en.html",
    ecbMrr: "https://www.ecb.europa.eu/ecb-and-you/explainers/tell-me/html/minimum_reserve_req.en.html",
    ecbMrrCalc: "https://www.ecb.europa.eu/mopo/implement/mr/html/calc.en.html",
    ecbBulletin: "https://www.ecb.europa.eu/press/economic-bulletin/articles/2019/html/ecb.ebart201905_03~c83aeaa44c.en.html",
    ecbFsr: "https://www.ecb.europa.eu/press/financial-stability-publications/fsr/special/html/ecb.fsrart202505_01~62255f2625.en.html",
    rbEkrona: "https://www.riksbank.se/sv/betalningar--kontanter/e-krona/",
    rbOffline: "https://www.riksbank.se/sv/press-och-publicerat/nyheter-och-pressmeddelanden/nyheter/2024/e-kronapiloten-etapp-4-offlinebetalningar-med-e-kronor/",
    rbSpeech: "https://www.riksbank.se/globalassets/media/tal/svenska/seim/2026/seim-tal-vad-ar-pengar.pdf",
    rbKassakrav: "https://www.riksbank.se/globalassets/media/rapporter/ekonomiska-kommentarer/svenska/2020/pengar-och-penningpolitik-i-kristider.pdf",
    rbInlaning: "https://www.riksbank.se/sv/marknader/rantefri-inlaning/",
    rbInlaningNews: "https://www.riksbank.se/sv/press-och-publicerat/nyheter-och-pressmeddelanden/nyheter/2026/riksbanken-har-beslutat-om-rantefri-inlaning-pa-knappt-35-miljarder-kronor/",
    fiCapital: "https://www.fi.se/sv/bank/kapitalkrav/",
    fiLiquidity: "https://www.fi.se/sv/bank/tillsyn/likviditet/",
    rgk: "https://www.riksgalden.se/globalassets/dokument_sve/press-och-publicerat/foreskrifter/rgkfs-2-2025-tillg3.pdf",
    bitcoinFaq: "https://bitcoin.org/en/faq",
    ethereumSc: "https://ethereum.org/en/smart-contracts/",
    dagens: "https://www.dagens.se/krig/gra-marknad-vaxer-i-ryssland-centralbanken-uppmanar-banker-att-granska-kunders-kontantinsattningar"
  };

  function pack(sv, en, uk) {
    return { sv: sv, en: en, uk: uk };
  }

  /** @type {Record<string, {sv: string, en: string, uk: string}>} */
  var STR = {
    "bankMap.moneyExplainer.eyebrow": pack("Utbildning", "Education", "Навчання"),
    "bankMap.moneyExplainer.title": pack(
      "Krypto, CBDC och bankpengar",
      "Crypto, CBDC and bank money",
      "Крипто, CBDC і банківські гроші"
    ),
    "bankMap.moneyExplainer.lead": pack(
      "En neutral jämförelse av kryptotillgångar, digitala centralbankspengar (CBDC) och inlåning i en affärsbank. Texten är utbildning. Den rekommenderar inte någon tillgång och utlovar ingen avkastning.",
      "A neutral comparison of crypto-assets, central bank digital currency (CBDC) and deposits at a commercial bank. This is education. It does not recommend any asset and it promises no return.",
      "Нейтральне порівняння криптоактивів, цифрових грошей центрального банку (CBDC) і вкладів у комерційному банку. Це навчальний текст. Він не рекомендує жодного активу і не обіцяє доходу."
    ),
    "bankMap.moneyExplainer.part1Title": pack("Krypto eller CBDC?", "Crypto or CBDC?", "Крипто чи CBDC?"),
    "bankMap.moneyExplainer.part1Lead": pack(
      "En CBDC är pengar utgivna av en centralbank. Krypto är det inte. Uppgifterna nedan är kontrollerade mot de länkade sidorna.",
      "A CBDC is money issued by a central bank. Crypto is not. The points below were checked against the linked pages.",
      "CBDC — це гроші, які випускає центральний банк. Крипто — ні. Пункти нижче звірено з наведеними сторінками."
    ),
    "bankMap.moneyExplainer.colAspect": pack("Fråga", "Question", "Питання"),
    "bankMap.moneyExplainer.colCrypto": pack("Krypto", "Crypto", "Крипто"),
    "bankMap.moneyExplainer.colCbdc": pack("CBDC", "CBDC", "CBDC"),
    "bankMap.moneyExplainer.tableCaption": pack(
      "Jämförelse med källänk i varje rad.",
      "Comparison with a source link on every row.",
      "Порівняння з посиланням на джерело в кожному рядку."
    ),
    "bankMap.moneyExplainer.row.issuer.aspect": pack("Vem ger ut pengarna?", "Who issues the money?", "Хто випускає гроші?"),
    "bankMap.moneyExplainer.row.issuer.crypto": pack(
      "Bitcoin ges ut av ett decentraliserat nätverk, inte av en myndighet. Nätverket fungerar bara om användarna är överens om samma regler. Stablecoins ges ut av privata företag.",
      "Bitcoin is issued by a decentralised network, not by an authority. The network works only when users agree on the same rules. Stablecoins are issued by private companies.",
      "Bitcoin випускає децентралізована мережа, а не орган влади. Мережа працює лише тоді, коли користувачі дотримуються одних правил. Стейблкоїни випускають приватні компанії."
    ),
    "bankMap.moneyExplainer.row.issuer.cbdc": pack(
      "Centralbanken. En digital euro skulle ges ut och garanteras av Eurosystemet, alltså ECB och euroländernas centralbanker. En e-krona skulle ges ut av Riksbanken, om riksdagen beslutar att införa den.",
      "The central bank. A digital euro would be issued and guaranteed by the Eurosystem, meaning the ECB and the national central banks of the euro area. An e-krona would be issued by the Riksbank, if the Riksdag decides to introduce one.",
      "Центральний банк. Цифрове євро випускала б і гарантувала Євросистема, тобто ЄЦБ і національні центральні банки єврозони. Е-крону випускав би Риксбанк, якщо риксдаг вирішить її запровадити."
    ),
    "bankMap.moneyExplainer.row.issuer.src": pack(
      "Enligt ECB, 14 juli 2021 och 17 aug 2026 · Riksbanken, sidan uppdaterad 29 juni 2026",
      "According to the ECB, 14 July 2021 and 17 Aug 2026 · Riksbank, page updated 29 June 2026",
      "За ЄЦБ, 14 липня 2021 і 17 серпня 2026 · Риксбанк, сторінку оновлено 29 червня 2026"
    ),
    "bankMap.moneyExplainer.row.claim.aspect": pack(
      "Centralbankens skuld? Lagligt betalningsmedel?",
      "Central-bank liability? Legal tender?",
      "Борг центрального банку? Законний платіжний засіб?"
    ),
    "bankMap.moneyExplainer.row.claim.crypto": pack(
      "Nej. Ingen centralbank står bakom bitcoin. ECB skriver att bitcoin och andra kryptotillgångar inte är lagligt betalningsmedel.",
      "No. No central bank stands behind bitcoin. The ECB writes that bitcoin and other crypto-assets are not legal tender.",
      "Ні. За bitcoin не стоїть жоден центральний банк. ЄЦБ пише, що bitcoin та інші криптоактиви не є законним платіжним засобом."
    ),
    "bankMap.moneyExplainer.row.claim.cbdc": pack(
      "En digital euro skulle vara en direkt skuld för Eurosystemet och, enligt ECB, lagligt betalningsmedel som sedlar och mynt. En e-krona är inte beslutad. Om den införs skulle den vara centralbankspengar, alltså en fordran på Riksbanken.",
      "A digital euro would be a direct liability of the Eurosystem and, according to the ECB, legal tender like banknotes and coins. An e-krona has not been decided. If introduced, it would be central-bank money, meaning a claim on the Riksbank.",
      "Цифрове євро було б прямим зобов’язанням Євросистеми і, за ЄЦБ, законним платіжним засобом, як банкноти й монети. Рішення про е-крону немає. Якщо її запровадять, це будуть гроші центрального банку, тобто вимога до Риксбанку."
    ),
    "bankMap.moneyExplainer.row.claim.src": pack(
      "Enligt ECB, 17 aug 2026 · Riksbanken, tal 9 sep 2026",
      "According to the ECB, 17 Aug 2026 · Riksbank speech, 9 Sep 2026",
      "За ЄЦБ, 17 серпня 2026 · промова Риксбанку, 9 вересня 2026"
    ),
    "bankMap.moneyExplainer.row.value.aspect": pack("Värdestabilitet", "Stability of value", "Стабільність вартості"),
    "bankMap.moneyExplainer.row.value.crypto": pack(
      "Bitcoin är inte stabilt. Värdet har både rusat och fallit kraftigt på några dagar. En stablecoin är ett löfte från den privata utgivaren. Värdet beror på hur företaget sköter reserver och finanser, och är inte lika säkert som euron.",
      "Bitcoin is not stable. Its value has both jumped and fallen sharply within a few days. A stablecoin is a promise by the private issuer. Its value depends on how the company manages its reserves and finances, and is less certain than the euro.",
      "Bitcoin не є стабільним. Його вартість за кілька днів і різко зростала, і різко падала. Стейблкоїн — це обіцянка приватного емітента. Вартість залежить від того, як компанія тримає резерви й фінанси, і вона менш певна, ніж євро."
    ),
    "bankMap.moneyExplainer.row.value.cbdc": pack(
      "Enligt ECB ska en digital euro alltid vara värd en euro. Den skulle inte vara en annan valuta. En e-krona skulle vara svenska kronor utgivna av Riksbanken, ett komplement till kontanter.",
      "According to the ECB, one digital euro would always be worth one euro. It would not be a separate currency. An e-krona would be Swedish kronor issued by the Riksbank, a complement to cash.",
      "За ЄЦБ, одне цифрове євро завжди дорівнювало б одному євро. Це не була б інша валюта. Е-крона була б шведськими кронами, випущеними Риксбанком, як доповнення до готівки."
    ),
    "bankMap.moneyExplainer.row.value.src": pack(
      "Enligt ECB, 14 juli 2021 och 17 aug 2026 · Riksbanken, 29 juni 2026",
      "According to the ECB, 14 July 2021 and 17 Aug 2026 · Riksbank, 29 June 2026",
      "За ЄЦБ, 14 липня 2021 і 17 серпня 2026 · Риксбанк, 29 червня 2026"
    ),
    "bankMap.moneyExplainer.row.privacy.aspect": pack("Integritet", "Privacy", "Приватність"),
    "bankMap.moneyExplainer.row.privacy.crypto": pack(
      "Bitcoin är inte anonymt. Nätverket delar en offentlig liggare, blockkedjan, med varje transaktion. Transaktionerna skyddas med digitala signaturer kopplade till avsändaradresser.",
      "Bitcoin is not anonymous. The network shares a public ledger, the blockchain, containing every transaction. Transactions are protected by digital signatures corresponding to the sending addresses.",
      "Bitcoin не є анонімним. Мережа веде публічний реєстр, блокчейн, з кожною транзакцією. Транзакції захищені цифровими підписами, пов’язаними з адресами відправників."
    ),
    "bankMap.moneyExplainer.row.privacy.cbdc": pack(
      "Offline skulle den digitala euron ge kontantlik integritet: bara betalare och mottagare känner till de personliga uppgifterna. Penningtvättskontroll görs av betaltjänstleverantören när beloppet sätts in eller tas ut. Online kan Eurosystemet inte identifiera användare, men betaltjänstleverantören kan göra det för penningtvättsreglerna.",
      "Offline, a digital euro would offer cash-like privacy: only the payer and the payee would know the personal details. Anti-money-laundering checks would be done by the payment service provider when funds are added or withdrawn. Online, the Eurosystem would not be able to identify users, but the provider could do so for anti-money-laundering rules.",
      "Офлайн цифрове євро давало б приватність, близьку до готівки: особисті дані знали б лише платник і отримувач. Перевірку щодо відмивання коштів робив би надавач платіжних послуг під час зарахування чи зняття. Онлайн Євросистема не могла б ідентифікувати користувачів, але надавач міг би це робити за правилами проти відмивання коштів."
    ),
    "bankMap.moneyExplainer.row.privacy.src": pack(
      "Enligt bitcoin.org · ECB, 17 aug 2026",
      "According to bitcoin.org · ECB, 17 Aug 2026",
      "За bitcoin.org · ЄЦБ, 17 серпня 2026"
    ),
    "bankMap.moneyExplainer.row.approve.aspect": pack(
      "Vem godkänner transaktioner?",
      "Who confirms transactions?",
      "Хто підтверджує транзакції?"
    ),
    "bankMap.moneyExplainer.row.approve.crypto": pack(
      "Ett öppet nätverk via konsensus. En bekräftelse betyder att nätverket är överens om att bitcoin inte har skickats till någon annan. Nya block läggs till ungefär var tionde minut i genomsnitt.",
      "An open network, by consensus. A confirmation means the network agrees that the bitcoin has not been sent to someone else. New blocks are added about every ten minutes on average.",
      "Відкрита мережа через консенсус. Підтвердження означає, що мережа згодна: ці bitcoin не надіслані комусь іншому. Нові блоки додаються в середньому приблизно кожні десять хвилин."
    ),
    "bankMap.moneyExplainer.row.approve.cbdc": pack(
      "För den digitala euron skulle Eurosystemet avveckla och kontrollera innehav på en central plattform. ECB skriver att den inte bygger på blockkedja. E-kronapiloten testade däremot en annan teknisk miljö, och det finns inget beslut om teknik för en eventuell e-krona.",
      "For the digital euro, the Eurosystem would settle and verify holdings on a central platform. The ECB writes that it is not based on a blockchain. The e-krona pilot tested a different technical environment, and there is no decision on the technology of a possible e-krona.",
      "Для цифрового євро Євросистема здійснювала б розрахунки й перевірку залишків на центральній платформі. ЄЦБ пише, що вона не побудована на блокчейні. Пілот е-крони випробовував інше технічне середовище, і рішення про технологію можливої е-крони немає."
    ),
    "bankMap.moneyExplainer.row.approve.src": pack(
      "Enligt bitcoin.org · ECB, 17 aug 2026 · Riksbanken, etapp 4 2024",
      "According to bitcoin.org · ECB, 17 Aug 2026 · Riksbank, phase 4 2024",
      "За bitcoin.org · ЄЦБ, 17 серпня 2026 · Риксбанк, етап 4, 2024"
    ),
    "bankMap.moneyExplainer.row.offline.aspect": pack("Offline?", "Offline?", "Офлайн?"),
    "bankMap.moneyExplainer.row.offline.crypto": pack(
      "Ett meddelande om betalningen kan komma snabbt, men nätverket bekräftar den först när den tas in i ett block. Den som skickar behöver normalt nå nätverket.",
      "Notice of a payment can arrive quickly, but the network confirms it only when it is included in a block. The sender normally needs to reach the network.",
      "Сповіщення про платіж може прийти швидко, але мережа підтверджує його лише тоді, коли його включено в блок. Відправнику зазвичай потрібно достукатися до мережі."
    ),
    "bankMap.moneyExplainer.row.offline.cbdc": pack(
      "Den digitala euron planeras fungera offline, även utan nät. Riksbanken har testat offlinebetalningar med e-krona i pilotens etapp 4 (2024), i en testmiljö. I det testet låg de utgivna e-kronorna kvar online tills betalningsinstrumenten synkades. Det är inte en e-krona i drift.",
      "The digital euro is planned to work offline, including with no network. The Riksbank tested offline e-krona payments in phase 4 of the pilot (2024), in a test environment. In that test the issued e-krona stayed online until the payment instruments were synchronised. It is not a live e-krona.",
      "Цифрове євро планують зробити придатним для офлайну, навіть без мережі. Риксбанк випробував офлайн-платежі е-кроною на етапі 4 пілота (2024) у тестовому середовищі. У тому тесті випущені е-крони лишалися онлайн, доки платіжні інструменти не синхронізувалися. Це не діюча е-крона."
    ),
    "bankMap.moneyExplainer.row.offline.src": pack(
      "Enligt bitcoin.org · ECB, 17 aug 2026 · Riksbanken, 20 mars 2024",
      "According to bitcoin.org · ECB, 17 Aug 2026 · Riksbank, 20 March 2024",
      "За bitcoin.org · ЄЦБ, 17 серпня 2026 · Риксбанк, 20 березня 2024"
    ),
    "bankMap.moneyExplainer.row.program.aspect": pack("Programmerbarhet", "Programmability", "Програмованість"),
    "bankMap.moneyExplainer.row.program.crypto": pack(
      "Vissa nätverk har smarta kontrakt. På Ethereum är det program på blockkedjan som följer om-så-logik och körs när villkoren i koden är uppfyllda. Det gäller inte alla kryptonätverk.",
      "Some networks have smart contracts. On Ethereum they are programs on the blockchain that follow if-this-then-that logic and run when the conditions in the code are met. That is not a feature of every crypto network.",
      "Деякі мережі мають смартконтракти. В Ethereum це програми в блокчейні з логікою «якщо — то», які виконуються, коли умови в коді виконані. Так влаштована не кожна криптомережа."
    ),
    "bankMap.moneyExplainer.row.program.cbdc": pack(
      "Enligt ECB ska den digitala euron aldrig vara programmerbara pengar, alltså pengar med ett förutbestämt syfte och begränsningar för var, när eller med vem de får användas. Villkorade betalningar ska kunna underlättas, till exempel att betala när varan levererats.",
      "According to the ECB, the digital euro would never be programmable money, meaning money limited in advance as to where, when or with whom it can be used. It could still facilitate conditional payments, for example paying when goods are delivered.",
      "За ЄЦБ, цифрове євро ніколи не було б програмованими грошима, тобто грошима з наперед заданою метою і обмеженнями, де, коли і з ким їх можна використати. Натомість воно могло б підтримувати умовні платежі, наприклад оплату після доставки товару."
    ),
    "bankMap.moneyExplainer.row.program.src": pack(
      "Enligt ethereum.org, uppdaterad 1 juli 2026 · ECB, 17 aug 2026",
      "According to ethereum.org, updated 1 July 2026 · ECB, 17 Aug 2026",
      "За ethereum.org, оновлено 1 липня 2026 · ЄЦБ, 17 серпня 2026"
    ),
    "bankMap.moneyExplainer.row.same.aspect": pack("Likheter", "What they share", "Спільне"),
    "bankMap.moneyExplainer.row.same.both": pack(
      "Båda är digitala och används via en plånbok eller app. Hastigheten är inte densamma. Digitala eurobetalningar skulle vara omedelbara. En bitcoinbekräftelse väntar på ett block, och ECB beskriver bitcoinbetalningar som långsamma och dyra där de tas emot.",
      "Both are digital and are used through a wallet or app. Speed is not the same. Digital euro payments would be instant. A bitcoin confirmation waits for a block, and the ECB describes bitcoin payments as slow and expensive where they are accepted.",
      "Обидва варіанти цифрові і користуються гаманцем або застосунком. Швидкість не однакова. Платежі цифровим євро були б миттєвими. Підтвердження bitcoin чекає на блок, а ЄЦБ описує платежі bitcoin як повільні й дорогі там, де їх приймають."
    ),
    "bankMap.moneyExplainer.row.same.src": pack(
      "Enligt bitcoin.org · ECB, 14 juli 2021 och 17 aug 2026",
      "According to bitcoin.org · ECB, 14 July 2021 and 17 Aug 2026",
      "За bitcoin.org · ЄЦБ, 14 липня 2021 і 17 серпня 2026"
    ),
    "bankMap.moneyExplainer.statusEuroTitle": pack("Digital euro", "Digital euro", "Цифрове євро"),
    "bankMap.moneyExplainer.statusEuroBody": pack(
      "Den är inte utgiven. ECB:s direktion beslutar inte om utgivning förrän EU-förordningen är antagen. Efter rådets ståndpunkt den 19 december 2025 och parlamentets ståndpunkt den 9 juli 2026 pågår trepartsförhandlingar. ECB siktar på att vara redo för en möjlig första utgivning under 2029, om förordningen antas senast vid utgången av 2026. Piloten planeras starta andra halvåret 2027 och pågå i tolv månader.",
      "It has not been issued. The ECB Governing Council will not decide on issuance until the EU regulation is adopted. Trilogue negotiations are under way after the Council’s position of 19 December 2025 and Parliament’s position of 9 July 2026. The ECB aims to be ready for a possible first issuance during 2029 if the regulation is adopted by the end of 2026. The pilot is planned to start in the second half of 2027 and to run for twelve months.",
      "Його не випущено. Рада керівників ЄЦБ не ухвалюватиме рішення про випуск, доки не прийнято регламент ЄС. Трилог триває після позиції Ради від 19 грудня 2025 року і позиції Парламенту від 9 липня 2026 року. ЄЦБ прагне бути готовим до можливого першого випуску протягом 2029 року, якщо регламент приймуть до кінця 2026 року. Пілот планують почати в другій половині 2027 року і провести за дванадцять місяців."
    ),
    "bankMap.moneyExplainer.statusEuroSrc": pack(
      "Enligt ECB, FAQ uppdaterad 17 aug 2026",
      "According to the ECB, FAQ updated 17 Aug 2026",
      "За ЄЦБ, FAQ оновлено 17 серпня 2026"
    ),
    "bankMap.moneyExplainer.statusEkronaTitle": pack("E-krona", "E-krona", "Е-крона"),
    "bankMap.moneyExplainer.statusEkronaBody": pack(
      "Det tekniska e-kronaprojektet avslutades 2023. Om en e-krona ska införas är ett politiskt beslut. I Betalningsrapport 2026 föreslog Riksbanken att en utredning tillsätts om de lagändringar som skulle behövas, så att ett införande kan ske inom rimlig tid om riksdagen senare ger ett sådant uppdrag. Sidan uppdaterades den 29 juni 2026.",
      "The technical e-krona project ended in 2023. Introducing an e-krona is a political decision. In the Payments Report 2026 the Riksbank proposed that an inquiry be set up on the legislative changes that would be needed, so that an introduction could happen within a reasonable time if the Riksdag later gives that mandate. The page was updated on 29 June 2026.",
      "Технічний проєкт е-крони завершився 2023 року. Запровадження е-крони — політичне рішення. У Платіжному звіті 2026 Риксбанк запропонував призначити розслідування щодо потрібних змін у законі, щоб запровадження могло статися в розумний строк, якщо риксдаг пізніше дасть таке доручення. Сторінку оновлено 29 червня 2026 року."
    ),
    "bankMap.moneyExplainer.statusEkronaSrc": pack(
      "Enligt Riksbanken, sidan uppdaterad 29 juni 2026",
      "According to the Riksbank, page updated 29 June 2026",
      "За Риксбанком, сторінку оновлено 29 червня 2026"
    ),
    "bankMap.moneyExplainer.quizTitle": pack("Tre kontrollfrågor", "Three check questions", "Три перевіркові питання"),
    "bankMap.moneyExplainer.quizLead": pack(
      "Frågorna följer tabellen. Det finns inga poäng och ingen koppling till något annat på sidan.",
      "The questions follow the table. There is no score and no link to anything else on the page.",
      "Питання повторюють таблицю. Балів немає і зв’язку з іншим на сторінці немає."
    ),
    "bankMap.moneyExplainer.quizReset": pack("Rensa svar", "Clear answers", "Очистити відповіді"),
    "bankMap.moneyExplainer.quizCorrect": pack("Stämmer med källan ovan.", "This matches the source above.", "Це збігається з джерелом вище."),
    "bankMap.moneyExplainer.quizWrong": pack("Det är inte svaret i källan ovan.", "That is not the answer in the source above.", "Це не відповідь у джерелі вище."),
    "bankMap.moneyExplainer.q1": pack("Vem ger ut en CBDC?", "Who issues a CBDC?", "Хто випускає CBDC?"),
    "bankMap.moneyExplainer.q1a": pack("Ett decentraliserat nätverk", "A decentralised network", "Децентралізована мережа"),
    "bankMap.moneyExplainer.q1b": pack("Centralbanken", "The central bank", "Центральний банк"),
    "bankMap.moneyExplainer.q1c": pack("Ett privat företag", "A private company", "Приватна компанія"),
    "bankMap.moneyExplainer.q2": pack(
      "Vad håller en stablecoin kopplad till en valuta?",
      "What keeps a stablecoin tied to a currency?",
      "Що тримає стейблкоїн прив’язаним до валюти?"
    ),
    "bankMap.moneyExplainer.q2a": pack("En garanti från centralbanken", "A central-bank guarantee", "Гарантія центрального банку"),
    "bankMap.moneyExplainer.q2b": pack(
      "Den privata utgivaren och dess reserver",
      "The private issuer and its reserves",
      "Приватний емітент і його резерви"
    ),
    "bankMap.moneyExplainer.q2c": pack("Ett tak på 21 miljoner enheter", "A cap of 21 million units", "Стеля в 21 мільйон одиниць"),
    "bankMap.moneyExplainer.q3": pack(
      "Vad har krypto och en CBDC gemensamt i den här jämförelsen?",
      "What do crypto and a CBDC share in this comparison?",
      "Що в цьому порівнянні спільне для крипто і CBDC?"
    ),
    "bankMap.moneyExplainer.q3a": pack("Båda är lagligt betalningsmedel", "Both are legal tender", "Обидва є законним платіжним засобом"),
    "bankMap.moneyExplainer.q3b": pack(
      "Båda är en fordran på en affärsbank",
      "Both are a claim on a commercial bank",
      "Обидва є вимогою до комерційного банку"
    ),
    "bankMap.moneyExplainer.q3c": pack(
      "Båda är digitala och används via en plånbok eller app",
      "Both are digital and are used through a wallet or app",
      "Обидва цифрові і користуються гаманцем або застосунком"
    ),
    "bankMap.moneyExplainer.part2Title": pack(
      "Hur bankpengar skapas",
      "How bank money is created",
      "Як створюються банківські гроші"
    ),
    "bankMap.moneyExplainer.part2Lead": pack(
      "I läroböcker kallas upplägget ibland ett fraktionsreservsystem. Riksbankens beskrivning är en annan: inlåning skapas när banken ger lån, och ett kassakrav är inte det som styr utlåningen i Sverige.",
      "Textbooks sometimes call this a fractional-reserve system. The Riksbank’s account is different: deposits are created when a bank lends, and a cash-reserve ratio is not what steers lending in Sweden.",
      "У підручниках цю схему іноді називають системою часткових резервів. Опис Риксбанку інший: вклади виникають, коли банк видає кредит, і норма готівкових резервів не є тим, що керує кредитуванням у Швеції."
    ),
    "bankMap.moneyExplainer.part2.createTitle": pack("När banken ger ett lån", "When a bank makes a loan", "Коли банк видає кредит"),
    "bankMap.moneyExplainer.part2.createBody": pack(
      "Vice riksbankchef Anna Seim beskrev den 9 september 2026 att den största delen av de svenska kronorna skapas när en bank ger ett lån. Banken bokför lånet som en tillgång och sätter in samma belopp på kundens konto, som är bankens skuld. Saldot är en fordran på den banken, inte på Riksbanken. Kontanter är däremot en fordran på Riksbanken. När lånet amorteras minskar mängden bankpengar. Betalningar mellan banker görs med centralbankspengar på konton i RIX.",
      "On 9 September 2026 Deputy Governor Anna Seim described how most Swedish kronor are created when a bank makes a loan. The bank books the loan as an asset and credits the same amount to the customer’s account, which is the bank’s liability. That balance is a claim on that bank, not on the Riksbank. Cash, by contrast, is a claim on the Riksbank. When the loan is repaid, the amount of bank money falls. Payments between banks use central-bank money in accounts in RIX.",
      "9 вересня 2026 року заступниця голови Анна Сейм описала, що більша частина шведських крон виникає, коли банк видає кредит. Банк записує кредит як актив і зараховує ту саму суму на рахунок клієнта — це борг банку. Залишок є вимогою до цього банку, а не до Риксбанку. Готівка, навпаки, є вимогою до Риксбанку. Коли кредит погашають, обсяг банківських грошей зменшується. Платежі між банками йдуть грошима центрального банку на рахунках у RIX."
    ),
    "bankMap.moneyExplainer.part2.createSrc": pack(
      "Enligt Riksbanken, tal 9 sep 2026",
      "According to the Riksbank, speech 9 Sep 2026",
      "За Риксбанком, промова 9 вересня 2026"
    ),
    "bankMap.moneyExplainer.part2.reserveTitle": pack(
      "Kassakrav och räntefri inlåning",
      "Reserve requirements and interest-free deposits",
      "Резервні вимоги і безвідсоткові вклади"
    ),
    "bankMap.moneyExplainer.part2.reserveBody": pack(
      "I en ekonomisk kommentar den 11 juni 2020 skriver Riksbanken att kassakravet sattes till 0 procent 1994 och hade legat där sedan dess. Den texten beskriver kassakrav som en andel centralbankspengar mot inlåningen. Sedan 1 januari 2025 finns ett annat verktyg: räntefri inlåning, för Riksbankens självfinansiering när det egna kapitalet ligger under målnivån. Från 11 juni 2026 ska instituten hålla sammanlagt knappt 35 miljarder kronor, motsvarande 0,2944 procent av inlåningsbasen. Riksbanken anger syftet som självfinansiering, inte penningpolitik. I euroområdet, där Sverige inte ingår, beräknas ECB:s kassakrav som 1 procent av vissa skulder, främst inlåning och skuldebrev med löptid upp till två år. Koefficienten 1 procent gäller sedan uppfyllandeperioden som började 18 januari 2012. Förklaringen uppdaterades 8 november 2023.",
      "In an economic commentary of 11 June 2020 the Riksbank wrote that its cash-reserve requirement was set to 0 percent in 1994 and had stayed there. That text describes a cash-reserve ratio as a share of central-bank money against deposits. Since 1 January 2025 there is a different tool: interest-free deposits, for the Riksbank’s self-financing when its equity is below the target level. From 11 June 2026 institutions must hold just under 35 billion kronor in total, equal to 0.2944 percent of the deposit base. The Riksbank states the purpose as self-financing, not monetary policy. In the euro area, which does not include Sweden, the ECB calculates minimum reserves as 1 percent of specific liabilities, mainly deposits and debt securities with a maturity of up to two years. The 1 percent coefficient has applied since the maintenance period that began on 18 January 2012. The explainer was updated on 8 November 2023.",
      "В економічному коментарі від 11 червня 2020 року Риксбанк писав, що норму обов’язкових резервів встановили на 0 відсотків 1994 року і відтоді вона лишалася такою. Той текст описує норму як частку грошей центрального банку відносно вкладів. З 1 січня 2025 року є інший інструмент: безвідсоткові вклади для самофінансування Риксбанку, коли власний капітал нижчий за цільовий рівень. З 11 червня 2026 року установи мають тримати сукупно трохи менше ніж 35 мільярдів крон, що дорівнює 0,2944 відсотка бази вкладів. Риксбанк називає мету самофінансуванням, а не грошовою політикою. В єврозоні, до якої Швеція не входить, ЄЦБ рахує мінімальні резерви як 1 відсоток певних зобов’язань, насамперед вкладів і боргових паперів зі строком до двох років. Коефіцієнт 1 відсоток діє з періоду утримання, що почався 18 січня 2012 року. Пояснення оновлено 8 листопада 2023 року."
    ),
    "bankMap.moneyExplainer.part2.reserveSrc": pack(
      "Enligt Riksbanken, 11 juni 2020, 1 jan 2025 och 8 maj 2026 · ECB, 8 nov 2023 och koefficienttabellen",
      "According to the Riksbank, 11 June 2020, 1 Jan 2025 and 8 May 2026 · ECB, 8 Nov 2023 and the coefficient table",
      "За Риксбанком, 11 червня 2020, 1 січня 2025 і 8 травня 2026 · ЄЦБ, 8 листопада 2023 і таблиця коефіцієнтів"
    ),
    "bankMap.moneyExplainer.part2.rulesTitle": pack(
      "Kapital och likviditet",
      "Capital and liquidity",
      "Капітал і ліквідність"
    ),
    "bankMap.moneyExplainer.part2.rulesBody": pack(
      "Svenska banker begränsas av kapital- och likviditetsregler. De bygger på Baselkommitténs principer och finns i EU:s tillsynsförordning och kapitaltäckningsdirektiv samt i svensk lag och i Finansinspektionens föreskrifter. Finansinspektionen har tillsynen över svenska institut. Pelare 1-minimikravet är 8 procent av det riskvägda exponeringsbeloppet. Likviditetstäckningskvoten (LCR) ska vara minst 100 procent, så att institutet har likvida tillgångar för stressade nettoutflöden under 30 dagar. Kravet på stabil nettofinansiering (NSFR) är 100 procent i ett ettårsperspektiv och gäller sedan 2021. ECB:s kassakrav och ECB:s tillsyn av betydande banker gäller euroområdet, inte svenska banker.",
      "Swedish banks are constrained by capital and liquidity rules. They are based on the Basel Committee’s principles and are set out in the EU Capital Requirements Regulation and Capital Requirements Directive, in Swedish law and in Finansinspektionen’s regulations. Finansinspektionen supervises Swedish institutions. The Pillar 1 minimum is 8 percent of total risk-weighted exposure. The liquidity coverage ratio (LCR) must be at least 100 percent, so the institution has liquid assets for stressed net outflows over 30 days. The net stable funding ratio (NSFR) is 100 percent on a one-year view and has applied since 2021. The ECB’s minimum reserves and the ECB’s supervision of significant banks apply in the euro area, not to Swedish banks.",
      "Шведські банки обмежені правилами капіталу й ліквідності. Вони спираються на принципи Базельського комітету і викладені в регламенті та директиві ЄС про вимоги до капіталу, у шведському законі та в приписах Фінансової інспекції. Фінансова інспекція наглядає за шведськими установами. Мінімум першого стовпа — 8 відсотків загального обсягу зважених на ризик вимог. Коефіцієнт покриття ліквідності (LCR) має бути щонайменше 100 відсотків, щоб установа мала ліквідні активи на стресові чисті відпливи протягом 30 днів. Коефіцієнт чистого стабільного фінансування (NSFR) становить 100 відсотків у річному горизонті і діє з 2021 року. Мінімальні резерви ЄЦБ і нагляд ЄЦБ за значущими банками стосуються єврозони, а не шведських банків."
    ),
    "bankMap.moneyExplainer.part2.rulesSrc": pack(
      "Enligt Finansinspektionen, kapitalkrav och likviditet",
      "According to Finansinspektionen, capital requirements and liquidity",
      "За Фінансовою інспекцією, вимоги до капіталу і ліквідність"
    ),
    "bankMap.moneyExplainer.part2.contrastTitle": pack(
      "Tre olika anspråk",
      "Three different claims",
      "Три різні вимоги"
    ),
    "bankMap.moneyExplainer.part2.contrastBody": pack(
      "Bitcoin har ett tak i protokollet. Enligt bitcoin.org skapas högst 21 miljoner bitcoin, och nyutgivningen upphör där. ECB skrev 2019 att det maximala utbudet enligt protokollet nås 2140, och i maj 2025 att nya bitcoin kommer in i ett begränsat utbud som blockbelöning som ungefär halveras vart fjärde år. Ingen centralbank står bakom om värdet faller. Banker kan däremot låna av Riksbanken, som också kan erbjuda nödkredit vid likviditetsproblem. En CBDC skulle vara en direkt fordran på centralbanken. Bankpengar är en fordran på affärsbanken. Insättningsgarantin ersätter högst 1 150 000 kronor per person och institut. Beloppet gäller från 1 januari 2026 enligt Riksgäldens föreskrifter RGKFS 2025:2. Riksbanken angav samma belopp och avgränsning i talet den 9 september 2026. Garantin täcker inte ett saldo över den gränsen.",
      "Bitcoin has a cap in the protocol. According to bitcoin.org, at most 21 million bitcoin will be created, and new issuance stops there. In 2019 the ECB wrote that, in line with the protocol, the maximum supply would be reached in 2140, and in May 2025 that new bitcoin enter a limited supply as a block reward that is halved about every four years. No central bank stands behind the value if it falls. Banks, by contrast, can borrow from the Riksbank, which can also offer emergency credit if they have liquidity problems. A CBDC would be a direct claim on the central bank. Bank money is a claim on the commercial bank. The deposit guarantee covers at most 1,150,000 kronor per person and institution. The amount applies from 1 January 2026 under the Swedish National Debt Office regulation RGKFS 2025:2. The Riksbank stated the same amount and limit in the speech of 9 September 2026. The guarantee does not cover a balance above that limit.",
      "У протоколі Bitcoin є стеля. За bitcoin.org буде створено щонайбільше 21 мільйон bitcoin, і нова емісія там зупиняється. 2019 року ЄЦБ писав, що за протоколом максимальна пропозиція буде досягнута 2140 року, а в травні 2025 року — що нові bitcoin входять в обмежену пропозицію як винагорода за блок, яку приблизно вдвічі зменшують кожні чотири роки. Жоден центральний банк не стоїть за вартістю, якщо вона падає. Банки, навпаки, можуть позичати в Риксбанку, який також може дати надзвичайний кредит при проблемах з ліквідністю. CBDC була б прямою вимогою до центрального банку. Банківські гроші — це вимога до комерційного банку. Гарантія вкладів покриває щонайбільше 1 150 000 крон на особу й установу. Сума діє з 1 січня 2026 року за приписом Боргового управління Швеції RGKFS 2025:2. Риксбанк назвав ту саму суму і межу в промові 9 вересня 2026 року. Гарантія не покриває залишок понад цю межу."
    ),
    "bankMap.moneyExplainer.part2.contrastSrc": pack(
      "Enligt bitcoin.org · ECB, 2019 och maj 2025 · Riksbanken, 9 sep 2026 · Riksgälden, RGKFS 2025:2",
      "According to bitcoin.org · ECB, 2019 and May 2025 · Riksbank, 9 Sep 2026 · Swedish National Debt Office, RGKFS 2025:2",
      "За bitcoin.org · ЄЦБ, 2019 і травень 2025 · Риксбанк, 9 вересня 2026 · Боргове управління, RGKFS 2025:2"
    ),
    "bankMap.moneyExplainer.part3Title": pack(
      "Ett rapporterat exempel",
      "A reported example",
      "Повідомлений приклад"
    ),
    "bankMap.moneyExplainer.part3Body": pack(
      "Dagens.se publicerade den 24 september 2026 en artikel som hänvisar till den ryska ekonomitidningen RBK och exilmediet The Insider. Enligt artikeln har cirka 2,5 biljoner rubel i kontanter samlats utanför de ryska bankerna sedan januari, och Rysslands centralbank uppmanar banker att granska ursprunget till kunders kontantinsättningar. Artikeln återger att en företrädare för centralbanken pekade på grossist- och detaljhandelsmarknader och på det han kallade illegala kryptovalutabörser i Moskva som kanaler. Det här är en återgivning av vad tidningen rapporterar, inte en egen kontroll av de ryska uppgifterna.",
      "On 24 September 2026 Dagens.se published an article that cites the Russian business paper RBK and the exile outlet The Insider. According to the article, about 2.5 trillion rubles in cash have accumulated outside Russian banks since January, and Russia’s central bank is telling banks to examine the origin of customers’ cash deposits. The article reports that a central-bank official pointed to wholesale and retail markets and to what he called illegal crypto exchanges in Moscow as channels. This repeats what the paper reports. It is not an independent check of the Russian figures.",
      "24 вересня 2026 року Dagens.se опублікувала статтю з посиланням на російську економічну газету RBK і емігрантське видання The Insider. За статтею, від січня поза російськими банками накопичилося близько 2,5 трильйона рублів готівки, і центральний банк Росії закликає банки перевіряти походження готівкових внесків клієнтів. Стаття передає, що представник центрального банку вказав на оптові й роздрібні ринки і на те, що він назвав нелегальними криптобіржами в Москві, як на канали. Тут лише передано те, що повідомляє газета. Це не самостійна перевірка російських цифр."
    ),
    "bankMap.moneyExplainer.part3Src": pack(
      "Enligt Dagens.se, publicerad 24 sep 2026",
      "According to Dagens.se, published 24 Sep 2026",
      "За Dagens.se, опубліковано 24 вересня 2026"
    )
  };

  function currentLang() {
    var value = (document.documentElement.lang || "sv").toLowerCase();
    if (value.indexOf("uk") === 0 || value === "ua") return "uk";
    if (value.indexOf("en") === 0) return "en";
    return "sv";
  }

  function tx(lang, key) {
    var row = STR[key];
    if (!row) return key;
    return row[lang] || row.sv;
  }

  function el(tag, className, text) {
    var node = document.createElement(tag);
    if (className) node.className = className;
    if (text != null) node.textContent = text;
    return node;
  }

  function link(label, href) {
    var a = document.createElement("a");
    a.href = href;
    a.target = "_blank";
    a.rel = "noopener noreferrer";
    a.textContent = label;
    return a;
  }

  function hostLabel(href, seen) {
    var name = href;
    try {
      name = new URL(href).hostname.replace(/^www\./, "");
    } catch (error) {
      name = href;
    }
    var count = seen[name] || 0;
    seen[name] = count + 1;
    return count ? name + " (" + (count + 1) + ")" : name;
  }

  function sources(parent, label, hrefs) {
    var p = el("p", "bme-src");
    var seen = {};
    if (hrefs.length === 1) {
      p.append(link(label, hrefs[0]));
    } else {
      p.append(document.createTextNode(label));
      hrefs.forEach(function (href) {
        p.append(document.createTextNode(" "));
        p.append(link(hostLabel(href, seen), href));
      });
    }
    parent.append(p);
  }

  var answers = {};
  var host = null;
  var placing = false;

  function render(lang) {
    host.dataset.lang = lang;
    host.lang = lang === "uk" ? "uk" : lang;
    host.setAttribute("aria-labelledby", "bme-title");
    host.replaceChildren();

    host.append(el("p", "bme-eyebrow", tx(lang, "bankMap.moneyExplainer.eyebrow")));
    var title = el("h2", null, tx(lang, "bankMap.moneyExplainer.title"));
    title.id = "bme-title";
    host.append(title);
    host.append(el("p", "bme-lead", tx(lang, "bankMap.moneyExplainer.lead")));

    host.append(el("h3", null, tx(lang, "bankMap.moneyExplainer.part1Title")));
    host.append(el("p", null, tx(lang, "bankMap.moneyExplainer.part1Lead")));

    var wrap = el("div", "bme-table-wrap");
    var table = el("table", "bme-table");
    var caption = el("caption", null, tx(lang, "bankMap.moneyExplainer.tableCaption"));
    table.append(caption);
    var thead = document.createElement("thead");
    var headRow = document.createElement("tr");
    ["colAspect", "colCrypto", "colCbdc"].forEach(function (key) {
      var th = el("th", null, tx(lang, "bankMap.moneyExplainer." + key));
      th.scope = "col";
      headRow.append(th);
    });
    thead.append(headRow);
    table.append(thead);

    var body = document.createElement("tbody");
    var rows = [
      ["issuer", [SRC.ecbBitcoin, SRC.ecbFaq, SRC.rbEkrona], false],
      ["claim", [SRC.ecbFaq, SRC.rbSpeech], false],
      ["value", [SRC.ecbBitcoin, SRC.ecbFaq, SRC.rbEkrona], false],
      ["privacy", [SRC.bitcoinFaq, SRC.ecbFaq], false],
      ["approve", [SRC.bitcoinFaq, SRC.ecbFaq, SRC.rbOffline], false],
      ["offline", [SRC.bitcoinFaq, SRC.ecbFaq, SRC.rbOffline], false],
      ["program", [SRC.ethereumSc, SRC.ecbFaq], false],
      ["same", [SRC.bitcoinFaq, SRC.ecbBitcoin, SRC.ecbFaq], true]
    ];
    rows.forEach(function (spec) {
      var id = spec[0];
      var hrefs = spec[1];
      var shared = spec[2];
      var tr = document.createElement("tr");
      var th = el("th", null, tx(lang, "bankMap.moneyExplainer.row." + id + ".aspect"));
      th.scope = "row";
      tr.append(th);
      if (shared) {
        var td = el("td", "bme-span", tx(lang, "bankMap.moneyExplainer.row." + id + ".both"));
        td.colSpan = 2;
        tr.append(td);
      } else {
        ["crypto", "cbdc"].forEach(function (side) {
          tr.append(el("td", null, tx(lang, "bankMap.moneyExplainer.row." + id + "." + side)));
        });
      }
      body.append(tr);
      var sourceRow = document.createElement("tr");
      var sourceCell = el("td", "bme-span");
      sourceCell.colSpan = 3;
      sources(sourceCell, tx(lang, "bankMap.moneyExplainer.row." + id + ".src"), hrefs);
      sourceRow.append(sourceCell);
      body.append(sourceRow);
    });
    table.append(body);
    wrap.append(table);
    host.append(wrap);

    var status = el("div", "bme-status");
    var euro = el("article", "bme-card");
    euro.append(el("h3", null, tx(lang, "bankMap.moneyExplainer.statusEuroTitle")));
    euro.append(el("p", null, tx(lang, "bankMap.moneyExplainer.statusEuroBody")));
    sources(euro, tx(lang, "bankMap.moneyExplainer.statusEuroSrc"), [SRC.ecbFaq]);
    var krona = el("article", "bme-card");
    krona.append(el("h3", null, tx(lang, "bankMap.moneyExplainer.statusEkronaTitle")));
    krona.append(el("p", null, tx(lang, "bankMap.moneyExplainer.statusEkronaBody")));
    sources(krona, tx(lang, "bankMap.moneyExplainer.statusEkronaSrc"), [SRC.rbEkrona]);
    status.append(euro, krona);
    host.append(status);

    host.append(renderQuiz(lang));

    host.append(el("h3", null, tx(lang, "bankMap.moneyExplainer.part2Title")));
    host.append(el("p", null, tx(lang, "bankMap.moneyExplainer.part2Lead")));
    [
      ["create", [SRC.rbSpeech]],
      ["reserve", [SRC.rbKassakrav, SRC.rbInlaning, SRC.rbInlaningNews, SRC.ecbMrr, SRC.ecbMrrCalc]],
      ["rules", [SRC.fiCapital, SRC.fiLiquidity]],
      ["contrast", [SRC.bitcoinFaq, SRC.ecbBulletin, SRC.ecbFsr, SRC.rbSpeech, SRC.rgk]]
    ].forEach(function (block) {
      var key = block[0];
      var section = el("section", "bme-block");
      section.append(el("h4", null, tx(lang, "bankMap.moneyExplainer.part2." + key + "Title")));
      section.append(el("p", null, tx(lang, "bankMap.moneyExplainer.part2." + key + "Body")));
      sources(section, tx(lang, "bankMap.moneyExplainer.part2." + key + "Src"), block[1]);
      host.append(section);
    });

    var report = el("aside", "bme-report");
    report.append(el("h3", null, tx(lang, "bankMap.moneyExplainer.part3Title")));
    report.append(el("p", null, tx(lang, "bankMap.moneyExplainer.part3Body")));
    sources(report, tx(lang, "bankMap.moneyExplainer.part3Src"), [SRC.dagens]);
    host.append(report);
  }

  function renderQuiz(lang) {
    var box = el("section", "bme-quiz");
    box.append(el("h3", null, tx(lang, "bankMap.moneyExplainer.quizTitle")));
    box.append(el("p", null, tx(lang, "bankMap.moneyExplainer.quizLead")));
    var questions = [
      { id: "q1", correct: "b", options: ["a", "b", "c"] },
      { id: "q2", correct: "b", options: ["a", "b", "c"] },
      { id: "q3", correct: "c", options: ["a", "b", "c"] }
    ];
    questions.forEach(function (question, index) {
      var field = document.createElement("fieldset");
      var legend = document.createElement("legend");
      legend.textContent = index + 1 + ". " + tx(lang, "bankMap.moneyExplainer." + question.id);
      field.append(legend);
      question.options.forEach(function (option) {
        var label = el("label", "bme-option");
        var input = document.createElement("input");
        input.type = "radio";
        input.name = "bme-" + question.id;
        input.value = option;
        if (answers[question.id] === option) input.checked = true;
        input.addEventListener("change", function () {
          answers[question.id] = option;
          paintFeedback(field, lang, question, option);
        });
        label.append(input, document.createTextNode(tx(lang, "bankMap.moneyExplainer." + question.id + option)));
        field.append(label);
      });
      var feedback = el("p", "bme-feedback");
      feedback.setAttribute("aria-live", "polite");
      field.append(feedback);
      if (answers[question.id]) paintFeedback(field, lang, question, answers[question.id]);
      box.append(field);
    });
    var reset = el("button", "bme-reset", tx(lang, "bankMap.moneyExplainer.quizReset"));
    reset.type = "button";
    reset.addEventListener("click", function () {
      answers = {};
      render(lang);
    });
    box.append(reset);
    return box;
  }

  function paintFeedback(field, lang, question, option) {
    var feedback = field.querySelector(".bme-feedback");
    var correct = option === question.correct;
    feedback.className = "bme-feedback " + (correct ? "is-correct" : "is-wrong");
    feedback.textContent = tx(lang, correct ? "bankMap.moneyExplainer.quizCorrect" : "bankMap.moneyExplainer.quizWrong");
  }

  function ensure() {
    if (placing) return;
    placing = true;
    try {
      var disclaimer = document.querySelector(".bank-map-disclaimer");
      if (!disclaimer || !disclaimer.isConnected) {
        if (host && host.isConnected) host.remove();
        return;
      }
      if (!host) {
        host = document.createElement("section");
        host.id = HOST_ID;
        host.className = "bme";
      }
      if (disclaimer.nextElementSibling !== host) disclaimer.after(host);
      var lang = currentLang();
      if (host.dataset.lang !== lang || host.childElementCount === 0) render(lang);
    } finally {
      placing = false;
    }
  }

  var observer = new MutationObserver(function () {
    ensure();
  });

  function start() {
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["lang"],
      childList: true,
      subtree: true
    });
    ensure();
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", start);
  else start();
})();
