/* Språkväxel för hela sajten: SV · NO · EN · FR · UA.
   Delar nyckeln ig.app.language med appen. Fast knappgrupp i hörnet på varje sida. */
(function () {
  if (window.KSLang) return;
  var KEY = "ig.app.language";
  var NOTICE_KEY = "ig.ks.sprakvaxel.notis";
  var LANGS = [
    { id: "sv", label: "SV", name: "Svenska", html: "sv" },
    { id: "no", label: "NO", name: "Norsk (bokmål)", html: "nb" },
    { id: "en", label: "EN", name: "English", html: "en" },
    { id: "fr", label: "FR", name: "Français", html: "fr" },
    { id: "uk", label: "UA", name: "Українська", html: "uk" }
  ];
  var IDS = LANGS.map(function (l) { return l.id; });
  /* Om en text saknas på ett språk används närmaste: norska → svenska, franska/ukrainska → engelska. */
  var FALLBACK = { sv: ["sv", "en"], no: ["no", "sv", "en"], en: ["en", "sv"], fr: ["fr", "en", "sv"], uk: ["uk", "en", "sv"] };

  var NOTICE = {
    sv: "Med anledning av vårt möjliga samarbete med PrimeVerse har vi lagt till språkväxel på hela sajten – svenska, norska, engelska, franska och ukrainska.",
    no: "I forbindelse med vårt mulige samarbeid med PrimeVerse har vi lagt til språkvelger på hele nettstedet – svensk, norsk, engelsk, fransk og ukrainsk.",
    en: "In view of our possible collaboration with PrimeVerse, we have added a language switcher across the whole site – Swedish, Norwegian, English, French and Ukrainian.",
    fr: "En vue de notre possible collaboration avec PrimeVerse, nous avons ajouté un sélecteur de langue sur l’ensemble du site – suédois, norvégien, anglais, français et ukrainien.",
    uk: "У зв’язку з нашою можливою співпрацею з PrimeVerse ми додали перемикач мов на всьому сайті – шведська, норвезька, англійська, французька та українська."
  };
  var UI = {
    sv: { group: "Språk", close: "Stäng", eyebrow: "Språk" },
    no: { group: "Språk", close: "Lukk", eyebrow: "Språk" },
    en: { group: "Language", close: "Close", eyebrow: "Language" },
    fr: { group: "Langue", close: "Fermer", eyebrow: "Langue" },
    uk: { group: "Мова", close: "Закрити", eyebrow: "Мова" }
  };

  function valid(v) { return IDS.indexOf(v) >= 0; }
  function meta(id) { for (var i = 0; i < LANGS.length; i++) if (LANGS[i].id === id) return LANGS[i]; return LANGS[0]; }

  function read() {
    try {
      var raw = localStorage.getItem(KEY);
      if (raw != null) {
        var v = JSON.parse(raw);
        if (valid(v)) return v;
      }
    } catch (e) {}
    return "sv";
  }

  function write(lang) {
    try { localStorage.setItem(KEY, JSON.stringify(lang)); } catch (e) {}
    /* Traderider-spelet har en egen nyckel med SV/EN/UA. */
    try { localStorage.setItem("app.language", lang === "no" ? "sv" : lang === "fr" ? "en" : lang); } catch (e) {}
  }

  function pick(el, lang) {
    var chain = FALLBACK[lang] || FALLBACK.sv;
    for (var i = 0; i < chain.length; i++) {
      var v = el.getAttribute("data-" + chain[i]);
      if (v != null) return v;
    }
    return null;
  }

  /* Statiska sidor: element med data-sv / data-no / data-en / data-fr / data-uk. */
  function applyAttrs(lang) {
    var nodes = document.querySelectorAll("[data-sv]");
    for (var i = 0; i < nodes.length; i++) {
      var el = nodes[i];
      if (el.closest && el.closest("#root")) continue;
      var v = pick(el, lang);
      if (v == null) continue;
      if (el.tagName === "META") el.setAttribute("content", v);
      else if (el.tagName === "TITLE") { el.textContent = v; document.title = v; }
      else el.textContent = v;
    }
    var attrs = document.querySelectorAll("[data-sv-aria]");
    for (var j = 0; j < attrs.length; j++) {
      var a = attrs[j];
      var chain = FALLBACK[lang] || FALLBACK.sv;
      for (var k = 0; k < chain.length; k++) {
        var val = a.getAttribute("data-" + chain[k] + "-aria");
        if (val != null) { a.setAttribute("aria-label", val); break; }
      }
    }
  }

  var current = read();
  var listeners = [];
  var box = null;
  var notice = null;

  function applyHtml(lang) {
    document.documentElement.lang = meta(lang).html;
    document.documentElement.setAttribute("data-ks-lang", lang);
  }
  applyHtml(current);

  function paintBox() {
    if (!box) return;
    box.setAttribute("aria-label", (UI[current] || UI.sv).group);
    var btns = box.querySelectorAll("button[data-ks-lang]");
    for (var i = 0; i < btns.length; i++) {
      var on = btns[i].getAttribute("data-ks-lang") === current;
      btns[i].classList.toggle("is-active", on);
      btns[i].setAttribute("aria-pressed", on ? "true" : "false");
    }
  }

  function paintNotice() {
    if (notice) {
      notice.querySelector(".ks-sprak-notis-text").textContent = NOTICE[current] || NOTICE.sv;
      var c = notice.querySelector(".ks-sprak-notis-close");
      c.setAttribute("aria-label", (UI[current] || UI.sv).close);
      c.title = (UI[current] || UI.sv).close;
    }
    var lines = document.querySelectorAll(".ks-sprak-rad");
    for (var i = 0; i < lines.length; i++) lines[i].textContent = NOTICE[current] || NOTICE.sv;
  }

  function set(lang, opts) {
    if (!valid(lang)) return;
    var changed = lang !== current;
    current = lang;
    write(lang);
    applyHtml(lang);
    applyAttrs(lang);
    paintBox();
    paintNotice();
    if (!(opts && opts.fromApp)) {
      /* Appen (React) lyssnar på detta och byter språk utan omladdning. */
      window.dispatchEvent(new CustomEvent("ks:set-lang", { detail: lang }));
      if (typeof window.__trSetLang === "function") {
        try { window.__trSetLang(lang === "no" ? "sv" : lang === "fr" ? "en" : lang); } catch (e) {}
      }
    }
    for (var i = 0; i < listeners.length; i++) { try { listeners[i](lang); } catch (e) {} }
    if (changed) window.dispatchEvent(new CustomEvent("ks:lang-changed", { detail: lang }));
  }

  window.KSLang = {
    langs: IDS.slice(),
    get: function () { return current; },
    set: set,
    on: function (fn) { listeners.push(fn); },
    notice: function (lang) { return NOTICE[lang] || NOTICE.sv; }
  };

  /* Appen meddelar när användaren byter språk i sidhuvudet. */
  window.addEventListener("ks:app-lang", function (e) {
    if (e && valid(e.detail) && e.detail !== current) set(e.detail, { fromApp: true });
  });
  window.addEventListener("storage", function (e) {
    if (e.key === KEY) { var v = read(); if (v !== current) set(v, { fromApp: true }); }
  });

  function buildBox() {
    box = document.createElement("div");
    box.className = "ks-sprakvaxel";
    box.setAttribute("role", "group");
    box.setAttribute("data-ks-sprakvaxel", "");
    LANGS.forEach(function (l) {
      var b = document.createElement("button");
      b.type = "button";
      b.setAttribute("data-ks-lang", l.id);
      b.setAttribute("lang", l.html);
      b.title = l.name;
      b.textContent = l.label;
      b.addEventListener("click", function () { set(l.id); });
      box.appendChild(b);
    });
    document.body.appendChild(box);
    paintBox();
  }

  function dismissed() {
    try { return localStorage.getItem(NOTICE_KEY) === "1"; } catch (e) { return false; }
  }

  function buildNotice() {
    if (dismissed()) return;
    notice = document.createElement("div");
    notice.className = "ks-sprak-notis";
    notice.setAttribute("role", "status");
    var p = document.createElement("p");
    p.className = "ks-sprak-notis-text";
    var c = document.createElement("button");
    c.type = "button";
    c.className = "ks-sprak-notis-close";
    c.textContent = "×";
    c.addEventListener("click", function () {
      try { localStorage.setItem(NOTICE_KEY, "1"); } catch (e) {}
      if (notice && notice.parentNode) notice.parentNode.removeChild(notice);
      notice = null;
      document.documentElement.classList.remove("ks-sprak-notis-open");
    });
    notice.appendChild(p);
    notice.appendChild(c);
    document.body.appendChild(notice);
    document.documentElement.classList.add("ks-sprak-notis-open");
    paintNotice();
  }

  /* En rad på startsidan (appens .home-page) om varför språkväxeln finns. */
  function ensureHomeLine() {
    var home = document.querySelector("#root .home-page");
    if (!home) return;
    var line = home.querySelector(".ks-sprak-rad");
    if (!line) {
      line = document.createElement("p");
      line.className = "ks-sprak-rad";
      home.appendChild(line);
    }
    var want = NOTICE[current] || NOTICE.sv;
    if (line.textContent !== want) line.textContent = want;
  }

  function hideWhenHeaderSwitcherVisible() {
    if (!("IntersectionObserver" in window)) return;
    var watched = null;
    var io = new IntersectionObserver(function (entries) {
      var vis = entries.some(function (e) { return e.isIntersecting; });
      document.documentElement.classList.toggle("ks-sprakvaxel-header-synlig", vis);
    });
    function hook() {
      var el = document.querySelector(".header-actions .lang-switcher, .standalone-news-header-actions .lang-switcher, .header-tools .lang-switcher");
      if (el === watched) return;
      if (watched) io.unobserve(watched);
      watched = el;
      if (el) io.observe(el);
      else document.documentElement.classList.remove("ks-sprakvaxel-header-synlig");
    }
    hook();
    var root = document.getElementById("root");
    if (root) {
      var pending = false;
      new MutationObserver(function () {
        if (pending) return;
        pending = true;
        requestAnimationFrame(function () { pending = false; hook(); ensureHomeLine(); });
      }).observe(root, { childList: true, subtree: true });
    }
  }

  function isGame() { return /^\/traderider\/(spel|app)\//.test(location.pathname); }

  /* Andra språkknappar på sidan (appens sidhuvud, modellsidan, Traderider) håller växeln i synk. */
  document.addEventListener("click", function (e) {
    var btn = e.target && e.target.closest ? e.target.closest(".lang-switcher-btn[data-lang]") : null;
    if (!btn || (box && box.contains(btn))) return;
    var v = btn.getAttribute("data-lang");
    if (valid(v) && v !== current) set(v, { fromApp: true });
  }, true);

  function boot() {
    if (!isGame()) {
      document.documentElement.classList.add("ks-sprak-pad");
      try {
        var mapped = current === "no" ? "sv" : current === "fr" ? "en" : current;
        if (localStorage.getItem("app.language") !== mapped) localStorage.setItem("app.language", mapped);
      } catch (e) {}
    }
    applyAttrs(current);
    buildBox();
    buildNotice();
    ensureHomeLine();
    hideWhenHeaderSwitcherVisible();
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
  else boot();
})();
