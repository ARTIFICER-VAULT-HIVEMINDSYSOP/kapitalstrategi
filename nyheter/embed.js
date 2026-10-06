import {
  NEWS_QUIZ_KEY,
  awardNote,
  calendarDate,
  milestoneLine,
  newestQuizEdition,
  pickText,
  readState,
  reconcileStreak,
  recordCompletion,
  sectionOrder,
  shuffleOptions,
  streakLine,
  teaserKicker,
  teaserLine,
  writeState,
  AWARDS,
} from "../school/quiz/news-quiz.mjs";

(function () {
  var scheduled = false;
  var dataPromise = null;

  function pathName() {
    var path = location.pathname.replace(/\/+$/, "");
    return path || "/";
  }

  function isNews() {
    return pathName() === "/nyheter";
  }

  function lang() {
    try {
      var raw = localStorage.getItem("ig.app.language");
      if (raw != null) {
        var saved = JSON.parse(raw);
        if (saved === "sv" || saved === "en" || saved === "uk") return saved;
      }
    } catch (e) {}
    return "sv";
  }

  function tx(value) {
    if (value == null) return "";
    if (typeof value === "string") return value;
    return value[lang()] || value.sv || "";
  }

  function load() {
    if (!dataPromise) {
      dataPromise = fetch("/nyheter/data/editions.json", {
        credentials: "omit",
        headers: { Accept: "application/json" },
      }).then(function (response) {
        if (!response.ok) throw new Error("editions");
        return response.json();
      });
    }
    return dataPromise;
  }

  function tradeLinks() {
    return document.querySelectorAll(
      'a[data-traderider-demo], a[href="/trade-rider"], a[href^="/trade-rider/"], a[href^="/trade-rider?"], a[href="/traderider/demo"], a[href^="/traderider/demo/"], a[href^="/traderider/demo?"]'
    );
  }

  function syncTradeLinks() {
    var hide = isNews();
    tradeLinks().forEach(function (link) {
      var hidden = link.dataset.ksHidden === "1";
      if (hide && !hidden) {
        link.dataset.ksHidden = "1";
        link.setAttribute("hidden", "");
        link.setAttribute("aria-hidden", "true");
        link.tabIndex = -1;
        link.style.setProperty("display", "none", "important");
      } else if (!hide && hidden) {
        delete link.dataset.ksHidden;
        link.removeAttribute("hidden");
        link.removeAttribute("aria-hidden");
        link.removeAttribute("tabindex");
        link.style.removeProperty("display");
      }
    });
  }

  function fill(host, data) {
    host.replaceChildren();
    var editions = Array.isArray(data.editions) ? data.editions : [];
    editions.forEach(function (edition) {
      var block = document.createElement("div");
      block.className = "ks-edition-block";

      var brand = document.createElement("p");
      brand.className = "ks-edition-brand";
      brand.textContent = tx(data.brand) || "Kapital och Strategi";

      var title = document.createElement("h2");
      title.className = "ks-edition-title";
      title.textContent = "Nyhetsbrev · " + (tx(edition.dateLabel) || edition.date || "");

      var lead = document.createElement("p");
      lead.className = "ks-edition-lead";
      lead.textContent = tx(edition.lead);

      var noteText = tx(data.disclaimer);
      var note = null;
      if (noteText) {
        note = document.createElement("p");
        note.className = "ks-edition-note";
        note.textContent = noteText;
      }

      var grid = document.createElement("div");
      grid.className = "ks-mod-grid";
      (edition.modules || []).forEach(function (mod) {
        var card = document.createElement("a");
        card.className = "ks-mod-card";
        card.href = mod.href;

        var date = document.createElement("p");
        date.className = "ks-mod-date";
        date.textContent = tx(edition.dateLabel) || edition.date || "";

        var heading = document.createElement("h3");
        heading.textContent = tx(mod.title);

        if (mod.category) {
          var category = document.createElement("p");
          category.className = "ks-mod-cat";
          category.textContent = tx(mod.category);
          card.append(date, category, heading);
        } else {
          card.append(date, heading);
        }

        var ingress = document.createElement("p");
        ingress.className = "ks-mod-ingress";
        ingress.textContent = tx(mod.ingress);

        card.append(ingress);
        grid.append(card);
      });

      block.append(brand, title, lead);
      if (note) block.append(note);
      block.append(grid);
      var chosen = newestQuizEdition(editions);
      var order = sectionOrder(edition, chosen && chosen.date);
      if (order[order.length - 1] === "quiz") {
        block.append(mountQuiz(edition));
      }
      host.append(block);
    });
  }

  function t(value) {
    return pickText(value, lang());
  }

  function mountQuiz(edition) {
    var quiz = edition.quiz;
    var root = document.createElement("section");
    root.className = "card daily-news-quiz ks-news-quiz";
    root.id = "dagens-quiz";
    root.setAttribute("aria-labelledby", "ks-news-quiz-heading");
    root.dataset.edition = edition.date || "";

    var head = document.createElement("div");
    head.className = "dnq-head";
    var eyebrow = document.createElement("p");
    eyebrow.className = "eyebrow";
    eyebrow.style.margin = "0";
    var language = lang();
    eyebrow.textContent = language === "en" ? "Test yourself" : language === "uk" ? "Перевір себе" : "Testa dig";
    var heading = document.createElement("h3");
    heading.id = "ks-news-quiz-heading";
    var dateLabel = t(quiz.dateLabel) || t(edition.dateLabel) || edition.date || "";
    heading.textContent = (t(quiz.title) || "Nyhetsquiz") + " · " + dateLabel;
    var lead = document.createElement("p");
    lead.className = "muted dnq-lead";
    lead.textContent = t(quiz.lead);
    var date = document.createElement("p");
    date.className = "muted mono dnq-date";
    var today = calendarDate(new Date());
    date.textContent = edition.date === today
      ? dateLabel
      : (language === "en" ? "Edition " : language === "uk" ? "Випуск " : "Utgåva ") + dateLabel;
    head.append(eyebrow, heading, lead, date);

    var status = document.createElement("div");
    status.className = "ks-quiz-status";
    var play = document.createElement("div");
    root.append(head, status, play);

    var storage = window.localStorage;
    var view = reconcileStreak(readState(storage, NEWS_QUIZ_KEY), today);
    writeState(storage, view, NEWS_QUIZ_KEY);
    var finished = false;

    function paintStatus(score) {
      status.replaceChildren();
      var streak = document.createElement("p");
      streak.className = "ks-quiz-streak";
      streak.textContent = streakLine(view.streak, language);
      var next = document.createElement("p");
      next.className = "ks-quiz-next muted";
      next.textContent = milestoneLine(view.streak, language);
      status.append(streak, next);
      if (score) {
        var result = document.createElement("p");
        result.className = "ks-quiz-score";
        result.textContent = language === "en"
          ? "Score: " + score.correct + " of " + score.total
          : language === "uk"
            ? "Рахунок: " + score.correct + " з " + score.total
            : "Resultat: " + score.correct + " av " + score.total;
        status.insertBefore(result, streak);
      }
      if (view.unlocked.length) {
        var row = document.createElement("ul");
        row.className = "ks-quiz-badges";
        view.unlocked.forEach(function (id) {
          var award = Object.values(AWARDS).find(function (item) { return item.id === id; });
          if (!award) return;
          var item = document.createElement("li");
          item.textContent = pickText(award, language);
          row.append(item);
        });
        var note = document.createElement("p");
        note.className = "ks-quiz-award-note muted";
        note.textContent = awardNote(language);
        status.append(row, note);
      }
    }

    function showTeaser() {
      var box = document.createElement("div");
      box.className = "ks-quiz-teaser";
      var kicker = document.createElement("p");
      kicker.className = "ks-quiz-kicker";
      kicker.textContent = teaserKicker(language);
      var line = document.createElement("p");
      line.textContent = teaserLine(quiz, language);
      box.append(kicker, line);
      return box;
    }

    function run(round) {
      finished = false;
      paintStatus(null);
      var questions = (quiz.questions || []).map(function (question) {
        return {
          id: question.id,
          prompt: t(question.prompt),
          explanation: t(question.explanation),
          options: shuffleOptions(question.options || []).map(function (option) {
            return { id: option.id, text: t(option.text), correct: !!option.correct };
          }),
        };
      });
      var index = 0;
      var picked = null;
      var answers = {};

      function paintQuestion() {
        play.replaceChildren();
        var shell = document.createElement("div");
        shell.className = "ts-quiz";
        var quizHead = document.createElement("div");
        quizHead.className = "ts-quiz-head";
        var h4 = document.createElement("h4");
        h4.textContent = language === "en" ? "Quiz" : language === "uk" ? "Тест" : "Quiz";
        var step = document.createElement("span");
        step.className = "mono muted ts-quiz-step";
        step.textContent = language === "en"
          ? "Question " + (index + 1) + " of " + questions.length
          : language === "uk"
            ? "Питання " + (index + 1) + " з " + questions.length
            : "Fråga " + (index + 1) + " av " + questions.length;
        quizHead.append(h4, step);
        var hint = document.createElement("p");
        hint.className = "muted ts-quiz-hint";
        hint.textContent = language === "en"
          ? "One question at a time. Choose an answer and continue."
          : language === "uk"
            ? "По одному питанню. Обери відповідь і продовжуй."
            : "En fråga i taget. Välj svar och gå vidare.";
        var single = document.createElement("div");
        single.className = "ts-quiz-single";
        var bar = document.createElement("div");
        bar.className = "progress-bar ts-quiz-progress";
        bar.setAttribute("aria-hidden", "true");
        var fill = document.createElement("div");
        fill.className = "progress-fill";
        fill.style.width = (index / questions.length * 100) + "%";
        bar.append(fill);
        var current = questions[index];
        var prompt = document.createElement("p");
        prompt.className = "ts-quiz-prompt";
        prompt.textContent = (index + 1) + "/" + questions.length + ". " + current.prompt;
        var options = document.createElement("div");
        options.className = "ts-quiz-options";
        options.setAttribute("role", "radiogroup");
        current.options.forEach(function (option) {
          var label = document.createElement("label");
          label.className = "ts-quiz-option" + (picked === option.id ? " selected" : "");
          var input = document.createElement("input");
          input.type = "radio";
          input.name = current.id + "-" + round;
          input.value = option.id;
          input.checked = picked === option.id;
          input.addEventListener("change", function () {
            picked = option.id;
            paintQuestion();
          });
          var span = document.createElement("span");
          span.textContent = option.text;
          label.append(input, span);
          options.append(label);
        });
        var actions = document.createElement("div");
        actions.className = "form-actions";
        var button = document.createElement("button");
        button.type = "button";
        button.className = "btn primary";
        button.disabled = !picked;
        var last = index >= questions.length - 1;
        button.textContent = last
          ? (language === "en" ? "Answer and finish" : language === "uk" ? "Відповісти і завершити" : "Svara och avsluta")
          : (language === "en" ? "Answer" : language === "uk" ? "Відповісти" : "Svara");
        button.addEventListener("click", function () {
          if (!picked) return;
          answers[current.id] = picked;
          if (!last) {
            index += 1;
            picked = null;
            paintQuestion();
            return;
          }
          finish();
        });
        actions.append(button);
        single.append(bar, prompt, options, actions);
        shell.append(quizHead, hint, single);
        play.append(shell);
      }

      function finish() {
        finished = true;
        var correct = 0;
        questions.forEach(function (question) {
          var chosenId = answers[question.id];
          var option = question.options.find(function (item) { return item.id === chosenId; });
          if (option && option.correct) correct += 1;
        });
        var recorded = recordCompletion(view, today);
        view = recorded.state;
        writeState(storage, view, NEWS_QUIZ_KEY);
        paintStatus({ correct: correct, total: questions.length });
        play.replaceChildren();
        var shell = document.createElement("div");
        shell.className = "ts-quiz";
        var review = document.createElement("ul");
        review.className = "ts-quiz-review";
        questions.forEach(function (question, number) {
          var chosenId = answers[question.id];
          var chosen = question.options.find(function (item) { return item.id === chosenId; });
          var right = question.options.find(function (item) { return item.correct; });
          var ok = !!(chosen && chosen.correct);
          var item = document.createElement("li");
          item.className = "ts-quiz-review-item";
          var prompt = document.createElement("p");
          prompt.className = "ts-quiz-prompt";
          prompt.textContent = (number + 1) + ". " + question.prompt;
          var mark = document.createElement("p");
          mark.className = ok ? "pnl-pos" : "pnl-neg";
          mark.style.margin = "0";
          mark.textContent = ok
            ? (language === "en" ? "Correct" : language === "uk" ? "Правильно" : "Rätt")
            : (language === "en" ? "The card says: " : language === "uk" ? "Картка каже: " : "Kortet säger: ") + (right ? right.text : "");
          var explain = document.createElement("p");
          explain.className = "ts-quiz-explain muted";
          explain.textContent = question.explanation;
          item.append(prompt, mark, explain);
          review.append(item);
        });
        var actions = document.createElement("div");
        actions.className = "form-actions";
        var again = document.createElement("button");
        again.type = "button";
        again.className = "btn sm";
        again.textContent = language === "en" ? "Try again" : language === "uk" ? "Спробувати знову" : "Försök igen";
        again.addEventListener("click", function () { run(round + 1); });
        actions.append(again);
        shell.append(review, showTeaser(), actions);
        play.append(shell);
      }

      paintQuestion();
    }

    run(0);
    return root;
  }

  function mount() {
    syncTradeLinks();
    if (!isNews()) return;
    var page = document.querySelector(".news-page");
    if (!page) return;
    var host = page.querySelector(".ks-edition-modules");
    if (!host) {
      host = document.createElement("section");
      host.className = "ks-edition-modules";
      host.setAttribute("aria-label", "Nyhetsbrev som moduler");
      page.insertBefore(host, page.firstChild);
    }
    if (host.dataset.ready === "1" || host.dataset.ready === "pending") return;
    host.dataset.ready = "pending";
    load()
      .then(function (data) {
        if (!document.body.contains(host)) return;
        fill(host, data);
        host.dataset.ready = "1";
        if (location.hash === "#ipo-cal-heading") scrollToCalendar();
      })
      .catch(function () {
        host.dataset.ready = "";
      });
  }

  function scrollToCalendar() {
    var tries = 0;
    var timer = window.setInterval(function () {
      var target = document.getElementById("ipo-cal-heading");
      if (target) {
        target.scrollIntoView({ block: "start" });
        window.clearInterval(timer);
      } else if (++tries > 40) {
        window.clearInterval(timer);
      }
    }, 150);
  }

  function schedule() {
    if (scheduled) return;
    scheduled = true;
    window.requestAnimationFrame(function () {
      scheduled = false;
      mount();
    });
  }

  schedule();
  window.addEventListener("popstate", schedule);
  window.addEventListener("hashchange", function () {
    if (location.hash === "#ipo-cal-heading") scrollToCalendar();
  });
  new MutationObserver(schedule).observe(document.documentElement, {
    childList: true,
    subtree: true,
  });
})();
