/* Language for the public model page. Shares ig.app.language with the app. */
(function () {
  var KEY = "ig.app.language";

  function read() {
    try {
      var value = JSON.parse(localStorage.getItem(KEY) || '"sv"');
      if (value === "en" || value === "uk" || value === "sv") return value;
    } catch (e) {}
    return "sv";
  }

  function apply(lang) {
    document.documentElement.lang = lang === "uk" ? "uk" : lang;
    var attr = lang === "en" ? "data-en" : lang === "uk" ? "data-uk" : "data-sv";
    document.querySelectorAll("[data-sv]").forEach(function (el) {
      var value = el.getAttribute(attr) || el.getAttribute("data-sv");
      if (value != null) el.textContent = value;
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

  document.addEventListener("click", function (event) {
    var btn = event.target.closest(".lang-switcher-btn");
    if (!btn) return;
    var lang = btn.getAttribute("data-lang");
    if (lang !== "sv" && lang !== "en" && lang !== "uk") return;
    persist(lang);
    apply(lang);
  });

  var query = new URLSearchParams(location.search).get("lang");
  if (query === "sv" || query === "en" || query === "uk") {
    persist(query);
    apply(query);
  } else {
    apply(read());
  }
})();
