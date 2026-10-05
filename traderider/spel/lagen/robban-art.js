/**
 * Egen figur av Robban Robotsson. Ingen lånat bild, inget varumärke.
 * Looken följer den etablerade: vitt skal, guldantenn, cyanvisir, blå ryggsäck.
 */

const SHELL = '#f4f7fb'
const SHELL_SHADE = '#d5deea'
const GOLD = '#f5b942'
const GOLD_DEEP = '#e09a1a'
const CYAN = '#22d3ee'
const VISOR = '#0ea5e9'
const INK = '#0f172a'
const PACK = '#2563eb'
const PACK_DARK = '#1d4ed8'

/** Helkropp, från antenn till fötter. viewBox lämnar inget utanför. */
export function robbanSvg() {
  return `<svg data-robban-body="full" viewBox="0 0 80 168" role="img" preserveAspectRatio="xMidYMax meet">
    <g data-part="antenna">
      <line x1="40" y1="18" x2="40" y2="6" stroke="${GOLD_DEEP}" stroke-width="2" stroke-linecap="round"/>
      <circle cx="40" cy="5" r="3.2" fill="${GOLD}"/>
    </g>
    <g data-part="head">
      <rect x="22" y="18" width="36" height="30" rx="10" fill="${SHELL}" stroke="${INK}" stroke-width="2"/>
      <rect x="26" y="26" width="28" height="12" rx="6" fill="${VISOR}"/>
      <rect x="28" y="28" width="16" height="4" rx="2" fill="${CYAN}"/>
      <circle cx="50" cy="32" r="1.4" fill="${SHELL}"/>
      <path d="M32 40 q8 5 16 0" fill="none" stroke="${INK}" stroke-width="1.6" stroke-linecap="round"/>
    </g>
    <g data-part="torso">
      <rect x="24" y="50" width="32" height="40" rx="8" fill="${SHELL}" stroke="${INK}" stroke-width="2"/>
      <rect x="34" y="58" width="12" height="16" rx="3" fill="${CYAN}" opacity="0.85"/>
      <rect x="52" y="54" width="12" height="22" rx="4" fill="${PACK}" stroke="${PACK_DARK}" stroke-width="1.5"/>
      <rect x="54" y="58" width="8" height="4" rx="1" fill="${GOLD}"/>
    </g>
    <g data-part="arms">
      <rect x="8" y="54" width="14" height="10" rx="5" fill="${SHELL_SHADE}" stroke="${INK}" stroke-width="1.6"/>
      <rect x="58" y="78" width="14" height="10" rx="5" fill="${SHELL_SHADE}" stroke="${INK}" stroke-width="1.6"/>
      <circle cx="12" cy="66" r="4" fill="${GOLD}"/>
      <circle cx="68" cy="90" r="4" fill="${GOLD}"/>
    </g>
    <g data-part="legs">
      <rect x="26" y="92" width="12" height="36" rx="5" fill="${SHELL_SHADE}" stroke="${INK}" stroke-width="1.6"/>
      <rect x="42" y="92" width="12" height="36" rx="5" fill="${SHELL_SHADE}" stroke="${INK}" stroke-width="1.6"/>
      <rect x="24" y="124" width="16" height="8" rx="3" fill="${INK}"/>
      <rect x="40" y="124" width="16" height="8" rx="3" fill="${INK}"/>
    </g>
  </svg>`
}

/** Liten egen farkost på kurslinjen. x,y är hjulens marklinje. */
export function drawRobbanCraft(ctx, x, y, t) {
  if (!ctx) return
  const spin = Number.isFinite(t) ? t : 0
  ctx.save()
  ctx.translate(x, y)
  ctx.scale(1.55, 1.55)
  ctx.fillStyle = 'rgba(15,23,42,0.28)'
  ctx.beginPath()
  ctx.ellipse(0, 6, 18, 3.2, 0, 0, Math.PI * 2)
  ctx.fill()
  ctx.strokeStyle = INK
  ctx.lineWidth = 2
  ctx.beginPath()
  ctx.moveTo(-12, -2)
  ctx.lineTo(12, -2)
  ctx.stroke()
  for (const wx of [-11, 11]) {
    ctx.beginPath()
    ctx.arc(wx, 0, 5.5, 0, Math.PI * 2)
    ctx.fillStyle = INK
    ctx.fill()
    ctx.beginPath()
    ctx.arc(wx, 0, 2.2, spin, spin + Math.PI * 0.7)
    ctx.strokeStyle = GOLD
    ctx.lineWidth = 1.5
    ctx.stroke()
  }
  ctx.fillStyle = PACK
  ctx.fillRect(-16, -10, 32, 7)
  ctx.fillStyle = SHELL
  ctx.strokeStyle = INK
  ctx.lineWidth = 1.4
  ctx.beginPath()
  ctx.roundRect(-8, -26, 16, 16, 4)
  ctx.fill()
  ctx.stroke()
  ctx.fillStyle = VISOR
  ctx.fillRect(-5, -22, 10, 4)
  ctx.fillStyle = CYAN
  ctx.fillRect(-4, -21, 6, 2)
  ctx.strokeStyle = GOLD_DEEP
  ctx.beginPath()
  ctx.moveTo(0, -26)
  ctx.lineTo(0, -32)
  ctx.stroke()
  ctx.fillStyle = GOLD
  ctx.beginPath()
  ctx.arc(0, -33, 2.1, 0, Math.PI * 2)
  ctx.fill()
  ctx.restore()
}
