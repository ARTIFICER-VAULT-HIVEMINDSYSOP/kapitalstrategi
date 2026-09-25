/* Tre lägen · läge 1 NVDA Rider — Doom-style status-bar portrait (theme "rider").
 * Reads the Rider engine exposed as window.__trEngine (routes patch) and mounts a 72 px pixel portrait
 * in the bottom-left corner of the stage, next to the BUY/SELL bar. Practice only; no text. */
(function () {
  var cacheTrack = null, cacheCloses = null;
  function input() {
    var eng = window.__trEngine;
    if (!eng || !eng.track || !eng.track.points || !eng.track.points.length) return null;
    if (eng.track !== cacheTrack) {
      cacheTrack = eng.track;
      cacheCloses = eng.track.points.map(function (p) { return p.price; });
    }
    var h = eng.hudSnap();
    var started = h.playing || h.finished || h.crashed || Math.abs(h.pnl) > 1e-9;
    return {
      pnl: h.pnl,
      basis: 10 * cacheCloses[0],
      side: !started ? 'flat' : h.side === 'buy' ? 'long' : 'short',
      leverage: h.leverage,
      maxLeverage: 10,
      closes: cacheCloses,
      index: h.candleIndex,
      price: h.price,
      phase: h.finished || h.crashed ? 'done' : started ? 'ride' : 'idle',
    };
  }
  function mount() {
    if (!window.TRFace || document.getElementById('tr-face-rider')) return;
    var c = document.createElement('canvas');
    c.id = 'tr-face-rider';
    c.setAttribute('aria-hidden', 'true');
    c.style.cssText = 'position:fixed;left:16px;bottom:16px;z-index:30;pointer-events:none;border-radius:10px;' +
      'box-shadow:0 1px 0 rgba(28,25,21,.25),0 0 0 1px rgba(28,25,21,.18),0 6px 16px rgba(28,25,21,.18)';
    document.body.appendChild(c);
    var fit = function () { c.style.display = window.innerWidth < 900 ? 'none' : 'block'; };
    fit();
    window.addEventListener('resize', fit);
    window.TRFace.mountFace(c, 'rider', input, 72);
  }
  function later() { setTimeout(mount, 400); }
  if (document.readyState === 'complete') later(); else window.addEventListener('load', later);
})();
