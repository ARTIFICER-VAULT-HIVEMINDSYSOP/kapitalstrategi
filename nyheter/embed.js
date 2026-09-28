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

      var note = document.createElement("p");
      note.className = "ks-edition-note";
      note.textContent = tx(data.disclaimer);

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

      block.append(brand, title, lead, note, grid);
      host.append(block);
    });
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
