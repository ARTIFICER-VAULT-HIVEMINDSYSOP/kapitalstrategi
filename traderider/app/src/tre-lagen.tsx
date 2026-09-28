import { createRoot } from 'react-dom/client'
import { PRACTICE_ROUTES } from './modes/ModeShell'

const root = document.getElementById('root')
if (!root) throw new Error('missing root')
createRoot(root).render(
  <main style={{ padding: 24, fontFamily: 'IBM Plex Sans, sans-serif' }}>
    <p>Övningsläge med historiska kurser. Inga riktiga pengar. Ingen rådgivning.</p>
    <ul>
      {PRACTICE_ROUTES.map((href) => (
        <li key={href}>
          <a href={href}>{href}</a>
        </li>
      ))}
    </ul>
  </main>,
)
