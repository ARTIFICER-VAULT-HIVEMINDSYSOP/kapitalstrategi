/** Extra questions grounded only in the lesson that holds them. */

function q(id, helper, prompt, promptEn, promptUk, explanation, explanationEn, explanationUk, options) {
  return {
    id,
    helper,
    prompt,
    promptEn,
    promptUk,
    explanation,
    explanationEn,
    explanationUk,
    options,
  };
}

function opt(id, correct, text, textEn, textUk) {
  return { id, correct, text, textEn, textUk };
}

export const appended = [
  {
    kind: "needle",
    needle: "quiz:[As[0],As[1]]",
    questions: [
      q(
        "hav-extra-q1",
        "ks",
        "Anna och Bertil har båda 10 000 kr. Priset faller 5 procent. Vad säger lektionen om Anna med hävstång 1:2?",
        "Anna and Bertil each have 10,000 kr. The price falls 5 percent. What does the lesson say about Anna with 1:2 leverage?",
        "В Анни і Бертіля по 10 000 крон. Ціна падає на 5 відсотків. Що урок каже про Анну з плечем 1:2?",
        "Lektionen räknar Anna, hävstång 1:2 och pris minus 5 procent, till ungefär minus 10 procent. Samma pris ger Bertil med 1:20 en mycket större förlust.",
        "The lesson counts Anna, leverage 1:2 and a price fall of 5 percent, as about minus 10 percent. The same price gives Bertil at 1:20 a much larger loss.",
        "Урок рахує Анну з плечем 1:2 і падіння ціни на 5 відсотків як приблизно мінус 10 відсотків. Та сама ціна дає Бертілю з 1:20 значно більший збиток.",
        [
          opt("a", false, "Hon förlorar hela insatsen", "She loses the whole stake", "Вона втрачає всю ставку"),
          opt("b", false, "Hennes resultat är ungefär minus 5 procent", "Her result is about minus 5 percent", "Її результат приблизно мінус 5 відсотків"),
          opt("c", true, "Hennes resultat är ungefär minus 10 procent", "Her result is about minus 10 percent", "Її результат приблизно мінус 10 відсотків"),
          opt("d", false, "Hävstången tar bort förlusten", "Leverage removes the loss", "Плече прибирає збиток"),
        ],
      ),
    ],
  },
  {
    kind: "needle",
    needle: "quiz:[As[2],As[3]]",
    questions: [
      q(
        "sl-extra-q1",
        "ks",
        "Vad säger lektionen om gränsen för en stop-loss?",
        "What does the lesson say about the limit of a stop-loss?",
        "Що урок каже про межу stop-loss?",
        "Lektionen säger att priset kan gapa eller glida förbi nivån. Flytta inte S/L längre bort bara för att vänta.",
        "The lesson says the price can gap or slip past the level. Do not move S/L further away just to wait.",
        "Урок каже, що ціна може зробити геп або прослизнути повз рівень. Не відсувай S/L далі лише щоб почекати.",
        [
          opt(
            "a",
            true,
            "S/L tar inte bort all risk, priset kan gapa förbi nivån",
            "S/L does not remove all risk, the price can gap past the level",
            "S/L не прибирає весь ризик, ціна може зробити геп повз рівень",
          ),
          opt(
            "b",
            false,
            "S/L garanterar att ordern fylls exakt på nivån",
            "S/L guarantees the order fills exactly at the level",
            "S/L гарантує, що ордер виконається рівно на рівні",
          ),
          opt(
            "c",
            false,
            "S/L ska flyttas längre bort om du vill vänta",
            "S/L should be moved further away if you want to wait",
            "S/L треба відсунути далі, якщо хочеш почекати",
          ),
          opt("d", false, "S/L ersätter behovet av en plan", "S/L replaces the need for a plan", "S/L замінює потребу в плані"),
        ],
      ),
    ],
  },
  {
    kind: "needle",
    needle: "quiz:[As[4],As[5]]",
    questions: [
      q(
        "tp-extra-q1",
        "ks",
        "Ingången är 100 och T/P är 104. Vad säger lektionen om den nivån?",
        "Entry is 100 and T/P is 104. What does the lesson say about that level?",
        "Вхід 100, а T/P 104. Що урок каже про цей рівень?",
        "Exemplet är ingång 100 och T/P 104. Lektionen säger att T/P inte garanterar att priset når dit.",
        "The example is entry 100 and T/P 104. The lesson says T/P does not guarantee that the price gets there.",
        "Приклад — вхід 100 і T/P 104. Урок каже, що T/P не гарантує, що ціна туди дійде.",
        [
          opt("a", false, "Priset når alltid 104", "The price always reaches 104", "Ціна завжди доходить до 104"),
          opt("b", false, "T/P betyder att risken är noll", "T/P means the risk is zero", "T/P означає, що ризик нульовий"),
          opt("c", false, "R:R blir automatiskt 1:1", "R:R automatically becomes 1:1", "R:R автоматично стає 1:1"),
          opt(
            "d",
            true,
            "T/P garanterar inte att priset når nivån",
            "T/P does not guarantee that the price reaches the level",
            "T/P не гарантує, що ціна досягне рівня",
          ),
        ],
      ),
    ],
  },
  {
    kind: "needle",
    needle: "quiz:[As[6],As[7]]",
    questions: [
      q(
        "sig-extra-q1",
        "ks",
        "Vad är en signal utan S/L och T/P, enligt lektionen?",
        "What is a signal without S/L and T/P, according to the lesson?",
        "Чим є сигнал без S/L і T/P, згідно з уроком?",
        "Utan S/L och T/P är det inte en plan. Lektionen kallar det ett rop.",
        "Without S/L and T/P it is not a plan. The lesson calls it a shout.",
        "Без S/L і T/P це не план. Урок називає це вигуком.",
        [
          opt("a", false, "En färdig plan", "A finished plan", "Готовий план"),
          opt("b", true, "Ett rop, inte en plan", "A shout, not a plan", "Вигук, а не план"),
          opt("c", false, "Ett sätt att ta bort risken", "A way to remove the risk", "Спосіб прибрати ризик"),
          opt("d", false, "Samma sak som en stop-loss", "The same thing as a stop-loss", "Те саме, що stop-loss"),
        ],
      ),
    ],
  },
  {
    kind: "needle",
    needle: "quiz:[As[8]]",
    questions: [
      q(
        "an-extra-q1",
        "ks",
        "Vad frågar fundamental analys, enligt lektionen?",
        "What does fundamental analysis ask, according to the lesson?",
        "Про що питає фундаментальний аналіз, згідно з уроком?",
        "Fundamental frågar varför, och om det är dyrt eller billigt. Teknisk frågar när och var i grafen.",
        "Fundamental asks why, and whether it is expensive or cheap. Technical asks when and where on the chart.",
        "Фундаментальний питає чому, і чи це дорого чи дешево. Технічний питає коли і де на графіку.",
        [
          opt("a", false, "Endast när i grafen", "Only when on the chart", "Лише коли на графіку"),
          opt("b", false, "Endast vilken färg stapeln har", "Only what colour the bar has", "Лише якого кольору стовпчик"),
          opt(
            "c",
            true,
            "Varför, och om det är dyrt eller billigt",
            "Why, and whether it is expensive or cheap",
            "Чому, і чи це дорого чи дешево",
          ),
          opt("d", false, "Hur du stänger av S/L", "How you switch S/L off", "Як вимкнути S/L"),
        ],
      ),
      q(
        "an-extra-q2",
        "ks",
        "Vilket misstag beskriver lektionen?",
        "Which mistake does the lesson describe?",
        "Яку помилку описує урок?",
        "Tio indikatorer plus tio nyheter utan en klar idé är kaos. En tydlig idé och utrustningen är regeln.",
        "Ten indicators plus ten news items without a clear idea is chaos. A clear idea plus the kit is the rule.",
        "Десять індикаторів плюс десять новин без ясної ідеї — це хаос. Ясна ідея і спорядження — це правило.",
        [
          opt(
            "a",
            true,
            "Tio indikatorer och tio nyheter, men ingen klar idé",
            "Ten indicators and ten news items, but no clear idea",
            "Десять індикаторів і десять новин, але немає ясної ідеї",
          ),
          opt("b", false, "En tydlig idé plus S/L och T/P", "A clear idea plus S/L and T/P", "Ясна ідея плюс S/L і T/P"),
          opt("c", false, "Att räkna R:R innan du öppnar", "Calculating R:R before you open", "Порахувати R:R до відкриття"),
          opt("d", false, "Att hålla en liten position", "Keeping a small position", "Тримати малу позицію"),
        ],
      ),
    ],
  },
  {
    kind: "needle",
    needle: "quiz:[As[9],As[10]]",
    questions: [
      q(
        "kal-extra-q1",
        "ks",
        "Vad säger kalendern om prisets väg?",
        "What does the calendar say about the path of the price?",
        "Що календар каже про шлях ціни?",
        "Kalendern visar när viktiga siffror släpps. Den säger inte vilken väg priset tar.",
        "The calendar shows when important figures are released. It does not say which way the price goes.",
        "Календар показує, коли виходять важливі цифри. Він не каже, куди піде ціна.",
        [
          opt("a", false, "Den visar vilken väg priset tar", "It shows which way the price goes", "Він показує, куди піде ціна"),
          opt(
            "b",
            true,
            "Den visar när siffror släpps, inte vilken väg priset tar",
            "It shows when figures are released, not which way the price goes",
            "Він показує, коли виходять цифри, а не куди піде ціна",
          ),
          opt("c", false, "Den stänger av hävstången", "It switches leverage off", "Він вимикає плече"),
          opt("d", false, "Den ersätter S/L", "It replaces S/L", "Він замінює S/L"),
        ],
      ),
    ],
  },
  {
    kind: "module",
    moduleId: "eu-syd-01-bors",
    questions: [
      q(
        "eus1-extra-q1",
        "Cs",
        "Vad är PSI, enligt lektionen?",
        "What is PSI, according to the lesson?",
        "Що таке PSI, згідно з уроком?",
        "PSI är Lissabons inhemska lista. IBEX 35, CSE och SOFIX är de andra namnen i lektionen.",
        "PSI is Lisbon’s domestic list. IBEX 35, CSE and SOFIX are the other names in the lesson.",
        "PSI — це внутрішній список Лісабона. IBEX 35, CSE і SOFIX — інші назви в уроці.",
        [
          opt("a", false, "Sofias storbolag", "Sofia’s large companies", "Великі компанії Софії"),
          opt("b", false, "Cyperns börs", "The Cyprus exchange", "Біржа Кіпру"),
          opt("c", false, "Spaniens storbolagsindex", "Spain’s large-cap index", "Індекс великих компаній Іспанії"),
          opt("d", true, "Lissabons inhemska lista", "Lisbon’s domestic list", "Внутрішній список Лісабона"),
        ],
      ),
    ],
  },
  {
    kind: "module",
    moduleId: "eu-syd-02-bostad",
    questions: [
      q(
        "eus2-extra-q1",
        "Cs",
        "Vad säger ett lägre pris per kvadratmeter i Bulgarien eller inlands-Spanien om beläggning?",
        "What does a lower price per square metre in Bulgaria or inland Spain say about occupancy?",
        "Що нижча ціна за квадратний метр у Болгарії або внутрішній Іспанії каже про заповненість?",
        "Lägre pris per kvadratmeter säger inget om beläggning. Högt pris i Lissabon säger inte att visum följer med köpet.",
        "A lower price per square metre says nothing about occupancy. A high price in Lisbon does not mean a visa follows the purchase.",
        "Нижча ціна за квадратний метр нічого не каже про заповненість. Висока ціна в Лісабоні не означає, що віза йде разом із покупкою.",
        [
          opt("a", false, "Att beläggningen är hög", "That occupancy is high", "Що заповненість висока"),
          opt("b", false, "Att visum följer med köpet", "That a visa follows the purchase", "Що віза йде разом із покупкою"),
          opt("c", true, "Ingenting om beläggning", "Nothing about occupancy", "Нічого про заповненість"),
          opt(
            "d",
            false,
            "Att aktieindexet stiger samma dag",
            "That the equity index rises the same day",
            "Що індекс акцій зростає того самого дня",
          ),
        ],
      ),
    ],
  },
];
