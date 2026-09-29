(function () {
  var titles = {
    sv: 'Traderider: NVDA Rider – övning på historiska NVDA-kurser. Inga riktiga pengar.',
    en: 'Traderider: NVDA Rider – practice on historical NVDA prices. No real money.',
    uk: 'Traderider: NVDA Rider – тренування на історичних курсах NVDA. Без справжніх грошей.',
  }
  function lang() {
    try {
      var value = localStorage.getItem('app.language')
      if (value === 'en' || value === 'uk' || value === 'sv') return value
    } catch (e) {}
    return 'sv'
  }
  var busy = false
  function ensure() {
    if (busy) return
    busy = true
    try {
      var nav = document.querySelector('nav.main-nav')
      if (!nav) return
      // En enda Traderider-post: den gamla «Trade Rider» (/trade-rider) döljs i huvudmenyn och
      // «Traderider» tar dess plats och leder till ingången /traderider/ (tills vidare bara NVDA Rider).
      var old = nav.querySelector('a.main-nav-link[href="/trade-rider"]')
      if (old && old.style.display !== 'none') {
        // .main-nav-link sätter display:inline-flex, så hidden-attributet räcker inte
        old.hidden = true
        old.style.setProperty('display', 'none', 'important')
        old.setAttribute('aria-hidden', 'true')
        old.tabIndex = -1
      }
      var link = nav.querySelector('a[data-traderider-demo]')
      if (!link) {
        link = document.createElement('a')
        link.setAttribute('data-traderider-demo', '')
        link.className = 'main-nav-link'
        if (old) nav.insertBefore(link, old)
        else {
          var more = nav.querySelector('.nav-more')
          if (more) nav.insertBefore(link, more)
          else nav.appendChild(link)
        }
      }
      if (link.getAttribute('href') !== '/traderider/') link.href = '/traderider/'
      if (link.textContent !== 'Traderider') link.textContent = 'Traderider'
      var title = titles[lang()]
      if (link.title !== title) link.title = title
      var path = location.pathname
      var on = path === '/traderider' || path.indexOf('/traderider/') === 0 || path.indexOf('/trade-rider') === 0
      if (link.classList.contains('active') !== on) link.classList.toggle('active', on)
    } finally {
      busy = false
    }
  }
  ensure()
  new MutationObserver(ensure).observe(document.documentElement, { childList: true, subtree: true })
})()
