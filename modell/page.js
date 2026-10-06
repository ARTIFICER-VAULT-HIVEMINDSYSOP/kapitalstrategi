/* Language for the public model page. Shares ig.app.language with the app.
   SV · NO · EN · FR · UA. Missing text falls back: NO → SV, FR/UA → EN. */
(function () {
  var KEY = "ig.app.language";
  var LANGS = ["sv", "no", "en", "fr", "uk"];
  var CHAIN = { sv: ["sv", "en"], no: ["no", "sv", "en"], en: ["en", "sv"], fr: ["fr", "en", "sv"], uk: ["uk", "en", "sv"] };

  function valid(v) { return LANGS.indexOf(v) >= 0; }

  function read() {
    try {
      var value = JSON.parse(localStorage.getItem(KEY) || '"sv"');
      if (valid(value)) return value;
    } catch (e) {}
    return "sv";
  }

  function apply(lang) {
    document.documentElement.lang = lang === "no" ? "nb" : lang;
    var chain = CHAIN[lang] || CHAIN.sv;
    document.querySelectorAll("[data-sv]").forEach(function (el) {
      for (var i = 0; i < chain.length; i++) {
        var value = el.getAttribute("data-" + chain[i]);
        if (value != null) {
          if (el.tagName === "TITLE") document.title = value;
          el.textContent = value;
          return;
        }
      }
    });
    document.querySelectorAll(".lang-switcher-btn").forEach(function (btn) {
      var on = btn.getAttribute("data-lang") === lang;
      btn.classList.toggle("active", on);
      btn.setAttribute("aria-pressed", on ? "true" : "false");
    });
  }

  function persist(lang) {
    try {
      localStorage.setItem(KEY, JSON.stringify(lang));
    } catch (e) {}
  }

  function choose(lang) {
    if (window.KSLang) window.KSLang.set(lang);
    else persist(lang);
    apply(lang);
  }

  document.addEventListener("click", function (event) {
    var btn = event.target.closest(".lang-switcher-btn");
    if (!btn) return;
    var lang = btn.getAttribute("data-lang");
    if (!valid(lang)) return;
    choose(lang);
  });

  window.addEventListener("ks:lang-changed", function (e) {
    if (e && valid(e.detail)) apply(e.detail);
  });

  var query = new URLSearchParams(location.search).get("lang");
  if (valid(query)) {
    choose(query);
  } else {
    apply(read());
  }
})();
