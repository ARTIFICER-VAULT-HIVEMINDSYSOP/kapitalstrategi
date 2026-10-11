(function () {
  var key = "ig.app.theme";
  var btn = document.getElementById("kn-theme");
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
    btn.textContent = theme === "light" ? "Mörkt" : "Ljust";
    btn.setAttribute("aria-pressed", theme === "light" ? "true" : "false");
    try {
      localStorage.setItem(key, JSON.stringify(theme));
    } catch (e) {}
  }

  apply(read());
  btn.addEventListener("click", function () {
    apply(read() === "light" ? "dark" : "light");
  });
})();

(function () {
  var bar = document.querySelector(".kn-filters");
  if (!bar) return;
  var items = Array.prototype.slice.call(document.querySelectorAll(".kn-list > li"));
  bar.addEventListener("click", function (event) {
    var button = event.target.closest("button[data-filter]");
    if (!button || !bar.contains(button)) return;
    var filter = button.getAttribute("data-filter");
    Array.prototype.forEach.call(bar.querySelectorAll("button[data-filter]"), function (el) {
      el.setAttribute("aria-pressed", el === button ? "true" : "false");
    });
    items.forEach(function (item) {
      var show = filter === "alla" || item.getAttribute("data-kategori") === filter;
      item.hidden = !show;
    });
  });
})();
