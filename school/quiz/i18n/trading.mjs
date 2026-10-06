import { opt, row } from "./format.mjs";

const o = opt;
const r = row;

export const trading = {
  "intro-q1": r(
    "What is trading mainly about in this introduction?",
    "Про що насамперед ідеться в цьому вступі до трейдингу?",
    "Trading means price moves and timing. Long-term ownership is another style: the same market, a different risk.",
    "Трейдинг — це рух ціни і таймінг. Довгострокове володіння — інший стиль: той самий ринок, інший ризик.",
    {
      a: o("Always owning shares for many years", "Завжди володіти акціями багато років"),
      b: o("Getting a guaranteed savings rate", "Отримати гарантовану ставку на заощадження"),
      c: o("Avoiding all risk", "Уникати будь-якого ризику"),
      d: o(
        "Speculating on price moves, often without the same ownership as a long-term investment",
        "Спекулювати на русі ціни, часто без того самого володіння, що в довгостроковій інвестиції",
      ),
    },
  ),
  "intro-q2": r(
    "What does a short position mean, in broad terms?",
    "Що в загальних рисах означає коротка позиція?",
    "Short: you position for a falling price. The risk is still there, only in the other direction.",
    "Шорт: ти стаєш у позицію на падіння ціни. Ризик лишається, лише в іншому напрямку.",
    {
      a: o("You think the price will fall", "Ти вважаєш, що ціна впаде"),
      b: o("You think the price will rise", "Ти вважаєш, що ціна зросте"),
      c: o("You always get lower risk than a long position", "Ти завжди маєш нижчий ризик, ніж у довгій позиції"),
      d: o("The bank takes the loss", "Банк бере збиток на себе"),
    },
  ),
  "intro-q3": r(
    "What is the most important thing to remember about leverage?",
    "Що найважливіше пам’ятати про плече?",
    "Leverage means larger exposure. The example of 1,000 growing to 10,000 of exposure also raises the possible loss.",
    "Плече означає більшу експозицію. Приклад від 1 000 до 10 000 експозиції також збільшує можливий збиток.",
    {
      a: o("It removes the risk", "Воно прибирає ризик"),
      b: o("It always gives a 10× gain", "Воно завжди дає прибуток у 10 разів"),
      c: o("It is only needed for a savings account", "Воно потрібне лише для ощадного рахунку"),
      d: o(
        "It amplifies both gain and loss, and it needs a strategy and risk control",
        "Воно посилює і прибуток, і збиток, і потребує стратегії та контролю ризику",
      ),
    },
  ),
  "intro-q4": r(
    "When should you decide stop-loss and take-profit, according to the lesson?",
    "Коли, згідно з уроком, треба визначити stop-loss і take-profit?",
    "Plan before the trade. S/L and T/P reduce decisions made on emotion under pressure.",
    "План до угоди. S/L і T/P зменшують рішення, ухвалені на емоціях під тиском.",
    {
      a: o("In the middle of the trade, when it feels wrong", "Посеред угоди, коли стає не по собі"),
      b: o("Before you open, as a clear plan", "До відкриття, як чіткий план"),
      c: o("After the gain is already gone", "Після того, як прибуток уже зник"),
      d: o("Only if someone else tells you to", "Лише якщо хтось інший скаже тобі так зробити"),
    },
  ),
  "final-q1": r(
    "What does 1:10 leverage do with 10,000 kr of your own capital?",
    "Що робить плече 1:10 з 10 000 крон власного капіталу?",
    "Leverage 1:10 is like the throttle times 10: the position can be about 10 times your margin. The risk is amplified by the same amount.",
    "Плече 1:10 — як газ у 10 разів: позиція може бути приблизно в 10 разів більшою за маржу. Ризик посилюється так само.",
    {
      a: o("You are guaranteed a 10 percent gain", "Тобі гарантовано 10 відсотків прибутку"),
      b: o("Your risk disappears", "Твій ризик зникає"),
      c: o("You can open about 100,000 kr of position", "Ти можеш відкрити позицію приблизно на 100 000 крон"),
      d: o("Someone else takes the whole loss", "Хтось інший бере на себе весь збиток"),
    },
  ),
  "final-q2": r(
    "If the price moves −2 percent and you have 1:20 leverage, about how large is the effect on your capital (simplified)?",
    "Якщо ціна рухається на −2 відсотки і в тебе плече 1:20, яким приблизно є ефект на твій капітал (спрощено)?",
    "2 percent times 20 is 40 percent of your own capital, before fees. A high throttle without a belt is dangerous for a beginner.",
    "2 відсотки помножити на 20 — це 40 відсотків власного капіталу, до комісій. Високий газ без паска небезпечний для початківця.",
    {
      a: o("−2 percent", "−2 відсотки"),
      b: o("−40 percent", "−40 відсотків"),
      c: o("−10 percent", "−10 відсотків"),
      d: o("+20 percent", "+20 відсотків"),
    },
  ),
  "final-q3": r(
    "What is the main purpose of a stop-loss?",
    "Яка головна мета stop-loss?",
    "S/L is the seatbelt: you decide in advance when the trade is wrong and should be closed, not in the middle of panic.",
    "S/L — це пасок: ти заздалегідь вирішуєш, коли угода хибна і її треба закрити, а не посеред паніки.",
    {
      a: o("To maximise the gain", "Максимізувати прибуток"),
      b: o("To avoid every loss", "Уникнути будь-якого збитку"),
      c: o("To give you more signals", "Дати тобі більше сигналів"),
      d: o("To limit the loss according to a plan", "Обмежити збиток згідно з планом"),
    },
  ),
  "final-q4": r(
    "You buy at 100 and set a stop-loss at 98. What happens if the price reaches 98?",
    "Ти купуєш по 100 і ставиш stop-loss на 98. Що відбувається, якщо ціна досягає 98?",
    "S/L is an order that tries to close when the level is reached. In a fast market the fill can be at a worse price (slippage).",
    "S/L — це ордер, який намагається закрити позицію, коли рівень досягнуто. На швидкому ринку виконання може бути за гіршою ціною (прослизання).",
    {
      a: o("A sell order tries to close the position", "Ордер на продаж намагається закрити позицію"),
      b: o("The position doubles", "Позиція подвоюється"),
      c: o("Nothing, a stop-loss is only a reminder", "Нічого, stop-loss — це лише нагадування"),
      d: o("You have to call the bank yourself", "Тобі треба самому зателефонувати в банк"),
    },
  ),
  "final-q5": r(
    "What does risk/reward (R:R) measure?",
    "Що вимірює ризик/винагорода (R:R)?",
    "R:R is the helmet: compare the distance to T/P with the distance to S/L. 1:2 means twice the reward of the risk. Break-even then needs more than one hit in three (over 33 percent).",
    "R:R — це шолом: порівняй відстань до T/P з відстанню до S/L. 1:2 означає вдвічі більшу винагороду, ніж ризик. Для беззбитковості тоді потрібно більше ніж одна влучна угода з трьох (понад 33 відсотки).",
    {
      a: o("The relationship between planned gain and planned risk", "Співвідношення між запланованим прибутком і запланованим ризиком"),
      b: o("How fast a trade is", "Наскільки швидка угода"),
      c: o("The fee on the trade", "Комісію за угоду"),
      d: o("How many signals you have received", "Скільки сигналів ти отримав"),
    },
  ),
  "final-q6": r(
    "Buy at 100, S/L at 98, T/P at 104. What is R:R?",
    "Купівля по 100, S/L на 98, T/P на 104. Яке R:R?",
    "Risk is 2, gain is 4, 4/2 = 2, so R:R is 1:2. More than one hit in three (over 33 percent) breaks even if the plan holds.",
    "Ризик 2, прибуток 4, 4/2 = 2, отже R:R дорівнює 1:2. Більше ніж одна влучна угода з трьох (понад 33 відсотки) дає беззбитковість, якщо план тримається.",
    {
      a: o("1:1", "1:1"),
      b: o("1:2", "1:2"),
      c: o("1:3", "1:3"),
      d: o("3:1, more risk than gain", "3:1, ризику більше, ніж прибутку"),
    },
  ),
  "final-q7": r(
    "Which statement about trading signals is the most correct?",
    "Яке твердження про торгові сигнали найточніше?",
    "A signal does not replace the belt, the life vest and the helmet. Require S/L and T/P, understand the logic, and ignore a guaranteed gain.",
    "Сигнал не замінює пасок, рятувальний жилет і шолом. Вимагай S/L і T/P, зрозумій логіку і не зважай на гарантований прибуток.",
    {
      a: o("A good signal guarantees a gain", "Добрий сигнал гарантує прибуток"),
      b: o("A signal is a suggestion, and you still carry the risk", "Сигнал — це пропозиція, і ризик усе одно несеш ти"),
      c: o("Signals replace the need for a stop-loss", "Сигнали замінюють потребу в stop-loss"),
      d: o("Every paid signal is regulated and safe", "Кожен платний сигнал регульований і безпечний"),
    },
  ),
  "final-q8": r(
    "Which is a red-flag sign around trading tips?",
    "Що є червоним прапорцем навколо торгових порад?",
    "A guaranteed gain and pressure to deposit more are classic warning signs. Walk away.",
    "Гарантований прибуток і тиск внести більше — класичні попередження. Відійди.",
    {
      a: o("That they show both gains and losses", "Що вони показують і прибутки, і збитки"),
      b: o("That they explain risk and stop-loss", "Що вони пояснюють ризик і stop-loss"),
      c: o("That they recommend a plan with S/L and T/P first", "Що вони спочатку радять план із S/L і T/P"),
      d: o(
        "A guaranteed return, and pressure to deposit more before a withdrawal",
        "Гарантована дохідність і тиск внести більше перед виведенням",
      ),
    },
  ),
  "final-q9": r(
    "What does technical analysis mainly focus on?",
    "На чому насамперед зосереджений технічний аналіз?",
    "Technical asks when and where on the chart. Fundamental asks why, and whether it is expensive or cheap. No method removes risk.",
    "Технічний питає коли і де на графіку. Фундаментальний питає чому, і чи це дорого чи дешево. Жоден метод не прибирає ризик.",
    {
      a: o("Company profits and multiples", "Прибутки компанії і мультиплікатори"),
      b: o("Only central-bank minutes", "Лише протоколи центрального банку"),
      c: o("Price, charts, patterns and timing", "Ціна, графіки, візерунки і таймінг"),
      d: o("Tax rates in Sweden", "Податкові ставки у Швеції"),
    },
  ),
  "final-q10": r(
    "In an economic calendar, what does forecast often mean?",
    "В економічному календарі що часто означає forecast?",
    "Forecast is what the market expects. The reaction is often strongest when the actual figure differs from the forecast.",
    "Forecast — це те, чого чекає ринок. Реакція часто найсильніша, коли фактична цифра відрізняється від прогнозу.",
    {
      a: o("The figure analysts expected before the release", "Цифра, якої аналітики чекали до публікації"),
      b: o("The guaranteed outcome", "Гарантований результат"),
      c: o("Your personal take-profit", "Твій особистий take-profit"),
      d: o("The previous day's closing price", "Ціна закриття попереднього дня"),
    },
  ),
  "final-q11": r(
    "Why can it be wise to check the calendar before you open a trade?",
    "Чому розумно перевірити календар перед тим, як відкрити угоду?",
    "News can shake the price. Many people wait, and they already have S/L on if they already have a position.",
    "Новина може струснути ціну. Багато хто чекає, і S/L уже стоїть, якщо позиція вже відкрита.",
    {
      a: o("So you can skip the stop-loss entirely", "Щоб можна було зовсім обійтися без stop-loss"),
      b: o("Because scheduled news can increase volatility, spread and slippage", "Бо заплановані новини можуть збільшити волатильність, спред і прослизання"),
      c: o("Because the calendar guarantees the price direction", "Бо календар гарантує напрямок ціни"),
      d: o("Because leverage is switched off during news", "Бо плече вимикається під час новин"),
    },
  ),
};
