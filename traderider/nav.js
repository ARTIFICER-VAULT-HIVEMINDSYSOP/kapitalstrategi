/* Link from the site nav to the Traderider entry page. */
(function () {
  var HREF = "/traderider/";

  function ensure() {
    var nav = document.querySelector("nav.main-nav");
    if (!nav) return;
    var link = nav.querySelector("a.ks-traderider-nav");
    if (!link) {
      link = document.createElement("a");
      link.className = "main-nav-link ks-traderider-nav";
      link.href = HREF;
      link.textContent = "Traderider";
      link.title = "Övning med simulerad data. Inga riktiga pengar, inga order, inget konto behövs.";
      var trade = nav.querySelector('a[href="/trade-rider"]');
      if (trade) trade.after(link);
      else nav.appendChild(link);
    }
  }

  var scheduled = false;
  function schedule() {
    if (scheduled) return;
    scheduled = true;
    requestAnimationFrame(function () {
      scheduled = false;
      ensure();
    });
  }

  var root = document.getElementById("root");
  if (root) new MutationObserver(schedule).observe(root, { childList: true, subtree: true });
  schedule();
})();
