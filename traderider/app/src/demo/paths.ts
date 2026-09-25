/** Public path of this demo, respecting the Vite base (GitHub Pages: `/traderider/demo/`). */
export function demoPath(suffix = ''): string {
  const base = import.meta.env.BASE_URL || '/traderider/demo/'
  const tail = suffix.replace(/^\//, '')
  if (!tail) return base
  return `${base}${tail}`
}
