/* Adds a full-page link to /modell/ from the app nav and homepage. */
(function () {
  var HREF = "/modell/";
  var KEY = "ig.app.language";

  var copy = {
    sv: {
      nav: "Modellen",
      title: "Utbildning och struktur: Sköldfonden, tre rum, datacenter som mötesyta.",
      eyebrow: "För dig som överväger samarbete",
      heading: "Kapitalstrategi-modellen",
      body: "Utbildning och struktur för kapital i rörelse. Sköldfonden har tre rum och tre avräkningar — kassorna blandas inte. Datacenter är mötesytan där energi, resurs och kapitalallokering kompletterar varandra. Inte ett prospekt och inget löfte om avkastning.",
      cta: "Läs översikten"
    },
    en: {
      nav: "The model",
      title: "Education and structure: Sköldfonden, three rooms, the datacenter as meeting surface.",
      eyebrow: "If you are considering working with us",
      heading: "The Kapitalstrategi model",
      body: "Education and a structure for capital in motion. Sköldfonden has three rooms and three settlements — the cash pools are not mixed. The datacenter is the meeting surface where energy, resource, and capital allocation complement each other. Not a prospectus and not a promise of return.",
      cta: "Read the overview"
    },
    uk: {
      nav: "Модель",
      title: "Освіта і структура: Sköldfonden, три кімнати, датацентр як місце зустрічі.",
      eyebrow: "Якщо ви розглядаєте співпрацю",
      heading: "Модель Kapitalstrategi",
      body: "Освіта і структура для капіталу в русі. Sköldfonden — три кімнати і три розрахунки; каси не змішуються. Датацентр — місце зустрічі, де енергія, ресурс і розподіл капіталу доповнюють одне одного. Це не проспект і не обіцянка доходу.",
      cta: "Читати огляд"
    }
  };

  function lang() {
    try {
      var raw = localStorage.getItem(KEY);
      var value = raw ? JSON.parse(raw) : "sv";
      if (value === "en" || value === "uk" || value === "sv") return value;
    } catch (e) {}
    var pressed = document.querySelector(".lang-switcher-btn[aria-pressed='true']");
    var id = pressed && pressed.getAttribute("lang");
    if (id === "en" || id === "uk") return id;
    return "sv";
  }

  function textOf(node) {
    return (node && node.textContent || "").trim();
  }

  function ensureNav(t) {
    var nav = document.querySelector("nav.main-nav");
    if (!nav) return;
    var link = nav.querySelector("a.ks-modell-nav");
    if (!link) {
      link = document.createElement("a");
      link.className = "main-nav-link ks-modell-nav";
      link.href = HREF;
      var trad = null;
      var kids = nav.children;
      for (var i = 0; i < kids.length; i++) {
        var el = kids[i];
        if (el.tagName === "A" && el.getAttribute("href") === "/tradingskolan") trad = el;
      }
      if (trad) trad.after(link);
      else if (kids[0]) kids[0].after(link);
      else nav.appendChild(link);
    }
    if (textOf(link) !== t.nav) link.textContent = t.nav;
    link.title = t.title;
  }

  function ensureTeaser(t) {
    var home = document.querySelector(".home-page");
    if (!home) return;
    var sec = home.querySelector(".ks-modell-teaser");
    if (!sec) {
      sec = document.createElement("section");
      sec.className = "card ks-modell-teaser";
      sec.setAttribute("aria-labelledby", "ks-modell-teaser-title");
      var anchor = home.querySelector(".home-next, .home-onb-welcome");
      if (anchor) anchor.after(sec);
      else home.prepend(sec);
    }
    if (sec.getAttribute("data-lang") === document.documentElement.getAttribute("data-ks-modell-lang") && sec.querySelector("h2")) {
      return;
    }
    sec.setAttribute("data-lang", lang());
    sec.replaceChildren();
    var copyWrap = document.createElement("div");
    var eye = document.createElement("p");
    eye.className = "eyebrow";
    eye.textContent = t.eyebrow;
    var h = document.createElement("h2");
    h.id = "ks-modell-teaser-title";
    h.textContent = t.heading;
    var p = document.createElement("p");
    p.className = "muted";
    p.textContent = t.body;
    copyWrap.append(eye, h, p);
    var a = document.createElement("a");
    a.className = "btn primary";
    a.href = HREF;
    a.textContent = t.cta + " →";
    sec.append(copyWrap, a);
  }

  var scheduled = false;
  function paint() {
    scheduled = false;
    var t = copy[lang()] || copy.sv;
    document.documentElement.setAttribute("data-ks-modell-lang", lang());
    ensureNav(t);
    ensureTeaser(t);
  }

  function schedule() {
    if (scheduled) return;
    scheduled = true;
    requestAnimationFrame(paint);
  }

  var root = document.getElementById("root");
  if (root) new MutationObserver(schedule).observe(root, { childList: true, subtree: true });
  window.addEventListener("storage", schedule);
  schedule();
})();
