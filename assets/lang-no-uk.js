/* Ukrainska (uk/UA) är borttagen som val i språkväxlarna (2026-10-17).
 * Engelska är orörd. Sparat 'uk' eller ?lang=uk faller tillbaka till engelska.
 * Översättningarna ligger kvar i koden. Laddas synkront i <head> före appens bundle. */
(function () {
  /* Appens (Vite-bundlens) växel renderar UA som <button class="lang-switcher-btn" lang="uk">. Döljs med CSS i stället för att patcha bundlen. */
  try {
    var st = document.createElement('style')
    st.textContent = '.lang-switcher-btn[lang="uk"],.lang-switcher-btn[data-lang="uk"]{display:none!important}'
    document.head.appendChild(st)
  } catch (e) {}
  try {
    if (localStorage.getItem('app.language') === 'uk') localStorage.setItem('app.language', 'en')
    if (localStorage.getItem('ig.app.language') === '"uk"') localStorage.setItem('ig.app.language', '"en"')
  } catch (e) {}
  try {
    var u = new URL(location.href)
    if (u.searchParams.get('lang') === 'uk') {
      u.searchParams.set('lang', 'en')
      history.replaceState(history.state, '', u.pathname + u.search + u.hash)
    }
  } catch (e) {}
})()
