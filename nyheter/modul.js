(function () {
  var key = "ig.app.theme";
  var btn = document.getElementById("ks-theme");
  if (!btn) return;

  function read() {
    var theme = document.documentElement.getAttribute("data-theme") === "light" ? "light" : "dark";
    try {
      var raw = localStorage.getItem(key);
      if (raw != null) {
        var saved = JSON.parse(raw);
        if (saved === "light" || saved === "dark") theme = saved;
      }
    } catch (e) {}
    return theme;
  }

  function apply(theme) {
    document.documentElement.setAttribute("data-theme", theme);
    var meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute("content", theme === "light" ? "#f4efe4" : "#0a1628");
    var lang = window.KSLang ? window.KSLang.get() : "sv";
    var labels = { sv: ["Ljust", "Mörkt"], no: ["Lyst", "Mørkt"], en: ["Light", "Dark"], fr: ["Light", "Dark"], uk: ["Light", "Dark"] };
    var pair = labels[lang] || labels.sv;
    btn.textContent = theme === "light" ? pair[1] : pair[0];
    btn.setAttribute("aria-pressed", theme === "light" ? "true" : "false");
    try {
      localStorage.setItem(key, JSON.stringify(theme));
    } catch (e) {}
  }

  apply(read());
  window.addEventListener("ks:lang-changed", function () {
    apply(read());
  });
  btn.addEventListener("click", function () {
    apply(read() === "light" ? "dark" : "light");
  });
})();
