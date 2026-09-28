(function () {
  var titles = {
    sv: 'Tre övningar på historiska NVDA-kurser. Inga riktiga pengar.',
    en: 'Three practice modes on historical NVDA prices. No real money.',
    uk: 'Три тренування на історичних курсах NVDA. Без справжніх грошей.',
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
      var link = nav.querySelector('a[data-traderider-demo]')
      if (!link) {
        link = document.createElement('a')
        link.setAttribute('data-traderider-demo', '')
        link.className = 'main-nav-link'
        link.href = '/traderider/demo/'
        var more = nav.querySelector('.nav-more')
        if (more) nav.insertBefore(link, more)
        else nav.appendChild(link)
      }
      if (link.textContent !== 'Traderider') link.textContent = 'Traderider'
      var title = titles[lang()]
      if (link.title !== title) link.title = title
      var path = location.pathname
      var on = path === '/traderider/demo' || path.indexOf('/traderider/demo/') === 0
      if (link.classList.contains('active') !== on) link.classList.toggle('active', on)
    } finally {
      busy = false
    }
  }
  ensure()
  new MutationObserver(ensure).observe(document.documentElement, { childList: true, subtree: true })
})()
